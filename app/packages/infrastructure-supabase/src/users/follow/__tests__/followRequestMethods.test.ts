import { describe, it, expect } from 'vitest';
import type { SupabaseClient } from '@supabase/supabase-js';
import { FollowError } from '@kc/application';
import {
  acceptRequest,
  cancelRequest,
  listPendingRaw,
  listPendingWithUsers,
  rejectRequest,
  sendRequest,
} from '../followRequestMethods';

/* eslint-disable @typescript-eslint/no-explicit-any */

interface FakeOpts {
  data?: unknown;
  error?: { code?: string; message?: string; details?: string } | null;
}
interface Op { kind: string; args?: unknown[] }

function makeFakeClient(opts: FakeOpts = {}): { client: SupabaseClient<any>; ops: Op[] } {
  const ops: Op[] = [];
  // Thenable Proxy chain — same pattern as followMethods.test.ts.
  function makeChain(): any {
    const result = () => ({ data: opts.data ?? null, error: opts.error ?? null });
    return new Proxy({}, {
      get(_t, prop: string) {
        if (prop === 'then') {
          return (onFulfilled: any, onRejected: any) =>
            Promise.resolve(result()).then(onFulfilled, onRejected);
        }
        return (...args: any[]) => {
          ops.push({ kind: prop, args });
          if (prop === 'single' || prop === 'maybeSingle') return Promise.resolve(result());
          return makeChain();
        };
      },
    });
  }
  const client = {
    from: (table: string) => {
      ops.push({ kind: 'from', args: [table] });
      return makeChain();
    },
  } as unknown as SupabaseClient<any>;
  return { client, ops };
}

const FAKE_REQ_ROW = {
  requester_id: 'u_req',
  target_id: 'u_tgt',
  status: 'pending',
  created_at: '2026-05-16T12:00:00.000Z',
  cooldown_until: null,
};
const FAKE_USER_ROW = {
  user_id: 'u_req',
  auth_provider: 'google',
  share_handle: 'r',
  display_name: 'R',
  city: 'IL-001',
  city_name: 'TLV',
  profile_street: null,
  profile_street_number: null,
  biography: null,
  avatar_url: null,
  privacy_mode: 'Public',
  privacy_changed_at: null,
  account_status: 'active',
  onboarding_state: 'completed',
  notification_preferences: {},
  is_super_admin: false,
  closure_explainer_dismissed: false,
  first_post_nudge_dismissed: false,
  items_given_count: 0,
  items_received_count: 0,
  active_posts_count_internal: 0,
  followers_count: 0,
  following_count: 0,
  created_at: '2026-01-01T00:00:00.000Z',
  updated_at: '2026-05-16T00:00:00.000Z',
};

describe('sendRequest', () => {
  it('inserts (requester_id, target_id, status=pending) and maps the returned row → FollowRequest', async () => {
    const { client } = makeFakeClient({ data: FAKE_REQ_ROW });
    expect(await sendRequest(client, 'u_req', 'u_tgt')).toEqual({
      requesterId: 'u_req',
      targetId: 'u_tgt',
      status: 'pending',
      createdAt: '2026-05-16T12:00:00.000Z',
      cooldownUntil: null,
    });
  });

  it('maps insert errors through mapFollowError', async () => {
    const { client } = makeFakeClient({ error: { message: 'self_follow_request_forbidden' } });
    await expect(sendRequest(client, 'u_req', 'u_req')).rejects.toBeInstanceOf(FollowError);
  });
});

describe('cancel/accept/reject — status-flip helpers', () => {
  it.each([
    ['cancelRequest', cancelRequest, 'cancelled'],
    ['acceptRequest', acceptRequest, 'accepted'],
    ['rejectRequest', rejectRequest, 'rejected'],
  ])('%s updates status → %s with three eq() scopes', async (_label, fn, status) => {
    const { client, ops } = makeFakeClient({});
    await fn(client, 'u_req', 'u_tgt');
    expect(ops.find((o) => o.kind === 'update')?.args?.[0]).toEqual({ status });
    expect(ops.filter((o) => o.kind === 'eq')).toHaveLength(3);
  });

  it.each([cancelRequest, acceptRequest, rejectRequest])(
    '%p — maps update errors through mapFollowError',
    async (fn) => {
      const { client } = makeFakeClient({ error: { code: '42501', message: 'rls denied' } });
      await expect(fn(client, 'u_req', 'u_tgt')).rejects.toBeInstanceOf(FollowError);
    },
  );
});

describe('listPendingRaw', () => {
  it('returns mapped FollowRequest rows from the pending query', async () => {
    const { client } = makeFakeClient({
      data: [FAKE_REQ_ROW, { ...FAKE_REQ_ROW, requester_id: 'u_req2' }],
    });
    const out = await listPendingRaw(client, 'u_tgt');
    expect(out.map((r) => r.requesterId)).toEqual(['u_req', 'u_req2']);
  });

  it('returns [] when data is null', async () => {
    const { client } = makeFakeClient({ data: null });
    expect(await listPendingRaw(client, 'u_tgt')).toEqual([]);
  });

  it('throws via mapFollowError on query error', async () => {
    const { client } = makeFakeClient({ error: { message: 'transport' } });
    await expect(listPendingRaw(client, 'u_tgt')).rejects.toBeInstanceOf(FollowError);
  });
});

describe('listPendingWithUsers — pagination + null-filter + cursor', () => {
  it('maps joined { requester } rows to FollowRequestWithUser and filters out null requesters', async () => {
    const { client } = makeFakeClient({
      data: [
        { ...FAKE_REQ_ROW, requester: FAKE_USER_ROW },
        { ...FAKE_REQ_ROW, requester_id: 'u_orphan', requester: null },
        { ...FAKE_REQ_ROW, requester_id: 'u_req2', requester: { ...FAKE_USER_ROW, user_id: 'u_req2' } },
      ],
    });
    const out = await listPendingWithUsers(client, 'u_tgt', 50);
    expect(out.requests).toHaveLength(2);
    expect(out.requests[0]?.requester.userId).toBe('u_req');
  });

  it('mints nextCursor only when the result fills the limit (full page heuristic)', async () => {
    // limit=2 with 2 rows → cursor set to last created_at.
    const { client } = makeFakeClient({
      data: [
        { ...FAKE_REQ_ROW, created_at: '2026-05-16T12:00:00.000Z', requester: FAKE_USER_ROW },
        { ...FAKE_REQ_ROW, created_at: '2026-05-16T11:00:00.000Z', requester: FAKE_USER_ROW },
      ],
    });
    const out = await listPendingWithUsers(client, 'u_tgt', 2);
    expect(out.nextCursor).toBe('2026-05-16T11:00:00.000Z');
  });

  it('returns null nextCursor when the page is not full', async () => {
    const { client } = makeFakeClient({ data: [{ ...FAKE_REQ_ROW, requester: FAKE_USER_ROW }] });
    const out = await listPendingWithUsers(client, 'u_tgt', 50);
    expect(out.nextCursor).toBeNull();
  });

  it('takes the cursor branch (calls lt) when a cursor is provided', async () => {
    const { client, ops } = makeFakeClient({ data: [] });
    await listPendingWithUsers(client, 'u_tgt', 25, '2026-05-16T12:00:00.000Z');
    expect(ops.find((o) => o.kind === 'lt')).toBeTruthy();
  });

  it('does NOT call lt when cursor is undefined', async () => {
    const { client, ops } = makeFakeClient({ data: [] });
    await listPendingWithUsers(client, 'u_tgt', 25);
    expect(ops.find((o) => o.kind === 'lt')).toBeFalsy();
  });

  it('throws via mapFollowError on query error', async () => {
    const { client } = makeFakeClient({ error: { message: 'transport' } });
    await expect(listPendingWithUsers(client, 'u_tgt', 50)).rejects.toBeInstanceOf(FollowError);
  });
});
