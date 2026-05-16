import { describe, it, expect } from 'vitest';
import type { SupabaseClient } from '@supabase/supabase-js';
import { DeleteAccountError } from '@kc/application';
import { SupabaseUserRepository } from '../SupabaseUserRepository';

/* eslint-disable @typescript-eslint/no-explicit-any */

// Covers deleteAccountViaEdgeFunction — the only method on the repository
// with rich HTTP-status branching (network / 401 / 403 / 500 with body
// inspection / generic server_error / success / response-shape errors).

interface FakeOpts {
  invokeData?: any;
  invokeError?: { message: string; context?: any } | null;
}

function makeFakeClient(opts: FakeOpts = {}): SupabaseClient<any> {
  return {
    functions: {
      invoke: async () => ({
        data: opts.invokeData ?? null,
        error: opts.invokeError ?? null,
      }),
    },
  } as unknown as SupabaseClient<any>;
}

// Mimics the FunctionsHttpError.context Response: status + .clone().json().
function makeFakeResponse(status: number, body: unknown): Response {
  return {
    status,
    clone() {
      return {
        json: async () => body,
      } as unknown as Response;
    },
  } as unknown as Response;
}

describe('SupabaseUserRepository.deleteAccountViaEdgeFunction — success', () => {
  it('resolves when the Edge Function returns ok=true', async () => {
    const client = makeFakeClient({
      invokeData: { ok: true, counts: { posts: 3, chats_anonymized: 2, chats_dropped: 1 } },
    });
    expect(await new SupabaseUserRepository(client).deleteAccountViaEdgeFunction()).toBeUndefined();
  });
});

describe('SupabaseUserRepository.deleteAccountViaEdgeFunction — error-path matrix', () => {
  it('FunctionsFetchError (no context/status) → DeleteAccountError("network")', async () => {
    // Network failure: invoke returns an error with no context property →
    // status is undefined → "network" branch.
    const client = makeFakeClient({
      invokeError: { message: 'fetch failed' },
    });
    await expect(
      new SupabaseUserRepository(client).deleteAccountViaEdgeFunction(),
    ).rejects.toMatchObject({ name: 'DeleteAccountError', code: 'network' });
  });

  it('status 401 → DeleteAccountError("unauthenticated")', async () => {
    const client = makeFakeClient({
      invokeError: { message: 'unauthorized', context: makeFakeResponse(401, {}) },
    });
    await expect(
      new SupabaseUserRepository(client).deleteAccountViaEdgeFunction(),
    ).rejects.toMatchObject({ code: 'unauthenticated' });
  });

  it('status 403 → DeleteAccountError("suspended")', async () => {
    const client = makeFakeClient({
      invokeError: { message: 'forbidden', context: makeFakeResponse(403, {}) },
    });
    await expect(
      new SupabaseUserRepository(client).deleteAccountViaEdgeFunction(),
    ).rejects.toMatchObject({ code: 'suspended' });
  });

  it('status 500 + body.error === "auth_delete_failed" → DeleteAccountError("auth_delete_failed") (critical zombie state)', async () => {
    // The Edge Function cleaned the DB but failed to delete the auth user.
    // This is the worst-case "zombie account" state; the source code
    // reads it from the body so we can surface it precisely.
    const client = makeFakeClient({
      invokeError: {
        message: 'internal',
        context: makeFakeResponse(500, { error: 'auth_delete_failed' }),
      },
    });
    await expect(
      new SupabaseUserRepository(client).deleteAccountViaEdgeFunction(),
    ).rejects.toMatchObject({ code: 'auth_delete_failed' });
  });

  it('status 500 with unrecognised body → DeleteAccountError("server_error")', async () => {
    const client = makeFakeClient({
      invokeError: {
        message: 'internal',
        context: makeFakeResponse(500, { error: 'something_else' }),
      },
    });
    await expect(
      new SupabaseUserRepository(client).deleteAccountViaEdgeFunction(),
    ).rejects.toMatchObject({ code: 'server_error' });
  });

  it('status 500 with un-parseable body → DeleteAccountError("server_error") (defensive)', async () => {
    // Simulate a Response whose .clone().json() throws (truncated body, etc.).
    const ctx = {
      status: 500,
      clone() {
        return { json: async () => { throw new Error('unparseable'); } } as unknown as Response;
      },
    } as unknown as Response;
    const client = makeFakeClient({ invokeError: { message: 'internal', context: ctx } });
    await expect(
      new SupabaseUserRepository(client).deleteAccountViaEdgeFunction(),
    ).rejects.toMatchObject({ code: 'server_error' });
  });

  it('any other HTTP status (e.g. 502) → DeleteAccountError("server_error")', async () => {
    const client = makeFakeClient({
      invokeError: { message: 'bad gateway', context: makeFakeResponse(502, {}) },
    });
    await expect(
      new SupabaseUserRepository(client).deleteAccountViaEdgeFunction(),
    ).rejects.toMatchObject({ code: 'server_error' });
  });
});

describe('SupabaseUserRepository.deleteAccountViaEdgeFunction — response-data shape errors', () => {
  it('data.error === "auth_delete_failed" with no transport error → DeleteAccountError("auth_delete_failed")', async () => {
    // Edge Function returned 200 with a body that signals the zombie state
    // (Supabase doesn't surface this as a transport error since the function
    // chose to respond with 200 + a typed body field).
    const client = makeFakeClient({ invokeData: { ok: false, error: 'auth_delete_failed' } });
    await expect(
      new SupabaseUserRepository(client).deleteAccountViaEdgeFunction(),
    ).rejects.toMatchObject({ code: 'auth_delete_failed' });
  });

  it('data has neither ok=true nor known error → DeleteAccountError("server_error")', async () => {
    const client = makeFakeClient({ invokeData: { ok: false, error: 'weird_state' } });
    await expect(
      new SupabaseUserRepository(client).deleteAccountViaEdgeFunction(),
    ).rejects.toMatchObject({ code: 'server_error' });
  });

  it('data is null with no transport error → DeleteAccountError("server_error")', async () => {
    const client = makeFakeClient({ invokeData: null });
    await expect(
      new SupabaseUserRepository(client).deleteAccountViaEdgeFunction(),
    ).rejects.toBeInstanceOf(DeleteAccountError);
  });
});
