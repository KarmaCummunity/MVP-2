// Translates Postgres error responses from `posts` INSERT into typed
// PostError instances. Kept separate from SupabasePostRepository so the
// repository file stays under its size cap (TD-50) and the mapping is
// independently unit-testable.

import { PostError, type PostErrorCode } from '@kc/application';

interface PostgresErrorShape {
  readonly code?: string;
  readonly message?: string;
  readonly details?: string;
}

// Postgres error codes:
//   23502 not_null_violation       → required column missing
//   23503 foreign_key_violation    → city_id not in cities (city_not_found) / other FK
//   23514 check_violation          → street_number regex / posts_type_fields_chk / other CHECK
//   42501 insufficient_privilege   → RLS policy denied
export function mapInsertError(err: unknown): PostError {
  const pg = (err ?? {}) as PostgresErrorShape;
  const pgCode = pg.code ?? '';
  const detail = `${pg.message ?? ''} ${pg.details ?? ''}`;
  let code: PostErrorCode = 'unknown';
  if (pgCode === '23503') {
    code = detail.includes('city') ? 'city_not_found' : 'address_invalid';
  } else if (pgCode === '23514') {
    if (detail.includes('street_number')) code = 'street_number_invalid';
    else if (detail.includes('type_fields')) code = 'invalid_post_type';
    else code = 'address_invalid';
  } else if (pgCode === '23502') {
    code = 'address_required';
  } else if (pgCode === '42501') {
    code = 'forbidden';
  }
  return new PostError(code, `create.post: ${pg.message ?? pgCode}`, err);
}
