import type { PostErrorCode } from '@kc/application';

const MESSAGES: Record<PostErrorCode, string> = {
  title_required: 'יש להזין כותרת לפוסט.',
  title_too_long: 'הכותרת ארוכה מ-80 תווים.',
  description_too_long: 'התיאור ארוך מ-500 תווים.',
  address_required: 'יש להזין עיר, רחוב ומספר בית.',
  address_invalid: 'הכתובת שהוזנה אינה תקינה.',
  street_number_invalid: 'מספר הבית לא תקין. השתמש בספרות בלבד (אפשר אות לועזית בסוף, למשל 12 או 12B).',
  city_not_found: 'העיר שנבחרה לא נמצאה ברשימה. אנא בחר עיר מהרשימה.',
  image_required_for_give: 'פוסטים מסוג "לתת" חייבים לפחות תמונה אחת.',
  too_many_media_assets: 'מותר עד 5 תמונות לפוסט.',
  condition_required_for_give: 'יש לבחור מצב לחפץ שניתן.',
  urgency_only_for_request: 'דחיפות זמינה רק לפוסט "לבקש".',
  condition_only_for_give: 'מצב חפץ זמין רק לפוסט "לתת".',
  visibility_downgrade_forbidden: 'לא ניתן להוריד את רמת הפרטיות לאחר פרסום.',
  invalid_post_type: 'סוג הפוסט לא תקין.',
  invalid_visibility: 'בחירת הפרטיות לא תקינה.',
  invalid_category: 'הקטגוריה לא תקינה.',
  invalid_location_display_level: 'רמת תצוגת המיקום לא תקינה.',
  forbidden: 'אין לך הרשאה לפעולה זו. נסה להתחבר מחדש.',
  closure_not_owner: 'רק בעל הפוסט יכול לסמן או לפתוח אותו מחדש.',
  closure_wrong_status: 'הפוסט במצב שאינו מאפשר את הפעולה הזו.',
  closure_recipient_not_in_chat: 'אפשר לסמן רק מישהו שהיה איתך בצ\'אט על הפוסט.',
  reopen_window_expired: 'הזמן לפתוח את הפוסט מחדש כבר עבר — הוא נמחק לתמיד.',
  unknown: 'אירעה שגיאה. נסה שוב.',
};

export function mapPostErrorToHebrew(code: PostErrorCode): string {
  return MESSAGES[code] ?? MESSAGES.unknown;
}
