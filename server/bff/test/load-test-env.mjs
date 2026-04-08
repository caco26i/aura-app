/**
 * Preloads before BFF tests so `createApp.js` sees valid env when statically imported.
 */
process.env.AURA_BFF_GOOGLE_CLIENT_ID ||= 'test-google-client-id.apps.googleusercontent.com';
process.env.AURA_API_BFF_JWT_SECRET ||= 'bff-jwt-test-secret-min-16-chars!!';
process.env.AURA_BFF_SESSION_SECRET ||= 'bff-session-test-secret-16+chars';
process.env.NODE_ENV ||= 'test';
