import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('react-native', () => {
  return {
    Platform: { OS: 'web' as 'web' | 'ios' | 'android' },
    Share: {
      share: vi.fn(),
      dismissedAction: 'dismissedAction',
      sharedAction: 'sharedAction',
    },
  };
});

import { Platform, Share } from 'react-native';
import { shareProfile } from '../shareProfile';

const baseInput = {
  handle: 'u_abc123',
  title: 'רינה כהן',
  message: 'join me',
  webBaseUrl: 'https://karma-community-kc.com',
};

describe('shareProfile — web', () => {
  beforeEach(() => {
    (Platform as { OS: string }).OS = 'web';
    vi.clearAllMocks();
    vi.unstubAllGlobals();
  });

  it('calls navigator.share with the canonical url', async () => {
    const share = vi.fn().mockResolvedValue(undefined);
    vi.stubGlobal('navigator', { share });

    const outcome = await shareProfile(baseInput);

    expect(outcome).toEqual({ kind: 'shared' });
    const arg = share.mock.calls[0][0];
    expect(arg.url).toBe('https://karma-community-kc.com/user/u_abc123');
    expect(arg.text).toBe('join me');
  });

  it('returns dismissed when navigator.share throws AbortError', async () => {
    const share = vi.fn().mockRejectedValue(Object.assign(new Error('cancelled'), { name: 'AbortError' }));
    vi.stubGlobal('navigator', { share });

    const outcome = await shareProfile(baseInput);

    expect(outcome).toEqual({ kind: 'dismissed' });
  });

  it('falls back to clipboard when navigator.share is missing', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    vi.stubGlobal('navigator', { clipboard: { writeText } });

    const outcome = await shareProfile(baseInput);

    expect(outcome).toEqual({ kind: 'copied' });
    expect(writeText).toHaveBeenCalledWith('https://karma-community-kc.com/user/u_abc123');
  });

  it('returns failed when no share api is available', async () => {
    vi.stubGlobal('navigator', {});

    const outcome = await shareProfile(baseInput);

    expect(outcome.kind).toBe('failed');
  });
});

describe('shareProfile — native', () => {
  beforeEach(() => {
    (Platform as { OS: string }).OS = 'android';
    vi.clearAllMocks();
    vi.unstubAllGlobals();
  });

  it('embeds the share url in the message exactly once and omits the url field', async () => {
    (Share.share as ReturnType<typeof vi.fn>).mockResolvedValue({ action: 'sharedAction' });

    const outcome = await shareProfile(baseInput);

    expect(outcome).toEqual({ kind: 'shared' });
    const arg = (Share.share as ReturnType<typeof vi.fn>).mock.calls[0][0];
    expect(arg.url).toBeUndefined();
    expect(arg.message).toContain('https://karma-community-kc.com/user/u_abc123');
    const occurrences = (arg.message.match(/karma-community-kc/g) ?? []).length;
    expect(occurrences).toBe(1);
  });

  it('returns dismissed on dismissedAction', async () => {
    (Share.share as ReturnType<typeof vi.fn>).mockResolvedValue({ action: 'dismissedAction' });

    const outcome = await shareProfile(baseInput);

    expect(outcome).toEqual({ kind: 'dismissed' });
  });
});
