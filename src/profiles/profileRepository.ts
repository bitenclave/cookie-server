import { and, asc, desc, eq, ilike, sql } from 'drizzle-orm';

import { getDb } from '../db/client.js';
import { ensureDatabase } from '../db/migrations.js';
import { profiles } from '../db/schema.js';
import { normalizeDomain, toProfileInsert } from './profileMapper.js';
import type {
  GroupSummary,
  ProfileFilters,
  ProfileInput,
} from './profileTypes.js';

export class ProfileRepository {
  async list(filters: ProfileFilters = {}) {
    await ensureDatabase();
    const where = buildWhere(filters);
    return getDb()
      .select()
      .from(profiles)
      .where(where)
      .orderBy(...getOrder(filters.sort));
  }

  async groups(): Promise<GroupSummary[]> {
    await ensureDatabase();
    const rows = await getDb()
      .select({
        name: profiles.groupName,
        profileCount: sql<number>`count(*)::int`,
        cookieCount: sql<number>`coalesce(sum(${profiles.cookieCount}), 0)::int`,
      })
      .from(profiles)
      .groupBy(profiles.groupName)
      .orderBy(asc(profiles.groupName));
    return rows;
  }

  async create(input: ProfileInput) {
    await ensureDatabase();
    const [row] = await getDb()
      .insert(profiles)
      .values(toProfileInsert(input))
      .returning();
    return row;
  }

  async update(id: string, input: ProfileInput) {
    await ensureDatabase();
    const { createdAt: _createdAt, id: _nextId, ...values } =
      toProfileInsert(input);
    const [row] = await getDb()
      .update(profiles)
      .set({ ...values, updatedAt: new Date() })
      .where(eq(profiles.id, id))
      .returning();
    return row ?? null;
  }

  async replaceAll(inputs: ProfileInput[]) {
    await ensureDatabase();
    const values = inputs.map(input => toProfileInsert(input));
    return getDb().transaction(async tx => {
      await tx.delete(profiles);
      if (!values.length) {
        return [];
      }
      return tx.insert(profiles).values(values).returning();
    });
  }

  async delete(id: string): Promise<boolean> {
    await ensureDatabase();
    const rows = await getDb()
      .delete(profiles)
      .where(eq(profiles.id, id))
      .returning({ id: profiles.id });
    return rows.length > 0;
  }
}

function buildWhere(filters: ProfileFilters) {
  const conditions = [
    filters.group ? ilike(profiles.groupName, filters.group) : undefined,
    filters.domain ? domainCondition(filters.domain) : undefined,
    filters.tag ? tagCondition(filters.tag) : undefined,
    filters.q ? searchCondition(filters.q) : undefined,
  ].filter(Boolean);
  return conditions.length ? and(...conditions) : undefined;
}

function domainCondition(domain: string) {
  return sql`${profiles.domains} @> ARRAY[${normalizeDomain(domain)}]::text[]`;
}

function tagCondition(tag: string) {
  return sql`${profiles.tags} @> ARRAY[${tag.trim()}]::text[]`;
}

function searchCondition(query: string) {
  const pattern = `%${query.trim()}%`;
  return sql`
    ${profiles.name} ILIKE ${pattern}
    OR ${profiles.groupName} ILIKE ${pattern}
    OR EXISTS (
      SELECT 1 FROM jsonb_array_elements(${profiles.cookies}) AS cookie
      WHERE cookie->>'name' ILIKE ${pattern}
        OR cookie->>'domain' ILIKE ${pattern}
        OR cookie->>'path' ILIKE ${pattern}
    )
  `;
}

function getOrder(sort: ProfileFilters['sort'] = 'updated') {
  if (sort === 'name') {
    return [asc(profiles.name)];
  }
  if (sort === 'group') {
    return [asc(profiles.groupName), asc(profiles.name)];
  }
  if (sort === 'count') {
    return [desc(profiles.cookieCount), asc(profiles.name)];
  }
  return [desc(profiles.updatedAt), asc(profiles.name)];
}
