// Production survey strings — FR-SETTINGS-015..017.
// Kept separate from surveyDemo.ts (design-QA preview) per §8 naming convention.
export const surveyHe = {
  // Settings root entry row (FR-SETTINGS-015)
  entryTitle: 'סקרים וחוות דעת',

  // Hub (FR-SETTINGS-015)
  hubTitle: 'סקרים וחוות דעת',
  hubSectionTitle: 'סקרים וחוות דעת',
  freeFeedbackRow: 'חוות דעת חופשית',
  emptyState: 'אין סקרים פעילים כרגע.',

  // Status chips (FR-SETTINGS-015 AC2)
  statusNotStarted: 'לא התחיל',
  statusInProgress: 'באמצע',
  statusCompleted: 'הושלם',

  // Survey runner (FR-SETTINGS-016)
  progress: 'שאלה {{current}} מתוך {{total}}',
  progressHint: 'ניתן לחזור ולערוך',
  questionIndex: 'שאלה {{index}}',
  ratingFieldLabel: 'דירוג (1–7, חובה)',
  textFieldLabel: 'פירוט (אופציונלי)',
  savingLabel: 'שומר...',
  saveErrorTitle: 'שגיאת שמירה',
  saveErrorMessage: 'לא ניתן היה לשמור את התשובות. נסה שוב.',
  loadErrorTitle: 'שגיאת טעינה',
  loadErrorMessage: 'לא ניתן היה לטעון את הסקר. נסה שוב.',

  // Free feedback (FR-SETTINGS-017)
  feedbackRatingLow: 'לא מספיק',
  feedbackRatingHigh: 'מצוין',
  feedbackTitle: 'חוות דעת חופשית',
  feedbackBodyLabel: 'מה תרצה לשתף? (חובה)',
  feedbackBodyPlaceholder: 'שתף מחשבות, הצעות או משוב כלשהו... (לפחות 10 תווים)',
  feedbackRatingLabel: 'דירוג כללי (אופציונלי)',
  feedbackSubmitBtn: 'שלח חוות דעת',
  feedbackSubmitting: 'שולח...',
  feedbackSuccessToast: 'חוות הדעת נשלחה. תודה!',
  feedbackErrorTitle: 'שגיאה',
  feedbackErrorBodyTooShort: 'הטקסט חייב להכיל לפחות 10 תווים.',
  feedbackErrorBodyTooLong: 'הטקסט לא יכול לעלות על 500 תווים.',
  feedbackErrorGeneric: 'שליחה נכשלה. נסה שוב.',

  // Prompt banner (FR-SETTINGS-016 AC6)
  bannerTitle: 'יש לנו שאלה אליך',
  bannerBody: 'עזור לנו לשפר את הקהילה — פחות מדקה.',
  bannerCta: 'מלא סקר',
  bannerSnooze: 'אחר כך',
} as const;
