/**
 * Aura BFF — Google sign-in → session cookie → short-lived HS256 access JWT for Aura API.
 * Env: see ../README.md
 */

import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createApp, readBffConfigErrors } from './createApp.js';

const PORT = Number(process.env.PORT || 8790);
const NODE_ENV = process.env.NODE_ENV || 'development';
const IS_PROD = NODE_ENV === 'production';

const app = createApp();

const thisFile = fileURLToPath(import.meta.url);
const isMain = process.argv[1] != null && path.resolve(process.argv[1]) === thisFile;

let server;
if (isMain) {
  server = app.listen(PORT, () => {
    // eslint-disable-next-line no-console
    console.log(`aura-bff listening on :${PORT}`);
  });
}

const cfgErr = readBffConfigErrors();
if (cfgErr.length && IS_PROD) {
  // eslint-disable-next-line no-console
  console.error('aura-bff: configuration incomplete:', cfgErr.join('; '));
}

export { app, server };
