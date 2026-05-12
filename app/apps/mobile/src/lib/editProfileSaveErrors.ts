/** Maps UpdateProfileUseCase / adapter error codes to Hebrew alerts. */
export function mapEditProfileSaveError(code: string): string {
  if (code.includes('invalid_display_name')) return 'שם לא תקין (1–50 תווים).';
  if (code.includes('biography_too_long')) return 'הביוגרפיה ארוכה מדי (≤200 תווים).';
  if (code.includes('biography_url_forbidden')) return 'הביוגרפיה לא יכולה להכיל קישור.';
  if (code.includes('invalid_city')) return 'עיר לא תקינה.';
  if (code.includes('incomplete_profile_address')) return 'נא למלא רחוב ומספר בית, או להשאיר את שניהם ריקים.';
  if (code.includes('invalid_profile_street')) return 'שם רחוב לא תקין (1–80 תווים).';
  if (code.includes('invalid_profile_street_number')) return 'מספר בית לא תקין (ספרות, אות אחת בסוף אופציונלי).';
  return code;
}
