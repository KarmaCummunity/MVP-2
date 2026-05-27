// Public market research strings — FR-RESEARCH-001..003.
// Survey B (public web-only form) — web-only routes /research/[slug] and /research/thanks.
export const researchHe = {
  // Survey intro block (rendered above Q1, design spec §9)
  introHeading: 'לפני שאת/ה מתחיל/ה — שתי שורות.',
  introLine1: 'אנחנו בונים אפליקציה ישראלית לנתינה בחינם, בלי הבלגן של הקבוצות.',
  introLine2: '11 שאלות. אנונימי לגמרי. ~4 דקות.',
  introLine3: 'כל תשובה כאן משנה איך האפליקציה תיראה בפועל. תודה.',

  // Progress
  progress: 'שאלה {{current}} מתוך {{total}}',
  progressHint: 'ניתן לנווט בחופשיות',
  questionIndex: 'שאלה {{index}}',

  // Fields
  ratingFieldLabel: 'דירוג (1–7, חובה)',
  textFieldLabel: 'פירוט (אופציונלי)',

  // Q11 contact section (last question — "שיחה איתנו")
  contactSectionTitle: 'פרטי יצירת קשר (אופציונלי)',
  contactEmailLabel: 'מייל ליצירת קשר',
  contactEmailPlaceholder: 'your@email.com',
  contactWindowLabel: 'שעה שנוחה לשיחה',
  contactWindowPlaceholder: 'לדוגמה: ימים א׳–ה׳ אחרי 18:00',

  // Submit
  submitBtn: 'שלח תשובות',
  submitting: 'שולח...',
  submitRequiresAllRatings: 'יש לדרג את כל השאלות לפני שליחה',

  // Loading
  loading: 'טוען סקר...',

  // Error states (mapped from PublicResearchErrorCode)
  errorRateLimited: 'ניסית כבר היום, ננסה שוב בעוד דקה',
  errorCircuitOpen: 'השרת עמוס כרגע, נסה שוב בעוד כמה דקות',
  errorSurveyNotFound: 'הסקר הזה לא פעיל',
  errorGeneric: 'אירעה שגיאה, נסה שוב',
  retryBtn: 'נסה שוב',

  // Thank-you page (design spec §9)
  thanksHeading: 'תודה. ברצינות.',
  thanksLine1: 'קראנו כל מילה — וזה משנה את מה שאנחנו בונים עכשיו.',
  thanksEmailOptInLabel: 'רוצה לראות את האפליקציה ראשון/ה כשהיא יוצאת?',
  thanksEmailPlaceholder: 'השאר/י מייל',
  thanksVisitCta: 'בקר/י באתר קארמה',
} as const;
