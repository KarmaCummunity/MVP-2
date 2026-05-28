// FR-RESEARCH-004 — share the public market-research survey from inside the
// app (Settings row) and from the public web surfaces (thanks page, survey
// form header). Mirrors sharePost.ts for FR-POST-023: never throws, returns
// a discriminated-union outcome. URL composition is centralized so the
// ?src= attribution can't drift across call sites.

import { Platform, Share } from 'react-native';

export const RESEARCH_SHARE_SLUG = 'alt-platforms-research';
export const RESEARCH_SHARE_SRC_THANKS = 'share-thanks';
export const RESEARCH_SHARE_SRC_DURING_SURVEY = 'share-during-survey';
export const RESEARCH_SHARE_SRC_SETTINGS = 'in-app-share-settings';

export type ResearchShareInput = Readonly<{
  webBaseUrl: string;
  src: string;
  title: string;
  /** Short Hebrew copy that goes before the URL in the message body. */
  message: string;
}>;

export type ShareResearchOutcome =
  | { kind: 'shared' }
  | { kind: 'dismissed' }
  | { kind: 'copied' }
  | { kind: 'failed'; reason: string };

type WebShareNavigator = {
  share?: (data: { title?: string; text?: string; url?: string }) => Promise<void>;
  clipboard?: { writeText: (text: string) => Promise<void> };
};

export function buildResearchShareUrl(webBaseUrl: string, src: string): string {
  const trimmed = webBaseUrl.replace(/\/+$/, '');
  return `${trimmed}/research/${RESEARCH_SHARE_SLUG}?src=${src}`;
}

function composeMessage(message: string, url: string): string {
  return `${message.trim()}\n\n${url}`;
}

async function shareWeb(
  url: string,
  title: string,
  body: string,
): Promise<ShareResearchOutcome> {
  const nav = (globalThis as { navigator?: WebShareNavigator }).navigator;
  if (!nav) return { kind: 'failed', reason: 'no_navigator' };
  if (typeof nav.share === 'function') {
    try {
      await nav.share({ title, text: body, url });
      return { kind: 'shared' };
    } catch (err) {
      const name = (err as { name?: string }).name;
      if (name === 'AbortError') return { kind: 'dismissed' };
    }
  }
  if (nav.clipboard?.writeText) {
    try {
      await nav.clipboard.writeText(url);
      return { kind: 'copied' };
    } catch (err) {
      return { kind: 'failed', reason: (err as Error).message };
    }
  }
  return { kind: 'failed', reason: 'no_share_or_clipboard' };
}

async function shareNative(
  title: string,
  body: string,
): Promise<ShareResearchOutcome> {
  try {
    const result = await Share.share({ message: body, title });
    if (result.action === Share.sharedAction) return { kind: 'shared' };
    if (result.action === Share.dismissedAction) return { kind: 'dismissed' };
    return { kind: 'failed', reason: `unknown_action_${result.action}` };
  } catch (err) {
    return { kind: 'failed', reason: (err as Error).message };
  }
}

export async function shareResearchSurvey(
  input: ResearchShareInput,
): Promise<ShareResearchOutcome> {
  const url = buildResearchShareUrl(input.webBaseUrl, input.src);
  const body = composeMessage(input.message, url);

  if (Platform.OS === 'web') return shareWeb(url, input.title, body);
  return shareNative(input.title, body);
}
