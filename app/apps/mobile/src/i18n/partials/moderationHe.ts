// FR-MOD-007/010 + FR-ADMIN-002..007 — moderation strings (TD-35 file-size budget).
export const moderationHe = {
  report: {
    user: {
      title: 'דווח על משתמש',
      reasonLabel: 'סיבת הדיווח',
      noteLabel: 'הערה (אופציונלי, עד 500 תווים)',
      submit: 'שלח דיווח',
      successToast: '✅ הדיווח התקבל. הצוות שלנו יבדוק.',
      duplicateError: 'כבר דיווחת על משתמש זה ב-24 השעות האחרונות.',
    },
  },
  reasons: {
    spam: 'ספאם',
    offensive: 'תוכן פוגעני',
    misleading: 'מטעה',
    illegal: 'בלתי-חוקי',
    other: 'אחר',
  },
  ban: {
    title: 'חסימת משתמש',
    reasonLabel: 'סיבת החסימה',
    reasons: {
      spam: 'ספאם',
      harassment: 'הטרדה',
      policy_violation: 'הפרת מדיניות',
      other: 'אחר',
    },
    noteLabel: 'הערות נוספות',
    submit: 'חסום',
    confirmCopy: 'פעולה זו לצמיתות ואינה ניתנת לביטול. להמשיך?',
    successToast: 'המשתמש נחסם.',
  },
  bubble: {
    reportReceived: {
      title: 'דיווח התקבל',
      body: 'דיווח על {target_type} · {reason} · {count}/3',
    },
    autoRemoved: {
      title: 'הוסר אוטומטית',
      body: '{target_type} הוסר לאחר 3 דיווחים',
    },
    modActionTaken: {
      body: '✅ טופל ע״י אדמין · {action} · {time}',
    },
    ownerAutoRemoved: {
      body: 'הפוסט שלך הוסר אוטומטית בעקבות דיווחים חוזרים. אם זו טעות, ניתן לערער דרך כתובת התמיכה.',
    },
  },
  actions: {
    restore: '↩ שחזר',
    dismiss: '🗑 דחה דיווח',
    confirm: '✓ אשר הסרה',
    ban: '🚫 חסום משתמש',
    removePost: '🗑 הסר פוסט',
    deleteMessage: '🗑 מחק הודעה',
    cancel: 'ביטול',
    proceed: 'המשך',
    confirmModal: {
      restore: 'פעולה זו תסמן את הדיווחים על המטרה כשגויים, מה שעלול לגרור סנקציה לרֶפּוֹרְטֵרים. להמשיך?',
      dismiss: 'סמן דיווח זה כשגוי. אין השפעה על דיווחים אחרים. להמשיך?',
      confirm: 'אשר את ההסרה האוטומטית כהפרה ודאית. להמשיך?',
      ban: 'פעולה זו לצמיתות ואינה ניתנת לביטול. להמשיך?',
      removePost: 'הסר פוסט זה כאדמין. להמשיך?',
      deleteMessage: 'מחק הודעה זו לצמיתות. להמשיך?',
    },
    success: {
      restore: 'המטרה שוחזרה.',
      dismiss: 'הדיווח נדחה.',
      confirm: 'הדיווח אושר.',
      ban: 'המשתמש נחסם.',
      removePost: 'הפוסט הוסר.',
      deleteMessage: 'ההודעה נמחקה.',
    },
    errors: {
      forbidden: 'אין לך הרשאה לפעולה זו.',
      invalidRestoreState: 'לא ניתן לשחזר את המטרה במצבה הנוכחי.',
      networkError: 'תקלה ברשת. נסה שוב.',
    },
  },
} as const;

export const auditHe = {
  title: 'אאודיט',
  searchPlaceholder: 'חפש משתמש לפי שם...',
  noResults: 'אין תוצאות.',
  loading: 'טוען...',
  metadataLabel: 'מטא-דאטה',
  rowAction: {
    block_user: 'חסימה',
    unblock_user: 'ביטול חסימה',
    report_target: 'דיווח',
    auto_remove_target: 'הסרה אוטומטית',
    manual_remove_target: 'הסרה ידנית',
    restore_target: 'שחזור',
    suspend_user: 'השעיה',
    unsuspend_user: 'החזרה לפעילות',
    ban_user: 'חסימה לצמיתות',
    false_report_sanction_applied: 'סנקציה על דיווחי שווא',
    dismiss_report: 'דחיית דיווח',
    confirm_report: 'אישור דיווח',
    delete_message: 'מחיקת הודעה',
  },
} as const;

export const accountBlockedHe = {
  banned: {
    title: 'החשבון נחסם לצמיתות',
    body: 'החשבון שלך נחסם בעקבות הפרת מדיניות הקהילה.',
    cta: 'יצירת קשר',
  },
  suspendedAdmin: {
    title: 'החשבון הושעה',
    body: 'המוֹדֶרציָה השעתה את החשבון שלך עד לבירור.',
    cta: 'ערעור',
  },
  suspendedForFalseReports: {
    title: 'החשבון מושעה זמנית',
    body: 'החשבון שלך מושעה עד {until} עקב 5 דיווחים שגויים ב-30 הימים האחרונים.',
    cta: 'ערעור מוקדם',
  },
} as const;
