/**
 * Express app factory for Aura BFF (Google / Firebase sign-in → session → API JWT).
 */

import { randomUUID } from 'node:crypto';
import cors from 'cors';
import express from 'express';
import rateLimit from 'express-rate-limit';
import session from 'express-session';
import admin from 'firebase-admin';
import { OAuth2Client } from 'google-auth-library';
import { mintAccessJwt } from './mintAccessJwt.js';

/** Max length for client-supplied `X-Request-Id` / `X-Correlation-Id` (printable ASCII only). Mirrors `server/src/index.js`. */
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

/**
 * @param {string} name
 * @param {number} fallback
 * @param {number} min
 */
function parsePositiveIntEnv(name, fallback, min) {
  const raw = process.env[name];
  if (raw === undefined || raw === '') return fallback;
  const n = Number(raw);
  if (!Number.isFinite(n) || n < min) return fallback;
  return Math.floor(n);
}

/**
 * Per-IP limiters for auth/session routes (trust proxy must be set for req.ip).
 * Defaults are permissive so local dev and parallel `npm test` stay stable; tighten in prod via env.
 *
 * @param {object} opts
 * @param {number} opts.windowMs
 * @param {number} opts.max
 * @param {string} opts.detail
 */
function createBffIpLimiter({ windowMs, max, detail }) {
  return rateLimit({
    windowMs,
    max,
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req) => req.ip || 'unknown',
    message: { ok: false, error: 'rate_limited', detail },
    handler: (req, res, _next, options) => {
      res.status(options.statusCode).json(options.message);
    },
  });
}

/**
 * @returns {string[]}
 */
export function readBffConfigErrors() {
  const SESSION_SECRET = process.env.AURA_BFF_SESSION_SECRET || '';
  const JWT_SECRET = process.env.AURA_API_BFF_JWT_SECRET || '';
  const errors = [];
  if (!SESSION_SECRET || SESSION_SECRET.length < 16) {
    errors.push('Set AURA_BFF_SESSION_SECRET (min 16 chars)');
  }
  if (!JWT_SECRET || JWT_SECRET.length < 16) {
    errors.push('Set AURA_API_BFF_JWT_SECRET (same value as Aura API; min 16 chars)');
  }
  return errors;
}

/**
 * @returns {string[]}
 */
export function readGoogleOAuthConfigErrors() {
  const GOOGLE_CLIENT_ID = process.env.AURA_BFF_GOOGLE_CLIENT_ID || process.env.GOOGLE_CLIENT_ID || '';
  if (!GOOGLE_CLIENT_ID) {
    return ['Set AURA_BFF_GOOGLE_CLIENT_ID (must match web VITE_GOOGLE_CLIENT_ID)'];
  }
  return [];
}

/**
 * @typedef {object} CreateAppOverrides
 * @property {(opts: { idToken: string; audience: string }) => Promise<{ getPayload: () => { sub?: string } | null | undefined }>} [verifyIdToken]
 * @property {(idToken: string) => Promise<{ uid: string }>} [verifyFirebaseIdToken]
 */

/**
 * @param {CreateAppOverrides} [overrides]
 */
export function createApp(overrides = {}) {
  const GOOGLE_CLIENT_ID = process.env.AURA_BFF_GOOGLE_CLIENT_ID || process.env.GOOGLE_CLIENT_ID || '';
  const GOOGLE_CLIENT_SECRET = process.env.AURA_BFF_GOOGLE_CLIENT_SECRET || process.env.GOOGLE_CLIENT_SECRET || '';
  const BFF_PUBLIC_URL = (process.env.AURA_BFF_PUBLIC_URL || '').replace(/\/$/, '');
  const SESSION_SECRET = process.env.AURA_BFF_SESSION_SECRET || '';
  const JWT_SECRET = process.env.AURA_API_BFF_JWT_SECRET || '';
  const JWT_ISSUER = process.env.AURA_BFF_JWT_ISSUER || process.env.AURA_API_BFF_JWT_ISSUER || '';
  const JWT_AUDIENCE = process.env.AURA_BFF_JWT_AUDIENCE || process.env.AURA_API_BFF_JWT_AUDIENCE || '';
  const JWT_TTL_SECONDS = Math.max(60, Number(process.env.AURA_BFF_JWT_TTL_SECONDS || 900));
  const CORS_RAW = process.env.AURA_BFF_CORS_ORIGIN || '';
  const JSON_BODY_LIMIT = process.env.AURA_BFF_JSON_BODY_LIMIT || '32kb';
  const NODE_ENV = process.env.NODE_ENV || 'development';
  const IS_PROD = NODE_ENV === 'production';

  const authGoogleWindowMs = parsePositiveIntEnv('AURA_BFF_RATE_LIMIT_AUTH_GOOGLE_WINDOW_MS', 60_000, 1000);
  const authGoogleMax = parsePositiveIntEnv('AURA_BFF_RATE_LIMIT_AUTH_GOOGLE_MAX', 5000, 1);
  const sessionWindowMs = parsePositiveIntEnv('AURA_BFF_RATE_LIMIT_SESSION_WINDOW_MS', 60_000, 1000);
  const sessionMax = parsePositiveIntEnv('AURA_BFF_RATE_LIMIT_SESSION_MAX', 10_000, 1);
  const logoutWindowMs = parsePositiveIntEnv('AURA_BFF_RATE_LIMIT_LOGOUT_WINDOW_MS', 60_000, 1000);
  const logoutMax = parsePositiveIntEnv('AURA_BFF_RATE_LIMIT_LOGOUT_MAX', 2000, 1);

  const authGoogleLimiter = createBffIpLimiter({
    windowMs: authGoogleWindowMs,
    max: authGoogleMax,
    detail: 'Too many sign-in attempts; try again later.',
  });
  const sessionLimiter = createBffIpLimiter({
    windowMs: sessionWindowMs,
    max: sessionMax,
    detail: 'Too many session requests; try again later.',
  });
  const logoutLimiter = createBffIpLimiter({
    windowMs: logoutWindowMs,
    max: logoutMax,
    detail: 'Too many logout requests; try again later.',
  });

  const readWindowMs = parsePositiveIntEnv('AURA_BFF_RATE_LIMIT_READ_WINDOW_MS', 60_000, 1000);
  const readMax = parsePositiveIntEnv('AURA_BFF_RATE_LIMIT_READ_MAX', 600, 1);
  const readSkip = process.env.AURA_BFF_RATE_LIMIT_READ_SKIP === '1';
  const bffReadLimiter = rateLimit({
    windowMs: readWindowMs,
    max: readMax,
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req) => req.ip || 'unknown',
    skip: () => readSkip,
    message: {
      ok: false,
      error: 'rate_limited',
      detail: 'Too many requests to health or readiness endpoints; try again later.',
    },
    handler: (req, res, _next, options) => {
      res.status(options.statusCode).json(options.message);
    },
  });

  const oauthRedirectUri = BFF_PUBLIC_URL ? `${BFF_PUBLIC_URL}/auth/google/callback` : undefined;
  const oauthClient = GOOGLE_CLIENT_ID
    ? new OAuth2Client(GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET || undefined, oauthRedirectUri)
    : null;

  const verifyIdToken =
    overrides.verifyIdToken ??
    ((opts) => {
      if (!oauthClient) {
        return Promise.reject(new Error('OAuth client not configured'));
      }
      return oauthClient.verifyIdToken(opts);
    });

  /**
   * @returns {boolean}
   */
  function firebaseAdminConfigured() {
    const sa = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
    const gac = process.env.GOOGLE_APPLICATION_CREDENTIALS;
    return Boolean((typeof sa === 'string' && sa.trim()) || (typeof gac === 'string' && gac.trim()));
  }

  /**
   * @returns {Promise<void>}
   */
  async function ensureFirebaseAdminApp() {
    if (admin.apps.length) return;
    const sa = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
    const gac = process.env.GOOGLE_APPLICATION_CREDENTIALS;
    if (typeof sa === 'string' && sa.trim()) {
      admin.initializeApp({ credential: admin.credential.cert(JSON.parse(sa)) });
      return;
    }
    if (typeof gac === 'string' && gac.trim()) {
      admin.initializeApp();
      return;
    }
    throw new Error('firebase_not_configured');
  }

  const verifyFirebaseIdToken =
    overrides.verifyFirebaseIdToken ??
    (async (idToken) => {
      await ensureFirebaseAdminApp();
      const decoded = await admin.auth().verifyIdToken(idToken);
      if (!decoded.uid) {
        throw new Error('invalid_firebase_token');
      }
      return { uid: decoded.uid };
    });

  function parseCorsOrigins() {
    const raw = CORS_RAW.trim();
    if (!raw || raw === '*') return null;
    return raw.split(',').map((s) => s.trim()).filter(Boolean);
  }

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

  const allowlist = parseCorsOrigins();
  app.use(
    cors({
      origin: allowlist
        ? (origin, cb) => {
            if (!origin) return cb(null, true);
            if (allowlist.includes(origin)) return cb(null, true);
            cb(new Error(`CORS blocked: ${origin}`));
          }
        : true,
      credentials: true,
      methods: ['GET', 'POST', 'OPTIONS'],
      allowedHeaders: [
        'Authorization',
        'Content-Type',
        'X-Aura-Device-Fingerprint',
        'X-Request-Id',
        'X-Correlation-Id',
      ],
      exposedHeaders: ['X-Request-Id'],
    }),
  );

  app.use(express.json({ limit: JSON_BODY_LIMIT }));
  app.use((err, _req, res, next) => {
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

  app.use(
    session({
      name: 'aura.bff.sid',
      secret: SESSION_SECRET || 'dev-only-placeholder-change-me',
      resave: false,
      saveUninitialized: false,
      cookie: {
        httpOnly: true,
        secure: IS_PROD,
        sameSite: IS_PROD ? 'lax' : 'lax',
        maxAge: 7 * 24 * 60 * 60 * 1000,
      },
    }),
  );

  app.get('/health', bffReadLimiter, (_req, res) => {
    res.json({ ok: true, service: 'aura-bff' });
  });

  app.get('/ready', bffReadLimiter, (_req, res) => {
    const cfgErrors = readBffConfigErrors();
    if (cfgErrors.length === 0) {
      res.json({ ok: true, service: 'aura-bff', ready: true });
      return;
    }
    res.status(503).json({
      ok: false,
      service: 'aura-bff',
      ready: false,
      error: 'not_ready',
      detail: cfgErrors[0],
    });
  });

  app.post('/auth/google', authGoogleLimiter, async (req, res) => {
    const errors = [...readBffConfigErrors(), ...readGoogleOAuthConfigErrors()];
    if (errors.length) {
      return res.status(503).json({ ok: false, error: 'bff_misconfigured', detail: errors[0] });
    }
    const idToken = req.body?.idToken;
    if (typeof idToken !== 'string' || !idToken.trim()) {
      return res.status(400).json({ ok: false, error: 'invalid_request', detail: 'idToken required' });
    }
    try {
      const ticket = await verifyIdToken({
        idToken: idToken.trim(),
        audience: GOOGLE_CLIENT_ID,
      });
      const payload = ticket.getPayload();
      const sub = payload?.sub;
      if (!sub) {
        return res.status(401).json({ ok: false, error: 'invalid_token' });
      }
      req.session.googleSub = sub;
      delete req.session.firebaseUid;
      return res.json({ ok: true });
    } catch {
      return res.status(401).json({ ok: false, error: 'invalid_token' });
    }
  });

  app.post('/auth/firebase', authGoogleLimiter, async (req, res) => {
    const errors = readBffConfigErrors();
    if (errors.length) {
      return res.status(503).json({ ok: false, error: 'bff_misconfigured', detail: errors[0] });
    }
    if (!overrides.verifyFirebaseIdToken && !firebaseAdminConfigured()) {
      return res.status(503).json({
        ok: false,
        error: 'firebase_not_configured',
        detail: 'Set FIREBASE_SERVICE_ACCOUNT_JSON or GOOGLE_APPLICATION_CREDENTIALS for the BFF.',
      });
    }
    const idToken = req.body?.idToken;
    if (typeof idToken !== 'string' || !idToken.trim()) {
      return res.status(400).json({ ok: false, error: 'invalid_request', detail: 'idToken required' });
    }
    try {
      const { uid } = await verifyFirebaseIdToken(idToken.trim());
      req.session.firebaseUid = uid;
      delete req.session.googleSub;
      return res.json({ ok: true });
    } catch {
      return res.status(401).json({ ok: false, error: 'invalid_token' });
    }
  });

  app.get('/auth/google/start', (req, res) => {
    const errors = [...readBffConfigErrors(), ...readGoogleOAuthConfigErrors()];
    if (errors.length) {
      return res.status(503).send(errors[0]);
    }
    if (!GOOGLE_CLIENT_SECRET || !BFF_PUBLIC_URL) {
      return res.status(503).send('Set AURA_BFF_GOOGLE_CLIENT_SECRET and AURA_BFF_PUBLIC_URL for redirect OAuth');
    }
    const returnTo = typeof req.query.returnTo === 'string' ? req.query.returnTo : '/';
    req.session.oauthReturnTo = returnTo.slice(0, 2048);
    const url = oauthClient.generateAuthUrl({
      access_type: 'offline',
      scope: ['openid', 'email', 'profile'],
      prompt: 'consent',
      state: req.sessionID,
      redirect_uri: oauthRedirectUri,
    });
    res.redirect(url);
  });

  app.get('/auth/google/callback', async (req, res) => {
    const errors = [...readBffConfigErrors(), ...readGoogleOAuthConfigErrors()];
    if (errors.length || !GOOGLE_CLIENT_SECRET || !BFF_PUBLIC_URL) {
      return res.status(503).send('OAuth redirect not configured');
    }
    const code = req.query.code;
    if (typeof code !== 'string') {
      return res.status(400).send('Missing code');
    }
    try {
      const { tokens } = await oauthClient.getToken({
        code,
        redirect_uri: oauthRedirectUri,
      });
      if (!tokens.id_token) {
        return res.status(400).send('No id_token in response');
      }
      const ticket = await verifyIdToken({
        idToken: tokens.id_token,
        audience: GOOGLE_CLIENT_ID,
      });
      const sub = ticket.getPayload()?.sub;
      if (!sub) return res.status(401).send('Invalid token');
      req.session.googleSub = sub;
      delete req.session.firebaseUid;
      const back = typeof req.session.oauthReturnTo === 'string' ? req.session.oauthReturnTo : '/';
      delete req.session.oauthReturnTo;
      res.redirect(back.startsWith('/') ? back : '/');
    } catch {
      res.status(401).send('OAuth exchange failed');
    }
  });

  app.get('/session', sessionLimiter, (req, res) => {
    const errors = readBffConfigErrors();
    if (errors.length) {
      return res.status(503).json({ ok: false, error: 'bff_misconfigured', detail: errors[0] });
    }
    const googleSub = req.session.googleSub;
    const firebaseUid = req.session.firebaseUid;
    const sub =
      typeof googleSub === 'string' && googleSub
        ? googleSub
        : typeof firebaseUid === 'string' && firebaseUid
          ? firebaseUid
          : null;
    if (!sub) {
      return res.status(401).json({ ok: false, error: 'not_authenticated' });
    }
    const { token, exp } = mintAccessJwt({
      secret: JWT_SECRET,
      sub,
      ttlSeconds: JWT_TTL_SECONDS,
      issuer: JWT_ISSUER || undefined,
      audience: JWT_AUDIENCE || undefined,
    });
    return res.json({
      ok: true,
      accessToken: token,
      expiresAt: new Date(exp * 1000).toISOString(),
    });
  });

  app.post('/logout', logoutLimiter, (req, res) => {
    req.session.destroy((err) => {
      if (err) return res.status(500).json({ ok: false });
      res.json({ ok: true });
    });
  });

  return app;
}
