// Post-domain orchestration errors. Mirrors auth/errors.ts.
// Mapped to SRS: FR-POST-002, FR-POST-003, FR-POST-004, FR-POST-005, FR-POST-009.

export type PostErrorCode =
  | 'title_required'
  | 'title_too_long'
  | 'description_too_long'
  | 'address_required'
  | 'address_invalid'
  | 'street_number_invalid'
  | 'city_not_found'
  | 'image_required_for_give'
  | 'too_many_media_assets'
  | 'condition_required_for_give'
  | 'urgency_only_for_request'
  | 'condition_only_for_give'
  | 'visibility_downgrade_forbidden'
  | 'invalid_post_type'
  | 'invalid_visibility'
  | 'invalid_category'
  | 'invalid_location_display_level'
  | 'forbidden'
  | 'unknown';

export class PostError extends Error {
  readonly code: PostErrorCode;
  readonly cause?: unknown;

  constructor(code: PostErrorCode, message: string, cause?: unknown) {
    super(message);
    this.name = 'PostError';
    this.code = code;
    this.cause = cause;
  }
}

export function isPostError(value: unknown): value is PostError {
  return value instanceof PostError;
}
