/** Hebrew About landing — features, mission, how, audience, values (v1.0 master narrative). */
export const aboutContentCopyB = {
  // Features (bullets — aboutContentUxRefreshPartA)
  featuresTitle: 'מה יש באפליקציה',

  // How it works — today (3 steps)
  howItWorksTitle: 'איך זה עובד',
  howItWorksText:
    '1. מפרסמים — כותבים מה יש לתת או מה מחפשים, עם תמונה ואזור.\n\n' +
    '2. מתאמים — מדברים בצ׳אט באפליקציה, קובעים מקום ושעה. אין חובה לתת טלפון.\n\n' +
    '3. סוגרים — מסמנים שהמסירה בוצעה. בלי כסף, בלי עמלה, בלי מתווך.\n\n' +
    'הכל בחינם, הכל שקוף, הכל בין אנשים.',

  // How it works — vision (5 steps, in-app future)
  howItWorksVisionText:
    'כשהמוצר יבשיל, התהליך יכלול גם:\n\n' +
    '1. הצטרפות מהירה — רק מה שצריך.\n' +
    '2. פרסום או חיפוש — בקשה או הצעה ברורה.\n' +
    '3. מפה — לראות מה קורה ליד הבית (עדיין לא זמין).\n' +
    '4. קשר ישיר — צ׳אט ותיאום.\n' +
    '5. מסירה וסגירה — קשר אנושי + חיזוק הקהילה.',

  // Audience — emphasized block (AboutAudienceSection)
  audienceTitle: 'למי זה מתאים',
  audienceLead: 'לכל מי שרוצה לתת או לקבל — בלי הבדלים ובלי שיפוט.',
  audienceGroups: [
    { icon: 'home-outline', label: 'משפחות שמצמצמות חפצים' },
    { icon: 'school-outline', label: 'סטודנטים שעוברים דירה' },
    { icon: 'airplane-outline', label: 'עולים שמתחילים מחדש' },
    { icon: 'heart-outline', label: 'קשישים שצריכים עזרה' },
    { icon: 'people-outline', label: 'שכנים וקהילות מקומיות' },
    {
      icon: 'hand-left-outline',
      label: 'מי שמעדיף לתת ולקבל דרך אנשים, לא דרך זירת מכירות',
    },
  ],
  audienceFootnote:
    'בשלב הראשון מתמקדים באנשים פרטיים. עמותות וארגונים — בהמשך.',

  // Values (copy + chips — aboutContentUxRefreshPartB)
  valuesTitle: 'הערכים שלנו',
} as const;
