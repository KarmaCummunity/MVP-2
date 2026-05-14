import { describe, expect, it } from 'vitest';
import { isOpaqueSystemShareHandle } from '../shareHandleDisplay';

describe('isOpaqueSystemShareHandle', () => {
  it('returns true for u_ + hex handles', () => {
    expect(isOpaqueSystemShareHandle('u_e784b994f8')).toBe(true);
    expect(isOpaqueSystemShareHandle('u_ABC123')).toBe(true);
  });

  it('trims whitespace before matching', () => {
    expect(isOpaqueSystemShareHandle('  u_a1b2c3  ')).toBe(true);
  });

  it('returns false for user-chosen or legacy handles', () => {
    expect(isOpaqueSystemShareHandle('dana')).toBe(false);
    expect(isOpaqueSystemShareHandle('u_cool')).toBe(false);
    expect(isOpaqueSystemShareHandle('u_84386dhs848')).toBe(false);
    expect(isOpaqueSystemShareHandle('')).toBe(false);
  });
});
