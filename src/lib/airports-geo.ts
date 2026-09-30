import { CITY_AIRPORTS } from "@/lib/regions";

export type AirportGeo = {
  code: string;
  name: string;
  cityCode?: string;
  countryCode?: string;
  lat: number;
  lon: number;
};

export type NearbyAirport = AirportGeo & {
  distanceKm: number;
  /** True when this airport belongs to the selected place (not just nearby). */
  isPrimary: boolean;
};

type TpAirport = {
  code?: string;
  name?: string;
  city_code?: string;
  country_code?: string;
  flightable?: boolean;
  iata_type?: string;
  coordinates?: { lat?: number; lon?: number };
};

let airportsCache: AirportGeo[] | null = null;
let airportsPromise: Promise<AirportGeo[]> | null = null;

const EARTH_KM = 6371;

export function haversineKm(
  a: { lat: number; lon: number },
  b: { lat: number; lon: number }
): number {
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLon = toRad(b.lon - a.lon);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
  return 2 * EARTH_KM * Math.asin(Math.min(1, Math.sqrt(h)));
}

async function loadAirports(): Promise<AirportGeo[]> {
  if (airportsCache) return airportsCache;
  if (airportsPromise) return airportsPromise;

  airportsPromise = (async () => {
    try {
      const res = await fetch(
        "https://api.travelpayouts.com/data/en/airports.json",
        { next: { revalidate: 86400 } }
      );
      if (!res.ok) return [];
      const raw = (await res.json()) as TpAirport[];
      const list: AirportGeo[] = [];
      for (const a of raw) {
        if (!a.code || a.flightable === false) continue;
        if (a.iata_type && a.iata_type !== "airport") continue;
        const lat = a.coordinates?.lat;
        const lon = a.coordinates?.lon;
        if (lat == null || lon == null || !Number.isFinite(lat) || !Number.isFinite(lon)) {
          continue;
        }
        // Skip placeholder / zero coords
        if (lat === 0 && lon === 0) continue;
        list.push({
          code: a.code.toUpperCase(),
          name: a.name || a.code,
          cityCode: a.city_code?.toUpperCase(),
          countryCode: a.country_code?.toUpperCase(),
          lat,
          lon,
        });
      }
      airportsCache = list;
      return list;
    } catch {
      return [];
    } finally {
      airportsPromise = null;
    }
  })();

  return airportsPromise;
}

export function primaryAirportCodes(
  code: string,
  kind?: string
): string[] {
  const upper = code.trim().toUpperCase();
  if (!upper) return [];
  if (kind === "airport") return [upper];
  if (kind === "city" || CITY_AIRPORTS[upper]) {
    return CITY_AIRPORTS[upper]?.airports.map((c) => c.toUpperCase()) ?? [upper];
  }
  // Country / region / anywhere — nearby not applicable; return empty
  if (kind === "country" || kind === "region" || kind === "anywhere") return [];
  if (upper.length === 3) return [upper];
  return [];
}

/** Whether nearby-airport mode makes sense for this place kind. */
export function supportsNearbyAirports(kind?: string): boolean {
  return kind === "airport" || kind === "city" || !kind;
}

async function resolveAnchor(
  code: string,
  kind?: string
): Promise<{ lat: number; lon: number; primary: string[] } | null> {
  const airports = await loadAirports();
  const byCode = new Map(airports.map((a) => [a.code, a]));
  const primary = primaryAirportCodes(code, kind);
  if (!primary.length) return null;

  const coords = primary
    .map((c) => byCode.get(c))
    .filter((a): a is AirportGeo => Boolean(a));

  if (!coords.length) {
    // Fall back: treat code as city_code
    const inCity = airports.filter((a) => a.cityCode === code.toUpperCase());
    if (!inCity.length) return null;
    const lat = inCity.reduce((s, a) => s + a.lat, 0) / inCity.length;
    const lon = inCity.reduce((s, a) => s + a.lon, 0) / inCity.length;
    return {
      lat,
      lon,
      primary: inCity.map((a) => a.code),
    };
  }

  const lat = coords.reduce((s, a) => s + a.lat, 0) / coords.length;
  const lon = coords.reduce((s, a) => s + a.lon, 0) / coords.length;
  return { lat, lon, primary };
}

/**
 * Airports within radiusKm of the selected place, including primary airports
 * at distance 0 (or their true distance from the anchor centroid).
 */
export async function findNearbyAirports(
  code: string,
  kind?: string,
  radiusKm = 250
): Promise<NearbyAirport[]> {
  const anchor = await resolveAnchor(code, kind);
  if (!anchor) return [];

  const airports = await loadAirports();
  const primarySet = new Set(anchor.primary);
  const radius = Math.max(1, Math.min(radiusKm, 800));

  const nearby: NearbyAirport[] = [];
  for (const airport of airports) {
    const distanceKm = haversineKm(anchor, airport);
    const isPrimary = primarySet.has(airport.code);
    if (!isPrimary && distanceKm > radius) continue;
    // Always include primaries even if somehow outside (shouldn't happen)
    if (!isPrimary && distanceKm <= 0.5) continue;
    nearby.push({ ...airport, distanceKm, isPrimary });
  }

  nearby.sort((a, b) => {
    if (a.isPrimary !== b.isPrimary) return a.isPrimary ? -1 : 1;
    return a.distanceKm - b.distanceKm || a.code.localeCompare(b.code);
  });

  // Cap non-primary suggestions so the UI stays usable
  const primaries = nearby.filter((a) => a.isPrimary);
  const others = nearby.filter((a) => !a.isPrimary).slice(0, 24);
  return [...primaries, ...others];
}
