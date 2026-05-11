// Shared inbox / chat list relative timestamps (FR-CHAT-001).

export function formatRelativeChatTime(iso: string | null | undefined): string {
  if (!iso) return '';
  const diffMin = Math.max(0, Math.round((Date.now() - Date.parse(iso)) / 60000));
  if (diffMin < 1) return 'עכשיו';
  if (diffMin < 60) return `לפני ${diffMin} דק'`;
  const hours = Math.round(diffMin / 60);
  if (hours < 24) return `לפני ${hours} שעות`;
  const days = Math.round(hours / 24);
  return `לפני ${days} ימים`;
}
