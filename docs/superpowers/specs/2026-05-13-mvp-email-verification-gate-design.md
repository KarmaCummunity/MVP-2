# MVP Email Verification Gate

**Date:** 2026-05-13
**Mapped to spec:** FR-AUTH-006 (Sign up via email + password), FR-AUTH-007 (Sign in), FR-AUTH-003 (Auth gate)
**Status:** ⏳ Planned

## Problem

Two related issues with the current `account_status` lifecycle:

1. **`pending_verification` is a write-once dead end.** `public.handle_new_user` (migration `0008_seed_all_cities.sql:1384`) sets `account_status = 'pending_verification'` for any auth user whose `email_confirmed_at` is null at INSERT time. There is no trigger on `auth.users UPDATE`, so when a user later confirms their email (Google OAuth often takes a beat; email/password users click the link minutes later), `public.users.account_status` stays at `pending_verification` forever. The `users_select_public` policy in `0001_init_users.sql:244` requires `account_status = 'active'`, so these users disappear from post owner joins — `mapPostRow.ts` falls back to "משתמש שנמחק".

2. **Email/password users with unverified email can use the app.** Migration `0046_auth_gate_allow_pending_verification.sql` lets `pending_verification` pass `auth_check_account_gate` to unblock first-time Google sign-in (the gate ran before the OAuth confirmation propagated). The side effect: any email/password signup that hasn't clicked the verification link is fully active and can post / chat / follow. The spec's FR-AUTH-006 AC2 explicitly forbids this.

The MVP target is simpler than the AC currently describes:

- **Google / Apple / phone sign-in** → `active` immediately and forever. No `pending_verification` middle state for these providers.
- **Email + password sign-up** → cannot sign in until the verification link is clicked. After verifying, the user signs in and is `active`.
- **No verified-badge UX, no in-app "verify your email" banner.** Verification is enforced at the door, not throttled inside the app.

This supersedes FR-AUTH-006 AC2's "user can sign in but cannot create posts / send messages / follow" middle state.

## Architecture overview

```
┌────────────────────────────────────────────────────────────────────┐
│  Sign-up (email+password)                                            │
│  ┌──────────────────────────┐                                        │
│  │ Form on (auth)/sign-up   │  signUp({ emailRedirectTo })          │
│  │ → submit                 │  → Supabase Auth creates user with    │
│  └──────────────────────────┘    email_confirmed_at = null           │
│              │                                                       │
│              ▼  (same screen, content swap)                          │
│  ┌──────────────────────────────────────────────────┐                │
│  │ Verification-pending state                       │                │
│  │   "בדוק את האימייל שלך"                          │                │
│  │   [Open mail] [Resend (60s cooldown)] [Change]   │                │
│  └──────────────────────────────────────────────────┘                │
└────────────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────────────┐
│  Sign-in (email+password) when email is unconfirmed                 │
│  Supabase Auth returns AuthApiError code = 'email_not_confirmed'    │
│  → SignInScreen renders the same Verification-pending state         │
└────────────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────────────┐
│  Email verification link                                             │
│  https://karma-community-kc.com/auth/verify?token_hash=...&type=signup │
│      │                                                               │
│      ├─ web / mobile-web: route handler at /auth/verify              │
│      │     supabase.auth.verifyOtp({ token_hash, type: 'signup' })   │
│      │     → session → AuthGate routes home                          │
│      │                                                               │
│      └─ native iOS / Android: universal link claims this URL         │
│            → Expo Router opens the same /auth/verify route in-app    │
│            → same handler → same routing                             │
└────────────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────────────┐
│  Database — sync auth.users ↔ public.users                          │
│                                                                      │
│  Trigger on auth.users UPDATE OF email_confirmed_at:                 │
│     IF NEW.email_confirmed_at IS NOT NULL                            │
│        AND OLD.email_confirmed_at IS NULL                            │
│     THEN UPDATE public.users SET account_status = 'active'           │
│          WHERE user_id = NEW.id AND account_status = 'pending_verification' │
│                                                                      │
│  One-time backfill (idempotent):                                     │
│     UPDATE public.users u SET account_status = 'active'              │
│       FROM auth.users au                                              │
│      WHERE u.user_id = au.id                                         │
│        AND u.account_status = 'pending_verification'                 │
│        AND au.email_confirmed_at IS NOT NULL                         │
└────────────────────────────────────────────────────────────────────┘
```

## Components to change

### 1. Database migration — `0057_mvp_email_verification_gate.sql`

Single migration containing four DDL statements:

**1a. New trigger on `auth.users.email_confirmed_at`.**
- Function `public.handle_email_confirmed()` (security definer, sets `search_path = public`).
- Body: if `OLD.email_confirmed_at IS NULL AND NEW.email_confirmed_at IS NOT NULL`, update `public.users.account_status = 'active'` where `user_id = NEW.id AND account_status = 'pending_verification'`.
- Trigger `on_auth_user_email_confirmed AFTER UPDATE OF email_confirmed_at ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_email_confirmed();`.

**1b. One-time backfill.**
- Single `UPDATE` joining `public.users` to `auth.users`, sets `active` where the user has confirmed but the public row is stuck.
- Safe to re-run; affects zero rows after the first pass.

**1c. Revert `auth_check_account_gate` to deny `pending_verification`.**
- Restore the gate body from migration `0038_admin_audit_account_gate.sql` (drop the `or v_status = 'pending_verification'` clause that `0046` added).
- Returns `{ allowed: false, reason: 'pending_verification', until_at: null }` for that status. After this migration the gate should never see `pending_verification` for a real user (auth blocks at the door + backfill clears legacy rows), but we keep deny as defense in depth in case a stale session lingers.

**1d. Update `handle_new_user`.**
- Logic stays the same — `case when new.email_confirmed_at is not null then 'active' else 'pending_verification' end`. This is correct under the new policy: Google/Apple/phone always have `email_confirmed_at` set at INSERT, email/password do not.
- No functional change to the function body; restating it in the migration captures the design intent for future readers and avoids drift.

### 2. Supabase Auth project settings

Manual configuration in the Supabase dashboard (not in SQL):

- **`Enable email confirmations` = ON.** This is the lever that makes `signInWithPassword` return `email_not_confirmed` for unconfirmed users.
- **`Site URL` = `https://karma-community-kc.com`.**
- **`Additional Redirect URLs`** — add:
  - `https://karma-community-kc.com/auth/verify`
  - `https://karma-community-kc.com/auth/callback` (existing, for OAuth)
  - `karmacommunity://auth/verify` (native scheme fallback for dev / Expo Go)
- **Email template — `Confirm signup`** — body uses `{{ .ConfirmationURL }}`. Supabase substitutes the URL that points at our `/auth/verify` route with the verification token attached.

This is captured as an operator runbook entry, not a code change.

### 3. `app.json` — deep link configuration

```jsonc
{
  "expo": {
    "scheme": "karmacommunity",
    "ios": {
      "associatedDomains": ["applinks:karma-community-kc.com"]
    },
    "android": {
      "intentFilters": [
        {
          "action": "VIEW",
          "autoVerify": true,
          "data": [
            { "scheme": "https", "host": "karma-community-kc.com", "pathPrefix": "/auth/verify" }
          ],
          "category": ["BROWSABLE", "DEFAULT"]
        }
      ]
    }
  }
}
```

### 4. Web hosting — static deep link manifests

Two static files must be served from the production web build at the exact paths Apple / Google require:

- `https://karma-community-kc.com/.well-known/apple-app-site-association` (Content-Type `application/json`, no `.json` extension)
  ```json
  {
    "applinks": {
      "details": [
        {
          "appID": "<TEAMID>.com.karmacommunity.app",
          "paths": ["/auth/verify", "/auth/verify*"]
        }
      ]
    }
  }
  ```
- `https://karma-community-kc.com/.well-known/assetlinks.json` (Content-Type `application/json`)
  ```json
  [{
    "relation": ["delegate_permission/common.handle_all_urls"],
    "target": {
      "namespace": "android_app",
      "package_name": "com.karmacommunity.app",
      "sha256_cert_fingerprints": ["<release signing fingerprint>"]
    }
  }]
  ```

Files live under `apps/mobile/public/.well-known/` so the Expo web build serves them at the root. Implementation step verifies they are reachable at the public URL after deploy.

### 5. New route — `app/auth/verify.tsx`

Mirrors `app/auth/callback.tsx` but for email confirmation:

- Read `token_hash` and `type` from URL params (Supabase v2 email confirmation format).
- Call `supabase.auth.verifyOtp({ token_hash, type: 'signup' })`.
- On success → `setSession(session)` → `AuthGate` routes to `(onboarding)` or `(tabs)`.
- On failure (expired / consumed / invalid) → render error screen with two actions: "Resend verification email" and "Back to sign-in".

This route lives outside the `(auth)` group, like `auth/callback.tsx`, so the `AuthGate` whitelist already covers it (verify in `app/_layout.tsx`).

### 6. UI — verification-pending state component

New component `VerificationPendingPanel` rendered inline (not a separate screen) inside both:

- `app/(auth)/sign-up.tsx` — replaces form section when `signUp` returns `data.user && !data.session` (Supabase pattern for "email confirmation required").
- `app/(auth)/sign-in.tsx` — replaces form section when the sign-in use case throws an `AuthError` with `code === 'email_not_confirmed'`.

Layout (RTL, matches existing auth screens):

```
📧                                ← email icon
בדוק את האימייל שלך               ← h1 (typography.h1)
שלחנו לינק לאימות אל {email}     ← body, email bolded

[ פתח אימייל ]                    ← primary button (colors.primary)
[ שלח שוב (60) ]                  ← secondary button, countdown when locked
[ שנה אימייל ]                    ← text link, returns to form (clears verifying state)
```

**Open mail behavior:**
- Native (`Platform.OS !== 'web'`): `Linking.openURL('mailto:')`.
- Web: parse domain from the typed email. `@gmail.com` → `https://mail.google.com/mail/u/0/#inbox`. `@outlook.*`, `@hotmail.com`, `@live.com` → `https://outlook.live.com/mail/`. `@yahoo.com` → `https://mail.yahoo.com/`. Anything else → `mailto:`.

**Resend behavior:**
- Calls `supabase.auth.resend({ type: 'signup', email, options: { emailRedirectTo: '<verify URL>' } })`.
- Button is disabled for 60 seconds after each click; label shows the remaining countdown.
- On failure (rate-limited / unknown error): toast / alert in Hebrew.

**Change email:**
- Resets the local "pending" state, restores the form with the previously typed email/password. User can edit and resubmit.

### 7. Application layer

- `getSignUpUseCase` (in `apps/mobile/src/services/authComposition.ts`) — pass `emailRedirectTo: AUTH_VERIFY_URL` to `supabase.auth.signUp`. Returns `pendingVerification = true` when Supabase responds with `data.user && !data.session`.
- `getSignInUseCase` — surfaces `email_not_confirmed` as an `AuthError` with that code. Already maps in `mapAuthErrorToHebrew`; verify the mapping exists and add if missing.
- New env var `EXPO_PUBLIC_AUTH_VERIFY_URL` — `https://karma-community-kc.com/auth/verify` in prod, `karmacommunity://auth/verify` in Expo Go dev.

### 8. Cleanup — `useEnforceAccountGate.ts`

Remove the special-case fallthrough at lines 32–34:

```diff
- if ((result.reason as string | undefined) === 'pending_verification') return;
```

After this migration the gate denies `pending_verification`, and we want users with such a stale status to be signed out and shown the verify-pending state on next launch. Comment removed; replaced by the migration handling the case at the source.

## SSOT updates

Same change-set as the code:

**`docs/SSOT/spec/01_auth_and_onboarding.md`**

- FR-AUTH-006 AC2 — rewrite:
  > AC2. After submitting valid credentials, Supabase Auth creates the account with `email_confirmed_at = null` and the user **cannot sign in** until they click the link in the verification email. The sign-up screen transitions in place to a verification-pending state with three actions: "Open mail" (launches the default mail client / a known webmail provider based on email domain), "Resend verification email" (60-second cooldown), and "Change email" (returns to the form). The same verification-pending state appears on the sign-in screen if a user with an unconfirmed email tries to sign in.
- FR-AUTH-006 AC3 — unchanged (email arrival SLA).
- FR-AUTH-006 AC4 — unchanged (link is single-use, 24-hour TTL).
- FR-AUTH-007 — add AC6: "If `signInWithPassword` returns `email_not_confirmed`, the sign-in screen renders the verification-pending state from FR-AUTH-006 AC2."
- Change log entry: "0.3 / 2026-05-13 / Migration `0057`: `account_status` lifecycle simplified to `active` after any successful auth gate; email/password sign-up blocked at Supabase Auth until verification link clicked; `auth.users UPDATE` trigger syncs `email_confirmed_at` to `account_status`; one-time backfill clears stuck rows. FR-AUTH-006 AC2 rewritten; FR-AUTH-007 AC6 added; supersedes the `pending_verification` middle-state and `0046_auth_gate_allow_pending_verification` gate exception."

**`docs/SSOT/DECISIONS.md`**

New `D-19`:
> **Decision.** MVP enforces email verification at the auth boundary, not as an in-app state. Email/password sign-up is blocked from sign-in until the verification link is clicked; Google / Apple / phone are `active` on first INSERT (provider returns `email_confirmed_at` immediately).
>
> **Rationale.** The "user can sign in but features are throttled" semantics from FR-AUTH-006 AC2 require a verified-badge product, a non-dismissible banner, and per-feature RLS gates we are not building for MVP. Enforcing at the door yields a strictly simpler product surface and aligns with what `users_select_public` already assumes (`account_status = 'active'`).
>
> **Alternatives rejected.** Keep `pending_verification` as a middle state and gate posts/chat/follow on it — adds RLS surface, banner UX, and verified-badge work that is not in MVP scope. Skip email verification entirely — leaves a permanent spam vector and conflicts with the FR-AUTH-006 source PRD.
>
> **Affected docs.** `FR-AUTH-006`, `FR-AUTH-007`, `FR-AUTH-003`, migrations `0057_mvp_email_verification_gate.sql` (supersedes `0046_auth_gate_allow_pending_verification.sql`).

**`docs/SSOT/BACKLOG.md`**

Add a new `🟡 In progress` row in the Auth section: "FR-AUTH-006 / FR-AUTH-007 — MVP email verification gate (migration 0057 + verify route + verify-pending UI)". Flip to `✅ Done` when implementation lands.

**`docs/SSOT/TECH_DEBT.md`**

- If any existing TD entry tracks "verified-badge / email verification UX", mark it deferred to v2 (we are explicitly out of scope for it).
- Add a new entry (BE lane, `TD-7x`): "Deep link AASA / assetlinks files require release-build signing fingerprint for Android. Until the signing cert is finalized, intent filter falls back to chooser dialog instead of direct app open."

## Acceptance criteria

- AC1. A user who signs up with email + password cannot sign in until they click the verification link. `signInWithPassword` returns `email_not_confirmed` and the sign-in screen renders the verification-pending state.
- AC2. After signing up with email + password, the sign-up screen transitions in place to the verification-pending state. The form data is preserved if the user clicks "Change email".
- AC3. The "Resend" button triggers `supabase.auth.resend({ type: 'signup' })` and is disabled for 60 seconds after each click.
- AC4. The "Open mail" button opens the default mail app on native and the user's webmail provider (Gmail / Outlook / Yahoo / fallback `mailto:`) on web.
- AC5. Clicking the link in the verification email loads `/auth/verify`, exchanges the token for a session, and the user lands on the home feed (or onboarding wizard if `onboarding_state != completed`). This works in:
  - desktop browser (web build)
  - mobile browser (mobile-web)
  - iOS native app (universal link)
  - Android native app (app link with `autoVerify`)
- AC6. A user signing up with Google has `account_status = 'active'` immediately on first `auth.users` INSERT. There is no `pending_verification` transient state for OAuth providers.
- AC7. Existing users with `account_status = 'pending_verification'` whose `auth.users.email_confirmed_at IS NOT NULL` are migrated to `active` by the migration's backfill statement.
- AC8. If a future user somehow ends up `pending_verification` (e.g., schema regression), `auth_check_account_gate` denies them with `reason: 'pending_verification'`, `useEnforceAccountGate` signs them out, and they land back at the sign-in screen.
- AC9. The trigger `on_auth_user_email_confirmed` promotes `pending_verification` → `active` exactly when `email_confirmed_at` transitions from null to non-null (not on every UPDATE, not on email change).

## Test plan

**SQL (Supabase tests):**
- Migration apply on a clean dev database — `handle_email_confirmed` trigger present, `auth_check_account_gate` body excludes `pending_verification` from the allowed branch.
- Insert a row in `public.users` with `account_status = 'pending_verification'`, manually flip `auth.users.email_confirmed_at` from null to `now()`, assert the public row is now `active`.
- Re-run the backfill statement on a fresh dataset — assert no rows updated on the second pass.

**Application:**
- `pnpm typecheck`, `pnpm test`, `pnpm lint` from `app/`.
- Vitest unit test for the sign-in use case mapping `email_not_confirmed` to an `AuthError` with the correct code.

**Manual (mobile web + native):**
- Sign up with a fresh email/password — verify the screen transitions in place, the email arrives within 60s, clicking the link logs the user in.
- Sign in with the same credentials before clicking the link — verify the verification-pending state appears.
- Click "Resend", wait 60s, click again — verify cooldown.
- Click "Open mail" on web (Gmail address) — verify the correct webmail opens.
- On iOS / Android release build, tap the link in the mail app — verify the app opens (not the browser).
- Sign up with Google — verify `account_status` is `active` in the database immediately.

## Out of scope

- Verified-badge / "trusted user" UI. Deferred to v2.
- "You're almost there" banner inside the app for users mid-verification. The new policy keeps verification at the door — the in-app banner is unnecessary.
- Tightening posts / chat / follow INSERT RLS to require `account_status = 'active'`. The current RLS path already filters at SELECT via `users_select_public`; adding INSERT-side checks is a separate hardening item (covered by a future TD).
- Apple Sign In configuration. Currently the user flow is Google + email/password + phone — Apple Sign In is a separate FR (FR-AUTH-002 if extant) and not changed here.
- Deleting historical orphan rows in `public.users` where `auth.users` was removed. Out of scope; covered by the existing delete-account flow.

## Risk / rollout

**Low blast radius.** All changes are additive or revert-only:
- Trigger and backfill are idempotent.
- `auth_check_account_gate` revert restores the pre-`0046` behavior; the only callers that depended on `0046`'s exception are the client guards we are removing.
- Universal link config does not break existing users — they continue to sign in through the existing OAuth callback path until they next verify an email.

**Rollout order (single deploy):**
1. Apply migration `0057` to Supabase.
2. Deploy web with `/auth/verify` route and `.well-known/` files.
3. Verify universal link manifests reachable: `curl -I https://karma-community-kc.com/.well-known/apple-app-site-association` returns 200 with JSON content type.
4. Push EAS build with new `app.json` deep link config.
5. Toggle `Enable email confirmations = ON` in Supabase dashboard.
6. Update `Site URL` and `Additional Redirect URLs` in Supabase Auth settings.

**Rollback:** revert the migration (drop the trigger, restore `0046` gate body), toggle `Enable email confirmations = OFF`, redeploy previous client build. The backfill is not reversible but is also not harmful — promoting `pending_verification` → `active` for already-confirmed users is the correct end state regardless.
