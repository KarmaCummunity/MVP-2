import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('react-native', () => ({
  Platform: { OS: 'web' as 'web' | 'ios' | 'android' },
  Share: { share: vi.fn(), dismissedAction: 'dismissedAction', sharedAction: 'sharedAction' },
}));

import { Platform, Share } from 'react-native';
import { shareProfile } from '../shareProfile';

const baseInput = {
  handle: 'u_abc123',
  title: 'רינה כהן',
  message: 'join me',
  webBaseUrl: 'https://karma-community-kc.com',
};
const EXPECTED_URL = 'https://karma-community-kc.com/user/u_abc123';

describe('shareProfile — routing', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.unstubAllGlobals();
  });

  it('routes the canonical profile url to navigator.share on web', async () => {
    (Platform as { OS: string }).OS = 'web';
    const share = vi.fn().mockResolvedValue(undefined);
    vi.stubGlobal('navigator', { share });

    const outcome = await shareProfile(baseInput);

    expect(outcome).toEqual({ kind: 'shared' });
    expect(share.mock.calls[0][0].url).toBe(EXPECTED_URL);
    expect(share.mock.calls[0][0].text).toBe('join me');
  });

  it('embeds the url once in the native message and omits the url field', async () => {
    (Platform as { OS: string }).OS = 'android';
    (Share.share as ReturnType<typeof vi.fn>).mockResolvedValue({ action: 'sharedAction' });

    const outcome = await shareProfile(baseInput);

    expect(outcome).toEqual({ kind: 'shared' });
    const arg = (Share.share as ReturnType<typeof vi.fn>).mock.calls[0][0];
    expect(arg.url).toBeUndefined();
    expect(arg.message).toContain(EXPECTED_URL);
    expect((arg.message.match(/karma-community-kc/g) ?? []).length).toBe(1);
  });
});
