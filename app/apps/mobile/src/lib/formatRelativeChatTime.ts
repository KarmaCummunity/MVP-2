// Shared inbox / chat list relative timestamps (FR-CHAT-001).
import i18n from '../i18n';

export function formatRelativeChatTime(iso: string | null | undefined): string {
  if (!iso) return '';
  const diffMin = Math.max(0, Math.round((Date.now() - Date.parse(iso)) / 60000));
  if (diffMin < 1) return i18n.t('general.now');
  if (diffMin < 60) return i18n.t('chat.minutesAgoShort', { count: diffMin });
  const hours = Math.round(diffMin / 60);
  if (hours < 24) return i18n.t('general.hoursAgo', { count: hours });
  const days = Math.round(hours / 24);
  return i18n.t('general.daysAgo', { count: days });
}
