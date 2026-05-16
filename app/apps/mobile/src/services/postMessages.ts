import type { PostErrorCode } from '@kc/application';
import i18n from '../i18n';

export function mapPostErrorToHebrew(code: PostErrorCode): string {
  const key = `errors.post.${code}`;
  return i18n.t(key, { defaultValue: i18n.t('errors.post.unknown') });
}
