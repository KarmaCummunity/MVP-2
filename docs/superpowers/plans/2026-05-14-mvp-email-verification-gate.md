# MVP Email Verification Gate Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Enforce email verification at the Supabase Auth boundary for email/password sign-up. Sync `auth.users.email_confirmed_at` to `public.users.account_status` so Google / Apple / phone users are `active` immediately, and email/password users are blocked from signing in until they click the verification link. Surface a verification-pending UI state on sign-up and sign-in that includes "open mail" / "resend" / "change email" actions. Make the verification link a deep link that drops the user back into the app on web, mobile-web, iOS, and Android.

**Architecture:** One Supabase migration adds an `auth.users UPDATE` trigger + one-time backfill + reverts the `auth_check_account_gate` exception added by `0046`. The application layer extends `IAuthService` with `emailRedirectTo`, `resendVerificationEmail`, and `verifyOtp`, plus two new use cases (`ResendVerificationEmail`, `VerifyEmail`). A shared `VerificationPendingPanel` React component renders the same UI inside both `(auth)/sign-up.tsx` and `(auth)/sign-in.tsx`. A new `app/auth/verify.tsx` route handles the email link landing. `app.json` plus two static manifests under `apps/mobile/public/.well-known/` make the link a universal link on iOS / app link on Android.

**Tech Stack:** Supabase (Postgres, Auth, RLS triggers), TypeScript, React Native via Expo (expo-router, expo-linking), Vitest, pnpm + turbo monorepo.

---

## File Structure

**Create:**
- `supabase/migrations/0057_mvp_email_verification_gate.sql` — trigger + backfill + gate revert.
- `app/packages/application/src/auth/ResendVerificationEmail.ts` — use case.
- `app/packages/application/src/auth/__tests__/ResendVerificationEmail.test.ts`
- `app/packages/application/src/auth/VerifyEmail.ts` — use case.
- `app/packages/application/src/auth/__tests__/VerifyEmail.test.ts`
- `app/packages/infrastructure-supabase/src/auth/__tests__/SupabaseAuthService.test.ts` — adapter test (if absent).
- `app/apps/mobile/src/lib/openMail.ts` — domain-aware webmail / mailto helper.
- `app/apps/mobile/src/lib/__tests__/openMail.test.ts`
- `app/apps/mobile/src/components/auth/VerificationPendingPanel.tsx` — shared RN UI.
- `app/apps/mobile/app/auth/verify.tsx` — Expo Router route, mirrors `auth/callback.tsx`.
- `app/apps/mobile/public/.well-known/apple-app-site-association` — AASA file (no extension).
- `app/apps/mobile/public/.well-known/assetlinks.json` — Android app links manifest.

**Modify:**
- `app/packages/application/src/ports/IAuthService.ts` — add 3 methods + 1 input param.
- `app/packages/application/src/auth/SignUpWithEmail.ts` — accept `emailRedirectTo`.
- `app/packages/application/src/auth/__tests__/SignUpWithEmail.test.ts` — cover redirect plumbing.
- `app/packages/application/src/auth/__tests__/fakeAuthService.ts` — extend fake.
- `app/packages/application/src/index.ts` — export new use cases.
- `app/packages/infrastructure-supabase/src/auth/SupabaseAuthService.ts` — implement new methods.
- `app/apps/mobile/src/services/authComposition.ts` — wire new use cases, expose `AUTH_VERIFY_URL`.
- `app/apps/mobile/src/services/authMessages.ts` — verify `email_not_verified` mapping (already present; no-op unless missing).
- `app/apps/mobile/app/(auth)/sign-up.tsx` — replace `Alert` with `VerificationPendingPanel`.
- `app/apps/mobile/app/(auth)/sign-in.tsx` — render `VerificationPendingPanel` on `email_not_verified`.
- `app/apps/mobile/src/hooks/useEnforceAccountGate.ts` — remove `pending_verification` fallthrough.
- `app/apps/mobile/app.json` — add `scheme`, `ios.associatedDomains`, `android.intentFilters`.
- `docs/SSOT/spec/01_auth_and_onboarding.md` — FR-AUTH-006 AC2 rewrite + FR-AUTH-007 AC6.
- `docs/SSOT/DECISIONS.md` — D-19.
- `docs/SSOT/BACKLOG.md` — flip row to in-progress, then done at PR merge.
- `docs/SSOT/TECH_DEBT.md` — new BE entry for signing-cert dependency.

---

## Task 1: Database migration

**Files:**
- Create: `supabase/migrations/0057_mvp_email_verification_gate.sql`

- [ ] **Step 1: Create the migration file with full body**

```sql
-- 0057 — MVP: enforce email verification at the auth boundary, sync
-- auth.users.email_confirmed_at → public.users.account_status, and revert
-- the pending_verification exception that 0046 added to auth_check_account_gate.
--
-- After this migration:
--   • Google / Apple / phone users land as 'active' on first INSERT (unchanged from 0008).
--   • Email/password users land as 'pending_verification' on first INSERT.
--     Supabase Auth blocks signInWithPassword for them; they cannot reach the gate.
--   • When the user clicks the verification link, auth.users.email_confirmed_at
--     flips from NULL to a timestamp; the new trigger promotes
--     public.users.account_status from 'pending_verification' to 'active'.
--   • A one-time backfill cleans up legacy rows whose auth user verified
--     before this migration but whose public row was never synced.
--   • auth_check_account_gate denies 'pending_verification' (restoring 0038
--     semantics); defense in depth for stale sessions that predate this deploy.

-- ── 1. handle_email_confirmed: trigger function on auth.users UPDATE ───────
create or replace function public.handle_email_confirmed()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.email_confirmed_at is not null
     and old.email_confirmed_at is null then
    update public.users
       set account_status = 'active'
     where user_id = new.id
       and account_status = 'pending_verification';
  end if;
  return new;
end;
$$;

drop trigger if exists on_auth_user_email_confirmed on auth.users;
create trigger on_auth_user_email_confirmed
  after update of email_confirmed_at on auth.users
  for each row
  execute function public.handle_email_confirmed();

-- ── 2. One-time backfill ─────────────────────────────────────────────────
-- Idempotent: re-running it touches zero rows after the first pass.
update public.users u
   set account_status = 'active'
  from auth.users au
 where u.user_id = au.id
   and u.account_status = 'pending_verification'
   and au.email_confirmed_at is not null;

-- ── 3. auth_check_account_gate: revert to deny pending_verification ──────
-- Body is identical to 0038 (which 0046 patched). We keep the lazy-unsuspend
-- branch from 0038; only the 'or v_status = pending_verification' allow
-- clause introduced by 0046 is removed.
create or replace function public.auth_check_account_gate(p_user_id uuid)
returns table (
  allowed boolean,
  reason  text,
  until_at timestamptz
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_caller uuid := auth.uid();
  v_status text;
  v_until  timestamptz;
begin
  if v_caller is null then
    raise exception 'forbidden' using errcode = '42501';
  end if;
  if v_caller <> p_user_id and not public.is_admin(v_caller) then
    raise exception 'forbidden' using errcode = '42501';
  end if;

  update public.users
     set account_status       = 'active',
         account_status_until = null
   where user_id = p_user_id
     and account_status = 'suspended_for_false_reports'
     and account_status_until is not null
     and account_status_until <= now();
  if found then
    insert into public.audit_events (actor_id, action, target_type, target_id, metadata)
    values (null, 'unsuspend_user', 'user', p_user_id,
            jsonb_build_object('lazy', true));
  end if;

  select account_status, account_status_until
    into v_status, v_until
    from public.users where user_id = p_user_id;

  if v_status = 'active' then
    return query select true, null::text, null::timestamptz;
    return;
  end if;

  return query select
    false,
    case v_status
      when 'banned' then 'banned'
      when 'suspended_admin' then 'suspended_admin'
      when 'suspended_for_false_reports' then 'suspended_for_false_reports'
      else v_status
    end,
    v_until;
end;
$$;
```

- [ ] **Step 2: Apply the migration locally and inspect**

Run via the Supabase MCP `mcp__supabase__apply_migration` with name `0057_mvp_email_verification_gate` and the SQL body from Step 1.

Expected: success response (no error). Then run a sanity SELECT to confirm trigger exists:

```sql
select tgname from pg_trigger where tgname = 'on_auth_user_email_confirmed';
```

Expected: 1 row returned.

- [ ] **Step 3: Spot-check backfill effect**

```sql
select account_status, count(*)
  from public.users
 group by account_status;
```

Expected: zero rows in `pending_verification` if all current legacy rows had their auth user confirmed. Otherwise the remainder are genuinely unconfirmed email/password users (correct).

- [ ] **Step 4: Commit**

```bash
git add supabase/migrations/0057_mvp_email_verification_gate.sql
git commit -m "feat(infra): MVP email verification gate trigger + backfill (FR-AUTH-006)

Trigger on auth.users.email_confirmed_at promotes public.users from
pending_verification to active when a user confirms. One-time backfill
clears legacy stuck rows. auth_check_account_gate reverts to denying
pending_verification (restores 0038 semantics; supersedes 0046)."
```

---

## Task 2: Extend `IAuthService` port

**Files:**
- Modify: `app/packages/application/src/ports/IAuthService.ts`

- [ ] **Step 1: Add three methods + extend signature**

Replace the `signUpWithEmail` line and append three new methods. The full updated interface body:

```typescript
export interface IAuthService {
  /**
   * Create a new credentialed user. Returns the active session, or null if
   * email-confirmation is pending. Pass `emailRedirectTo` to set the URL
   * Supabase places into `{{ .ConfirmationURL }}` in the verification email.
   */
  signUpWithEmail(
    email: string,
    password: string,
    options?: { emailRedirectTo?: string },
  ): Promise<AuthSession | null>;

  signInWithEmail(email: string, password: string): Promise<AuthSession>;

  signOut(): Promise<void>;

  getCurrentSession(): Promise<AuthSession | null>;

  onSessionChange(listener: (session: AuthSession | null) => void): () => void;

  getGoogleAuthUrl(redirectTo: string): Promise<string>;

  exchangeCodeForSession(code: string): Promise<AuthSession>;

  /**
   * FR-AUTH-006 (MVP gate): resend the signup verification email to `email`.
   * `emailRedirectTo` controls where the link lands after Supabase verifies the
   * token. Throws AuthError('rate_limited', ...) on too-frequent calls.
   */
  resendVerificationEmail(
    email: string,
    options?: { emailRedirectTo?: string },
  ): Promise<void>;

  /**
   * FR-AUTH-006 (MVP gate): exchange a verification token (from the email
   * link) for an authenticated session.
   */
  verifyEmail(tokenHash: string): Promise<AuthSession>;
}
```

- [ ] **Step 2: Typecheck the application package**

Run: `cd /Users/navesarussi/KC/MVP-2/app && pnpm --filter @kc/application typecheck`

Expected: typecheck fails because `SupabaseAuthService` doesn't yet implement the new methods. We will fix this in Task 6.

- [ ] **Step 3: Commit**

```bash
git add app/packages/application/src/ports/IAuthService.ts
git commit -m "feat(application): extend IAuthService with resend + verifyEmail (FR-AUTH-006)"
```

---

## Task 3: Update fake auth service to match the new port

**Files:**
- Modify: `app/packages/application/src/auth/__tests__/fakeAuthService.ts`

- [ ] **Step 1: Read the existing fake to understand its shape**

Run: `cat /Users/navesarussi/KC/MVP-2/app/packages/application/src/auth/__tests__/fakeAuthService.ts`

Expected: a class implementing `IAuthService` with simple stubs and a `signUpResult` field. We will extend it with stubs for the new methods + capture fields for assertions.

- [ ] **Step 2: Add the new fields and methods. Append (or merge with existing) to the class body**

```typescript
// New fields (add near `signUpResult`)
public resendCalls: Array<{ email: string; emailRedirectTo?: string }> = [];
public verifyEmailResult: AuthSession | null = null;
public verifyEmailCalls: string[] = [];
public lastSignUpRedirect: string | undefined;

// Modify signUpWithEmail signature to capture options.emailRedirectTo:
async signUpWithEmail(
  _email: string,
  _password: string,
  options?: { emailRedirectTo?: string },
): Promise<AuthSession | null> {
  this.lastSignUpRedirect = options?.emailRedirectTo;
  return this.signUpResult;
}

// New methods (add to the class body)
async resendVerificationEmail(
  email: string,
  options?: { emailRedirectTo?: string },
): Promise<void> {
  this.resendCalls.push({ email, emailRedirectTo: options?.emailRedirectTo });
}

async verifyEmail(tokenHash: string): Promise<AuthSession> {
  this.verifyEmailCalls.push(tokenHash);
  if (!this.verifyEmailResult) {
    throw new AuthError('unknown', 'fake_no_verify_result');
  }
  return this.verifyEmailResult;
}
```

If the existing file doesn't import `AuthError`, add: `import { AuthError } from '../errors';`

- [ ] **Step 3: Typecheck**

Run: `cd /Users/navesarussi/KC/MVP-2/app && pnpm --filter @kc/application typecheck`

Expected: `application` package typechecks. (Real adapter still failing in Task 6.)

- [ ] **Step 4: Commit**

```bash
git add app/packages/application/src/auth/__tests__/fakeAuthService.ts
git commit -m "test(application): extend FakeAuthService with resend + verifyEmail"
```

---

## Task 4: `ResendVerificationEmail` use case (TDD)

**Files:**
- Create: `app/packages/application/src/auth/__tests__/ResendVerificationEmail.test.ts`
- Create: `app/packages/application/src/auth/ResendVerificationEmail.ts`
- Modify: `app/packages/application/src/index.ts`

- [ ] **Step 1: Write the failing test**

`app/packages/application/src/auth/__tests__/ResendVerificationEmail.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import { ResendVerificationEmailUseCase } from '../ResendVerificationEmail';
import { AuthError } from '../errors';
import { FakeAuthService } from './fakeAuthService';

describe('ResendVerificationEmailUseCase', () => {
  it('calls auth.resendVerificationEmail with normalized email and the redirect URL', async () => {
    const auth = new FakeAuthService();
    const uc = new ResendVerificationEmailUseCase(auth);

    await uc.execute({ email: '  A@B.CO  ', emailRedirectTo: 'https://x/auth/verify' });

    expect(auth.resendCalls).toEqual([
      { email: 'a@b.co', emailRedirectTo: 'https://x/auth/verify' },
    ]);
  });

  it('rejects malformed email before hitting the adapter', async () => {
    const auth = new FakeAuthService();
    const uc = new ResendVerificationEmailUseCase(auth);

    await expect(uc.execute({ email: 'no-at' })).rejects.toMatchObject({
      code: 'invalid_email',
    } satisfies Partial<AuthError>);
    expect(auth.resendCalls).toHaveLength(0);
  });
});
```

- [ ] **Step 2: Run the test — expect failure**

Run: `cd /Users/navesarussi/KC/MVP-2/app && pnpm --filter @kc/application test -- ResendVerificationEmail`

Expected: FAIL — "Cannot find module '../ResendVerificationEmail'".

- [ ] **Step 3: Write the minimal implementation**

`app/packages/application/src/auth/ResendVerificationEmail.ts`:

```typescript
/** FR-AUTH-006 (MVP gate): resend signup verification email. */
import type { IAuthService } from '../ports/IAuthService';
import { AuthError } from './errors';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export interface ResendVerificationEmailInput {
  email: string;
  emailRedirectTo?: string;
}

export class ResendVerificationEmailUseCase {
  constructor(private readonly auth: IAuthService) {}

  async execute(input: ResendVerificationEmailInput): Promise<void> {
    const email = input.email.trim().toLowerCase();
    if (!EMAIL_RE.test(email)) {
      throw new AuthError('invalid_email', 'invalid_email');
    }
    await this.auth.resendVerificationEmail(email, {
      emailRedirectTo: input.emailRedirectTo,
    });
  }
}
```

- [ ] **Step 4: Export from the package barrel**

Edit `app/packages/application/src/index.ts` — locate the existing block that exports auth use cases (look for `SignUpWithEmailUseCase`) and add:

```typescript
export { ResendVerificationEmailUseCase, type ResendVerificationEmailInput } from './auth/ResendVerificationEmail';
```

- [ ] **Step 5: Run the test — expect pass**

Run: `cd /Users/navesarussi/KC/MVP-2/app && pnpm --filter @kc/application test -- ResendVerificationEmail`

Expected: 2 passed.

- [ ] **Step 6: Commit**

```bash
git add app/packages/application/src/auth/ResendVerificationEmail.ts \
        app/packages/application/src/auth/__tests__/ResendVerificationEmail.test.ts \
        app/packages/application/src/index.ts
git commit -m "feat(application): add ResendVerificationEmail use case (FR-AUTH-006)"
```

---

## Task 5: `VerifyEmail` use case (TDD)

**Files:**
- Create: `app/packages/application/src/auth/__tests__/VerifyEmail.test.ts`
- Create: `app/packages/application/src/auth/VerifyEmail.ts`
- Modify: `app/packages/application/src/index.ts`

- [ ] **Step 1: Write the failing test**

`app/packages/application/src/auth/__tests__/VerifyEmail.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import { VerifyEmailUseCase } from '../VerifyEmail';
import { AuthError } from '../errors';
import { FakeAuthService, makeSession } from './fakeAuthService';

describe('VerifyEmailUseCase', () => {
  it('passes the token hash to the adapter and returns the session', async () => {
    const auth = new FakeAuthService();
    auth.verifyEmailResult = makeSession();
    const uc = new VerifyEmailUseCase(auth);

    const out = await uc.execute({ tokenHash: 'abc123' });

    expect(auth.verifyEmailCalls).toEqual(['abc123']);
    expect(out.session.userId).toBe('u_1');
  });

  it('rejects empty token before hitting the adapter', async () => {
    const auth = new FakeAuthService();
    const uc = new VerifyEmailUseCase(auth);

    await expect(uc.execute({ tokenHash: '' })).rejects.toMatchObject({
      code: 'unknown',
    } satisfies Partial<AuthError>);
    expect(auth.verifyEmailCalls).toHaveLength(0);
  });
});
```

- [ ] **Step 2: Run the test — expect failure**

Run: `cd /Users/navesarussi/KC/MVP-2/app && pnpm --filter @kc/application test -- VerifyEmail`

Expected: FAIL — module not found.

- [ ] **Step 3: Write the minimal implementation**

`app/packages/application/src/auth/VerifyEmail.ts`:

```typescript
/** FR-AUTH-006 (MVP gate): exchange the email-verification token for a session. */
import type { IAuthService, AuthSession } from '../ports/IAuthService';
import { AuthError } from './errors';

export interface VerifyEmailInput {
  tokenHash: string;
}

export interface VerifyEmailOutput {
  session: AuthSession;
}

export class VerifyEmailUseCase {
  constructor(private readonly auth: IAuthService) {}

  async execute(input: VerifyEmailInput): Promise<VerifyEmailOutput> {
    if (!input.tokenHash || input.tokenHash.trim().length === 0) {
      throw new AuthError('unknown', 'verify_token_missing');
    }
    const session = await this.auth.verifyEmail(input.tokenHash);
    return { session };
  }
}
```

- [ ] **Step 4: Export from the package barrel**

In `app/packages/application/src/index.ts`, near the `ResendVerificationEmailUseCase` line:

```typescript
export { VerifyEmailUseCase, type VerifyEmailInput, type VerifyEmailOutput } from './auth/VerifyEmail';
```

- [ ] **Step 5: Run the test — expect pass**

Run: `cd /Users/navesarussi/KC/MVP-2/app && pnpm --filter @kc/application test -- VerifyEmail`

Expected: 2 passed.

- [ ] **Step 6: Commit**

```bash
git add app/packages/application/src/auth/VerifyEmail.ts \
        app/packages/application/src/auth/__tests__/VerifyEmail.test.ts \
        app/packages/application/src/index.ts
git commit -m "feat(application): add VerifyEmail use case (FR-AUTH-006)"
```

---

## Task 6: Extend `SignUpWithEmail` to forward `emailRedirectTo`

**Files:**
- Modify: `app/packages/application/src/auth/SignUpWithEmail.ts`
- Modify: `app/packages/application/src/auth/__tests__/SignUpWithEmail.test.ts`

- [ ] **Step 1: Add a failing test that captures the redirect**

In `SignUpWithEmail.test.ts`, append inside the `describe` block:

```typescript
it('forwards emailRedirectTo to the adapter', async () => {
  const auth = new FakeAuthService();
  auth.signUpResult = null;
  const uc = new SignUpWithEmailUseCase(auth);

  await uc.execute({
    email: 'a@b.co',
    password: 'pass1word',
    emailRedirectTo: 'https://karma-community-kc.com/auth/verify',
  });

  expect(auth.lastSignUpRedirect).toBe('https://karma-community-kc.com/auth/verify');
});
```

- [ ] **Step 2: Run — expect failure**

Run: `cd /Users/navesarussi/KC/MVP-2/app && pnpm --filter @kc/application test -- SignUpWithEmail`

Expected: FAIL — `lastSignUpRedirect` is undefined OR the input type rejects `emailRedirectTo`.

- [ ] **Step 3: Update the use case**

Replace `app/packages/application/src/auth/SignUpWithEmail.ts` with:

```typescript
/** FR-AUTH-006: Sign up via email + password. */
import type { IAuthService, AuthSession } from '../ports/IAuthService';
import { AuthError } from './errors';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MIN_PASSWORD_LEN = 8;

export interface SignUpWithEmailInput {
  email: string;
  password: string;
  emailRedirectTo?: string;
}

export interface SignUpWithEmailOutput {
  session: AuthSession | null;
  pendingVerification: boolean;
}

export class SignUpWithEmailUseCase {
  constructor(private readonly auth: IAuthService) {}

  async execute(input: SignUpWithEmailInput): Promise<SignUpWithEmailOutput> {
    const email = input.email.trim().toLowerCase();
    const password = input.password;

    this.validate(email, password);

    const session = await this.auth.signUpWithEmail(email, password, {
      emailRedirectTo: input.emailRedirectTo,
    });
    return {
      session,
      pendingVerification: session === null,
    };
  }

  private validate(email: string, password: string): void {
    if (!EMAIL_RE.test(email)) {
      throw new AuthError('invalid_email', 'invalid_email');
    }
    if (password.length < MIN_PASSWORD_LEN) {
      throw new AuthError('weak_password', 'weak_password_too_short');
    }
    const hasLetter = /[a-zA-Z]/.test(password);
    const hasDigit = /\d/.test(password);
    if (!hasLetter || !hasDigit) {
      throw new AuthError('weak_password', 'weak_password_letter_digit');
    }
  }
}
```

- [ ] **Step 4: Run — expect pass**

Run: `cd /Users/navesarussi/KC/MVP-2/app && pnpm --filter @kc/application test -- SignUpWithEmail`

Expected: all (5+1) tests pass.

- [ ] **Step 5: Commit**

```bash
git add app/packages/application/src/auth/SignUpWithEmail.ts \
        app/packages/application/src/auth/__tests__/SignUpWithEmail.test.ts
git commit -m "feat(application): SignUpWithEmail forwards emailRedirectTo (FR-AUTH-006)"
```

---

## Task 7: Implement new methods in `SupabaseAuthService`

**Files:**
- Modify: `app/packages/infrastructure-supabase/src/auth/SupabaseAuthService.ts`

- [ ] **Step 1: Update `signUpWithEmail` to accept and forward options**

Replace the existing method body (`SupabaseAuthService.ts:17-21`) with:

```typescript
async signUpWithEmail(
  email: string,
  password: string,
  options?: { emailRedirectTo?: string },
): Promise<AuthSession | null> {
  const { data, error } = await this.client.auth.signUp({
    email,
    password,
    options: { emailRedirectTo: options?.emailRedirectTo },
  });
  if (error) throw mapAuthError(error);
  return data.session ? toSession(data.session) : null;
}
```

- [ ] **Step 2: Add `resendVerificationEmail` method**

Append, after `exchangeCodeForSession` and before the closing `}` of the class:

```typescript
async resendVerificationEmail(
  email: string,
  options?: { emailRedirectTo?: string },
): Promise<void> {
  const { error } = await this.client.auth.resend({
    type: 'signup',
    email,
    options: { emailRedirectTo: options?.emailRedirectTo },
  });
  if (error) throw mapAuthError(error);
}
```

- [ ] **Step 3: Add `verifyEmail` method**

Append right after `resendVerificationEmail`:

```typescript
async verifyEmail(tokenHash: string): Promise<AuthSession> {
  const { data, error } = await this.client.auth.verifyOtp({
    type: 'signup',
    token_hash: tokenHash,
  });
  if (error) throw mapAuthError(error);
  if (!data.session) throw new AuthError('unknown', 'verify_no_session');
  return toSession(data.session);
}
```

- [ ] **Step 4: Typecheck the package and the consuming app**

Run: `cd /Users/navesarussi/KC/MVP-2/app && pnpm typecheck`

Expected: green. All workspace packages typecheck.

- [ ] **Step 5: Commit**

```bash
git add app/packages/infrastructure-supabase/src/auth/SupabaseAuthService.ts
git commit -m "feat(infra): Supabase adapter implements resend + verifyOtp (FR-AUTH-006)"
```

---

## Task 8: Composition root — env var + new use case factories

**Files:**
- Modify: `app/apps/mobile/src/services/authComposition.ts`

- [ ] **Step 1: Add the verify URL constant + private cache + factories**

Near the top of the file, after the imports, add:

```typescript
import {
  RestoreSessionUseCase,
  SignInWithEmailUseCase,
  SignInWithGoogleUseCase,
  SignOutUseCase,
  SignUpWithEmailUseCase,
  ResendVerificationEmailUseCase,
  VerifyEmailUseCase,
  type AuthSession as KcAuthSession,
  type IAuthService,
  type OpenAuthSession,
} from '@kc/application';
```

Below the existing `_restore` declaration, add:

```typescript
let _resend: ResendVerificationEmailUseCase | null = null;
let _verifyEmail: VerifyEmailUseCase | null = null;

/**
 * Deep link the verification email lands on. Production: web universal link
 * claimed by AASA + assetlinks. Dev (Expo Go without universal links): a
 * custom scheme that opens the app directly.
 */
export const AUTH_VERIFY_URL =
  process.env.EXPO_PUBLIC_AUTH_VERIFY_URL ?? 'https://karma-community-kc.com/auth/verify';
```

- [ ] **Step 2: Add factory functions**

After `getRestoreSessionUseCase`, add:

```typescript
export function getResendVerificationEmailUseCase(): ResendVerificationEmailUseCase {
  if (!_resend) _resend = new ResendVerificationEmailUseCase(getAuthService());
  return _resend;
}

export function getVerifyEmailUseCase(): VerifyEmailUseCase {
  if (!_verifyEmail) _verifyEmail = new VerifyEmailUseCase(getAuthService());
  return _verifyEmail;
}
```

- [ ] **Step 3: Typecheck**

Run: `cd /Users/navesarussi/KC/MVP-2/app && pnpm typecheck`

Expected: green.

- [ ] **Step 4: Commit**

```bash
git add app/apps/mobile/src/services/authComposition.ts
git commit -m "feat(mobile): wire ResendVerificationEmail + VerifyEmail in composition root"
```

---

## Task 9: `openMail` helper (TDD)

**Files:**
- Create: `app/apps/mobile/src/lib/openMail.ts`
- Create: `app/apps/mobile/src/lib/__tests__/openMail.test.ts`

- [ ] **Step 1: Write failing tests**

`app/apps/mobile/src/lib/__tests__/openMail.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import { resolveWebmailUrl } from '../openMail';

describe('resolveWebmailUrl', () => {
  it('routes gmail addresses to gmail.com', () => {
    expect(resolveWebmailUrl('alice@gmail.com')).toBe('https://mail.google.com/mail/u/0/#inbox');
  });

  it('routes googlemail.com to gmail.com', () => {
    expect(resolveWebmailUrl('alice@googlemail.com')).toBe('https://mail.google.com/mail/u/0/#inbox');
  });

  it('routes outlook / hotmail / live to outlook.live.com', () => {
    expect(resolveWebmailUrl('bob@outlook.com')).toBe('https://outlook.live.com/mail/');
    expect(resolveWebmailUrl('bob@hotmail.com')).toBe('https://outlook.live.com/mail/');
    expect(resolveWebmailUrl('bob@live.com')).toBe('https://outlook.live.com/mail/');
  });

  it('routes yahoo to mail.yahoo.com', () => {
    expect(resolveWebmailUrl('eve@yahoo.com')).toBe('https://mail.yahoo.com/');
  });

  it('falls back to mailto: for unknown providers', () => {
    expect(resolveWebmailUrl('user@example.com')).toBe('mailto:');
  });

  it('returns mailto: for malformed email', () => {
    expect(resolveWebmailUrl('no-at')).toBe('mailto:');
    expect(resolveWebmailUrl('')).toBe('mailto:');
  });

  it('is case-insensitive on the domain', () => {
    expect(resolveWebmailUrl('A@GMAIL.COM')).toBe('https://mail.google.com/mail/u/0/#inbox');
  });
});
```

- [ ] **Step 2: Run — expect failure**

Run: `cd /Users/navesarussi/KC/MVP-2/app && pnpm --filter @kc/mobile test -- openMail`

If the mobile package has no vitest config, run the test via the application package's runner, or run from the workspace root: `cd app && pnpm test -- openMail`.

Expected: FAIL — module not found.

- [ ] **Step 3: Write the implementation**

`app/apps/mobile/src/lib/openMail.ts`:

```typescript
// FR-AUTH-006 — VerificationPendingPanel "Open mail" action.
// Web: route to the user's webmail provider if recognisable, else `mailto:`.
// Native: callers use Linking.openURL('mailto:') directly; this helper is web-only.
import { Linking, Platform } from 'react-native';

export function resolveWebmailUrl(email: string): string {
  const at = email.lastIndexOf('@');
  if (at < 0 || at === email.length - 1) return 'mailto:';
  const domain = email.slice(at + 1).toLowerCase().trim();

  if (domain === 'gmail.com' || domain === 'googlemail.com') {
    return 'https://mail.google.com/mail/u/0/#inbox';
  }
  if (domain === 'outlook.com' || domain === 'hotmail.com' || domain === 'live.com' || domain === 'msn.com') {
    return 'https://outlook.live.com/mail/';
  }
  if (domain === 'yahoo.com' || domain === 'yahoo.co.uk' || domain === 'ymail.com') {
    return 'https://mail.yahoo.com/';
  }
  if (domain === 'icloud.com' || domain === 'me.com' || domain === 'mac.com') {
    return 'https://www.icloud.com/mail';
  }
  if (domain === 'proton.me' || domain === 'protonmail.com') {
    return 'https://mail.proton.me/';
  }
  return 'mailto:';
}

export async function openMail(email: string): Promise<void> {
  if (Platform.OS === 'web') {
    const url = resolveWebmailUrl(email);
    if (typeof window !== 'undefined') {
      window.open(url, '_blank', 'noopener,noreferrer');
    }
    return;
  }
  await Linking.openURL('mailto:');
}
```

- [ ] **Step 4: Run — expect pass**

Run: `cd /Users/navesarussi/KC/MVP-2/app && pnpm test -- openMail`

Expected: 7 passed.

- [ ] **Step 5: Commit**

```bash
git add app/apps/mobile/src/lib/openMail.ts app/apps/mobile/src/lib/__tests__/openMail.test.ts
git commit -m "feat(mobile): add openMail helper with domain-aware webmail routing"
```

---

## Task 10: `VerificationPendingPanel` component

**Files:**
- Create: `app/apps/mobile/src/components/auth/VerificationPendingPanel.tsx`

- [ ] **Step 1: Write the component**

```tsx
// FR-AUTH-006 — verification-pending state shown inside sign-up and sign-in screens.
// Renders email-icon header, three actions: open mail, resend (60s cooldown), change email.
import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { colors, radius, spacing, typography } from '@kc/ui';
import { isAuthError } from '@kc/application';
import { mapAuthErrorToHebrew } from '../../services/authMessages';
import {
  AUTH_VERIFY_URL,
  getResendVerificationEmailUseCase,
} from '../../services/authComposition';
import { openMail } from '../../lib/openMail';

const RESEND_COOLDOWN_SECONDS = 60;

export interface VerificationPendingPanelProps {
  email: string;
  onChangeEmail: () => void;
}

export function VerificationPendingPanel(props: VerificationPendingPanelProps) {
  const { email, onChangeEmail } = props;
  const [cooldown, setCooldown] = useState(0);
  const [resending, setResending] = useState(false);
  const [resendError, setResendError] = useState<string | null>(null);
  const [resendOk, setResendOk] = useState(false);
  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (cooldown <= 0) {
      if (tickRef.current) {
        clearInterval(tickRef.current);
        tickRef.current = null;
      }
      return;
    }
    if (!tickRef.current) {
      tickRef.current = setInterval(() => {
        setCooldown((c) => Math.max(0, c - 1));
      }, 1000);
    }
    return () => {
      if (tickRef.current) {
        clearInterval(tickRef.current);
        tickRef.current = null;
      }
    };
  }, [cooldown]);

  const onOpenMail = () => {
    void openMail(email);
  };

  const onResend = async () => {
    if (cooldown > 0 || resending) return;
    setResending(true);
    setResendError(null);
    setResendOk(false);
    try {
      await getResendVerificationEmailUseCase().execute({
        email,
        emailRedirectTo: AUTH_VERIFY_URL,
      });
      setCooldown(RESEND_COOLDOWN_SECONDS);
      setResendOk(true);
    } catch (err) {
      const message = isAuthError(err) ? mapAuthErrorToHebrew(err.code) : 'שגיאת רשת. נסה שוב.';
      setResendError(message);
    } finally {
      setResending(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.icon}>📧</Text>
      <Text style={styles.title}>בדוק את האימייל שלך</Text>
      <Text style={styles.body}>
        שלחנו לינק לאימות אל <Text style={styles.bodyBold}>{email}</Text>. לחץ עליו כדי להמשיך.
      </Text>

      <TouchableOpacity style={styles.primaryBtn} onPress={onOpenMail}>
        <Text style={styles.primaryBtnText}>פתח אימייל</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.secondaryBtn, (cooldown > 0 || resending) && styles.btnDisabled]}
        onPress={onResend}
        disabled={cooldown > 0 || resending}
      >
        {resending ? (
          <ActivityIndicator color={colors.primary} />
        ) : (
          <Text style={styles.secondaryBtnText}>
            {cooldown > 0 ? `שלח שוב (${cooldown})` : 'שלח שוב'}
          </Text>
        )}
      </TouchableOpacity>

      {resendOk ? <Text style={styles.helperOk}>נשלח. בדוק את תיבת הדואר.</Text> : null}
      {resendError ? <Text style={styles.helperErr}>{resendError}</Text> : null}

      <TouchableOpacity style={styles.tertiaryBtn} onPress={onChangeEmail}>
        <Text style={styles.tertiaryBtnText}>שנה אימייל</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: spacing.base, paddingTop: spacing.lg },
  icon: { fontSize: 48, textAlign: 'center' },
  title: { ...typography.h2, color: colors.textPrimary, textAlign: 'center' },
  body: { ...typography.body, color: colors.textSecondary, textAlign: 'center' },
  bodyBold: { ...typography.body, color: colors.textPrimary, fontWeight: '700' },
  primaryBtn: {
    height: 52,
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: spacing.sm,
  },
  primaryBtnText: { ...typography.button, color: colors.textInverse },
  secondaryBtn: {
    height: 52,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  secondaryBtnText: { ...typography.button, color: colors.primary },
  btnDisabled: { opacity: 0.5 },
  helperOk: { ...typography.caption, color: colors.textSecondary, textAlign: 'center' },
  helperErr: { ...typography.caption, color: colors.danger, textAlign: 'center' },
  tertiaryBtn: { alignItems: 'center', paddingVertical: spacing.sm },
  tertiaryBtnText: { ...typography.body, color: colors.primary },
});
```

- [ ] **Step 2: Verify `colors.danger` exists**

Run: `grep -n "danger" /Users/navesarussi/KC/MVP-2/app/packages/ui/src/tokens.ts`

If absent, replace `colors.danger` with `'#D32F2F'` inline or whatever the established error color is in `@kc/ui`. Adjust the component accordingly before continuing.

- [ ] **Step 3: Typecheck**

Run: `cd /Users/navesarussi/KC/MVP-2/app && pnpm typecheck`

Expected: green.

- [ ] **Step 4: Commit**

```bash
git add app/apps/mobile/src/components/auth/VerificationPendingPanel.tsx
git commit -m "feat(mobile): VerificationPendingPanel shared UI (FR-AUTH-006)"
```

---

## Task 11: Integrate panel into sign-up screen

**Files:**
- Modify: `app/apps/mobile/app/(auth)/sign-up.tsx`

- [ ] **Step 1: Replace the post-submit `Alert` flow with inline panel state**

Open the file. Make these focused edits:

**Add imports** (after the existing `import { useAuthStore }` line):

```typescript
import { VerificationPendingPanel } from '../../src/components/auth/VerificationPendingPanel';
import { AUTH_VERIFY_URL } from '../../src/services/authComposition';
```

**Add a new state hook** alongside `loading` (around line 19-20):

```typescript
const [pendingEmail, setPendingEmail] = useState<string | null>(null);
```

**Replace the `handleSignUp` body** (lines 22-50, current `Alert.alert('כמעט שם', ...)`-based flow):

```typescript
const handleSignUp = async () => {
  if (!email || !password) {
    Alert.alert('שגיאה', 'יש למלא כל השדות');
    return;
  }
  setLoading(true);
  try {
    const { session, pendingVerification } = await getSignUpUseCase().execute({
      email,
      password,
      emailRedirectTo: AUTH_VERIFY_URL,
    });

    if (session) {
      setSession(session);
      return;
    }
    if (pendingVerification) {
      setPendingEmail(email.trim().toLowerCase());
    }
  } catch (err) {
    const message = isAuthError(err)
      ? mapAuthErrorToHebrew(err.code)
      : 'שגיאת רשת. נסה שוב.';
    Alert.alert('הרשמה נכשלה', message);
  } finally {
    setLoading(false);
  }
};
```

**Render the panel when `pendingEmail` is set** — find the `<View style={styles.form}>` block and wrap its contents:

```tsx
{pendingEmail ? (
  <VerificationPendingPanel
    email={pendingEmail}
    onChangeEmail={() => setPendingEmail(null)}
  />
) : (
  <View style={styles.form}>
    {/* existing inputs + submit button unchanged */}
  </View>
)}
```

Keep the existing inputs, button, switch-mode link inside the `<View style={styles.form}>` block. The form stays mounted (state preserved), it's just hidden when the panel is up.

**Hide the legal disclaimer + switch-mode link while pending** (wrap them in a guard):

```tsx
{!pendingEmail ? (
  <>
    <Text style={styles.legal}>בהרשמה אתה מסכים…</Text>
    <TouchableOpacity style={styles.switchMode} …>…</TouchableOpacity>
  </>
) : null}
```

- [ ] **Step 2: Typecheck + lint**

Run: `cd /Users/navesarussi/KC/MVP-2/app && pnpm typecheck && pnpm lint`

Expected: green.

- [ ] **Step 3: Manual smoke**

Skip browser verification for now — covered in Task 13 once the verify route lands.

- [ ] **Step 4: Commit**

```bash
git add app/apps/mobile/app/\(auth\)/sign-up.tsx
git commit -m "feat(mobile): sign-up shows VerificationPendingPanel inline (FR-AUTH-006)"
```

---

## Task 12: Integrate panel into sign-in screen

**Files:**
- Modify: `app/apps/mobile/app/(auth)/sign-in.tsx`

- [ ] **Step 1: Add imports + state**

Same imports as Task 11 Step 1. State:

```typescript
const [pendingEmail, setPendingEmail] = useState<string | null>(null);
```

- [ ] **Step 2: Replace the `handleSignIn` catch block to detect `email_not_verified`**

```typescript
const handleSignIn = async () => {
  if (!email || !password) {
    Alert.alert('שגיאה', 'יש למלא דוא"ל וסיסמה');
    return;
  }
  setLoading(true);
  try {
    const { session } = await getSignInUseCase().execute({ email, password });
    setSession(session);
  } catch (err) {
    if (isAuthError(err) && err.code === 'email_not_verified') {
      setPendingEmail(email.trim().toLowerCase());
      return;
    }
    const message = isAuthError(err)
      ? mapAuthErrorToHebrew(err.code)
      : 'שגיאת רשת. נסה שוב.';
    Alert.alert('כניסה נכשלה', message);
  } finally {
    setLoading(false);
  }
};
```

- [ ] **Step 3: Render panel when pending**

Wrap the existing form block analogously to Task 11 Step 1, with the panel above and the form below mutually exclusive on `pendingEmail`.

- [ ] **Step 4: Typecheck + lint**

Run: `cd /Users/navesarussi/KC/MVP-2/app && pnpm typecheck && pnpm lint`

Expected: green.

- [ ] **Step 5: Commit**

```bash
git add app/apps/mobile/app/\(auth\)/sign-in.tsx
git commit -m "feat(mobile): sign-in shows VerificationPendingPanel on email_not_verified (FR-AUTH-007)"
```

---

## Task 13: `/auth/verify` route

**Files:**
- Create: `app/apps/mobile/app/auth/verify.tsx`

- [ ] **Step 1: Create the route**

```tsx
// Email verification landing route — FR-AUTH-006 (MVP gate).
// Receives `?token_hash=...&type=signup` from Supabase's confirmation URL,
// exchanges the token for a session, and lets AuthGate route to onboarding/tabs.
// Sibling of auth/callback.tsx (OAuth code exchange).
// docs/SSOT/spec/01_auth_and_onboarding.md
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { colors, spacing, typography } from '@kc/ui';
import { isAuthError } from '@kc/application';
import { getVerifyEmailUseCase } from '../../src/services/authComposition';
import { useAuthStore } from '../../src/store/authStore';
import { mapAuthErrorToHebrew } from '../../src/services/authMessages';

export default function AuthVerifyScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ token_hash?: string; type?: string }>();
  const setSession = useAuthStore((s) => s.setSession);
  const [error, setError] = useState<string | null>(null);

  const tokenHash = typeof params.token_hash === 'string' ? params.token_hash : undefined;

  useEffect(() => {
    if (!tokenHash) {
      setError('קישור האימות אינו תקין.');
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const { session } = await getVerifyEmailUseCase().execute({ tokenHash });
        if (cancelled) return;
        setSession(session);
        if (
          Platform.OS === 'web' &&
          typeof window !== 'undefined' &&
          window.opener &&
          !window.opener.closed
        ) {
          window.close();
        }
      } catch (err) {
        if (cancelled) return;
        const msg = isAuthError(err)
          ? mapAuthErrorToHebrew(err.code)
          : 'הקישור פג תוקף או כבר מומש. נסה להתחבר.';
        setError(msg);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [tokenHash, setSession]);

  if (error) {
    return (
      <View style={styles.center}>
        <Text style={styles.title}>האימות לא הצליח</Text>
        <Text style={styles.body}>{error}</Text>
        <TouchableOpacity style={styles.btn} onPress={() => router.replace('/(auth)/sign-in')}>
          <Text style={styles.btnText}>חזרה למסך הכניסה</Text>
        </TouchableOpacity>
      </View>
    );
  }
  return (
    <View style={styles.center}>
      <ActivityIndicator size="large" color={colors.primary} />
      <Text style={styles.body}>מאמת…</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1, justifyContent: 'center', alignItems: 'center',
    backgroundColor: colors.background, paddingHorizontal: spacing.xl, gap: spacing.md,
  },
  title: { ...typography.h2, color: colors.textPrimary, textAlign: 'center' },
  body: { ...typography.body, color: colors.textSecondary, textAlign: 'center' },
  btn: {
    marginTop: spacing.lg, backgroundColor: colors.primary,
    paddingHorizontal: spacing.xl, paddingVertical: spacing.md, borderRadius: 12,
  },
  btnText: { ...typography.button, color: colors.textInverse },
});
```

- [ ] **Step 2: Ensure `AuthGate` whitelists this route**

Open `app/apps/mobile/app/_layout.tsx`. Locate the AuthGate logic that allows unauthenticated access to `auth/callback`. Add `auth/verify` to the same allowlist.

Run: `grep -n "auth/callback\|callback" /Users/navesarussi/KC/MVP-2/app/apps/mobile/app/_layout.tsx /Users/navesarussi/KC/MVP-2/app/apps/mobile/src/components/AuthGate.tsx`

If the allowlist is in either file, mirror the `callback` entry for `verify`. If `verify` matches the same pattern as `callback` because both live under `app/auth/`, no change is needed — note that and skip.

- [ ] **Step 3: Typecheck**

Run: `cd /Users/navesarussi/KC/MVP-2/app && pnpm typecheck`

Expected: green.

- [ ] **Step 4: Manual smoke — web only**

Start the web preview: `cd app && pnpm --filter @kc/mobile web`. Use a fresh email/password to sign up, click the link in the inbox, verify you land on home feed.

(Native deep link smoke happens after Task 14.)

- [ ] **Step 5: Commit**

```bash
git add app/apps/mobile/app/auth/verify.tsx app/apps/mobile/app/_layout.tsx app/apps/mobile/src/components/AuthGate.tsx
git commit -m "feat(mobile): /auth/verify route handles email confirmation (FR-AUTH-006)"
```

(Stage only the files you actually changed.)

---

## Task 14: Deep link config (universal links + app links)

**Files:**
- Modify: `app/apps/mobile/app.json`
- Create: `app/apps/mobile/public/.well-known/apple-app-site-association`
- Create: `app/apps/mobile/public/.well-known/assetlinks.json`

- [ ] **Step 1: Edit `app.json`**

Add a top-level `scheme`:

```json
"scheme": "karmacommunity",
```

Inside `expo.ios`, add:

```json
"associatedDomains": ["applinks:karma-community-kc.com"]
```

Inside `expo.android`, add:

```json
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
```

- [ ] **Step 2: Create the AASA manifest**

`app/apps/mobile/public/.well-known/apple-app-site-association` (no `.json` extension):

```json
{
  "applinks": {
    "details": [
      {
        "appID": "REPLACE_WITH_APPLE_TEAM_ID.com.karmacommunity.app",
        "paths": ["/auth/verify", "/auth/verify*"]
      }
    ]
  }
}
```

Replace `REPLACE_WITH_APPLE_TEAM_ID` with the value from `https://developer.apple.com/account` → Membership → Team ID. If the team ID is not yet known, leave the placeholder, file a TD entry referencing this task, and ship the web part.

- [ ] **Step 3: Create the Android assetlinks manifest**

`app/apps/mobile/public/.well-known/assetlinks.json`:

```json
[
  {
    "relation": ["delegate_permission/common.handle_all_urls"],
    "target": {
      "namespace": "android_app",
      "package_name": "com.karmacommunity.app",
      "sha256_cert_fingerprints": ["REPLACE_WITH_ANDROID_RELEASE_SHA256"]
    }
  }
]
```

Obtain the fingerprint with:
```bash
keytool -list -v -keystore <release.keystore> | grep SHA256
```
For EAS-managed credentials: `eas credentials` → Android → keystore details.

- [ ] **Step 4: Verify the web build serves these at the root**

After the next web deploy:
```bash
curl -sI https://karma-community-kc.com/.well-known/apple-app-site-association
curl -sI https://karma-community-kc.com/.well-known/assetlinks.json
```

Expected: HTTP 200 on both, with `Content-Type: application/json`. If Content-Type is wrong, adjust the static server config or add a `_headers` / `vercel.json` mapping as appropriate to the Railway / hosting setup.

- [ ] **Step 5: Verify Apple's static validator**

`https://branch.io/resources/aasa-validator/` — paste the domain. Expected: AASA parses successfully and shows the entry for `com.karmacommunity.app`. (Google's validator: `https://digitalassetlinks.googleapis.com/v1/statements:list?source.web.site=https://karma-community-kc.com&relation=delegate_permission/common.handle_all_urls`.)

- [ ] **Step 6: Commit**

```bash
git add app/apps/mobile/app.json \
        app/apps/mobile/public/.well-known/apple-app-site-association \
        app/apps/mobile/public/.well-known/assetlinks.json
git commit -m "chore(mobile): add deep-link manifests + intent filter for /auth/verify"
```

---

## Task 15: Cleanup `useEnforceAccountGate`

**Files:**
- Modify: `app/apps/mobile/src/hooks/useEnforceAccountGate.ts`

- [ ] **Step 1: Remove the `pending_verification` early-return**

Delete lines 32–34 of `useEnforceAccountGate.ts`:

```diff
-        // Stale RPC / pre-migration: gate used to deny `pending_verification` with a
-        // non-UI reason that mapped to the banned screen (FR-AUTH-003).
-        if ((result.reason as string | undefined) === 'pending_verification') return;
```

After migration `0057` lands, the gate denies `pending_verification` and we want the enforcer to sign the user out, landing them back at sign-in where Supabase Auth blocks `signInWithPassword` until they verify.

- [ ] **Step 2: Map `pending_verification` reason to a friendly account-blocked params**

Locate the `router.replace({ pathname: '/account-blocked', params: { reason: result.reason ?? 'banned', ... } })` call. Verify that `/account-blocked` either handles `reason === 'pending_verification'` with a sensible Hebrew message ("יש לאמת את האימייל לפני שניתן להיכנס") or — preferably — redirect to `/(auth)/sign-in` directly when `result.reason === 'pending_verification'` (since the sign-in screen will re-show the verify-pending panel on next attempt).

If the simpler path is `/(auth)/sign-in`, the catch becomes:

```typescript
if (result.reason === 'pending_verification') {
  enforcingRef.current = true;
  await supabase.auth.signOut();
  signOut();
  router.replace('/(auth)/sign-in');
  return;
}
```

Place this branch immediately before the existing `enforcingRef.current = true;` line.

- [ ] **Step 3: Typecheck + lint**

Run: `cd /Users/navesarussi/KC/MVP-2/app && pnpm typecheck && pnpm lint`

Expected: green.

- [ ] **Step 4: Commit**

```bash
git add app/apps/mobile/src/hooks/useEnforceAccountGate.ts
git commit -m "refactor(mobile): drop pending_verification fallthrough; gate now denies it"
```

---

## Task 16: SSOT updates

**Files:**
- Modify: `docs/SSOT/spec/01_auth_and_onboarding.md`
- Modify: `docs/SSOT/DECISIONS.md`
- Modify: `docs/SSOT/BACKLOG.md`
- Modify: `docs/SSOT/TECH_DEBT.md`

- [ ] **Step 1: Rewrite FR-AUTH-006 AC2**

In `docs/SSOT/spec/01_auth_and_onboarding.md`, find the line:

> AC2. The account is created in `pending_verification` state until the email link is clicked. In `pending_verification`, the user can sign in but cannot create posts, send messages, or follow others. The home screen shows a non-dismissible banner explaining what is missing.

Replace with:

> AC2. Supabase Auth creates the account with `email_confirmed_at = null`. The user **cannot sign in** until they click the verification link in the email — `signInWithPassword` returns `email_not_confirmed`. The sign-up screen transitions in place to a verification-pending state with three actions: "פתח אימייל" (launches the default mail client on native; routes to a known webmail provider on web based on the email domain), "שלח שוב" (resends the verification email; disabled for 60 seconds after each click), and "שנה אימייל" (returns to the form with the previously typed email/password preserved). The same verification-pending state is rendered on the sign-in screen when the user attempts to sign in with an unconfirmed email.

- [ ] **Step 2: Add FR-AUTH-007 AC6**

Find the FR-AUTH-007 section. Append:

> - AC6. When `signInWithPassword` returns `email_not_confirmed`, the sign-in screen renders the verification-pending state defined in FR-AUTH-006 AC2 instead of an error alert. The user can then resend, open mail, or change email.

- [ ] **Step 3: Add a change-log entry at the bottom of the file**

```markdown
| 0.3 | 2026-05-14 | Migration `0057`: `account_status` lifecycle simplified — email/password sign-up blocked at Supabase Auth boundary until verification link clicked; Google/Apple/phone are `active` on first INSERT; new `auth.users` trigger syncs `email_confirmed_at` → `account_status`; one-time backfill clears legacy stuck rows. FR-AUTH-006 AC2 rewritten. FR-AUTH-007 AC6 added. Supersedes `0046_auth_gate_allow_pending_verification`. |
```

- [ ] **Step 4: Add D-19 to DECISIONS.md**

Append before the Change Log table:

```markdown
## D-19 — MVP email verification at the auth boundary (2026-05-14)

**Decision.** Enforce email verification at Supabase Auth, not as an in-app state. Email/password sign-up users cannot sign in until they click the verification link. Google / Apple / phone users are `active` on first INSERT (provider returns `email_confirmed_at` immediately). The `pending_verification` middle state from FR-AUTH-006 AC2 (in-app banner, throttled features) is deferred to v2 with the verified-badge product.

**Rationale.** The throttled-middle-state semantics require a verified-badge product, a non-dismissible banner, and per-feature RLS gates that are not in MVP scope. Enforcing at the door yields a strictly simpler product surface and aligns with what `users_select_public` already assumes (`account_status = 'active'`). The historical bug where Google users were stuck at `pending_verification` is fixed by the same migration (`0057`) via a trigger that syncs `auth.users.email_confirmed_at` to `public.users.account_status` plus a one-time backfill.

**Alternatives rejected.** Keep `pending_verification` as a throttled middle state — adds RLS surface, banner UX, and verified-badge work that is not in MVP scope. Skip email verification entirely — leaves a permanent spam vector and contradicts the FR-AUTH-006 source PRD.

**Affected docs.** FR-AUTH-006 AC2 (rewritten), FR-AUTH-007 AC6 (new), FR-AUTH-003 (no change), migrations `0057_mvp_email_verification_gate.sql` (supersedes `0046_auth_gate_allow_pending_verification.sql`).
```

Append a row to the Change Log table:

```markdown
| 0.9 | 2026-05-14 | Added `D-19` (MVP email verification at the auth boundary; supersedes `0046`). |
```

- [ ] **Step 5: Update BACKLOG.md**

Open `docs/SSOT/BACKLOG.md`. Find or add a row in the Auth section:

```markdown
| FR-AUTH-006 / FR-AUTH-007 | MVP email verification gate (migration 0057 + verify route + verify-pending panel) | 🟡 In progress | — |
```

(Format follows the existing table style — match the columns the file already uses.)

When the PR merges, flip 🟡 → ✅ in a follow-up commit (or as part of the merge commit).

- [ ] **Step 6: Add TECH_DEBT.md entry**

Open `docs/SSOT/TECH_DEBT.md`. In the Active BE section (`TD-50..99`), append the next unused number:

```markdown
| TD-7x | Deep-link manifests reference release signing fingerprints | `apple-app-site-association` uses `REPLACE_WITH_APPLE_TEAM_ID`; `assetlinks.json` uses `REPLACE_WITH_ANDROID_RELEASE_SHA256`. Real values must be filled in before the universal link / app link works on a release build; until then native users see the chooser dialog instead of direct app open. |
```

(Replace `TD-7x` with the next number in the Active BE range, looking at the file.)

- [ ] **Step 7: Commit**

```bash
git add docs/SSOT/spec/01_auth_and_onboarding.md \
        docs/SSOT/DECISIONS.md \
        docs/SSOT/BACKLOG.md \
        docs/SSOT/TECH_DEBT.md
git commit -m "docs(ssot): MVP email verification gate — FR-AUTH-006 AC2, FR-AUTH-007 AC6, D-19"
```

---

## Task 17: Full preflight + PR

**Files:** None directly — runs verification.

- [ ] **Step 1: Run the full gate**

```bash
cd /Users/navesarussi/KC/MVP-2/app
pnpm typecheck && pnpm test && pnpm lint
```

Expected: all three green.

- [ ] **Step 2: Manual verification — web**

Start: `pnpm --filter @kc/mobile web`. From the web preview:
1. Sign up with a brand-new email + password — verify the sign-up screen swaps to the pending panel in place.
2. Click "שלח שוב" — verify the countdown starts at 60.
3. Click "פתח אימייל" — verify Gmail (or appropriate webmail) opens in a new tab.
4. Open the verification email (in a real inbox) — verify the URL points at `karma-community-kc.com/auth/verify?token_hash=...`.
5. Click the link — verify the route exchanges the token and lands on home (or onboarding if first sign-up).
6. Sign out, retry sign-in with the same credentials before clicking the link (e.g., on a fresh test user) — verify the verification-pending panel shows.

- [ ] **Step 3: Manual verification — native (release build)**

EAS build with the new `app.json`. Repeat the web smoke from a TestFlight / internal-track APK. Verify:
1. Tapping the link in the mail app opens the app (not the browser).
2. The app lands on home feed (or onboarding).

If universal-link / app-link doesn't kick in: confirm AASA + assetlinks are reachable at the public URL and that Apple/Google validators pass.

- [ ] **Step 4: Push branch + open PR**

```bash
git push -u origin HEAD
gh pr create --base dev --head "$(git branch --show-current)" \
  --title "feat(auth): MVP email verification gate (FR-AUTH-006, FR-AUTH-007)" \
  --body-file .github/.pr-body.md
gh pr merge --auto --squash --delete-branch
gh pr checks --watch
```

PR body should include `Mapped to spec: FR-AUTH-006, FR-AUTH-007` and reference D-19.

- [ ] **Step 5: After merge — flip BACKLOG row**

```bash
git switch dev && git pull --ff-only origin dev
# Edit docs/SSOT/BACKLOG.md: 🟡 → ✅ for the row added in Task 16 Step 5.
git add docs/SSOT/BACKLOG.md
git commit -m "docs(ssot): mark FR-AUTH-006 verification gate done"
git push
```

---

## Self-review

**Spec coverage:**
- AC1 (cannot sign in until verified) — covered by Supabase Auth `Enable email confirmations` (manual config, called out in spec rollout) + Task 12 (sign-in detects `email_not_verified` and renders panel).
- AC2 (sign-up swaps to panel inline; form preserved on "Change email") — Task 11.
- AC3 (resend + 60s cooldown) — Task 10 component logic + Task 4 use case.
- AC4 (open mail provider-aware) — Task 9 helper + Task 10 wires it in.
- AC5 (deep link works on 4 platforms) — Task 13 route + Task 14 native manifests.
- AC6 (Google `active` immediately) — Task 1 migration. (Google INSERT already lands `active` via existing `handle_new_user`; migration documents intent.)
- AC7 (backfill clears legacy stuck rows) — Task 1 migration.
- AC8 (defense in depth: gate denies `pending_verification`) — Task 1 migration `auth_check_account_gate` revert + Task 15 hook cleanup that routes denied sessions back to sign-in.
- AC9 (trigger fires precisely on null→non-null) — Task 1 migration `handle_email_confirmed` body.

**Placeholder scan:** Two intentional placeholders remain in Task 14 (`REPLACE_WITH_APPLE_TEAM_ID`, `REPLACE_WITH_ANDROID_RELEASE_SHA256`). Both are documented as TD-7x in Task 16. Plan calls them out explicitly with instructions on how to obtain real values.

**Type consistency:**
- `emailRedirectTo` is consistently typed as `{ emailRedirectTo?: string }` across `IAuthService`, `SignUpWithEmailUseCase`, `ResendVerificationEmailUseCase`, `SupabaseAuthService`, and the composition root.
- `tokenHash` (camelCase in the use-case input, `token_hash` in the URL params and Supabase API) — the route reads `params.token_hash`, passes as `tokenHash` to `getVerifyEmailUseCase().execute({ tokenHash })`, which the adapter then sends back as `token_hash` to Supabase. Boundary translation is at one place (the adapter); the rest of the app uses `tokenHash`.
- `VerificationPendingPanel` props (`email`, `onChangeEmail`) match the consumer call sites in Tasks 11 and 12.
- `AUTH_VERIFY_URL` export from `authComposition.ts` is the single source for both `SignUpWithEmailUseCase` invocation (Task 11) and `ResendVerificationEmailUseCase` invocation (Task 10).

---

## Execution handoff

Plan complete and saved to `docs/superpowers/plans/2026-05-14-mvp-email-verification-gate.md`. Two execution options:

**1. Subagent-Driven (recommended)** — Dispatch a fresh subagent per task with two-stage review (implementer → reviewer). Fast iteration, contained context per task.

**2. Inline Execution** — Execute tasks in this session using `superpowers:executing-plans`. Batched with checkpoints for review between groups.

Which approach?
