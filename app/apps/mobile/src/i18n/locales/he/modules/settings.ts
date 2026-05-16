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
      'שיחות שניהלת יישארו אצל האנשים שדיברת איתם. הם יראו את ההודעות שכתבת, אבל לא את שמך, התמונה או הפרופיל — רק "{{deletedUserLabel}}".',
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
  reportIssueScreen: {
    title: 'דווח על בעיה',
    copy: 'תאר את הבעיה ואנחנו נחזור אליך בהקדם.',
    categoryLabel: 'קטגוריה (אופציונלי)',
    categories: {
      Bug: 'באג / תקלה',
      Account: 'חשבון',
      Suggestion: 'הצעה',
      Other: 'אחר',
    } as Record<string, string>,
    descriptionLabel: 'תיאור (חובה)',
    descriptionPlaceholder: 'תאר את הבעיה... (לפחות 10 תווים)',
    descriptionMinLength: 'התיאור חייב להכיל לפחות 10 תווים',
    submitBtn: 'שלח ופתח שיחה',
    submitting: 'שולח...',
    errorGeneric: 'אירעה שגיאה. נסה שוב.',
    errorAdminNotFound: 'שירות התמיכה לא זמין. נסה שוב מאוחר יותר.',
  },
  devTools: 'כלי פיתוח',
  resetOnboarding: 'איפוס אונבורדינג (דיבוג)',
  resetting: 'מאפס...',
  simulateHardRefresh: 'סימולציית רענון מלא (דיבוג)',
  simulatingHardRefresh: 'מרענן...',
  version: 'KC - קהילת קארמה',
  resetOnboardingFailed: 'האיפוס נכשל: {{msg}}',
  resetOnboardingConfirmMsg: 'הפעולה תחזיר את מצב האונבורדינג להתחלה ותפתח את אשף ההרשמה מחדש. הפרופיל לא יימחק.\n\nלהמשיך?',
  resetOnboardingConfirmTitle: 'איפוס אונבורדינג',
  resetOnboardingBtn: 'איפוס',
  signOutFailed: 'ההתנתקות נכשלה. נסה שוב.',

  // Follow-requests inbox (FR-FOLLOW-007)
  followRequestsScreen: {
    headerTitle: 'בקשות עוקבים',
    empty: 'אין בקשות ממתינות.\nבקשות חדשות יופיעו כאן.',
    approve: 'אשר',
    reject: 'דחה',
    errorTitle: 'שגיאה',
    errorMessage: 'הפעולה נכשלה. נסו שוב.',
  },

  // Privacy screen (FR-PROFILE-005 / FR-PROFILE-006)
  privacyScreen: {
    privateProfileLabel: 'פרופיל פרטי',
    privateProfileHint: 'רק עוקבים מאושרים יראו את הפוסטים והעוקבים שלך.',
    followRequestsLink: 'בקשות עוקבים',
    followRequestsLinkWithCount: 'בקשות עוקבים ({{count}})',
    confirmPrivateTitle: 'להפוך את הפרופיל לפרטי?',
    confirmPublicTitle: 'להפוך את הפרופיל לציבורי?',
    confirmPrivateMessage:
      'בקשות עקיבה חדשות ידרשו אישור. עוקבים קיימים יישארו (אפשר להסיר אותם ידנית). פוסטים פתוחים יישארו פתוחים. תוכלי לפרסם פוסטים חדשים לעוקבים בלבד.',
    confirmPublicMessage:
      'כל הבקשות הממתינות יאושרו אוטומטית. פוסטים שפורסמו לעוקבים בלבד יישארו גלויים לכל עוקב חדש מעכשיו.',
    confirmPrivateCta: 'הפוך לפרטי',
    confirmPublicCta: 'הפוך לציבורי',
  },

  // Report-issue notify-modal title (FR-MOD-002 / FR-CHAT-007 AC3)
  reportIssueErrorTitle: 'שגיאה',
} as const;
