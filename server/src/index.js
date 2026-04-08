/**
 * Aura authoritative API — validation, auth, rate limits, append-only audit trail.
 * Env: AURA_API_BEARER_TOKEN and/or AURA_API_BFF_JWT_SECRET, AURA_API_BEARER_TOKEN_ALT, PORT, AUDIT_LOG_PATH, CORS_ORIGIN, AURA_API_JSON_BODY_LIMIT, AURA_API_RATE_LIMIT_*, optional AURA_API_DEPLOY_VERSION / AURA_API_GIT_SHA (see README)
 */

import cors from 'cors';
import express from 'express';
import rateLimit from 'express-rate-limit';
import fs from 'node:fs';
import path from 'node:path';
import { createHash, createHmac, randomUUID, timingSafeEqual } from 'node:crypto';
import { z } from 'zod';
import { createJourneyRegistry } from './journeyRegistry.js';

const PORT = Number(process.env.PORT || 8787);
const BEARER = process.env.AURA_API_BEARER_TOKEN;
/** Optional second beta token (staging / integration tests) — distinct actor key from primary bearer. */
const BEARER_ALT = process.env.AURA_API_BEARER_TOKEN_ALT || '';
/** HS256 secret for BFF-issued access tokens (`sub` = stable user id). When set, three-segment Bearer tokens are verified as JWTs first. */
const BFF_JWT_SECRET = process.env.AURA_API_BFF_JWT_SECRET || '';
const BFF_JWT_ISSUER = process.env.AURA_API_BFF_JWT_ISSUER || '';
const BFF_JWT_AUDIENCE = process.env.AURA_API_BFF_JWT_AUDIENCE || '';
const JSON_BODY_LIMIT = process.env.AURA_API_JSON_BODY_LIMIT || '32kb';
const AUDIT_LOG_PATH = process.env.AUDIT_LOG_PATH || path.join(process.cwd(), 'data', 'audit.log');
const JOURNEY_SQLITE_PATH =
  process.env.AURA_API_JOURNEY_STORE_SQLITE_PATH ||
  process.env.AURA_API_JOURNEY_SQLITE_PATH ||
  path.join(process.cwd(), 'data', 'journeys.sqlite');
const JOURNEY_JSONL_PATH =
  process.env.AURA_API_JOURNEY_STORE_JSONL_PATH ||
  process.env.AURA_API_JOURNEY_JSONL_PATH ||
  path.join(process.cwd(), 'data', 'journeys.jsonl');
const CORS_ORIGIN = process.env.CORS_ORIGIN || '*';

/** Max length for optional deploy metadata strings (env); longer values are truncated. */
const DEPLOY_META_MAX_LEN = 256;

/**
 * @param {string | undefined} raw
 * @returns {string | null}
 */
function trimDeployMeta(raw) {
  if (raw === undefined || raw === null) return null;
  if (typeof raw !== 'string') return null;
  const t = raw.trim();
  if (t.length === 0) return null;
  return t.length > DEPLOY_META_MAX_LEN ? t.slice(0, DEPLOY_META_MAX_LEN) : t;
}

const DEPLOY_VERSION = trimDeployMeta(process.env.AURA_API_DEPLOY_VERSION);
const GIT_SHA = trimDeployMeta(process.env.AURA_API_GIT_SHA);

/** @returns {Record<string, string>} */
function deployMetadataFields() {
  /** @type {Record<string, string>} */
  const o = {};
  if (DEPLOY_VERSION) o.deployVersion = DEPLOY_VERSION;
  if (GIT_SHA) o.gitSha = GIT_SHA;
  return o;
}

/** Max length for client-supplied `X-Request-Id` / `X-Correlation-Id` (printable ASCII only). */
const REQUEST_ID_MAX_LEN = 128;

/**
 * @param {unknown} raw
 * @returns {string | null}
 */
function tryUseIncomingRequestId(raw) {
  if (typeof raw !== 'string') return null;
  const s = raw.trim();
  if (s.length === 0 || s.length > REQUEST_ID_MAX_LEN) return null;
  for (let i = 0; i < s.length; i += 1) {
    const c = s.charCodeAt(i);
    if (c < 0x20 || c > 0x7e) return null;
  }
  return s;
}

/**
 * @param {import('express').Request} req
 * @returns {string}
 */
function resolveAuraRequestId(req) {
  const fromReqId = tryUseIncomingRequestId(req.headers['x-request-id']);
  if (fromReqId) return fromReqId;
  const fromCorr = tryUseIncomingRequestId(req.headers['x-correlation-id']);
  if (fromCorr) return fromCorr;
  return randomUUID();
}

const journeyRegistry = createJourneyRegistry({
  sqlitePath: JOURNEY_SQLITE_PATH,
  jsonlPath: JOURNEY_JSONL_PATH,
});

/** @param {string} name @param {number} defaultVal @param {number} [min] */
function parsePositiveIntEnv(name, defaultVal, min = 1) {
  const raw = process.env[name];
  if (raw === undefined || raw === '') return defaultVal;
  const n = Number.parseInt(String(raw), 10);
  if (!Number.isFinite(n) || n < min) return defaultVal;
  return n;
}

/** Sets `req.auraRateLimitRoute` for `audit.rate_limited` when minute-window limiters trip. */
function setAuraRateLimitRoute(route) {
  return function setAuraRateLimitRouteMw(req, _res, next) {
    req.auraRateLimitRoute = route;
    next();
  };
}

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
const SOS_BURST_WINDOW_MS = parsePositiveIntEnv(
  'AURA_API_RATE_LIMIT_SOS_BURST_WINDOW_MS',
  10 * 60 * 1000,
  1000,
);
const SOS_BURST_THRESHOLD = parsePositiveIntEnv('AURA_API_RATE_LIMIT_SOS_BURST_THRESHOLD', 3, 1);

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
const SHARE_BURST_WINDOW_MS = parsePositiveIntEnv(
  'AURA_API_RATE_LIMIT_LOCATION_SHARE_BURST_WINDOW_MS',
  10 * 60 * 1000,
  1000,
);
const SHARE_BURST_THRESHOLD = parsePositiveIntEnv(
  'AURA_API_RATE_LIMIT_LOCATION_SHARE_BURST_THRESHOLD',
  12,
  1,
);

function shareAnomalyFlags(actor) {
  const now = Date.now();
  const prev = shareRecent.get(actor) || [];
  const windowed = prev.filter((t) => now - t < SHARE_BURST_WINDOW_MS);
  windowed.push(now);
  shareRecent.set(actor, windowed);
  return windowed.length >= SHARE_BURST_THRESHOLD ? ['burst_location_share'] : [];
}

function journeyOwnerOrRespond(journeyIdUuid, req, res, route) {
  const owner = actorKey(req);
  const registered = journeyRegistry.getOwner(journeyIdUuid);
  if (!registered) {
    appendAuditFromReq(req, {
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
    appendAuditFromReq(req, {
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
  appendAuditFromReq(req, {
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

function probeDirWritable(dir) {
  fs.mkdirSync(dir, { recursive: true });
  const probe = path.join(dir, `.aura-ready-probe-${process.pid}`);
  fs.writeFileSync(probe, '', { flag: 'w' });
  fs.unlinkSync(probe);
}

/** Verifies auth is configured and audit + journey store directories are writable. */
function readinessResult() {
  if (!BEARER && !BFF_JWT_SECRET) {
    return { ok: false, detail: 'Set AURA_API_BEARER_TOKEN and/or AURA_API_BFF_JWT_SECRET' };
  }
  try {
    ensureAuditDir();
    probeDirWritable(path.dirname(AUDIT_LOG_PATH));
    probeDirWritable(path.dirname(JOURNEY_SQLITE_PATH));
    probeDirWritable(path.dirname(JOURNEY_JSONL_PATH));
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

/** @param {import('express').Request} req @param {Record<string, unknown>} entry */
function appendAuditFromReq(req, entry) {
  appendAudit({
    ...entry,
    requestId: req.auraRequestId,
  });
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

const GLOBAL_WINDOW_MS = parsePositiveIntEnv('AURA_API_RATE_LIMIT_GLOBAL_WINDOW_MS', 60 * 1000, 1000);
const GLOBAL_MAX = parsePositiveIntEnv('AURA_API_RATE_LIMIT_GLOBAL_MAX', 120, 1);
const JOURNEY_WINDOW_MS = parsePositiveIntEnv('AURA_API_RATE_LIMIT_JOURNEY_WINDOW_MS', 60 * 1000, 1000);
const JOURNEY_MAX = parsePositiveIntEnv('AURA_API_RATE_LIMIT_JOURNEY_MAX', 40, 1);
const SOS_WINDOW_MS = parsePositiveIntEnv('AURA_API_RATE_LIMIT_SOS_WINDOW_MS', 60 * 60 * 1000, 1000);
const SOS_MAX = parsePositiveIntEnv('AURA_API_RATE_LIMIT_SOS_MAX', 8, 1);
const SHARE_WINDOW_MS = parsePositiveIntEnv(
  'AURA_API_RATE_LIMIT_LOCATION_SHARE_WINDOW_MS',
  60 * 60 * 1000,
  1000,
);
const SHARE_MAX = parsePositiveIntEnv('AURA_API_RATE_LIMIT_LOCATION_SHARE_MAX', 48, 1);
const IM_SAFE_WINDOW_MS = parsePositiveIntEnv('AURA_API_RATE_LIMIT_IM_SAFE_WINDOW_MS', 60 * 60 * 1000, 1000);
const IM_SAFE_MAX = parsePositiveIntEnv('AURA_API_RATE_LIMIT_IM_SAFE_MAX', 36, 1);

const globalLimiter = rateLimit({
  windowMs: GLOBAL_WINDOW_MS,
  max: GLOBAL_MAX,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => `${req.ip}:${actorKey(req)}`,
  message: {
    ok: false,
    error: 'rate_limited',
    detail: 'Too many API requests in a short time; try again later.',
  },
  handler: (req, res, _next, options) => {
    auditRateLimited(req.auraRateLimitRoute || 'unknown', req);
    res.status(options.statusCode).json(options.message);
  },
});

const journeyLimiter = rateLimit({
  windowMs: JOURNEY_WINDOW_MS,
  max: JOURNEY_MAX,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => `${req.ip}:${actorKey(req)}`,
  message: {
    ok: false,
    error: 'rate_limited',
    detail: 'Too many journey operations in a short time; try again later.',
  },
  handler: (req, res, _next, options) => {
    auditRateLimited(req.auraRateLimitRoute || 'unknown', req);
    res.status(options.statusCode).json(options.message);
  },
});

const sosLimiter = rateLimit({
  windowMs: SOS_WINDOW_MS,
  max: SOS_MAX,
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
  windowMs: SHARE_WINDOW_MS,
  max: SHARE_MAX,
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
  windowMs: IM_SAFE_WINDOW_MS,
  max: IM_SAFE_MAX,
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
app.use((req, res, next) => {
  const requestId = resolveAuraRequestId(req);
  req.auraRequestId = requestId;
  res.setHeader('X-Request-Id', requestId);
  next();
});
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
    allowedHeaders: [
      'Authorization',
      'Content-Type',
      'X-Aura-Device-Fingerprint',
      'X-Request-Id',
      'X-Correlation-Id',
    ],
    exposedHeaders: ['X-Aura-Anomaly', 'X-Request-Id'],
  }),
);
app.use(express.json({ limit: JSON_BODY_LIMIT }));
app.use((err, req, res, next) => {
  if (err.status === 400 && err.type === 'entity.parse.failed') {
    res.status(400).json({ ok: false, error: 'invalid_json', detail: 'Malformed JSON request body' });
    return;
  }
  if (err.status === 413 && err.type === 'entity.too.large') {
    res.status(413).json({
      ok: false,
      error: 'payload_too_large',
      detail: 'JSON request body exceeds configured limit',
    });
    return;
  }
  next(err);
});

app.get('/health', (_req, res) => {
  res.json({ ok: true, service: 'aura-api', ...deployMetadataFields() });
});

app.get('/ready', (_req, res) => {
  const meta = deployMetadataFields();
  const r = readinessResult();
  if (r.ok) {
    res.json({ ok: true, service: 'aura-api', ready: true, ...meta });
    return;
  }
  res.status(503).json({
    ok: false,
    service: 'aura-api',
    ready: false,
    error: 'not_ready',
    detail: r.detail,
    ...(r.message ? { message: r.message } : {}),
    ...meta,
  });
});

// No separate hourly cap on journey creation: minute-window global + journey limits already bound abuse;
// an hourly create cap would add false positives for legitimate multi-device / retry flows without clear product ask.
app.post(
  '/v1/journeys',
  setAuraRateLimitRoute('journeys-create'),
  globalLimiter,
  requireAuth,
  journeyLimiter,
  (req, res) => {
  const parsed = emptyBodySchema.safeParse(req.body ?? {});
  if (!parsed.success) {
    appendAuditFromReq(req, {
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
  journeyRegistry.register(journeyId, owner);
  appendAuditFromReq(req, {
    ts: new Date().toISOString(),
    type: 'journey.created',
    journeyId,
    actorHash: owner,
    ip: req.ip,
  });
  res.status(201).json({ ok: true, data: { journeyId } });
  },
);

app.post(
  '/v1/emergency-alerts',
  setAuraRateLimitRoute('emergency-alerts'),
  globalLimiter,
  requireAuth,
  sosLimiter,
  (req, res) => {
  const parsed = emergencyBodySchema.safeParse(req.body);
  if (!parsed.success) {
    appendAuditFromReq(req, {
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
  appendAuditFromReq(req, entry);
  if (anomalyFlags.length) {
    res.setHeader('X-Aura-Anomaly', anomalyFlags.join(','));
  }
  res.status(201).json({ ok: true, data: { alertId } });
  },
);

app.post(
  '/v1/journeys/:journeyId/location-shares',
  setAuraRateLimitRoute('location-shares'),
  globalLimiter,
  requireAuth,
  journeyLimiter,
  shareLimiter,
  (req, res) => {
    const jid = uuidSchema.safeParse(req.params.journeyId);
    if (!jid.success) {
      appendAuditFromReq(req, {
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
      appendAuditFromReq(req, {
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
    appendAuditFromReq(req, {
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

app.post(
  '/v1/journeys/:journeyId/im-safe',
  setAuraRateLimitRoute('im-safe'),
  globalLimiter,
  requireAuth,
  journeyLimiter,
  imSafeLimiter,
  (req, res) => {
  const jid = uuidSchema.safeParse(req.params.journeyId);
  if (!jid.success) {
    appendAuditFromReq(req, {
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
    appendAuditFromReq(req, {
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
  appendAuditFromReq(req, {
    ts: receivedAt,
    type: 'journey.im_safe',
    journeyId: jid.data,
    actorHash: actorKey(req),
    ip: req.ip,
  });
  res.status(201).json({ ok: true, data: { receivedAt } });
  },
);

app.use((_req, res) => {
  res.status(404).json({ ok: false, error: 'not_found' });
});

if (!process.env.AURA_API_SKIP_LISTEN) {
  app.listen(PORT, () => {
    process.stdout.write(
      `aura-api listening on :${PORT} audit=${AUDIT_LOG_PATH} journeys=${journeyRegistry.backend}\n`,
    );
  });
}

export { app, journeyRegistry };
