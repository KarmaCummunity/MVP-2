import { describe, it, expect } from 'vitest';
import type { SupabaseClient } from '@supabase/supabase-js';
import { AuthError } from '@kc/application';
import { SupabaseAuthService } from '../SupabaseAuthService';

/* eslint-disable @typescript-eslint/no-explicit-any */

// FR-AUTH-003 / FR-AUTH-007 — covers the id_token path used by the web
// in-app Google Sign-In sheet (`signInWithIdToken` adapter).

interface IdTokenFakeOpts {
  result?: { data: any; error: any };
  capture?: { last: any };
}

function makeAuthClient(opts: IdTokenFakeOpts): SupabaseClient<any> {
  return {
    auth: {
      signInWithIdToken: async (input: any) => {
        if (opts.capture) opts.capture.last = input;
        return opts.result ?? { data: { session: null }, error: null };
      },
    },
  } as unknown as SupabaseClient<any>;
}

function sbSession(over: any = {}): any {
  return {
    access_token: 'access',
    refresh_token: 'refresh',
    expires_at: 1_750_000_000,
    user: {
      id: 'u_g',
      email: 'g@b.test',
      email_confirmed_at: '2026-05-16T12:00:00.000Z',
      user_metadata: { full_name: 'Naveh', avatar_url: 'https://x/a.png' },
    },
    ...over,
  };
}

describe('SupabaseAuthService — signInWithIdToken', () => {
  it('forwards { provider, token, nonce } to supabase.auth.signInWithIdToken', async () => {
    const capture: { last: any } = { last: null };
    const client = makeAuthClient({
      capture,
      result: { data: { session: sbSession() }, error: null },
    });
    await new SupabaseAuthService(client).signInWithIdToken({
      provider: 'google',
      idToken: 'eyJID',
      nonce: 'rawnonce',
    });
    expect(capture.last).toEqual({ provider: 'google', token: 'eyJID', nonce: 'rawnonce' });
  });

  it('returns the mapped session on success (display name + avatar from metadata)', async () => {
    const client = makeAuthClient({
      result: { data: { session: sbSession() }, error: null },
    });
    const out = await new SupabaseAuthService(client).signInWithIdToken({
      provider: 'google',
      idToken: 't',
      nonce: 'n',
    });
    expect(out.userId).toBe('u_g');
    expect(out.displayName).toBe('Naveh');
    expect(out.avatarUrl).toBe('https://x/a.png');
  });

  it('throws AuthError("unknown") when Supabase returns no session', async () => {
    const client = makeAuthClient({ result: { data: { session: null }, error: null } });
    await expect(
      new SupabaseAuthService(client).signInWithIdToken({ provider: 'google', idToken: 't', nonce: 'n' }),
    ).rejects.toMatchObject({ code: 'unknown', message: 'id_token_no_session' });
  });

  it('throws via mapAuthError when Supabase errors', async () => {
    const client = makeAuthClient({ result: { data: null, error: { message: 'bad nonce' } } });
    await expect(
      new SupabaseAuthService(client).signInWithIdToken({ provider: 'google', idToken: 't', nonce: 'n' }),
    ).rejects.toBeInstanceOf(AuthError);
  });
});
