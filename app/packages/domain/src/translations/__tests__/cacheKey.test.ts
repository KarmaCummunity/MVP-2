import { describe, it, expect } from 'vitest';
import { normalizeForCache, isTranslatable, needsTranslation } from '../cacheKey';

describe('normalizeForCache', () => {
  it('collapses whitespace and trims (case preserved — meaning-bearing)', () => {
    expect(normalizeForCache('  Hello   world  ')).toBe('Hello world');
    expect(normalizeForCache('line1\n\nline2')).toBe('line1 line2');
  });
});

describe('isTranslatable', () => {
  it('rejects empty / whitespace', () => {
    expect(isTranslatable('   ')).toBe(false);
  });
  it('rejects emoji-only', () => {
    expect(isTranslatable('🎉🎉')).toBe(false);
  });
  it('rejects url-only and number-only', () => {
    expect(isTranslatable('https://example.com')).toBe(false);
    expect(isTranslatable('  42  ')).toBe(false);
  });
  it('accepts real text', () => {
    expect(isTranslatable('שלום עולם')).toBe(true);
    expect(isTranslatable('Check https://x.com now')).toBe(true);
  });
});

describe('needsTranslation', () => {
  it('false when source equals target (same base)', () => {
    expect(needsTranslation('he', 'he')).toBe(false);
    expect(needsTranslation('pt-BR', 'pt-BR')).toBe(false);
  });
  it('true when languages differ', () => {
    expect(needsTranslation('he', 'en')).toBe(true);
  });
  it('true when source is unknown (null)', () => {
    expect(needsTranslation(null, 'en')).toBe(true);
  });
});
