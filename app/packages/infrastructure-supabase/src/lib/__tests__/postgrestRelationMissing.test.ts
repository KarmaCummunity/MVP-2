import { describe, expect, it } from 'vitest';
import { isPostgrestRelationMissing } from '../postgrestRelationMissing';

describe('isPostgrestRelationMissing', () => {
  it('returns true for PGRST205', () => {
    expect(
      isPostgrestRelationMissing({
        code: 'PGRST205',
        message: "Could not find the table 'public.post_actor_identity' in the schema cache",
      }),
    ).toBe(true);
  });

  it('returns true for schema-cache wording without code (defensive)', () => {
    expect(
      isPostgrestRelationMissing({
        message: 'Could not find the table public.foo in the schema cache',
      }),
    ).toBe(true);
  });

  it('returns false for normal SQL errors', () => {
    expect(
      isPostgrestRelationMissing({ code: '23505', message: 'duplicate key value violates unique constraint' }),
    ).toBe(false);
  });
});
