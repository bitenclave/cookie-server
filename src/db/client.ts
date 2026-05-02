import { drizzle, type PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import postgres, { type Sql } from 'postgres';

import { readEnv } from '../config/env.js';
import * as schema from './schema.js';

let client: Sql | null = null;
let db: PostgresJsDatabase<typeof schema> | null = null;

export function getSqlClient(): Sql {
  if (client) {
    return client;
  }
  const env = readEnv();
  if (!env.databaseUrl) {
    throw new Error('DATABASE_URL is not configured');
  }
  client = postgres(env.databaseUrl, {
    connect_timeout: env.dbConnectTimeout,
    max: env.dbMaxConnections,
    prepare: false,
  });
  return client;
}

export function getDb(): PostgresJsDatabase<typeof schema> {
  if (!db) {
    db = drizzle(getSqlClient(), { schema });
  }
  return db;
}

export async function closeDb(): Promise<void> {
  if (client) {
    await client.end({ timeout: 5 });
  }
  client = null;
  db = null;
}
