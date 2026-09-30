import { NextResponse } from "next/server";

import { searchFlightsExpanded } from "@/lib/flights";
import { expandPlaceToSearchCodes } from "@/lib/regions";
import type { CabinClass, TripType } from "@/lib/types";

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

  const origins = expandPlaceToSearchCodes(from, fromKind);
  const destinations = expandPlaceToSearchCodes(to, toKind);

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
    maxStops: Number.isFinite(maxStops as number) ? (maxStops as number) : null,
    maxLayoverMinutes: Number.isFinite(maxLayover as number)
      ? (maxLayover as number)
      : null,
    maxPrice: Number.isFinite(maxPrice as number) ? (maxPrice as number) : null,
    airlines,
    limit: limitRaw ? Number(limitRaw) : 100,
  });

  return NextResponse.json(result, { status: result.ok ? 200 : 500 });
}
