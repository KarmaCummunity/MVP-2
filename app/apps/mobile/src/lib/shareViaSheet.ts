// Shared OS-share-sheet primitives for the three share surfaces: FR-POST-023
// (`sharePost`), FR-RESEARCH-004 (`shareResearchSurvey`) and FR-PROFILE-008
// (`shareProfile`). Each caller builds its own canonical URL + message, then
// routes through these helpers so the web `navigator.share` → clipboard
// fallback and the native `Share.share` call (including the Android
// double-link guard) live in exactly one place. Never throws; returns a
// discriminated-union outcome.

import { Share } from 'react-native';

export type ShareOutcome =
  | { kind: 'shared' }
  | { kind: 'dismissed' }
  | { kind: 'copied' }
  | { kind: 'failed'; reason: string };

type WebShareNavigator = {
  share?: (data: { title?: string; text?: string; url?: string; files?: File[] }) => Promise<void>;
  canShare?: (data: { files?: File[] }) => boolean;
  clipboard?: { writeText: (text: string) => Promise<void> };
};

export type WebShareArgs = Readonly<{
  title: string;
  text: string;
  url: string;
  /** Web Share Level 2 files, gated through `navigator.canShare` when present. */
  files?: File[];
}>;

function getWebShareNavigator(): WebShareNavigator | undefined {
  return typeof navigator !== 'undefined' ? (navigator as unknown as WebShareNavigator) : undefined;
}

async function copyUrlToClipboard(nav: WebShareNavigator, url: string): Promise<ShareOutcome> {
  if (!nav.clipboard?.writeText) return { kind: 'failed', reason: 'no_share_api' };
  try {
    await nav.clipboard.writeText(url);
    return { kind: 'copied' };
  } catch (err) {
    return { kind: 'failed', reason: err instanceof Error ? err.message : 'clipboard_failed' };
  }
}

function resolveShareFiles(nav: WebShareNavigator, files: File[] | undefined): File[] | undefined {
  if (!files || files.length === 0) return undefined;
  if (nav.canShare && !nav.canShare({ files })) return undefined;
  return files;
}

export async function shareViaWeb(args: WebShareArgs): Promise<ShareOutcome> {
  const nav = getWebShareNavigator();
  if (!nav) return { kind: 'failed', reason: 'no_navigator' };
  if (nav.share) {
    const files = resolveShareFiles(nav, args.files);
    const payload = { title: args.title, text: args.text, url: args.url };
    try {
      await nav.share(files ? { ...payload, files } : payload);
      return { kind: 'shared' };
    } catch (err) {
      if ((err instanceof Error ? err.name : '') === 'AbortError') return { kind: 'dismissed' };
    }
  }
  return copyUrlToClipboard(nav, args.url);
}

export type NativeShareArgs = Readonly<{
  /** Full body — the share URL must already be embedded inline. RN's Android
   *  `Share` concatenates a separate `url` field onto EXTRA_TEXT, doubling the
   *  link, so callers pass the URL inside `message`, never via `fileUri`. */
  message: string;
  title: string;
  /** iOS only: a local file URI attached via the `url` field (binary share). */
  fileUri?: string;
}>;

export async function shareViaNative(args: NativeShareArgs): Promise<ShareOutcome> {
  try {
    const result = await Share.share(
      args.fileUri
        ? { message: args.message, url: args.fileUri, title: args.title }
        : { message: args.message, title: args.title },
    );
    if (result.action === Share.dismissedAction) return { kind: 'dismissed' };
    return { kind: 'shared' };
  } catch (err) {
    return { kind: 'failed', reason: err instanceof Error ? err.message : 'share_failed' };
  }
}
