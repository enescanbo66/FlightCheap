import type {
  CabinClass,
  FlightEndpoint,
  FlightOffer,
  FlightSearchParams,
  FlightSearchResponse,
  FlightSegment,
  TripType,
} from "@/lib/types";
import { CITY_AIRPORTS, COUNTRY_HUBS } from "@/lib/regions";

const TEQUILA_URL = "https://api.tequila.kiwi.com/v2/search";
const FLIGHTLIST_URL = "https://www.flightlist.io/api/search.php";

type KiwiRouteLeg = {
  id?: string;
  flyFrom?: string;
  flyTo?: string;
  cityFrom?: string;
  cityTo?: string;
  local_departure?: string;
  local_arrival?: string;
  airline?: string;
  flight_no?: number | string;
  return?: number;
  bags_recheck_required?: boolean;
  vi_connection?: boolean;
};

type KiwiFlight = {
  id?: string;
  flyFrom?: string;
  flyTo?: string;
  cityFrom?: string;
  cityTo?: string;
  local_departure?: string;
  local_arrival?: string;
  price?: number;
  airlines?: string[];
  route?: KiwiRouteLeg[];
  duration?: { departure?: number; return?: number; total?: number };
  deep_link?: string;
  nightsInDest?: number | null;
};

type KiwiSearchResponse = {
  search_id?: string;
  currency?: string;
  data?: KiwiFlight[];
  _results?: number;
};

function apiKey(): string | undefined {
  return (
    process.env.TEQUILA_API_KEY?.trim() ||
    process.env.KIWI_API_KEY?.trim() ||
    undefined
  );
}

/** YYYY-MM-DD → DD/MM/YYYY for Kiwi/FlightList. */
export function toKiwiDate(iso: string): string {
  const [y, m, d] = iso.slice(0, 10).split("-");
  if (!y || !m || !d) return iso;
  return `${d}/${m}/${y}`;
}

function cabinToKiwi(seat: CabinClass | undefined): string {
  switch (seat) {
    case "premium-economy":
      return "W";
    case "business":
      return "C";
    case "first":
      return "F";
    default:
      return "M";
  }
}

/**
 * Map our place codes to Kiwi fly_from / fly_to values.
 * Countries stay as ISO (PL). Airports use airport:CODE when kind is airport.
 * Returns null when Kiwi cannot natively represent the place (region/anywhere).
 */
export function toKiwiPlace(
  code: string,
  kind?: string
): string | null {
  const upper = code.trim().toUpperCase();
  if (!upper || upper === "ANYWHERE" || kind === "anywhere") return null;
  if (kind === "region") return null;

  if (kind === "country" || (upper.length === 2 && COUNTRY_HUBS[upper])) {
    return upper;
  }
  if (kind === "city" || CITY_AIRPORTS[upper]) {
    return upper;
  }
  if (kind === "airport") {
    return `airport:${upper}`;
  }
  // 3-letter without kind → airport/city code as-is
  if (upper.length === 3) return upper;
  if (upper.length === 2 && COUNTRY_HUBS[upper]) return upper;
  return null;
}

function parseLocal(isoLike: string | undefined): { date: string; time: string } {
  if (!isoLike) return { date: "", time: "" };
  // Kiwi local_* timestamps look like 2026-10-25T20:15:00.000Z but are local
  const m = isoLike.match(/^(\d{4}-\d{2}-\d{2})T(\d{2}:\d{2})/);
  if (m) return { date: m[1], time: m[2] };
  return { date: isoLike.slice(0, 10), time: "" };
}

function formatDurationLabel(totalMinutes: number): string {
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  if (h && m) return `${h}h ${m}m`;
  if (h) return `${h}h`;
  return `${m}m`;
}

function legDurationMinutes(leg: KiwiRouteLeg): number {
  const dep = parseLocal(leg.local_departure);
  const arr = parseLocal(leg.local_arrival);
  if (!dep.date || !arr.date || !dep.time || !arr.time) return 0;
  const a = Date.parse(`${dep.date}T${dep.time}:00Z`);
  const b = Date.parse(`${arr.date}T${arr.time}:00Z`);
  if (!Number.isFinite(a) || !Number.isFinite(b) || b <= a) return 0;
  return Math.round((b - a) / 60_000);
}

function toEndpoint(
  code: string,
  name: string,
  when: string | undefined
): FlightEndpoint {
  const { date, time } = parseLocal(when);
  return {
    airport: code,
    airportName: name || code,
    date,
    time,
  };
}

function mapLeg(leg: KiwiRouteLeg): FlightSegment {
  const fromCode = (leg.flyFrom ?? "").toUpperCase();
  const toCode = (leg.flyTo ?? "").toUpperCase();
  const minutes = legDurationMinutes(leg);
  return {
    from: { code: fromCode, name: leg.cityFrom || fromCode },
    to: { code: toCode, name: leg.cityTo || toCode },
    departure: parseLocal(leg.local_departure),
    arrival: parseLocal(leg.local_arrival),
    durationMinutes: minutes,
    durationLabel: formatDurationLabel(minutes || 0),
    aircraft: null,
  };
}

function maxLayover(segments: FlightSegment[]): number | null {
  if (segments.length < 2) return null;
  let max = 0;
  for (let i = 0; i < segments.length - 1; i++) {
    const arr = segments[i].arrival;
    const dep = segments[i + 1].departure;
    if (!arr.date || !dep.date || !arr.time || !dep.time) continue;
    const a = Date.parse(`${arr.date}T${arr.time}:00Z`);
    const b = Date.parse(`${dep.date}T${dep.time}:00Z`);
    if (!Number.isFinite(a) || !Number.isFinite(b) || b <= a) continue;
    max = Math.max(max, Math.round((b - a) / 60_000));
  }
  return max || null;
}

export function mapKiwiFlight(
  flight: KiwiFlight,
  currency: string,
  trip: TripType
): FlightOffer | null {
  if (flight.price == null || !flight.flyFrom || !flight.flyTo) return null;
  const route = flight.route ?? [];
  const outboundLegs = route.filter((l) => (l.return ?? 0) === 0);
  const returnLegs = route.filter((l) => (l.return ?? 0) === 1);
  const outbound =
    outboundLegs.length > 0
      ? outboundLegs
      : route.length
        ? [route[0]]
        : [];
  if (!outbound.length) return null;

  const segments = outbound.map(mapLeg);
  const first = outbound[0];
  const last = outbound[outbound.length - 1];
  const durationSec = flight.duration?.departure ?? flight.duration?.total ?? 0;
  const durationMinutes = Math.round(durationSec / 60) || segments.reduce(
    (s, seg) => s + seg.durationMinutes,
    0
  );
  const stops = Math.max(0, segments.length - 1);

  const offer: FlightOffer = {
    id: `kiwi-${flight.id ?? `${flight.flyFrom}-${flight.flyTo}-${flight.local_departure}`}`,
    price: flight.price,
    currency,
    airlines: flight.airlines?.length
      ? flight.airlines
      : [...new Set(outbound.map((l) => l.airline).filter(Boolean) as string[])],
    stops,
    direct: stops === 0,
    durationMinutes,
    durationLabel: formatDurationLabel(durationMinutes),
    maxLayoverMinutes: maxLayover(segments),
    trip,
    departure: toEndpoint(
      (first.flyFrom ?? flight.flyFrom).toUpperCase(),
      first.cityFrom || flight.cityFrom || flight.flyFrom,
      first.local_departure ?? flight.local_departure
    ),
    arrival: toEndpoint(
      (last.flyTo ?? flight.flyTo).toUpperCase(),
      last.cityTo || flight.cityTo || flight.flyTo,
      last.local_arrival ?? flight.local_arrival
    ),
    segments,
    deepLink: flight.deep_link ?? null,
    provider: "kiwi",
  };

  if (trip === "round-trip" && returnLegs.length) {
    const retSegs = returnLegs.map(mapLeg);
    const rFirst = returnLegs[0];
    const rLast = returnLegs[returnLegs.length - 1];
    offer.returnSegments = retSegs;
    offer.returnDeparture = toEndpoint(
      (rFirst.flyFrom ?? "").toUpperCase(),
      rFirst.cityFrom || rFirst.flyFrom || "",
      rFirst.local_departure
    );
    offer.returnArrival = toEndpoint(
      (rLast.flyTo ?? "").toUpperCase(),
      rLast.cityTo || rLast.flyTo || "",
      rLast.local_arrival
    );
    if (flight.duration?.total) {
      offer.durationMinutes = Math.round(flight.duration.total / 60);
      offer.durationLabel = formatDurationLabel(offer.durationMinutes);
    }
  }

  return offer;
}

function buildQuery(
  params: FlightSearchParams & {
    flyFrom: string;
    flyTo: string;
  }
): URLSearchParams {
  const q = new URLSearchParams();
  q.set("fly_from", params.flyFrom);
  q.set("fly_to", params.flyTo);
  q.set("date_from", toKiwiDate(params.dateFrom));
  q.set("date_to", toKiwiDate(params.dateTo || params.dateFrom));
  q.set("adults", "1");
  q.set("children", "0");
  q.set("infants", "0");
  q.set("selected_cabins", cabinToKiwi(params.seat));
  q.set("curr", (params.currency ?? "EUR").toUpperCase());
  q.set("limit", String(params.limit ?? 100));
  q.set("sort", "price");
  q.set("max_stopovers", String(params.maxStops ?? 10));
  q.set("enable_vi", "true");
  q.set(
    "flight_type",
    params.trip === "round-trip" ? "round" : "oneway"
  );
  if (params.trip === "round-trip" && params.returnFrom) {
    q.set("return_from", toKiwiDate(params.returnFrom));
    q.set("return_to", toKiwiDate(params.returnTo || params.returnFrom));
  }
  if (params.maxPrice != null && Number.isFinite(params.maxPrice)) {
    q.set("price_to", String(params.maxPrice));
  }
  if (params.maxLayoverMinutes != null && Number.isFinite(params.maxLayoverMinutes)) {
    const h = Math.floor(params.maxLayoverMinutes / 60);
    const m = params.maxLayoverMinutes % 60;
    q.set("stopover_to", `${h}:${String(m).padStart(2, "0")}`);
  }
  if (params.airlines?.length) {
    q.set("select_airlines", params.airlines.join(","));
  }
  return q;
}

async function fetchKiwiJson(
  url: string,
  headers: Record<string, string>
): Promise<KiwiSearchResponse | null> {
  const res = await fetch(url, {
    headers,
    cache: "no-store",
    signal: AbortSignal.timeout(45_000),
  });
  if (!res.ok) return null;
  return (await res.json()) as KiwiSearchResponse;
}

/**
 * Search Kiwi/Tequila (or FlightList proxy). Returns null when unavailable
 * so the caller can fall back to Google Flights.
 */
export async function searchKiwiFlights(
  params: FlightSearchParams & {
    fromKind?: string;
    toKind?: string;
  }
): Promise<FlightSearchResponse | null> {
  const flyFrom = toKiwiPlace(params.from, params.fromKind);
  const flyTo = toKiwiPlace(params.to, params.toKind);
  if (!flyFrom || !flyTo) return null;

  const query = buildQuery({ ...params, flyFrom, flyTo });
  const key = apiKey();
  let raw: KiwiSearchResponse | null = null;
  let sourceError: string | undefined;

  if (key) {
    try {
      raw = await fetchKiwiJson(`${TEQUILA_URL}?${query}`, {
        apikey: key,
        Accept: "application/json",
      });
    } catch (err) {
      sourceError = err instanceof Error ? err.message : "Tequila request failed";
    }
  }

  if (!raw?.data?.length) {
    // Public FlightList proxy — same shape; may be blocked by Cloudflare from datacenters
    try {
      const fl = await fetchKiwiJson(`${FLIGHTLIST_URL}?${query}`, {
        Accept: "application/json",
        "User-Agent":
          "Mozilla/5.0 (compatible; FlyList/1.0; +https://localhost)",
        Referer: "https://www.flightlist.io/",
      });
      if (fl?.data?.length) raw = fl;
    } catch (err) {
      sourceError =
        sourceError ||
        (err instanceof Error ? err.message : "FlightList request failed");
    }
  }

  if (!raw?.data) {
    if (!key) {
      return null; // silent fallback — no key configured
    }
    return {
      ok: false,
      count: 0,
      flights: [],
      error: sourceError || "Kiwi search unavailable",
    };
  }

  const currency = (raw.currency || params.currency || "EUR").toUpperCase();
  const trip = params.trip ?? "one-way";
  let flights = raw.data
    .map((f) => mapKiwiFlight(f, currency, trip))
    .filter((f): f is FlightOffer => Boolean(f));

  if (params.maxStops != null && Number.isFinite(params.maxStops)) {
    flights = flights.filter((f) => f.stops <= (params.maxStops as number));
  }
  if (params.maxPrice != null && Number.isFinite(params.maxPrice)) {
    flights = flights.filter((f) => f.price <= (params.maxPrice as number));
  }
  if (params.maxLayoverMinutes != null && Number.isFinite(params.maxLayoverMinutes)) {
    flights = flights.filter(
      (f) =>
        f.maxLayoverMinutes == null ||
        f.maxLayoverMinutes <= (params.maxLayoverMinutes as number)
    );
  }
  if (params.airlines?.length) {
    const set = new Set(params.airlines.map((a) => a.toUpperCase()));
    flights = flights.filter((f) =>
      f.airlines.some((a) => set.has(a.toUpperCase()))
    );
  }

  flights.sort((a, b) => a.price - b.price);
  const limit = params.limit ?? 100;

  return {
    ok: true,
    count: flights.length,
    flights: flights.slice(0, limit),
    warning: key
      ? undefined
      : "Results via FlightList proxy (set TEQUILA_API_KEY for Tequila API).",
  };
}

export function kiwiConfigured(): boolean {
  return Boolean(apiKey());
}
