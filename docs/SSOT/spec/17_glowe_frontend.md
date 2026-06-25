# 2.16 GloWe Frontend (shared KC backend)

> **Status:** 🟡 Phase A complete (shared-auth) — The GloWe static frontend (`app/apps/glowe-web`) is added *alongside* the KC mobile app and wired to the **same** Supabase project, so a single Supabase Auth identity (`auth.users`) is shared across both frontends. Long-term intent: GloWe becomes the primary frontend riding on KC's infrastructure, with GloWe-owned data migrated entity-by-entity onto KC's native tables. See `DECISIONS.md` D-61.
> **Phase A delivered:** GloWe vendored into the monorepo unchanged (design 1:1); `backend-config.js` → KC Supabase URL + publishable key; GloWe data namespaced with the `glowe_` table prefix (migration `0204_glowe_schema.sql`) to avoid colliding with KC's native tables. Auth is **Google-only** (email/password hidden). Hosted at the **`/glowe` sub-path** of the main domain (copied into the Cloudflare Pages build by `web-postbuild.mjs`), so OAuth returns to GloWe via KC's already-allowlisted origins. Verified live on dev: Supabase client init, Auth endpoint reachable, `glowe_*` RLS read OK, zero console errors.

Prefix: `FR-GLOWE-*`

## Scope

GloWe is a standalone static web frontend (HTML/CSS/vanilla JS, ~16 pages) with its own visual identity. It is added as an **additional** frontend (it does not replace the KC mobile app) that authenticates against and stores data in the shared Karma Community Supabase backend. This file tracks the integration contract, not GloWe's product surface (which is owned by the GloWe design as-is).

Non-goals for Phase A: shared *content* between GloWe and KC (same posts/profiles visible in both). Phase A shares **identity only**. Content convergence is a later phase.

---

## FR-GLOWE-001 — Shared-auth GloWe frontend on KC infrastructure

**Status.** ✅ Done (Phase A)

**Acceptance Criteria.**
- AC1. The GloWe static site lives at `app/apps/glowe-web/` as a monorepo workspace package (`@kc/glowe-web`), served via `pnpm --filter @kc/glowe-web dev` (static server on port 4321). The design is byte-for-byte the original GloWe (no UI rewrite).
- AC2. `app/apps/glowe-web/js/backend-config.js` points at the KC Supabase project (`supabaseUrl` + publishable `supabaseAnonKey`). When configured, GloWe uses real Supabase Auth; the pre-existing localStorage fallback remains for the unconfigured case.
- AC2a. **Auth is Google-only.** Email/password sign-up and sign-in are hidden from the GloWe UI — both the login and registration modals show a single "Continue with Google" CTA. The static email/password markup in the original GloWe page templates is overwritten at runtime by `upgradeLoginModal()` / `renderRegistrationWizard()` (in `js/app.js`), so every page is consistently Google-only. The email/password handlers (`handleLogin`, `handleRegister`) and the multi-step profile wizard (`renderRegistrationWizardLegacy`) remain in the code but are no longer rendered; the profile wizard is deferred to a post-sign-in step (Phase B).
- AC2b. **OAuth redirect.** `signInWithGoogle()` calls `signInWithOAuth({ provider:'google', options:{ redirectTo: window.location.href } })`, so Google returns the user to the GloWe page they started from (not the KC app). For this to work the GloWe origin must be in the Supabase Auth redirect allowlist (`uri_allow_list`). In production GloWe is served from the **same domain** as the KC web app (see AC7), whose origins are already allowlisted with `/**` (e.g. `https://dev.karma-community.pages.dev/**`, `https://karma-community-kc.com/**`) — so `/glowe/...` redirect targets match without any new entry. Local dev origins added: `http://localhost:4321/**`, `http://127.0.0.1:4321/**`.
- AC7. **Hosting — `/glowe` sub-path of the main domain.** GloWe is served at `<main-domain>/glowe` (e.g. `https://dev.karma-community.pages.dev/glowe`), not a separate domain. The web build (`app/scripts/web-postbuild.mjs`, run after `expo export` in `pnpm build:web`) copies `app/apps/glowe-web/**` into `dist/glowe/` before the Cloudflare Pages deploy (`deploy-web.yml`). GloWe uses only relative asset paths, so it works unchanged under the sub-path. Cloudflare Pages serves existing static files (everything under `/glowe/`) before applying the KC SPA catch-all (`/* → /index.html`), so GloWe's files win. Local dev still serves GloWe standalone on port 4321.
- AC3. A GloWe signup creates one row in `auth.users`, which is the **same** identity used by the KC mobile app. KC's `on_auth_user_created → handle_new_user` trigger fires, creating the matching `public.users` row (`auth_provider='email'`, `account_status='pending_verification'`, `onboarding_state='pending_basic_info'`). The account therefore works in both frontends.
- AC4. GloWe-owned data does not collide with KC's native schema: every GloWe table is namespaced `glowe_*` (migration `0204`). The frontend adapter (`backend.js`) applies the prefix at the Supabase boundary via a single `tbl()` helper. KC's `public.posts` / `public.users` are untouched.
- AC5. All `glowe_*` tables have RLS enabled. Catalog tables (`glowe_profiles`, `glowe_projects`, `glowe_opportunities`, `glowe_posts`, `glowe_comments`) are public-read + owner-write; `glowe_saved_items` and `glowe_applications` are owner-only (no public read). No new security advisor warnings.
- AC6. The arch checker (`pnpm lint:arch`) is unaffected: GloWe ships only `.js/.html/.css`, so the 300-line `.ts/.tsx` cap and layer rules do not apply.

**Out of scope (tracked for later phases).**
- Phase B — map overlapping GloWe entities (profiles, posts) onto KC's native tables via DB views, then retire the corresponding `glowe_*` tables. Includes the post-sign-in profile-completion step that replaces the deferred multi-step registration wizard.
- Phase C — full convergence: GloWe as primary frontend, KC mobile deprecated, single unified schema.

**Resolved decisions.**
- GloWe hosting (PM call, 2026-06-25): serve GloWe at the `/glowe` sub-path of the existing main domain rather than a separate domain (see AC7). This keeps it inside the same Cloudflare Pages deployment and reuses KC's already-allowlisted OAuth origins. A future move to a dedicated GloWe domain is possible later (just deploy `app/apps/glowe-web` to that host and add its origin to `uri_allow_list`).
