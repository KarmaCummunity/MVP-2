# Web Server — Hono runtime for karma-community-kc.com

Replaces `serve dist --single`. Serves the Expo web bundle from `dist/`,
plus a tiny dynamic route at `/post/:id` that branches on User-Agent:

- Crawler (`WhatsApp`, `Twitterbot`, ...) → OG meta stub built from a
  Supabase REST read (anon key, RLS-gated to `Public + open` posts).
- Human UA → SPA `index.html`.
- Everything else → static file from `dist/`, SPA fallback to `index.html`.

## Required environment variables

| Var                  | Required | Purpose |
|----------------------|----------|---------|
| `SUPABASE_URL`       | yes      | REST endpoint host (no `EXPO_PUBLIC_` prefix — server-side). |
| `SUPABASE_ANON_KEY`  | yes      | Anon-key reads (RLS gates Public+open). |
| `APP_BASE_URL`       | no       | Defaults to `https://karma-community-kc.com`. Used for `og:url` + canonical link. |
| `PORT`               | no       | Defaults to `3000`. |
| `WEB_DIST_DIR`       | no       | Defaults to `./dist`. Overridable for tests. |

## Run locally

```bash
node server.mjs
```

## Tests

```bash
node --test server.test.mjs
```
