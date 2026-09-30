import { NextResponse } from "next/server";

import {
  ANYWHERE,
  COUNTRIES,
  REGIONS,
  airportsForCityQuery,
  cityPlace,
  expandPlaceToAirports,
  findStaticPlace,
  placeLabel,
} from "@/lib/regions";
import type { LocationResult } from "@/lib/types";

type TpPlace = {
  id?: string;
  type?: string;
  code?: string;
  name?: string;
  country_code?: string;
  country_name?: string;
  city_code?: string;
  city_name?: string;
  main_airport_name?: string | null;
};

function enrichCity(place: LocationResult): LocationResult {
  const city = cityPlace(place.code);
  if (place.kind === "city" || city) {
    const base = city ?? place;
    const label = placeLabel(base);
    return {
      ...base,
      id: place.id.startsWith("city-") ? place.id : `city-${place.code}`,
      kind: "city",
      name: base.name,
      subtitle: label.secondary,
      airports: base.airports ?? city?.airports,
    };
  }
  return place;
}

function mapTp(place: TpPlace): LocationResult | null {
  if (!place.code || !place.name) return null;

  // Travelpayouts country type (2-letter)
  if (place.type === "country" || (place.code.length === 2 && !place.city_code)) {
    const known = COUNTRIES.find(
      (c) => c.code === place.code || c.countryCode === place.code
    );
    if (known) {
      return { ...known, id: known.id };
    }
    return {
      id: `country-${place.code}`,
      code: place.code,
      name: place.name,
      kind: "country",
      countryCode: place.code,
      countryName: place.name,
      subtitle: `All cities · ${place.code}`,
    };
  }

  if (place.type === "airport") {
    return {
      id: place.id ?? `airport-${place.code}`,
      code: place.code,
      name: place.name,
      kind: "airport",
      countryCode: place.country_code,
      countryName: place.country_name,
      subtitle: [place.city_name, "Airport"].filter(Boolean).join(" · "),
    };
  }

  // City
  const mapped: LocationResult = {
    id: place.id ?? `city-${place.code}`,
    code: place.code,
    name: place.name,
    kind: "city",
    countryCode: place.country_code,
    countryName: place.country_name,
    subtitle: place.country_name ?? "City",
  };
  return enrichCity(mapped);
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = (searchParams.get("q") ?? "").trim();

  const staticHits = findStaticPlace(q).slice(0, 10);
  const cityAirports = airportsForCityQuery(q);

  if (!q) {
    const popular: LocationResult[] = [
      ANYWHERE,
      ...COUNTRIES.filter((c) => ["NL", "TR", "US", "FR"].includes(c.code)),
      ...REGIONS.slice(0, 3),
      enrichCity({
        id: "city-IST",
        code: "IST",
        name: "Istanbul",
        kind: "city",
        countryCode: "TR",
        countryName: "Turkey",
      }),
      enrichCity({
        id: "city-PAR",
        code: "PAR",
        name: "Paris",
        kind: "city",
        countryCode: "FR",
        countryName: "France",
      }),
      enrichCity({
        id: "city-LON",
        code: "LON",
        name: "London",
        kind: "city",
        countryCode: "GB",
        countryName: "United Kingdom",
      }),
    ];
    return NextResponse.json({ results: popular });
  }

  let remote: LocationResult[] = [];
  try {
    const url = new URL("https://autocomplete.travelpayouts.com/places2");
    url.searchParams.set("term", q);
    url.searchParams.set("locale", "en");
    url.searchParams.append("types[]", "city");
    url.searchParams.append("types[]", "airport");
    url.searchParams.append("types[]", "country");

    const res = await fetch(url.toString(), {
      headers: { Accept: "application/json" },
      next: { revalidate: 3600 },
    });
    if (res.ok) {
      const data = (await res.json()) as TpPlace[];
      remote = data
        .slice(0, 16)
        .map(mapTp)
        .filter((x): x is LocationResult => Boolean(x));
    }
  } catch {
    // autocomplete is best-effort
  }

  const merged: LocationResult[] = [];
  const seen = new Set<string>();
  for (const item of [...staticHits, ...remote, ...cityAirports]) {
    let place = item;
    if (place.kind === "city") place = enrichCity(place);
    if (place.kind === "country" && !place.subtitle?.includes("All cities")) {
      place = { ...place, subtitle: `All cities · ${place.code}` };
    }
    const key = `${place.kind}:${place.code}`;
    if (seen.has(key)) continue;
    seen.add(key);
    if (!place.airports) {
      const airports = expandPlaceToAirports(place);
      if (airports.length > 1) place = { ...place, airports };
    }
    merged.push(place);
  }

  const qLower = q.toLowerCase();
  const rank = (p: LocationResult) => {
    const name = p.name.toLowerCase();
    const exact = name === qLower || p.code.toLowerCase() === qLower ? 0 : 1;
    const prefix = name.startsWith(qLower) ? 0 : 2;
    const kindRank =
      p.kind === "country" || p.kind === "region"
        ? 0
        : p.kind === "city"
          ? 1
          : p.kind === "airport"
            ? 2
            : 3;
    // Prefer airports that belong to a matched city name
    const cityAirportBoost =
      p.kind === "airport" &&
      (p.subtitle?.toLowerCase().includes(qLower) ||
        p.name.toLowerCase().includes(qLower))
        ? 0
        : p.kind === "airport"
          ? 3
          : 0;
    return exact * 100 + prefix * 20 + kindRank + cityAirportBoost;
  };
  merged.sort((a, b) => rank(a) - rank(b));

  // Drop weak remote noise when we already have strong local matches
  const strong = merged.filter(
    (p) =>
      p.name.toLowerCase().includes(qLower) ||
      p.code.toLowerCase() === qLower ||
      p.subtitle?.toLowerCase().includes(qLower) ||
      p.kind === "country" ||
      p.kind === "region"
  );
  const results = (strong.length >= 3 ? strong : merged).slice(0, 16);

  return NextResponse.json({ results });
}
