import { describe, it, expect } from 'vitest';
import { shouldBlockImmediately, type LegalPendingItem } from '../legal';

const base = (overrides: Partial<LegalPendingItem> = {}): LegalPendingItem => ({
  docType: 'terms',
  currentVersion: 2,
  currentEffectiveDate: new Date(),
  lastAcceptedVersion: 1,
  severity: 'standard',
  blockMode: 'banner',
  ...overrides,
});

describe('shouldBlockImmediately', () => {
  it('returns false when the pending list is empty', () => {
    expect(shouldBlockImmediately([])).toBe(false);
  });

  it('returns false when every item is in banner mode', () => {
    expect(
      shouldBlockImmediately([
        base({ docType: 'terms', blockMode: 'banner' }),
        base({ docType: 'privacy', blockMode: 'banner' }),
      ]),
    ).toBe(false);
  });

  it('returns true when any item is in modal mode', () => {
    expect(
      shouldBlockImmediately([
        base({ docType: 'terms', blockMode: 'banner' }),
        base({ docType: 'privacy', blockMode: 'modal', severity: 'critical' }),
      ]),
    ).toBe(true);
  });

  it('returns true when all items are in modal mode', () => {
    expect(
      shouldBlockImmediately([
        base({ docType: 'terms', blockMode: 'modal' }),
        base({ docType: 'privacy', blockMode: 'modal' }),
      ]),
    ).toBe(true);
  });
});
