# 2.15 Public Market Research

> **Status:** ⏳ Planned — Survey B captures pain-language from alt-platform users (FB / WhatsApp / Agora). Output: Karma Phrasebook (see design spec §2).

Prefix: `FR-RESEARCH-*`

## Scope

A public, anonymous web form at `/research/[slug]?src=...`, served from the Expo Router web bundle, never shown in mobile app shells. Survey content is server-driven through the same questions schema as Survey A; submissions go to a dedicated anonymous table fronted by an Edge Function for IP forwarding and origin validation.

---

## FR-RESEARCH-001 — Public market research runner

**Status.** ⏳ Planned

**Acceptance Criteria.**
- AC1. Web-only route `/research/[slug]` rendered via Expo Router `.web.tsx` platform extension. The route file does not exist in iOS/Android bundles (bundle-inspection test).
- AC2. No auth shell, no tab bar, no app navigation. Standalone landing.
- AC3. Reuses Survey A's question runner components; supports 11 questions for slug `alt-platforms-research`.
- AC4. Optional `?src=` query param captured and persisted on submission (regex `^[a-z0-9_-]{1,32}$`; defaults to `direct`).
- AC5. On submit, navigates to `/research/thanks` which offers an optional email opt-in for launch updates.
- AC6. Intro copy and CTA copy as per design spec §9.

---

## FR-RESEARCH-002 — Anti-abuse for public research form

**Status.** ⏳ Planned

**Acceptance Criteria.**
- AC1. Hidden honeypot field; non-empty value → silent reject (200 OK but no row inserted).
- AC2. Edge Function `public-research-submit` validates `Origin` header against allowlist before invoking RPC.
- AC3. Per-IP-hash rate limit: 5/min, 30/hour, 100/day. IP hashed with daily-rotated salt (`research_secrets.daily_research_salt`). Hash computed in Edge Function from `x-forwarded-for`, not in Postgres.
- AC4. Global circuit breaker: if `>500` inserts in the last 60 seconds across all sources, RPC returns 503 (`research_circuit_open`).
- AC5. RPC is `SECURITY DEFINER` with `SET search_path = ''`; revoked from `PUBLIC`; explicit `GRANT EXECUTE TO anon`.

---

## FR-RESEARCH-003 — Contact-request opt-in

**Status.** ⏳ Planned

**Acceptance Criteria.**
- AC1. Submission can optionally include `contact_email` (RFC-5322-lite validated) + `contact_window_he` (free text ≤200 chars).
- AC2. Stored in separate table `public_research_contact_requests` with FK to `public_research_responses(id) ON DELETE CASCADE`. Survey answers and contact email are deletable independently.
- AC3. Only super-admins can read `public_research_contact_requests` (RLS denies all to anon/authenticated).
- AC4. Thank-you page `/research/thanks` shows email opt-in for launch updates as a separate, additional capture.

---

| Version | Date | Summary |
| ------- | ---- | ------- |
| 0.1 | 2026-05-26 | Initial draft. FR-RESEARCH-001..003 (public market research runner, anti-abuse, contact opt-in). |
