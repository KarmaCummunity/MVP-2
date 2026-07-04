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

**Implementation (2026-06-29):** Admin gate uses `glowe_admin` role in the existing `admin_role_grants` table (no new table needed — `handle_new_user()` creates `public.users` rows for all sign-ins). Predicate: `is_glowe_admin(uid)` checks `glowe_admin OR super_admin`. Frontend: `backend.isGloweAdmin()` via `get_my_admin_roles()` RPC; `admin.html` redirects non-admins.

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

---

## Phase B — Live Content Layer

> **Status:** ⏳ Planned. Phase B wires every existing page to real Supabase persistence. All UI shells are already built; this phase replaces mock/localStorage data with live `glowe_*` table reads and writes. Full PRD: `docs/superpowers/specs/2026-06-29-glowe-mvp-prd.md`. Full SRS: `docs/superpowers/specs/2026-06-29-glowe-mvp-srs.md`.

### Schema at Phase B entry point (migrations 0204–0206)

| Table | Purpose | RLS |
|-------|---------|-----|
| `glowe_profiles` | User profiles incl. org fields + onboarding state | Public read, owner write, admin-only approval |
| `glowe_projects` | Projects under a profile | Public read, owner write |
| `glowe_opportunities` | Volunteer opportunities | Public read, owner write |
| `glowe_posts` | Wishing Well + community posts (type discriminator) | Public read, owner write |
| `glowe_comments` | Comments on posts/opportunities | Public read, owner write |
| `glowe_saved_items` | Bookmarks | Owner only |
| `glowe_applications` | Volunteer applications | Owner only |

**New Phase B tables** (land with the first Phase B migration):

| Table | Purpose |
|-------|---------|
| `glowe_forum_groups` | Discussion group catalog (static admin-managed) |
| `glowe_forum_threads` | Threads within a group (user-created) |
| `glowe_forum_replies` | Replies to threads |
| `glowe_offers` | "Offer support" response to a Wishing Well post |
| `glowe_reports` | User-submitted content reports |

---

## FR-GLOWE-006 — Wishing Well: live needs board

**Status.** ✅ Done — DB foundation (migration `0215`: `post_type`/`wish_type`/`impact_area`/`status` columns on `glowe_posts` + owner-only `glowe_offers` table + SQL regression) plus all frontend slices: B1b live read+filters+stats+empty (`js/glowe-wishes.js`), B1c Post-a-Need (`insertOwned('posts', {post_type:'wish',status:'open'})`), B1d Offer-Support persist (login-gated → `insertOwned('offers', …)`) and owner-only close/fulfil (`updateOwned('posts', id, {status:'fulfilled'})`). Pure helpers unit-tested in `js/__tests__/glowe-wishes.test.js`.

The Wishing Well page (`pages/wishing-well.html`) shows community needs posted by members. Phase B replaces the mock data with live reads from `glowe_posts` (type discriminator `post_type = 'wish'`) and connects the "Post a Need" form to persist.

**Acceptance Criteria.**
- AC1. **Read.** `pages/wishing-well.html` loads all open wishes from `glowe_posts` where `post_type = 'wish'` and `status = 'open'`, ordered by `created_at DESC`. Anonymous visitors see the full list (no login required).
- AC2. **Filters.** The existing filter sidebar (wish type, location, impact area) filters live data client-side after the initial fetch. Clearing filters restores the full list without a network request.
- AC3. **Post a Need.** Clicking "Post a Need" calls `canCreateContent()` (FR-GLOWE-003 gate). A verified member sees the wish-creation modal: required fields `title`, `wish_type` (enum), `impact_area`, optional `location`, `description`, `tags[]`. On submit, `insertOwned('posts', payload)` is called with `post_type = 'wish'`, `status = 'open'`.
- AC4. **Offer Support.** Each wish card has an "Offer Support" CTA. Clicking it (requires login, any verified account type) opens the offer modal: name/org (pre-filled), what you can offer (text), availability, contact preference. Persists to `glowe_offers (post_id, user_id, offer_text, availability, contact_preference)`.
- AC5. **Close a wish.** The wish owner sees a "Mark as fulfilled" CTA on their own wish cards. Clicking it sets `status = 'fulfilled'` and removes the card from the open board. Fulfilled wishes remain visible on the owner's Personal Area under "Past needs".
- AC6. **Empty state.** When no wishes match the active filters, a friendly empty-state card is shown with a "Post the first need" CTA.
- AC7. **Stats strip.** The hero stats (open wishes, impact areas, active projects) are computed from live `glowe_posts` aggregates, not hardcoded.
- AC8. **Translations.** All new labels and UI copy generated by Phase B JS for this page must be added to `GLOWE_TRANSLATIONS.he` in `app.js` (or a separate locale file) so the Hebrew language switch covers them.

**New columns on `glowe_posts`.**
- `post_type text not null default 'community'` — discriminator: `'wish' | 'community'`
- `wish_type text` — wish subtype (Volunteers Needed, Resource Request, …)
- `impact_area text` — impact area filter tag
- `status text not null default 'open'` — `'open' | 'fulfilled'`

**Out of scope.**
- Realtime updates (Supabase Realtime subscription) — can be added later as a perf enhancement.
- Server-side pagination (client fetch is acceptable for Phase B given expected volume).

---

## FR-GLOWE-007 — Volunteer Network: live opportunities

**Status.** ✅ Done — AC1 (live read), AC2 (client filters), AC3 (create), AC4 (detail page) and AC5 (Apply + duplicate guard) delivered: `initOpportunitiesPage`/`initOpportunityDetailPage` fetch `glowe_opportunities` via `listAll('opportunities')` → `mapOpportunityRow`; publishing goes through a `canCreateContent()`-gated async `handleOpportunitySubmit` → awaited `insertOwned('opportunities', …)` + live-board reload; applying goes through a login-gated async `handleApplicationSubmit` that rejects duplicates (`isDuplicateApplication` against `listOwned('applications')`) before awaited `insertOwned('applications', …)`. Pure helpers in `js/glowe-opportunities.js` (`validateOpportunityDraft`/`normalizeOpportunityDraft`/`isDuplicateApplication`) unit-tested.

The Volunteer Network page (`pages/volunteer-network.html`) and opportunity detail page (`pages/opportunity.html`) currently show mock `opportunities` from `data.js`. Phase B replaces these with live reads from `glowe_opportunities`.

**Acceptance Criteria.**
- AC1. **Read.** `pages/volunteer-network.html` loads all opportunities from `glowe_opportunities`, ordered by `created_at DESC`. Anonymous visitors see the full list.
- AC2. **Filter.** The existing filter controls (location, field, commitment) filter live data client-side.
- AC3. **Create.** Verified members (individuals and approved organizations) can post an opportunity via the existing form on the page. `canCreateContent()` gate enforced. Required fields: `title`, `organization` (pre-filled from profile if available), `field`, `commitment`, `description`. Optional: `location`, `duration`, `skills[]`, `requirements`, `responsibilities`.
- AC4. **Detail page.** `pages/opportunity.html?id=<id>` fetches the single opportunity by `id` from `glowe_opportunities`. Falls back to the `data.js` sample set when `id` matches a demo id (for offline/dev demo).
- AC5. **Apply.** The "Apply" button on the detail page calls `canCreateContent()`. A verified member sees the application modal (availability, relevant skills, motivation). Persists to `glowe_applications (opportunity_id, user_id, availability, skills, motivation, status='Pending')`. A duplicate application (same `user_id` + `opportunity_id`) shows "Already applied" state.
- AC6. **Featured.** Opportunities with `featured = true` appear at the top of the listing grid.
- AC7. **Empty state.** Friendly empty state with "Post the first opportunity" CTA when no results.
- AC8. **Translations.** New UI strings added to Hebrew locale.
- AC9. **Events (additive model).** An opportunity becomes an **Event** when `start_at` is set. Events are not a separate table or schema subtype — they ride the `glowe_opportunities` read/write/RLS paths and add event metadata: `start_at`/`end_at`, `event_type ∈ {physical, digital}`, `event_link` + `link_visibility ∈ {immediate, before_event}` (+ `link_reveal_hours`), `capacity` (null = unlimited), `registration_mode ∈ {open, gated}`, and `status ∈ {active, cancelled, closed}`. An **RSVP** reuses `glowe_applications` (no separate registrations table). Schema foundation: migration `0211`; the individual registration entry point is the `glowe_register_for_event` `SECURITY DEFINER` RPC (migration `0212`, open→`Accepted` / gated→`Pending`, event-state validation). Organizer decisions run through `glowe_list_event_registrations` + `glowe_decide_event_registration` (migration `0213`, accept/decline + reason, capacity→waitlist routing). The event lifecycle is completed by migration `0214`: an AFTER-UPDATE trigger auto-advances the next `Waitlisted` registrant when a confirmed spot is vacated, `glowe_get_event_link` gates the digital link by entitlement + `link_visibility` window, and `glowe_cancel_event` is owner-only cancellation. ✅ (EVT1–EVT5). Design: `docs/superpowers/specs/2026-06-29-glowe-event-rsvp-org-portal-design.md` (D-66).

---

## FR-GLOWE-008 — Community Feed: live posts

**Status.** ✅ Done — all ACs delivered (live read, search/filter, create, comment read+create, share, author attribution, delete-own, translations).

The Community page (`pages/community.html`) and Write Post page (`pages/write-post.html`) currently display mock content. Phase B connects them to `glowe_posts` where `post_type = 'community'`.

**Acceptance Criteria.**
- AC1. ✅ **Read.** Community page loads all posts with `post_type = 'community'`, ordered by `created_at DESC`. Anonymous visitors can read all posts. `loadCommunityPosts()` filters out wishes (`post_type='wish'`) via `GlowePosts.mapCommunityRows`.
- AC2. ✅ **Search/filter.** The existing keyword search and tag/category filters apply client-side to the fetched post list.
- AC3. ✅ **Create.** The Write Post page form and the inline composer persist to `glowe_posts` via `insertOwned('posts', payload)` with `post_type = 'community'` (shared `submitCommunityPost`). Required: `title`, `text`. Optional: `category`, `tags[]`, `audience`, `language`, `link`. `canCreateContent()` gate enforced.
- AC4. ✅ **Comments.** Comment **create** persists via `insertOwned('comments', { post_id, text, author_name })`; comment **display** now reads from `glowe_comments` — `loadPostComments()` (in `initCommunityPage`/`initMemberHome`) fetches via `listAll('comments')` and `GlowePosts.groupCommentsByPost` groups by `post_id`. `getPostCommentsFor(postId)` prefers backend rows and merges any local-only comment just posted (`GlowePosts.mergeCommentLists`, deduped by author+text) for instant feedback; localStorage is the offline/demo fallback when the backend is unconfigured.
- AC5. ✅ **Share.** Post cards render the social-share buttons (Facebook/LinkedIn/X/WhatsApp) **and** a "Copy link" control that writes the post's canonical URL — `GlowePosts.postCanonicalUrl(postId, origin)` → `<origin>/glowe/pages/community.html?post=<id>` — to the clipboard via `navigator.clipboard.writeText` and confirms with a success toast (`copyPostLink`). Canonical URL keyed on `postId` (not the mutable title). Per `D-67`, both share paths are retained.
- AC6. ✅ **Author attribution.** Post cards display `author_name` (mapped from the row). Pre-Phase-B / anonymous rows fall back to "Community Member". (Join to `glowe_profiles.display_name` deferred; `author_name` is stamped at create from the signed-in profile.)
- AC7. ✅ **Delete own post.** The post author sees a "Delete post" CTA in the post more-menu (owner-only via `GlowePosts.isPostOwner`); `deleteCommunityPost` calls `removeOwned('posts', { id })` (RLS owner-scoped, hard-delete) then reloads the feed.
- AC8. ✅ **Translations.** All Phase-B community-feed strings (create, delete-flow, share/copy-link) are in `GLOWE_TRANSLATIONS.he`. The comment-read path adds no new user-facing copy (comment text is user content; the "N comments" chrome was already localized).

---

## FR-GLOWE-009 — Forums & Discussions: live threads

**Status.** ✅ Done — BE schema foundation landed (migration `0217`: `glowe_forum_groups` + `glowe_forum_threads` + `glowe_forum_replies` created with RLS, 4 groups seeded). Live group catalog render (AC1); discussion-group + forums pages list threads live from `glowe_forum_threads` (AC2); verified members create threads via `insertOwned('forum_threads', …)` (AC3); inline replies read live from `glowe_forum_replies` with a live per-thread reply-count aggregate (AC4); friendly empty states across groups/threads/replies (AC6); live per-group member + post stats on forum and discussion-group cards (AC7); Hebrew keys added for all new UI strings (AC8). AC5 (like/react) deferred to Phase C.

The Forums page (`pages/forums.html`) lists discussion groups; each group links to `pages/discussion-group.html?group=<id>` with live threads. Currently hardcoded in `discussionGroups[]` in `data.js`.

**Acceptance Criteria.**
- AC1. **Group catalog.** ✅ `glowe_forum_groups` is an admin-managed catalog (seeded with the 4 groups: Education & Knowledge, Environment & Climate Action, Health & Community Care, Rights Safety & Civic Power). Forum groups are public-read; only glowe_admin/super_admin may insert/update. The Forums page, discussion-group page, and community topic-pills render live from this table via `loadForumGroups`→`listAll('forum_groups')` mapped by `GloweForums.mapForumGroups`; the hardcoded `discussionGroups[]` remains a demo/offline fallback (`getForumGroups()`).
- AC2. **Thread listing.** ✅ `pages/discussion-group.html?group=<id>` loads all threads via `loadForumThreads`→`listAll('forum_threads')` (newest-first) mapped by `GloweForums.mapForumThreads`, filtered client-side by `group_id` (`GloweForums.threadsForGroup`); the forums page lists the same threads across all groups. Thread cards show title, body, last-active date, and a placeholder reply count (live aggregate is AC7). The localStorage `gloweForumThreads` mirror is the offline fallback (TD-134).
- AC3. **Create thread.** ✅ Verified members create a thread (title + body) behind the `canCreateContent()` gate via shared `persistForumThread` → `insertOwned('forum_threads', {group_id, title, body})` (owner-write RLS sets `user_id`), then `reloadForumThreads()` + re-render. Both the discussion-group composer and the forums question form use this path; an optimistic localStorage mirror is written first for offline resilience.
- AC4. **Replies.** ✅ Each thread card on `pages/discussion-group.html?group=<id>` renders its replies inline, loaded live from `glowe_forum_replies` via `loadForumReplies`→`listAll('forum_replies', {ascending:true})` (oldest-first) mapped by `GloweForums.mapForumReplies` and filtered client-side by `thread_id` (`GloweForums.repliesForThread`). A per-thread reply composer persists via the `canCreateContent()`-gated async `handleReplySubmit` → shared `persistForumReply` → `insertOwned('forum_replies', {thread_id, body})` (owner-write RLS sets `user_id`), then `reloadForumReplies()` + re-render. The thread card's reply count is a live aggregate (`GloweForums.countRepliesByThread` on the forums page; `repliesForThread(...).length` on the discussion page). Thread-row markup is centralized in `renderDiscussionThread`. The localStorage `gloweForumReplies` mirror is the offline fallback (TD-134).
- AC5. **Like/react — deferred.** Not in Phase B; noted for Phase C.
- AC6. **Empty state.** ✅ Friendly empty states throughout: the discussion-group thread list shows "No threads yet / Start the first conversation in this group.", each thread with no replies shows "No replies yet. Be the first to respond.", the forums thread list and group grid and the community topic-pills each render a muted-note placeholder when their source is empty.
- AC7. **Stats.** ✅ Group cards (forums grid + discussion-group header) show a live member count (distinct `user_id`s who authored a thread or reply in the group, via `GloweForums.groupMemberCounts`) and post count (threads in the group, via `GloweForums.groupThreadCounts`). `withGroupStats` overlays both onto the mapped groups before render; both helpers are pure and unit-tested.
- AC8. **Translations.** ✅ Every new English UI string across the forum slices (empty states, reply composer, buttons, placeholders) has a `GLOWE_TRANSLATIONS.he` key. Dynamic counter strings (`N replies`, `N members`, `N posts`) contain interpolated numbers and stay untranslated by design (same limitation as existing counters).

**New tables.**
```sql
glowe_forum_groups (id text pk, title text, description text, tags text[], icon text, created_at timestamptz)
glowe_forum_threads (id uuid pk, group_id text fk→glowe_forum_groups, user_id uuid fk→auth.users, title text, body text, created_at timestamptz)
glowe_forum_replies (id uuid pk, thread_id uuid fk→glowe_forum_threads, user_id uuid fk→auth.users, body text, created_at timestamptz)
```
RLS: groups public read + admin-only write (via `has_admin_role` glowe_admin/super_admin); threads and replies: public read, owner write (`auth.uid() = user_id`). Delivered in migration `0217`; the 4 groups above are seeded (`on conflict do nothing`). Verified-member gating for thread/reply creation is enforced client-side by `canCreateContent()` (the RLS floor is owner-write, mirroring `glowe_posts`).

---

## FR-GLOWE-010 — Organizations Directory: live profiles

**Status.** ✅ Done — AC1–AC8 delivered. Reach-out posts use `post_type='outreach'` (migration 0218 widened the `glowe_posts` post_type/status CHECKs) and are excluded from the community feed + wishes board by the existing `isCommunityPost`/`isOpenWish` discriminators. Phase-B visibility scoping (sender + recipient) is a stub; Phase C routes to KC direct messages.

The Organizations page (`pages/organizations.html`) currently renders from `organizations[]` in `data.js`. Phase B replaces it with live reads from `glowe_profiles` where `account_type = 'organization' AND approval_status = 'approved'`.

**Acceptance Criteria.**
- AC1. **Read.** Organizations page fetches all `glowe_profiles` with `account_type = 'organization' AND approval_status = 'approved'`. Anonymous visitors see the full directory.
- AC2. **Filter.** The existing filter controls (field/focus, country, size) filter client-side on the fetched list.
- AC3. **Profile cards.** Each card shows: `org_name`, `org_field`, `org_country`, `org_description` (truncated), `avatar_url` (if set). Links to `pages/profile.html?id=<id>`.
- AC4. **Public profile page.** `pages/profile.html?id=<id>` fetches `glowe_profiles` by `id`. Displays all public fields (name, about, focus, country, languages, skills, public_link, projects). For orgs also shows: `org_name`, `org_field`, `org_website`, `org_description`, `org_size`.
- AC5. **Projects list.** ✅ Public profile page loads `glowe_projects` filtered by `user_id` where `status != 'Draft'`, displaying title + description. `_loadPublicProjects` (app.js) reads `listAll('projects')` and delegates mapping/filtering to `GloweOrganizations.mapProjects`/`publicProjectsForUser` (js/glowe-organizations.js, unit-tested); results flow into `_adaptDbProfile` → `_renderProfileContent`'s existing projects grid, which already carries a localized empty state ("No projects listed yet.").
- AC6. **Contact CTA.** ✅ "Reach Out" button on the org card (`renderOrganizationCard`) opens a contact modal (message). `handleReachOutSubmit` (login-gated) persists to `glowe_posts` via `insertOwned('posts', …)` using `GloweOrganizations.buildOutreachPayload`/`validateOutreachDraft` (js/glowe-organizations.js, unit-tested): `post_type='outreach'`, `status='sent'`, recipient encoded in `audience`. Migration `0218` widened the post_type/status CHECKs. Outreach posts never surface on the public feed (`isCommunityPost` returns false for them). Phase C: routes to KC direct messages.
- AC7. **Empty state.** When no approved organizations are listed, show an invitation to register.
- AC8. **Translations.** ✅ All new UI strings added to the Hebrew locale (`GLOWE_TRANSLATIONS.he`): the reach-out modal (Reach Out / Send Message / context / placeholder) and its success/guard toasts, plus the previously-untranslated "Missing details" / "Backend unavailable" toast titles now surfaced by this flow. The directory list strings were localized in the earlier phase.

---

## FR-GLOWE-011 — Profile Management: Phase B completion

**Status.** 🟡 In progress

Personal Area (`pages/my-applications.html`) currently shows a mix of live profile data (from `glowe_profiles` via Phase A onboarding) and mock/localStorage project data. Phase B completes the loop: all CRUD persists to Supabase, localStorage is used only as a cache/optimistic-update layer.

**Acceptance Criteria.**
- AC1. **Profile read.** On Personal Area load, `gloweBackend.fetchProfile()` is awaited and its result is written to localStorage (so re-renders use the cache). A loading skeleton is shown while the request is in flight.
- AC2. **Edit profile.** The "Edit Profile" modal saves via `gloweBackend.upsertProfile(payload)`. All profile fields are persisted, not just onboarding fields. On success, cache is invalidated and the Personal Area re-renders.
- AC3. **Avatar upload.** Profile image upload via `<input type="file">` → Supabase Storage bucket `glowe-avatars` → signed URL written to `glowe_profiles.avatar_url`. Validates file type (image/*) and size (max 5 MB) client-side.
- AC4. **Projects CRUD.** 🟡 Read + create + delete wired. Read: the Personal Area projects list loads live from `gloweBackend.listOwned('projects')` (`loadPersonalProjects` caches to localStorage; `getPersonalProjectsForView` prefers the backend list once loaded, trusting an empty backend as a real empty state via the `personalProjectsView` pure helper). Create: `persistPersonalProject` inserts via `insertOwned('projects', buildProjectPayload(draft))` when signed in (localStorage fallback offline); the Add-Project modal validates a non-empty title (`validateProjectDraft`). Delete: an owner-only "Delete" control on each project card calls `deletePersonalProject(id)` → `removeOwned('projects', {id})` (user-scoped) then refreshes; the public profile card omits the control. `buildProjectPayload`/`validateProjectDraft` are unit-tested (`js/glowe-organizations.js`). **Edit** (in-place update of an existing project) has no UI yet — the follow-up slice adds an edit modal + `updateOwned('projects', …)`.
- AC5. **My wishes.** ✅ A "My Needs" section on the Personal Area shows the user's own Wishing Well posts (open + fulfilled), loaded from `gloweBackend.listOwned('posts')` and filtered to `post_type = 'wish'` by the `myWishPosts` pure helper (`js/glowe-organizations.js`, unit-tested), then mapped by the shared `GloweWishes.mapWishRow` (no duplication). Loader/getter mirror AC4 (`backendMyWishes` cache, `loadMyWishes` fires after the synchronous render, guest/offline safe; `getMyWishesForView` returns the loaded list, empty otherwise). Empty state + Hebrew keys added.
- AC6. **My posts.** ✅ A "My Posts" section on the Personal Area shows the user's own community posts, loaded from `gloweBackend.listOwned('posts')` and filtered to `post_type = 'community'` (legacy null included) + mapped by the shared `GlowePosts.mapCommunityRows` pure helper (unit-tested in `glowe-posts.test.js`; reused instead of a new discriminator to avoid duplication). Loader/getter mirror AC5 (`backendMyPosts` cache, `loadMyPosts` fires after the synchronous render, guest/offline safe; `getMyPostsForView` returns the loaded list, empty otherwise). `renderMyPostsList` renders compact cards (category tag + title + body) with an empty state; a separate section from "Recent Activity" (which shows *saved*, not authored, posts). `glowe-posts.js` include added to `my-applications.html`; Hebrew keys added.
- AC7. **My opportunities.** ✅ A "My Opportunities" section on the Personal Area lists opportunities the user posted, loaded from `gloweBackend.listOwned('opportunities')` (already user-scoped) and mapped by the `mapOwnedOpportunities` pure helper (`js/glowe-organizations.js`, unit-tested) into a compact card shape (title / field / commitment / location / status). Loader/getter mirror AC6 (`backendMyOpportunities` cache, `loadMyOpportunities` fires after the synchronous render, guest/offline safe; `getMyOpportunitiesForView` returns the loaded list, empty otherwise). `renderMyOpportunitiesList` renders compact cards + empty state. Kept distinct from the existing "Opportunities & Applications" card, which shows the user's *applications* (not authored opportunities). Hebrew keys added.
- AC8. **Applications sent.** ✅ The Personal Area "Opportunities & Applications" card now shows the user's real applications from `glowe_applications` (via `gloweBackend.listOwned('applications')`), enriched with the target opportunity's title + organization looked up from the public `listAll('opportunities')` list. Event RSVPs are excluded here — `glowe_applications` holds both volunteer applications and event registrations, distinguished only by whether the linked opportunity has a `start_at` (an event); event registrations render in the separate "My Events" section, so this list keeps only applications whose opportunity exists and is **not** an event. Pure helpers in `js/glowe-organizations.js` (unit-tested): `opportunitiesById` (`id→row` lookup), `mapOwnedApplication` (compact id/opportunityId/opportunityTitle/organization/status/appliedAt shape), `volunteerApplicationViews(rows, opportunityById, isEvent)` (filters out events via the injected `GloweEvents.isEvent` predicate, then maps). Loader/getter mirror AC7 (`backendMyApplications` cache, `loadMyApplications` fires after the synchronous render, guest/offline safe; `getMyApplicationsForView` returns the live list once loaded, else `null` so the render falls back to the localStorage cache). `renderApplicationCard` was made backward-compatible: it prefers the enriched `opportunityTitle`/`organization`/`appliedAt` fields and falls back to the local opportunity lookup for the legacy cache shape (no duplicate render function). No new user-facing strings (the card, empty state, and status values were already localized).
- AC9. **Offers made.** ✅ A "My Offers" section on the Personal Area lists support offers the user made, loaded from `gloweBackend.listOwned('offers')` (already user-scoped) and enriched with the target wish's title: the public posts list (`listAll('posts')`) is reduced to an `id → title` lookup by the `postTitlesById` pure helper, then each offer is mapped by `mapOwnedOffers`/`mapOwnedOffer` (all three in `js/glowe-organizations.js`, unit-tested) into a compact shape (wishTitle / offerText / availability / contactPreference). Loader/getter mirror AC7 (`backendMyOffers` cache, `loadMyOffers` fires after the synchronous render, guest/offline safe; `getMyOffersForView` returns the loaded list, empty otherwise). `renderMyOffersList` renders compact cards + empty state. Kept distinct from "My Needs" (the user's own wishes). Hebrew keys added.
- AC10. **Delete account.** Settings → Account → Delete Account: removes `glowe_profiles` row (cascade deletes child rows via FK), then calls `supabase.auth.signOut({ scope: 'local' })`. Does NOT delete `auth.users` (that requires KC super-admin action).
- AC11. **Translations.** New UI strings added to Hebrew locale.

---

## FR-GLOWE-012 — Applications & Offers: volunteer matching

**Status.** ⏳ Planned

Opportunity owners need to see who applied; wish owners need to see who offered support. Phase B adds a lightweight "My Inbox" view for managing inbound interest on content the user owns.

**Acceptance Criteria.**
- AC1. **Opportunity owner inbox.** On `pages/opportunity.html`, when the viewer is the opportunity owner, an "Applicants" section renders below the opportunity body, listing all `glowe_applications` for that opportunity (applicant name via `glowe_profiles`, availability, skills, motivation, status, applied-at).
- AC2. **Accept/decline application.** Opportunity owner can update `glowe_applications.status` to `'Accepted'` or `'Declined'` (via a dedicated `SECURITY DEFINER` RPC `glowe_update_application_status(p_application_id, p_decision)` gated to the opportunity owner). The RPC validates `p_decision ∈ {'Accepted','Declined'}`.
- AC3. **Wish owner offer inbox.** On the wish detail view (expanded card or a dedicated URL), the wish owner sees all `glowe_offers` for that wish (offerer name, offer text, availability, contact preference, submitted-at).
- AC4. **Contact link.** Each application/offer row has a "Connect" CTA; for Phase B this copies the applicant's contact info (email from `glowe_profiles`) to clipboard. Phase C: routes to KC direct messages.
- AC5. **Status badge.** Application status badge (`Pending / Accepted / Declined / Waitlisted / Cancelled`) is visible to the applicant on their My Applications tab (FR-GLOWE-011 AC8).
- AC6. **Translations.** New UI strings added to Hebrew locale.
- AC7. **Registration lifecycle guard (events).** `glowe_applications.status` is constrained to `{Pending, Accepted, Declined, Waitlisted, Cancelled}` and a `BEFORE INSERT/UPDATE` guard (`glowe_applications_guard_status`, migration `0211`) blocks clients from self-deciding: a client INSERT must be `Pending`, a client UPDATE may only move to `Cancelled`, and server-managed fields (`decided_at`, `decided_by`, `waitlist_position`, `rejection_note`) cannot be set by the client. A partial unique index permits exactly one active RSVP per `(opportunity_id, user_id)` while allowing re-RSVP after `Cancelled`/`Declined`. Organizer decisions (accept / decline + reason, capacity routing) flow through the `SECURITY DEFINER` RPCs `glowe_list_event_registrations` (owner-scoped registrant list, migration `0213`) and `glowe_decide_event_registration` (accept → Accepted, or Waitlisted with a FIFO position when the event is at capacity; decline → Declined with a required reason ≤ 500 chars), both bypassing the guard. The event detail page renders a "Manage registrations" panel to the event owner. ✅ (slice 4)

**New table.**
```sql
glowe_offers (
  id          uuid pk default gen_random_uuid(),
  post_id     text not null fk→glowe_posts(id) on delete cascade,
  user_id     uuid not null fk→auth.users(id) on delete cascade,
  offer_text  text not null,
  availability text,
  contact_preference text,
  created_at  timestamptz not null default now(),
  unique (post_id, user_id)
)
```
RLS: owner-read for post owner (`glowe_posts.user_id = auth.uid()`) and offer author (`glowe_offers.user_id = auth.uid()`); no public read. New `SECURITY DEFINER` read RPC `glowe_list_offers_for_post(p_post_id)` gated to `glowe_posts.user_id = auth.uid()`.

---

## FR-GLOWE-013 — Saved Items: live bookmarks

**Status.** ⏳ Planned

The Saved page (`pages/saved.html`) currently reads `glowe_saved_items` through `gloweBackend.listOwned('saved_items')` but save/unsave calls are not wired from the opportunity, wishing well, and community pages. Phase B closes the loop.

**Acceptance Criteria.**
- AC1. **Save CTA.** Every opportunity card, wish card, community post card, and org profile card has a bookmark icon. Clicking it (requires login) calls `insertOwned('saved_items', { item_type, item_id, title, meta, href })`. Duplicate (same `user_id + item_type + item_id`) is silently ignored (unique constraint in 0204).
- AC2. **Unsave.** A second click on the bookmark icon (active state) calls `removeOwned('saved_items', { item_type, item_id })`.
- AC3. **Saved page.** `pages/saved.html` loads all `glowe_saved_items` for the signed-in user, grouped by `item_type` (Opportunities / Wishes / Posts / Organizations). Each item links back to its canonical page URL (from the `href` column).
- AC4. **Optimistic UI.** The bookmark icon toggles instantly on click; the Supabase call is fire-and-forget. On error, the state is reverted and a toast is shown.
- AC5. **Unauthenticated state.** The Saved page redirects to the sign-in prompt for unauthenticated visitors.
- AC6. **Translations.** New UI strings added to Hebrew locale.

---

## FR-GLOWE-014 — Direct Messaging: Phase B routing

**Status.** ⏳ Planned

Full real-time messaging is deferred to Phase C (KC chat integration). Phase B replaces the placeholder `pages/messages.html` with a functional stub that covers the most urgent use case: connecting an offerer/applicant with a content owner.

**Acceptance Criteria.**
- AC1. **Messages page.** `pages/messages.html` lists the user's active conversations from `glowe_posts` where `post_type = 'outreach'` and `(user_id = me OR audience = me::text)`, sorted by `created_at DESC`. Each "conversation" is a single outreach post.
- AC2. **Send a message.** From an org profile card (FR-GLOWE-010 AC6), a "Reach out" modal submits an outreach post (`post_type = 'outreach'`, `audience = recipient_user_id`). The recipient's messages page shows the new message.
- AC3. **Reply.** The recipient can reply via a comment on the outreach post (`glowe_comments`). This creates a linear thread visible to both parties.
- AC4. **Unread badge.** The messages header icon shows a badge with the count of outreach posts where `audience = me` and `created_at` is newer than the user's last Messages page visit (stored in `localStorage['glowe-messages-last-read']`).
- AC5. **Phase C note.** A banner on the Messages page informs users: "Full real-time messaging is coming soon." Phase C replaces this stub with KC's native chat infrastructure.
- AC6. **Translations.** New UI strings added to Hebrew locale.

---

## FR-GLOWE-015 — Moderation & Reporting

**Status.** ⏳ Planned

GloWe needs a lightweight content moderation path so that harmful or inappropriate posts, wishes, opportunities, and profiles can be flagged and reviewed.

**Acceptance Criteria.**
- AC1. **Report CTA.** Every public content card (wish, community post, opportunity, org profile) has a "Report" overflow action (⋮ menu or flag icon). Clicking it (requires login) opens a report modal: reason (enum) + optional note. Persists to `glowe_reports (reporter_id, target_type, target_id, reason, note)`.
- AC2. **Report reasons.** Enum values: `spam`, `harassment`, `misinformation`, `inappropriate_content`, `fake_profile`, `other`.
- AC3. **Duplicate guard.** A user may report the same `(target_type, target_id)` only once. A second attempt shows "You already reported this."
- AC4. **Admin view.** The existing GloWe Admin page (`pages/admin.html`) gains a "Reports" tab listing all `glowe_reports`, gated to KC admins/moderators (same `admin_assert_role` check as FR-GLOWE-003). Each report row shows: reporter name, target type + id, reason, note, submitted-at, a link to the target, and a "Dismiss" / "Remove content" action.
- AC5. **Remove content.** Admin "Remove content" action sets `glowe_posts.status = 'removed'` or `glowe_opportunities.status = 'removed'` (requires adding `status` column to `glowe_opportunities`). Removed content is excluded from all public listings. A `SECURITY DEFINER` RPC `glowe_admin_remove_content(p_type, p_id, p_report_id)` handles this atomically.
- AC6. **Translations.** New UI strings added to Hebrew locale.

**New table.**
```sql
glowe_reports (
  id          uuid pk default gen_random_uuid(),
  reporter_id uuid not null fk→auth.users(id) on delete cascade,
  target_type text not null,  -- 'post' | 'opportunity' | 'profile' | 'comment' | 'thread' | 'reply'
  target_id   text not null,
  reason      text not null,
  note        text,
  status      text not null default 'open', -- 'open' | 'dismissed' | 'actioned'
  reviewed_by uuid fk→auth.users(id) on delete set null,
  reviewed_at timestamptz,
  created_at  timestamptz not null default now(),
  unique (reporter_id, target_type, target_id)
)
```
RLS: reporter can read own reports; admin RPCs gate moderation actions.

## FR-GLOWE-016 — Member experience shell & adaptive create system

**Status.** 🟡 In progress — Part A (session integrity) and Part B (adaptive home) done; Parts C/D planned.

The logged-in member layer that ties the Phase-B surfaces together: a clean sign-out, an
adaptive home, and a single account-type-aware "create" entry point. This FR **composes** the
Phase-B FRs rather than rebuilding them — Post→FR-008, Event (opportunity+date)→FR-007,
Need→FR-006 (`post_type='wish'`), Offer→new `post_type='offer'` (extends FR-006 CHECK), and the
Need "I'll help" chat **reuses KC's shared `public.chats`/`public.messages`** (supersedes the
FR-GLOWE-014 outreach-post model; aligns with D-61). Full design:
`docs/superpowers/specs/2026-06-29-glowe-member-experience-and-create-system-design.md`.

**Acceptance Criteria.**
- AC1. **Session integrity (done).** `logout()` clears all identity keys (`gloweUser`, legacy
  key, and the cached `glowePersonalProfile`) and always redirects to the guest home from any
  page via an `inPages`-aware relative href (correct on local `.html` and dev clean URLs). The
  Personal Area (`my-applications`) is guarded by `requireGloweMember()` — anonymous visitors are
  redirected home before any member body renders. `settings`/`messages` keep their FR-GLOWE-004
  AC2 sign-in prompts and `profile` stays the public profile view; none are force-guarded.
- AC2. **Adaptive home (done).** Signed-in members see a personal hero ("Welcome back, {first
  name}" + create CTAs), a "Your activity" rail (their own posts, filtered by `authorId`), and a
  unified "What's happening" feed (recency-interleaved opportunities + posts, capped) in place of
  the marketing home; guests keep the marketing home untouched. The member view renders into a
  hidden `#member-home` section revealed by `initMemberHome()`; a `body.glowe-member-home` class
  hides the marketing sections. Empty states are creation CTAs. Selectors (`selectMemberActivity`,
  `selectCommunityHighlights`) are pure; cards reuse `renderOpportunityCard` (root-relative) plus a
  compact `renderMemberFeedPost`. Per-segment personalization deferred to Phase B real content.
- AC3. **Adaptive create menu.** ⏳ A `+` FAB (phone, center of bottom nav) and a desktop "Create"
  button open one menu showing only permitted types: organization → Post/Event/Need; individual →
  Volunteer-offer/Need; anon → sign-in prompt; unverified org → awaiting-verification prompt.
- AC4. **Tailored create forms.** ⏳ Each type validates its required fields client-side before a
  save; submissions route to the composed Phase-B surface.
- AC5. **Event RSVP.** ✅ Registering to an Event goes through the `glowe_register_for_event` `SECURITY DEFINER` RPC (migration `0212`): open events are instantly `Accepted`, gated events become `Pending`; event state (is-event, `active`, not-ended) is validated server-side and submitted contact fields are stored. The opportunity detail page renders a registration panel (sign-in gate → register form → current-status + cancel), and the personal area has a "My Events" list with a per-status badge and cancel. Registrations remain `glowe_applications` rows (also visible in "My Applications").
- AC6. **Need help-chat on KC backend.** ⏳ "I'll help" opens a 1:1 chat on KC's real
  `public.chats`/`public.messages` (anchor `NULL` + a seeded first message carrying the need title).
- AC7. **Modular type registry.** ⏳ Create types are a declarative data table (id, label,
  permittedAccountTypes, surface, requiredFields) + dispatch, so adding a type is one entry.
