import { z } from 'zod';

const cookieSchema = z
  .object({
    domain: z.string().optional(),
    expirationDate: z.number().nullable().optional(),
    hostOnly: z.boolean().optional(),
    httpOnly: z.boolean().optional(),
    name: z.string().optional(),
    path: z.string().optional(),
    sameSite: z.string().nullable().optional(),
    secure: z.boolean().optional(),
    session: z.boolean().optional(),
    storeId: z.string().nullable().optional(),
    value: z.string().optional(),
  })
  .passthrough();

export const profilePayloadSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().trim().min(1).max(120),
  group: z.string().trim().max(80).optional(),
  groupName: z.string().trim().max(80).optional(),
  cookies: z.array(cookieSchema).max(5000),
  tags: z.array(z.string().trim().min(1).max(40)).max(20).optional(),
});

export const replaceProfilesSchema = z.object({
  profiles: z.array(profilePayloadSchema).max(1000),
});

export const listQuerySchema = z.object({
  domain: z.string().trim().max(253).optional(),
  group: z.string().trim().max(80).optional(),
  q: z.string().trim().max(120).optional(),
  sort: z.enum(['count', 'group', 'name', 'updated']).optional(),
  tag: z.string().trim().max(40).optional(),
});
