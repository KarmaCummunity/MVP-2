// app/apps/mobile/src/i18n/locales/he/modules/adminSurveys.ts
// FR-ADMIN-021 — Admin Portal survey results & free-feedback dashboard.
export const adminSurveysHe = {
  title: 'סקרים וחוות דעת',
  subtitle: 'סטטיסטיקות ותשובות פר משתמש',
  loading: 'טוען...',
  forbiddenTitle: 'אין לך הרשאת גישה לנתוני הסקרים.',
  errorTitle: 'אירעה שגיאה בטעינת הנתונים.',
  retry: 'נסה שוב',

  tabs: {
    surveys: 'סקרים',
    feedback: 'חוות דעת חופשיות',
  },

  overview: {
    emptyTitle: 'אין סקרים פעילים',
    emptyHint: 'סקרים שפורסמו יופיעו כאן עם נתוני המענה.',
    respondents: (n: number) => `${n} משיבים`,
    responses: (n: number) => `${n} תשובות`,
    questions: (n: number) => `${n} שאלות`,
    inactiveBadge: 'לא פעיל',
    lastResponse: (when: string) => `מענה אחרון: ${when}`,
    noResponses: 'אין מענה עדיין',
    versionLabel: (v: number) => `גרסה ${v}`,
  },

  stats: {
    sectionTitle: 'סטטיסטיקות לפי שאלה',
    avgLabel: 'ממוצע',
    responsesLabel: 'תשובות',
    noData: 'אין נתונים',
    distributionTitle: 'התפלגות דירוגים (1–7)',
  },

  respondents: {
    sectionTitle: 'תשובות פר משתמש',
    emptyTitle: 'אין תשובות עדיין',
    anonymous: 'משתמש ללא שם',
    submittedAt: (when: string) => `הוגש ${when}`,
    ratingLabel: (n: number) => `דירוג: ${n}/7`,
    noText: '(ללא הערה)',
  },

  feedback: {
    sectionTitle: 'חוות דעת חופשיות',
    emptyTitle: 'אין חוות דעת עדיין',
    emptyHint: 'חוות דעת חופשיות שמשתמשים שלחו יופיעו כאן.',
    anonymous: 'משתמש ללא שם',
    ratingLabel: (n: number) => `דירוג: ${n}/7`,
    noRating: 'ללא דירוג',
  },

  backToList: 'חזרה לרשימת הסקרים',
} as const;
