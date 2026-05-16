# Audit 2026-05-10 — Follow-up status (as of 2026-05-16)

> Companion to `docs/SSOT/archive/AUDIT_2026-05-10_full_codebase_review.md`.
> Closed and rejected rows are pruned as they land — only open (⏳) and
> partial (🟡) rows remain. When this file is empty, delete it.
>
> **Legend:** ⏳ open · 🟡 partial (accepted trade-off / blocked / cosmetic)

---

## 1. Backend security — Supabase / Postgres

| Section | Status | Closing slice |
| ------- | ------ | ------------- |
| 1.3 [HIGH] `users_select_public` block-check is no-op for anon | 🟡 | Effectively closed in MVP — `0070_security_hardening` revoked anon RPC access to `is_blocked`, and blocking itself is deferred per EXEC-9. Revisit when blocking lands. |
| 1.5 [MEDIUM] Realtime publication broadcasts denormalized counters | ⏳ | Curated `users_public_view` + column filter. Folded into §15.7. |
| 1.6 [MEDIUM] `is_post_visible_to()` redefined across 0002/0003/0005 without versioning | ⏳ | Convention cleanup; low-bite. |
| 1.7 [MEDIUM] Storage buckets `avatars` / `post-images` world-readable | 🟡 | Tracked as **TD-11** (pre-launch hardening — accepted trade-off until then). |
| 1.8 [MEDIUM] `find_or_create_support_chat()` rate-limit | ⏳ | Folded into §19.1 (rate-limit infra). |
| 1.9 [LOW] `false_reports_count` one-way | ⏳ | Admin-only `decrement_false_reports` RPC; defer with FR-MOD-008 follow-up. |
| 1.10 [LOW] Migrations re-create without `revoke`-and-`grant` cycle | ⏳ | Convention. Document in `docs/SSOT/DECISIONS.md`. |

## 2. Backend / data-layer adapter audit

| Section | Status | Closing slice |
| ------- | ------ | ------------- |
| 2.2 [MEDIUM] `SupabasePostRepository` throws raw `Error` from 13 sites | ⏳ | Wrap in typed `PostError` at adapter boundary. Bundle with adapter-test slice. |
| 2.3 [MEDIUM] `mapPostRow` assumes `city_ref` non-null | ⏳ | Defensive `city_ref?.name_he ?? input.city` fallback + vitest. |
| 2.4 [MEDIUM] `decodeCursor` swallows malformed cursors silently | ⏳ | Throw typed `PaginationError('cursor_invalid')`. |
| 2.5 [LOW] `as unknown as` casts unguarded | ⏳ | Opportunistic, zod parse or Array.isArray guard. |

## 3. Application & business-logic bugs

| Section | Status | Closing slice |
| ------- | ------ | ------------- |
| 3.4 [HIGH] Session expiry uses device clock | ⏳ | Accept practical impact + document, OR derive clock skew from response `Date` header. Low priority in MVP. |
| 3.7 [MEDIUM] No idempotency key on `Publish` | ⏳ | Add `posts.client_request_id` + unique constraint + adapter upsert. |
| 3.11 [LOW] Home feed `onEndReached` not wired | ⏳ | Verify and wire. |

## 4. Mobile / FE security & correctness

| Section | Status | Closing slice |
| ------- | ------ | ------------- |
| 4.3 [HIGH] OAuth callback doesn't validate `state` explicitly | ⏳ | Explicit state in `signInWithOAuth.options.queryParams` + `expo-secure-store`. |
| 4.6 [MEDIUM] Soft-gate emoji literals in `Alert.alert` | ⏳ | Replace with Ionicons in custom modal. |
| 4.7 [MEDIUM] AsyncStorage holds session in plaintext | 🟡 | Documented EXEC-1 trade-off; close pre-launch with `expo-secure-store` for refresh token. |
| 4.8 [MEDIUM] No file-size cap after the 2048px resize | ⏳ | Assert `result.size < 5 MB` post-resize; re-encode at lower quality if larger. |
| 4.9 [LOW] `app.json` may include unused permissions | ⏳ | Audit + prune (`WRITE_EXTERNAL_STORAGE`, `SYSTEM_ALERT_WINDOW` if present). |
| 4.10 [LOW] emoji + format-string leaks via console/Alert | ⏳ | Folded into §4.6. |

## 5. Spec ↔ implementation gaps

| Section | Status | Closing slice |
| ------- | ------ | ------------- |
| 5.3 FR-AUTH-013 AC1 cold-start race | 🟡 | TD-3 — opportunistic. |
| 5.5 FR-PROFILE-007 AC5 `profile_updated` analytics | 🟡 | TD-134 — gated on analytics spine. |
| 5.6 FR-POST-005 AC4 server-side EXIF strip | 🟡 | TD-23 — Edge Function shipped (PR #195) + cron in `0080_strip_exif_cron`. |
| 5.7 FR-AUTH-011 AC4 avatar-removal Storage leak | ⏳ | Mirror P0.4-FE upload cleanup. |
| 5.9 FR-SETTINGS-001/003/006 toggles | 🟡 | Most settings persist now (notification prefs via 0062). Audit row only refers to the legacy `useState` defaults — re-verify per toggle. |
| 5.10 FR-PROFILE-007 AC2 email/phone read-only on Edit Profile | ⏳ | Small UI addition. |
| 5.11 [LOW] CLAUDE.md verification gate not enforced | ⏳ | Pre-commit hook checking commit-message format. |

## 6. UI / screens — AC misses on shipped pages

| Section | Status | Closing slice |
| ------- | ------ | ------------- |
| 6.2 Settings 7 dead `onPress={() => {}}` (TD-107) | 🟡 | Many rows wired through Settings refactor; spot-verify remaining. |
| 6.3 Edit Profile share button no-op (TD-106) | ⏳ | TD-106 still open. |
| 6.4 Type toggle emoji `🔍`/`🎁` | ⏳ | Folded into §4.6. |
| 6.5 Magic strings — limits hard-coded in `i18n/he.ts` | ⏳ | Reference `MAX_MEDIA_ASSETS` from `@kc/domain`. |
| 6.6 Settings toggles component-state only | 🟡 | Same as §5.9. |

## 7. Architecture, code-quality, tooling

| Section | Status | Closing slice |
| ------- | ------ | ------------- |
| 7.1 Turbo `test` task has no `inputs` | ⏳ | Add `"inputs": ["src/**", "**/*.test.ts(x)"]`. |
| 7.2 No CI gate on `database.types.ts` drift | ⏳ | `pnpm typegen:check` script + CI step. |
| 7.4 No tests for Supabase adapters (TD-50) | 🟡 | Recent commits add adapter coverage (`mapClosurePgError`, `SupabaseAccountGateRepository`, `mapUserRow`, `UniversalSearchUseCase`). Continue. |
| 7.7 `authStore` mutations bypass use cases | ⏳ | Tighten store setters. |

## 8. Documentation drift

| Section | Status | Closing slice |
| ------- | ------ | ------------- |
| 8.1 TD-43 `SRS.md` Last-Updated stale | ⏳ | Touch in next SRS-touching PR. |
| 8.2 TD-4 `docs/SSOT/CODE_QUALITY.md` referenced but missing | ⏳ | Short stub or remove the reference. |
| 8.3 `PROJECT_STATUS.md` posts test-coverage drift | 🟡 | Adapter tests landing — partially resolved. |
| 8.4 HISTORY.md format inconsistent | ⏳ | Cosmetic. |

## 9. Cross-cutting / NFR

| Section | Status | Closing slice |
| ------- | ------ | ------------- |
| 9.1 No CSP for web build | ⏳ | Meta tag in Expo web template. |
| 9.2 No a11y check on icon-only buttons | ⏳ | Same as §16.4 — mechanical sweep. |
| 9.3 No rate-limit on `signIn` at application layer | ⏳ | Folded into §19.1. |

## 13. PRD business-rules compliance (Round 2)

| Rule | Status | Closing slice |
| ---- | ------ | ------------- |
| R-MVP-Chat-4 (auto first-message verbatim copy) | ⏳ | Verify `BuildAutoMessageUseCase.ts` string. |
| R-MVP-Chat-6 (payment-suggestion auto-report) | ⏳ | Either rewrite the PRD rule (community-driven only) or implement a stub. |

## 14. Navigation, user-flow & screen-mapping (Round 2)

| Section | Status | Closing slice |
| ------- | ------ | ------------- |
| 14.7 [MEDIUM] Apple SSO + Phone OTP placeholder | 🟡 | TD-24 + TD-151 (auth hardening). |

## 15. RLS, triggers & SECURITY DEFINER (Round 2)

| Section | Status | Closing slice |
| ------- | ------ | ------------- |
| 15.7 [MEDIUM] Realtime publication on `users` exposes sensitive columns | ⏳ | Curated `users_public_view` or column-filter on publication. |
| 15.9 [MEDIUM] `messages.sender_id ON DELETE SET NULL` keeps body | 🟡 | Documented intent per spec. Re-decide at GDPR pass. |
| 15.14 [LOW] `is_post_visible_to()` STABLE per-row evaluation | ⏳ | Profile EXPLAIN at scale. |
| 15.15 [LOW] `cities` table has theatrical RLS | ⏳ | Disable RLS on `cities` OR add intent comment. |

## 16. Per-screen UI/UX correctness (Round 2)

| Section | Status | Closing slice |
| ------- | ------ | ------------- |
| 16.3 [HIGH] Type-toggle emoji in `(tabs)/create.tsx` | ⏳ | Folded into §4.6. |
| 16.4 [HIGH] Icon-only TouchableOpacity missing `accessibilityLabel` | ⏳ | Mechanical sweep (~1h). |
| 16.6 [MEDIUM] Soft-gate success alert emoji `✅` | ⏳ | Folded into §4.6. |
| 16.8 [MEDIUM] Donations time composer no trim | ⏳ | Same shape as §16.7. |
| 16.10 [MEDIUM] Edit Profile no unsaved-changes warn on Back | ⏳ | `dirty` flag + confirm Alert. |
| 16.12 [MEDIUM] Many screens lack loading skeletons | ⏳ | Shared `<ScreenLoading />`. |

## 18. Concurrency, idempotency, atomicity

| Section | Status | Closing slice |
| ------- | ------ | ------------- |
| 18.1 [HIGH] `SendMessageUseCase` no idempotency key | ⏳ | `messages.client_request_id uuid unique`. |
| 18.2 [HIGH] `SupabaseChatRepository.findOrCreateChat` race | 🟡 | Support thread closed by `0070` (atomic upsert). DM race produces duplicate rows (no unique constraint by design — FR-CHAT-016 multi-row visibility). Re-decide if duplicate-row UX bites. |
| 18.3 [MEDIUM] `ReportChatUseCase` no idempotency key | ⏳ | Same pattern. |
| 18.4 [MEDIUM] Block/follow toggles no UI loading lock | ⏳ | `isLoading` guard. |
| 18.5 [MEDIUM] `applyIncomingMessage` may double-add on duplicate subs | ⏳ | Subscription-instance tracking. |

## 19. Rate limiting

| Section | Status | Closing slice |
| ------- | ------ | ------------- |
| 19.1 [HIGH] No rate-limit anywhere | ⏳ | `rate_limits` table + `enforce_rate_limit(action, window, max)` SECURITY DEFINER helper. Used by `messages`, `reports`, `follow_edges`, `media_assets` triggers. Major work. |

## 20–21. Time, dates, mobile config

| Section | Status | Notes |
| ------- | ------ | ----- |
| 20.1 [MEDIUM] Mixed timestamp formats | ⏳ | Unify on unix milliseconds at adapter boundary. |
| 20.2 [MEDIUM] Realtime presence leak via counters | ⏳ | Same as §15.7. |
| 20.3 [LOW] No timezone coercion | ⏳ | Cosmetic. |
| 21.2 [MEDIUM] Android `READ_EXTERNAL_STORAGE` over-broad on API 33+ | ⏳ | Same as §4.9. |
| 21.3 [MEDIUM] Web build no CSP/CORS doc | ⏳ | Same as §9.1. |
| 21.4 [MEDIUM] No `pnpm audit` in CI | ⏳ | Wire Dependabot or audit step. |
| 21.5 [LOW] `packageManager` not pinned | ⏳ | Cosmetic. |
