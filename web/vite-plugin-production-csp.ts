import type { Plugin } from 'vite';

function tryOrigin(raw: string | undefined): string | null {
  const t = raw?.trim();
  if (!t) return null;
  try {
    return new URL(t).origin;
  } catch {
    return null;
  }
}

/**
 * Injects a Content-Security-Policy meta tag into the built `index.html` only
 * (`apply: 'build'`). Dev server is unchanged.
 *
 * `frame-ancestors` is omitted: it is ignored in meta CSP; use an HTTP header at
 * the edge if you need clickjacking protection beyond `X-Frame-Options`.
 */
export function productionCspMeta(): Plugin {
  return {
    name: 'aura-production-csp-meta',
    apply: 'build',
    transformIndexHtml(html) {
      const googleOAuth = Boolean(process.env.VITE_GOOGLE_CLIENT_ID?.trim());

      const connectOrigins = new Set<string>();
      const apiOrigin = tryOrigin(process.env.VITE_AURA_API_URL);
      if (apiOrigin) connectOrigins.add(apiOrigin);
      const bffOrigin = tryOrigin(process.env.VITE_AURA_BFF_URL);
      if (bffOrigin) connectOrigins.add(bffOrigin);
      const telemetryOrigin = tryOrigin(process.env.VITE_AURA_TELEMETRY_ENDPOINT);
      if (telemetryOrigin) connectOrigins.add(telemetryOrigin);

      const directives: string[] = [
        "default-src 'self'",
        "base-uri 'self'",
        "form-action 'self'",
        "object-src 'none'",
        'upgrade-insecure-requests',
      ];

      const scriptSrc = ["'self'"];
      if (googleOAuth) {
        scriptSrc.push('https://accounts.google.com', 'https://www.gstatic.com');
      }
      directives.push(`script-src ${scriptSrc.join(' ')}`);

      directives.push(
        "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
        "img-src 'self' data: blob: https://*.tile.openstreetmap.org https://unpkg.com",
        "font-src 'self' https://fonts.gstatic.com data:",
      );

      const connectParts = ["'self'", ...[...connectOrigins].sort()];
      if (googleOAuth) {
        connectParts.push(
          'https://accounts.google.com',
          'https://www.googleapis.com',
          'https://oauth2.googleapis.com',
          'https://www.gstatic.com',
        );
      }
      directives.push(`connect-src ${connectParts.join(' ')}`);

      const frameParts = ["'self'"];
      if (googleOAuth) frameParts.push('https://accounts.google.com');
      directives.push(`frame-src ${frameParts.join(' ')}`);

      const csp = directives.join('; ');
      return {
        html,
        tags: [
          {
            tag: 'meta',
            attrs: { 'http-equiv': 'Content-Security-Policy', content: csp },
            injectTo: 'head-prepend',
          },
        ],
      };
    },
  };
}
