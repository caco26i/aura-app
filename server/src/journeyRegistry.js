/**
 * Durable journey ownership registry: SQLite (WAL) primary, append-only JSONL fallback, optional in-memory (tests).
 * @typedef {{ backend: 'sqlite' | 'jsonl' | 'memory'; register: (journeyId: string, ownerActorKey: string) => void; getOwner: (journeyId: string) => string | undefined; close: () => void }} JourneyRegistry
 */

import Database from 'better-sqlite3';
import fs from 'node:fs';
import path from 'node:path';

/**
 * @returns {JourneyRegistry}
 */
export function createMemoryJourneyRegistry() {
  const owners = new Map();
  return {
    backend: 'memory',
    register(journeyId, ownerActorKey) {
      owners.set(journeyId, ownerActorKey);
    },
    getOwner(journeyId) {
      return owners.get(journeyId);
    },
    close() {},
  };
}

/**
 * @param {string} dbPath
 * @returns {JourneyRegistry}
 */
export function createSqliteJourneyRegistry(dbPath) {
  const dir = path.dirname(dbPath);
  fs.mkdirSync(dir, { recursive: true });
  const db = new Database(dbPath);
  db.pragma('journal_mode = WAL');
  db.exec(`
    CREATE TABLE IF NOT EXISTS aura_journeys (
      journey_id TEXT PRIMARY KEY NOT NULL,
      owner_actor_key TEXT NOT NULL,
      created_at TEXT NOT NULL
    );
  `);
  const insert = db.prepare(
    'INSERT INTO aura_journeys (journey_id, owner_actor_key, created_at) VALUES (?, ?, ?)',
  );
  const select = db.prepare('SELECT owner_actor_key FROM aura_journeys WHERE journey_id = ?');

  return {
    backend: 'sqlite',
    register(journeyId, ownerActorKey) {
      insert.run(journeyId, ownerActorKey, new Date().toISOString());
    },
    getOwner(journeyId) {
      const row = select.get(journeyId);
      return row ? String(row.owner_actor_key) : undefined;
    },
    close() {
      db.close();
    },
  };
}

/**
 * Loads all journey rows from JSONL (last line wins per journey id).
 * @param {string} jsonlPath
 * @returns {Map<string, string>}
 */
function loadJsonlOwners(jsonlPath) {
  const owners = new Map();
  if (!fs.existsSync(jsonlPath)) {
    return owners;
  }
  const raw = fs.readFileSync(jsonlPath, 'utf8');
  for (const line of raw.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    try {
      const o = JSON.parse(trimmed);
      if (typeof o.journeyId === 'string' && typeof o.ownerActorKey === 'string') {
        owners.set(o.journeyId, o.ownerActorKey);
      }
    } catch {
      /* skip corrupt lines */
    }
  }
  return owners;
}

/**
 * @param {string} jsonlPath
 * @returns {JourneyRegistry}
 */
export function createJsonlJourneyRegistry(jsonlPath) {
  const dir = path.dirname(jsonlPath);
  fs.mkdirSync(dir, { recursive: true });
  const owners = loadJsonlOwners(jsonlPath);

  return {
    backend: 'jsonl',
    register(journeyId, ownerActorKey) {
      owners.set(journeyId, ownerActorKey);
      const rec = {
        journeyId,
        ownerActorKey,
        ts: new Date().toISOString(),
      };
      const line = `${JSON.stringify(rec)}\n`;
      const fd = fs.openSync(jsonlPath, 'a');
      try {
        fs.writeSync(fd, line);
        fs.fsyncSync(fd);
      } finally {
        fs.closeSync(fd);
      }
    },
    getOwner(journeyId) {
      return owners.get(journeyId);
    },
    close() {},
  };
}

/**
 * @param {{ sqlitePath: string; jsonlPath: string; backend?: 'auto' | 'sqlite' | 'jsonl' | 'memory' }} opts
 * @returns {JourneyRegistry}
 */
export function createJourneyRegistry(opts) {
  const mode =
    opts.backend ??
    process.env.AURA_API_JOURNEY_STORE ??
    process.env.AURA_API_JOURNEY_BACKEND ??
    'auto';

  if (mode === 'memory') {
    return createMemoryJourneyRegistry();
  }
  if (mode === 'jsonl') {
    return createJsonlJourneyRegistry(opts.jsonlPath);
  }
  if (mode === 'sqlite') {
    return createSqliteJourneyRegistry(opts.sqlitePath);
  }

  try {
    return createSqliteJourneyRegistry(opts.sqlitePath);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    process.stderr.write(`[aura-api] journey store: SQLite unavailable, using JSONL fallback (${msg})\n`);
    return createJsonlJourneyRegistry(opts.jsonlPath);
  }
}
