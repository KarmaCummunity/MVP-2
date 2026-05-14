// FR-SETTINGS strings split from main bundle (TD-35 file-size budget).
export const settingsHe = {
  title: 'הגדרות',
  account: 'חשבון',
  accountDetails: 'פרטי חשבון',
  notifications: 'התראות',
  notificationsOn: 'התראות מופעלות',
  privacy: 'פרטיות',
  statsSection: 'סטטיסטיקות',
  stats: 'סטטיסטיקות',
  support: 'תמיכה',
  legal: 'משפטי',
  termsAndPrivacy: 'תנאי שימוש ומדיניות פרטיות',
  about: 'אודות',
  logout: 'התנתקות',
  loggingOut: 'מתנתק...',
  deleteAccount: 'מחק חשבון',
  deleteAccountModal: {
    title: 'מחיקת חשבון לצמיתות',
    bullets: {
      posts: 'כל הפוסטים שלך יימחקו (כולל תמונות)',
      follows: 'כל העוקבים והנעקבים יוסרו',
      moderation: 'כל החסימות והדיווחים שהגשת יימחקו',
      donations: 'קישורי תרומה שהגדרת יימחקו',
      devices: 'כל המכשירים המחוברים שלך ינותקו',
    },
    chatsRetention:
      'שיחות שניהלת יישארו אצל האנשים שדיברת איתם. הם יראו את ההודעות שכתבת, אבל לא את שמך, התמונה או הפרופיל — רק "משתמש שנמחק".',
    warning:
      'הפעולה אינה הפיכה. הפוסטים, ההיסטוריה והקשרים שלך לא ניתנים לשחזור. אין חלון ביטול — המחיקה מיידית.',
    confirmInputLabel: 'הקלד "מחק" כדי לאשר',
    confirmInputPlaceholder: 'מחק',
    confirmKeyword: 'מחק',
    buttons: {
      cancel: 'ביטול',
      delete: 'מחק את החשבון לצמיתות',
      retry: 'נסה שוב',
      close: 'סגור',
    },
    errors: {
      recoverable: 'המחיקה נכשלה — נסה שוב',
      critical:
        'המחיקה לא הושלמה. הפוסטים והעוקבים שלך כבר נמחקו, אבל סגירת החשבון לא הסתיימה. חובה ללחוץ "נסה שוב" עכשיו — אם תסגור את האפליקציה ייווצר חשבון לא תקין.',
    },
    blocked: {
      title: 'לא ניתן למחוק חשבון מושעה',
      body: 'פנה לבירור דרך מסך הדיווחים.',
    },
    success: {
      title: 'חשבונך נמחק',
      subtitle: 'תודה שהיית חלק מקארמה.',
    },
  },
  privateProfileToggle: '🔒 פרופיל פרטי',
  followRequests: 'בקשות עקיבה',
  reportIssue: 'דווח על בעיה',
  devTools: 'כלי פיתוח',
  resetOnboarding: 'איפוס אונבורדינג (דיבוג)',
  resetting: 'מאפס...',
  simulateHardRefresh: 'סימולציית רענון מלא (דיבוג)',
  simulatingHardRefresh: 'מרענן...',
  version: 'KC - קהילת קארמה',
} as const;
