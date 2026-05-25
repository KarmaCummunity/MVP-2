/** Hardcoded copy for the survey UI demo only — not loaded from the server. */

export type SurveyDemoQuestion = {
  readonly id: string;
  readonly shortLabel: string;
  readonly prompt: string;
  /** Short guidance shown under the question title — fills context on the card. */
  readonly context: string;
  /** Hebrew placeholder for the optional free-text field (per question). */
  readonly textPlaceholder: string;
};

export const SURVEY_DEMO_QUESTIONS: readonly SurveyDemoQuestion[] = [
  {
    id: 'q1',
    shortLabel: 'אנונימיות',
    prompt:
      'מה דעתך על מנגנון האנונימיות? האם אתה מרגיש שהוא מספק את צריכיך?',
    context:
      'אנחנו רוצים לוודא שאפשר לבקש או לתת עזרה בלי חשיפה מיותרת. דרג לפי התחושה האמיתית שלך — לא לפי מה ש"אמור" להיות.',
    textPlaceholder: 'לדוגמה: מה עוזר לך להרגיש בטוח, ומה עדיין מרגיש חשוף מדי?',
  },
  {
    id: 'q2',
    shortLabel: 'פרסום פוסטים',
    prompt: 'עד כמה קל וברור לפרסם בקשה או נתינה באפליקציה?',
    context:
      'חשוב על השלבים מהרעיון ועד לפרסום: בחירת סוג, תמונה, מיקום והגדרות פרטיות. אם נתקעת באמצע — זה בדיוק מה שאנחנו רוצים לשמוע.',
    textPlaceholder: 'איזה שלב היה הכי מבלבל או הכי חסר?',
  },
  {
    id: 'q3',
    shortLabel: 'פיד וחיפוש',
    prompt: 'איך חווית הפיד והחיפוש? האם מוצא בקלות מה שמחפשים?',
    context:
      'הפיד אמור לחבר אנשים לעזרה רלוונטית. חפש/י משהו שמעניין אותך וחשוב/י אם הסינון, המרחק והמיון עזרו לך.',
    textPlaceholder: 'מה חיפשת ומה היה חסר בתוצאות?',
  },
  {
    id: 'q4',
    shortLabel: 'התראות',
    prompt: 'האם ההתראות רלוונטיות ולא מציפות? מה היית משנה?',
    context:
      'התראות אמורות לעזור בזמן אמת — לא להציף. חשוב/י על התראות קריטיות (סגירה, צ׳אט) לעומת חברתיות.',
    textPlaceholder: 'אילו התראות היית מוריד או מוסיף?',
  },
  {
    id: 'q5',
    shortLabel: 'המלצה כללית',
    prompt: 'עד כמה היית ממליץ על קארמה לחבר? מה הכי חשוב לשפר?',
    context:
      'זו שאלת סיכום: דירוג גבוה לא אומר שהכל מושלם, ודירוג נמוך לא אומר שלא אהבת. שתף/י במילה אחת מה הכי ישפר את החוויה.',
    textPlaceholder: 'מה הדבר הראשון שהיית משפר/ה בקארמה?',
  },
] as const;

export const SURVEY_DEMO_RATINGS = [1, 2, 3, 4, 5, 6, 7] as const;
