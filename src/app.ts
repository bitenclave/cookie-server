import { timingSafeEqual } from 'node:crypto';

import { cors } from 'hono/cors';
import { HTTPException } from 'hono/http-exception';
import { Hono } from 'hono';
import { secureHeaders } from 'hono/secure-headers';

import { readEnv } from './config/env.js';
import { createProfileRoutes } from './profiles/profileRoutes.js';

const app = new Hono();

app.use('*', secureHeaders());
app.use('/api/*', cors(createCorsOptions()));
app.get('/', c => c.redirect('/health'));
app.get('/health', c => {
  const env = readEnv();
  return c.json({
    ok: true,
    databaseConfigured: Boolean(env.databaseUrl),
    authConfigured: Boolean(env.authToken),
  });
});

app.use('/api/*', async (c, next) => {
  const env = readEnv();
  if (!env.authToken) {
    return c.json({ error: 'AUTH_TOKEN is not configured' }, 503);
  }
  const token = readBearerToken(c.req.header('authorization'));
  if (!token || !safeEqual(token, env.authToken)) {
    c.header('WWW-Authenticate', 'Bearer realm="CookieEditor"');
    return c.json({ error: 'Unauthorized' }, 401);
  }
  return next();
});

app.route('/api/profiles', createProfileRoutes());

app.notFound(c => c.json({ error: 'Not found' }, 404));
app.onError((error, c) => {
  if (error instanceof HTTPException) {
    return c.json({ error: error.message }, error.status);
  }
  console.error(error);
  return c.json({ error: 'Internal server error' }, 500);
});

function createCorsOptions() {
  return {
    origin: readEnv().corsOrigin,
    allowHeaders: ['Authorization', 'Content-Type'],
    allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    maxAge: 600,
  };
}

function readBearerToken(header = ''): string {
  const match = header.match(/^Bearer\s+(.+)$/i);
  return match?.[1]?.trim() || '';
}

function safeEqual(actual: string, expected: string): boolean {
  const actualBuffer = Buffer.from(actual);
  const expectedBuffer = Buffer.from(expected);
  if (actualBuffer.length !== expectedBuffer.length) {
    return false;
  }
  return timingSafeEqual(actualBuffer, expectedBuffer);
}

export default app;
