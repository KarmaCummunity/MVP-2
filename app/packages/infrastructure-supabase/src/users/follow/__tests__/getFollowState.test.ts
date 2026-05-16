import { describe, it, expect } from 'vitest';
import type { SupabaseClient } from '@supabase/supabase-js';
import { fetchFollowStateRaw } from '../getFollowState';

/* eslint-disable @typescript-eslint/no-explicit-any */

// Each call to client.from() opens a new chain; we collect the chain
// ops per call (in invocation order) plus return canned data for that
// chain's terminating maybeSingle().

interface ChainLog {
  table: string;
  ops: string[];
}

function makeFakeClient(opts: {
  // Returns by invocation index: [target, edge, pending, cooldown]
  data?: Array<unknown>;
}): { client: SupabaseClient<any>; logs: ChainLog[] } {
  const logs: ChainLog[] = [];
  const data = opts.data ?? [null, null, null, null];

  function makeChain(table: string): any {
    const log: ChainLog = { table, ops: [] };
    logs.push(log);
    const myIndex = logs.length - 1;
    const chain: any = new Proxy(
      {},
      {
        get(_t, prop: string) {
          if (prop === 'then') return undefined; // not a thenable
          return (..._args: any[]) => {
            log.ops.push(prop);
            if (prop === 'maybeSingle') {
              return Promise.resolve({ data: data[myIndex] ?? null, error: null });
            }
            return chain;
          };
        },
      },
    );
    return chain;
  }

  const client = {
    from: (table: string) => makeChain(table),
  } as unknown as SupabaseClient<any>;
  return { client, logs };
}

describe('fetchFollowStateRaw — query shapes', () => {
  it('issues four parallel queries against the right tables in declaration order', async () => {
    const { client, logs } = await runWith({});

    expect(logs.map((l) => l.table)).toEqual([
      'users',
      'follow_edges',
      'follow_requests',
      'follow_requests',
    ]);
    // Both follow_requests chains terminate in maybeSingle().
    for (const log of logs) {
      expect(log.ops[log.ops.length - 1]).toBe('maybeSingle');
    }
    // Touch client to silence unused warning.
    expect(client).toBeDefined();
  });

  it('cooldown chain adds gt + order + limit before maybeSingle', async () => {
    const { logs } = await runWith({});

    const cooldownLog = logs[3]!;
    expect(cooldownLog.ops).toEqual(['select', 'eq', 'eq', 'eq', 'gt', 'order', 'limit', 'maybeSingle']);
  });
});

describe('fetchFollowStateRaw — target user', () => {
  it('returns null target when the user row is missing (RLS or deleted)', async () => {
    const out = (await runWith({ data: [null, null, null, null] })).result;
    expect(out.target).toBeNull();
  });

  it('maps target row fields verbatim (userId, privacyMode, accountStatus)', async () => {
    const { result } = await runWith({
      data: [
        { user_id: 'u_target', privacy_mode: 'Private', account_status: 'active' },
        null,
        null,
        null,
      ],
    });

    expect(result.target).toEqual({
      userId: 'u_target',
      privacyMode: 'Private',
      accountStatus: 'active',
    });
  });
});

describe('fetchFollowStateRaw — edge / pending derived flags', () => {
  it('followingExists is false when no follow_edges row exists', async () => {
    const { result } = await runWith({ data: [null, null, null, null] });
    expect(result.followingExists).toBe(false);
  });

  it('followingExists is true when a follow_edges row exists', async () => {
    const { result } = await runWith({
      data: [null, { follower_id: 'u_viewer' }, null, null],
    });
    expect(result.followingExists).toBe(true);
  });

  it('pendingRequestExists is false when no pending follow_requests row exists', async () => {
    const { result } = await runWith({ data: [null, null, null, null] });
    expect(result.pendingRequestExists).toBe(false);
  });

  it('pendingRequestExists is true when a pending row exists', async () => {
    const { result } = await runWith({
      data: [null, null, { requester_id: 'u_viewer' }, null],
    });
    expect(result.pendingRequestExists).toBe(true);
  });
});

describe('fetchFollowStateRaw — cooldown extraction', () => {
  it('cooldownUntil is null when no future-rejected row exists', async () => {
    const { result } = await runWith({ data: [null, null, null, null] });
    expect(result.cooldownUntil).toBeNull();
  });

  it('cooldownUntil is the cooldown_until column when a row is returned', async () => {
    const { result } = await runWith({
      data: [null, null, null, { cooldown_until: '2026-06-01T12:00:00.000Z' }],
    });
    expect(result.cooldownUntil).toBe('2026-06-01T12:00:00.000Z');
  });

  it('cooldownUntil coalesces a null column to null', async () => {
    // Defensive — a row with NULL cooldown_until should not crash the read.
    const { result } = await runWith({
      data: [null, null, null, { cooldown_until: null }],
    });
    expect(result.cooldownUntil).toBeNull();
  });
});

async function runWith(opts: Parameters<typeof makeFakeClient>[0]) {
  const { client, logs } = makeFakeClient(opts);
  const result = await fetchFollowStateRaw(client, 'u_viewer', 'u_target');
  return { client, logs, result };
}
