import { describe, expect, it } from 'vitest';
import { assertSafeExternalUrl } from '../assertSafeExternalUrl';

describe('assertSafeExternalUrl', () => {
  it('accepts https URLs', () => {
    expect(assertSafeExternalUrl('https://example.com/path')).toBe('https://example.com/path');
  });

  it('rejects javascript URLs', () => {
    expect(() => assertSafeExternalUrl('javascript:alert(1)')).toThrow('unsupported_scheme');
  });

  it('rejects empty input', () => {
    expect(() => assertSafeExternalUrl('   ')).toThrow('empty_url');
  });
});
