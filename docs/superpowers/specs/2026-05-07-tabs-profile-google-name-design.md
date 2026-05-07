# Design — Tabs polish, Profile labels, Real Google identity

| Field | Value |
| ----- | ----- |
| Date | 2026-05-07 |
| Status | Approved by user (verbal: option A across all questions) |
| SRS touched | `FR-AUTH-003` (AC5 added), `FR-PROFILE-001` (AC4 labels, AC6 added), PRD `06_Navigation_Structure.md` §6.1.2 |
| Project status impact | Not a backlog item — UX polish + interim auth-metadata plumbing on top of the merged Google SSO (P3.1) and Profile UI scaffold (P0 prep work). Settings (P2.1) **out of scope**. |

---

## 1. Problem

User-reported issues from the running app on iPhone:

1. Bottom tab bar shows redundant text labels ("בית", "פרופיל") under each icon.
2. The center "+" tab visually breaks when active: the orange background and orange "+" text overlap → the "+" disappears.
3. Profile tabs read "פוסטים פעילים" / "פוסטים שנמסרו". User wants "פוסטים פתוחים" / "פוסטים סגורים" (broader vocabulary, future-proof if more terminal states get added).
4. After signing in with Google, "My Profile" still shows the seeded mock identity ("ישראל ישראלי") instead of the real Google name and avatar.
5. Settings screen mostly stubbed — out of scope here, will be addressed when P2.1 starts.

## 2. Goals

- Match the agreed visual on the bottom bar: icon-only side tabs, always-visible "+" center.
- Make the My Profile header reflect the **real** signed-in identity for Google users; counters render `0` until the DB schema lands.
- Keep changes inside Clean Architecture boundaries: domain unchanged, application port extended, infra adapter populates the new fields, screen stays presentational.
- Out of scope: any backend wiring for Settings, follow/post counts, onboarding wizard, email/password identity prefill (still works because the email is on the session).

## 3. Non-goals

- Building the real `Profile` table (P0.2 work).
- Wiring counters to a posts/follows backend (P0.4 / P1.1).
- Settings screen behavior (P2.1).
- Apple SSO / Phone OTP identity (P3.2 / P3.3).

## 4. Architecture

### 4.1 Layers touched

| Layer | Change |
| ----- | ------ |
| `@kc/domain` | None. |
| `@kc/application` | `AuthSession` interface gains two optional string fields: `displayName` and `avatarUrl`. The contract: each is `string \| null`; `null` means the auth provider did not surface it. Use cases in `src/auth/*.ts` are unchanged — they pass through whatever the adapter returns. |
| `@kc/infrastructure-supabase` | `SupabaseAuthService.toSession()` is extended to read `user.user_metadata.full_name \|\| user.user_metadata.name` (Google sends `full_name`, sometimes `name`) and `user.user_metadata.avatar_url \|\| user.user_metadata.picture`. Both fall back to `null` cleanly. |
| `apps/mobile` | `(tabs)/_layout.tsx`: drop the label `<Text>` for the side tabs, fix the plus active state. `(tabs)/profile.tsx`: replace `MOCK_USER` with values pulled from `useAuthStore().session`; counters become hard-coded `0`. Tab labels and empty-state copy updated. |

### 4.2 Data flow (My Profile)

```
Supabase Auth (Google JWT)  →  SupabaseAuthService.toSession()
                                  · maps user_metadata.full_name / .avatar_url
                                  · returns AuthSession with new fields
                            →  authStore.session
                            →  ProfileScreen reads session.displayName / session.avatarUrl
                                  · empty-string fallback for displayName: email local-part, then "משתמש"
                                  · null avatar → AvatarInitials renders initials from displayName
```

### 4.3 Tab bar visual rules (final)

| Tab | Inactive | Active |
| --- | -------- | ------ |
| 🏠 / 👤 | icon only, opacity 0.5 | icon only, opacity 1 |
| ➕ (center) | orange circle (`primaryLight` bg, `primary` "+") | filled orange circle (`primary` bg, **white** "+") — the "+" is visible in both states. |

No text labels under any tab.

## 5. Out-of-the-way edge cases

- **Email/password user**: `user_metadata` is empty → `displayName` is `null`. UI falls back to local-part of the email, e.g. `naves@…` → `naves`. No regression — the previous mock name was equally fake.
- **Google user without a profile picture**: `avatar_url` is `null` → `AvatarInitials` already handles `avatarUrl: null`.
- **Existing sessions on cold start**: `getCurrentSession()` already reads from Supabase → the new fields populate on next refresh without the user signing out first.

## 6. Testing

- Existing vitest suite for `@kc/application/auth/*` continues to pass; the new optional fields don't break the `fakeAuthService` (it just returns `null`/`null`).
- `pnpm -r exec tsc --noEmit` must remain clean (TS errors in `infrastructure-supabase/client.ts` are pre-existing TD-6 — not introduced here).
- Manual verification on web preview: sign in with Google → My Profile shows the Google account name + avatar; counters show 0/0/0; tabs show "פוסטים פתוחים / פוסטים סגורים"; bottom bar has icon-only side tabs and a visible "+" in both active and inactive states.

## 7. Tech debt logged

- TD-NEW-1: `displayName` / `avatarUrl` live on `AuthSession` as a temporary measure. Migrate to a `Profile` read once P0.2 lands; the `AuthSession` fields become first-render fallback only.

## 8. Migration / rollout

Single change-set; no DB migration; no env changes; no feature flag. Ship in one PR.
