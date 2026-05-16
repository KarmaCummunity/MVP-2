import { describe, it, expect } from 'vitest';
import type { SupabaseClient } from '@supabase/supabase-js';
import { getClosureCandidates } from '../closureMethods';

/* eslint-disable @typescript-eslint/no-explicit-any */

// Companion to closureMethods.test.ts — covers getClosureCandidates
// (owner read → chats list → user resolve → dedupe-by-partner + sort).

interface FakeOpts {
  ownerRow?: { owner_id: string } | null;
  ownerError?: { message: string } | null;
  chats?: Array<{
    chat_id: string;
    participant_a: string;
    participant_b: string | null;
    last_message_at: string | null;
    is_support_thread?: boolean;
    removed_at?: string | null;
  }>;
  chatsError?: { message: string } | null;
  users?: Array<{
    user_id: string;
    display_name: string | null;
    avatar_url: string | null;
    city_name: string | null;
  }>;
  usersError?: { message: string } | null;
}

function makeFakeClient(opts: FakeOpts): { client: SupabaseClient<any> } {
  const client = {
    from: (table: string) => {
      if (table === 'posts') return { select: () => ({ eq: () => ({ single: async () => ({ data: opts.ownerRow ?? null, error: opts.ownerError ?? null }) }) }) };
      if (table === 'chats') {
        const result = () => Promise.resolve({ data: opts.chats ?? [], error: opts.chatsError ?? null });
        const isThenable: any = { then: (f: any, r: any) => result().then(f, r) };
        return { select: () => ({ or: () => ({ eq: () => ({ is: () => isThenable }) }) }) };
      }
      if (table === 'users') return { select: () => ({ in: async () => ({ data: opts.users ?? [], error: opts.usersError ?? null }) }) };
      throw new Error(`fake: unexpected table ${table}`);
    },
  } as unknown as SupabaseClient<any>;
  return { client };
}

describe('getClosureCandidates — owner read', () => {
  it('throws via mapClosurePgError when the owner read errors', async () => {
    const { client } = makeFakeClient({
      ownerError: { message: 'closure_not_owner' },
    });
    await expect(getClosureCandidates(client, 'p_1')).rejects.toMatchObject({
      name: 'PostError',
      code: 'closure_not_owner',
    });
  });
});

describe('getClosureCandidates — chat lookup + partner resolution', () => {
  it('returns [] when the owner has no chats', async () => {
    const { client } = makeFakeClient({
      ownerRow: { owner_id: 'u_owner' },
      chats: [],
    });
    expect(await getClosureCandidates(client, 'p_1')).toEqual([]);
  });

  it('returns [] when chats exist but every row has null last_message_at (filtered)', async () => {
    const { client } = makeFakeClient({
      ownerRow: { owner_id: 'u_owner' },
      chats: [
        { chat_id: 'c_1', participant_a: 'u_owner', participant_b: 'u_partner', last_message_at: null },
      ],
    });
    expect(await getClosureCandidates(client, 'p_1')).toEqual([]);
  });

  it('throws via mapClosurePgError when the chats query errors', async () => {
    const { client } = makeFakeClient({
      ownerRow: { owner_id: 'u_owner' },
      chatsError: { message: 'closure_not_owner' },
    });
    await expect(getClosureCandidates(client, 'p_1')).rejects.toMatchObject({ name: 'PostError' });
  });

  it('maps user_id → ClosureCandidate fields verbatim (with default fallbacks)', async () => {
    const { client } = makeFakeClient({
      ownerRow: { owner_id: 'u_owner' },
      chats: [
        { chat_id: 'c_1', participant_a: 'u_owner', participant_b: 'u_p1', last_message_at: '2026-05-16T12:00:00Z' },
      ],
      users: [
        { user_id: 'u_p1', display_name: 'Alice', avatar_url: 'a.jpg', city_name: 'TLV' },
      ],
    });
    const out = await getClosureCandidates(client, 'p_1');
    expect(out).toEqual([
      {
        userId: 'u_p1',
        fullName: 'Alice',
        avatarUrl: 'a.jpg',
        cityName: 'TLV',
        lastMessageAt: '2026-05-16T12:00:00Z',
      },
    ]);
  });

  it('falls back to empty fullName and null cityName when the user row carries nulls', async () => {
    const { client } = makeFakeClient({
      ownerRow: { owner_id: 'u_owner' },
      chats: [
        { chat_id: 'c_1', participant_a: 'u_owner', participant_b: 'u_p1', last_message_at: '2026-05-16T12:00:00Z' },
      ],
      users: [
        { user_id: 'u_p1', display_name: null, avatar_url: null, city_name: null },
      ],
    });
    const out = await getClosureCandidates(client, 'p_1');
    expect(out[0]?.fullName).toBe('');
    expect(out[0]?.avatarUrl).toBeNull();
    expect(out[0]?.cityName).toBeNull();
  });
});

describe('getClosureCandidates — dedupe + sort', () => {
  it('dedupes by partner userId, keeping the latest last_message_at when two chats share a partner', async () => {
    // Same partner across two chats (different chat_id, different times).
    // Should appear once with the newer timestamp.
    const { client } = makeFakeClient({
      ownerRow: { owner_id: 'u_owner' },
      chats: [
        { chat_id: 'c_old', participant_a: 'u_owner', participant_b: 'u_partner', last_message_at: '2026-05-10T00:00:00Z' },
        { chat_id: 'c_new', participant_a: 'u_owner', participant_b: 'u_partner', last_message_at: '2026-05-16T00:00:00Z' },
      ],
      users: [
        { user_id: 'u_partner', display_name: 'P', avatar_url: null, city_name: null },
      ],
    });
    const out = await getClosureCandidates(client, 'p_1');
    expect(out).toHaveLength(1);
    expect(out[0]?.lastMessageAt).toBe('2026-05-16T00:00:00Z');
  });

  it('sorts candidates by lastMessageAt descending (newest partner first)', async () => {
    const { client } = makeFakeClient({
      ownerRow: { owner_id: 'u_owner' },
      chats: [
        { chat_id: 'c_a', participant_a: 'u_owner', participant_b: 'u_p_oldest', last_message_at: '2026-05-01T00:00:00Z' },
        { chat_id: 'c_b', participant_a: 'u_owner', participant_b: 'u_p_newest', last_message_at: '2026-05-16T00:00:00Z' },
        { chat_id: 'c_c', participant_a: 'u_p_mid',   participant_b: 'u_owner',   last_message_at: '2026-05-10T00:00:00Z' },
      ],
      users: [
        { user_id: 'u_p_oldest', display_name: 'O', avatar_url: null, city_name: null },
        { user_id: 'u_p_newest', display_name: 'N', avatar_url: null, city_name: null },
        { user_id: 'u_p_mid',    display_name: 'M', avatar_url: null, city_name: null },
      ],
    });
    const out = await getClosureCandidates(client, 'p_1');
    expect(out.map((c) => c.userId)).toEqual(['u_p_newest', 'u_p_mid', 'u_p_oldest']);
  });

  it('handles owner appearing as participant_b (the other participant becomes the partner)', async () => {
    const { client } = makeFakeClient({
      ownerRow: { owner_id: 'u_owner' },
      chats: [
        { chat_id: 'c_1', participant_a: 'u_partner', participant_b: 'u_owner', last_message_at: '2026-05-16T00:00:00Z' },
      ],
      users: [
        { user_id: 'u_partner', display_name: 'P', avatar_url: null, city_name: null },
      ],
    });
    const out = await getClosureCandidates(client, 'p_1');
    expect(out[0]?.userId).toBe('u_partner');
  });

  it('skips chats where the counterpart is null (deleted account / SET NULL) and still returns other partners', async () => {
    const { client } = makeFakeClient({
      ownerRow: { owner_id: 'u_owner' },
      chats: [
        {
          chat_id: 'c_ghost',
          participant_a: 'u_owner',
          participant_b: null,
          last_message_at: '2026-05-16T12:00:00Z',
        },
        {
          chat_id: 'c_ok',
          participant_a: 'u_owner',
          participant_b: 'u_p1',
          last_message_at: '2026-05-15T12:00:00Z',
        },
      ],
      users: [{ user_id: 'u_p1', display_name: 'Bob', avatar_url: null, city_name: null }],
    });
    const out = await getClosureCandidates(client, 'p_1');
    expect(out).toHaveLength(1);
    expect(out[0]?.userId).toBe('u_p1');
  });
});
