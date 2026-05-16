import type { PostErrorCode } from '@kc/application';
import { MAX_MEDIA_ASSETS } from '@kc/domain';
import i18n from '../i18n';

export function mapPostErrorToHebrew(code: PostErrorCode): string {
  const key = `errors.post.${code}`;
  // Audit §6.5 — pass MAX_MEDIA_ASSETS so the `too_many_media_assets` string
  // interpolates `{{max}}` from the domain constant instead of the hardcoded 5.
  // Other codes ignore the param.
  return i18n.t(key, { defaultValue: i18n.t('errors.post.unknown'), max: MAX_MEDIA_ASSETS });
}
