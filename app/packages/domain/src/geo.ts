// ─────────────────────────────────────────────
// GEO — pure great-circle distance helpers
// Mapped to SRS: FR-FEED-006 (distance sort), FR-FEED-019 (cities_geo)
// ─────────────────────────────────────────────

export interface CityGeo {
  readonly cityId: string;
  readonly lat: number;
  readonly lon: number;
}

const EARTH_RADIUS_KM = 6371.0;

function toRadians(deg: number): number {
  return (deg * Math.PI) / 180;
}

/**
 * Haversine great-circle distance between two coordinates in kilometres.
 * Pure, deterministic. Mirrors `public.haversine_km` SQL function so that
 * server- and client-side computations agree to within floating-point error.
 */
export function distanceKm(a: CityGeo, b: CityGeo): number {
  const dLat = toRadians(b.lat - a.lat);
  const dLon = toRadians(b.lon - a.lon);
  const lat1 = toRadians(a.lat);
  const lat2 = toRadians(b.lat);

  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;

  return 2 * EARTH_RADIUS_KM * Math.asin(Math.sqrt(h));
}
