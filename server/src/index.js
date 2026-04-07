/**
 * Aura authoritative API — validation, auth, rate limits, append-only audit trail.
 * Env: AURA_API_BEARER_TOKEN (required), PORT (default 8787), AUDIT_LOG_PATH, CORS_ORIGIN
 */

import cors from 'cors';
import express from 'express';
import rateLimit from 'express-rate-limit';
import fs from 'node:fs';
import path from 'node:path';
import { createHash, randomUUID } from 'node:crypto';
import { z } from 'zod';

const PORT = Number(process.env.PORT || 8787);
const BEARER = process.env.AURA_API_BEARER_TOKEN;
const AUDIT_LOG_PATH = process.env.AUDIT_LOG_PATH || path.join(process.cwd(), 'data', 'audit.log');
const CORS_ORIGIN = process.env.CORS_ORIGIN || '*';

const uuidSchema = z.string().uuid();

const emergencyBodySchema = z.object({
  mode: z.enum(['silent', 'visible']),
});

const emptyBodySchema = z.object({}).strict();

const locationShareBodySchema = z
  .object({
    latitude: z.number().finite().gte(-90).lte(90).optional(),
    longitude: z.number().finite().gte(-180).lte(180).optional(),
    accuracyM: z.number().finite().nonnegative().optional(),
    recordedAt: z.string().max(64).optional(),
  })
  .strict()
  .refine(
    (b) => (b.latitude === undefined) === (b.longitude === undefined),
    { message: 'latitude and longitude must both be provided or both omitted' },
  );

function actorKey(req) {
  const raw = req.headers.authorization || '';
  const token = raw.startsWith('Bearer ') ? raw.slice(7) : '';
  return createHash('sha256').update(token || req.ip || 'unknown').digest('hex').slice(0, 16);
}

/** In-memory burst detector: anomaly signal only (still allows request if under hard rate limit). */
const sosRecent = new Map();
const SOS_BURST_WINDOW_MS = 10 * 60 * 1000;
const SOS_BURST_THRESHOLD = 3;

function sosAnomalyFlags(actor) {
  const now = Date.now();
  const prev = sosRecent.get(actor) || [];
  const windowed = prev.filter((t) => now - t < SOS_BURST_WINDOW_MS);
  windowed.push(now);
  sosRecent.set(actor, windowed);
  return windowed.length >= SOS_BURST_THRESHOLD ? ['burst_sos'] : [];
}

/** In-memory burst detector for location-share abuse signals. */
const shareRecent = new Map();
const SHARE_BURST_WINDOW_MS = 10 * 60 * 1000;
const SHARE_BURST_THRESHOLD = 12;

function shareAnomalyFlags(actor) {
  const now = Date.now();
  const prev = shareRecent.get(actor) || [];
  const windowed = prev.filter((t) => now - t < SHARE_BURST_WINDOW_MS);
  windowed.push(now);
  shareRecent.set(actor, windowed);
  return windowed.length >= SHARE_BURST_THRESHOLD ? ['burst_location_share'] : [];
}

function auditRateLimited(route, req) {
  appendAudit({
    ts: new Date().toISOString(),
    type: 'audit.rate_limited',
    route,
    actorHash: actorKey(req),
    ip: req.ip,
  });
}

function ensureAuditDir() {
  const dir = path.dirname(AUDIT_LOG_PATH);
  fs.mkdirSync(dir, { recursive: true });
}

function appendAudit(entry) {
  ensureAuditDir();
  const line = JSON.stringify(entry) + '\n';
  fs.appendFileSync(AUDIT_LOG_PATH, line, { encoding: 'utf8' });
}

function requireBearer(req, res, next) {
  if (!BEARER) {
    res.status(503).json({ ok: false, error: 'server_misconfigured', detail: 'AURA_API_BEARER_TOKEN not set' });
    return;
  }
  const h = req.headers.authorization;
  if (!h || !h.startsWith('Bearer ')) {
    res.status(401).json({ ok: false, error: 'unauthorized' });
    return;
  }
  if (h.slice(7) !== BEARER) {
    res.status(403).json({ ok: false, error: 'forbidden' });
    return;
  }
  next();
}

const globalLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 120,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => `${req.ip}:${actorKey(req)}`,
});

const journeyLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 40,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => `${req.ip}:${actorKey(req)}`,
});

const sosLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 8,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => `${req.ip}:${actorKey(req)}`,
  message: { ok: false, error: 'rate_limited', detail: 'Too many emergency alerts; try again later.' },
  handler: (req, res, _next, options) => {
    auditRateLimited('emergency-alerts', req);
    res.status(options.statusCode).json(options.message);
  },
});

/** Hourly cap on location shares (layered under journey + global limits). */
const shareLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 48,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => `${req.ip}:${actorKey(req)}`,
  message: { ok: false, error: 'rate_limited', detail: 'Too many location shares; try again later.' },
  handler: (req, res, _next, options) => {
    auditRateLimited('location-shares', req);
    res.status(options.statusCode).json(options.message);
  },
});

const app = express();
app.set('trust proxy', 1);
app.use(
  cors({
    origin: CORS_ORIGIN === '*' ? true : CORS_ORIGIN.split(',').map((s) => s.trim()),
    methods: ['POST', 'GET', 'OPTIONS'],
    allowedHeaders: ['Authorization', 'Content-Type', 'X-Aura-Device-Fingerprint'],
    exposedHeaders: ['X-Aura-Anomaly'],
  }),
);
app.use(express.json({ limit: '24kb' }));

app.get('/health', (_req, res) => {
  res.json({ ok: true, service: 'aura-api' });
});

app.post('/v1/emergency-alerts', globalLimiter, requireBearer, sosLimiter, (req, res) => {
  const parsed = emergencyBodySchema.safeParse(req.body);
  if (!parsed.success) {
    appendAudit({
      ts: new Date().toISOString(),
      type: 'audit.validation_failed',
      route: 'emergency-alerts',
      actorHash: actorKey(req),
      ip: req.ip,
      issues: parsed.error.flatten(),
    });
    res.status(400).json({ ok: false, error: 'validation_failed', detail: parsed.error.flatten() });
    return;
  }
  const { mode } = parsed.data;
  const alertId = randomUUID();
  const anomalyFlags = sosAnomalyFlags(actorKey(req));
  const entry = {
    ts: new Date().toISOString(),
    type: 'sos.alert_created',
    alertId,
    mode,
    actorHash: actorKey(req),
    ip: req.ip,
    deviceFingerprint: typeof req.headers['x-aura-device-fingerprint'] === 'string'
      ? createHash('sha256')
          .update(req.headers['x-aura-device-fingerprint'])
          .digest('hex')
          .slice(0, 16)
      : null,
    anomalyFlags,
    consentModel: 'trusted_contacts_local_only',
  };
  appendAudit(entry);
  if (anomalyFlags.length) {
    res.setHeader('X-Aura-Anomaly', anomalyFlags.join(','));
  }
  res.status(201).json({ ok: true, data: { alertId } });
});

app.post(
  '/v1/journeys/:journeyId/location-shares',
  globalLimiter,
  journeyLimiter,
  requireBearer,
  shareLimiter,
  (req, res) => {
    const jid = uuidSchema.safeParse(req.params.journeyId);
    if (!jid.success) {
      appendAudit({
        ts: new Date().toISOString(),
        type: 'audit.validation_failed',
        route: 'location-shares',
        actorHash: actorKey(req),
        ip: req.ip,
        journeyId: req.params.journeyId,
      });
      res.status(400).json({ ok: false, error: 'invalid_journey_id' });
      return;
    }
    const bodyParsed = locationShareBodySchema.safeParse(req.body ?? {});
    if (!bodyParsed.success) {
      appendAudit({
        ts: new Date().toISOString(),
        type: 'audit.validation_failed',
        route: 'location-shares',
        actorHash: actorKey(req),
        ip: req.ip,
        journeyId: jid.data,
        issues: bodyParsed.error.flatten(),
      });
      res.status(400).json({ ok: false, error: 'validation_failed', detail: bodyParsed.error.flatten() });
      return;
    }
    const shareId = randomUUID();
    const anomalyFlags = shareAnomalyFlags(actorKey(req));
    const payload = bodyParsed.data;
    const hasCoords = payload.latitude !== undefined && payload.longitude !== undefined;
    appendAudit({
      ts: new Date().toISOString(),
      type: 'journey.location_share',
      shareId,
      journeyId: jid.data,
      actorHash: actorKey(req),
      ip: req.ip,
      deviceFingerprint: typeof req.headers['x-aura-device-fingerprint'] === 'string'
        ? createHash('sha256')
            .update(req.headers['x-aura-device-fingerprint'])
            .digest('hex')
            .slice(0, 16)
        : null,
      ...(hasCoords
        ? {
            latitude: payload.latitude,
            longitude: payload.longitude,
            accuracyM: payload.accuracyM ?? null,
            recordedAt: payload.recordedAt ?? null,
          }
        : {}),
      anomalyFlags,
      consentModel: 'trusted_contacts_local_only',
    });
    if (anomalyFlags.length) {
      res.setHeader('X-Aura-Anomaly', anomalyFlags.join(','));
    }
    res.status(201).json({ ok: true, data: { shareId } });
  },
);

app.post('/v1/journeys/:journeyId/im-safe', globalLimiter, journeyLimiter, requireBearer, (req, res) => {
  const jid = uuidSchema.safeParse(req.params.journeyId);
  if (!jid.success) {
    appendAudit({
      ts: new Date().toISOString(),
      type: 'audit.validation_failed',
      route: 'im-safe',
      actorHash: actorKey(req),
      ip: req.ip,
      journeyId: req.params.journeyId,
    });
    res.status(400).json({ ok: false, error: 'invalid_journey_id' });
    return;
  }
  const bodyParsed = emptyBodySchema.safeParse(req.body ?? {});
  if (!bodyParsed.success) {
    appendAudit({
      ts: new Date().toISOString(),
      type: 'audit.validation_failed',
      route: 'im-safe',
      actorHash: actorKey(req),
      ip: req.ip,
      journeyId: jid.data,
      issues: bodyParsed.error.flatten(),
    });
    res.status(400).json({ ok: false, error: 'validation_failed', detail: bodyParsed.error.flatten() });
    return;
  }
  const receivedAt = new Date().toISOString();
  appendAudit({
    ts: receivedAt,
    type: 'journey.im_safe',
    journeyId: jid.data,
    actorHash: actorKey(req),
    ip: req.ip,
  });
  res.status(201).json({ ok: true, data: { receivedAt } });
});

app.use((_req, res) => {
  res.status(404).json({ ok: false, error: 'not_found' });
});

if (!process.env.AURA_API_SKIP_LISTEN) {
  app.listen(PORT, () => {
    process.stdout.write(`aura-api listening on :${PORT} audit=${AUDIT_LOG_PATH}\n`);
  });
}

export { app };
