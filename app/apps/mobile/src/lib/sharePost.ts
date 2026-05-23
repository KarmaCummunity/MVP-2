// FR-POST-023 (P2.33) — share post via link + image attachment.
//
// Two layers:
//   1. `buildPostShareUrl()` — pure URL builder. Defaults to the Supabase
//      Edge Function URL (`${SUPABASE_URL}/functions/v1/share-post`) which
//      serves Open Graph + Twitter Card meta tags pointing at the post's
//      first image. `EXPO_PUBLIC_SHARE_BASE_URL` may override the prefix
//      when a custom domain is set up to rewrite to the Edge Function
//      (e.g. Vercel/Netlify rewrite `/p/:id` → Edge Function).
//   2. `sharePost()` — platform-aware invocation. When the caller passes a
//      `remoteImageUrl`, we download the image into the OS cache and
//      attach it directly to the share sheet **in addition to** the OG
//      URL in the message body. The OG card still renders on receivers
//      that fetch link previews; chats that don't fetch OG (older
//      iMessage, raw SMS, etc.) now also see the actual image.
//      - iOS: `Share.share({ message: <text+url>, url: <localFileUri> })`.
//      - Android: RN `Share.share` does not honor `url` for binaries, so
//        we fall through to the URL-only message (OG-driven preview).
//      - Web: `navigator.share({ files: [File] })` when supported, else
//        `navigator.share({ title, text, url })`, else clipboard copy.
//
// **Why no static fallback to karma-community-kc.com:** the SPA at that host
// has no per-post OG tags, so a fallback URL there causes WhatsApp / Telegram
// / Twitter to render the site favicon instead of the item image. The Edge
// Function path is the only URL that surfaces the item image, so we route
// through it unconditionally unless an override that we trust to do the
// rewrite is set.

import { Platform, Share } from 'react-native';

import { downloadPostImageForShare } from './downloadPostImageForShare';

export type PostShareInput = Readonly<{
  postId: string;
  /** Displayed in the share message body. Trimmed by the caller. */
  title: string;
  /** Hebrew message template — `{{title}}` is interpolated by the caller via i18n. */
  message: string;
  /** Resolved by `resolveShareBaseUrl` from EXPO_PUBLIC_* or supabase URL. */
  shareBaseUrl: string;
  /**
   * Public URL of the post's first image (`mediaAssets[0]`). When provided,
   * the share sheet attaches the binary so receivers without OG-preview
   * support (raw SMS, some Android chats) still see the item. Omitted
   * (or empty string) on Request posts without media.
   */
  remoteImageUrl?: string;
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
  share?: (data: { title?: string; text?: string; url?: string; files?: File[] }) => Promise<void>;
  canShare?: (data: { files?: File[] }) => boolean;
  clipboard?: { writeText: (text: string) => Promise<void> };
};

async function fetchAsFile(remoteUrl: string, postId: string): Promise<File | null> {
  if (typeof fetch === 'undefined' || typeof File === 'undefined') return null;
  try {
    const resp = await fetch(remoteUrl);
    if (!resp.ok) return null;
    const blob = await resp.blob();
    const ext = (blob.type.split('/')[1] ?? 'jpg').replace('jpeg', 'jpg');
    const safeId = postId.replace(/[^a-zA-Z0-9-_]/g, '_');
    return new File([blob], `kc-share-${safeId}.${ext}`, { type: blob.type || 'image/jpeg' });
  } catch {
    return null;
  }
}

async function shareWeb(
  input: PostShareInput,
  url: string,
  nav: WebShareNavigator | undefined,
): Promise<SharePostOutcome> {
  if (nav?.share) {
    // Try to attach the image as a File first — receivers (iMessage on
    // macOS Safari, Android share intents) prefer real attachments over
    // URL previews. `canShare({ files })` is the spec-defined feature
    // detector; fall through to text+url when missing/false.
    let file: File | null = null;
    if (input.remoteImageUrl && input.remoteImageUrl.trim() !== '') {
      file = await fetchAsFile(input.remoteImageUrl, input.postId);
    }
    const filesPayload = file && (!nav.canShare || nav.canShare({ files: [file] })) ? [file] : undefined;
    try {
      if (filesPayload) {
        await nav.share({ title: input.title, text: `${input.message}\n${url}`, url, files: filesPayload });
      } else {
        await nav.share({ title: input.title, text: input.message, url });
      }
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

  // Native: best-effort image download. Failure ⇒ fall back to URL-only
  // share so the user always gets a working share sheet.
  let localImageUri: string | undefined;
  if (input.remoteImageUrl && input.remoteImageUrl.trim() !== '') {
    const downloaded = await downloadPostImageForShare(input.remoteImageUrl, input.postId);
    localImageUri = downloaded?.uri;
  }

  try {
    if (localImageUri && Platform.OS === 'ios') {
      // iOS: `url` becomes the attached file; the OG link must live inline in
      // the message because iOS no longer renders a URL preview alongside an
      // attached file. The recipient sees the image + the deep link in one
      // message.
      const result = await Share.share({
        message: `${input.message}\n${url}`,
        url: localImageUri,
        title: input.title,
      });
      if (result.action === Share.dismissedAction) return { kind: 'dismissed' };
      return { kind: 'shared' };
    }
    // Android falls through to the URL-only path: RN `Share.share` ignores
    // the `url` field for non-iOS, so we cannot attach the binary here.
    // OG-card preview in the receiving chat fills the gap for apps that
    // fetch link previews (WhatsApp, Telegram, Messenger, …).
    const message =
      Platform.OS === 'android' ? `${input.message}\n${url}` : input.message;
    const result = await Share.share({ message, url, title: input.title });
    if (result.action === Share.dismissedAction) return { kind: 'dismissed' };
    return { kind: 'shared' };
  } catch (err) {
    return { kind: 'failed', reason: err instanceof Error ? err.message : 'share_failed' };
  }
}
