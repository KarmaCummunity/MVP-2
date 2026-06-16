// FR-PROFILE-008 — share a profile via the OS native share sheet (mobile) or
// `navigator.share` with a clipboard fallback (Web). Builds the canonical
// profile URL, then delegates the platform mechanics to `shareViaSheet`.
// Never throws; returns a discriminated-union outcome.

import { Platform } from 'react-native';

import { buildProfileShareUrl } from './buildProfileShareUrl';
import { shareViaNative, shareViaWeb, type ShareOutcome } from './shareViaSheet';

export type ProfileShareInput = Readonly<{
  handle: string;
  title: string;
  message: string;
  webBaseUrl: string;
}>;

export type ShareProfileOutcome = ShareOutcome;

export async function shareProfile(input: ProfileShareInput): Promise<ShareOutcome> {
  const url = buildProfileShareUrl(input.handle, input.webBaseUrl);

  if (Platform.OS === 'web') {
    return shareViaWeb({ title: input.title, text: input.message, url });
  }
  return shareViaNative({ message: `${input.message}\n${url}`, title: input.title });
}
