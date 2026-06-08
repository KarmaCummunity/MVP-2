import { describe, it, expect, vi } from 'vitest';
import { SupabaseUserRealtime } from '../SupabaseUserRealtime';
import type { UserRow } from '../mapUserRow';

function makeRow(overrides: Partial<UserRow> = {}): UserRow {
  return {
    user_id: 'u1', auth_provider: 'email', share_handle: 'h', display_name: 'D',
    city: 'c', city_name: 'City', biography: null, avatar_url: null,
    privacy_mode: 'Public', privacy_changed_at: null, account_status: 'active',
    onboarding_state: 'completed', notification_preferences: {}, is_super_admin: false,
    closure_explainer_dismissed: false, first_post_nudge_dismissed: false,
    items_given_count: 0, items_received_count: 0, active_posts_count_internal: 0,
    followers_count: 0, following_count: 0, karma_points: 7,
    created_at: 't', updated_at: 't', ...overrides,
  };
}

function fakeClient() {
  let changeHandler: ((payload: { new: UserRow }) => void) | undefined;
  let statusCb: ((status: string) => void) | undefined;
  const channel = {
    on: vi.fn((_evt: string, _cfg: unknown, cb: (p: { new: UserRow }) => void) => {
      changeHandler = cb;
      return channel;
    }),
    subscribe: vi.fn((cb?: (status: string) => void) => {
      statusCb = cb;
      return channel;
    }),
  };
  const client = { channel: vi.fn(() => channel), removeChannel: vi.fn() };
  return {
    client,
    channel,
    fire: (row: UserRow) => changeHandler?.({ new: row }),
    fireStatus: (s: string) => statusCb?.(s),
  };
}

describe('SupabaseUserRealtime (FR-KARMA-009)', () => {
  it('subscribes to the own users row by user_id and maps karma_points through', () => {
    const { client, channel, fire } = fakeClient();
    const rt = new SupabaseUserRealtime(client as never);
    const onChange = vi.fn();
    const unsub = rt.subscribeToSelf('u1', onChange);

    expect(client.channel).toHaveBeenCalledTimes(1);
    const cfg = channel.on.mock.calls[0]![1] as { table: string; filter: string; event: string };
    expect(cfg.table).toBe('users');
    expect(cfg.event).toBe('UPDATE');
    expect(cfg.filter).toBe('user_id=eq.u1');

    fire(makeRow({ karma_points: 42 }));
    expect(onChange).toHaveBeenCalledWith(expect.objectContaining({ userId: 'u1', karmaPoints: 42 }));

    unsub();
    expect(client.removeChannel).toHaveBeenCalledWith(channel);
  });

  it('reports CHANNEL_ERROR / TIMED_OUT through onError', () => {
    const { client, fireStatus } = fakeClient();
    const rt = new SupabaseUserRealtime(client as never);
    const onError = vi.fn();
    rt.subscribeToSelf('u1', vi.fn(), onError);

    fireStatus('CHANNEL_ERROR');
    expect(onError).toHaveBeenCalledTimes(1);
    fireStatus('SUBSCRIBED');
    expect(onError).toHaveBeenCalledTimes(1); // healthy status does not fire onError
  });
});
