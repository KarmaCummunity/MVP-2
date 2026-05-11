# Part V — External Interfaces

[← back to SRS index](../SRS.md) · [← back to Part IV](./04_non_functional/README.md)

---

This part describes the external systems the MVP integrates with — what services we use, what surface they expose to our application, and what contractual guarantees we depend on. It does **not** include implementation patterns (those live in `CODE_QUALITY.md`).

The MVP is built on **Supabase** as the unified backend (`D-2`) and on platform-native push and deep-link facilities. There are **no** other third-party integrations in MVP.

---

## 5.1 Supabase Auth

**Used for.** All four authentication methods (`FR-AUTH-002..006`).

**What we depend on.**

- OAuth 2.0 / OIDC via Supabase's built-in providers for Google and Apple.
- Phone OTP through Supabase's SMS adapter (Twilio-backed in production).
- Email + password with email verification through Supabase's email adapter.
- JWT issuance and refresh.

**Surfaces in our domain.**

- Sign-up creates an entry in Supabase's `auth.users` table; we mirror identity into our `User` aggregate via a database trigger or Edge Function (the choice and exact mapping is documented in `CODE_QUALITY.md`).
- Sign-in surfaces a session JWT used by every subsequent request to Postgres, Storage, Realtime, and Edge Functions.

**Contractual notes.**

- We **do not** use Supabase magic-link auth in MVP.
- We **do not** use Supabase's "anonymous user" option; guests interact through unauthenticated REST reads only (limited by RLS to the guest preview window).
- The Supabase anon key is shipped on Web; it must have read-only RLS scope on the guest-visible subset.

---

## 5.2 Supabase Postgres + RLS

**Used for.** Persistent storage of every aggregate in [`03_domain_model.md`](./03_domain_model.md).

**What we depend on.**

- Postgres 15+ with the `pgcrypto`, `uuid-ossp`, `pg_trgm`, `unaccent`, and `pg_stat_statements` extensions enabled.
- Row-Level Security policies as the authoritative authorization layer (`NFR-SEC-002`).
- `pg_cron` for scheduled jobs (post expiry, soft-delete cleanup, stats recompute, token prune) — see [`06_cross_cutting/05_background_jobs.md`](./06_cross_cutting/05_background_jobs.md).
- Read replicas (added when `NFR-SCALE-001` requires them; not at MVP launch).

**Surfaces in our domain.**

- The `infrastructure-supabase` package owns the SQL schema, RLS policies, indexes, materialized views, and DB functions. The application layer never issues raw SQL outside this package.

**Contractual notes.**

- The DDL is exhaustively defined in `CODE_QUALITY.md` and version-controlled as Supabase migrations.
- Every schema change is paired with an SRS update if it affects observable behavior (`NFR-MAINT-015`).

---

## 5.3 Supabase Storage

**Used for.** Image storage for `Post.media_assets[]` and `User.avatar_url`.

**What we depend on.**

- One bucket `post-images` with per-post sub-paths.
- One bucket `avatars` with per-user paths.
- Image transformations (size variants) via Supabase Storage's built-in image-resize endpoint, preferred over manual derivatives.
- Direct-upload presigned URLs to bypass server-side bandwidth.

**Surfaces in our domain.**

- The application layer requests a signed upload URL, receives client-uploaded results, and persists `MediaAsset` rows referencing the storage path.
- RLS on the storage objects mirrors the post visibility rules so that a forbidden viewer cannot fetch a private image directly.

**Contractual notes.**

- EXIF stripping is performed via an Edge Function on upload (`NFR-PRIV-002`).
- Original image is retained at most **30 days** after a post moves to a terminal state, then garbage-collected.
- Maximum object size: 8 MB post-resize (`FR-POST-005`).

---

## 5.4 Supabase Realtime

**Used for.** Live updates of:

- Chat messages (`FR-CHAT-003`, `FR-CHAT-012`).
- Follow requests and approvals (`FR-NOTIF-006`, `FR-NOTIF-008`).
- New public posts in the feed (`FR-FEED-009`).
- Stat counter changes on the personal stats screen (`FR-STATS-001`).

**What we depend on.**

- Postgres logical replication piped through Supabase Realtime servers.
- WebSocket subscription tokens scoped per-user and per-channel.
- "Broadcast" channels for non-database events (e.g., system-wide announcements; not used in MVP, reserved).

**Surfaces in our domain.**

- The infrastructure layer exposes a `RealtimeChannel` adapter that delivers strongly-typed events to the application layer, where they map back to domain commands and projections.

**Contractual notes.**

- We do not depend on absolute event ordering across **different** aggregates — only within the same aggregate type. Cross-aggregate ordering is handled by application-layer reconciliation.
- A reconnection after >60 s of disconnection triggers a single REST query to bridge missed events (`FR-FEED-009`).

---

## 5.5 Supabase Edge Functions

**Used for.** Cross-cutting orchestration that does not fit cleanly into a single SQL transaction:

- Push notification fan-out (`FR-NOTIF-001..013`) — receives a domain event, resolves recipient devices, delivers via FCM/APNs/Web Push.
- Image post-processing (EXIF strip, optional CSAM scan in V1.5+).
- Scheduled jobs runner (`bg-job-*`) — triggered by `pg_cron` to keep state machines and counters consistent.
- Outbound email delivery (account deletion confirmation, etc.) via the email service of choice.

**What we depend on.**

- Deno runtime, TypeScript-first.
- Supabase service role key for privileged operations (used only inside Edge Functions, never on clients).

**Surfaces in our domain.**

- Edge Functions belong to `infrastructure-supabase`; they consume application-layer use cases via a thin runtime shim.

**Contractual notes.**

- A failed Edge Function is retried up to **3 times** with exponential backoff (`NFR-RELI-006`).
- Cold start budget: <1 s per invocation; functions are kept warm via traffic.

---

## 5.6 Push Services

**Used for.** Delivering Critical and Social notifications to user devices (`FR-NOTIF-001..013`).

**What we depend on.**

- **FCM** (Firebase Cloud Messaging) for Android.
- **APNs** (Apple Push Notification service) for iOS.
- **Web Push** via VAPID keys for the Web app, served through a service worker (`NFR-PLAT-009`).

**Surfaces in our domain.**

- The infrastructure layer registers / unregisters tokens on the `Device` entity and sends payloads via these providers.

**Contractual notes.**

- We follow each provider's payload size limits (<4 KB for FCM/APNs, <4 KB for Web Push).
- Critical notifications use the providers' high-priority delivery flag where supported; Social use normal priority.
- Notifications include only category metadata and a deep-link URL; **no** PII (`NFR-PRIV-012`).

---

## 5.7 Deep Links

**Used for.** Universal URL routing across iOS, Android, and Web.

**What we depend on.**

- **iOS Universal Links** with the `apple-app-site-association` file served from the canonical Web origin.
- **Android App Links** with the `assetlinks.json` file served from the same Web origin.
- **Web URLs** as the canonical fallback when the app is not installed.

**URL scheme.**

The canonical origin is `https://app.karma.community`. Routes:

| Path | Surface |
| ---- | ------- |
| `/` | Home Feed |
| `/u/:share_handle` | User profile (own / other) |
| `/p/:post_id` | Post detail |
| `/c/:chat_id` | Chat conversation (auth required) |
| `/settings` | Settings |
| `/settings/privacy` | Settings → Privacy |
| `/settings/blocked` | Blocked users |
| `/settings/follow-requests` | Follow requests (Private profile) |
| `/stats` | Personal stats |
| `/auth` | Sign-in / sign-up |

**Contractual notes.**

- Old routes never silently redirect to incompatible new routes; removed routes return a friendly UI explanation (`NFR-PLAT-010`).
- Auth-required routes opened by an unauthenticated user route to `/auth` with a `next=` parameter that is consumed after sign-in.

---

## 5.8 Telemetry & Observability

**Used for.** Measuring KPIs (`FR-STATS-*`, [`06_cross_cutting/01_analytics_and_events.md`](./06_cross_cutting/01_analytics_and_events.md)) and operational signals (logs, traces, metrics).

**What we depend on.**

- A first-party analytics ingest endpoint (Edge Function) that writes to a separate analytics table or warehouse (`analytics_events`).
- Sentry / Crashlytics for client crash and error reporting.
- Supabase's built-in metrics for Postgres, Storage, and Realtime.

**Contractual notes.**

- Analytics events are PII-redacted at the ingest layer per `NFR-PRIV-012`.
- We **do not** use Google Analytics, Facebook Pixel, or any other third-party tracker (`NFR-PRIV-007`).

---

## 5.9 Email service

**Used for.** Transactional emails:

- Email verification at sign-up (`FR-AUTH-006`).
- Password reset (`FR-AUTH-008`).
- Account deletion confirmation (`FR-NOTIF-012`).

**What we depend on.**

- Supabase's built-in email adapter (Resend / Postmark / SES depending on production choice; documented in `CODE_QUALITY.md`).
- Templates in Hebrew with i18n keys.

**Contractual notes.**

- Email send rate limits are honored per provider; bounce handling logs and surfaces in support.
- We do not send marketing emails in MVP.

---

## 5.10 SMS service

**Used for.** OTP delivery for phone-method sign-up / sign-in.

**What we depend on.**

- Twilio (configured via Supabase) as the SMS provider for Israel; alphanumeric sender IDs respected.

**Contractual notes.**

- Cost ceiling: alert when monthly SMS spend exceeds a configured threshold (operational concern; not a user-facing requirement).
- Code expiry **10 minutes**, format 6 digits (`FR-AUTH-005`).

---

## Change Log

| Version | Date | Summary |
| ------- | ---- | ------- |
| 0.1 | 2026-05-05 | Initial draft. Bound to `D-2` (Supabase backend) and `D-3` (Clean Architecture monorepo). |
