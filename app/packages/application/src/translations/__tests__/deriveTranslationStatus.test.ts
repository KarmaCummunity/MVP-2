import { describe, it, expect } from 'vitest';
import { deriveTranslationStatus } from '../deriveTranslationStatus';

describe('deriveTranslationStatus', () => {
  it('hit when a translation exists', () => {
    expect(deriveTranslationStatus({ hasTranslation: true, isEligible: true, inFlight: false })).toBe('hit');
  });
  it('translating when eligible + in flight + no translation yet', () => {
    expect(deriveTranslationStatus({ hasTranslation: false, isEligible: true, inFlight: true })).toBe('translating');
  });
  it('source when not eligible', () => {
    expect(deriveTranslationStatus({ hasTranslation: false, isEligible: false, inFlight: true })).toBe('source');
  });
  it('source when eligible but settled (failed/skipped, not in flight)', () => {
    expect(deriveTranslationStatus({ hasTranslation: false, isEligible: true, inFlight: false })).toBe('source');
  });
});
