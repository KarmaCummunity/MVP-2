# Pro Share-Post Design

> **Status:** Draft, pending PM approval.
> **Spec target:** `docs/SSOT/spec/04_posts.md` § FR-POST-023.
> **Backlog target:** `docs/SSOT/BACKLOG.md` P2.33.
> **Context:** Replaces the reverted implementation (commits #356–#366, reverted in `81b96d6 chore: revert dev branch to df0f199`). The reverted version leaked the Supabase project domain into the user-visible share URL and shipped a duplicated link in WhatsApp. This design eliminates both classes of bug at the architecture level by removing Supabase from the URL path entirely.

---

## 1. Goal

A signed-in viewer of a `Public`, `open` post can tap a share button on the post-detail screen and produce a WhatsApp / Telegram / iMessage / Signal-ready share whose preview shows the post's first image, whose body lists every relevant post field in Hebrew, and whose URL is hosted on `karma-community-kc.com` — never on `*.supabase.co`. The receiver tapping the URL opens the post directly: in the mobile app via universal link when installed, otherwise in the web app at the same URL. No paid subscription (Supabase Pro, Cloudflare Pro, etc.) is required to operate.

## 2. Non-goals

- Short URLs (`kc.me/<short>`) — out of scope; the canonical `/post/<uuid>` is the only URL.
- OG image composition (logo overlay, branded "card" image) — out of scope; the post's first image is served as-is.
- Share analytics — out of scope.
- Sharing private (`OnlyMe`, `FollowersOnly`) or non-`open` posts — explicitly excluded; the share affordance is hidden.

## 3. URL architecture

**Canonical URL:** `https://karma-community-kc.com/post/<post-uuid>`

This is the same URL the in-app deep link uses, the same URL the AASA / assetlinks claim covers (TD-66), and the same URL the web SPA renders. One URL, one host, no redirect chain.

**How requests are served.** The Railway web service stops running `serve dist --single` and runs a tiny Hono server (`hono` + `@hono/node-server`, ~60 LOC) that:

| Request | UA matches crawler regex? | Response |
|---|---|---|
| `GET /post/:id` | yes (`WhatsApp`, `Twitterbot`, `TelegramBot`, `facebookexternalhit`, `Slackbot`, `LinkedInBot`, `SkypeUriPreview`, `Discordbot`, `Applebot`, `googlebot`, `bingbot`, etc.) | `200 text/html` OG stub built from a Supabase REST read using the **anon key** (RLS gates the read to `Public + open`). Headers: `Cache-Control: public, max-age=300, s-maxage=300`, `Content-Type: text/html; charset=utf-8`, `X-Content-Type-Options: nosniff`. |
| `GET /post/:id` | no | `200 text/html` returning the SPA `index.html`. Expo Router takes over and renders post detail. |
| Any other path | n/a | Static file from `dist/` if it exists, else SPA fallback (`index.html`). |

**Why no Supabase Edge Function.** The previous version routed crawlers through `<ref>.supabase.co/functions/v1/share-post/<id>`. That URL appeared in WhatsApp's preview card's "via" line, in OG `og:url` (before the 302), and in the redirect chain. Moving OG rendering into the Railway server eliminates every place Supabase could surface.

**Why no `serve.json` / `_redirects`.** The Hono server replaces both. `app/scripts/web-postbuild.mjs` is simplified accordingly (still emits `_redirects` so Cloudflare Pages remains a valid alternate target, but the `/p/:id` redirect line is removed). `EXPO_PUBLIC_SHARE_BASE_URL` is deleted.

**Failure modes on the Railway side:**

| Condition | Crawler response | Human response |
|---|---|---|
| Supabase REST returns 0 rows (post not found, or filtered out by RLS for not being `Public + open`) | Generic OG card linking to `https://karma-community-kc.com/` | SPA `index.html` (SPA renders "not found" UX) |
| Supabase REST times out after 2 s | Generic OG card | SPA `index.html` |
| Invalid UUID shape | Generic OG card | SPA `index.html` |

The generic card uses the site logo from `apps/mobile/public/pwa-icon-512.png` as `og:image`, the app name as title, and the marketing tagline as description.

## 4. The share message body

Composed by `buildPostShareMessage` (pure function, vitest unit tests) from the post's domain fields. The fields appear in this fixed order; lines are separated by `\n`. Labels are wrapped in `*…*` so WhatsApp / Telegram / Signal render them bold; receivers that don't parse markdown see visible asterisks (still readable). The body is in Hebrew; all literal strings come from i18n locale keys.

```
<headline>

*כותרת:* <title>
*תיאור:* <description>      ← omitted only when post.description is null/empty
*קטגוריה:* <category>       ← always included; renders "אחר" when category is "Other"
*מיקום:* <addressLine>
*פורסם:* <relativeTime>

<cta>
https://karma-community-kc.com/post/<id>
```

**Field-by-field rules:**

| Field | Source | Rendering rule |
|---|---|---|
| headline | `t('post.detail.shareHeadlineGive')` / `…ShareHeadlineRequest` | Per-type cue: `🎁 חפץ שמחכה לבית חדש בקהילת קארמה` for `Give`, `🔍 בקשה לעזרה מקהילת קארמה` for `Request`. |
| title | `post.title` | Trimmed; no truncation (titles are already capped at the input layer). |
| description | `post.description` | Trimmed, truncated to **200 chars** with trailing `…`. Whole line omitted when null / empty. |
| category | `post.category` | Always present, even for `Other`. Translated via `t('post.category.<value>')` locale lookup. |
| address line | `post.address` × `post.locationDisplayLevel` | `CityOnly` → `<city>`; `CityAndStreet` → `<city>, <streetPrefix> <street>`; `Full` → `<city>, <street> <streetNumber>`. Mirrors the helper `postLocationDisplayText` already used on the post-detail screen so the share text and the screen text agree. |
| relative time | `post.createdAt` | `formatDistanceToNow(date, { addSuffix: true, locale: he })` from `date-fns/locale/he`. Example: `לפני יומיים`. |
| CTA | `t('post.detail.shareCtaGive')` / `…ShareCtaRequest` | `אולי זה בדיוק בשבילכם — לחצו לפרטים 👇` / `אם תוכלו לעזור — לחצו לפרטים 👇`. |
| URL | `https://${WEB_BASE_URL}/post/${postId}` | `WEB_BASE_URL` from a single env constant (`EXPO_PUBLIC_WEB_BASE_URL`), defaults to `karma-community-kc.com` in production. |

**Owner display name is NOT included** in the share body. Rationale: the spec doesn't mention it, the post owner is already discoverable by anyone who opens the post, and broadcasting the name in the share body would amount to publishing the post author into chat group histories — a small privacy regression for no spec-stated gain. Reversible if the PM disagrees.

## 5. The share button

A header-right affordance on `app/post/[id].tsx`, rendered alongside the existing `PostMenuButton` (⋮). In the `headerActions` row, `PostShareButton` is **first** so under `forceRTL=true` it visually lands in the trailing (right) corner; `PostMenuButton` sits to its left.

**Visibility gate.** Mounted only when `post.status === 'open' && post.visibility === 'Public'`. Implementation: a pure `canSharePost(post)` predicate. Image presence is intentionally not required — Request posts without media remain shareable (the OG stub falls through to the generic card image; the in-message link still works).

**Press behavior.**

1. Compose `message` via `buildPostShareMessage`.
2. Resolve `imageUrl` from `mediaAssets[0]` when present (public Supabase Storage URL, unauthenticated).
3. Invoke `sharePost({ postId, title, message, remoteImageUrl, webBaseUrl })`.
4. On the returned outcome:
   - `'shared'` → silent success.
   - `'dismissed'` → silent (user cancelled the OS share sheet).
   - `'copied'` → ephemeral toast `הקישור הועתק`.
   - `'failed'` → ephemeral toast `השיתוף נכשל, נסה שוב.`.

**Press-while-busy** is suppressed by an internal `busy` state that disables the button and swaps the icon for an `ActivityIndicator` until the async chain resolves.

**Icon.** `share-outline` on iOS, `share-social-outline` on Android, both from `Ionicons`, sized 22 in `colors.textPrimary`.

## 6. `sharePost()` — platform invocation

Pure function in `app/apps/mobile/src/lib/sharePost.ts`. Returns a `SharePostOutcome` discriminated union; never throws.

**iOS (`Platform.OS === 'ios'`)**

- If `remoteImageUrl` is present, download it into the OS cache via `downloadPostImageForShare` (uses `expo-file-system/legacy`, returns `null` on any failure).
- Image downloaded: `Share.share({ message: '<body>\n<url>', url: <fileUri>, title })`. The `url` field is the local file (iOS attaches the binary). The share URL appears **once**, inline in `message`.
- No image (Request post / download failed): `Share.share({ message: '<body>\n<url>', title })`. `url` field omitted.

**Android (`Platform.OS === 'android'`)**

- `Share.share({ message: '<body>\n<url>', title })`. `url` field **deliberately omitted**: RN's Android `Share` concatenates `url` onto `EXTRA_TEXT` after `message`, which is the bug that produced the duplicated link in WhatsApp in the reverted version's screenshot. The OG preview rendered by the receiving chat surfaces the image — no need to attach the binary.

**Web (`Platform.OS === 'web'`)**

- `navigator.share` present + `navigator.canShare({ files: [imageFile] })` returns true → `navigator.share({ title, text: '<body>\n<url>', url, files: [imageFile] })`. Image file is fetched via `fetch(remoteImageUrl).blob()` → `new File([blob], …)`.
- `navigator.share` present but no file support → `navigator.share({ title, text: '<body>', url })`. The URL field, on web, does **not** get duplicated by browsers, so it's passed as a structured field rather than concatenated into text.
- `navigator.share` missing → `navigator.clipboard.writeText(url)` and return `'copied'`.
- All web failures other than user-cancel (`AbortError`) fall through to clipboard; clipboard failure returns `'failed'`.

**Build URL.** `buildPostShareUrl(postId, webBaseUrl)` returns `${webBaseUrl}/post/${encodeURIComponent(postId)}` with trailing-slash normalization. Throws when either arg is missing — fail loud at the call site rather than letting a malformed URL ship.

## 7. Universal link & unauthenticated landing

**Native universal links.** The `karma-community-kc.com/post/<id>` path is already claimed by AASA (iOS) and assetlinks (Android) per TD-66. Tapping a share URL on a phone with the app installed opens it directly into `app/post/[id].tsx`.

**Unauthenticated landing.** `redirectIntentStore` (Zustand, in-memory only, no persistence) captures the intended path before `AuthGate` redirects to `(auth)`:

- TTL: 10 minutes from capture.
- Restorable path prefixes: `/post/`, `/user/`, `/chat/`. Anything else is ignored (auth / onboarding routes never land in the store).
- `capturePath` is a no-op if the same path is already captured (prevents duplicate writes when `AuthGate` re-runs).
- `consumePath` reads + clears in one call, returning `null` past TTL.
- After successful sign-in / onboarding completion, `AuthGate` consumes the pending path and `router.replace`s to it.

**Web unauthenticated landing.** Same `AuthGate` + `redirectIntentStore` flow — the SPA running on `karma-community-kc.com` is the same Expo bundle as the mobile native build; `AuthGate` mounts and captures the path regardless of platform.

## 8. The Hono server

**File:** `app/apps/mobile/web-server/server.mjs` (sibling of `dist/`, built alongside it).

**Dependencies:**
- `hono` (~30 KB)
- `@hono/node-server` (~10 KB)
- `serve-static` (from `@hono/node-server/serve-static`)

**Behavior outline:**

```js
import { Hono } from 'hono';
import { serve } from '@hono/node-server';
import { serveStatic } from '@hono/node-server/serve-static';

const BOT_UA = /facebookexternalhit|WhatsApp|Twitterbot|TelegramBot|Slackbot|LinkedInBot|SkypeUriPreview|Discordbot|Applebot|googlebot|bingbot|Pinterest|redditbot|Embedly|vkShare/i;
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;
const APP_BASE_URL = process.env.APP_BASE_URL ?? 'https://karma-community-kc.com';
const POST_UUID_REGEX = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;

const app = new Hono();

app.get('/post/:id', async (c) => {
  const id = c.req.param('id');
  const ua = c.req.header('user-agent') ?? '';
  if (!BOT_UA.test(ua)) return c.html(await readIndexHtml());
  if (!POST_UUID_REGEX.test(id)) return c.html(renderGenericOg(), 200, OG_HEADERS);
  const post = await fetchPostForShare(id);  // 2s timeout, returns null on miss/failure
  return c.html(post ? renderPostOg(post) : renderGenericOg(), 200, OG_HEADERS);
});

app.use('/*', serveStatic({ root: './dist' }));
app.get('*', async (c) => c.html(await readIndexHtml()));  // SPA fallback

serve({ fetch: app.fetch, port: Number(process.env.PORT ?? 3000) });
```

`fetchPostForShare` uses `fetch(...)` directly against the Supabase REST endpoint (`/rest/v1/posts?select=...&post_id=eq.<id>&visibility=eq.Public&status=eq.open`) with an `AbortController` set to 2000 ms. No Supabase SDK dependency on the server — keeps the bundle tiny and the runtime fast.

**Dockerfile change.** Stage 2 runtime becomes:

```dockerfile
FROM node:20-alpine AS runner
WORKDIR /srv
COPY --from=builder /repo/app/apps/mobile/dist ./dist
COPY --from=builder /repo/app/apps/mobile/web-server/server.mjs ./server.mjs
COPY --from=builder /repo/app/apps/mobile/web-server/package.json ./package.json
RUN npm install --omit=dev
ENV PORT=3000
EXPOSE 3000
CMD ["node", "server.mjs"]
```

`web-server/package.json` declares `hono` and `@hono/node-server` as deps. The build stage's monorepo `pnpm install` already populates them when the workspace package picks them up.

## 9. Environment variables

**Mobile app build-time (`EXPO_PUBLIC_*`):**

| Var | Required | Purpose |
|---|---|---|
| `EXPO_PUBLIC_SUPABASE_URL` | yes | Existing — image storage URLs. |
| `EXPO_PUBLIC_SUPABASE_ANON_KEY` | yes | Existing. |
| `EXPO_PUBLIC_WEB_BASE_URL` | yes | New. Used by `sharePost` to build `https://<host>/post/<id>`. Defaults to `https://karma-community-kc.com` when unset (with a `console.warn` in dev). |

**Deleted:** `EXPO_PUBLIC_SHARE_BASE_URL` (the old override mechanism). The new URL is always `${EXPO_PUBLIC_WEB_BASE_URL}/post/<id>`.

**Railway web service runtime:**

| Var | Required | Purpose |
|---|---|---|
| `SUPABASE_URL` | yes | Hono server's REST calls (note: no `EXPO_PUBLIC_` prefix because this is server-side). |
| `SUPABASE_ANON_KEY` | yes | Same. RLS-respecting reads. |
| `APP_BASE_URL` | optional | Default `https://karma-community-kc.com`. Used in `og:url` + canonical link. |
| `PORT` | optional | Default `3000`. |

## 10. Acceptance criteria

- **AC1.** Header-right share button on post detail. Trailing corner under RTL. Visible iff `post.status === 'open' && post.visibility === 'Public'`. Image presence not required.
- **AC2.** Tapping opens the OS share sheet. Message body matches §4 exactly (headline, title, description-if-present, category, address-per-displayLevel, posted-at, CTA, URL). Link appears in the share message exactly once on every platform.
- **AC3.** Share URL is `https://karma-community-kc.com/post/<id>` — never `*.supabase.co`. Verified by integration test on `sharePost` and by manual smoke on the iOS / Android / Web targets.
- **AC4.** When a crawler (UA matching the BOT regex) fetches `https://karma-community-kc.com/post/<id>` for a `Public + open` post, the response is HTML with `og:title`, `og:description`, `og:image` (= `mediaAssets[0]`), `og:url`, `og:locale=he_IL`, `twitter:card=summary_large_image`. Non-`Public+open` posts and not-found return a generic card.
- **AC5.** When a human (UA not matching BOT regex) fetches the same URL, the response is the SPA `index.html`. Expo Router renders the post detail screen.
- **AC6.** Unauthenticated landing on `/post/<id>` (native universal link or web direct nav): `AuthGate` captures the path before redirecting to `(auth)`, persists for 10 min, and `router.replace`s to the captured path after sign-in completion.
- **AC7.** OG image is the public Supabase Storage URL for `mediaAssets[0].path`. When the post has no media, the OG image is `${APP_BASE_URL}/pwa-icon-512.png`.
- **AC8.** Share emits no `audit_event`. No DB mutation. No network call from the client at share time (the Hono server is hit only when the recipient opens the link).

## 11. Edge cases

| Case | Behavior |
|---|---|
| Post deleted between share and link-open | Crawler gets generic card. Human gets SPA → app renders "not found". |
| Post closed between share and link-open | Same as above — the Hono server's `visibility=eq.Public&status=eq.open` filter excludes the row. |
| User offline at share time | OS share sheet still opens (no network needed). URL still copied / shared. Receiver's connectivity governs link resolution. |
| Image download failure on iOS | Fall back to URL-only share. The OG card on the receiver still renders the image. |
| Hono server down (Railway outage) | Same blast radius as the rest of the web app — already a single point of failure. Monitor via Railway alerts. |
| Crawler from an old version of WhatsApp uses `User-Agent: WhatsApp/2.0…` | Regex matches `WhatsApp` case-insensitively. Covered. |

## 12. Testing

**Unit (vitest, in `apps/mobile`):**

- `buildPostShareMessage.test.ts` — composition rules:
  - `Give` headline + CTA vs `Request` headline + CTA.
  - Description present vs null vs empty vs >200 chars (truncation).
  - Category `Other` is included (regression on the reverted version's "omit Other" rule).
  - Address rendering per each `locationDisplayLevel`.
  - Posted-at relative time format.
- `sharePost.test.ts`:
  - iOS with image → `Share.share` called with `url: <fileUri>`, `message` containing URL once.
  - iOS without image → `Share.share` called without `url`, message containing URL once.
  - Android (with and without image) → `Share.share` called without `url`, message containing URL once.
  - Web with Web Share Level 2 → `navigator.share({ files })`.
  - Web without Web Share Level 2 → `navigator.share({ title, text, url })`.
  - Web without `navigator.share` → `navigator.clipboard.writeText`, outcome `'copied'`.
  - Web with `AbortError` → outcome `'dismissed'`.
- `redirectIntentStore.test.ts` — capture / consume / TTL / restorable-path guard.

**Integration (Hono server):**

- `web-server/server.test.mjs` (or co-located in `apps/mobile`):
  - `GET /post/<valid-uuid>` with `User-Agent: WhatsApp/2.0` against a mocked Supabase REST → response body contains `og:image` referencing the post's first media path.
  - Same request with `User-Agent: Mozilla/…` → response body is the SPA `index.html`.
  - `GET /post/<invalid-id>` with bot UA → generic OG card.
  - `GET /assets/foo.png` → static file served, content-type correct.

**Manual smoke (after merge to dev, before merge to main):**

- Open a real `Public + open` post on a dev iOS device. Tap share. Send to a WhatsApp contact. Verify: preview shows post image + title + description, URL reads `https://karma-community-kc.com/post/<id>`, link appears once in the message body.
- Repeat on Android. Verify same.
- Open the same URL in a fresh incognito browser (logged out). Verify: AuthGate redirects to `(auth)`. Sign in. Verify post-detail screen loads.
- Tap the WhatsApp link on an iOS device with the app installed. Verify: universal link opens the app directly into the post.

## 13. SSOT updates

- `docs/SSOT/spec/04_posts.md` § FR-POST-023 — replace the existing v0.9–v0.12 section with the new architecture, update version history to v0.13. Status remains 🟡 In progress until merged, flips to ✅ on merge.
- `docs/SSOT/BACKLOG.md` P2.33 — update one-line summary to reflect the new architecture; flip to ✅ Done on merge.
- `docs/SSOT/DECISIONS.md` — add `D-NN: Pro share-post serves OG meta from the Railway web server, not a Supabase Edge Function` with the one-paragraph rationale (single canonical URL = `kc.com/post/<id>`, eliminates the Supabase-domain-in-URL class of bug).
- `docs/SSOT/TECH_DEBT.md` — no new TDs from this work itself, but close any reverted-implementation residue if discovered.

## 14. Rollout

Single PR `feat/FR-POST-023-pro-share-post` → `dev` → squash-merge → CI green → deploy to dev Railway → manual smoke on dev → squash `dev` → `main` → prod Railway redeploys automatically. No DB migrations. No Supabase function deploys. No env-var changes on the mobile side beyond the one new `EXPO_PUBLIC_WEB_BASE_URL`.

## 15. Risk

Low. The Hono server is small and well-trodden code. The biggest risk is a Railway runtime regression — mitigated by:

- The Hono server's only dynamic route is `/post/:id`; everything else is static-file serving identical to today's `serve` behavior.
- Hono + `@hono/node-server` is a mature pair, used in production by many teams.
- Manual smoke on dev Railway before promoting to main.

If the Hono server fails to boot in prod, the immediate rollback is to revert the single PR — same as any other web-app change.

---

## Open questions

None. All decisions captured above are CTO-side; PM may push back on any of them at review.
