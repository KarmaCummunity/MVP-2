/** Hebrew About landing — roadmap, goals, contributions, team, contact. */
export const aboutContentCopyC = {
  // Roadmap (legacy text keys kept for backward compat with text rendering)
  roadmapTitle: 'מפת הדרכים — שלבים אל החזון',
  roadmapPhase1Title: 'שלב א׳ — ליבה יציבה (MVP)',
  roadmapPhase1Body:
    'זהות, פוסטים, צ׳אט, פרטיות, דיווחים, סטטיסטיקות בסיסיות וחוויית שימוש נקייה — כדי שהקהילה תוכל לגדול על בסיס אמון.',
  roadmapPhase2Title: 'שלב ב׳ — עומק קהילתי',
  roadmapPhase2Body:
    'שיפורי גילוי, בטיחות, פיקוח שקוף, חוויית onboarding טובה יותר, וכלים שמחברים בין קארמה לארגונים ולשכונות.',
  roadmapPhase3Title: 'שלב ג׳ — השפעה רחבה',
  roadmapPhase3Body:
    'שותפויות עם עמותות, אירועים קהילתיים, חינוך לנתינה אחראית, ומודלים שמאפשרים למובילי קהילה לנהל מרחבים בריאים.',
  roadmapPhase4Title: 'שלב ד׳ — טווח ארוך',
  roadmapPhase4Body:
    'הרחבות שמשרתות את החזון בלי למכור את המשתמשים: נתינת זמן ומומחיות, חיבור למעגלים רחבים, וכלים שמודדים את הטוב שממשיך להיווצר בשטח.',

  // Goals (list UI — aboutContentUxRefreshPartA)
  goalsTitle: 'המטרות שלנו',

  // Contributions
  contributionsTitle: 'סוגי תרומה — היום ובעתיד',
  contributionsText:
    'בהמשך הדרך נרחיב את סוגי הנתינה: נתינת זמן (התנדבות ממוקדת) שתישקל בזהירות מול עומס המקבלים, נתינת מומחיות (ליווי, הדרכה, סיוע טכני), חיבור לארגונים מאומתים, וקמפיינים קהילתיים לאיסוף ציוד לפי צורך אמיתי.\n\n' +
    'כל אלה ייכנסו רק כשהבטיחות והפרטיות יהיו מוכנות. אנחנו לא ממהרים לפיצ׳ר על חשבון אמון.',

  // Badge labels for the contributions tiles
  contributionsAvailableBadge: 'זמין',
  contributionsComingSoonBadge: 'בקרוב',

  // Structured contributions (for the new visual tile grid)
  contributionsList: [
    { icon: 'gift-outline', label: 'חפצים וציוד', available: true },
    { icon: 'nutrition-outline', label: 'מזון ומוצרי בסיס', available: true },
    { icon: 'book-outline', label: 'ידע והדרכה', available: true },
    { icon: 'hand-right-outline', label: 'התנדבות ועזרה', available: true },
    { icon: 'time-outline', label: 'נתינת זמן ומומחיות', available: false },
    { icon: 'business-outline', label: 'חיבור לעמותות', available: false },
    { icon: 'megaphone-outline', label: 'קמפיינים קהילתיים', available: false },
    { icon: 'medkit-outline', label: 'סיוע ייעודי', available: false },
  ],

  // Contact (channels — aboutContentUxRefreshPartB)
  contactTitle: 'יצירת קשר',
  contactCta: 'פנייה לתמיכה באפליקציה',
} as const;
