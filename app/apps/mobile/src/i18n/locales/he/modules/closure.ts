// FR-CLOSURE-001..005 strings (closure sheet, recipient picker, explainer,
// reopen confirm, owner actions bar). Extracted to its own module to keep
// `index.ts` under the 200-LOC cap (TD-156 slice 6).
export const closureHe = {
  // FR-CLOSURE-001 — owner CTAs on PostDetail (OwnerActionsBar)
  detailCloseSuccessToast: 'הפוסט נסגר בהצלחה.',
  detailReopenSuccessToast: 'הפוסט נפתח מחדש בהצלחה.',
  markGiveCta: 'סמן כנמסר ✓',
  markRequestCta: 'סמן שקיבלתי ✓',
  /** Shared CTA copy — owner reopen + recipient un-mark (FR-CLOSURE-005 / FR-CLOSURE-007). */
  itemNotDeliveredCta: 'החפץ לא נמסר בסוף',
  itemNotDeliveredA11y: 'החפץ לא נמסר בסוף',
  reopenCta: '📤 פתח מחדש',
  reopenA11y: 'פתח מחדש',

  // FR-CLOSURE-002 — Step 1 confirmation (ClosureSheet > Step1)
  step1GiveTitle: '🤝  האם הפריט באמת נמסר?',
  step1RequestTitle: '🤝  האם באמת קיבלת את הפריט?',
  step1GiveBody:
    'חשוב לסמן רק אחרי המסירה הפיזית — לא אחרי תיאום בצ\'אט. אם הפריט עדיין לא הגיע ליד מקבל, אל תסמן.',
  step1RequestBody:
    'חשוב לסמן רק אחרי שהפריט הגיע אליך — לא אחרי תיאום בצ\'אט. אם עדיין לא קיבלת את הפריט, אל תסמן.',
  step1GiveCta: 'כן, נמסר ✓',
  step1RequestCta: 'כן, קיבלתי ✓',

  // FR-CLOSURE-003 — Step 2 recipient picker (ClosureStep2)
  step2GiveTitle: '🎁  למי מסרת את הפריט?',
  step2RequestTitle: '🎁  ממי קיבלת את הפריט?',
  step2CloseWithoutMarking: 'סגור בלי לסמן',
  step2MarkAndClose: 'סמן וסגור ✓',
  step2NoSearchResults: 'לא נמצא משתמש בשם כזה.',

  // ClosureRecipientPanes (sub-component of Step 2)
  pickModeChats: 'מצ\'אטים שלי',
  pickModeSearch: 'חיפוש כללי',
  searchPlaceholder: 'חפש לפי שם או handle',
  chatsEmpty:
    'עדיין לא היה איתך צ\'אט עם אף אחד. עבור ל"חיפוש כללי" כדי לבחור מהרשימה הכללית, או לחץ "סגור בלי לסמן".',

  // FR-CLOSURE-004 — educational explainer (ClosureExplainerSheet)
  explainerGiveTitle: '✨  תודה שתרמת!',
  explainerRequestTitle: '✨  תודה שעדכנת!',
  explainerLead: 'כך זה עובד:',
  explainerGiveMarkedBullet:
    '• פוסטים שסומנו עם מקבל — נשמרים לתמיד ומופיעים בסטטיסטיקה שלך ושל המקבל.',
  explainerRequestMarkedBullet:
    '• פוסטים שסומנו עם נותן — נשמרים לתמיד ומופיעים בסטטיסטיקה שלך ושל הנותן.',
  explainerMiddleBullet:
    '• פוסטים שנסגרו בלי לסמן — נשמרים 7 ימים למקרה של טעות, ואז נמחקים אוטומטית.',
  explainerGiveCounterBullet: '• בכל מקרה — "פריטים שתרמתי" שלך עולה ב-1.',
  explainerRequestCounterBullet: '• בכל מקרה — "פריטים שקיבלתי" שלך עולה ב-1.',
  explainerDontShowAgain: 'אל תציג שוב',

  // FR-CLOSURE-001 — error pane (ClosureErrorPane)
  errorTitle: '⚠️  משהו לא עבד',
  errorDefault: 'לא הצלחנו להתחיל את תהליך הסגירה. נסה שוב עוד רגע.',

  // FR-CLOSURE-005 — reopen confirm (ReopenConfirmModal)
  itemNotDeliveredModalTitle: 'החפץ לא נמסר בסוף?',
  reopenTitle: '📤  לפתוח את הפוסט מחדש?',
  reopenBodyClosedDelivered: 'הפוסט יחזור להיות פעיל בפיד.',
  reopenBodyDeletedNoRecipient: 'הפוסט יחזור להיות פעיל בפיד והוא לא יימחק.',
  reopenBulletMarkedRemoved: '• הסימון של {{markedSide}} יוסר.',
  reopenBulletMarkedCounter: '• "{{counter}}" שלו יקטן ב-1 (בלי התראה).',
  reopenBulletOwnerCounter: '• "{{counter}}" שלך יקטן ב-1.',
  reopenConfirmCta: 'פתח מחדש',
  markedSideGive: 'מי שקיבל',
  markedSideRequest: 'מי שמסר לך',
  counterDonated: 'פריטים שתרמתי',
  counterReceived: 'פריטים שקיבלתי',

  // RecipientCallout (closed_delivered post-detail row)
  calloutGiveLabel: 'נמסר ל',
  calloutRequestLabel: 'ניתן על-ידי',
  calloutGiveSublabel: 'הפריט נמסר',
  calloutRequestSublabel: 'הבקשה נענתה',

  // RecipientUnmarkBar (FR-CLOSURE-007)
  unmarkSelfCta: 'החפץ לא נמסר בסוף',
  unmarkSelfA11y: 'החפץ לא נמסר בסוף',
  unmarkConfirmTitle: 'החפץ לא נמסר בסוף?',
  unmarkConfirmBody:
    'לא תקבל קרדיט על פריט זה, ובעל הפוסט יקבל הודעה. הפוסט יישמר 7 ימים לפני מחיקה.',
  unmarkConfirmCta: 'הסר',
  unmarkErrorBody: 'לא הצלחנו להסיר את הסימון. נסה שוב.',
} as const;
