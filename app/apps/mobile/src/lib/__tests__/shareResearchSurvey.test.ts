import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('react-native', () => ({
  Platform: { OS: 'ios' as 'ios' | 'android' | 'web' },
  Share: {
    share: vi.fn(),
    sharedAction: 'sharedAction',
    dismissedAction: 'dismissedAction',
  },
}));

import { Platform, Share } from 'react-native';
import {
  shareResearchSurvey,
  buildResearchShareUrl,
  RESEARCH_SHARE_SRC_THANKS,
  RESEARCH_SHARE_SRC_DURING_SURVEY,
  RESEARCH_SHARE_SRC_SETTINGS,
  RESEARCH_SHARE_SLUG,
} from '../shareResearchSurvey';

const shareMock = Share.share as ReturnType<typeof vi.fn>;

describe('shareResearchSurvey — constants', () => {
  it('exposes all three src constants matching the source CHECK regex', () => {
    const re = /^[a-z0-9_-]{1,32}$/;
    expect(RESEARCH_SHARE_SRC_THANKS).toBe('share-thanks');
    expect(RESEARCH_SHARE_SRC_DURING_SURVEY).toBe('share-during-survey');
    expect(RESEARCH_SHARE_SRC_SETTINGS).toBe('in-app-share-settings');
    expect(re.test(RESEARCH_SHARE_SRC_THANKS)).toBe(true);
    expect(re.test(RESEARCH_SHARE_SRC_DURING_SURVEY)).toBe(true);
    expect(re.test(RESEARCH_SHARE_SRC_SETTINGS)).toBe(true);
  });

  it('uses the public research slug', () => {
    expect(RESEARCH_SHARE_SLUG).toBe('alt-platforms-research');
  });
});

describe('buildResearchShareUrl', () => {
  it('composes the URL with slug and src', () => {
    const url = buildResearchShareUrl('https://example.com', 'share-thanks');
    expect(url).toBe('https://example.com/research/alt-platforms-research?src=share-thanks');
  });

  it('trims trailing slashes from the base URL', () => {
    const url = buildResearchShareUrl('https://example.com///', 'share-thanks');
    expect(url).toBe('https://example.com/research/alt-platforms-research?src=share-thanks');
  });

  it('respects the src parameter for each placement', () => {
    expect(buildResearchShareUrl('https://ex.com', RESEARCH_SHARE_SRC_THANKS)).toContain('?src=share-thanks');
    expect(buildResearchShareUrl('https://ex.com', RESEARCH_SHARE_SRC_DURING_SURVEY)).toContain('?src=share-during-survey');
    expect(buildResearchShareUrl('https://ex.com', RESEARCH_SHARE_SRC_SETTINGS)).toContain('?src=in-app-share-settings');
  });
});

describe('shareResearchSurvey — native (Platform.OS=ios)', () => {
  beforeEach(() => {
    (Platform as { OS: string }).OS = 'ios';
    vi.clearAllMocks();
  });

  it('returns kind: "shared" when sharedAction', async () => {
    shareMock.mockResolvedValue({ action: 'sharedAction' });
    const result = await shareResearchSurvey({
      webBaseUrl: 'https://example.com',
      src: RESEARCH_SHARE_SRC_SETTINGS,
      title: 'T',
      message: 'M',
    });
    expect(result).toEqual({ kind: 'shared' });
  });

  it('returns kind: "dismissed" when dismissedAction', async () => {
    shareMock.mockResolvedValue({ action: 'dismissedAction' });
    const result = await shareResearchSurvey({
      webBaseUrl: 'https://example.com',
      src: RESEARCH_SHARE_SRC_SETTINGS,
      title: 'T',
      message: 'M',
    });
    expect(result).toEqual({ kind: 'dismissed' });
  });

  it('returns kind: "failed" when Share.share throws', async () => {
    shareMock.mockRejectedValue(new Error('os refused'));
    const result = await shareResearchSurvey({
      webBaseUrl: 'https://example.com',
      src: RESEARCH_SHARE_SRC_SETTINGS,
      title: 'T',
      message: 'M',
    });
    expect(result).toEqual({ kind: 'failed', reason: 'os refused' });
  });

  it('includes the URL exactly once in the share message body', async () => {
    shareMock.mockResolvedValue({ action: 'sharedAction' });
    await shareResearchSurvey({
      webBaseUrl: 'https://example.com',
      src: RESEARCH_SHARE_SRC_SETTINGS,
      title: 'T',
      message: 'מלא/י את הסקר',
    });
    const arg = shareMock.mock.calls[0][0];
    const url = 'https://example.com/research/alt-platforms-research?src=in-app-share-settings';
    const escaped = url.replace(/[.?*+]/g, '\\$&');
    const occurrences = (arg.message.match(new RegExp(escaped, 'g')) || []).length;
    expect(occurrences).toBe(1);
  });

  it('respects the src parameter in the URL passed to Share.share', async () => {
    shareMock.mockResolvedValue({ action: 'sharedAction' });
    await shareResearchSurvey({
      webBaseUrl: 'https://example.com',
      src: RESEARCH_SHARE_SRC_THANKS,
      title: 'T',
      message: 'M',
    });
    const arg = shareMock.mock.calls[0][0];
    expect(arg.message).toContain('?src=share-thanks');
  });
});
