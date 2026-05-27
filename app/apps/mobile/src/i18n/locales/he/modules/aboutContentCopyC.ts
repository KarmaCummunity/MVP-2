/** Hebrew About landing — roadmap, goals, contributions, contact (v1.0 master narrative). */
export const aboutContentCopyC = {
  // Roadmap (legacy text keys kept for backward compat with text rendering)
  roadmapTitle: 'מפת הדרכים — שלבים אל החזון',
  roadmapPhase1Title: 'שלב א׳ — ליבה יציבה (מה שכבר עובד)',
  roadmapPhase1Body:
    'זהות, פוסטים, צ׳אט, פרטיות, דיווחים, סטטיסטיקות בסיסיות, ו-9 קטגוריות תרומה — כדי שהקהילה תוכל לגדול על בסיס אמון.',
  roadmapPhase2Title: 'שלב ב׳ — עומק קהילתי',
  roadmapPhase2Body:
    'זרמים פנימיים לזמן, כסף וידע בתוך האפליקציה. שיפורי גילוי, בטיחות, פיקוח שקוף, וגשרים לארגונים ולשכונות.',
  roadmapPhase3Title: 'שלב ג׳ — השפעה רחבה',
  roadmapPhase3Body:
    'שותפויות עם עמותות, אירועים קהילתיים, חינוך לנתינה אחראית, מובילי קהילה, וזרמים פנימיים לכל 9 הקטגוריות.',
  roadmapPhase4Title: 'שלב ד׳ — מעבר לחפצים',
  roadmapPhase4Body:
    'הרחבה בינלאומית, KC כצינור שקוף לתרומות לעמותות אחרות בעולם, מנגנון הצבעות לכל המשתמשים מעל תקנון ברזל קבוע.',

  // Goals (list UI — aboutContentUxRefreshPartA)
  goalsTitle: 'המטרות שלנו',

  // Contributions — "9 ways to give, all live in the app today"
  contributionsTitle: '9 דרכים לתת — כולן חיות באפליקציה היום',
  contributionsText:
    'בלשונית "תרומות" באפליקציה: חפצים מלאים, זמן וכסף עם אינטגרציות, ועוד 6 קטגוריות עם קישורים אוצרים לעמותות.\n\n' +
    'יש המון דרכים לתת. אנחנו לא נגביל אתכם רק למה שבנינו — KC הוא המרכז של עשייה טובה, לא רק האפליקציה שלנו. ייפתחו לפעולה ישירה לפי הקצב שמכבד בטיחות ואמון.',

  // Badge labels for the contributions tiles
  contributionsAvailableBadge: 'זמין',
  contributionsComingSoonBadge: 'בקרוב',
  contributionsBridgeBadge: 'גשר חיצוני',
  contributionsPortalBadge: 'קישורים אוצרים',

  // Structured contributions (9 categories, 3-tier depth per v1.0 §8)
  contributionsList: [
    { icon: 'gift-outline', label: 'חפצים וציוד', available: true },
    { icon: 'hand-right-outline', label: 'זמן והתנדבות', available: false },
    { icon: 'cash-outline', label: 'כסף — לקארמה ולעמותות אחרות', available: false },
    { icon: 'nutrition-outline', label: 'אוכל', available: false },
    { icon: 'home-outline', label: 'דיור', available: false },
    { icon: 'car-outline', label: 'תחבורה', available: false },
    { icon: 'book-outline', label: 'ידע ומומחיות', available: false },
    { icon: 'paw-outline', label: 'חיות', available: false },
    { icon: 'medkit-outline', label: 'רפואה', available: false },
  ],

  // Contact (channels — aboutContentUxRefreshPartB)
  contactTitle: 'יצירת קשר',
  contactCta: 'פנייה לתמיכה באפליקציה',
} as const;
