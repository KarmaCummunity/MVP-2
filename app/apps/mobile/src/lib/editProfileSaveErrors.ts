import i18n from '../i18n';

/** Maps UpdateProfileUseCase / adapter error codes to user-visible messages. */
export function mapEditProfileSaveError(code: string): string {
  const keys: Record<string, string> = {
    invalid_display_name: 'errors.profile.invalid_display_name',
    biography_too_long: 'errors.profile.biography_too_long',
    biography_url_forbidden: 'errors.profile.biography_url_forbidden',
    invalid_city: 'errors.profile.invalid_city',
    incomplete_profile_address: 'errors.profile.incomplete_profile_address',
    invalid_profile_street: 'errors.profile.invalid_profile_street',
    invalid_profile_street_number: 'errors.profile.invalid_profile_street_number',
  };
  const match = Object.keys(keys).find((k) => code.includes(k));
  return match ? i18n.t(keys[match]!) : code;
}
