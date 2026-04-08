/**
 * Append-only NDJSON audit log: single open file descriptor, optional SIGUSR2 reopen
 * after logrotate-style rename + recreate at the same path.
 */

import fs from 'node:fs';
import path from 'node:path';

/**
 * @param {object} [opts]
 * @param {() => string} [opts.getLogPath] Resolves current log file path (read each time for env updates / reopen).
 */
export function createAuditWriter(opts = {}) {
  const getLogPath =
    opts.getLogPath ||
    (() => process.env.AUDIT_LOG_PATH || path.join(process.cwd(), 'data', 'audit.log'));

  /** @type {number | null} */
  let fd = null;
  /** @type {string | null} */
  let openPath = null;

  function ensureDirFor(filePath) {
    fs.mkdirSync(path.dirname(filePath), { recursive: true });
  }

  function closeFd() {
    if (fd === null) return;
    try {
      fs.closeSync(fd);
    } catch {
      // fd may already be invalid after external rotation; ignore
    }
    fd = null;
    openPath = null;
  }

  /**
   * Close the current descriptor and open `getLogPath()` again.
   * Use after logrotate moves the old file away and creates a new inode at the same path.
   */
  function reopenAuditLog() {
    const nextPath = getLogPath();
    closeFd();
    ensureDirFor(nextPath);
    fd = fs.openSync(nextPath, 'a', 0o644);
    openPath = nextPath;
  }

  /**
   * @param {string} lineUtf8 Full line including trailing newline
   */
  function appendLine(lineUtf8) {
    const p = getLogPath();
    if (fd === null || p !== openPath) {
      closeFd();
      ensureDirFor(p);
      fd = fs.openSync(p, 'a', 0o644);
      openPath = p;
    }
    fs.writeSync(fd, lineUtf8, null, 'utf8');
  }

  /**
   * @param {Record<string, unknown>} entry
   */
  function appendJson(entry) {
    appendLine(JSON.stringify(entry) + '\n');
  }

  return {
    getLogPath,
    appendLine,
    appendJson,
    reopenAuditLog,
  };
}

/**
 * @param {() => void} reopenAuditLog
 */
export function installAuditLogReopenOnUsr2(reopenAuditLog) {
  if (process.platform === 'win32') {
    return;
  }
  process.on('SIGUSR2', () => {
    reopenAuditLog();
  });
}
