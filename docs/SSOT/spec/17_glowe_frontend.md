# 2.16 GloWe Frontend (shared KC backend)

> **Status:** 🟡 Phase A complete (shared-auth) + onboarding (FR-GLOWE-002) + org approval & view-only gating (FR-GLOWE-003) + interface language switch & RTL (FR-GLOWE-005, Phase 1) + **session isolation fix** — The GloWe static frontend (`app/apps/glowe-web`) is added *alongside* the KC mobile app and wired to the **same** Supabase project, so a single Supabase Auth identity (`auth.users`) is shared across both frontends. Long-term intent: GloWe becomes the primary frontend riding on KC's infrastructure, with GloWe-owned data migrated entity-by-entity onto KC's native tables. See `DECISIONS.md` D-61.
> **Phase A delivered:** GloWe vendored into the monorepo unchanged (design 1:1); `backend-config.js` → KC Supabase URL + publishable key; GloWe data namespaced with the `glowe_` table prefix (migration `0204_glowe_schema.sql`) to avoid colliding with KC's native tables. Auth is **Google-only** (email/password hidden). Hosted at the **`/glowe` sub-path** of the main domain (copied into the Cloudflare Pages build by `web-postbuild.mjs`), so OAuth returns to GloWe via KC's already-allowlisted origins. Verified live on dev: Supabase client init, Auth endpoint reachable, `glowe_*` RLS read OK, zero console errors.
> **Session isolation fix (2026-06-29):** GloWe's Supabase client now uses `storageKey: 'glowe-auth-v1'` (separate from KC's default `sb-<ref>-auth-token`), and `signOut()` uses `scope: 'local'` so GloWe sign-out does not revoke KC's server-side token. `logout()` now calls `refreshPersonalAreaIfVisible()` immediately so the profile card disappears without waiting for the async Supabase auth-state event.

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

---

## FR-GLOWE-002 — Post-sign-in onboarding & account type (individual vs organization)

**Status.** ✅ Done — onboarding step + data model + self-approval guard delivered (PR #577). Org approval admin UI + view-only enforcement tracked separately as FR-GLOWE-003.

Because GloWe auth is Google-only (FR-GLOWE-001 AC2a), there is no registration wizard to collect a profile. Instead a lightweight onboarding step runs once after the first successful sign-in, capturing the minimum identity details and the account type. Two account types exist:

- **Individual (private)** — approved implicitly; no review required. Full participation immediately.
- **Organization** — must submit organization details for KC admin review. Until approved an org is **view-only**: it can browse everything but cannot create a post / event / need. "Only serious requests are accepted."

**Acceptance Criteria.**
- AC1. After a successful Google sign-in, a "Welcome to GloWe" onboarding modal is shown **once per session** (a `glowe-onboarding-dismissed` session flag prevents re-prompting). The modal is non-blocking — the user may dismiss it ("Maybe later") and keep browsing. It is only auto-shown while `onboarding_complete` is false.
- AC2. The modal offers two account-type cards — **Individual** (default selected) and **Organization**. Selecting Organization reveals an additional required-fields block; selecting Individual hides it. The display-name field is prefilled from the existing profile / Google identity.
- AC3. **Individual** submission writes `account_type='individual'`, `onboarding_complete=true`, `approval_status='not_required'` and the basic profile fields (display name, about, country). No review.
- AC4. **Organization** submission writes `account_type='organization'`, `onboarding_complete=true`, `approval_status='pending'`, `org_submitted_at=now()`, plus the org detail fields: name*, registration number, website, country, field, size, description*, contact name*, contact email*, contact phone (`*` = required, validated client-side before submit).
- AC5. **Data model (migration `0205_glowe_onboarding.sql`).** `glowe_profiles` gains `account_type`, `onboarding_complete` (default false), `approval_status` (default `'not_required'`), and the `org_*` columns above plus `org_reviewed_at` / `org_reviewed_by` (FK `auth.users`) / `org_review_note`. CHECK constraints restrict `account_type ∈ {individual, organization}` and `approval_status ∈ {not_required, pending, approved, rejected}`. A partial index (`glowe_profiles_pending_orgs_idx`) lists orgs awaiting review.
- AC6. **Self-approval guard.** `glowe_profiles` is owner-writable (row id = `auth.uid()`), so a client could otherwise PATCH its own `approval_status`. A `SECURITY INVOKER` BEFORE INSERT/UPDATE trigger (`glowe_profiles_guard_approval`) blocks any client role (`authenticated`/`anon`) from writing `approval_status` outside `{not_required, pending}` or moving away from an already-decided state, while privileged writers (the future admin RPC, run as a non-login role) may set `approved`/`rejected`. Regression test: `supabase/tests/0205_glowe_onboarding_guard.sql`.
- AC7. The frontend adapter (`backend.js`) exposes `completeOnboarding(details)`, upserting only the onboarding columns so a partial pre-existing profile row is preserved. `fromProfileRow` surfaces the new fields (`accountType`, `onboardingComplete`, `approvalStatus`, `org*`).

**Out of scope (tracked for FR-GLOWE-003).**
- Org **approval workflow**: a `SECURITY DEFINER` RPC (`glowe_set_org_approval`) gated to KC admins, admin read access to pending orgs, and the GloWe Admin page wiring to approve/reject.
- **View-only enforcement** for unverified orgs (and unregistered "peek" users): blocking post/event/need creation at the write choke points until `approval_status='approved'`.

**Resolved decisions (PM call, 2026-06-27).**
- Individuals do **not** require approval; only organizations do.
- An unverified organization is **view-only** — it can see everything but cannot upload a post/event/need.
- Organization approval is performed via the GloWe Admin page.
- The org field list is set at the agent's discretion ("make it professional") — see AC4.

---

## FR-GLOWE-003 — Organization approval workflow & view-only enforcement

**Status.** ✅ Done — approval RPCs (DB), GloWe Admin review UI, and client-side view-only write gating all delivered.

FR-GLOWE-002 lands an organization at `approval_status='pending'`, held view-only. This FR adds (a) the privileged admin path to review and decide, and (b) the client-side enforcement that keeps an unverified org (and an unregistered visitor) read-only.

**Acceptance Criteria.**
- AC1. **Approval RPC (migration `0206`).** `glowe_set_org_approval(p_profile_id, p_decision, p_note)` is `SECURITY DEFINER`, gated by `admin_assert_role(auth.uid(), {'super_admin', 'moderator'})` (raises `42501` for non-reviewers, mirroring `admin_org_application_decide`). The reviewer set includes `moderator` because `super_admin` is singleton-constrained (TD-95). It validates `p_decision ∈ {approved, rejected}` (`22023`), requires the target to be a `pending` `organization` (else `22023`/`P0002`), then sets `approval_status`, `org_reviewed_at`, `org_reviewed_by = auth.uid()`, and a trimmed `org_review_note`. The 0205 client-write guard does not block it (the DEFINER function runs as a non-login role). `revoke execute … from public; grant … to authenticated`.
- AC2. **Review queue RPC (migration `0206`).** `glowe_list_pending_orgs()` is `SECURITY DEFINER`, reviewer-gated (same `{super_admin, moderator}` set), returns `setof glowe_profiles` where `account_type='organization' and approval_status='pending'`, oldest submission first. Exposing the queue as an RPC (rather than a raw public-read query) gives the Admin page an admin-gated read path and room to later tighten the public `SELECT` on `glowe_profiles`.
- AC3. Regression test `supabase/tests/0206_glowe_org_approval.sql`: non-admin blocked on both RPCs; a reviewer (moderator) sees + approves a pending org (reviewer/note/timestamp stamped); re-deciding a decided org rejected; bad decision value / non-org / unknown profile rejected.
- AC4. **GloWe Admin review UI** — the GloWe Admin page lists pending orgs (via `glowe_list_pending_orgs`) with their submitted details and Approve / Reject (+ optional note) controls wired to `glowe_set_org_approval`. ✅
- AC5. **View-only write gating** — a single `canCreateContent()` guard (registered user AND not an unapproved org) blocks every content-create handler in `app/apps/glowe-web/js/app.js` (wish/need, post composer, opportunity/event, forum/discussion), showing a view-only notice instead of persisting. Unregistered "peek" visitors are blocked by the same guard. ✅

**Resolved decisions.**
- Audit logging via `public.audit_events` is intentionally skipped for the approval RPCs (the `audit_events.action` CHECK allow-list has no GloWe action and the per-row `org_reviewed_*` columns already capture who/when/why). Revisit if a GloWe admin audit trail is required.

---

## FR-GLOWE-004 — Settings screen, session relocation & language scaffold

**Status.** ✅ Done

A member-facing Settings screen consolidates account/session controls and prepares the ground for the upcoming Hebrew/English + RTL language selector. It also removes implementation/backend details that were previously surfaced to end users.

**Acceptance Criteria.**
- AC1. **No backend details in the UI.** The "Supabase connected / Local demo mode" notice (`renderBackendModeNotice`) is removed from the Personal Area and its dead CSS dropped. End users never see Supabase or any backend-implementation detail.
- AC2. **Settings screen.** New page `app/apps/glowe-web/pages/settings.html` (routed via `initSettingsPage()` in `app.js`) shows Account (name / email / account type), Language, and Session sections for a signed-in user; an unauthenticated visitor sees a sign-in prompt instead.
- AC3. **Entry points.** Settings is reachable from the Personal Area (a Settings action button) and from the header user-menu (the greeting block's primary action). The header no longer carries a Log Out control.
- AC4. **Log Out relocated.** The Log Out action lives in Settings → Session (calls the existing global `logout()`); it was moved out of the header.
- AC5. **Language scaffold.** Settings → Language offers English (active) and Hebrew (labelled "coming soon"); the choice persists to `localStorage['gloweLang']` via `setGloweLanguage()` so the full Hebrew + RTL selector (tracked separately) can apply it once localized copy ships.
- AC6. **Header action icons.** The signed-in header user-menu carries a Messages action and the Settings action. Messages is icon-only (chat-bubble) everywhere; Settings shows its "Settings" text label on desktop and collapses to a gear icon on phone widths (`@media max-width: 680px`). Both render as compact 40px buttons rather than full-width text buttons on phones.
- AC7. **Messages placeholder.** New page `app/apps/glowe-web/pages/messages.html` (routed via `initMessagesPage()`) is the destination of the header chat icon: a signed-in placeholder ("Direct messaging is coming soon", with links to Organizations / Community) ahead of real messaging on the shared KC backend; an unauthenticated visitor sees a sign-in prompt.
- AC8. **Clean-URL page routing.** The page-init router and nav active-state matching derive a logical page key via `resolveGlowePage(pathname)` (strip `.html`; anything outside `/pages/` is the home page) instead of substring-matching on `*.html`. This makes JS-rendered pages (Personal Area, Settings, Messages, Profile, opportunity detail) initialize identically under local `.html` URLs and the extension-less clean URLs Cloudflare Pages serves on dev/prod (e.g. `/glowe/pages/settings`). Previously these pages rendered an empty body on dev because the `.html`-substring router never matched.

---

## FR-GLOWE-005 — Interface language switch (Hebrew / English) + RTL

**Status.** ✅ Done — Phase 1 (chrome + home, full RTL) + Phase 2 (all inner-page chrome translated: Opportunities/Volunteer Network, Organizations, Community, Forums, Wishing Well, About, Terms, Settings, Personal Area, Messages, Admin, plus shared modals & onboarding). Only `data.js` seed demo content still falls back to English (intentional — see Out of scope).

GloWe shipped English-only (FR-GLOWE-001 AC1, "design byte-for-byte the original"). This FR activates the language scaffold left by FR-GLOWE-004 AC5: a Hebrew/English interface switch with a right-to-left layout for Hebrew. English remains the base language; untranslated copy intentionally falls back to English so no page renders half-broken.

**Acceptance Criteria.**
- AC1. **Switch + persistence.** Language is stored in `localStorage` under `gloweLang` (`en` default, reusing the FR-GLOWE-004 AC5 scaffold). Switching persists the choice and reloads the page, so every page re-renders in the new direction from a clean English baseline (no half-flipped state). `getGloweLanguage()` / `setGloweLanguage()` / `toggleGloweLanguage()` live in `js/app.js`.
- AC2. **Two entry points.** (a) A compact header toggle (`.lang-toggle`, showing the *other* language label `עב` / `EN`) is injected into the header on **every** page via `injectLanguageToggle()`, so anonymous visitors can switch too. (b) The Settings → Language `<select>` (FR-GLOWE-004 AC5) is now functional — the Hebrew "coming soon" label is removed. Settings is sign-in gated, hence the header toggle is the primary public entry point.
- AC3. **RTL layout.** On Hebrew, `applyGloweDirection()` sets `<html lang="he" dir="rtl">` and a `body.lang-he` class. `dir="rtl"` drives the browser's native mirroring (flex order, default alignment, list markers); `css/styles.css` adds a scoped `html[dir="rtl"]` block for the spots that hard-code physical alignment (page-header, modals, settings, footer, inputs) plus the `.lang-toggle` styling. A Hebrew font stack (`Assistant`, `Heebo`, …) is loaded via `@import` and applied under `body.lang-he`.
- AC4. **Translation engine.** A curated EN→HE dictionary (`GLOWE_TRANSLATIONS.he`, ~860 keys) covers the interface chrome (nav, auth, user menu, footer, login/register/success/onboarding modals, settings), the **home page** content, and the **inner-page chrome** of every page (page headers, section titles, filter/tab labels, buttons, empty states, card labels, placeholders, shared modal forms — Share a Wish, Offer Support, Edit Profile, Add Project, Report — and the Terms legal prose). `translateGloweTree(root)` walks text nodes + select attributes (`placeholder`, `title`, `aria-label`, `alt`) and replaces exact-match English keys; it is idempotent (localized text no longer matches an English key). On Hebrew load the whole `document.body` is translated once, and a `MutationObserver` (childList/subtree) translates content injected later (modals, settings card, data-driven lists). Keys not present in the dictionary stay English (intended fallback). The dictionary is excluded from the repo Hebrew-text scan (`scripts/extract-hebrew-text.mjs`) because GloWe has no i18next runtime — the in-`app.js` dictionary is its canonical locale bundle.
- AC5. **No HTML churn.** Because `js/app.js` already runs on all ~16 pages and injects the shared header/footer, the engine lives entirely in `js/app.js` + `css/styles.css` — no per-page HTML edits, preserving the vendored page templates.

**Out of scope.**
- Translation of `data.js` seed/demo content (sample opportunity & organization names/descriptions, demo post bodies, member counts, composed aria-labels like "Share <title>") — this is transient placeholder data replaced by real backend content, so it intentionally falls back to English rather than bloating the locale bundle.
- Per-user server-side language persistence (the choice is device-local for now).

**Resolved decisions (PM call, 2026-06-28).**
- Phased rollout (Option A): ship the switch mechanism + full RTL + translated chrome and home page now; translate remaining page content incrementally, rather than blocking on a full 16-page content translation. English fallback keeps every page coherent in the interim.
- The switch is exposed both in the header (for everyone, incl. anonymous visitors) and in the existing Settings card.
