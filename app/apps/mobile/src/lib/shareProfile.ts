// FR-PROFILE-008 — share a profile via the OS native share sheet (mobile) or
// `navigator.share` with a clipboard fallback (Web). Returns a discriminated
// union outcome; never throws. The share URL appears in the message body
// exactly once on every platform (Android's RN Share concatenates the `url`
// field onto EXTRA_TEXT, so we never pass `url` natively — the link lives
// inline in `message`).

import { Platform, Share } from 'react-native';

import { buildProfileShareUrl } from './buildProfileShareUrl';

export type ProfileShareInput = Readonly<{
  handle: string;
  title: string;
  message: string;
  webBaseUrl: string;
}>;

export type ShareProfileOutcome =
  | { kind: 'shared' }
  | { kind: 'dismissed' }
  | { kind: 'copied' }
  | { kind: 'failed'; reason: string };

type WebShareNavigator = {
  share?: (data: { title?: string; text?: string; url?: string }) => Promise<void>;
  clipboard?: { writeText: (text: string) => Promise<void> };
};

async function shareWeb(
  input: ProfileShareInput,
  url: string,
  nav: WebShareNavigator | undefined,
): Promise<ShareProfileOutcome> {
  if (nav?.share) {
    try {
      await nav.share({ title: input.title, text: input.message, url });
      return { kind: 'shared' };
    } catch (err) {
      const name = err instanceof Error ? err.name : '';
      if (name === 'AbortError') return { kind: 'dismissed' };
    }
  }
  if (nav?.clipboard?.writeText) {
    try {
      await nav.clipboard.writeText(url);
      return { kind: 'copied' };
    } catch (err) {
      return { kind: 'failed', reason: err instanceof Error ? err.message : 'clipboard_failed' };
    }
  }
  return { kind: 'failed', reason: 'no_share_api' };
}

export async function shareProfile(input: ProfileShareInput): Promise<ShareProfileOutcome> {
  const url = buildProfileShareUrl(input.handle, input.webBaseUrl);

  if (Platform.OS === 'web') {
    const nav = typeof navigator !== 'undefined' ? (navigator as unknown as WebShareNavigator) : undefined;
    return shareWeb(input, url, nav);
  }

  try {
    const result = await Share.share({ message: `${input.message}\n${url}`, title: input.title });
    if (result.action === Share.dismissedAction) return { kind: 'dismissed' };
    return { kind: 'shared' };
  } catch (err) {
    return { kind: 'failed', reason: err instanceof Error ? err.message : 'share_failed' };
  }
}
