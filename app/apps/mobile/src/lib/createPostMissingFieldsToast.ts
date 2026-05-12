export interface CreatePostFieldSnapshot {
  readonly isGive: boolean;
  readonly title: string;
  readonly city: { id: string; name: string } | null;
  readonly street: string;
  readonly streetNumber: string;
  readonly uploadsLength: number;
}

/** Hebrew toast when publish is tapped but required fields are incomplete. */
export function buildCreatePostMissingFieldsToastMessage(s: CreatePostFieldSnapshot): string {
  const missing: string[] = [];
  if (s.title.trim().length === 0) missing.push('הכותרת');
  if (s.city === null) missing.push('העיר');
  if (s.street.trim().length === 0) missing.push('הרחוב');
  if (s.streetNumber.trim().length === 0) missing.push('מספר הבית');
  if (s.isGive && s.uploadsLength === 0) missing.push('לפחות תמונה אחת');
  if (missing.length === 0) return '';
  if (missing.length === 1) return `נא למלא את ${missing[0]} לפני פרסום`;
  return `נא למלא את השדות הבאים לפני פרסום: ${missing.join(', ')}`;
}
