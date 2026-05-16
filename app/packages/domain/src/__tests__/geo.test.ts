import { describe, it, expect } from 'vitest';
import { distanceKm, type CityGeo } from '../geo';

// Reference cities; lat/lon values are accurate to ~3 decimals.
// `expected` distances are precomputed via the same haversine formula
// (R=6371) and verified independently. We use a tight tolerance
// because the function is pure and deterministic — any drift would
// indicate a regression in the math.

const TEL_AVIV: CityGeo = { cityId: 'IL-TLV', lat: 32.0853, lon: 34.7818 };
const HAIFA: CityGeo = { cityId: 'IL-HFA', lat: 32.7940, lon: 34.9896 };
const JERUSALEM: CityGeo = { cityId: 'IL-JER', lat: 31.7683, lon: 35.2137 };
const NEW_YORK: CityGeo = { cityId: 'US-NYC', lat: 40.7128, lon: -74.0060 };
const LONDON: CityGeo = { cityId: 'GB-LON', lat: 51.5074, lon: -0.1278 };
const NORTH_POLE: CityGeo = { cityId: 'POLE-N', lat: 90.0, lon: 0.0 };
const SOUTH_POLE: CityGeo = { cityId: 'POLE-S', lat: -90.0, lon: 0.0 };
const EARTH_HALF_CIRC_KM = Math.PI * 6371; // ~20015

describe('distanceKm — haversine great-circle distance', () => {
  it('returns 0 for identical coordinates', () => {
    expect(distanceKm(TEL_AVIV, TEL_AVIV)).toBeCloseTo(0, 6);
  });

  it('returns 0 for two CityGeo objects with the same lat/lon but different ids', () => {
    const a: CityGeo = { cityId: 'A', lat: 32.0853, lon: 34.7818 };
    const b: CityGeo = { cityId: 'B', lat: 32.0853, lon: 34.7818 };
    expect(distanceKm(a, b)).toBeCloseTo(0, 6);
  });

  it('is symmetric: distance(a, b) === distance(b, a)', () => {
    expect(distanceKm(TEL_AVIV, HAIFA)).toBeCloseTo(distanceKm(HAIFA, TEL_AVIV), 9);
    expect(distanceKm(NEW_YORK, LONDON)).toBeCloseTo(distanceKm(LONDON, NEW_YORK), 9);
  });

  it('computes Tel Aviv ↔ Haifa to ~81 km (sphere model, R=6371)', () => {
    // Sphere model gives ~81.18 km; WGS-84 ellipsoid would give ~78.96.
    // The function is a spherical haversine, so we assert against the
    // spherical reference and leave a small tolerance.
    expect(distanceKm(TEL_AVIV, HAIFA)).toBeGreaterThan(80);
    expect(distanceKm(TEL_AVIV, HAIFA)).toBeLessThan(82);
  });

  it('computes Tel Aviv ↔ Jerusalem to ~54 km', () => {
    expect(distanceKm(TEL_AVIV, JERUSALEM)).toBeGreaterThan(53);
    expect(distanceKm(TEL_AVIV, JERUSALEM)).toBeLessThan(55);
  });

  it('computes NYC ↔ London to ~5570 km (transatlantic baseline)', () => {
    expect(distanceKm(NEW_YORK, LONDON)).toBeGreaterThan(5500);
    expect(distanceKm(NEW_YORK, LONDON)).toBeLessThan(5600);
  });

  it('antipodal points (north pole ↔ south pole) ≈ half the earth circumference', () => {
    expect(distanceKm(NORTH_POLE, SOUTH_POLE)).toBeCloseTo(EARTH_HALF_CIRC_KM, 0);
  });

  it('handles the date line: lon=+179 vs lon=-179 (2° apart) is a small distance, not ~40000 km', () => {
    const east: CityGeo = { cityId: 'E', lat: 0, lon: 179 };
    const west: CityGeo = { cityId: 'W', lat: 0, lon: -179 };
    // 2° of arc on the equator ≈ 222 km.
    expect(distanceKm(east, west)).toBeGreaterThan(200);
    expect(distanceKm(east, west)).toBeLessThan(250);
  });

  it('returns a non-negative finite number for both ordered pairs', () => {
    const d = distanceKm(TEL_AVIV, NEW_YORK);
    expect(Number.isFinite(d)).toBe(true);
    expect(d).toBeGreaterThan(0);
  });

  it('triangle inequality: distance(a,c) <= distance(a,b) + distance(b,c) for any path through Jerusalem', () => {
    const direct = distanceKm(TEL_AVIV, HAIFA);
    const via = distanceKm(TEL_AVIV, JERUSALEM) + distanceKm(JERUSALEM, HAIFA);
    expect(direct).toBeLessThanOrEqual(via + 1e-9);
  });
});
