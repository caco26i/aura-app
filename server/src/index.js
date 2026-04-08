/**
 * Aura authoritative API — validation, auth, rate limits, append-only audit trail.
 * Env: AURA_API_BEARER_TOKEN and/or AURA_API_BFF_JWT_SECRET, AURA_API_BEARER_TOKEN_ALT, PORT, AUDIT_LOG_PATH, CORS_ORIGIN, AURA_API_JSON_BODY_LIMIT
 */

import cors from 'cors';
import express from 'express';
import rateLimit from 'express-rate-limit';
import fs from 'node:fs';
import path from 'node:path';
import { createHash, createHmac, randomUUID, timingSafeEqual } from 'node:crypto';
import { z } from 'zod';

const PORT = Number(process.env.PORT || 8787);
const BEARER = process.env.AURA_API_BEARER_TOKEN;
/** Optional second beta token (staging / integration tests) — distinct actor key from primary bearer. */
const BEARER_ALT = process.env.AURA_API_BEARER_TOKEN_ALT || '';
/** HS256 secret for BFF-issued access tokens (`sub` = stable user id). When set, three-segment Bearer tokens are verified as JWTs first. */
const BFF_JWT_SECRET = process.env.AURA_API_BFF_JWT_SECRET || '';
const BFF_JWT_ISSUER = process.env.AURA_API_BFF_JWT_ISSUER || '';
const BFF_JWT_AUDIENCE = process.env.AURA_API_BFF_JWT_AUDIENCE || '';
const JSON_BODY_LIMIT = process.env.AURA_API_JSON_BODY_LIMIT || '24kb';
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
  if (req.auraActorKey) {
    return req.auraActorKey;
  }
  const raw = req.headers.authorization || '';
  const token = raw.startsWith('Bearer ') ? raw.slice(7) : '';
  return createHash('sha256').update(token || req.ip || 'unknown').digest('hex').slice(0, 16);
}

function looksLikeJwt(token) {
  return token.split('.').length === 3;
}

/** @returns {Record<string, unknown> | null} */
function verifyBffJwt(token) {
  if (!BFF_JWT_SECRET || !looksLikeJwt(token)) {
    return null;
  }
  const parts = token.split('.');
  const [h64, p64, s64] = parts;
  let header;
  try {
    header = JSON.parse(Buffer.from(h64, 'base64url').toString('utf8'));
  } catch {
    return null;
  }
  if (header.alg !== 'HS256') {
    return null;
  }
  const signingInput = `${h64}.${p64}`;
  const expectedSig = createHmac('sha256', BFF_JWT_SECRET).update(signingInput).digest();
  let gotSig;
  try {
    gotSig = Buffer.from(s64, 'base64url');
  } catch {
    return null;
  }
  if (expectedSig.length !== gotSig.length || !timingSafeEqual(expectedSig, gotSig)) {
    return null;
  }
  let payload;
  try {
    payload = JSON.parse(Buffer.from(p64, 'base64url').toString('utf8'));
  } catch {
    return null;
  }
  if (typeof payload.sub !== 'string' || !payload.sub) {
    return null;
  }
  const now = Math.floor(Date.now() / 1000);
  if (payload.exp !== undefined && typeof payload.exp === 'number' && payload.exp < now) {
    return null;
  }
  if (BFF_JWT_ISSUER && payload.iss !== BFF_JWT_ISSUER) {
    return null;
  }
  if (BFF_JWT_AUDIENCE) {
    const audOk =
      payload.aud === BFF_JWT_AUDIENCE ||
      (Array.isArray(payload.aud) && payload.aud.includes(BFF_JWT_AUDIENCE));
    if (!audOk) {
      return null;
    }
  }
  return payload;
}

function actorKeyFromJwtSub(sub) {
  return createHash('sha256').update(`jwt|${sub}`).digest('hex').slice(0, 16);
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

/** Server-side journey registry: journey UUID → owner actor key (bearer hash today; per-user token when OAuth ships). */
const journeyOwners = new Map();

function journeyOwnerOrRespond(journeyIdUuid, req, res, route) {
  const owner = actorKey(req);
  const registered = journeyOwners.get(journeyIdUuid);
  if (!registered) {
    appendAudit({
      ts: new Date().toISOString(),
      type: 'audit.journey_not_found',
      route,
      journeyId: journeyIdUuid,
      actorHash: owner,
      ip: req.ip,
    });
    res.status(404).json({ ok: false, error: 'journey_not_found' });
    return false;
  }
  if (registered !== owner) {
    appendAudit({
      ts: new Date().toISOString(),
      type: 'audit.journey_forbidden',
      route,
      journeyId: journeyIdUuid,
      actorHash: owner,
      ip: req.ip,
    });
    res.status(403).json({ ok: false, error: 'journey_forbidden' });
    return false;
  }
  return true;
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

/** Verifies auth is configured and audit log directory is writable (for load balancers / orchestration readiness). */
function readinessResult() {
  if (!BEARER && !BFF_JWT_SECRET) {
    return { ok: false, detail: 'Set AURA_API_BEARER_TOKEN and/or AURA_API_BFF_JWT_SECRET' };
  }
  try {
    ensureAuditDir();
    const probe = path.join(path.dirname(AUDIT_LOG_PATH), `.aura-ready-probe-${process.pid}`);
    fs.writeFileSync(probe, '', { flag: 'w' });
    fs.unlinkSync(probe);
    return { ok: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return { ok: false, detail: 'audit_log_path_not_writable', message };
  }
}

function appendAudit(entry) {
  ensureAuditDir();
  const line = JSON.stringify(entry) + '\n';
  fs.appendFileSync(AUDIT_LOG_PATH, line, { encoding: 'utf8' });
}

function bearerAccepted(rawToken) {
  return (!!BEARER && rawToken === BEARER) || (!!BEARER_ALT && rawToken === BEARER_ALT);
}

function requireAuth(req, res, next) {
  if (!BEARER && !BFF_JWT_SECRET) {
    res.status(503).json({
      ok: false,
      error: 'server_misconfigured',
      detail: 'Set AURA_API_BEARER_TOKEN and/or AURA_API_BFF_JWT_SECRET',
    });
    return;
  }
  const h = req.headers.authorization;
  if (!h || !h.startsWith('Bearer ')) {
    res.status(401).json({ ok: false, error: 'unauthorized' });
    return;
  }
  const raw = h.slice(7);
  if (BFF_JWT_SECRET && looksLikeJwt(raw)) {
    const jwtPayload = verifyBffJwt(raw);
    if (jwtPayload) {
      req.auraActorKey = actorKeyFromJwtSub(jwtPayload.sub);
      next();
      return;
    }
    res.status(403).json({ ok: false, error: 'forbidden' });
    return;
  }
  if (!BEARER) {
    res.status(403).json({ ok: false, error: 'forbidden' });
    return;
  }
  if (!bearerAccepted(raw)) {
    res.status(403).json({ ok: false, error: 'forbidden' });
    return;
  }
  req.auraActorKey = createHash('sha256').update(raw).digest('hex').slice(0, 16);
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

/** Hourly cap on im-safe (abuse / accidental tap storms). */
const imSafeLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 36,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => `${req.ip}:${actorKey(req)}`,
  message: { ok: false, error: 'rate_limited', detail: 'Too many I’m safe signals; try again later.' },
  handler: (req, res, _next, options) => {
    auditRateLimited('im-safe', req);
    res.status(options.statusCode).json(options.message);
  },
});

const app = express();
app.set('trust proxy', 1);
app.use((_req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Referrer-Policy', 'no-referrer');
  next();
});
app.use(
  cors({
    origin: CORS_ORIGIN === '*' ? true : CORS_ORIGIN.split(',').map((s) => s.trim()),
    methods: ['POST', 'GET', 'OPTIONS'],
    allowedHeaders: ['Authorization', 'Content-Type', 'X-Aura-Device-Fingerprint'],
    exposedHeaders: ['X-Aura-Anomaly'],
  }),
);
app.use(express.json({ limit: JSON_BODY_LIMIT }));
app.use((err, req, res, next) => {
  if (err.status === 400 && err.type === 'entity.parse.failed') {
    res.status(400).json({ ok: false, error: 'invalid_json', detail: 'Malformed JSON request body' });
    return;
  }
  next(err);
});

app.get('/health', (_req, res) => {
  res.json({ ok: true, service: 'aura-api' });
});

app.get('/ready', (_req, res) => {
  const r = readinessResult();
  if (r.ok) {
    res.json({ ok: true, service: 'aura-api', ready: true });
    return;
  }
  res.status(503).json({
    ok: false,
    service: 'aura-api',
    ready: false,
    error: 'not_ready',
    detail: r.detail,
    ...(r.message ? { message: r.message } : {}),
  });
});

app.post('/v1/journeys', globalLimiter, requireAuth, journeyLimiter, (req, res) => {
  const parsed = emptyBodySchema.safeParse(req.body ?? {});
  if (!parsed.success) {
    appendAudit({
      ts: new Date().toISOString(),
      type: 'audit.validation_failed',
      route: 'journeys-create',
      actorHash: actorKey(req),
      ip: req.ip,
      issues: parsed.error.flatten(),
    });
    res.status(400).json({ ok: false, error: 'validation_failed', detail: parsed.error.flatten() });
    return;
  }
  const journeyId = randomUUID();
  const owner = actorKey(req);
  journeyOwners.set(journeyId, owner);
  appendAudit({
    ts: new Date().toISOString(),
    type: 'journey.created',
    journeyId,
    actorHash: owner,
    ip: req.ip,
  });
  res.status(201).json({ ok: true, data: { journeyId } });
});

app.post('/v1/emergency-alerts', globalLimiter, requireAuth, sosLimiter, (req, res) => {
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
  requireAuth,
  journeyLimiter,
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
    if (!journeyOwnerOrRespond(jid.data, req, res, 'location-shares')) {
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

app.post('/v1/journeys/:journeyId/im-safe', globalLimiter, requireAuth, journeyLimiter, imSafeLimiter, (req, res) => {
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
  if (!journeyOwnerOrRespond(jid.data, req, res, 'im-safe')) {
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
