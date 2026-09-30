import { NextResponse } from "next/server";

import { expandPlaceToAirports, findStaticPlace, ANYWHERE, REGIONS, COUNTRIES } from "@/lib/regions";
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

function mapTp(place: TpPlace): LocationResult | null {
  if (!place.code || !place.name) return null;
  const kind = place.type === "airport" ? "airport" : "city";
  const subtitle =
    kind === "airport"
      ? [place.city_name, place.country_name].filter(Boolean).join(", ")
      : place.country_name ?? "City";

  return {
    id: place.id ?? `${kind}-${place.code}`,
    code: place.code,
    name: place.name,
    kind,
    countryCode: place.country_code,
    countryName: place.country_name,
    subtitle,
  };
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = (searchParams.get("q") ?? "").trim();

  const staticHits = findStaticPlace(q).slice(0, 8);

  if (!q) {
    const popular: LocationResult[] = [
      ANYWHERE,
      ...REGIONS.slice(0, 4),
      {
        id: "city-IST",
        code: "IST",
        name: "Istanbul",
        kind: "city",
        countryCode: "TR",
        countryName: "Turkey",
        subtitle: "Turkey",
      },
      {
        id: "city-LON",
        code: "LON",
        name: "London",
        kind: "city",
        countryCode: "GB",
        countryName: "United Kingdom",
        subtitle: "United Kingdom",
      },
      {
        id: "city-NYC",
        code: "NYC",
        name: "New York",
        kind: "city",
        countryCode: "US",
        countryName: "United States",
        subtitle: "United States",
      },
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
        .slice(0, 12)
        .map(mapTp)
        .filter((x): x is LocationResult => Boolean(x));

      // Enrich country hits with our airport lists when available
      remote = remote.map((place) => {
        if (place.kind !== "city" && place.kind !== "airport") return place;
        const country = COUNTRIES.find(
          (c) => c.countryCode === place.countryCode || c.code === place.code
        );
        if (place.code.length === 2 && country) {
          return {
            ...country,
            id: country.id,
          };
        }
        return place;
      });
    }
  } catch {
    // autocomplete is best-effort
  }

  // Prefer exact static region/country matches first
  const merged: LocationResult[] = [];
  const seen = new Set<string>();
  for (const item of [...staticHits, ...remote]) {
    const key = `${item.kind}:${item.code}:${item.name}`;
    if (seen.has(key)) continue;
    seen.add(key);
    if (!item.airports) {
      const airports = expandPlaceToAirports(item);
      if (airports.length > 1) item.airports = airports;
    }
    merged.push(item);
  }

  return NextResponse.json({ results: merged.slice(0, 16) });
}
