import { describe, it, expect } from 'vitest';
import { distanceKm, type CityGeo } from '@kc/domain';

// Reference coordinates (Wikipedia, also used to seed cities table in 0021).
const telAviv: CityGeo = { cityId: 'tel-aviv', lat: 32.0853, lon: 34.7818 };
const jerusalem: CityGeo = { cityId: 'jerusalem', lat: 31.7683, lon: 35.2137 };
const haifa: CityGeo = { cityId: 'haifa', lat: 32.7940, lon: 34.9896 };
const beerSheva: CityGeo = { cityId: 'beer-sheva', lat: 31.2518, lon: 34.7913 };

describe('distanceKm', () => {
  it('is zero when both points coincide', () => {
    expect(distanceKm(telAviv, telAviv)).toBeCloseTo(0, 5);
  });

  it('is symmetric: d(a,b) == d(b,a)', () => {
    const a = distanceKm(telAviv, jerusalem);
    const b = distanceKm(jerusalem, telAviv);
    expect(a).toBeCloseTo(b, 6);
  });

  it('matches the known Tel Aviv ↔ Jerusalem great-circle distance (~54 km)', () => {
    expect(distanceKm(telAviv, jerusalem)).toBeGreaterThan(50);
    expect(distanceKm(telAviv, jerusalem)).toBeLessThan(58);
  });

  it('matches the known Tel Aviv ↔ Haifa great-circle distance (~80 km)', () => {
    expect(distanceKm(telAviv, haifa)).toBeGreaterThan(75);
    expect(distanceKm(telAviv, haifa)).toBeLessThan(85);
  });

  it('matches the known Tel Aviv ↔ Beer Sheva great-circle distance (~95 km)', () => {
    expect(distanceKm(telAviv, beerSheva)).toBeGreaterThan(90);
    expect(distanceKm(telAviv, beerSheva)).toBeLessThan(100);
  });
});
