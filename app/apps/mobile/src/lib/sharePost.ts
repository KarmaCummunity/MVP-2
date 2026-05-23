// FR-POST-023 (P2.33) — share post via link.
//
// Two layers:
//   1. `buildPostShareUrl()` — pure URL builder. Pulls `EXPO_PUBLIC_SHARE_BASE_URL`
//      first (lets us swap to a custom-domain redirect later) and falls back to
//      the Supabase Edge Function URL `<supabase>/functions/v1/share-post`.
//   2. `sharePost()` — platform-aware invocation. Native uses RN's `Share.share`
//      so the OS share sheet appears with both message + URL; web uses the Web
//      Share API when available, falling back to `navigator.clipboard`.

import { Platform, Share } from 'react-native';

export type PostShareInput = Readonly<{
  postId: string;
  /** Displayed in the share message body. Trimmed by the caller. */
  title: string;
  /** Hebrew message template — `{{title}}` is interpolated by the caller via i18n. */
  message: string;
  /** Resolved by `useShareConfig` from EXPO_PUBLIC_* or supabase URL. */
  shareBaseUrl: string;
}>;

export type SharePostOutcome =
  | { kind: 'shared' }
  | { kind: 'dismissed' }
  | { kind: 'copied' }
  | { kind: 'failed'; reason: string };

export function buildPostShareUrl(postId: string, shareBaseUrl: string): string {
  if (!postId || !postId.trim()) {
    throw new Error('buildPostShareUrl: postId is required');
  }
  if (!shareBaseUrl || !shareBaseUrl.trim()) {
    throw new Error('buildPostShareUrl: shareBaseUrl is required');
  }
  const trimmed = shareBaseUrl.replace(/\/+$/, '');
  return `${trimmed}/${encodeURIComponent(postId.trim())}`;
}

export function resolveShareBaseUrl(env: NodeJS.ProcessEnv | Record<string, string | undefined>): string {
  // Explicit override wins. Lets us point at a custom domain
  // (e.g. https://karma-community-kc.com/p) without a code change.
  const override = env['EXPO_PUBLIC_SHARE_BASE_URL'];
  if (typeof override === 'string' && override.trim() !== '') {
    return override.replace(/\/+$/, '');
  }
  const supabaseUrl = env['EXPO_PUBLIC_SUPABASE_URL'];
  if (typeof supabaseUrl === 'string' && supabaseUrl.trim() !== '') {
    return `${supabaseUrl.replace(/\/+$/, '')}/functions/v1/share-post`;
  }
  // Static fallback used only when both env vars are missing (dev/test).
  // Tests assert the public-facing URL stays under our control.
  return 'https://karma-community-kc.com/p';
}

/**
 * Web Share API guard. Extracted so tests can stub `navigator` cleanly.
 * `navigator.share` is the only API guaranteed to surface an image preview
 * on the receiving end — `navigator.clipboard.writeText` is the fallback.
 */
type WebShareNavigator = {
  share?: (data: { title?: string; text?: string; url?: string }) => Promise<void>;
  clipboard?: { writeText: (text: string) => Promise<void> };
};

async function shareWeb(
  input: PostShareInput,
  url: string,
  nav: WebShareNavigator | undefined,
): Promise<SharePostOutcome> {
  if (nav?.share) {
    try {
      await nav.share({ title: input.title, text: input.message, url });
      return { kind: 'shared' };
    } catch (err) {
      const name = err instanceof Error ? err.name : '';
      // User dismissed the share sheet — not a failure.
      if (name === 'AbortError') return { kind: 'dismissed' };
      // Fall through to clipboard fallback on any other share error
      // (e.g. share dialog not permitted in this context).
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

export async function sharePost(input: PostShareInput): Promise<SharePostOutcome> {
  const url = buildPostShareUrl(input.postId, input.shareBaseUrl);

  if (Platform.OS === 'web') {
    const nav =
      typeof navigator !== 'undefined' ? (navigator as unknown as WebShareNavigator) : undefined;
    return shareWeb(input, url, nav);
  }

  try {
    // RN `Share.share` — on iOS, `url` becomes the primary attachment and the
    // social app reads OG meta from the URL when expanding the preview.
    // On Android both `message` and `url` are flattened into a single text
    // intent extra; we concatenate so the URL is always present in the
    // shared text.
    const message =
      Platform.OS === 'android' ? `${input.message}\n${url}` : input.message;
    const result = await Share.share({ message, url, title: input.title });
    if (result.action === Share.dismissedAction) return { kind: 'dismissed' };
    return { kind: 'shared' };
  } catch (err) {
    return { kind: 'failed', reason: err instanceof Error ? err.message : 'share_failed' };
  }
}
