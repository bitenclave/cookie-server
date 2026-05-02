import { serve } from '@hono/node-server';

import app from './app.js';
import { readEnv } from './config/env.js';
import { closeDb } from './db/client.js';

const env = readEnv();
const server = serve({
  fetch: app.fetch,
  port: env.port,
});

console.log(`Cookie-Editor server listening on http://localhost:${env.port}`);

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

function shutdown() {
  server.close(async error => {
    if (error) {
      console.error(error);
      process.exit(1);
    }
    await closeDb();
    process.exit(0);
  });
}
