// ─────────────────────────────────────────────
// Hebrew (he) translation bundle — Karma Community
// Mapped to: R-MVP-Core-4 (עברית בלבד ב-MVP)
// Composed from `modules/*.ts`, `donations.ts`, and `stats.ts` for the 200-LOC cap.
// Default export: full Hebrew resource tree for `react-i18next` (`src/i18n/index.ts`).
// ─────────────────────────────────────────────

import { donations, search } from './donations';
import { chatHe } from './modules/chat';
import { notificationsHe } from './modules/notifications';
import { moderationHe, auditHe, accountBlockedHe } from './modules/moderation';
import { postHe } from './modules/post';
import { settingsHe } from './modules/settings';
import { stats } from './stats';

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
      'מחברים בין מי שרוצה לתת, למי שצריך לקבל. פשוט, מקומי, וחינמי לחלוטין.',
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
  },

  // Feed
  feed: {
    title: 'פיד ראשי',
    filters: 'סננים',
    clearFilters: 'נקה סינון',
    activeFilters: '{{count}} סננים פעילים',
    giveType: '🎁 לתת',
    requestType: '🔍 לבקש',
    allTypes: 'הכל',
    searchPlaceholder: 'חפש לפי מוצר, קטגוריה...',
    noResults: 'לא נמצאו פוסטים',
    noResultsDesc: 'נסה לשנות את הסינון או חפש בכל הערים.',
    loadMore: 'טעון עוד',
    guestBanner: 'הצטרף לקהילה כדי לראות את כל הפוסטים הפעילים באזור שלך',
    guestBannerWithCount: 'הצטרף לקהילה כדי לראות עוד {{count}} פוסטים פעילים באזור שלך',
    joinNow: 'הצטרף עכשיו',
    firstPostNudge: 'פרסם את הפוסט הראשון שלך! 🎁',
    closedTag: '🔒 נמסר',
    followersTag: '👥 לעוקבים בלבד',
    refreshSuccess: 'הפיד עודכן',
    refreshFailed: 'הרענון נכשל — נסה שוב',
  },

  // Post — see modules/post.ts
  post: postHe,

  // Profile
  profile: {
    myProfile: 'הפרופיל שלי',
    editProfile: 'ערוך פרופיל',
    shareProfile: 'שתף פרופיל',
    followers: 'עוקבים',
    following: 'נעקבים',
    activePosts: 'פוסטים פעילים',
    closedPosts: 'פוסטים שנמסרו',
    follow: 'עקוב',
    following_btn: 'מעקב פעיל ✓',
    requestSent: 'בקשה נשלחה ⏳',
    sendMessage: 'שלח הודעה',
    privateProfile: '🔒 הפרופיל פרטי. שלח בקשת עקיבה כדי לראות פוסטים.',
  },

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

  // About
  aboutContent: {
    title: 'אודות קהילת קארמה',
    tagline: 'קהילה של נתינה. בלי כסף. בלי תמורה.',
    visionTitle: 'החזון שלנו',
    visionText: 'קהילת קארמה הוקמה במטרה לייצר מרחב שיתופי חינמי לחלוטין. מקום שבו חפצים עוברים מיד ליד, לא בגלל כסף, אלא בגלל רצון טוב. אנחנו מאמינים שלכל חפץ יש ערך גם אחרי שסיימנו להשתמש בו, ולכל אדם יש מה לתת ומה לקבל.',
    howItWorksTitle: 'איך זה עובד?',
    howItWorksText: 'זה פשוט: מפרסמים חפצים שאין בהם צורך, או מבקשים חפצים שזקוקים להם. המערכת מחברת בין האנשים באזור, והכל נעשה מתוך רצון טוב, ללא תמורה וללא חליפין.',
    contactTitle: 'יצירת קשר',
    contactText: 'נשמח לשמוע מכם על כל רעיון, הצעה או בעיה. ניתן לפנות אלינו דרך אפשרות ״דיווח על בעיה״ במסך ההגדרות, או במייל: karmacommunity2.0@gmail.com',
  },

  // Donations (D-16, FR-DONATE-001..005) — see donations.ts
  donations,

  // Search (D-16, FR-FEED-016) — see donations.ts
  search,

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
    now: 'עכשיו',
    today: 'היום',
    yesterday: 'אתמול',
    minutesAgo: 'לפני {{count}} דקות',
    hoursAgo: 'לפני {{count}} שעות',
    daysAgo: 'לפני {{count}} ימים',
  },
} as const;

export default he;
