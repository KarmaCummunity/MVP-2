export type TranslationStatus = 'hit' | 'translating' | 'source';

/** Pure status derivation for a single translatable field. */
export function deriveTranslationStatus(input: {
  hasTranslation: boolean;
  isEligible: boolean;
  inFlight: boolean;
}): TranslationStatus {
  if (input.hasTranslation) return 'hit';
  if (input.isEligible && input.inFlight) return 'translating';
  return 'source';
}
