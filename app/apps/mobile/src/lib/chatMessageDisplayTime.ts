// User-visible timestamps on chat bubbles — FR-CHAT-002 AC2.

function sameLocalCalendarDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

/** Shown when the user taps a bubble: time-only today; short date + time on older days. */
export function formatMessageBubbleTime(iso: string, now: Date = new Date()): string {
  const d = new Date(iso);
  const time = d.toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' });
  if (sameLocalCalendarDay(d, now)) return time;
  const datePart = d.toLocaleDateString('he-IL', { day: 'numeric', month: 'short' });
  return `${datePart} · ${time}`;
}
