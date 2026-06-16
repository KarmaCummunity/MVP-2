// FR-RESEARCH-004 — share the public market-research survey from inside the
// app (Settings row) and from the public web surfaces (thanks page, survey
// form header). Mirrors sharePost.ts for FR-POST-023: never throws, returns
// a discriminated-union outcome. URL composition is centralized so the
// ?src= attribution can't drift across call sites.

import { Platform } from 'react-native';

import { shareViaNative, shareViaWeb, type ShareOutcome } from './shareViaSheet';

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

export type ShareResearchOutcome = ShareOutcome;

function trimTrailingSlashes(url: string): string {
  let end = url.length;
  while (end > 0 && url[end - 1] === '/') end -= 1;
  return url.slice(0, end);
}

export function buildResearchShareUrl(webBaseUrl: string, src: string): string {
  const trimmed = trimTrailingSlashes(webBaseUrl);
  return `${trimmed}/research/${RESEARCH_SHARE_SLUG}?src=${src}`;
}

function composeMessage(message: string, url: string): string {
  return `${message.trim()}\n\n${url}`;
}

export async function shareResearchSurvey(
  input: ResearchShareInput,
): Promise<ShareOutcome> {
  const url = buildResearchShareUrl(input.webBaseUrl, input.src);
  const body = composeMessage(input.message, url);

  if (Platform.OS === 'web') return shareViaWeb({ title: input.title, text: body, url });
  return shareViaNative({ message: body, title: input.title });
}
