# UGC Translation — Phase 2 Reader UX (Design)

> **Spec:** FR-TRANSLATE-003 (`docs/SSOT/spec/18_translation.md`).
> **Depends on (all landed):** FR-TRANSLATE-001 (language foundations), FR-TRANSLATE-002 (cache + provider + posts read substrate).
> **Prior design:** `docs/superpowers/specs/2026-06-29-ugc-translation-design.md` (overall architecture).
> **Status:** Design approved; ready for implementation plan.

---

## 1. Goal

Make posts readable in each reader's preferred language across the surfaces where they browse — **the feed first**, then the full post. A reader who does not understand a post's source language must be able to read it without any manual step. Translation stays demand-driven and cached (Phase 1 substrate); Phase 2 is the mobile rendering + the settings control that drives it.

## 2. Product decisions (locked)

- **D2-A — Where/when: feed + full post (option "B+").** The feed translates the posts in the visible window on demand and caches the result. Cache hits render inline; a miss triggers a background (batched) translation and the field swaps in when ready. This is the only option that keeps the feed readable for *new* posts (a strict cache-hits-only feed would leave never-opened posts in their source language — defeating the goal). Cost stays bounded to one translation per `(post × target-language)` because every result is cached and shared across all readers of that language; we translate only what actually scrolls into view, never the whole corpus.
- **D2-B — Feed miss UX: source + indicator, then gentle swap (option "iii").** While a miss is in flight, the card shows the **source** text plus a small, discreet "translating…" affordance, then swaps to the translation when ready. Chosen over "skeleton" (leaves the card blank) and "silent source-then-swap" (text changes with no explanation).
- **D2-C — Full post: translated by default, per-post "show original" toggle.** The toggle is local to the screen (not persisted). If the post's source language already equals the reader's language, no toggle is shown.
- **D2-D — Transparency:** a discreet "auto-translated" label on a translated full post. Omitted in the feed to avoid clutter.
- **D2-E — Failure / offline:** any translation failure or skip degrades silently to the source text (never an error surfaced to the reader). Offline serves cache hits only; misses stay as source.

## 3. Architecture

Translation is a **read-time overlay** layered on top of the existing feed/post queries — it does not change how posts are fetched. The composition root already exposes `GetTranslatedPostsUseCase` (batched cache read → `{hits, misses}`) and `MaterializePostTranslationsUseCase` (demand-translate misses, `null` on skip/failure). Phase 2 adds: a reader-language hook, a translations overlay hook, presentational wiring, and a settings control.

```
users.preferred_language ──► useReaderLanguage() ──┐
                                                   ▼
feed/post query (PostWithOwner[]) ──► useTranslatedPosts(posts, lang)
        │                                   │  1. GetTranslatedPosts → hits + misses
        │                                   │  2. materialize misses in background (batched)
        │                                   │  3. expose translatedFields(postId) + status
        ▼                                   ▼
   PostCard / PostDetail ──► render translated field OR source(+indicator) OR source(silent)
```

All new UI code lives in `apps/mobile`; all new business logic reuses the existing `@kc/application` use cases. No new domain or infrastructure ports are required (the Phase 1c ports cover reads and materialization).

## 4. Components

### 4.1 `useReaderLanguage()` — mobile hook
- **Responsibility:** resolve the reader's effective output language (a `LanguageTag` string).
- **Behavior:** reads `users.preferred_language` (via the existing user repo / React Query user record) and passes it through `resolveReaderLanguage(userPreference)` (FR-TRANSLATE-001 AC6), which folds in the device locale with an `he` fallback. Returns the resolved tag and is stable across renders for a given `(preference, deviceLocale)`.
- **Depends on:** `resolveReaderLanguage`, the current-user query.

### 4.2 `useTranslatedPosts(posts, readerLanguage)` — mobile hook
- **Responsibility:** given the list of posts currently rendered and the reader language, provide translated fields per post and a per-post status.
- **Behavior:**
  1. **Read:** a React Query keyed `['post-translations', readerLanguage, postIds]` runs `GetTranslatedPostsUseCase` → `{hits, misses}`. `hits` populate a `Map<postId, {title?, description?}>`.
  2. **Materialize:** if `misses.length > 0`, fire `MaterializePostTranslationsUseCase(misses)` as a background effect (one batched invocation per render window, deduped by post id). On completion, invalidate the read query so newly-cached hits flow in — this is the "gentle swap".
  3. **Expose:** `getTranslatedFields(postId) → {title?, description?} | undefined` and `getStatus(postId) → 'hit' | 'translating' | 'source'`. `'translating'` = the post has an eligible miss with an in-flight materialization; `'source'` = no eligible translation (same language, untranslatable, or failed).
- **Guards:** empty `postIds` short-circuits (the use case already avoids a round-trip). Language change re-keys the query (new cache namespace). A miss that materializes to `null` (skip/failure) is not retried in a tight loop — it resolves to `'source'`.
- **Depends on:** `GetTranslatedPostsUseCase`, `MaterializePostTranslationsUseCase`, React Query.

### 4.3 `TranslatableText` — presentational component
- **Responsibility:** render one translatable field (title or description) under the D2-B / D2-E rules.
- **Props:** `source: string`, `translated?: string`, `status: 'hit' | 'translating' | 'source'`, `numberOfLines?`, plus style passthrough.
- **Render:**
  - `hit` → translated text.
  - `translating` → source text + a discreet inline indicator (small "translating…" glyph/label, `he` locale string).
  - `source` → source text, no indicator.
- **Accessibility:** when showing a translated value, expose an `accessibilityLabel` noting it is auto-translated (D2-D); the indicator is not a focus stop.

### 4.4 `PostCard` wiring (feed)
- Replace the raw `post.title` / `post.description` render with `<TranslatableText>` fed by `useTranslatedPosts`. Line clamps (`numberOfLines={2}`) unchanged. No transparency label in the feed (D2-D).

### 4.5 Post detail wiring
- Full title + body render via `TranslatableText`. Add:
  - A discreet **"auto-translated"** label when the shown text is a translation (D2-D).
  - A **"show original" / "show translation"** toggle (D2-C): local `useState`, default translation; hidden when source language == reader language or no translation exists. Toggling flips every translatable field on the screen together.
- **Accessibility:** toggle is `accessibilityRole="button"` with a clear `he` label; the label change is announced.

### 4.6 Settings language picker
- In `settings.tsx`: a "Translation language" row opening a picker of supported target languages (the set the `translate` Edge Function/provider supports; sourced from a single constant so KC and GLOWE stay in sync).
- Selecting a language calls `IUserRepository.setPreferredLanguage` (FR-TRANSLATE-001 AC5) and invalidates the current-user + `['post-translations', …]` queries so the reader language and all rendered translations refresh.
- Includes a "device default" choice that persists `null` (resolve from device locale at runtime, AC3).

## 5. Data flow (feed miss → readable)

1. Feed query returns `PostWithOwner[]` for the visible window.
2. `useTranslatedPosts` reads the cache in one batched RPC. Post P is a miss.
3. `PostCard` for P shows source + "translating…" (status `translating`).
4. Background materialization translates P (one provider call, cached, single-flight per Phase 1b/1c).
5. Read query invalidated → P is now a hit → card swaps to the translated field.
6. Any later reader of P in the same language gets an immediate cache hit (no provider call).

## 6. Error handling

- Materialization never throws on the read path (Phase 1c AC15 guarantee); `null` results resolve to status `'source'`.
- Read RPC failure → hook returns no hits; all posts render as `'source'` (feed stays usable in the source language).
- Offline → React Query serves the persisted translation cache (hits only); misses stay source; no error UI.
- Settings write failure → surfaced as a toast/alert via the adapter's prefixed error; the previous preference is retained.

## 7. Testing

- **Domain/application:** already covered by Phase 1 tests; no new use cases. Add a unit test for any new pure helper (e.g. a `supportedTargetLanguages` guard or a status-derivation function) with happy path + one boundary (empty/unknown language).
- **Hooks:** `useTranslatedPosts` — hits render translated; a miss yields `'translating'` then swaps to `'hit'` after materialization; `null` materialization yields `'source'`; language change re-keys. `useReaderLanguage` — explicit preference wins; `null` falls back to device then `he`.
- **Component:** `TranslatableText` renders each of the three statuses correctly, including the indicator only in `translating`.
- **Manual (RN-Web + device):** load the feed in a non-source language, confirm source-then-swap; open a post, toggle show-original; change settings language and confirm feed + post refresh; airplane-mode a cached vs uncached post.

## 8. Scope / non-goals

- No chat translation (Phase 3, FR-TRANSLATE-004).
- No eager/whole-corpus translation; only the visible window materializes.
- No new provider/model work; reuses the `translate` Edge Function untouched.
- No change to post fetching, ranking, or the feed query shape.

## 9. Acceptance Criteria (for the spec)

- **AC1.** Settings exposes a translation-language picker listing the supported target languages plus a "device default" option; selecting persists `users.preferred_language` (or `null` for device default) via `setPreferredLanguage`, and refreshes the reader language + rendered translations.
- **AC2.** `useReaderLanguage()` resolves the effective language from the persisted preference, else device locale, else `he` (reusing `resolveReaderLanguage`).
- **AC3.** The feed renders each post's title/description translated when a cache hit exists for the reader language; posts already in the reader language render unchanged.
- **AC4.** On a feed cache miss for an eligible field, the card shows the source text with a discreet "translating…" indicator and swaps to the translation once background materialization caches it (no manual action).
- **AC5.** The full post renders translated fields by default with a discreet "auto-translated" indicator, and a per-post (non-persisted) "show original / show translation" toggle that is hidden when the post's source language equals the reader language.
- **AC6.** Any translation failure, skip, or offline miss degrades silently to the source text — no error UI on the read path; the feed remains usable in the source language.
- **AC7.** Accessibility: translated text carries an auto-translated `accessibilityLabel`; the show-original toggle is a labeled button whose state change is announced to screen readers.
