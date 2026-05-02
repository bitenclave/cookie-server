# Cookie-Editor Server

Self-hosted profile storage for Cookie-Editor. It uses Hono, Drizzle ORM, and
PostgreSQL, with bearer-token auth for every `/api/*` route.

This repository is the optional cloud profile backend for the BitEnclave
Cookie-Editor browser extension:

https://github.com/bitenclave/cookie-editor

Use `cookie-editor` for the browser extension and `cookie-server` when you want
saved cookie profiles to sync through your own server instead of local browser
extension storage.

## Why the table is wider than two columns

The server still stores cookies as a JSONB array in one `profiles` table, but a
two-column `name + cookies` table makes search, grouping, sync, and future
conflict handling weak. The implemented schema adds profile metadata:

- `id`, `name`, `group_name`
- `cookies` JSONB
- `cookie_count`, `domains`, `tags`
- `created_at`, `updated_at`

This keeps cookie storage simple while making profile search and filtering fast.

## Local Development

```sh
npm install
cp .env.example .env
npm run dev
```

Set `DATABASE_URL` and a long `AUTH_TOKEN`. The server creates the table and
indexes automatically unless `DB_AUTO_MIGRATE=false`.

In the extension, open Profiles, scroll to Profile storage, choose Cloud, then
enter this server's public URL and the same bearer token.

## API

All API requests need `Authorization: Bearer <AUTH_TOKEN>`.

- `GET /health`
- `GET /api/profiles?q=&group=&domain=&tag=&sort=updated|name|group|count`
- `POST /api/profiles`
- `PUT /api/profiles/:id`
- `PUT /api/profiles` to replace the full profile set
- `DELETE /api/profiles/:id`

## Deploy

Render can provision the free web service and free Postgres database from
`render.yaml`:

[![Deploy to Render](https://render.com/images/deploy-to-render-button.svg)](https://render.com/deploy)

For Vercel:

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/bitenclave/cookie-server&root-directory=cookie-server&env=DATABASE_URL,AUTH_TOKEN)


Railway and Fly are configured with `railway.json`, `Dockerfile`, and
`fly.toml`. Add a PostgreSQL service, set `DATABASE_URL` and `AUTH_TOKEN`, then
deploy.

Render Free Postgres currently expires after 30 days, so use a persistent paid
database or another free Postgres provider for anything you cannot lose.
