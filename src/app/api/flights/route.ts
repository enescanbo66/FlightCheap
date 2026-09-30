import { NextResponse } from "next/server";

import { searchFlightsExpanded } from "@/lib/flights";
import { ANYWHERE, COUNTRIES, REGIONS, expandPlaceToAirports } from "@/lib/regions";
import type { CabinClass, TripType } from "@/lib/types";

function resolveDestinations(code: string, kind?: string): string[] {
  const upper = code.toUpperCase();
  if (upper === "ANYWHERE" || kind === "anywhere") {
    return ANYWHERE.airports ?? [];
  }
  const region = REGIONS.find((r) => r.code === upper || r.id === code);
  if (region) return expandPlaceToAirports(region);
  const country = COUNTRIES.find((c) => c.code === upper || c.id === code);
  if (country) return expandPlaceToAirports(country);
  return [upper];
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);

  const from = (searchParams.get("from") ?? "").trim().toUpperCase();
  const to = (searchParams.get("to") ?? "").trim().toUpperCase();
  const dateFrom = searchParams.get("dateFrom") ?? "";
  const dateTo = searchParams.get("dateTo") ?? dateFrom;
  const returnFrom = searchParams.get("returnFrom") ?? undefined;
  const returnTo = searchParams.get("returnTo") ?? undefined;
  const trip = (searchParams.get("trip") as TripType | null) ?? "one-way";
  const seat = (searchParams.get("seat") as CabinClass | null) ?? "economy";
  const currency = (searchParams.get("currency") ?? "USD").toUpperCase();
  const toKind = searchParams.get("toKind") ?? undefined;
  const maxStopsRaw = searchParams.get("maxStops");
  const maxPriceRaw = searchParams.get("maxPrice");
  const airlinesRaw = searchParams.get("airlines");
  const limitRaw = searchParams.get("limit");

  if (!from || !to || !dateFrom) {
    return NextResponse.json(
      { ok: false, error: "from, to and dateFrom are required", flights: [], count: 0 },
      { status: 400 }
    );
  }

  const destinations = resolveDestinations(to, toKind);
  const maxStops =
    maxStopsRaw === null || maxStopsRaw === "" || maxStopsRaw === "any"
      ? null
      : Number(maxStopsRaw);
  const maxPrice =
    maxPriceRaw === null || maxPriceRaw === "" ? null : Number(maxPriceRaw);
  const airlines = airlinesRaw
    ? airlinesRaw
        .split(",")
        .map((a) => a.trim())
        .filter(Boolean)
    : undefined;

  const result = await searchFlightsExpanded({
    from,
    to,
    destinations,
    dateFrom,
    dateTo,
    returnFrom,
    returnTo,
    trip,
    seat,
    currency,
    maxStops: Number.isFinite(maxStops as number) ? (maxStops as number) : null,
    maxPrice: Number.isFinite(maxPrice as number) ? (maxPrice as number) : null,
    airlines,
    limit: limitRaw ? Number(limitRaw) : 80,
  });

  return NextResponse.json(result, { status: result.ok ? 200 : 500 });
}
