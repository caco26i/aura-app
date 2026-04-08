/**
 * Subprocess body: load API with AURA_API_PROMETHEUS_METRICS enabled (avoids ESM module cache vs other tests).
 */

import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import request from 'supertest';

const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'aura-prom-metrics-'));
const auditPath = path.join(tmpDir, 'audit.log');

process.env.AURA_API_PROMETHEUS_METRICS = '1';
process.env.AURA_API_BEARER_TOKEN = 'prometheus-phase-bearer';
process.env.AURA_API_SKIP_LISTEN = '1';
process.env.AUDIT_LOG_PATH = auditPath;
process.env.AURA_API_JOURNEY_STORE = 'memory';
delete process.env.AURA_API_BFF_JWT_SECRET;
delete process.env.AURA_API_BEARER_TOKEN_ALT;

const { app } = await import('../src/index.js');

try {
  const first = await request(app).get('/metrics').expect(200);
  const ct = String(first.headers['content-type'] || '');
  if (!ct.includes('text/plain')) {
    process.stderr.write(`unexpected content-type: ${ct}\n`);
    process.exit(1);
  }
  const body1 = first.text;
  if (!body1.includes('# HELP') || !body1.includes('process_cpu_user_seconds_total')) {
    process.stderr.write('expected default process metrics in exposition\n');
    process.exit(1);
  }
  if (!body1.includes('http_requests_total')) {
    process.stderr.write('expected http_requests_total in exposition\n');
    process.exit(1);
  }

  await request(app).get('/health').expect(200);

  const second = await request(app).get('/metrics').expect(200);
  if (!second.text.includes('http_requests_total{method="GET",status_code="200",route="/health"}')) {
    process.stderr.write('expected labeled request counter after /health scrape\n');
    process.stderr.write(second.text.slice(0, 800));
    process.stderr.write('\n');
    process.exit(1);
  }

  process.stdout.write('ok\n');
} finally {
  fs.rmSync(tmpDir, { recursive: true, force: true });
}
