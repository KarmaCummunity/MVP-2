# 2.18 Cross-language UGC Translation

> **Status:** 🟡 Phase 0 (Foundations) in progress — language primitives + schema plumbing landing; no translation/LLM/UI yet. Phases 1–4 ⏳ Planned.

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

## FR-TRANSLATE-002 — Translation core (Phase 1, ⏳ Planned)

Demand-driven materialization for posts: `content_translations` cache table with a single-flight UNIQUE constraint; translate Edge Function (LLM-flash, zero-retention/DPA); source-language detection on content create; SECURITY INVOKER read RPC for the feed join. To be detailed before implementation.

## FR-TRANSLATE-003 — Reader UX (Phase 2, ⏳ Planned)

Settings language picker (persists `preferred_language`); translated-field rendering with a "show original" toggle; accessibility + low-bandwidth handling. To be detailed before implementation.

## FR-TRANSLATE-004 — Chat translation (Phase 3, ⏳ Planned, last)

Opt-in chat translation (default off) with a sender-consent gate; per-conversation translation; LRU eviction for the chat translation cache. To be detailed before implementation.
