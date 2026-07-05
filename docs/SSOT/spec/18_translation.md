# 2.18 Cross-language UGC Translation

> **Status:** ✅ Phase 0 (Foundations) done — language primitives + schema plumbing landed. ✅ Phase 1a (cache core) landed: `content_translations` table + domain primitives + cache port/adapter. ✅ Phase 1b (provider + pipeline) landed: `translate` Edge Function (free Gemini Flash behind a pluggable provider seam, D-65) + `ITranslationService` port/adapter; inert — nothing auto-invokes it yet. ✅ Phase 1c (posts read substrate) landed: narrow `content_translations` SELECT policy + `get_post_translations` SECURITY INVOKER read RPC (migration `0210`, closes TD-58) + `IPostTranslationReader` port/adapter + `GetTranslatedPosts`/`MaterializePostTranslations` use cases. ✅ Phase 2 (reader UX) landed: Settings language picker + viewport-gated feed translation + translated post detail with show-original toggle (migration `0216` purges cached translations on post edit). ✅ Phase 5 (FR-TRANSLATE-005) done: engine surfaced into the GLOWE web frontend (the active MVP) via an isolated anon-readable `glowe_content_translations` cache (migrations `0219`–`0221`, `0226`) + `glowe-translate` Edge Function + `glowe-translate.js` reader driver; all list/card render paths, the wish + opportunity + profile detail pages, and per-element opportunity `requirements`/`responsibilities` chips are live on dev. KC path untouched. Phases 3–4 ⏳ Planned.

Prefix: `FR-TRANSLATE-*`

---

## Scope

Translate user-generated content into each reader's preferred language so the platform is linguistically accessible to everyone. This is **shared infrastructure** serving both KC and GLOWE — it must stay world/product-agnostic.

Architecture (see design doc `docs/superpowers/specs/2026-06-29-ugc-translation-design.md`): **demand-driven (lazy) materialization** — translate per `(content, field, target_language)` only when a real reader requests it, then cache in Postgres. This supports unlimited target languages while paying for and storing only the few actually demanded per item. Translation never runs on the read path (translate-ahead-of-read; cache hits served inline as ordinary fields). LLM-flash provider behind a Supabase Edge Function holding the API key; provider must be zero-retention / under DPA.

Posts auto-translate. **Chat translation is opt-in (default off)** with a sender-consent gate — a message is sent for translation only if its sender opted in — and is deferred to the last phase.

Non-goals (out of scope):
- Translating app UI strings (handled by react-i18next / locale files, `INFRA-I18N-*`).
- Eager translation of every item into every language.
- Running an LLM synchronously on the reader's request path.

---

## FR-TRANSLATE-001 — Language foundations

**Description.**
Inert language primitives the rest of the system depends on: a validated, normalized BCP-47 `LanguageTag`; a pure resolver for "which language does this reader want"; a persisted `preferred_language` on users; and nullable `source_language` plumbing on posts and messages. No translation, LLM, or UI in this phase.

**Source.**
- Design spec: `docs/superpowers/specs/2026-06-29-ugc-translation-design.md` §3, §4, §8.
- Plan: `docs/superpowers/plans/2026-06-29-ugc-translation-phase-0-foundations.md`.
- Decisions: `D-63` (zero-retention/DPA provider), `D-64` (posts auto / chat opt-in with sender-consent gate).

**Acceptance Criteria.**
- AC1. `createLanguageTag(raw)` (in `@kc/domain`) validates a pragmatic BCP-47 subset (language + optional script + optional region, incl. UN M.49 numeric region), normalizes casing (language lower, script Title, region UPPER), trims whitespace, and throws `ValidationError(field='languageTag')` on empty/malformed input.
- AC2. `resolvePreferredLanguage({ userPreference, deviceLocales, fallback })` returns the explicit valid user preference, else the first device locale that parses, else the (valid) fallback.
- AC3. `users.preferred_language` (nullable BCP-47 text) persists the reader's chosen output language; `null` means resolve from device locale at runtime. DB CHECK guards length 2..35.
- AC4. `posts.source_language` + `posts.source_language_confidence` and `messages.source_language` + `messages.source_language_confidence` exist (nullable); confidence constrained to 0..1. Set later by the translate pipeline (Phase 1).
- AC5. `IUserRepository.setPreferredLanguage(userId, languageTag | null)` persists/resets the preference; adapter writes `users.preferred_language` and surfaces a prefixed error on failure.
- AC6. The mobile app exposes `resolveReaderLanguage(userPreference)` wiring the device locale (via `expo-localization`) into the pure resolver with Hebrew (`he`) fallback.

**Related.** Migration `0207_ugc_translation_language_columns.sql`. Consumed by FR-TRANSLATE-002+ (translation core).

---

## FR-TRANSLATE-002 — Translation core (Phase 1)

> **Status:** ✅ Phase 1a (cache substrate) + ✅ Phase 1b (provider/pipeline) + ✅ Phase 1c (posts read substrate) landed. Mobile rendering of translated fields is Phase 2 (FR-TRANSLATE-003).

**Description.**
Demand-driven materialization for posts. Phase 1a delivers the inert cache substrate the later phases populate and consume: a Postgres cache table keyed per `(content_type, content_id, target_language, field)` with single-flight semantics, the pure domain primitives that model a translation request and decide whether/how to cache, and a cache repository behind an application port. No LLM, Edge Function, read-path change, or UI in 1a.

**Source.**
- Design spec: `docs/superpowers/specs/2026-06-29-ugc-translation-design.md` §4 (data model), §7 (single-flight/dedup), §8 (variant-aware keys, short-circuit).
- Plan (1a): `docs/superpowers/plans/2026-06-29-ugc-translation-phase-1a-cache-core.md`.
- Decisions: `D-63` (demand-driven cache + zero-retention/DPA provider), `D-64` (posts auto / chat opt-in).

**Acceptance Criteria (Phase 1a — cache core).**
- AC1. `content_translations` table (migration `0208`) stores one row per `(content_type, content_id, target_language, field)`, enforced by UNIQUE index `content_translations_key_uidx`; CHECKs constrain `content_type ∈ {post,message}`, `field ∈ {title,description,body}`, `confidence ∈ [0,1]`.
- AC2. Mutations are service-role only: `anon`/`authenticated` are revoked all and granted table-level `SELECT` only; RLS is enabled with an explicit deny-by-default SELECT policy (`using (false)`) that blocks direct authenticated reads — replaced in Phase 1c by the narrow policy backing the read RPC.
- AC3. Cache self-cleans so no readable translated copy of removed content survives: `BEFORE DELETE` triggers on `posts`/`messages` purge by source PK, and an `AFTER UPDATE OF status` trigger on `posts` purges when status flips to `removed_admin`.
- AC4. Domain primitives in `@kc/domain`: `ContentType`/`TranslationField` literal unions + guards; `TranslationError extends DomainError` (`code='translation'`); `createTranslationRequest` validating content-type/field coupling (posts→title/description, messages→body) and normalizing source/target via `createLanguageTag`.
- AC5. Cache-decision helpers: `normalizeForCache` (whitespace fold, case preserved), `isTranslatable` (empty/emoji-only/url-only/number-only short-circuit), `needsTranslation(source,target)` (true on unknown source or differing base language).
- AC6. `ITranslationCacheRepository` port (`get`, `putIfAbsent`, `deleteForContent`) with a `SupabaseTranslationCacheRepository` adapter; `putIfAbsent` returns `false` on UNIQUE violation (`23505`) — the single-flight loser — and `true` when it inserts.

**Acceptance Criteria (Phase 1b — provider + translate Edge Function).**
- AC7. `supabase/functions/translate` authenticates the caller (JWT) and, before spending a provider call, verifies the caller can `SELECT` the source row under RLS (`posts`/`messages`); returns `403` otherwise.
- AC8. Detection is folded into the translate call (one round-trip returns translated text + detected `source_language` + confidence); emoji/url/number-only/empty input short-circuits to `{status:'skipped'}`, and same-base-language results are not cached.
- AC9. Persist is single-flight: the winner inserts via service-role `INSERT … ON CONFLICT DO NOTHING` (23505 = loser), so concurrent readers of a freshly-viral item share one provider call.
- AC10. The provider is pluggable behind a Deno `TranslationProvider` seam selected by `TRANSLATION_PROVIDER`; the default `GeminiFlashProvider` uses the free tier (`GEMINI_API_KEY`), and swapping to a paid zero-retention/DPA model (D-63/D-65) is env-only.
- AC11. `ITranslationService` (application) + `EdgeFnTranslationService` (infra) expose the pipeline to the app; any failure/skip returns `null` so callers render the original (graceful degradation). Nothing auto-invokes it yet — the posts read path is Phase 1c.

**Acceptance Criteria (Phase 1c — posts read substrate).**
- AC12. Migration `0210` replaces the Phase-1a deny-by-default SELECT policy with `content_translations_select_visible_post`: an authenticated reader may `SELECT` a translation row only when `content_type = 'post'` and the post exists, reusing the posts `is_post_visible_to` RLS via an `EXISTS` subquery (no duplicated visibility logic). Message (chat) translations stay unreadable (Phase 3). Closes TD-58.
- AC13. `get_post_translations(p_post_ids uuid[], p_target_language text)` is a SECURITY INVOKER, STABLE SQL function that returns cached post translations (cache HITS only; misses absent) for the reader's target language, batched by post id in one round-trip. The join through `posts` is filtered by posts RLS first, so translations for invisible posts are unreachable; `execute` is granted to `authenticated`, revoked from `public`/`anon`.
- AC14. `IPostTranslationReader` port (`getForPosts(postIds, targetLanguage)`) + `SupabasePostTranslationReader` adapter call the RPC and map rows to `PostTranslationHit[]`; an empty `postIds` short-circuits without a round-trip.
- AC15. `GetTranslatedPostsUseCase` returns reader hits plus the eligible-but-uncached fields as `misses` (filtering via `isTranslatable` + `needsTranslation`, deduping post ids); `MaterializePostTranslationsUseCase` demand-translates each miss via `ITranslationService`, dropping any `null` (skip/failure) so callers render the original — never throwing on the read path. Mobile rendering of these results is Phase 2.

**Related.** Migrations `0208_content_translations.sql` (Phase 1a) + `0210_content_translations_read.sql` (Phase 1c; Phase 1b adds no migration). Edge Function `supabase/functions/translate`. Phase 1c consumes `ITranslationService` on a cache miss via `MaterializePostTranslationsUseCase`. SQL regression: `supabase/tests/0210_content_translations_read.sql`.

## FR-TRANSLATE-003 — Reader UX (Phase 2, ✅ Done)

> **Status:** ✅ Landed. Settings language picker + viewport-gated feed translation + translated post detail with show-original toggle. Design: `docs/superpowers/specs/2026-07-01-ugc-translation-phase-2-reader-ux-design.md`; plan: `docs/superpowers/plans/2026-07-01-ugc-translation-phase-2-reader-ux.md`.

Demand-driven reader UX over the Phase 1 substrate: a Settings picker sets the reader's target language; the feed translates only the visible window on-demand (source-then-swap); the full post renders translated with a per-post show-original toggle. All failures degrade silently to source text.

- AC1. Settings exposes a translation-language picker listing the supported target languages (`he`/`en`/`ar`/`ru`, mirroring the Edge allow-list) plus a "device default" option; selecting persists `users.preferred_language` (or `null` for device default) via `setPreferredLanguage`, and invalidates the current-user + `['post-translations', …]` queries so the reader language and rendered translations refresh.
- AC2. `useReaderLanguage()` resolves the effective language from the persisted preference, else device locale, else `he` (reusing `resolveReaderLanguage`, FR-TRANSLATE-001 AC6).
- AC3. The feed renders a post's translatable fields translated when a cache hit exists for the reader language; posts already in the reader language render unchanged. The feed translates only the fields it renders (title) to bound cost.
- AC4. On a feed cache miss for an eligible field, the card shows the source text with a discreet "translating…" indicator and swaps to the translation once background materialization caches it (no manual action).
- AC5. The full post renders translated fields by default with a discreet "auto-translated" indicator, plus a per-post (non-persisted) "show original / show translation" toggle that is hidden when the post's source language equals the reader language.
- AC6. Any translation failure, skip, or offline miss degrades silently to the source text — no error UI on the read path; the feed remains usable in the source language (session skip-map prevents re-firing resolved skips/failures).
- AC7. Accessibility: translated text carries an auto-translated `accessibilityLabel`; the show-original toggle is a labeled button whose state change is announced to screen readers.
- AC8. `PostWithOwner` exposes `sourceLanguage` and the current-user read exposes `preferredLanguage` (contract change); `toTranslatableFields` derives eligible fields purely and is unit-tested.
- AC9. Feed materialization is driven by `onViewableItemsChanged` with a dwell gate (`itemVisiblePercentThreshold: 60`, `minimumViewTime: 400`); it materializes the settled visible window and never re-requests a `(post, field, lang)` that previously resolved to skip/failure within the session.
- AC10. Editing a post's `title`/`description` purges its cached translations (DB trigger, migration `0216`); the next reader re-materializes the current text.
- AC11. The `translate` Edge Function translates the SELECT-verified source-row field (never client-supplied text) and rejects unsupported target languages server-side.
- AC12. Feed cards render RTL-safe; the source→translation swap causes no scroll shift (the "translating…" indicator is a non-clamped sibling of the clamped text), and per-string base direction is resolved at render time.

## FR-TRANSLATE-004 — Chat translation (Phase 3, ⏳ Planned, last)

Opt-in chat translation (default off) with a sender-consent gate; per-conversation translation; LRU eviction for the chat translation cache. To be detailed before implementation.

## FR-TRANSLATE-005 — GLOWE web reader translation (✅ Done)

> **Status:** ✅ Done. Surfaces the translation engine into the GLOWE static web frontend (`app/apps/glowe-web`), which shares the KC Supabase backend. GLOWE is the active MVP (AGENTS.md § Active product focus); the KC app frontend is out of scope. Design + plan: `docs/superpowers/specs/2026-07-04-glowe-web-translation-design.md`, `docs/superpowers/plans/2026-07-04-glowe-web-translation.md`.
>
> **Landed (live on dev):** AC1–AC9 done — `glowe_content_translations` cache (migrations `0219` + `0220` `org_description` + `0221` `org_field` + `0226` array-element field pattern), `glowe-translate` Edge Function reading source rows server-side (scalar **and** array elements via a `field.index` convention), `_shared/translation/` provider extraction, `glowe-translate.js` demand-driven translate + "show original" toggle localized via `GLOWE_TRANSLATIONS`. **AC7 done:** all list/card render paths wired (`renderPostCard`, `renderOpportunityCard`, `renderWishCard`, `renderProjectCard`, `renderOrganizationCard` — incl. the `org_field` category tag) **plus** the wish detail modal (`glowe_post` title+text), the opportunity detail page (`glowe_opportunity` title+description **and** per-element `requirements`/`responsibilities` chips), and the profile detail page (`glowe_profile` mission prose, DB-profile-only via a render-time-resolved `data-tr-field`). Toggle appears only when a translation was applied. **Residual (TD-135, by design):** derived composite profile prose (`valuesText`/`solutionText`, no single source column) stays untranslated; array/tag fields excluded by AC4 (opportunity `skills`, wish `areas`, profile `skills`/`languages`, names) are intentionally never translated.

GLOWE's user-generated content (posts, opportunities/events, wishes, projects, org/member profile prose) auto-translates to the reader's GLOWE interface language, reusing the FR-TRANSLATE engine (Gemini provider + demand-driven cache). GLOWE content lives in anon-readable `glowe_*` tables, so anonymous readers are served too. Proper names (person + organization display names) are never translated — only descriptive free-text fields. The KC translation path (`content_translations`, `translate` Edge Function, `get_post_translations`) is left untouched; GLOWE gets an isolated, backward-compatible path.

**Acceptance Criteria.**

- AC1. New table `glowe_content_translations(id uuid pk, content_type text, content_id text, field text, target_language text, source_language text, translated_text text, model text, confidence real, created_at timestamptz)` with a unique index on `(content_type, content_id, field, target_language)`. `content_id` is `text` (GLOWE PKs are text, e.g. `post-<uuid>`). RLS enabled: `anon` + `authenticated` granted `SELECT` (GLOWE content is public); `INSERT`/`UPDATE`/`DELETE` are service-role only. The migration is additive and does **not** alter KC `content_translations`.
- AC2. Edge Function `glowe-translate` (`POST functions/v1/glowe-translate`) accepts `{ contentType, contentId, field, targetLanguage }` from anonymous or authenticated callers. It resolves `contentType` via a GLOWE source registry — `glowe_post`→`glowe_posts`, `glowe_opportunity`→`glowe_opportunities`, `glowe_wish`→`glowe_posts`, `glowe_project`→`glowe_projects`, `glowe_profile`→`glowe_profiles` — to `{ table, pk, allowedFields }`, re-reads the requested field **server-side** (service role) to prevent cache poisoning, rejects fields outside the allow-list (`400`) and unsupported target languages (`400`), translates via the shared Gemini provider, upserts into `glowe_content_translations`, and returns `{ status: 'translated' | 'cached' | 'skipped', translation? }`. `skipped` when the detected source base-language equals the target.
- AC3. The Gemini provider call + `supportedLanguages` allow-list are extracted to shared modules under `supabase/functions/_shared/translation/` and imported by both `translate` and `glowe-translate` (no duplicated provider logic; satisfies the duplication gate). The existing KC `translate` contract/behavior is unchanged, verified by its existing checks.
- AC4. The translatable-field registry excludes proper names: `glowe_post` = {`title`, `text`}; `glowe_opportunity` = {`title`, `description`, `requirements`, `responsibilities`} (NOT `organization`); `glowe_wish` = {`title`, `text`}; `glowe_project` = {`title`, `description`}; `glowe_profile` = {`about`/`org_description`, `focus`, `needs`, `org_field`} (NOT `display_name`). No name field is ever submitted for translation.
- AC5. Frontend module `app/apps/glowe-web/js/glowe-translate.js` runs a demand-driven translate step: given `(contentType, items[], fields[])` and the reader language, it (a) reads `glowe_content_translations` for cache hits (single `.in('content_id', …)` query), (b) requests misses from `glowe-translate` (skipping session-skipped `(content_id, field)` pairs), (c) patches translated text onto item objects while preserving the originals, and (d) marks per-item whether any field was translated. All failures/timeouts degrade silently to source text and never block rendering.
- AC6. Reader language is `getGloweLanguage()` (`en`/`he`, already tag-compatible with the backend allow-list). A field is translated only when the source language base-differs from the reader language and the text is translatable (not URL/number/emoji-only) — reusing the KC eligibility semantics (`needsTranslation` + `isTranslatable`).
- AC7. GLOWE card + detail render paths (post, opportunity/event, wish, project, profile) show the translated text when a translation exists and render a compact "show original" / "הצג מקור" control **only when a translation was actually applied** (source ≠ reader). Toggling swaps translated↔original client-side with no refetch; when no translation occurred, no control appears.
- AC8. Anonymous (logged-out) GLOWE readers receive translations identically to signed-in readers: the cache table is anon-readable and `glowe-translate` accepts anon callers.
- AC9. Graceful degradation + cost bounds: only content currently rendered to the reader is translated (no bulk pre-translation); a session skip-map prevents re-firing a `(content_id, field, lang)` that resolved to skip/failure; a provider/network failure leaves the original text in place with no error UI.
