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

vi.mock('../downloadPostImageForShare', () => ({
  downloadPostImageForShare: vi.fn(),
}));

import { Platform, Share } from 'react-native';
import { downloadPostImageForShare } from '../downloadPostImageForShare';
import { sharePost } from '../sharePost';

const baseInput = {
  postId: 'abc-123',
  title: 'שולחן עץ',
  message: 'body\nwithout url',
  webBaseUrl: 'https://karma-community-kc.com',
  remoteImageUrl: 'https://cdn.example.com/img.jpg',
};

describe('sharePost — web', () => {
  beforeEach(() => {
    (Platform as { OS: string }).OS = 'web';
    vi.clearAllMocks();
    vi.unstubAllGlobals();
  });

  it('calls navigator.share with files when Web Share Level 2 supports files', async () => {
    const blob = new Blob(['hi'], { type: 'image/jpeg' });
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, blob: async () => blob });
    vi.stubGlobal('fetch', fetchMock);
    const share = vi.fn().mockResolvedValue(undefined);
    const canShare = vi.fn().mockReturnValue(true);
    vi.stubGlobal('navigator', { share, canShare });
    vi.stubGlobal('File', class File {
      constructor(public parts: unknown[], public name: string, public opts: unknown) {}
    });

    const outcome = await sharePost(baseInput);

    expect(outcome).toEqual({ kind: 'shared' });
    expect(canShare).toHaveBeenCalled();
    expect(share).toHaveBeenCalledTimes(1);
    const arg = share.mock.calls[0][0];
    expect(arg.url).toBe('https://karma-community-kc.com/post/abc-123');
    expect(arg.files).toHaveLength(1);
  });

  it('falls back to text+url when canShare returns false', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, blob: async () => new Blob(['']) }));
    const share = vi.fn().mockResolvedValue(undefined);
    const canShare = vi.fn().mockReturnValue(false);
    vi.stubGlobal('navigator', { share, canShare });
    vi.stubGlobal('File', class File {});

    const outcome = await sharePost(baseInput);

    expect(outcome).toEqual({ kind: 'shared' });
    const arg = share.mock.calls[0][0];
    expect(arg.files).toBeUndefined();
    expect(arg.url).toBe('https://karma-community-kc.com/post/abc-123');
    expect(arg.text).toBe('body\nwithout url');
  });

  it('returns dismissed when navigator.share throws AbortError', async () => {
    const share = vi.fn().mockRejectedValue(Object.assign(new Error('cancelled'), { name: 'AbortError' }));
    vi.stubGlobal('navigator', { share });
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false }));

    const outcome = await sharePost({ ...baseInput, remoteImageUrl: undefined });

    expect(outcome).toEqual({ kind: 'dismissed' });
  });

  it('falls back to clipboard when navigator.share is missing', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    vi.stubGlobal('navigator', { clipboard: { writeText } });

    const outcome = await sharePost({ ...baseInput, remoteImageUrl: undefined });

    expect(outcome).toEqual({ kind: 'copied' });
    expect(writeText).toHaveBeenCalledWith('https://karma-community-kc.com/post/abc-123');
  });

  it('returns failed when no share api is available', async () => {
    vi.stubGlobal('navigator', {});

    const outcome = await sharePost({ ...baseInput, remoteImageUrl: undefined });

    expect(outcome.kind).toBe('failed');
  });
});

describe('sharePost — ios', () => {
  beforeEach(() => {
    (Platform as { OS: string }).OS = 'ios';
    vi.clearAllMocks();
    vi.unstubAllGlobals();
  });

  it('attaches the local file via url and embeds the share url in message', async () => {
    (downloadPostImageForShare as ReturnType<typeof vi.fn>).mockResolvedValue({
      uri: 'file:///cache/img.jpg',
      mimeType: 'image/jpeg',
    });
    (Share.share as ReturnType<typeof vi.fn>).mockResolvedValue({ action: 'sharedAction' });

    const outcome = await sharePost(baseInput);

    expect(outcome).toEqual({ kind: 'shared' });
    const arg = (Share.share as ReturnType<typeof vi.fn>).mock.calls[0][0];
    expect(arg.url).toBe('file:///cache/img.jpg');
    expect(arg.message).toContain('body\nwithout url');
    expect(arg.message).toContain('https://karma-community-kc.com/post/abc-123');
    // URL appears exactly once in the message body.
    const occurrences = (arg.message.match(/karma-community-kc/g) ?? []).length;
    expect(occurrences).toBe(1);
  });

  it('omits the url field when image download fails', async () => {
    (downloadPostImageForShare as ReturnType<typeof vi.fn>).mockResolvedValue(null);
    (Share.share as ReturnType<typeof vi.fn>).mockResolvedValue({ action: 'sharedAction' });

    const outcome = await sharePost(baseInput);

    expect(outcome).toEqual({ kind: 'shared' });
    const arg = (Share.share as ReturnType<typeof vi.fn>).mock.calls[0][0];
    expect(arg.url).toBeUndefined();
    expect(arg.message).toContain('https://karma-community-kc.com/post/abc-123');
  });

  it('omits the url field when remoteImageUrl is not provided', async () => {
    (Share.share as ReturnType<typeof vi.fn>).mockResolvedValue({ action: 'sharedAction' });

    await sharePost({ ...baseInput, remoteImageUrl: undefined });

    expect(downloadPostImageForShare).not.toHaveBeenCalled();
    const arg = (Share.share as ReturnType<typeof vi.fn>).mock.calls[0][0];
    expect(arg.url).toBeUndefined();
  });
});

describe('sharePost — android', () => {
  beforeEach(() => {
    (Platform as { OS: string }).OS = 'android';
    vi.clearAllMocks();
    vi.unstubAllGlobals();
  });

  it('never passes the url field, even when an image is present', async () => {
    (Share.share as ReturnType<typeof vi.fn>).mockResolvedValue({ action: 'sharedAction' });

    await sharePost(baseInput);

    const arg = (Share.share as ReturnType<typeof vi.fn>).mock.calls[0][0];
    expect(arg.url).toBeUndefined();
    expect(arg.message).toContain('https://karma-community-kc.com/post/abc-123');
    // Crucial regression — RN's Android Share concatenates `url` onto
    // EXTRA_TEXT, surfacing the link twice in WhatsApp. The url field
    // must remain absent.
    const occurrences = (arg.message.match(/karma-community-kc/g) ?? []).length;
    expect(occurrences).toBe(1);
  });

  it('returns dismissed on dismissedAction', async () => {
    (Share.share as ReturnType<typeof vi.fn>).mockResolvedValue({ action: 'dismissedAction' });

    const outcome = await sharePost({ ...baseInput, remoteImageUrl: undefined });

    expect(outcome).toEqual({ kind: 'dismissed' });
  });
});
