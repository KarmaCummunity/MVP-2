import { describe, expect, it } from 'vitest';
import { useReducedMotion } from '../useReducedMotion';

describe('useReducedMotion', () => {
  it('exports a hook function', () => {
    expect(typeof useReducedMotion).toBe('function');
  });
});
