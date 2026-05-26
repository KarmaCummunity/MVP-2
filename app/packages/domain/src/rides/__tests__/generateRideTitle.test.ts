import { describe, expect, it } from 'vitest';
import { generateRideTitle } from '../generateRideTitle';

describe('generateRideTitle', () => {
  it('formats route and departure time', () => {
    const title = generateRideTitle({
      originCityName: 'תל אביב',
      destCityName: 'חיפה',
      departsAt: new Date('2026-06-15T14:05:00'),
    });
    expect(title).toBe('תל אביב → חיפה · 15/06 14:05');
  });
});
