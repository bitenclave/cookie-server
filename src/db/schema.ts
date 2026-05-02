import { sql } from 'drizzle-orm';
import {
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  uuid,
} from 'drizzle-orm/pg-core';

import type { StoredCookie } from '../profiles/profileTypes.js';

export const profiles = pgTable('profiles', {
  id: uuid('id').primaryKey(),
  name: text('name').notNull(),
  groupName: text('group_name').notNull().default('Default'),
  cookies: jsonb('cookies').$type<StoredCookie[]>().notNull(),
  cookieCount: integer('cookie_count').notNull().default(0),
  domains: text('domains').array().notNull().default(sql`ARRAY[]::text[]`),
  tags: text('tags').array().notNull().default(sql`ARRAY[]::text[]`),
  createdAt: timestamp('created_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export type ProfileRow = typeof profiles.$inferSelect;
export type ProfileInsert = typeof profiles.$inferInsert;
