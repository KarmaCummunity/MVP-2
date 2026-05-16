// ─────────────────────────────────────────────
// Hebrew (he) translation bundle — Karma Community
// Mapped to: R-MVP-Core-4 (עברית בלבד ב-MVP)
// Composed from `modules/*.ts`, `donations.ts`, and `stats.ts` for the 200-LOC cap.
// Default export: full Hebrew resource tree for `react-i18next` (`src/i18n/index.ts`).
// ─────────────────────────────────────────────

import { donations, search } from './donations';
import { errorsHe } from './modules/errors';
import { chatHe } from './modules/chat';
import { notificationsHe } from './modules/notifications';
import { moderationHe, auditHe, accountBlockedHe } from './modules/moderation';
import { postHe } from './modules/post';
import { settingsHe } from './modules/settings';
import { stats } from './stats';
import { aboutContentMerged } from './modules/aboutContentBundle';
import { tabsHe } from './modules/tabs';
import { errorBoundaryHe, devBannerHe, optionsMenuHe } from './modules/ui';
import { feedHe } from './modules/feed';
import { profileHe } from './modules/profile';
import { closureHe } from './modules/closure';
import { filtersHe } from './modules/filters';

const he = {
  // App
  appName: 'KC - קהילת קארמה',

  // Auth
  auth: {
    welcome: 'ברוכים הבאים',
    tagline: 'תן. קבל. חבר קהילה.',
    continueWithGoogle: 'המשך עם Google',
    continueWithApple: 'המשך עם Apple',
    continueWithPhone: 'המשך עם מספר טלפון',
    continueWithEmail: 'המשך עם דוא"ל',
    orDivider: 'או',
    guestPreview: 'הצץ בפיד',
    guestPreviewBackA11y: 'חזרה למסך הנחיתה',
    signIn: 'כניסה',
    signUp: 'הרשמה',
    email: 'דוא"ל',
    password: 'סיסמה',
    forgotPassword: 'שכחתי סיסמה',
    noAccount: 'אין לי חשבון עדיין',
    hasAccount: 'יש לי כבר חשבון',
    phone: 'מספר טלפון',
    otpCode: 'קוד אימות',
    otpSent: 'שלחנו קוד SMS ל-{{phone}}',
    verify: 'אמת',
    resendOtp: 'שלח שוב',
    bySigningUp: 'בהרשמה אתה מסכים לתנאי השימוש ומדיניות הפרטיות שלנו.',
  },

  // Onboarding
  onboarding: {
    aboutIntroTitle: 'ברוכים הבאים לקארמה',
    aboutIntroBody:
      'מחברים בין מי שרוצה לתת, למי שצריך לקבל. פשוט, חברי, וחינמי לחלוטין.',
    aboutIntroCta: 'מתחילים',
    pillarFree: 'חינמי לחלוטין',
    pillarNoAds: 'בלי פרסומות',
    pillarNonProfit: 'ללא רווחים',
    stepBasic: 'פרטים בסיסיים',
    basicInfoSubtitle:
      ' וודא את השם ומלא את הכתובת שלך — כדי שנוכל להתאים פוסטים אליך. אפשר להשלים גם בהמשך.',
    displayName: 'שם מלא',
    city: 'עיר מגורים',
    stepPhoto: 'תמונת פרופיל',
    uploadPhoto: 'העלה תמונה',
    skip: 'דלג',
    continue: 'המשך',
    stepWelcome: 'ברוכים הבאים לקהילה!',
    welcomeDesc: 'כאן תוכל לתת ולקבל חפצים בחינם מוחלט — ללא כסף, ללא חליפין.',
    howItWorks: 'איך זה עובד?',
    step1Title: 'פרסם מה יש לך לתת',
    step1Desc: 'תמונה + כמה מילים — וזהו.',
    step2Title: 'בקש מה שאתה צריך',
    step2Desc: 'פרסם בקשה ומישהו מהקהילה יענה.',
    step3Title: 'תאם מסירה',
    step3Desc: 'שוחח ישירות עם הנותן/מקבל.',
    letsGo: 'יאללה, מתחילים!',
    stepProgress: 'שלב {{step}} מתוך 4',
  },

  // Feed — see modules/feed.ts
  feed: feedHe,

  // Post — see modules/post.ts
  post: postHe,

  // Profile — see modules/profile.ts
  profile: profileHe,

  // Closure (FR-CLOSURE-001..005) — see modules/closure.ts
  closure: closureHe,

  // Filters (FR-FEED-004/005/006/018/020) — see modules/filters.ts
  filters: filtersHe,

  // Chat — see modules/chat.ts (FR-CHAT-016)
  chat: chatHe,

  // Notifications (FR-NOTIF-001..015) — see modules/notifications.ts
  notifications: notificationsHe,

  // Moderation (FR-MOD-007/010 + FR-ADMIN-002..007) — see modules/moderation.ts
  moderation: moderationHe,
  audit: auditHe,
  accountBlocked: accountBlockedHe,

  // Settings — see modules/settings.ts
  settings: settingsHe,

  // Stats (FR-STATS-001..004) — see stats.ts
  stats,

  // Legal
  legalContent: {
    title: 'תנאי שימוש ומדיניות פרטיות',
    lastUpdated: 'עודכן לאחרונה: מאי 2026',
    termsTitle: 'תנאי שימוש',
    termsText: 'ברוכים הבאים לקהילת קארמה. השימוש באפליקציה מהווה הסכמה לתנאים אלו. האפליקציה נועדה למסירה וקבלת חפצים בחינם בלבד. חל איסור מוחלט על סחר, מכירה, או דרישת תמורה כלשהי. המשתמש אחראי בלעדית על טיב החפצים שהוא מוסר. אין לפרסם תוכן פוגעני, שקרי או מפר זכויות יוצרים. הנהלת האפליקציה שומרת לעצמה את הזכות להסיר תכנים או לחסום משתמשים שיפרו כללים אלו.',
    privacyTitle: 'מדיניות פרטיות',
    privacyText: 'פרטיותכם חשובה לנו. אנו אוספים מידע בסיסי כגון שם, עיר ומיקום למטרת הצגת הפוסטים בקהילה בלבד. איננו משתפים מידע זה עם צדדים שלישיים ללא הסכמתכם. הכתובת המלאה תוצג אך ורק בהתאם להגדרת הפרטיות שתבחרו בכל פוסט. האפליקציה משתמשת בשירותי התחברות מאובטחים (Google/Apple) ואינה שומרת סיסמאות שרת. ניתן לבקש מחיקת חשבון וכלל הנתונים דרך הגדרות האפליקציה.',
  },

  // About — see modules/aboutContentBundle.ts (FR-SETTINGS About narrative)
  aboutContent: aboutContentMerged,

  // Donations (D-16, FR-DONATE-001..005) — see donations.ts
  donations,

  // Search (D-16, FR-FEED-016) — see donations.ts
  search,

  // Tab labels — see modules/tabs.ts
  tabs: tabsHe,

  // Error messages (auth/post/profile/media/createPost) — see modules/errors.ts
  errors: errorsHe,

  // Misc chrome — see modules/ui.ts
  errorBoundary: errorBoundaryHe,
  devBanner: devBannerHe,
  optionsMenu: optionsMenuHe,

  // General
  general: {
    loading: 'טוען...',
    error: 'אירעה שגיאה',
    retry: 'נסה שוב',
    cancel: 'ביטול',
    confirm: 'אישור',
    save: 'שמור',
    delete: 'מחק',
    yes: 'כן',
    no: 'לא',
    back: 'חזרה',
    close: 'סגור',
    gotIt: 'הבנתי',
    now: 'עכשיו',
    today: 'היום',
    yesterday: 'אתמול',
    minutesAgo: 'לפני {{count}} דקות',
    hoursAgo: 'לפני {{count}} שעות',
    daysAgo: 'לפני {{count}} ימים',
  },
} as const;

export default he;
