import { describe, it, expect } from 'vitest';
import { tbl } from '../tbl';

describe('tbl', () => {
  it('prefixes table names with glowe_', () => {
    expect(tbl('profiles')).toBe('glowe_profiles');
    expect(tbl('posts')).toBe('glowe_posts');
  });

  it('passes through empty suffix unchanged except prefix', () => {
    expect(tbl('')).toBe('glowe_');
  });
});
