import { randomUUID } from 'node:crypto';

import type { ProfileInsert, ProfileRow } from '../db/schema.js';
import type { ProfileDto, ProfileInput, StoredCookie } from './profileTypes.js';

const DEFAULT_GROUP = 'Default';

export function toProfileInsert(input: ProfileInput): ProfileInsert {
  const now = new Date();
  const cookies = input.cookies || [];
  return {
    id: input.id || randomUUID(),
    name: input.name.trim(),
    groupName: normalizeGroup(input.group ?? input.groupName),
    cookies,
    cookieCount: cookies.length,
    domains: extractDomains(cookies),
    tags: normalizeTags(input.tags),
    createdAt: now,
    updatedAt: now,
  };
}

export function toProfileDto(row: ProfileRow): ProfileDto {
  return {
    id: row.id,
    name: row.name,
    group: row.groupName,
    groupName: row.groupName,
    cookies: row.cookies,
    cookieCount: row.cookieCount,
    domains: row.domains,
    tags: row.tags,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

export function extractDomains(cookies: StoredCookie[]): string[] {
  const domains = new Set<string>();
  for (const cookie of cookies) {
    const normalized = normalizeDomain(cookie.domain);
    if (normalized) {
      domains.add(normalized);
    }
  }
  return [...domains].sort((a, b) => a.localeCompare(b));
}

export function normalizeDomain(domain?: string): string {
  return String(domain || '')
    .trim()
    .replace(/^\./, '')
    .toLowerCase();
}

function normalizeGroup(value?: string): string {
  const group = String(value || '').trim();
  return group || DEFAULT_GROUP;
}

function normalizeTags(tags?: string[]): string[] {
  if (!Array.isArray(tags)) {
    return [];
  }
  const cleaned = tags.map(tag => tag.trim()).filter(Boolean);
  return [...new Set(cleaned)].slice(0, 20);
}
