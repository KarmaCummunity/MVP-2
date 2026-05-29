import { describe, expect, it } from 'vitest';
import { assertSessionUser } from '../assertSessionUser';
import { AuthError } from '../errors';

describe('assertSessionUser', () => {
  it('passes when ids match', () => {
    expect(() => assertSessionUser('u_1', 'u_1')).not.toThrow();
  });

  it('throws AuthError forbidden when ids differ', () => {
    expect(() => assertSessionUser('u_1', 'u_2')).toThrow(AuthError);
    try {
      assertSessionUser('u_1', 'u_2');
    } catch (e) {
      expect((e as AuthError).code).toBe('forbidden');
    }
  });
});
