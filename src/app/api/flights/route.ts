import { NextResponse } from "next/server";

import { searchFlightsExpanded } from "@/lib/flights";
import { searchKiwiFlights } from "@/lib/kiwi";
import { countryHubs, expandPlaceToSearchCodes } from "@/lib/regions";
import type { CabinClass, TripType } from "@/lib/types";

type TpCity = {
  code?: string;
  name?: string;
  country_code?: string;
  has_flightable_airport?: boolean;
};

let citiesCache: TpCity[] | null = null;

async function loadCities(): Promise<TpCity[]> {
  if (citiesCache) return citiesCache;
  try {
    const res = await fetch("https://api.travelpayouts.com/data/en/cities.json", {
      next: { revalidate: 86400 },
    });
    if (!res.ok) return [];
    citiesCache = (await res.json()) as TpCity[];
    return citiesCache;
  } catch {
    return [];
  }
}

/** Resolve country → hub city codes, with Travelpayouts fallback for missing countries. */
async function resolveSearchCodes(
  code: string,
  kind?: string
): Promise<string[]> {
  const expanded = expandPlaceToSearchCodes(code, kind);
  if (expanded.length) return expanded;

  const upper = code.toUpperCase();
  const looksLikeCountry = kind === "country" || upper.length === 2;
  if (!looksLikeCountry) return [upper];

  const hubs = countryHubs(upper);
  if (hubs?.length) return hubs;

  const cities = await loadCities();
  const codes = cities
    .filter(
      (c) =>
        c.country_code === upper &&
        c.code &&
        (c.has_flightable_airport === undefined || c.has_flightable_airport)
    )
    .map((c) => c.code!.toUpperCase());

  // Prefer well-known order: keep unique, cap hubs
  return [...new Set(codes)].slice(0, 10);
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);

  const from = (searchParams.get("from") ?? "").trim().toUpperCase();
  const to = (searchParams.get("to") ?? "").trim().toUpperCase();
  const fromKind = searchParams.get("fromKind") ?? undefined;
  const toKind = searchParams.get("toKind") ?? undefined;
  const dateFrom = searchParams.get("dateFrom") ?? "";
  const dateTo = searchParams.get("dateTo") ?? dateFrom;
  const returnFrom = searchParams.get("returnFrom") ?? undefined;
  const returnTo = searchParams.get("returnTo") ?? undefined;
  const trip = (searchParams.get("trip") as TripType | null) ?? "one-way";
  const seat = (searchParams.get("seat") as CabinClass | null) ?? "economy";
  const currency = (searchParams.get("currency") ?? "EUR").toUpperCase();
  const maxStopsRaw = searchParams.get("maxStops");
  const maxLayoverRaw = searchParams.get("maxLayover");
  const maxPriceRaw = searchParams.get("maxPrice");
  const airlinesRaw = searchParams.get("airlines");
  const limitRaw = searchParams.get("limit");

  if (!from || !to || !dateFrom) {
    return NextResponse.json(
      { ok: false, error: "from, to and dateFrom are required", flights: [], count: 0 },
      { status: 400 }
    );
  }

  const [origins, destinations] = await Promise.all([
    resolveSearchCodes(from, fromKind),
    resolveSearchCodes(to, toKind),
  ]);

  if (!origins.length || !destinations.length) {
    return NextResponse.json(
      {
        ok: false,
        error: `Could not expand ${!origins.length ? "origin" : "destination"} "${!origins.length ? from : to}" into airports. Try a city or airport instead.`,
        flights: [],
        count: 0,
      },
      { status: 400 }
    );
  }

  const maxStops =
    maxStopsRaw === null || maxStopsRaw === "" || maxStopsRaw === "any"
      ? null
      : Number(maxStopsRaw);
  const maxLayover =
    maxLayoverRaw === null || maxLayoverRaw === "" ? null : Number(maxLayoverRaw);
  const maxPrice =
    maxPriceRaw === null || maxPriceRaw === "" ? null : Number(maxPriceRaw);
  const airlines = airlinesRaw
    ? airlinesRaw
        .split(",")
        .map((a) => a.trim())
        .filter(Boolean)
    : undefined;
  const limit = limitRaw ? Number(limitRaw) : 100;
  const filters = {
    maxStops: Number.isFinite(maxStops as number) ? (maxStops as number) : null,
    maxLayoverMinutes: Number.isFinite(maxLayover as number)
      ? (maxLayover as number)
      : null,
    maxPrice: Number.isFinite(maxPrice as number) ? (maxPrice as number) : null,
    airlines,
    limit,
  };

  // Prefer Kiwi/Tequila (or FlightList proxy) for EU ULCC coverage + deep links.
  // Falls back to Google Flights when Kiwi cannot represent the place (region/
  // Anywhere) or when the upstream search is unavailable.
  const kiwi = await searchKiwiFlights({
    from,
    to,
    fromKind,
    toKind,
    dateFrom,
    dateTo,
    returnFrom,
    returnTo,
    trip,
    seat,
    currency,
    ...filters,
  });

  if (kiwi?.ok && kiwi.flights.length > 0) {
    return NextResponse.json(kiwi);
  }

  const result = await searchFlightsExpanded({
    from,
    to,
    origins,
    destinations,
    dateFrom,
    dateTo,
    returnFrom,
    returnTo,
    trip,
    seat,
    currency,
    ...filters,
  });

  const tagged = {
    ...result,
    flights: result.flights.map((f) =>
      f.provider ? f : { ...f, provider: "google" as const }
    ),
    warning:
      result.warning ||
      (kiwi?.warning
        ? kiwi.warning
        : kiwi === null
          ? undefined
          : "Kiwi unavailable — showing Google Flights results."),
  };

  return NextResponse.json(tagged, { status: tagged.ok ? 200 : 500 });
}
