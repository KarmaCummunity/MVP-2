import { describe, it, expect, vi } from 'vitest';
import type { SupabaseClient } from '@supabase/supabase-js';
import { AuthError } from '@kc/application';
import { SupabaseAuthService } from '../SupabaseAuthService';

/* eslint-disable @typescript-eslint/no-explicit-any */

// Companion to SupabaseAuthService.test.ts — covers OAuth, code-exchange
// (with de-dupe), email-verification, resend, and the session-change
// subscription. Split so each file stays under the 200-LOC arch cap.

interface AuthFakeOpts {
  oauthResult?: { data: any; error: any };
  exchangeResult?: { data: any; error: any } | (() => Promise<{ data: any; error: any }>);
  resendError?: any;
  verifyResult?: { data: any; error: any };
  onStateChangeListener?: (
    cb: (event: string, session: any) => void,
  ) => { data: { subscription: { unsubscribe: () => void } } };
}

function makeAuthClient(opts: AuthFakeOpts): SupabaseClient<any> {
  return {
    auth: {
      signInWithOAuth: async () => opts.oauthResult ?? { data: { url: null }, error: null },
      exchangeCodeForSession: async () =>
        typeof opts.exchangeResult === 'function'
          ? await opts.exchangeResult()
          : opts.exchangeResult ?? { data: { session: null }, error: null },
      resend: async () => ({ error: opts.resendError ?? null }),
      verifyOtp: async () => opts.verifyResult ?? { data: { session: null }, error: null },
      onAuthStateChange: (cb: (event: string, session: any) => void) =>
        opts.onStateChangeListener
          ? opts.onStateChangeListener(cb)
          : { data: { subscription: { unsubscribe: () => {} } } },
    },
  } as unknown as SupabaseClient<any>;
}

function sbSession(over: any = {}): any {
  return {
    access_token: 'access',
    refresh_token: 'refresh',
    expires_at: 1_750_000_000,
    user: { id: 'u_1', email: 'a@b.test', email_confirmed_at: '2026-05-16T12:00:00.000Z', user_metadata: {} },
    ...over,
  };
}

describe('SupabaseAuthService — getGoogleAuthUrl', () => {
  it('returns the URL returned by signInWithOAuth', async () => {
    const client = makeAuthClient({ oauthResult: { data: { url: 'https://oauth.test/x' }, error: null } });
    expect(await new SupabaseAuthService(client).getGoogleAuthUrl('app://cb')).toBe('https://oauth.test/x');
  });

  it('throws AuthError("unknown") when signInWithOAuth returns no URL', async () => {
    const client = makeAuthClient({ oauthResult: { data: { url: null }, error: null } });
    await expect(new SupabaseAuthService(client).getGoogleAuthUrl('app://cb')).rejects.toMatchObject({
      name: 'AuthError', code: 'unknown',
    });
  });

  it('throws via mapAuthError when signInWithOAuth errors', async () => {
    const client = makeAuthClient({ oauthResult: { data: null, error: { message: 'transport' } } });
    await expect(new SupabaseAuthService(client).getGoogleAuthUrl('app://cb')).rejects.toBeInstanceOf(AuthError);
  });
});

describe('SupabaseAuthService — exchangeCodeForSession', () => {
  it('returns the mapped session on success', async () => {
    const client = makeAuthClient({ exchangeResult: { data: { session: sbSession() }, error: null } });
    const out = await new SupabaseAuthService(client).exchangeCodeForSession('code_xyz');
    expect(out.userId).toBe('u_1');
  });

  it('throws AuthError("unknown") when exchange succeeds with no session', async () => {
    const client = makeAuthClient({ exchangeResult: { data: { session: null }, error: null } });
    await expect(
      new SupabaseAuthService(client).exchangeCodeForSession('code_xyz'),
    ).rejects.toMatchObject({ code: 'unknown' });
  });

  it('de-dupes concurrent calls with the same code (single Supabase call)', async () => {
    // Models cold-start race in deep-link handler — both inflight calls
    // must resolve to the SAME promise / Supabase call, not double-exchange.
    let supabaseCalls = 0;
    const client = makeAuthClient({
      exchangeResult: async () => {
        supabaseCalls++;
        return { data: { session: sbSession() }, error: null };
      },
    });
    const service = new SupabaseAuthService(client);
    const [a, b] = await Promise.all([
      service.exchangeCodeForSession('code_xyz'),
      service.exchangeCodeForSession('code_xyz'),
    ]);
    expect(supabaseCalls).toBe(1);
    expect(a).toBe(b);
  });

  it('allows a fresh call for a different code (no false-share)', async () => {
    let supabaseCalls = 0;
    const client = makeAuthClient({
      exchangeResult: async () => {
        supabaseCalls++;
        return { data: { session: sbSession() }, error: null };
      },
    });
    const service = new SupabaseAuthService(client);
    await service.exchangeCodeForSession('code_a');
    await service.exchangeCodeForSession('code_b');
    expect(supabaseCalls).toBe(2);
  });

  it('clears the inflight slot on error so a retry can proceed', async () => {
    let supabaseCalls = 0;
    const client = makeAuthClient({
      exchangeResult: async () => {
        supabaseCalls++;
        if (supabaseCalls === 1) return { data: null, error: { message: 'transport' } };
        return { data: { session: sbSession() }, error: null };
      },
    });
    const service = new SupabaseAuthService(client);
    await expect(service.exchangeCodeForSession('code_xyz')).rejects.toBeInstanceOf(AuthError);
    const out = await service.exchangeCodeForSession('code_xyz');
    expect(out.userId).toBe('u_1');
  });
});

describe('SupabaseAuthService — resendVerificationEmail / verifyEmail', () => {
  it('resendVerificationEmail resolves on success', async () => {
    expect(await new SupabaseAuthService(makeAuthClient({})).resendVerificationEmail('a@b.test')).toBeUndefined();
  });

  it('resendVerificationEmail throws via mapAuthError', async () => {
    const client = makeAuthClient({ resendError: { message: 'transport' } });
    await expect(
      new SupabaseAuthService(client).resendVerificationEmail('a@b.test'),
    ).rejects.toBeInstanceOf(AuthError);
  });

  it('verifyEmail returns the mapped session on success', async () => {
    const client = makeAuthClient({ verifyResult: { data: { session: sbSession() }, error: null } });
    const out = await new SupabaseAuthService(client).verifyEmail('token_hash_xyz');
    expect(out.userId).toBe('u_1');
  });

  it('verifyEmail throws AuthError("unknown") when verifyOtp succeeds without a session', async () => {
    const client = makeAuthClient({ verifyResult: { data: { session: null }, error: null } });
    await expect(new SupabaseAuthService(client).verifyEmail('token_hash_xyz')).rejects.toMatchObject({
      code: 'unknown',
    });
  });

  it('verifyEmail throws via mapAuthError on token failure', async () => {
    const client = makeAuthClient({
      verifyResult: { data: null, error: { message: 'invalid_token' } },
    });
    await expect(new SupabaseAuthService(client).verifyEmail('bad')).rejects.toBeInstanceOf(AuthError);
  });
});

describe('SupabaseAuthService — onSessionChange', () => {
  it('forwards mapped sessions and returns an unsubscribe function', () => {
    let listenerRef: ((event: string, session: any) => void) | null = null;
    const unsub = vi.fn();
    const client = makeAuthClient({
      onStateChangeListener: (cb) => {
        listenerRef = cb;
        return { data: { subscription: { unsubscribe: unsub } } };
      },
    });
    const calls: any[] = [];
    const stop = new SupabaseAuthService(client).onSessionChange((s) => calls.push(s));

    listenerRef!('SIGNED_IN', sbSession());
    listenerRef!('SIGNED_OUT', null);

    expect(calls).toHaveLength(2);
    expect(calls[0]?.userId).toBe('u_1');
    expect(calls[1]).toBeNull();

    stop();
    expect(unsub).toHaveBeenCalledTimes(1);
  });
});
