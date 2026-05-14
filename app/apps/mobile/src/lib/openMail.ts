// FR-AUTH-006 — VerificationPendingPanel "Open mail" action.
// Web: route to the user's webmail provider if recognisable, else `mailto:`.
// Native: callers use Linking.openURL('mailto:') directly; this helper is web-only.
import { Linking, Platform } from 'react-native';

export function resolveWebmailUrl(email: string): string {
  const at = email.lastIndexOf('@');
  if (at < 0 || at === email.length - 1) return 'mailto:';
  const domain = email.slice(at + 1).toLowerCase().trim();

  if (domain === 'gmail.com' || domain === 'googlemail.com') {
    return 'https://mail.google.com/mail/u/0/#inbox';
  }
  if (domain === 'outlook.com' || domain === 'hotmail.com' || domain === 'live.com' || domain === 'msn.com') {
    return 'https://outlook.live.com/mail/';
  }
  if (domain === 'yahoo.com' || domain === 'yahoo.co.uk' || domain === 'ymail.com') {
    return 'https://mail.yahoo.com/';
  }
  if (domain === 'icloud.com' || domain === 'me.com' || domain === 'mac.com') {
    return 'https://www.icloud.com/mail';
  }
  if (domain === 'proton.me' || domain === 'protonmail.com') {
    return 'https://mail.proton.me/';
  }
  return 'mailto:';
}

export async function openMail(email: string): Promise<void> {
  if (Platform.OS === 'web') {
    const url = resolveWebmailUrl(email);
    if (typeof window !== 'undefined') {
      window.open(url, '_blank', 'noopener,noreferrer');
    }
    return;
  }
  await Linking.openURL('mailto:');
}
