# Karma Community MVP — Backlog

> **Purpose:** Priority-ordered task queue. Agents pick the highest-priority ⏳ item.
> Update this file when starting (⏳→🟡) or completing (🟡→✅) work.

---

## P0 — Core Foundation (Must Ship)

| ID | Task | Owner | Status | Spec |
|----|------|-------|--------|------|
| P0.1 | Auth & Onboarding (Google, Email, Phone, Wizard) | agent-be + agent-fe | ✅ Done | `spec/01_auth_and_onboarding.md` |
| P0.2 | Profile CRUD + Privacy toggle | agent-be + agent-fe | ✅ Done | `spec/02_profile_and_privacy.md` |
| P0.3 | Onboarding wizard (3-step) | agent-fe | ✅ Done | `spec/01_auth_and_onboarding.md` FR-AUTH-010..012 |
| P0.4-BE | Posts repository + RLS + images | agent-be | ✅ Done | `spec/04_posts.md` |
| P0.4-FE | Feed UI + create post + post detail | agent-fe | ✅ Done | `spec/04_posts.md`, `spec/06_feed_and_search.md` |
| P0.5 | Direct chat + realtime | agent-be + agent-fe | ✅ Done | `spec/07_chat.md` |
| P0.6 | Closure flow (mark delivered + reopen) | agent-be + agent-fe | ✅ Done | `spec/05_closure_and_reopen.md` |

## P1 — Safety, Discovery & Polish

| ID | Task | Owner | Status | Spec |
|----|------|-------|--------|------|
| P1.1 | Following & follow requests | agent-be + agent-fe | ✅ Done | `spec/03_following.md` |
| P1.2 | Feed discovery (proximity sort, filters, universal search) | agent-fe | ✅ Done | `spec/06_feed_and_search.md` FR-FEED-004..019 |
| P1.2.x | Close-post-from-chat + anchor lifecycle | agent-be + agent-fe | ✅ Done | `spec/07_chat.md` FR-CHAT-014..015 |
| P1.2.y | Chat personal inbox hide + deduped inbox (`FR-CHAT-016`) | agent-be + agent-fe | ✅ Done | `spec/07_chat.md` |
| P1.3 | Reports + auto-removal + false-report sanctions | agent-be + agent-fe | ✅ Done | `spec/08_moderation.md` |
| P1.3.1 | Admin report-bubble deeplink + auto-removed message (FR-MOD-001 AC4 + FR-MOD-005 AC3) | agent-be + agent-fe | ✅ Done | `spec/08_moderation.md` |
| P1.3.2 | Chat mark-read covers system messages (FR-CHAT-011 AC4) — migrations `0054` + `0055` (`delivered_at` back-fill + defensive RPC) deployed to prod + dev; pull-to-refresh on inbox + dev-tools "סימולציית רענון מלא" | agent-be + agent-fe | ✅ Done | `spec/07_chat.md` |
| P1.5 | Push notifications | agent-be + agent-fe | ✅ Done | `spec/09_notifications.md` |
| P1.6 | MVP email verification gate (migration 0067 + verify route + verify-pending panel) | agent-be + agent-fe | ✅ Done | `spec/01_auth_and_onboarding.md` FR-AUTH-006 / FR-AUTH-007; `DECISIONS.md` D-20 |
| P1.6.1 | Verification status follow-up: phone OTP + Apple-hide-email path leaves `account_status='pending_verification'`; trigger only watched `email_confirmed_at` (migration 0068 — provider-aware INSERT + dual-column verified trigger + backfill) | agent-be | ✅ Done | `spec/01_auth_and_onboarding.md` FR-AUTH-005 / FR-AUTH-006; `DECISIONS.md` D-20 |

## P2 — Stats, Admin & Polish

| ID | Task | Owner | Status | Spec |
|----|------|-------|--------|------|
| P2.1 | Personal & community statistics screen | agent-fe | ✅ Done | `spec/10_statistics.md` |
| P2.2 | Full super-admin moderation queue | agent-be + agent-fe | ✅ Done | `spec/12_super_admin.md` |
| P2.3 | Guest preview polish | agent-fe | ✅ Done | `spec/01_auth_and_onboarding.md` FR-AUTH-014 |
| P2.4 | Owner delete closed-without-recipient posts (RLS + FR-POST-010) | agent-be + agent-fe | ✅ Done | `spec/04_posts.md` FR-POST-010, `DECISIONS.md` D-18 |
| P2.5 | Closed posts on both profiles (D-19) | agent-be + agent-fe | ✅ Done | `spec/02_profile_and_privacy.md` FR-PROFILE-001 AC4, FR-PROFILE-002 AC2; `spec/04_posts.md` FR-POST-017 AC1+AC5 |
| P2.6 | About landing (full vision narrative, section menu, Instagram embed, `/about-site`, query chrome for web shells) | agent-fe | ✅ Done | `spec/11_settings.md` (About under Settings) |
| P2.7 | Privacy-mode reframe to follow-approval flag only (migration `0069`, FR-PROFILE-003/004/010 rewrite, `LockedPanel` deletion) | agent-be + agent-fe | ✅ Done | `spec/02_profile_and_privacy.md` FR-PROFILE-003, 004, 010; `DECISIONS.md` D-21 |
| P2.8 | BE security hardening — closes 7 CRITICAL/HIGH from audit 2026-05-10 (anon grants, RPC enumeration, support-thread race, inject_system_message forgery, server-managed column writes) | agent-be | ✅ Done | `docs/SSOT/archive/AUDIT_2026-05-10_full_codebase_review.md` §1.1, §1.2, §15.1, §15.2, §15.3, §15.5, §15.11; migration `0070_security_hardening.sql` |
| P2.10 | About landing UX refresh (vision hierarchy, MVP/Vision toggles, mission+team block, roadmap expand rows, contact channels, Instagram web split) | agent-fe | ✅ Done | `spec/11_settings.md` (About under Settings) |
| P2.11 | Post actor identity + closed-post privacy UX (FR-POST-021, FR-POST-014 AC6, closure copy) | agent-be + agent-fe | ✅ Done | `spec/04_posts.md`, `spec/05_closure_and_reopen.md`, `DECISIONS.md` D-26; migrations `0083_post_actor_identity.sql` → superseded by `0085_post_actor_identity_audience_split.sql` (D-28) |
| P2.12 | **BE Security Hardening v2** — closes 5 HIGH from audit 2026-05-16: `messages_insert_user` removed_at-guard regression (TD-67); `is_active_member` RPC enumeration (TD-68); `messages_insert_user` missing has_blocked check (TD-75); `validate-donation-link` SSRF (TD-79 + TD-82); `mapUserRow.privacyMode` blind cast (TD-69) | agent-be | ✅ Done | migration `0090_security_hardening_v2.sql`; `docs/SSOT/audit/2026-05-16/01_backend_security.md` |
| P2.13 | **Push notification hygiene + moderation cluster** — closes 5 HIGH from audit 2026-05-16 (TD-100 closed by P2.14 spillover; TD-78 closed by migration `0093`): follow_started/approved tap routing broken (TD-73); system-message push dropped ~50% by UUID order (TD-74); auto-suspended users get no Critical notification (TD-76); auto-removed chats vanish silently with no banner (TD-77) | agent-be + agent-fe | 🟡 In progress | `docs/SSOT/audit/2026-05-16/04_chat_notifications.md`, `05_following_moderation_admin.md` |
| P2.14 | **FE Security & multi-user isolation** — closes 4 HIGH from audit 2026-05-16: Supabase session moved to expo-secure-store with read-through migration (TD-101); push route derived from typed kind allow-list with UUID param validation (TD-102); persisted Zustand stores cleared on sign-out + delete-account (TD-103); deep-link manifests now cover `/auth/callback`, `/post/*`, `/user/*`, `/chat/*` and fingerprint placeholders are documented in `public/.well-known/README.md` (TD-66 paths fixed, fingerprints pending — downgraded 🔴→🟠). Plus folded-in spillover: deactivate Expo push token on sign-out (TD-100). | agent-fe | ✅ Done | `docs/SSOT/audit/2026-05-16/07_mobile_frontend.md` |
| P2.15 | **Actor identity projection completion (FR-POST-021)** — wire `applyPostActorIdentityProjectionBatch` into `getProfileClosedPostsHelper` + universal-search post helpers (TD-72). Closes the leak Hidden-identity users see on respondent profiles + Search. | agent-be + agent-fe | ⏳ Planned | `spec/04_posts.md` FR-POST-021; `docs/SSOT/audit/2026-05-16/03_posts_closure_feed.md` |
| P2.16 | **Closure counter drift fix (FR-CLOSURE-007/005/009)** — `rpc_recipient_unmark_self` + `reopen_post_deleted_no_recipient` double-decrement owner counters; profile counters can go negative for up to 24h (TD-71) | agent-be | ⏳ Planned | `spec/05_closure_and_reopen.md`; `docs/SSOT/audit/2026-05-16/03_posts_closure_feed.md` |
| P2.17 | **Post expiry FSM transition (FR-POST-013 AC1)** — add cron / Edge Function that flips `posts.status='expired'` at day 300 (TD-70). Today only the day-293 notification cron exists; lifecycle FSM never advances. | agent-be | ⏳ Planned | `spec/04_posts.md` FR-POST-013 |
| P2.18 | **Legal compliance — Terms/Privacy (FR-SETTINGS-010)** — replace static `/legal` inline strings with in-app web views, canonical URLs configurable via remote config, version-aware re-acknowledgement per AC3 (TD-80). EU/IL privacy gap. | agent-fe + agent-be | 🟡 In progress | `spec/11_settings.md` FR-SETTINGS-010 |
| P2.19 | Per-participant closed-post audience: split legacy `exposure` into `surface_visibility` (audience) × `identity_visibility` (chrome) × `hide_from_counterparty`; fix `is_post_visible_to` + `profile_closed_posts` to gate by per-participant surface, not `posts.visibility` (D-28, supersedes D-19 third-party clause) | agent-fullstack | ✅ Done | `spec/04_posts.md` FR-POST-021 + FR-POST-017 AC1; `spec/02_profile_and_privacy.md` FR-PROFILE-001 AC4 + FR-PROFILE-002 AC2; `DECISIONS.md` D-28; migration `0085_post_actor_identity_audience_split.sql` |
| P2.20 | Saved posts — bookmark save/unsave + My Profile שמורים list | agent-be + agent-fe | ✅ Done | `spec/04_posts.md` FR-POST-022, `spec/02_profile_and_privacy.md` FR-PROFILE-016; migration `0086_saved_posts.sql` |
| P2.21 | My Profile: move `OnlyMe` posts off open/closed tabs into `⋮` → Hidden; exclude `OnlyMe` from `active_posts_count_internal` / stats | agent-fullstack | ✅ Done | `spec/02_profile_and_privacy.md` FR-PROFILE-001 AC4, FR-PROFILE-013 AC1; `spec/10_statistics.md` FR-STATS-002 AC3; migrations `0087_*`, `0088_*` |
| P2.22 | **Create-post draft autosave (FR-POST-007)** — debounced AsyncStorage write, resume banner, per-user scoping, image-availability probe; clears on publish/sign-out. Closes TD-108. | agent-fe | ✅ Done | `spec/04_posts.md` FR-POST-007; `docs/superpowers/specs/2026-05-17-post-draft-autosave-design.md` |
| P2.23 | **Main-screen visual unification (no logic changes)** — apply the redesigned welcome-screen idiom (cream backdrop `#FFFBF7`, ambient orange blobs, white cards with soft shadow, IconTile pattern, staggered Reanimated entry) across Profile, Home Feed, Search, Create Post, Donations. Introduces shared primitives at `apps/mobile/src/components/ui/`: `Screen`, `Card`, `IconTile`, `Buttons`, `AmbientBlobs`, `MotionEntry`, `SectionHeading`. New token `colors.surfaceCream`. | agent-fe | 🟡 In progress | (visual-only — no FR adjustment) |
| P2.24 | **Web Google sign-in — same-tab redirect (FR-AUTH-002)** — replace the `WebBrowser.openAuthSessionAsync` popup (blocked by mobile Safari) with a top-level same-tab navigation to `accounts.google.com`. Existing `/auth/callback` handler completes the exchange. Native flow unchanged. | agent-fe | 🟡 In progress | `spec/01_auth_and_onboarding.md` FR-AUTH-002 (impl note 2026-05-17); `DECISIONS.md` D-33 |
| P2.25 | **Native Google sign-in via Google Sign-In SDK (FR-AUTH-002 follow-up)** — install `@react-native-google-signin/google-signin`; on iOS/Android, replace `WebBrowser.openAuthSessionAsync` with `GoogleSignin.signIn()` so the OS-native account-picker bottom sheet appears inside the app (no browser at all). Receives `idToken` → `supabase.auth.signInWithIdToken({ provider, token })`. Requires iOS + Android OAuth Client IDs in Google Cloud (PM action) and a dev-client rebuild. | agent-fe | ⏳ Planned | `spec/01_auth_and_onboarding.md` FR-AUTH-002 (impl note 2026-05-17); `DECISIONS.md` D-33 |
| P2.26 | **Optional contact phone — onboarding + edit profile + chat banner** — adds `users.contact_phone` (1–20 chars, non-verified, distinct from `auth.users.phone`) wired through onboarding Basic Info (`FR-AUTH-010 AC2.c`), soft-gate modal (`FR-AUTH-015 AC1`), Edit Profile (`FR-PROFILE-007 AC1+AC2`), and the chat anchored-post card as a `tel:` quick-call link (`FR-CHAT-014 AC7`). Migration `0096`. | agent-fullstack | 🟡 In progress | `spec/01_auth_and_onboarding.md` FR-AUTH-010/015; `spec/02_profile_and_privacy.md` FR-PROFILE-007; `spec/07_chat.md` FR-CHAT-014 |
| P2.27 | **Closed-post Hide bug fix** — `usePostActorPrivacyModel.onAudienceChange` fans out to `posts.visibility` for closed-post owners so the Hidden Closed lane routes correctly; `UpdatePostUseCase` accepts visibility-only patches on `closed_delivered` / `deleted_no_recipient`. | agent-fullstack | ✅ Done | `spec/04_posts.md` FR-POST-009 AC5; `spec/02_profile_and_privacy.md` FR-PROFILE-001 AC4 note; `DECISIONS.md` D-34 |
| P2.28 | **Saved screen open/closed split** — `/profile/saved` splits into "פוסטים פתוחים" and "פוסטים סגורים" sections (client-side partition); dead `self_saved` empty variant removed after migration. | agent-fe | ✅ Done | `spec/02_profile_and_privacy.md` FR-PROFILE-016 AC6 |
| P2.29 | **Admin-removed screen open/closed split** — `/profile/removed` splits by `posts.status_before_admin_removal` (D-35); migration `0097` adds nullable column, updates `admin_remove_post` to capture prior status atomically. Legacy NULL rows default to prior-open lane. | agent-fullstack | ✅ Done | `spec/04_posts.md` FR-POST-008 AC5; `spec/02_profile_and_privacy.md` FR-PROFILE-001 AC4 cross-ref; `DECISIONS.md` D-35; migration `0097_posts_status_before_admin_removal.sql` |
| P2.30 | **Cities truncation fix + city-dependent street picker** — PR 1: `.limit(2000)` on `SupabaseCityRepository.listAll()` to bypass Supabase JS client's 1000-row default that silently dropped ~306 settlements past letter ע (incl. Tel Aviv, Petah Tikva, Rishon LeZion). PR 2: `public.streets` table + `SupabaseStreetRepository` + new `SearchablePicker` shell reused by city + street pickers; progressive disclosure of street + number on onboarding; disabled-state UX + reset-on-city-change on edit profile, create post, edit post. Seeded from data.gov.il package 321 (63 565 rows including 9000-sentinels — zero filtering per PM). | agent-fullstack | 🟡 In progress | `spec/01_auth_and_onboarding.md` FR-AUTH-010 AC2.b; `spec/02_profile_and_privacy.md` FR-PROFILE-007 AC1; `DECISIONS.md` D-36; `docs/superpowers/specs/2026-05-18-cities-streets-picker-design.md` |
| P2.31 | **Platform-support donation card (FR-DONATE-010)** — reusable `DonationSupportCard` with Bit + Paybox CTAs; embedded on About (after hero + after vision) and at the top of Settings. PM-requested 2026-05-18. | agent-fe | ✅ Done | `spec/13_donations.md` FR-DONATE-010 |
| P2.32 | **Dark mode — Appearance toggle (FR-SETTINGS-014)** — adds System / Light / Dark theme picker in Settings → Appearance with a warm-tinted dark palette (deep warm-brown surfaces, lifted orange primary). Ships theme primitives in `@kc/ui` (`ThemeProvider`, `useTheme`, `makeUseStyles`, `lightColors` / `darkColors`), AsyncStorage-persisted `themeStore`, and migrates all mobile screens + containers to theme-aware styling (cards, inputs, chips, modals, sheets). Native StatusBar style + web html background follow the active scheme. | agent-fe | ✅ Done | `spec/11_settings.md` FR-SETTINGS-014 |
| P2.33 | **Share post via link with image preview (FR-POST-023)** — header share button on post detail (Public + open); platform share via `Share.share` (native) / `navigator.share` + clipboard fallback (web); iOS attaches the first image binary via `expo-file-system`. Share URL is `https://karma-community-kc.com/post/<id>` — never `*.supabase.co`. Railway web service runs a Hono server that returns OG meta for crawlers on `/post/:id` and the SPA for humans, replacing `serve dist --single`. AuthGate captures pending deep-link before redirecting unauth users to `(auth)`, restores after sign-in. | agent-fullstack | ✅ Done | `spec/04_posts.md` FR-POST-023, `D-38` |
| RESP-001 | **Responsive desktop — shell primitives** — `useBreakpoint`, `AppShell`, `NavigationRail`, `AsidePanel`, `SplitAuthLayout`, `SHELL_V2_ENABLED` flag, mobile invariant snapshot (FR-RESP-001) | agent-fe | 🟡 In progress | `spec/14_responsive_desktop.md` FR-RESP-001 |
| RESP-002 | **Wire shell into root** — mount `AppShell` in root `_layout.tsx`, flip `SHELL_V2_ENABLED` default (FR-RESP-002) | agent-fe | ✅ Done | `spec/14_responsive_desktop.md` FR-RESP-002 |
| RESP-003 | **Aside panel content** — feed, donations, profile, search aside surfaces at ≥1024 (FR-RESP-003) | agent-fe | ⏳ Planned | `spec/14_responsive_desktop.md` FR-RESP-003 |
| RESP-004 | **Chat inbox layout** — two-pane inbox + thread at ≥768 (FR-RESP-004) | agent-fe | ⏳ Planned | `spec/14_responsive_desktop.md` FR-RESP-004 |
| RESP-005 | **Split-screen auth & onboarding** — `SplitAuthLayout` across sign-in / sign-up / onboarding steps (FR-RESP-005) | agent-fe | ⏳ Planned | `spec/14_responsive_desktop.md` FR-RESP-005 |

## P3 — Post-MVP (Deferred)

| ID | Task | Status | Spec |
|----|------|--------|------|
| P3.1 | Block / unblock + visibility restoration | ⏳ Deferred (EXEC-9) | `spec/08_moderation.md` FR-MOD-003/004/009 |
| P3.2 | Apple SSO (iOS only) | ⏳ Deferred | `spec/01_auth_and_onboarding.md` FR-AUTH-004 |
| P3.3 | Quiet hours / DND | ⏳ Deferred | `spec/09_notifications.md` FR-NOTIF-016 |

## INFRA — Tooling & Environment

| ID | Task | Owner | Status | Spec |
|----|------|-------|--------|------|
| INFRA-DEV-BRANCH-RESTORE | Restore `dev` branch + auto-sync from `main`; in-app DEV environment banner; document env topology | infra | ✅ Done | `docs/SSOT/ENVIRONMENTS.md` |
| INFRA-I18N-PROD-CODE | Migrate inline Hebrew in production code to react-i18next; remove display strings from domain/application/infrastructure-supabase | infra | ✅ Done | `docs/superpowers/specs/2026-05-16-hebrew-to-i18n-design.md` |
| INFRA-I18N-MIGRATIONS | Remove Hebrew literals from SQL migrations (relax NOT NULL on `users.display_name`/`city`/`city_name`; UI applies translated fallback) | infra | ✅ Done | `docs/superpowers/specs/2026-05-16-migrations-i18n-hardening-design.md` |
| INFRA-DB-DEPLOY-MAIN | Auto DB deploy on `main` when migration paths change (`db-deploy.yml` → `supabase-prod`); docs + `D-37` | infra | ✅ Done | `docs/SSOT/ENVIRONMENTS.md`, `docs/SSOT/DECISIONS.md` D-37 |
| INFRA-CI-MAIN-P1 | Main-production CI/CD P1: pin Supabase CLI 2.99.0, web build gate on `main` PRs, prod smoke workflow, `RELEASE_CHECKLIST.md` | infra | ✅ Done | `docs/SSOT/RELEASE_CHECKLIST.md`, `docs/SSOT/ENVIRONMENTS.md` |
| INFRA-CI-SPLIT-GUARDS | Split CI into `ci-frontend` / `ci-backend` / `ci-contract` / `ci-pr` workflows with path filters; add migration-chain guard, RLS lint, RPC contract, `database.types.ts` drift, manifest parity, local-stack sqlProbes | infra | ✅ Done | `docs/superpowers/plans/2026-05-22-ci-split-and-backend-guards.md` |

---

## Sprint Protocol

1. Pick the highest ⏳ item above
2. Read its linked `spec/` file
3. Move status to 🟡
4. Implement
5. Move status to ✅
6. Update spec file status if all ACs complete
