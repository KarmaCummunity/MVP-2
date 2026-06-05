import type { CreatePostFieldSnapshot } from './createPostFieldValidation';
import { buildCreatePostNonAddressToastMessage } from './createPostFieldValidation';

export type { CreatePostFieldSnapshot };
export { buildCreatePostNonAddressToastMessage };

/** Toast for non-address gaps only (title, photo). Address errors are inline. */
export function buildCreatePostMissingFieldsToastMessage(s: CreatePostFieldSnapshot): string {
  return buildCreatePostNonAddressToastMessage(s);
}
