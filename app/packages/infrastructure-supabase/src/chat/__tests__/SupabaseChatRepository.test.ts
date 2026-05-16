import { describe, it, expect } from 'vitest';
import type { SupabaseClient } from '@supabase/supabase-js';
import { ChatError } from '@kc/application';
import { SupabaseChatRepository } from '../SupabaseChatRepository';

/* eslint-disable @typescript-eslint/no-explicit-any */

// Companion file SupabaseChatRepository.support.test.ts covers the
// support-thread RPCs + getCounterpart (data-shape variants).

interface FakeOpts {
  selectData?: any;
  selectError?: { message: string } | null;
  insertData?: any;
  insertError?: { message: string } | null;
  rpcData?: unknown;
  rpcError?: { message: string } | null;
  count?: number | null;
  countError?: { message: string } | null;
  capturedLts?: string[];
}

function makeFakeClient(opts: FakeOpts = {}): { client: SupabaseClient<any>; rpcs: { fn: string; args: unknown }[] } {
  const rpcs: { fn: string; args: unknown }[] = [];
  const ltCaptor: string[] = opts.capturedLts ?? [];
  const selectResult = () => ({ data: opts.selectData ?? null, error: opts.selectError ?? null });
  const limitThenable: any = {
    lt: (_col: string, val: string) => {
      ltCaptor.push(val);
      return Promise.resolve(selectResult());
    },
    then: (onF: any, onR: any) => Promise.resolve(selectResult()).then(onF, onR),
  };
  const client = {
    from: () => ({
      select: (_cols: string, options?: { count?: string; head?: boolean }) => {
        if (options?.head) {
          return {
            eq: () => ({
              eq: () => ({
                limit: async () => ({ count: opts.count ?? null, error: opts.countError ?? null }),
              }),
            }),
          };
        }
        return {
          eq: () => ({
            maybeSingle: async () => selectResult(),
            order: () => ({ limit: () => limitThenable }),
          }),
        };
      },
      insert: () => ({
        select: () => ({
          single: async () => ({ data: opts.insertData ?? null, error: opts.insertError ?? null }),
        }),
      }),
    }),
    rpc: async (fn: string, args: unknown) => {
      rpcs.push({ fn, args });
      return { data: opts.rpcData ?? null, error: opts.rpcError ?? null };
    },
  } as unknown as SupabaseClient<any>;
  return { client, rpcs };
}

const CHAT_ROW = {
  chat_id: 'c_1', participant_a: 'u_a', participant_b: 'u_b',
  anchor_post_id: null, is_support_thread: false,
  last_message_at: '2026-05-16T12:00:00.000Z', created_at: '2026-05-16T11:00:00.000Z',
};
const MSG_ROW = {
  message_id: 'm_1', chat_id: 'c_1', sender_id: 'u_1', kind: 'user', body: 'hi',
  system_payload: null, status: 'pending',
  created_at: '2026-05-16T12:00:00.000Z', delivered_at: null, read_at: null,
};

describe('SupabaseChatRepository — simple direct methods', () => {
  it('findById returns the mapped chat or null when missing', async () => {
    const { client } = makeFakeClient({ selectData: CHAT_ROW });
    expect((await new SupabaseChatRepository(client).findById('c_1'))?.chatId).toBe('c_1');

    const { client: c2 } = makeFakeClient({ selectData: null });
    expect(await new SupabaseChatRepository(c2).findById('c_1')).toBeNull();
  });

  it('findById error mapped via mapChatError', async () => {
    const { client } = makeFakeClient({ selectError: { message: 'transport' } });
    await expect(new SupabaseChatRepository(client).findById('c_1')).rejects.toBeInstanceOf(ChatError);
  });

  it('getMessages returns mapped rows; no-cursor branch does not call lt()', async () => {
    const captured: string[] = [];
    const { client } = makeFakeClient({ selectData: [MSG_ROW], capturedLts: captured });
    const out = await new SupabaseChatRepository(client).getMessages('c_1', 50);
    expect(out[0]?.messageId).toBe('m_1');
    expect(captured).toEqual([]);
  });

  it('getMessages cursor branch passes beforeCreatedAt to lt()', async () => {
    const captured: string[] = [];
    const { client } = makeFakeClient({ selectData: [], capturedLts: captured });
    await new SupabaseChatRepository(client).getMessages('c_1', 50, '2026-05-16T10:00:00.000Z');
    expect(captured).toEqual(['2026-05-16T10:00:00.000Z']);
  });

  it('sendMessage inserts kind=user / status=pending and returns the mapped row', async () => {
    const { client } = makeFakeClient({ insertData: MSG_ROW });
    const out = await new SupabaseChatRepository(client).sendMessage('c_1', 'u_1', 'hi');
    expect(out.messageId).toBe('m_1');
  });

  it('sendMessage error mapped via mapChatError', async () => {
    const { client } = makeFakeClient({ insertError: { message: 'transport' } });
    await expect(new SupabaseChatRepository(client).sendMessage('c_1', 'u_1', 'hi')).rejects.toBeInstanceOf(ChatError);
  });
});

describe('SupabaseChatRepository — RPC methods', () => {
  it('markRead calls rpc_chat_mark_read with p_chat_id', async () => {
    const { client, rpcs } = makeFakeClient({});
    await new SupabaseChatRepository(client).markRead('c_1', 'u_me');
    expect(rpcs).toEqual([{ fn: 'rpc_chat_mark_read', args: { p_chat_id: 'c_1' } }]);
  });

  it('markRead error mapped via mapChatError', async () => {
    const { client } = makeFakeClient({ rpcError: { message: 'rpc error' } });
    await expect(new SupabaseChatRepository(client).markRead('c_1', 'u_me')).rejects.toBeInstanceOf(ChatError);
  });

  it('getUnreadTotal calls rpc_chat_unread_total and Number()-coerces the result', async () => {
    const { client } = makeFakeClient({ rpcData: '7' });
    expect(await new SupabaseChatRepository(client).getUnreadTotal('u_me')).toBe(7);
  });

  it('getUnreadTotal returns 0 when the RPC returns null', async () => {
    const { client } = makeFakeClient({ rpcData: null });
    expect(await new SupabaseChatRepository(client).getUnreadTotal('u_me')).toBe(0);
  });
});

describe('SupabaseChatRepository — hasSentAnyMessage', () => {
  it('returns true when count > 0', async () => {
    const { client } = makeFakeClient({ count: 1 });
    expect(await new SupabaseChatRepository(client).hasSentAnyMessage('u_me')).toBe(true);
  });

  it('returns false when count is 0 or null', async () => {
    expect(await new SupabaseChatRepository(makeFakeClient({ count: 0 }).client).hasSentAnyMessage('u_me')).toBe(false);
    expect(await new SupabaseChatRepository(makeFakeClient({ count: null }).client).hasSentAnyMessage('u_me')).toBe(false);
  });

  it('throws via mapChatError on count error', async () => {
    const { client } = makeFakeClient({ countError: { message: 'transport' } });
    await expect(new SupabaseChatRepository(client).hasSentAnyMessage('u_me')).rejects.toBeInstanceOf(ChatError);
  });
});
