import { describe, it, expect } from 'vitest';
import { coalesceChat, coalesceFollowStarted } from '../coalesce';

describe('coalesceChat', () => {
  it('returns single-message shape when no prior dispatches in window', () => {
    const result = coalesceChat({ priorCount: 0, senderName: 'Avi', messagePreview: 'שלום' });
    expect(result).toEqual({
      titleKey: 'notifications.chatTitle',
      bodyKey: 'notifications.chatBody',
      bodyArgs: { senderName: 'Avi', messagePreview: 'שלום' },
    });
  });

  it('returns coalesced shape when 1 prior dispatch exists', () => {
    const result = coalesceChat({ priorCount: 1, senderName: 'Avi', messagePreview: 'x' });
    expect(result.bodyKey).toBe('notifications.chatBodyCoalesced');
    expect(result.bodyArgs).toEqual({ senderName: 'Avi', count: 2 });
  });

  it('returns coalesced shape for N>2 prior dispatches', () => {
    const result = coalesceChat({ priorCount: 4, senderName: 'Avi', messagePreview: 'x' });
    expect(result.bodyArgs).toEqual({ senderName: 'Avi', count: 5 });
  });
});

describe('coalesceFollowStarted', () => {
  it('returns single-follower shape below threshold (count=2)', () => {
    const result = coalesceFollowStarted({ priorCount: 1, followerName: 'Dana' });
    expect(result.bodyKey).toBe('notifications.followStartedBody');
    expect(result.bodyArgs).toEqual({ followerName: 'Dana' });
  });

  it('coalesces at threshold (count=3)', () => {
    const result = coalesceFollowStarted({ priorCount: 2, followerName: 'Dana' });
    expect(result.bodyKey).toBe('notifications.followStartedCoalesced');
    expect(result.bodyArgs).toEqual({ count: 3 });
  });

  it('coalesces above threshold (count=10)', () => {
    const result = coalesceFollowStarted({ priorCount: 9, followerName: 'Dana' });
    expect(result.bodyArgs).toEqual({ count: 10 });
  });
});
