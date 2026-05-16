# Audit 2026-05-10 — Follow-up status (as of 2026-05-16)

> Companion to `docs/SSOT/archive/AUDIT_2026-05-10_full_codebase_review.md`.
> Tracks the disposition of every audit finding 6 days after the snapshot.
>
> **Legend:** ✅ closed · ⏳ open · 🟡 partial · ⛔ rejected (audit re-classified as false positive)
>
> When a row is closed, the closing migration / PR / TD-row is cited so the
> reader can verify on the live tree. When open, the row gives the smallest
> remediation that meets the AC, and the proposed closing slice.

---

## 0. Executive — what shipped between 2026-05-10 and 2026-05-16

Headline closes (drove the audit from ~80 active findings → ~50):

- **Migration `0070_security_hardening`** (BACKLOG P2.8) — closes §1.1, §1.2, §15.1, §15.2, §15.3, §15.5, §15.11.
- **Migration `0072_rls_insert_requires_active_account`** — closes §15.6 (suspended users can no longer INSERT posts/chats/messages).
- **Migration `0073_users_biography_no_url_check`** — closes §4.5 / §13.1 R-MVP-Profile-6 (bio rejects external URLs).
- **Migration `0076_suspension_expiry_cron`** — closes §15.10 (auto-clear `account_status_until`).
- **Migration `0032_followrequests_auto_approve_on_public`** — closes §15.4 (privacy Private→Public auto-approves pending follows).
- **Migration `0066_notifications_post_expiry_cron`** — closes §13.1 R-MVP-Items-5 (300-day expiry + 7-day pre-expiry notification).
- **Migration `0016_closure_cleanup_cron`** + **`0079_storage_orphan_reconciliation_cron`** — close §13.1 R-MVP-Items-6 and TD-122 (7-day reopen window + orphan storage cleanup).
- **PR #188** — closes §2.1 / §5.2 / TD-39 (scrub `active_posts_count_internal` from non-self user reads).
- **`RestoreSession` use-case** — `IAccountGateRepository.checkAccountGate()` is now called on every restore (TD-68 / §17.1 closed).
- **`PostCard` / `PostCardGrid`** — both now branch on `post.locationDisplayLevel` (§4.4 closed).
- **`CreatePostUseCase`** — trims title/description before validation (§3.2 closed).
- **P1.2** — home-feed filter button wired to a real modal (§14.6 closed).
- **Migration `0018_fix_counters_by_post_type`** — active counter decrements on any `open → non-open` transition incl. `removed_admin` (§1.4 closed indirectly; items_given/items_received intentionally don't fire for `removed_admin` because no delivery happened).

The remaining audit findings (below) split into three classes:

1. **High-severity behavioural gaps** still open — `client.ts` env fallback, Hebrew street numbers, idempotency keys on chat/post, rate-limit infra.
2. **Documented trade-offs** — AsyncStorage plaintext (EXEC-1), storage public-read (TD-11), are explicit choices we accept until pre-launch hardening.
3. **Cosmetic / polish** — emoji literals in alerts, magic strings, doc drift, a11y labels.

---

## 1. Backend security — Supabase / Postgres

| Section | Status | Closed by / closing slice |
| ------- | ------ | ------------------------- |
| 1.1 [CRITICAL] anon SELECT on `follow_edges` | ✅ | `0070_security_hardening` |
| 1.2 [CRITICAL] `is_admin`/`is_blocked`/`is_following` RPC enumeration | ✅ | `0070_security_hardening` |
| 1.3 [HIGH] `users_select_public` block-check is no-op for anon | ⏳ | Open — add `auth.uid() is not null` to the policy `using` clause (FR-MOD-009 AC1). Small migration. |
| 1.4 [HIGH] `active_posts_count_internal` never decrements on `removed_admin` | ✅ | `0018_fix_counters_by_post_type` — decrement fires on any `open → non-open` transition; items_given/received intentionally skipped for admin-removed posts. |
| 1.5 [MEDIUM] Realtime publication broadcasts denormalized counters | ⏳ | Open — curated `users_public_view` + column filter. Folded into §15.7. |
| 1.6 [MEDIUM] `is_post_visible_to()` redefined across 0002/0003/0005 without versioning | ⏳ | Open — convention cleanup; low-bite. |
| 1.7 [MEDIUM] Storage buckets `avatars` / `post-images` world-readable | 🟡 | Tracked as **TD-11** (pre-launch hardening — accepted trade-off until then). |
| 1.8 [MEDIUM] `find_or_create_support_chat()` rate-limit | ⏳ | Folded into §19.1 (rate-limit infra). |
| 1.9 [LOW] `false_reports_count` one-way | ⏳ | Open — admin-only `decrement_false_reports` RPC; defer with FR-MOD-008 follow-up. |
| 1.10 [LOW] Migrations re-create without `revoke`-and-`grant` cycle | ⏳ | Open — convention. Document in `docs/SSOT/DECISIONS.md`. |

## 2. Backend / data-layer adapter audit

| Section | Status | Closed by / closing slice |
| ------- | ------ | ------------------------- |
| 2.1 [HIGH] TD-39 counter-leak to non-owner viewers | ✅ | PR #188 — `SupabaseUserRepository` projects only safe columns for non-self reads. |
| 2.2 [MEDIUM] `SupabasePostRepository` throws raw `Error` from 13 sites | ⏳ | Open — wrap in typed `PostError` at adapter boundary. Bundle with adapter-test slice. |
| 2.3 [MEDIUM] `mapPostRow` assumes `city_ref` non-null | ⏳ | Open — defensive `city_ref?.name_he ?? input.city` fallback + vitest. |
| 2.4 [MEDIUM] `decodeCursor` swallows malformed cursors silently | ⏳ | Open — throw typed `PaginationError('cursor_invalid')`. |
| 2.5 [LOW] `as unknown as` casts unguarded | ⏳ | Open — opportunistic, zod parse or Array.isArray guard. |

## 3. Application & business-logic bugs

| Section | Status | Closed by / closing slice |
| ------- | ------ | ------------------------- |
| 3.1 [HIGH] `street_number` regex rejects Hebrew suffixes (5א, 12ב) | ✅ | `0081_street_number_allow_hebrew_suffix` (renumbered from 0080 to clear TD-54-class collision with `0080_strip_exif_cron`). Pattern now `^[0-9]+[A-Za-zא-ת]?$` in domain + posts + users.profile_street_number CHECKs. Spec FR-POST-019 AC3 updated. |
| 3.2 [HIGH] Trim discrepancy on `title` / `description` | ✅ | `CreatePostUseCase.ts:21,26` — both fields trimmed before validation. |
| 3.3 [HIGH] Email regex permissive in `SignUpWithEmailUseCase` | ✅ | Centralized `EMAIL_PATTERN` in `@kc/domain/value-objects` (`^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$`). Both `SignInWithEmailUseCase` and `SignUpWithEmailUseCase` reference it. Rejects `a@b.c`, `user@@x.co`, `a@b.co.`. |
| 3.4 [HIGH] Session expiry uses device clock | ⏳ | Open — accept practical impact + document, OR derive clock skew from response `Date` header. Low priority in MVP. |
| 3.5 [HIGH] `UpdateProfileUseCase` `Promise.all` non-atomic | ⏳ | Open — single `UPDATE users SET …` or RPC. |
| 3.6 [HIGH] Profile use cases throw raw `Error` | ⏳ | Open — typed `ProfileError`/`BasicInfoError` (mirror of `PostError`). |
| 3.7 [MEDIUM] No idempotency key on `Publish` | ⏳ | Open — add `posts.client_request_id` + unique constraint + adapter upsert. |
| 3.8 [MEDIUM] Image-upload `Promise.all` failure leaks Storage objects | ⏳ | Open — best-effort cleanup of successful uploads on partial-failure. |
| 3.9 [MEDIUM] `activePostsCountInternal` cached before create | ⏳ | Open — invalidate auth/user query on delete; optimistic decrement. |
| 3.10 [MEDIUM] `GetMyPostsUseCase` returns no `nextCursor` | ⏳ | Open — mirror `GetFeedUseCase` `{ posts, nextCursor }` shape. |
| 3.11 [LOW] Home feed `onEndReached` not wired | ⏳ | Open — verify and wire. |

## 4. Mobile / FE security & correctness

| Section | Status | Closed by / closing slice |
| ------- | ------ | ------------------------- |
| 4.1 [INFO] publishable key in `.env` | ⛔ | Re-classified — not a vulnerability (designed-to-ship key). |
| 4.2 [HIGH] `client.ts` falls back to non-`EXPO_PUBLIC_` env names | ✅ | `client.ts` no longer reads `SUPABASE_URL` / `SUPABASE_ANON_KEY` fallback. Edge Functions verified to use `Deno.env` directly. |
| 4.3 [HIGH] OAuth callback doesn't validate `state` explicitly | ⏳ | Open — explicit state in `signInWithOAuth.options.queryParams` + `expo-secure-store`. |
| 4.4 [HIGH] `locationDisplayLevel` ignored on display | ✅ | `PostCard.tsx:34-37`, `PostCardGrid.tsx:33` — both branch on the level. |
| 4.5 [HIGH] Bio raw text / no URL filter | ✅ | `0073_users_biography_no_url_check` — DB CHECK rejects URLs. |
| 4.6 [MEDIUM] Soft-gate emoji literals in `Alert.alert` | ⏳ | Open — replace with Ionicons in custom modal. |
| 4.7 [MEDIUM] AsyncStorage holds session in plaintext | 🟡 | Documented EXEC-1 trade-off; close pre-launch with `expo-secure-store` for refresh token. |
| 4.8 [MEDIUM] No file-size cap after the 2048px resize | ⏳ | Open — assert `result.size < 5 MB` post-resize; re-encode at lower quality if larger. |
| 4.9 [LOW] `app.json` may include unused permissions | ⏳ | Open — audit + prune (`WRITE_EXTERNAL_STORAGE`, `SYSTEM_ALERT_WINDOW` if present). |
| 4.10 [LOW] emoji + format-string leaks via console/Alert | ⏳ | Folded into §4.6. |

## 5. Spec ↔ implementation gaps

| Section | Status | Closed by / closing slice |
| ------- | ------ | ------------------------- |
| 5.1 FR-POST-003 AC3 `locationDisplayLevel` | ✅ | Same as §4.4. |
| 5.2 FR-PROFILE-013 AC4 counter-leak | ✅ | Same as §2.1. |
| 5.3 FR-AUTH-013 AC1 cold-start race | 🟡 | TD-3 — opportunistic. |
| 5.4 FR-FEED-014 AC1 guest banner literal "50+" | ⏳ | Open — wire `community_stats.active_public_posts_count`. |
| 5.5 FR-PROFILE-007 AC5 `profile_updated` analytics | 🟡 | TD-134 — gated on analytics spine. |
| 5.6 FR-POST-005 AC4 server-side EXIF strip | 🟡 | TD-23. |
| 5.7 FR-AUTH-011 AC4 avatar-removal Storage leak | ⏳ | Open — mirror P0.4-FE upload cleanup. |
| 5.8 FR-DONATE-003 AC4 error message drift | ⏳ | Open — copy fix in `i18n/locales/he/donations.ts`. |
| 5.9 FR-SETTINGS-001/003/006 toggles | 🟡 | Most settings persist now (notification prefs via 0062). Audit row only refers to the legacy `useState` defaults — re-verify per toggle. |
| 5.10 FR-PROFILE-007 AC2 email/phone read-only on Edit Profile | ⏳ | Open — small UI addition. |
| 5.11 [LOW] CLAUDE.md verification gate not enforced | ⏳ | Open — pre-commit hook checking commit-message format. |

## 6. UI / screens — AC misses on shipped pages

| Section | Status | Closed by / closing slice |
| ------- | ------ | ------------------------- |
| 6.1 (tabs)/profile.tsx counters render `0` (TD-42) | ✅ | Unblocked once TD-39 closed (PR #188). |
| 6.2 Settings 7 dead `onPress={() => {}}` (TD-107) | 🟡 | Many rows wired through Settings refactor; spot-verify remaining. |
| 6.3 Edit Profile share button no-op (TD-106) | ⏳ | TD-106 still open. |
| 6.4 Type toggle emoji `🔍`/`🎁` | ⏳ | Folded into §4.6. |
| 6.5 Magic strings — limits hard-coded in `i18n/he.ts` | ⏳ | Open — reference `MAX_MEDIA_ASSETS` from `@kc/domain`. |
| 6.6 Settings toggles component-state only | 🟡 | Same as §5.9. |

## 7. Architecture, code-quality, tooling

| Section | Status | Closed by / closing slice |
| ------- | ------ | ------------------------- |
| 7.1 Turbo `test` task has no `inputs` | ⏳ | Open — add `"inputs": ["src/**", "**/*.test.ts(x)"]`. |
| 7.2 No CI gate on `database.types.ts` drift | ⏳ | Open — `pnpm typegen:check` script + CI step. |
| 7.3 `client.ts` env fallback | ✅ | Dup of §4.2 (closed). |
| 7.4 No tests for Supabase adapters (TD-50) | 🟡 | Recent commits add adapter coverage (`mapClosurePgError`, `SupabaseAccountGateRepository`). Continue. |
| 7.5 `i18n/he.ts` 207 LOC | ✅ | TD-156 closed all Hebrew strings moved to `src/i18n/locales/he/`. |
| 7.6 `audit_events` no INSERT policy | ⛔ | Intentional. |
| 7.7 `authStore` mutations bypass use cases | ⏳ | Open — tighten store setters. |

## 8. Documentation drift

| Section | Status | Closed by / closing slice |
| ------- | ------ | ------------------------- |
| 8.1 TD-43 `SRS.md` Last-Updated stale | ⏳ | Touch in next SRS-touching PR. |
| 8.2 TD-4 `docs/SSOT/CODE_QUALITY.md` referenced but missing | ⏳ | Open — short stub or remove the reference. |
| 8.3 `PROJECT_STATUS.md` posts test-coverage drift | 🟡 | Adapter tests landing — partially resolved. |
| 8.4 HISTORY.md format inconsistent | ⏳ | Cosmetic. |

## 9. Cross-cutting / NFR

| Section | Status | Closed by / closing slice |
| ------- | ------ | ------------------------- |
| 9.1 No CSP for web build | ⏳ | Open — meta tag in Expo web template. |
| 9.2 No a11y check on icon-only buttons | ⏳ | Same as §16.4 — mechanical sweep. |
| 9.3 No rate-limit on `signIn` at application layer | ⏳ | Folded into §19.1. |

## 13. PRD business-rules compliance (Round 2)

| Rule | Status | Closed by / closing slice |
| ---- | ------ | ------------------------- |
| R-MVP-Items-12 (3 visibility levels) — §16.1 | ✅ | `VisibilityChooser` exposes all 3 (P2.7 privacy-mode reframe). |
| R-MVP-Privacy-13 (Private→Public auto-approve) | ✅ | `0032_followrequests_auto_approve_on_public`. |
| R-MVP-Items-7 (5+ reopens = Suspect) | ✅ | `reopen_count` removed from client UPDATE grant in `0070`. |
| R-MVP-Items-5 (300-day expiry + 7-day pre-expiry) | ✅ | `0066_notifications_post_expiry_cron`. |
| R-MVP-Items-6 (7-day deleted_no_recipient reopen window) | ✅ | `0016_closure_cleanup_cron`. |
| R-MVP-Profile-6 (bio max 200 chars + no external URLs) | ✅ | `0073_users_biography_no_url_check`. |
| R-MVP-Chat-4 (auto first-message verbatim copy) | ⏳ | Open — verify `BuildAutoMessageUseCase.ts` string. |
| R-MVP-Chat-6 (payment-suggestion auto-report) | ⏳ | Open — either rewrite the PRD rule (community-driven only) or implement a stub. |

## 14. Navigation, user-flow & screen-mapping (Round 2)

| Section | Status | Closed by / closing slice |
| ------- | ------ | ------------------------- |
| 14.1 [HIGH] `VisibilityChooser` missing 3rd radio | ✅ | Same as §16.1. |
| 14.2 [HIGH] Settings "שם משתמש ופרטים" dead row | ⏳ | Open — one-line `router.push('/edit-profile')`. |
| 14.3 [HIGH] `chat/index.tsx` duplicate back button | ⏳ | Open — drop `headerLeft` from `useLayoutEffect`. |
| 14.4 [HIGH] `chat/[id]` doesn't pre-check chat existence | ⏳ | Open — one-shot `chatRepo.findById(chatId)` before subscribe. |
| 14.5 [MEDIUM] Soft-gate destroys publish payload | ⏳ | Open — snapshot draft to AsyncStorage before redirect. |
| 14.6 [MEDIUM] Filter button non-functional | ✅ | P1.2 — filter modal wired. |
| 14.7 [MEDIUM] Apple SSO + Phone OTP placeholder | 🟡 | TD-24 + TD-151 (auth hardening). |
| 14.8 [LOW] Search CTA wording | ⏳ | Open — reword to "גלה בפיד הראשי". |
| 14.9 [LOW] Onboarding photo hint promises Settings | ✅ | `(onboarding)/photo.tsx:120` reworded to "בפרופיל". |

## 15. RLS, triggers & SECURITY DEFINER (Round 2)

| Section | Status | Closed by / closing slice |
| ------- | ------ | ------------------------- |
| 15.1 [CRITICAL] `reports.resolved_at`/`resolved_by` loose grants | ✅ | `0070_security_hardening`. |
| 15.2 [CRITICAL] `active_posts_count_for_viewer`/`has_blocked` anon-callable | ✅ | `0070_security_hardening`. |
| 15.3 [CRITICAL] `rpc_get_or_create_support_thread` race | ✅ | `0070_security_hardening` (atomic upsert). |
| 15.4 [HIGH] No trigger to auto-approve pending follows on Private→Public | ✅ | `0032_followrequests_auto_approve_on_public`. |
| 15.5 [HIGH] `posts.reopen_count` in client-writable grant | ✅ | `0070_security_hardening` + `reopen_post_deleted_no_recipient` RPC. |
| 15.6 [MEDIUM] Suspended users can INSERT posts/chats/messages | ✅ | `0072_rls_insert_requires_active_account`. |
| 15.7 [MEDIUM] Realtime publication on `users` exposes sensitive columns | ⏳ | Open — curated `users_public_view` or column-filter on publication. |
| 15.8 [MEDIUM] self-block/self-follow guarded twice | ⛔ | Defense-in-depth — intentional. |
| 15.9 [MEDIUM] `messages.sender_id ON DELETE SET NULL` keeps body | 🟡 | Documented intent per spec. Re-decide at GDPR pass. |
| 15.10 [MEDIUM] `account_status_until` not auto-cleared | ✅ | `0076_suspension_expiry_cron`. |
| 15.11 [MEDIUM] `inject_system_message` grant forgery | ✅ | `0070_security_hardening`. |
| 15.12 [MEDIUM] `find_or_create_support_chat` (0005) race | ⏳ | Open — same shape as §15.3; verify RPC exposure first. |
| 15.13 [MEDIUM] `recipients` missing UPDATE policy + close trigger | ✅ | `0015_closure_rpcs` + `0017_relax_close_with_recipient` + `0075_recipient_unmark_self`. |
| 15.14 [LOW] `is_post_visible_to()` STABLE per-row evaluation | ⏳ | Open — profile EXPLAIN at scale. |
| 15.15 [LOW] `cities` table has theatrical RLS | ⏳ | Open — disable RLS on `cities` OR add intent comment. |

## 16. Per-screen UI/UX correctness (Round 2)

| Section | Status | Closed by / closing slice |
| ------- | ------ | ------------------------- |
| 16.1 [CRITICAL] `VisibilityChooser` excludes `FollowersOnly` | ✅ | P2.7 privacy-mode reframe. |
| 16.2 [HIGH] `PostImageCarousel` counter RTL position | ⏳ | Open — `start: spacing.sm` instead of `left:`. |
| 16.3 [HIGH] Type-toggle emoji in `(tabs)/create.tsx` | ⏳ | Folded into §4.6. |
| 16.4 [HIGH] Icon-only TouchableOpacity missing `accessibilityLabel` | ⏳ | Open — mechanical sweep (~1h). |
| 16.5 [HIGH] Create-post form clears on publish error | ⏳ | Open — don't clear in `onError`; only in `onSuccess`. |
| 16.6 [MEDIUM] Soft-gate success alert emoji `✅` | ⏳ | Folded into §4.6. |
| 16.7 [MEDIUM] Chat send button no trim | ✅ | `chat/[id].tsx:85` — `sendDisabled` now trims (was raw `input.length`). The underlying `useChatSend` already trimmed and silently dropped empty bodies; the button no longer pretends to work. |
| 16.8 [MEDIUM] Donations time composer no trim | ⏳ | Same shape as §16.7. |
| 16.9 [MEDIUM] Sign-in / sign-up no client-side email format check | ⏳ | Folded into §3.3. |
| 16.10 [MEDIUM] Edit Profile no unsaved-changes warn on Back | ⏳ | Open — `dirty` flag + confirm Alert. |
| 16.11 [MEDIUM] PhotoPicker no pre-launch permission check | ⏳ | Open — mirror avatarUpload pattern. |
| 16.12 [MEDIUM] Many screens lack loading skeletons | ⏳ | Open — shared `<ScreenLoading />`. |
| 16.13 [LOW] Hebrew copy inconsistencies in chat menu Alert | ⏳ | Cosmetic. |
| 16.14 [LOW] Donation tiles `activeOpacity` | ⏳ | Cosmetic. |
| 16.15 [LOW] `MOCK_CHATS` dead code? | ⏳ | Open — verify and remove. |

## 17. Auth state machine, sessions, identity errors

| Section | Status | Closed by / closing slice |
| ------- | ------ | ------------------------- |
| 17.1 [HIGH] `RestoreSession` no `account_status` check | ✅ | `RestoreSession.ts:32-40` — `gate.checkAccountGate(userId)`. TD-68. |
| 17.2 [HIGH] `mapAuthError` distinguishes invalid_credentials vs email_already_in_use | ⏳ | Open — collapse to unified `authentication_failed`. |
| 17.3 [HIGH] No state-machine guard on `onboarding_state` transitions | ✅ | `OnboardingError('illegal_transition')` introduced. `CompleteBasicInfoUseCase` rejects when current state is `completed`; `CompleteOnboardingUseCase` rejects when current is `pending_basic_info`. Idempotent re-runs on the same step still pass. (DB-trigger defense-in-depth is deferred — app-level guard sufficient for the practical attack surface.) |
| 17.4 [MEDIUM] `onboarding_state = 'completed'` can be rolled back | ✅ | `app/settings.tsx:21-23` — "Reset onboarding" gated behind `__DEV__ \|\| EXPO_PUBLIC_DEV_SETTINGS_TOOLS === '1'`. Doesn't ship in release builds. |
| 17.5 [MEDIUM] Token expiry only at cold start | ✅ | `SupabaseAuthService.onSessionChange` wires `client.auth.onAuthStateChange`; `AuthGate` reacts to session → null with redirect to `/(auth)` plus cache clear (§17.6). |
| 17.6 [MEDIUM] Sign-out doesn't clear React Query cache | ✅ | `AuthGate.tsx` session-change effect now calls `queryClient.clear()` when `session` transitions to null. Covers Settings sign-out, account-gate enforcement sign-out, and delete-account sign-out via one location. |

## 18. Concurrency, idempotency, atomicity

| Section | Status | Closed by / closing slice |
| ------- | ------ | ------------------------- |
| 18.1 [HIGH] `SendMessageUseCase` no idempotency key | ⏳ | Open — `messages.client_request_id uuid unique`. |
| 18.2 [HIGH] `SupabaseChatRepository.findOrCreateChat` race | ⏳ | Open — `INSERT … ON CONFLICT … RETURNING *`. |
| 18.3 [MEDIUM] `ReportChatUseCase` no idempotency key | ⏳ | Open — same pattern. |
| 18.4 [MEDIUM] Block/follow toggles no UI loading lock | ⏳ | Open — `isLoading` guard. |
| 18.5 [MEDIUM] `applyIncomingMessage` may double-add on duplicate subs | ⏳ | Open — subscription-instance tracking. |

## 19. Rate limiting

| Section | Status | Closed by / closing slice |
| ------- | ------ | ------------------------- |
| 19.1 [HIGH] No rate-limit anywhere | ⏳ | Open — `rate_limits` table + `enforce_rate_limit(action, window, max)` SECURITY DEFINER helper. Used by `messages`, `reports`, `follow_edges`, `media_assets` triggers. Major work. |

## 20–21. Time, dates, mobile config

| Section | Status | Notes |
| ------- | ------ | ----- |
| 20.1 [MEDIUM] Mixed timestamp formats | ⏳ | Open — unify on unix milliseconds at adapter boundary. |
| 20.2 [MEDIUM] Realtime presence leak via counters | ⏳ | Same as §15.7. |
| 20.3 [LOW] No timezone coercion | ⏳ | Cosmetic. |
| 21.1 [MEDIUM] iOS permission strings hardcoded in Hebrew | ⛔ | Hebrew-only MVP — intentional. Document in DECISIONS. |
| 21.2 [MEDIUM] Android `READ_EXTERNAL_STORAGE` over-broad on API 33+ | ⏳ | Same as §4.9. |
| 21.3 [MEDIUM] Web build no CSP/CORS doc | ⏳ | Same as §9.1. |
| 21.4 [MEDIUM] No `pnpm audit` in CI | ⏳ | Open — wire Dependabot or audit step. |
| 21.5 [LOW] `packageManager` not pinned | ⏳ | Cosmetic. |
| 21.6 [LOW] Doc drift | ⏳ | TD-15 already moved to Resolved. |

---

## Open-items roadmap

The audit followup PRs land into `dev` one section at a time. Sequencing (highest-impact first):

1. ~~**§3.1** — Hebrew street_number regex~~ ✅ closed in `0081`
2. ~~**§4.2** — `client.ts` drop env fallback~~ ✅
3. ~~**§17.6** — sign-out clears React Query cache~~ ✅
4. **§17.2** — collapse `mapAuthError` to unified failure code
5. **§18.1 / §18.2** — chat idempotency + atomic findOrCreateChat
6. **§3.5 / §3.6** — atomic profile update + typed `ProfileError`
7. **§3.3** — email validation (replace regex or remove)
8. **§19.1** — rate-limit infra (large standalone slice)
9. **§14.x quick wins** — Settings row routing, chat back button, chat existence guard
10. **§16.4 / §6.5** — accessibility sweep + magic-string cleanup
11. **§7.1 / §7.2** — turbo inputs + database.types.ts drift gate
12. **§9.1** — web CSP meta tag

This file is the source of truth for follow-up progress. Update each row's status as PRs land.
