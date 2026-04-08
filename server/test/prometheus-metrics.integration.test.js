/**
 * Optional Prometheus /metrics (enabled only when AURA_API_PROMETHEUS_METRICS is set at process start).
 */

import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, test } from 'node:test';

const phaseScript = fileURLToPath(new URL('./prometheus-metrics-phase.mjs', import.meta.url));

describe('Prometheus /metrics (opt-in)', () => {
  test('with AURA_API_PROMETHEUS_METRICS=1: GET /metrics returns Prometheus text and counts requests', () => {
    const r = spawnSync(process.execPath, [phaseScript], {
      encoding: 'utf8',
      cwd: path.dirname(phaseScript),
    });
    if (r.status !== 0) {
      assert.fail(`prometheus phase failed: ${r.stderr || r.stdout}`);
    }
    assert.equal(r.stdout.trim(), 'ok');
  });
});
