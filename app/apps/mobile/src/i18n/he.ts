// ─────────────────────────────────────────────
// Hebrew translations — Karma Community
// Mapped to: R-MVP-Core-4 (עברית בלבד ב-MVP)
// Domains split into separate files to keep this file under its size budget (TD-35).
// ─────────────────────────────────────────────

import { donations, search } from './donations';
import { stats } from './stats';

const he = {
  // App
  appName: 'קארמה קהילה',

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
    stepBasic: 'פרטים בסיסיים',
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
  },

  // Post
  post: {
    give: 'לתת חפץ',
    request: 'לבקש חפץ',
    title: 'כותרת',
    titlePlaceholder: 'מה אתה נותן/מבקש?',
    description: 'תיאור (אופציונלי)',
    descPlaceholder: 'פרטים נוספים על החפץ...',
    category: 'קטגוריה',
    condition: 'מצב החפץ',
    urgency: 'דחיפות (אופציונלי)',
    urgencyPlaceholder: 'לדוגמה: צריך עד שישי',
    photos: 'תמונות',
    addPhoto: 'הוסף תמונה',
    address: 'כתובת',
    cityLabel: 'עיר',
    streetLabel: 'רחוב',
    streetNumberLabel: 'מספר',
    locationDisplay: 'מה להציג בפיד',
    cityOnly: 'עיר בלבד',
    cityAndStreet: 'עיר + רחוב',
    fullAddress: 'כתובת מלאה',
    visibility: 'מי יראה את הפוסט',
    visibilityPublic: '🌍 כולם',
    visibilityFollowers: '👥 רק עוקבים שלי',
    visibilityOnlyMe: '🔒 רק אני',
    publish: 'פרסם',
    draft: 'שמור טיוטה',
    publishSuccess: '✅ הפוסט שלך פורסם!',
    draftRestored: 'יש לך טיוטה שלא פורסמה',
    continueDraft: 'המשך לערוך',
    discardDraft: 'התחל מחדש',
    sendMessage: '💬 שלח הודעה למפרסם',
    followAuthor: 'עקוב אחרי המפרסם',
    report: 'דווח',
    markDelivered: 'סמן כ-נמסר',
    edit: 'ערוך',
    delete: 'מחק',
    reopen: '📤 פתח מחדש',
    conditionNew: 'חדש',
    conditionLikeNew: 'כמו חדש',
    conditionGood: 'טוב',
    conditionFair: 'בינוני',
    photoRequired: 'תמונה נדרשת עבור פוסט "לתת"',
    maxPhotos: 'מקסימום 5 תמונות',
    maxPosts: 'הגעת למקסימום 20 פוסטים פעילים',
  },

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

  // Chat
  chat: {
    title: 'שיחות',
    noChats: 'אין שיחות עדיין',
    noChatsDesc: 'פנה למפרסמים ישירות מתוך הפוסטים.',
    inputPlaceholder: 'כתוב הודעה...',
    send: 'שלח',
    read: 'נקרא',
    defaultFirstMessage: 'היי! ראיתי את הפוסט שלך על {{title}}. מעוניין/ת לדעת עוד.',
    report: 'דווח על שיחה',
  },

  // Settings
  settings: {
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
    version: 'קארמה קהילה',
  },

  // Stats (FR-STATS-001..004) — see stats.ts
  stats,

  // Legal
  legalContent: {
    title: 'תנאי שימוש ומדיניות פרטיות',
    lastUpdated: 'עודכן לאחרונה: מאי 2026',
    termsTitle: 'תנאי שימוש',
    termsText: 'ברוכים הבאים לקארמה קהילה. השימוש באפליקציה מהווה הסכמה לתנאים אלו. האפליקציה נועדה למסירה וקבלת חפצים בחינם בלבד. חל איסור מוחלט על סחר, מכירה, או דרישת תמורה כלשהי. המשתמש אחראי בלעדית על טיב החפצים שהוא מוסר. אין לפרסם תוכן פוגעני, שקרי או מפר זכויות יוצרים. הנהלת האפליקציה שומרת לעצמה את הזכות להסיר תכנים או לחסום משתמשים שיפרו כללים אלו.',
    privacyTitle: 'מדיניות פרטיות',
    privacyText: 'פרטיותכם חשובה לנו. אנו אוספים מידע בסיסי כגון שם, עיר ומיקום למטרת הצגת הפוסטים בקהילה בלבד. איננו משתפים מידע זה עם צדדים שלישיים ללא הסכמתכם. הכתובת המלאה תוצג אך ורק בהתאם להגדרת הפרטיות שתבחרו בכל פוסט. האפליקציה משתמשת בשירותי התחברות מאובטחים (Google/Apple) ואינה שומרת סיסמאות שרת. ניתן לבקש מחיקת חשבון וכלל הנתונים דרך הגדרות האפליקציה.',
  },

  // About
  aboutContent: {
    title: 'אודות קארמה קהילה',
    tagline: 'יחד בונים קהילה חזקה יותר, פריט אחר פריט.',
    visionTitle: 'החזון שלנו',
    visionText: 'קארמה קהילה הוקמה במטרה לייצר מרחב שיתופי חינמי לחלוטין. מקום שבו חפצים עוברים מיד ליד, לא בגלל כסף, אלא בגלל רצון טוב. אנחנו מאמינים שלכל חפץ יש ערך גם אחרי שסיימנו להשתמש בו, ולכל אדם יש מה לתת ומה לקבל.',
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
