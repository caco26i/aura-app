/**
 * Express app factory for Aura BFF (Google sign-in → session → API JWT).
 */

import cors from 'cors';
import express from 'express';
import session from 'express-session';
import { OAuth2Client } from 'google-auth-library';
import { mintAccessJwt } from './mintAccessJwt.js';

/**
 * @returns {string[]}
 */
export function readBffConfigErrors() {
  const SESSION_SECRET = process.env.AURA_BFF_SESSION_SECRET || '';
  const JWT_SECRET = process.env.AURA_API_BFF_JWT_SECRET || '';
  const GOOGLE_CLIENT_ID = process.env.AURA_BFF_GOOGLE_CLIENT_ID || process.env.GOOGLE_CLIENT_ID || '';
  const errors = [];
  if (!SESSION_SECRET || SESSION_SECRET.length < 16) {
    errors.push('Set AURA_BFF_SESSION_SECRET (min 16 chars)');
  }
  if (!JWT_SECRET || JWT_SECRET.length < 16) {
    errors.push('Set AURA_API_BFF_JWT_SECRET (same value as Aura API; min 16 chars)');
  }
  if (!GOOGLE_CLIENT_ID) {
    errors.push('Set AURA_BFF_GOOGLE_CLIENT_ID (must match web VITE_GOOGLE_CLIENT_ID)');
  }
  return errors;
}

/**
 * @typedef {object} CreateAppOverrides
 * @property {(opts: { idToken: string; audience: string }) => Promise<{ getPayload: () => { sub?: string } | null | undefined }>} [verifyIdToken]
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

  function parseCorsOrigins() {
    const raw = CORS_RAW.trim();
    if (!raw || raw === '*') return null;
    return raw.split(',').map((s) => s.trim()).filter(Boolean);
  }

  const app = express();
  app.set('trust proxy', 1);
  app.use(express.json({ limit: JSON_BODY_LIMIT }));

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
    }),
  );

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

  app.get('/health', (_req, res) => {
    res.json({ ok: true, service: 'aura-bff' });
  });

  app.post('/auth/google', async (req, res) => {
    const errors = readBffConfigErrors();
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
      return res.json({ ok: true });
    } catch {
      return res.status(401).json({ ok: false, error: 'invalid_token' });
    }
  });

  app.get('/auth/google/start', (req, res) => {
    const errors = readBffConfigErrors();
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
    const errors = readBffConfigErrors();
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
      const back = typeof req.session.oauthReturnTo === 'string' ? req.session.oauthReturnTo : '/';
      delete req.session.oauthReturnTo;
      res.redirect(back.startsWith('/') ? back : '/');
    } catch {
      res.status(401).send('OAuth exchange failed');
    }
  });

  app.get('/session', (req, res) => {
    const errors = readBffConfigErrors();
    if (errors.length) {
      return res.status(503).json({ ok: false, error: 'bff_misconfigured', detail: errors[0] });
    }
    const sub = req.session.googleSub;
    if (typeof sub !== 'string' || !sub) {
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

  app.post('/logout', (req, res) => {
    req.session.destroy((err) => {
      if (err) return res.status(500).json({ ok: false });
      res.json({ ok: true });
    });
  });

  return app;
}
