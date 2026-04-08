/**
 * Restart continuity: journey ownership must load from disk after process-style reopen.
 */

import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { after, describe, test } from 'node:test';
import {
  createJsonlJourneyRegistry,
  createJourneyRegistry,
  createSqliteJourneyRegistry,
} from '../src/journeyRegistry.js';

describe('journey registry restart continuity', () => {
  const tmpDirs = [];

  after(() => {
    for (const d of tmpDirs) {
      fs.rmSync(d, { recursive: true, force: true });
    }
  });

  function mkTmp() {
    const d = fs.mkdtempSync(path.join(os.tmpdir(), 'aura-journey-reg-'));
    tmpDirs.push(d);
    return d;
  }

  test('SQLite: close and reopen restores getOwner', () => {
    const dir = mkTmp();
    const dbPath = path.join(dir, 'j.db');
    const jid = '11111111-1111-4111-8111-111111111111';
    const owner = 'deadbeefdeadbe';

    const a = createSqliteJourneyRegistry(dbPath);
    assert.equal(a.backend, 'sqlite');
    a.register(jid, owner);
    a.close();

    const b = createSqliteJourneyRegistry(dbPath);
    assert.equal(b.getOwner(jid), owner);
    b.close();
  });

  test('JSONL: close and reopen restores getOwner', () => {
    const dir = mkTmp();
    const jsonlPath = path.join(dir, 'j.jsonl');
    const jid = '22222222-2222-4222-8222-222222222222';
    const owner = 'cafebabecafeba';

    const a = createJsonlJourneyRegistry(jsonlPath);
    assert.equal(a.backend, 'jsonl');
    a.register(jid, owner);
    a.close();

    const b = createJsonlJourneyRegistry(jsonlPath);
    assert.equal(b.getOwner(jid), owner);
    b.close();
  });

  test('createJourneyRegistry auto uses SQLite when available', () => {
    const dir = mkTmp();
    const sqlitePath = path.join(dir, 'auto.sqlite');
    const jsonlPath = path.join(dir, 'auto.jsonl');
    const prev = process.env.AURA_API_JOURNEY_STORE;
    const prevB = process.env.AURA_API_JOURNEY_BACKEND;
    delete process.env.AURA_API_JOURNEY_STORE;
    delete process.env.AURA_API_JOURNEY_BACKEND;
    try {
      const r = createJourneyRegistry({ sqlitePath, jsonlPath });
      assert.equal(r.backend, 'sqlite');
      const jid = '33333333-3333-4333-8333-333333333333';
      r.register(jid, 'abc');
      r.close();
      const r2 = createJourneyRegistry({ sqlitePath, jsonlPath });
      assert.equal(r2.getOwner(jid), 'abc');
      r2.close();
    } finally {
      if (prev === undefined) {
        delete process.env.AURA_API_JOURNEY_STORE;
      } else {
        process.env.AURA_API_JOURNEY_STORE = prev;
      }
      if (prevB === undefined) {
        delete process.env.AURA_API_JOURNEY_BACKEND;
      } else {
        process.env.AURA_API_JOURNEY_BACKEND = prevB;
      }
    }
  });

  test('createJourneyRegistry respects AURA_API_JOURNEY_STORE=jsonl', () => {
    const dir = mkTmp();
    const sqlitePath = path.join(dir, 'ignored.sqlite');
    const jsonlPath = path.join(dir, 'forced.jsonl');
    const prev = process.env.AURA_API_JOURNEY_STORE;
    process.env.AURA_API_JOURNEY_STORE = 'jsonl';
    try {
      const r = createJourneyRegistry({ sqlitePath, jsonlPath });
      assert.equal(r.backend, 'jsonl');
      const jid = '44444444-4444-4444-8444-444444444444';
      r.register(jid, 'xyz');
      r.close();
      const r2 = createJourneyRegistry({ sqlitePath, jsonlPath });
      assert.equal(r2.getOwner(jid), 'xyz');
      r2.close();
    } finally {
      if (prev === undefined) {
        delete process.env.AURA_API_JOURNEY_STORE;
      } else {
        process.env.AURA_API_JOURNEY_STORE = prev;
      }
    }
  });
});
