// Hebrew translations — Donations Hub + Search tab (D-16, FR-DONATE-001..005, FR-FEED-016).
// Split out of he.ts to keep that file under its TD-35 size budget.

export const donations = {
  tabLabel: 'תרומות',
  hubTitle: 'תרומות',
  items: { title: 'חפצים', subtitle: 'תרומה ובקשת חפצים' },
  time: { title: 'זמן', subtitle: 'התנדבות וזמן פנוי' },
  money: { title: 'כסף', subtitle: 'תרומה כספית' },
  moneyScreen: {
    title: 'תרומה כספית',
    body:
      'קטגוריית הכסף תפתח בקרוב. ועד אז מזמינים אתכם להיכנס ולתרום / לחפש תורמים דרך עמותת jgive.',
    openLink: 'פתח את jgive.com',
    linkErrorTitle: 'לא הצלחנו לפתוח את הקישור',
    linkErrorBody: 'נסו דפדפן אחר או הקלידו את הכתובת ידנית.',
  },
  timeScreen: {
    title: 'תרומת זמן',
    body:
      'קטגוריית הזמן תפתח בקרוב. ועד אז מזמינים אתכם להיכנס ולמצוא הזדמנויות התנדבות בפלטפורמה של ׳לב אחד׳.',
    openLink: 'פתח את לב אחד',
    composerHeading: 'ניתן גם להתנדב ישירות בארגון שלנו, במקצוע שלך. השאירו הודעה ונחזור אליכם.',
    composerPlaceholder: 'הקלידו את ההודעה שלכם — מקצוע, תחום עניין, וזמינות...',
    sendButton: 'שלח הודעה',
    sendSuccessTitle: 'תודה!',
    sendSuccessBody: 'ההודעה התקבלה. ניצור איתך קשר בקרוב דרך הצ׳אט.',
  },
} as const;

export const search = {
  tabLabel: 'חיפוש',
  title: 'חיפוש אוניברסלי בקרוב',
  subtitle: 'בנתיים, חיפוש פוסטים זמין ישירות בפיד הראשי.',
  goToFeed: 'עבור לפיד הראשי',
} as const;
