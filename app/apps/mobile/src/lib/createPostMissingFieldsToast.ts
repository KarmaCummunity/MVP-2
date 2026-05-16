import i18n from '../i18n';

export interface CreatePostFieldSnapshot {
  readonly isGive: boolean;
  readonly title: string;
  readonly city: { id: string; name: string } | null;
  readonly street: string;
  readonly streetNumber: string;
  readonly uploadsLength: number;
}

/** Toast when publish is tapped but required fields are incomplete. */
export function buildCreatePostMissingFieldsToastMessage(s: CreatePostFieldSnapshot): string {
  const missing: string[] = [];
  if (s.title.trim().length === 0) missing.push(i18n.t('errors.createPost.fieldTitle'));
  if (s.city === null) missing.push(i18n.t('errors.createPost.fieldCity'));
  if (s.street.trim().length === 0) missing.push(i18n.t('errors.createPost.fieldStreet'));
  if (s.streetNumber.trim().length === 0) missing.push(i18n.t('errors.createPost.fieldStreetNumber'));
  if (s.isGive && s.uploadsLength === 0) missing.push(i18n.t('errors.createPost.fieldPhoto'));
  if (missing.length === 0) return '';
  if (missing.length === 1) return i18n.t('errors.createPost.missingOne', { field: missing[0] });
  return i18n.t('errors.createPost.missingMany', { fields: missing.join(', ') });
}
