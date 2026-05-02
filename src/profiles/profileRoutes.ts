import { HTTPException } from 'hono/http-exception';
import { Hono, type Context } from 'hono';
import { z, type ZodSchema } from 'zod';

import { ProfileService } from './profileService.js';
import {
  listQuerySchema,
  profilePayloadSchema,
  replaceProfilesSchema,
} from './profileValidators.js';

export function createProfileRoutes(service = new ProfileService()) {
  const routes = new Hono();

  routes.get('/', async c => {
    const query = listQuerySchema.parse(c.req.query());
    return c.json(await service.list(query));
  });

  routes.get('/groups', async c => {
    const result = await service.list({});
    return c.json({ groups: result.groups });
  });

  routes.post('/', async c => {
    const input = await parseBody(c, profilePayloadSchema);
    return c.json({ profile: await service.create(input) }, 201);
  });

  routes.put('/', async c => {
    const input = await parseBody(c, replaceProfilesSchema);
    return c.json(await service.replaceAll(input.profiles));
  });

  routes.put('/:id', async c => {
    const input = await parseBody(c, profilePayloadSchema);
    const profile = await service.update(c.req.param('id'), input);
    if (!profile) {
      throw new HTTPException(404, { message: 'Profile not found' });
    }
    return c.json({ profile });
  });

  routes.delete('/:id', async c => {
    if (!(await service.delete(c.req.param('id')))) {
      throw new HTTPException(404, { message: 'Profile not found' });
    }
    return c.json({ ok: true });
  });

  return routes;
}

async function parseBody<T>(c: Context, schema: ZodSchema<T>) {
  try {
    return schema.parse(await c.req.json());
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new HTTPException(400, { message: error.issues[0]?.message });
    }
    throw new HTTPException(400, { message: 'Invalid JSON body' });
  }
}
