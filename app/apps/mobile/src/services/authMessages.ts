import type { AuthErrorCode } from '@kc/application';
import i18n from '../i18n';

// TD-69: generic credentialed-sign-in failure — do NOT distinguish between
// wrong password and unregistered email (enumeration oracle risk).
export function mapAuthErrorToHebrew(code: AuthErrorCode): string {
  const key = `errors.auth.${code}`;
  return i18n.t(key, { defaultValue: i18n.t('errors.auth.unknown') });
}
