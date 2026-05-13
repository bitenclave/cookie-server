import { createHash, createHmac, timingSafeEqual } from 'node:crypto';

import { cors } from 'hono/cors';
import { HTTPException } from 'hono/http-exception';
import { Hono, type Context } from 'hono';
import { secureHeaders } from 'hono/secure-headers';

import { readEnv } from './config/env.js';
import { createProfileRoutes } from './profiles/profileRoutes.js';

const AUTH_TIMESTAMP_WINDOW_MS = 5 * 60 * 1000;
const seenAuthNonces = new Map<string, number>();

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
  if (!(await verifySignedRequest(c, env.authToken))) {
    c.header('WWW-Authenticate', 'Signature realm="CookieEditor"');
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
    allowHeaders: [
      'Content-Type',
      'X-Auth-Nonce',
      'X-Auth-Signature',
      'X-Auth-Timestamp',
      'X-Device-ID',
    ],
    allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    maxAge: 600,
  };
}

async function verifySignedRequest(
  c: Context,
  authToken: string
): Promise<boolean> {
  const deviceId = c.req.header('x-device-id')?.trim() || '';
  const timestamp = c.req.header('x-auth-timestamp')?.trim() || '';
  const nonce = c.req.header('x-auth-nonce')?.trim() || '';
  const signature = c.req.header('x-auth-signature')?.trim() || '';
  const timestampMs = Number(timestamp);

  if (
    !isValidDeviceId(deviceId) ||
    !isValidNonce(nonce) ||
    !isValidSignature(signature) ||
    !Number.isFinite(timestampMs) ||
    Math.abs(Date.now() - timestampMs) > AUTH_TIMESTAMP_WINDOW_MS
  ) {
    return false;
  }

  const nonceKey = `${deviceId}:${nonce}`;
  if (hasSeenAuthNonce(nonceKey)) {
    return false;
  }

  const body = await c.req.raw.clone().text();
  const bodyHash = createHash('sha256').update(body).digest('hex');
  const requestUrl = new URL(c.req.url);
  const expectedSignature = signRequest({
    authToken,
    bodyHash,
    deviceId,
    method: c.req.method.toUpperCase(),
    nonce,
    path: `${requestUrl.pathname}${requestUrl.search}`,
    timestamp,
  });

  if (!safeEqual(signature, expectedSignature)) {
    return false;
  }

  rememberAuthNonce(nonceKey, timestampMs + AUTH_TIMESTAMP_WINDOW_MS);
  return true;
}

function signRequest({
  authToken,
  bodyHash,
  deviceId,
  method,
  nonce,
  path,
  timestamp,
}: {
  authToken: string;
  bodyHash: string;
  deviceId: string;
  method: string;
  nonce: string;
  path: string;
  timestamp: string;
}): string {
  return createHmac('sha256', authToken)
    .update([method, path, timestamp, nonce, bodyHash, deviceId].join('\n'))
    .digest('hex');
}

function hasSeenAuthNonce(key: string): boolean {
  pruneExpiredAuthNonces();
  return seenAuthNonces.has(key);
}

function rememberAuthNonce(key: string, expiresAt: number) {
  seenAuthNonces.set(key, expiresAt);
  pruneExpiredAuthNonces();
}

function pruneExpiredAuthNonces() {
  const now = Date.now();
  for (const [key, expiresAt] of seenAuthNonces) {
    if (expiresAt <= now) {
      seenAuthNonces.delete(key);
    }
  }
}

function isValidDeviceId(value: string): boolean {
  return /^[A-Za-z0-9._:-]{8,128}$/.test(value);
}

function isValidNonce(value: string): boolean {
  return /^[A-Za-z0-9_-]{16,128}$/.test(value);
}

function isValidSignature(value: string): boolean {
  return /^[a-f0-9]{64}$/i.test(value);
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
