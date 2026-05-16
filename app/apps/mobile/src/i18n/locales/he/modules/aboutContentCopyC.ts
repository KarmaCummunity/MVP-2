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

  // Structured phases (for the new vertical timeline UI).
  // `severity` is locale-agnostic — the timeline component keys color off it.
  roadmapPhases: [
    {
      label: 'שלב א׳',
      severity: 'current',
      status: 'עכשיו',
      title: 'ליבה יציבה (MVP)',
      body: 'זהות, פוסטים, צ׳אט, פרטיות, דיווחים, וסטטיסטיקות בסיסיות — בסיס שמאפשר לקהילה לגדול על אמון.',
    },
    {
      label: 'שלב ב׳',
      severity: 'soon',
      status: 'בקרוב',
      title: 'עומק קהילתי',
      body: 'גילוי טוב יותר, פיקוח שקוף, onboarding משופר, וגשרים לעמותות ולשכונות.',
    },
    {
      label: 'שלב ג׳',
      severity: 'future',
      status: 'בעתיד',
      title: 'השפעה רחבה',
      body: 'שותפויות, אירועים, חינוך לנתינה אחראית, וכלים למובילי קהילה.',
    },
    {
      label: 'שלב ד׳',
      severity: 'long-term',
      status: 'טווח ארוך',
      title: 'מעבר לחפצים',
      body: 'נתינת זמן ומומחיות, חיבור למעגלים רחבים, ומדידה של הטוב שנוצר בשטח.',
    },
  ],

  // Goals
  goalsTitle: 'המטרות שלנו',
  goalsText:
    '🎯 להפוך את המסירה והבקשה לעניין שגרתי ובטוח.\n\n' +
    '♻️ לצמצם בזבוז ולחזק כלכלה מעגלית מקומית.\n\n' +
    '🤝 לבנות אמון דרך מוצר אמיתי — לא דרך הבטחות ריקות.\n\n' +
    '💡 להישאר נאמנים למודל ללא תמורה כספית בין משתמשים.',

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

  // Team
  teamTitle: 'הצוות',
  teamLeadTitle: 'נוח סרוסי — מייסד הפרויקט',
  teamLeadName: 'נוח סרוסי',
  teamLeadRole: 'מייסד הפרויקט',
  teamLeadInitials: 'נ"ס',
  teamLeadBio:
    'מתכנת לשעבר בצבא. בסוף השירות הבנתי שהדרך שלי להפוך טוב לנגיש יותר היא דרך טכנולוגיה — חיבור פשוט ובטוח בין מי שרוצה לתת למי שצריך לקבל. אני מאמין בכוח של קהילה לשנות מציאות, ואשמח שתצטרפו אלי למסע. כרגע הליבה נבנית סביבי ומסביב לקהילה המוקדמת — פתוחים בשמחה לשותפים, מתנדבים ויועצים בכל תחום.',

  // Contact
  contactTitle: 'יצירת קשר',
  contactText:
    'רעיון, שיתוף פעולה או דיווח על באג — נשמח לשמוע. אפשר לפתוח פנייה דרך ״דיווח על בעיה״ בהגדרות, או לכתוב אלינו ל-karmacommunity2.0@gmail.com.',
  contactCta: 'פנייה לתמיכה באפליקציה',
} as const;
