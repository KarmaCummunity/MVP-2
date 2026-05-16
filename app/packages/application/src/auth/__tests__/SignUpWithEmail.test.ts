import { describe, it, expect } from 'vitest';
import { SignUpWithEmailUseCase } from '../SignUpWithEmail';
import { AuthError } from '../errors';
import { FakeAuthService, makeSession } from './fakeAuthService';

describe('SignUpWithEmailUseCase', () => {
  it('returns session when sign-up returns one (verified or auto-confirmed)', async () => {
    const auth = new FakeAuthService();
    auth.signUpResult = makeSession();
    const uc = new SignUpWithEmailUseCase(auth);

    const out = await uc.execute({ email: 'A@B.CO', password: 'pass1word' });

    expect(out.session?.userId).toBe('u_1');
    expect(out.pendingVerification).toBe(false);
  });

  it('marks pendingVerification when adapter returns null (FR-AUTH-006 AC2)', async () => {
    const auth = new FakeAuthService();
    auth.signUpResult = null;
    const uc = new SignUpWithEmailUseCase(auth);

    const out = await uc.execute({ email: 'a@b.co', password: 'pass1word' });

    expect(out.session).toBeNull();
    expect(out.pendingVerification).toBe(true);
  });

  it('rejects malformed email', async () => {
    const uc = new SignUpWithEmailUseCase(new FakeAuthService());
    await expect(
      uc.execute({ email: 'no-at', password: 'pass1word' }),
    ).rejects.toMatchObject({ code: 'invalid_email' } satisfies Partial<AuthError>);
  });

  // Audit §3.3 — strings the old permissive regex accepted but Supabase would
  // bounce. Confirmation emails to these never deliver, leaving the user
  // stuck in email_confirmation_pending.
  it.each([
    ['single-char TLD', 'a@b.c'],
    ['double-@', 'user@@x.co'],
    ['trailing dot in TLD', 'a@b.co.'],
  ])('rejects %s (audit §3.3)', async (_label, email) => {
    const uc = new SignUpWithEmailUseCase(new FakeAuthService());
    await expect(uc.execute({ email, password: 'pass1word' })).rejects.toMatchObject({
      code: 'invalid_email',
    } satisfies Partial<AuthError>);
  });

  it('rejects password < 8 chars (FR-AUTH-006 AC1)', async () => {
    const uc = new SignUpWithEmailUseCase(new FakeAuthService());
    await expect(
      uc.execute({ email: 'a@b.co', password: 'p1ass' }),
    ).rejects.toMatchObject({ code: 'weak_password' });
  });

  it('rejects password without a letter or without a digit (FR-AUTH-006 AC1)', async () => {
    const uc = new SignUpWithEmailUseCase(new FakeAuthService());
    await expect(
      uc.execute({ email: 'a@b.co', password: '12345678' }),
    ).rejects.toMatchObject({ code: 'weak_password' });
    await expect(
      uc.execute({ email: 'a@b.co', password: 'abcdefgh' }),
    ).rejects.toMatchObject({ code: 'weak_password' });
  });

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
});
