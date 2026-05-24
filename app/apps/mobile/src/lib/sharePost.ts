// FR-POST-023 — share a post via the OS share sheet. Returns a discriminated
// union outcome; never throws. The share URL appears in the message body
// exactly once on every platform (the prior version's duplicated-link bug
// in WhatsApp came from RN's Android Share concatenating the `url` field
// onto EXTRA_TEXT after `message`).
//
//   iOS w/ image:  Share.share({ message: <text+url>, url: <fileUri>, title })
//   iOS no image:  Share.share({ message: <text+url>, title })
//   Android (any): Share.share({ message: <text+url>, title })            -- no url
//   Web w/ files:  navigator.share({ title, text, url, files: [imageFile] })
//   Web no files:  navigator.share({ title, text, url })
//   Web no share:  navigator.clipboard.writeText(url) → outcome 'copied'.

import { Platform, Share } from 'react-native';

import { buildPostShareUrl } from './buildPostShareUrl';
import { downloadPostImageForShare } from './downloadPostImageForShare';

export type PostShareInput = Readonly<{
  postId: string;
  title: string;
  message: string;
  webBaseUrl: string;
  /** Public URL of `mediaAssets[0]` when present. Omitted on no-media posts. */
  remoteImageUrl?: string;
}>;

export type SharePostOutcome =
  | { kind: 'shared' }
  | { kind: 'dismissed' }
  | { kind: 'copied' }
  | { kind: 'failed'; reason: string };

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
    let file: File | null = null;
    if (input.remoteImageUrl && input.remoteImageUrl.trim() !== '') {
      file = await fetchAsFile(input.remoteImageUrl, input.postId);
    }
    const filesPayload = file && (!nav.canShare || nav.canShare({ files: [file] })) ? [file] : undefined;
    try {
      if (filesPayload) {
        await nav.share({ title: input.title, text: input.message, url, files: filesPayload });
      } else {
        await nav.share({ title: input.title, text: input.message, url });
      }
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

export async function sharePost(input: PostShareInput): Promise<SharePostOutcome> {
  const url = buildPostShareUrl(input.postId, input.webBaseUrl);

  if (Platform.OS === 'web') {
    const nav = typeof navigator !== 'undefined' ? (navigator as unknown as WebShareNavigator) : undefined;
    return shareWeb(input, url, nav);
  }

  // iOS attaches the image binary via the `url` field; the share URL lives
  // inline in `message`. Android never passes `url` because RN concatenates
  // it onto EXTRA_TEXT, surfacing the link twice in WhatsApp.
  let localImageUri: string | undefined;
  if (Platform.OS === 'ios' && input.remoteImageUrl && input.remoteImageUrl.trim() !== '') {
    const downloaded = await downloadPostImageForShare(input.remoteImageUrl, input.postId);
    localImageUri = downloaded?.uri;
  }

  try {
    const messageWithUrl = `${input.message}\n${url}`;
    if (localImageUri && Platform.OS === 'ios') {
      const result = await Share.share({
        message: messageWithUrl,
        url: localImageUri,
        title: input.title,
      });
      if (result.action === Share.dismissedAction) return { kind: 'dismissed' };
      return { kind: 'shared' };
    }
    const result = await Share.share({ message: messageWithUrl, title: input.title });
    if (result.action === Share.dismissedAction) return { kind: 'dismissed' };
    return { kind: 'shared' };
  } catch (err) {
    return { kind: 'failed', reason: err instanceof Error ? err.message : 'share_failed' };
  }
}
