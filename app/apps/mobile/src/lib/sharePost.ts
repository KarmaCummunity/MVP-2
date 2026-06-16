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
//
// The web `navigator.share`/clipboard fallback and the native `Share.share`
// call live in `shareViaSheet`; this module owns the post-specific URL +
// image-binary orchestration.

import { Platform } from 'react-native';

import { buildPostShareUrl } from './buildPostShareUrl';
import { downloadPostImageForShare } from './downloadPostImageForShare';
import { shareViaNative, shareViaWeb, type ShareOutcome } from './shareViaSheet';

export type PostShareInput = Readonly<{
  postId: string;
  title: string;
  message: string;
  webBaseUrl: string;
  /** Public URL of `mediaAssets[0]` when present. Omitted on no-media posts. */
  remoteImageUrl?: string;
}>;

export type SharePostOutcome = ShareOutcome;

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

async function sharePostWeb(input: PostShareInput, url: string): Promise<ShareOutcome> {
  let files: File[] | undefined;
  if (input.remoteImageUrl && input.remoteImageUrl.trim() !== '') {
    const file = await fetchAsFile(input.remoteImageUrl, input.postId);
    if (file) files = [file];
  }
  return shareViaWeb({ title: input.title, text: input.message, url, files });
}

const SHARE_IMAGE_DOWNLOAD_MS = 2_500;

async function withShareImageDownloadTimeout<T>(promise: Promise<T>): Promise<T | null> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      promise,
      new Promise<null>((resolve) => {
        timer = setTimeout(() => resolve(null), SHARE_IMAGE_DOWNLOAD_MS);
      }),
    ]);
  } catch {
    return null;
  } finally {
    if (timer !== undefined) clearTimeout(timer);
  }
}

export async function sharePost(input: PostShareInput): Promise<ShareOutcome> {
  const url = buildPostShareUrl(input.postId, input.webBaseUrl);

  if (Platform.OS === 'web') return sharePostWeb(input, url);

  // iOS attaches the image binary via the `url` field; the share URL lives
  // inline in `message`. Android never passes `url` because RN concatenates
  // it onto EXTRA_TEXT, surfacing the link twice in WhatsApp.
  let localImageUri: string | undefined;
  if (Platform.OS === 'ios' && input.remoteImageUrl && input.remoteImageUrl.trim() !== '') {
    const downloaded = await withShareImageDownloadTimeout(
      downloadPostImageForShare(input.remoteImageUrl, input.postId),
    );
    localImageUri = downloaded?.uri;
  }

  return shareViaNative({ message: `${input.message}\n${url}`, title: input.title, fileUri: localImageUri });
}
