import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('react-native', () => ({
  Share: {
    share: vi.fn(),
    dismissedAction: 'dismissedAction',
    sharedAction: 'sharedAction',
  },
}));

import { Share } from 'react-native';
import { shareViaNative, shareViaWeb } from '../shareViaSheet';

const URL = 'https://kc.com/x';

describe('shareViaWeb', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.unstubAllGlobals();
  });

  it('returns shared when navigator.share resolves', async () => {
    const share = vi.fn().mockResolvedValue(undefined);
    vi.stubGlobal('navigator', { share });

    const outcome = await shareViaWeb({ title: 'T', text: 'body', url: URL });

    expect(outcome).toEqual({ kind: 'shared' });
    const arg = share.mock.calls[0][0];
    expect(arg).toEqual({ title: 'T', text: 'body', url: URL });
  });

  it('passes files when canShare accepts them', async () => {
    const share = vi.fn().mockResolvedValue(undefined);
    const canShare = vi.fn().mockReturnValue(true);
    vi.stubGlobal('navigator', { share, canShare });
    const file = { name: 'f' } as unknown as File;

    const outcome = await shareViaWeb({ title: 'T', text: 'body', url: URL, files: [file] });

    expect(outcome).toEqual({ kind: 'shared' });
    expect(canShare).toHaveBeenCalledWith({ files: [file] });
    expect(share.mock.calls[0][0].files).toEqual([file]);
  });

  it('drops files when canShare rejects them', async () => {
    const share = vi.fn().mockResolvedValue(undefined);
    const canShare = vi.fn().mockReturnValue(false);
    vi.stubGlobal('navigator', { share, canShare });
    const file = { name: 'f' } as unknown as File;

    await shareViaWeb({ title: 'T', text: 'body', url: URL, files: [file] });

    expect(share.mock.calls[0][0].files).toBeUndefined();
  });

  it('returns dismissed when navigator.share throws AbortError', async () => {
    const share = vi.fn().mockRejectedValue(Object.assign(new Error('x'), { name: 'AbortError' }));
    vi.stubGlobal('navigator', { share });

    expect(await shareViaWeb({ title: 'T', text: 'b', url: URL })).toEqual({ kind: 'dismissed' });
  });

  it('falls back to clipboard when share throws a non-AbortError', async () => {
    const share = vi.fn().mockRejectedValue(new Error('nope'));
    const writeText = vi.fn().mockResolvedValue(undefined);
    vi.stubGlobal('navigator', { share, clipboard: { writeText } });

    expect(await shareViaWeb({ title: 'T', text: 'b', url: URL })).toEqual({ kind: 'copied' });
    expect(writeText).toHaveBeenCalledWith(URL);
  });

  it('copies to clipboard when navigator.share is missing', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    vi.stubGlobal('navigator', { clipboard: { writeText } });

    expect(await shareViaWeb({ title: 'T', text: 'b', url: URL })).toEqual({ kind: 'copied' });
  });

  it('fails when neither share nor clipboard is available', async () => {
    vi.stubGlobal('navigator', {});
    expect((await shareViaWeb({ title: 'T', text: 'b', url: URL })).kind).toBe('failed');
  });

  it('fails when there is no navigator at all', async () => {
    vi.stubGlobal('navigator', undefined);
    expect((await shareViaWeb({ title: 'T', text: 'b', url: URL })).kind).toBe('failed');
  });
});

describe('shareViaNative', () => {
  const shareMock = Share.share as ReturnType<typeof vi.fn>;
  beforeEach(() => vi.clearAllMocks());

  it('returns shared on a non-dismissed action', async () => {
    shareMock.mockResolvedValue({ action: 'sharedAction' });
    expect(await shareViaNative({ message: 'm', title: 'T' })).toEqual({ kind: 'shared' });
  });

  it('returns dismissed on the dismissed action', async () => {
    shareMock.mockResolvedValue({ action: 'dismissedAction' });
    expect(await shareViaNative({ message: 'm', title: 'T' })).toEqual({ kind: 'dismissed' });
  });

  it('returns failed with the error message when Share.share throws', async () => {
    shareMock.mockRejectedValue(new Error('os refused'));
    expect(await shareViaNative({ message: 'm', title: 'T' })).toEqual({
      kind: 'failed',
      reason: 'os refused',
    });
  });

  it('attaches fileUri via the url field when provided', async () => {
    shareMock.mockResolvedValue({ action: 'sharedAction' });
    await shareViaNative({ message: 'm', title: 'T', fileUri: 'file:///img.jpg' });
    expect(shareMock.mock.calls[0][0]).toEqual({ message: 'm', url: 'file:///img.jpg', title: 'T' });
  });

  it('omits the url field when no fileUri is given', async () => {
    shareMock.mockResolvedValue({ action: 'sharedAction' });
    await shareViaNative({ message: 'm', title: 'T' });
    expect(shareMock.mock.calls[0][0].url).toBeUndefined();
  });
});
