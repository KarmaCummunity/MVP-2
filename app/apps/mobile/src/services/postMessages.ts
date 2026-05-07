import type { PostErrorCode } from '@kc/application';

const MESSAGES: Record<PostErrorCode, string> = {
  title_required: 'יש להזין כותרת לפוסט.',
  title_too_long: 'הכותרת ארוכה מ-80 תווים.',
  description_too_long: 'התיאור ארוך מ-500 תווים.',
  address_required: 'יש להזין עיר, רחוב ומספר בית.',
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
  unknown: 'אירעה שגיאה. נסה שוב.',
};

export function mapPostErrorToHebrew(code: PostErrorCode): string {
  return MESSAGES[code] ?? MESSAGES.unknown;
}
