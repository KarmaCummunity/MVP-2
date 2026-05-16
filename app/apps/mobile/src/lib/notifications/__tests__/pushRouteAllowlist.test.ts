import { describe, it, expect } from 'vitest';
import { resolvePushRoute } from '../pushRouteAllowlist';

const UUID = '11111111-1111-4111-8111-111111111111';

describe('resolvePushRoute', () => {
  it('routes chat_message to /chat/[id] when chat_id is a UUID', () => {
    expect(
      resolvePushRoute({
        category: 'social',
        kind: 'chat_message',
        notification_id: 'n1',
        chat_id: UUID,
      }),
    ).toEqual({ pathname: '/chat/[id]', params: { id: UUID } });
  });

  it('routes follow_request to /settings/follow-requests', () => {
    expect(
      resolvePushRoute({
        category: 'social',
        kind: 'follow_request',
        notification_id: 'n2',
      }),
    ).toEqual({ pathname: '/settings/follow-requests', params: {} });
  });

  it('rejects an unknown kind', () => {
    expect(
      resolvePushRoute({
        category: 'social',
        // @ts-expect-error — intentionally malformed
        kind: 'attacker_kind',
        notification_id: 'n3',
      }),
    ).toBeNull();
  });

  it('rejects chat_message when chat_id is not a UUID', () => {
    expect(
      resolvePushRoute({
        category: 'social',
        kind: 'chat_message',
        notification_id: 'n4',
        chat_id: '../../etc/passwd',
      }),
    ).toBeNull();
  });

  it('ignores attacker-supplied data.route', () => {
    expect(
      resolvePushRoute({
        category: 'social',
        kind: 'follow_request',
        notification_id: 'n5',
        // route is a valid field on PushData (kept for back-compat) but resolvePushRoute ignores it
        route: '/auth/callback',
        params: { code: 'stolen' },
      }),
    ).toEqual({ pathname: '/settings/follow-requests', params: {} });
  });
});
