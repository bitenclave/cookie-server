import { readEnv } from '../config/env.js';
import { getSqlClient } from './client.js';

let migrationPromise: Promise<void> | null = null;

export function ensureDatabase(): Promise<void> {
  if (!readEnv().autoMigrate) {
    return Promise.resolve();
  }
  migrationPromise ||= runSchemaMigration();
  return migrationPromise;
}

async function runSchemaMigration(): Promise<void> {
  const sql = getSqlClient();
  await createRelationIfMissing('profiles', () => sql`
    CREATE TABLE profiles (
      id uuid PRIMARY KEY,
      name text NOT NULL,
      group_name text NOT NULL DEFAULT 'Default',
      cookies jsonb NOT NULL DEFAULT '[]'::jsonb,
      cookie_count integer NOT NULL DEFAULT 0,
      domains text[] NOT NULL DEFAULT ARRAY[]::text[],
      tags text[] NOT NULL DEFAULT ARRAY[]::text[],
      created_at timestamptz NOT NULL DEFAULT now(),
      updated_at timestamptz NOT NULL DEFAULT now()
    )
  `);
  await createRelationIfMissing('profiles_name_idx', () => sql`
    CREATE INDEX profiles_name_idx ON profiles (lower(name))
  `);
  await createRelationIfMissing('profiles_group_name_idx', () => sql`
    CREATE INDEX profiles_group_name_idx ON profiles (lower(group_name))
  `);
  await createRelationIfMissing('profiles_domains_idx', () => sql`
    CREATE INDEX profiles_domains_idx ON profiles USING gin(domains)
  `);
  await createRelationIfMissing('profiles_tags_idx', () => sql`
    CREATE INDEX profiles_tags_idx ON profiles USING gin(tags)
  `);
  await createRelationIfMissing('profiles_updated_at_idx', () => sql`
    CREATE INDEX profiles_updated_at_idx ON profiles (updated_at)
  `);
}

async function createRelationIfMissing(
  name: string,
  create: () => Promise<unknown>
): Promise<void> {
  if (await relationExists(name)) {
    return;
  }
  try {
    await create();
  } catch (error) {
    if (!isDuplicateRelationError(error)) {
      throw error;
    }
  }
}

async function relationExists(name: string): Promise<boolean> {
  const sql = getSqlClient();
  const rows = await sql<{ exists: boolean }[]>`
    SELECT to_regclass(${name}) IS NOT NULL AS exists
  `;
  return Boolean(rows[0]?.exists);
}

function isDuplicateRelationError(error: unknown): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    error.code === '42P07'
  );
}
