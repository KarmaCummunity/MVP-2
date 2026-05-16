// FR-CHAT-016 — chat strings split from main bundle (TD-35 file-size budget).
export const chatHe = {
  title: 'שיחות',
  noChats: 'אין שיחות עדיין',
  noChatsDesc: 'פנה למפרסמים ישירות מתוך הפוסטים.',
  inputPlaceholder: 'כתוב הודעה...',
  send: 'שלח',
  read: 'נקרא',
  defaultFirstMessage: 'היי! ראיתי את הפוסט שלך על {{title}}. מעוניין/ת לדעת עוד.',
  report: 'דווח על שיחה',
  menuDeleteFromInbox: 'הסר מהאינבוקס שלי',
  hideFromInboxTitle: 'להסיר את השיחה מהאינבוקס?',
  hideFromInboxBody:
    'השיחה תיעלם רק אצלך. אצל הצד השני נשארת ההיסטוריה. הודעה חדשה באותו שרשור עלולה להחזיר אותה לרשימה.',
  hideFromInboxCancel: 'ביטול',
  hideFromInboxConfirm: 'הסר',
  menuReport: 'דווח על השיחה',
  minutesAgoShort: "לפני {{count}} דק'",

  // InboxChatRow
  hideChatA11y: 'הסר שיחה מהאינבוקס',

  // AnchoredPostCard (FR-CHAT-014/015)
  anchoredOpenA11y: 'פתח את הפוסט',
  anchoredTypeGive: 'נותן',
  anchoredTypeRequest: 'מבקש',

  // ReportChatModal (FR-CHAT-010)
  reportChatTitle: 'דיווח על השיחה',
  reportChatNotePlaceholder: 'תיאור (אופציונלי, עד 500 תווים)',
  reportChatDuplicateBody: 'דיווחת על השיחה הזו ב-24 השעות האחרונות.',
  reportChatSubmitting: '...',
} as const;
