import { describe, it, expect } from 'vitest';
import type { SupabaseClient } from '@supabase/supabase-js';
import { AuthError } from '@kc/application';
import { SupabaseAuthService } from '../SupabaseAuthService';

/* eslint-disable @typescript-eslint/no-explicit-any */

// FR-AUTH-004: native Sign in with Apple exchanges the identity token via
// supabase.auth.signInWithIdToken({ provider: 'apple' }). Split into its own
// file to stay under the arch LOC cap.

function makeAppleClient(
  idTokenResult: { data: any; error: any },
  capture?: (args: any) => void,
): SupabaseClient<any> {
  return {
    auth: {
      signInWithIdToken: async (args: any) => {
        capture?.(args);
        return idTokenResult;
      },
    },
  } as unknown as SupabaseClient<any>;
}

function sbSession(over: any = {}): any {
  return {
    access_token: 'access',
    refresh_token: 'refresh',
    expires_at: 1_750_000_000,
    user: { id: 'u_1', email: 'relay@privaterelay.appleid.com', email_confirmed_at: '2026-06-01T00:00:00.000Z', user_metadata: {} },
    ...over,
  };
}

describe('SupabaseAuthService — signInWithApple', () => {
  it('exchanges the Apple identity token + raw nonce for a mapped session', async () => {
    let captured: any;
    const client = makeAppleClient({ data: { session: sbSession() }, error: null }, (a) => (captured = a));

    const out = await new SupabaseAuthService(client).signInWithApple({
      identityToken: 'idtok',
      rawNonce: 'nonce123',
    });

    expect(out.userId).toBe('u_1');
    expect(captured).toEqual({ provider: 'apple', token: 'idtok', nonce: 'nonce123' });
  });

  it('throws AuthError("unknown") when no session is returned', async () => {
    const client = makeAppleClient({ data: { session: null }, error: null });
    await expect(
      new SupabaseAuthService(client).signInWithApple({ identityToken: 't', rawNonce: 'n' }),
    ).rejects.toMatchObject({ code: 'unknown' });
  });

  it('throws via mapAuthError when Supabase rejects the token', async () => {
    const client = makeAppleClient({ data: null, error: { message: 'invalid_token' } });
    await expect(
      new SupabaseAuthService(client).signInWithApple({ identityToken: 't', rawNonce: 'n' }),
    ).rejects.toBeInstanceOf(AuthError);
  });
});
