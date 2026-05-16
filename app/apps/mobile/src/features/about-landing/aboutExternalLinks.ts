/**
 * Centralized outbound URLs for About → Contact (no user-facing copy here).
 * Update invite links here only; labels live in i18n.
 */
const MAIL_SUBJECT_DEFAULT = 'פנייה מקהילת קארמה';

export const ABOUT_MAILTO_NAVE = `mailto:karmacommunity2.0@gmail.com?subject=${encodeURIComponent(MAIL_SUBJECT_DEFAULT)}`;
export const ABOUT_MAILTO_ORG = `mailto:support@karma.community?subject=${encodeURIComponent(MAIL_SUBJECT_DEFAULT)}`;

/** Community WhatsApp — replace with a stable `chat.whatsapp.com` invite when issued. */
export const ABOUT_WHATSAPP_GROUP_URL =
  'https://wa.me/972528616878?text=' +
  encodeURIComponent('היי, אשמח לקבל קישור לקבוצת הווטסאפ של קארמה.');

export const ABOUT_WHATSAPP_PERSONAL_URL =
  'https://wa.me/972528616878?text=' + encodeURIComponent('היי נוה, פנייה מקהילת קארמה.');

export const ABOUT_INSTAGRAM_PROFILE_URL = 'https://www.instagram.com/karma_community_/';
export const ABOUT_INSTAGRAM_EMBED_URL = `${ABOUT_INSTAGRAM_PROFILE_URL}embed/`;

/** Shown in donation note — direct support outside the app (Bit / PayBox). */
export const ABOUT_DONATION_PHONE_DISPLAY = '0528616878';
