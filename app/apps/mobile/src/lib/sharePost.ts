// FR-POST-023 (P2.33) — share post via link.
//
// Two layers:
//   1. `buildPostShareUrl()` — pure URL builder. Defaults to the Supabase
//      Edge Function URL (`${SUPABASE_URL}/functions/v1/share-post`) which
//      serves Open Graph + Twitter Card meta tags pointing at the post's
//      first image. `EXPO_PUBLIC_SHARE_BASE_URL` may override the prefix
//      when a custom domain is set up to rewrite to the Edge Function
//      (e.g. Vercel/Netlify rewrite `/p/:id` → Edge Function).
//   2. `sharePost()` — platform-aware invocation. Native uses RN's `Share.share`
//      so the OS share sheet appears with both message + URL; web uses the Web
//      Share API when available, falling back to `navigator.clipboard`.
//
// **Why no static fallback to karma-community-kc.com:** the SPA at that host
// has no per-post OG tags, so a fallback URL there causes WhatsApp / Telegram
// / Twitter to render the site favicon instead of the item image. The Edge
// Function path is the only URL that surfaces the item image, so we route
// through it unconditionally unless an override that we trust to do the
// rewrite is set.

import { Platform, Share } from 'react-native';

export type PostShareInput = Readonly<{
  postId: string;
  /** Displayed in the share message body. Trimmed by the caller. */
  title: string;
  /** Hebrew message template — `{{title}}` is interpolated by the caller via i18n. */
  message: string;
  /** Resolved by `resolveShareBaseUrl` from EXPO_PUBLIC_* or supabase URL. */
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
  // Explicit override wins. Use this only when the override prefix is wired
  // up to serve OG meta — either by proxying to the Edge Function or by
  // rendering its own per-post OG tags. A naked SPA host (no per-route SSR)
  // will silently downgrade the preview image to the site favicon.
  const override = env['EXPO_PUBLIC_SHARE_BASE_URL'];
  if (typeof override === 'string' && override.trim() !== '') {
    return override.replace(/\/+$/, '');
  }
  const supabaseUrl = env['EXPO_PUBLIC_SUPABASE_URL'];
  if (typeof supabaseUrl === 'string' && supabaseUrl.trim() !== '') {
    return `${supabaseUrl.replace(/\/+$/, '')}/functions/v1/share-post`;
  }
  // No supabase URL means the app cannot have rendered the post in the first
  // place. A static fallback URL would only mask the misconfiguration and
  // produce a logo-image preview on the receiving end.
  throw new Error(
    'resolveShareBaseUrl: EXPO_PUBLIC_SUPABASE_URL is missing — cannot build a share URL with OG meta.',
  );
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
