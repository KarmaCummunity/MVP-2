# share-post — OG-preview Edge Function

Serves the link that the mobile app's share button (FR-POST-023) hands to
WhatsApp / Twitter / Telegram / Facebook / LinkedIn / iMessage / Signal /
etc. so they can render an image preview of the post.

```
GET /functions/v1/share-post/<post_id>
```

## Two response shapes

| Caller                      | UA matches `BOT_UA`? | Response                                                                  |
| --------------------------- | -------------------- | ------------------------------------------------------------------------- |
| Social-app crawler          | yes                  | `200 OK` with HTML carrying `og:image`, `og:title`, `og:description`, etc |
| Human (browser / app open)  | no                   | `302 Found → https://karma-community-kc.com/post/<post_id>`               |

Only **`Public` + `open`** posts reveal their title / image. Anything else
returns the generic OG card pointing at the marketing landing.

## Deploy

```bash
# from the repo root
supabase functions deploy share-post --project-ref <ref>
```

The `verify_jwt = false` flag in `supabase/config.toml` makes the function
publicly callable so social crawlers (which never send an `Authorization`
header) reach the OG body. Visibility is re-checked inside the function
against the service-role-key client.

## Required env (set in the Supabase dashboard → Project → Edge Functions → Secrets)

| Var                            | Purpose                                                                |
| ------------------------------ | ---------------------------------------------------------------------- |
| `SUPABASE_URL`                 | Auto-injected; used to compose the public storage URL for OG images.   |
| `SUPABASE_SERVICE_ROLE_KEY`    | Auto-injected; reads `posts` + `media_assets` bypassing RLS.           |
| `SHARE_POST_APP_BASE_URL`      | Optional. Defaults to `https://karma-community-kc.com`. Used for the human-redirect target + canonical URL. |
| `SHARE_POST_FALLBACK_IMAGE`    | Optional. Defaults to `${APP_BASE_URL}/pwa-icon-512.png` (the 512×512 community logo checked into `apps/mobile/public/`). Used when the post has no media (e.g. Request posts without images) or when the post is private / not found. |

## Verifying after deploy

```bash
# 1. Bot-style UA → expect HTML with the post's image in og:image.
curl -sS -A 'WhatsApp/2.0' \
  "https://<ref>.supabase.co/functions/v1/share-post/<existing_public_open_post_id>" \
  | grep 'og:image'

# 2. Browser-style UA → expect 302 to /post/<id> on the app domain.
curl -sS -o /dev/null -w "%{http_code} %{redirect_url}\n" \
  -A 'Mozilla/5.0' \
  "https://<ref>.supabase.co/functions/v1/share-post/<existing_public_open_post_id>"
```

## Why this endpoint and not the SPA route?

`https://karma-community-kc.com/post/<id>` is the deep link the app opens
on install (claimed by AASA + assetlinks). But the host serves a single
static SPA `index.html` whose `<head>` is the same for every route, so
WhatsApp / Twitter only see the site favicon — no per-post image, no
post title. This Edge Function is the only surface in the stack that
can answer with a per-post OG card today.

If the marketing host later adds SSR or a per-route rewrite that does the
same OG render, set `EXPO_PUBLIC_SHARE_BASE_URL=https://karma-community-kc.com/p`
in the mobile env so the share URL becomes the prettier `…/p/<id>` form.
Until then, leave the override unset and the mobile app routes shares
through `${SUPABASE_URL}/functions/v1/share-post/<id>` automatically.
