/**
 * Subprocess helper for `journey-http-restart.integration.test.js` (fresh Node = fresh module graph).
 */

import request from 'supertest';

const token = process.env.AURA_RESTART_TEST_TOKEN;
const phase = process.env.AURA_RESTART_PHASE;
const indexHref = new URL('../src/index.js', import.meta.url).href;

const { app } = await import(indexHref);

if (phase === 'create') {
  const res = await request(app).post('/v1/journeys').set('Authorization', `Bearer ${token}`).send({});
  if (res.status !== 201 || !res.body?.data?.journeyId) {
    process.stderr.write(`${res.status} ${JSON.stringify(res.body)}\n`);
    process.exit(1);
  }
  process.stdout.write(res.body.data.journeyId);
} else if (phase === 'location-share') {
  const journeyId = process.argv[2];
  if (!journeyId) {
    process.stderr.write('missing journey id\n');
    process.exit(1);
  }
  const res = await request(app)
    .post(`/v1/journeys/${journeyId}/location-shares`)
    .set('Authorization', `Bearer ${token}`)
    .send({});
  if (res.status !== 201) {
    process.stderr.write(`${res.status} ${JSON.stringify(res.body)}\n`);
    process.exit(1);
  }
  process.stdout.write('ok');
} else if (phase === 'im-safe') {
  const journeyId = process.argv[2];
  if (!journeyId) {
    process.stderr.write('missing journey id\n');
    process.exit(1);
  }
  const res = await request(app)
    .post(`/v1/journeys/${journeyId}/im-safe`)
    .set('Authorization', `Bearer ${token}`)
    .send({});
  if (res.status !== 201) {
    process.stderr.write(`${res.status} ${JSON.stringify(res.body)}\n`);
    process.exit(1);
  }
  process.stdout.write('ok');
} else {
  process.stderr.write(`unknown phase ${phase}\n`);
  process.exit(1);
}
