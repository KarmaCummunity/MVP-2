import { describe, it, expect } from 'vitest';
import { formatUserLocationLine } from '../formatUserLocationLine';

describe('formatUserLocationLine', () => {
  it('returns the cityName when present and non-empty', () => {
    expect(formatUserLocationLine({ cityName: 'Tel Aviv' })).toBe('Tel Aviv');
  });

  it('trims surrounding whitespace from the display value', () => {
    expect(formatUserLocationLine({ cityName: '  Haifa  ' })).toBe('Haifa');
  });

  it('returns null for an empty cityName (post-trim length 0)', () => {
    expect(formatUserLocationLine({ cityName: '' })).toBeNull();
  });

  it('returns null for a whitespace-only cityName (post-trim length 0)', () => {
    expect(formatUserLocationLine({ cityName: '   ' })).toBeNull();
  });

  it('returns null when cityName is undefined (defensive against partial User picks)', () => {
    expect(formatUserLocationLine({} as { cityName: string })).toBeNull();
  });
});
