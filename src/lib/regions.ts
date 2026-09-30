/** Region / country / city → search codes for expanded flight queries. */

export type PlaceKind = "airport" | "city" | "country" | "region" | "anywhere";

export type PlaceOption = {
  id: string;
  code: string;
  name: string;
  kind: PlaceKind;
  countryCode?: string;
  countryName?: string;
  subtitle?: string;
  /** Hub / airport codes used when expanding country/region/city searches */
  airports?: string[];
};

/** Multi-airport metro areas — city code searches all of these. */
export const CITY_AIRPORTS: Record<
  string,
  { name: string; countryCode: string; countryName: string; airports: string[] }
> = {
  PAR: {
    name: "Paris",
    countryCode: "FR",
    countryName: "France",
    airports: ["CDG", "ORY", "BVA"],
  },
  LON: {
    name: "London",
    countryCode: "GB",
    countryName: "United Kingdom",
    airports: ["LHR", "LGW", "STN", "LTN", "LCY"],
  },
  NYC: {
    name: "New York",
    countryCode: "US",
    countryName: "United States",
    airports: ["JFK", "EWR", "LGA"],
  },
  MIL: {
    name: "Milan",
    countryCode: "IT",
    countryName: "Italy",
    airports: ["MXP", "LIN", "BGY"],
  },
  ROM: {
    name: "Rome",
    countryCode: "IT",
    countryName: "Italy",
    airports: ["FCO", "CIA"],
  },
  IST: {
    name: "Istanbul",
    countryCode: "TR",
    countryName: "Turkey",
    airports: ["IST", "SAW"],
  },
  TYO: {
    name: "Tokyo",
    countryCode: "JP",
    countryName: "Japan",
    airports: ["HND", "NRT"],
  },
  SEL: {
    name: "Seoul",
    countryCode: "KR",
    countryName: "South Korea",
    airports: ["ICN", "GMP"],
  },
  BKK: {
    name: "Bangkok",
    countryCode: "TH",
    countryName: "Thailand",
    airports: ["BKK", "DMK"],
  },
  BUH: {
    name: "Bucharest",
    countryCode: "RO",
    countryName: "Romania",
    airports: ["OTP", "BBU"],
  },
  STO: {
    name: "Stockholm",
    countryCode: "SE",
    countryName: "Sweden",
    airports: ["ARN", "BMA", "NYO", "VST"],
  },
  CHI: {
    name: "Chicago",
    countryCode: "US",
    countryName: "United States",
    airports: ["ORD", "MDW"],
  },
  WAS: {
    name: "Washington",
    countryCode: "US",
    countryName: "United States",
    airports: ["IAD", "DCA", "BWI"],
  },
  YTO: {
    name: "Toronto",
    countryCode: "CA",
    countryName: "Canada",
    airports: ["YYZ", "YTZ"],
  },
  MOW: {
    name: "Moscow",
    countryCode: "RU",
    countryName: "Russia",
    airports: ["SVO", "DME", "VKO"],
  },
  SAO: {
    name: "Sao Paulo",
    countryCode: "BR",
    countryName: "Brazil",
    airports: ["GRU", "CGH", "VCP"],
  },
  RIO: {
    name: "Rio de Janeiro",
    countryCode: "BR",
    countryName: "Brazil",
    airports: ["GIG", "SDU"],
  },
  BER: {
    name: "Berlin",
    countryCode: "DE",
    countryName: "Germany",
    airports: ["BER"],
  },
  AMS: {
    name: "Amsterdam",
    countryCode: "NL",
    countryName: "Netherlands",
    airports: ["AMS"],
  },
  ATH: {
    name: "Athens",
    countryCode: "GR",
    countryName: "Greece",
    airports: ["ATH"],
  },
  BCN: {
    name: "Barcelona",
    countryCode: "ES",
    countryName: "Spain",
    airports: ["BCN"],
  },
  DXB: {
    name: "Dubai",
    countryCode: "AE",
    countryName: "United Arab Emirates",
    airports: ["DXB", "DWC"],
  },
  CPT: {
    name: "Cape Town",
    countryCode: "ZA",
    countryName: "South Africa",
    airports: ["CPT"],
  },
  BOM: {
    name: "Mumbai",
    countryCode: "IN",
    countryName: "India",
    airports: ["BOM"],
  },
};

export const REGIONS: PlaceOption[] = [
  {
    id: "region-europe",
    code: "EUROPE",
    name: "Europe",
    kind: "region",
    subtitle: "All cities · Region",
    airports: [
      "LON",
      "PAR",
      "AMS",
      "FRA",
      "MAD",
      "BCN",
      "ROM",
      "MIL",
      "VIE",
      "PRG",
      "BUD",
      "WAW",
      "ATH",
      "LIS",
      "DUB",
      "CPH",
      "STO",
      "OSL",
      "HEL",
      "ZRH",
      "IST",
      "BRU",
    ],
  },
  {
    id: "region-se-asia",
    code: "SEASIA",
    name: "South East Asia",
    kind: "region",
    subtitle: "All cities · Region",
    airports: ["BKK", "SIN", "KUL", "CGK", "SGN", "HAN", "MNL", "HKT", "DPS", "PEN"],
  },
  {
    id: "region-east-asia",
    code: "EASIA",
    name: "East Asia",
    kind: "region",
    subtitle: "All cities · Region",
    airports: ["TYO", "OSA", "SEL", "PEK", "SHA", "HKG", "TPE"],
  },
  {
    id: "region-south-asia",
    code: "SASIA",
    name: "South Asia",
    kind: "region",
    subtitle: "All cities · Region",
    airports: ["DEL", "BOM", "BLR", "MAA", "CMB", "KTM", "DAC"],
  },
  {
    id: "region-middle-east",
    code: "MEAST",
    name: "Middle East",
    kind: "region",
    subtitle: "All cities · Region",
    airports: ["DXB", "AUH", "DOH", "BAH", "RUH", "JED", "TLV", "AMM", "CAI"],
  },
  {
    id: "region-north-america",
    code: "NAMER",
    name: "North America",
    kind: "region",
    subtitle: "All cities · Region",
    airports: ["NYC", "LAX", "SFO", "CHI", "MIA", "BOS", "SEA", "YTO", "YVR", "MEX", "ATL", "DFW"],
  },
  {
    id: "region-south-america",
    code: "SAMER",
    name: "South America",
    kind: "region",
    subtitle: "All cities · Region",
    airports: ["SAO", "RIO", "EZE", "SCL", "BOG", "LIM", "MVD"],
  },
  {
    id: "region-africa",
    code: "AFRICA",
    name: "Africa",
    kind: "region",
    subtitle: "All cities · Region",
    airports: ["CAI", "JNB", "CPT", "NBO", "ADD", "CMN", "LOS", "ACC"],
  },
  {
    id: "region-oceania",
    code: "OCEANIA",
    name: "Oceania",
    kind: "region",
    subtitle: "All cities · Region",
    airports: ["SYD", "MEL", "BNE", "AKL", "PER", "ADL"],
  },
  {
    id: "region-caribbean",
    code: "CARIB",
    name: "Caribbean",
    kind: "region",
    subtitle: "All cities · Region",
    airports: ["SJU", "CUN", "PUJ", "MBJ", "NAS", "HAV"],
  },
];

export const COUNTRIES: PlaceOption[] = [
  {
    id: "country-TR",
    code: "TR",
    name: "Turkey",
    kind: "country",
    countryCode: "TR",
    subtitle: "All cities · Country",
    airports: ["IST", "SAW", "AYT", "ESB", "ADB", "BJV", "TZX", "GZT", "DLM", "ASR"],
  },
  {
    id: "country-NL",
    code: "NL",
    name: "Netherlands",
    kind: "country",
    countryCode: "NL",
    subtitle: "All cities · Country",
    airports: ["AMS", "EIN", "RTM", "GRQ"],
  },
  {
    id: "country-US",
    code: "US",
    name: "United States",
    kind: "country",
    countryCode: "US",
    subtitle: "All cities · Country",
    airports: ["NYC", "LAX", "CHI", "MIA", "SFO", "BOS", "SEA", "ATL", "DFW", "DEN", "IAD", "ORD"],
  },
  {
    id: "country-IT",
    code: "IT",
    name: "Italy",
    kind: "country",
    countryCode: "IT",
    subtitle: "All cities · Country",
    airports: ["ROM", "MIL", "VCE", "NAP", "FLR", "BLQ", "PSA", "CTA"],
  },
  {
    id: "country-ES",
    code: "ES",
    name: "Spain",
    kind: "country",
    countryCode: "ES",
    subtitle: "All cities · Country",
    airports: ["MAD", "BCN", "AGP", "PMI", "ALC", "VLC", "SVQ"],
  },
  {
    id: "country-DE",
    code: "DE",
    name: "Germany",
    kind: "country",
    countryCode: "DE",
    subtitle: "All cities · Country",
    airports: ["BER", "FRA", "MUC", "HAM", "DUS", "CGN", "STR"],
  },
  {
    id: "country-FR",
    code: "FR",
    name: "France",
    kind: "country",
    countryCode: "FR",
    subtitle: "All cities · Country",
    airports: ["PAR", "NCE", "LYS", "MRS", "TLS", "BOD"],
  },
  {
    id: "country-GB",
    code: "GB",
    name: "United Kingdom",
    kind: "country",
    countryCode: "GB",
    subtitle: "All cities · Country",
    airports: ["LON", "MAN", "EDI", "BHX", "GLA", "BRS"],
  },
  {
    id: "country-GR",
    code: "GR",
    name: "Greece",
    kind: "country",
    countryCode: "GR",
    subtitle: "All cities · Country",
    airports: ["ATH", "SKG", "HER", "RHO", "CFU", "JTR"],
  },
  {
    id: "country-PT",
    code: "PT",
    name: "Portugal",
    kind: "country",
    countryCode: "PT",
    subtitle: "All cities · Country",
    airports: ["LIS", "OPO", "FAO", "FNC"],
  },
  {
    id: "country-JP",
    code: "JP",
    name: "Japan",
    kind: "country",
    countryCode: "JP",
    subtitle: "All cities · Country",
    airports: ["TYO", "OSA", "NGO", "FUK", "CTS"],
  },
  {
    id: "country-TH",
    code: "TH",
    name: "Thailand",
    kind: "country",
    countryCode: "TH",
    subtitle: "All cities · Country",
    airports: ["BKK", "HKT", "CNX", "DMK"],
  },
  {
    id: "country-AE",
    code: "AE",
    name: "United Arab Emirates",
    kind: "country",
    countryCode: "AE",
    subtitle: "All cities · Country",
    airports: ["DXB", "AUH", "SHJ"],
  },
  {
    id: "country-ZA",
    code: "ZA",
    name: "South Africa",
    kind: "country",
    countryCode: "ZA",
    subtitle: "All cities · Country",
    airports: ["JNB", "CPT", "DUR"],
  },
  {
    id: "country-IN",
    code: "IN",
    name: "India",
    kind: "country",
    countryCode: "IN",
    subtitle: "All cities · Country",
    airports: ["DEL", "BOM", "BLR", "MAA", "HYD", "CCU", "GOI"],
  },
];

export const ANYWHERE: PlaceOption = {
  id: "anywhere",
  code: "ANYWHERE",
  name: "Anywhere",
  kind: "anywhere",
  subtitle: "Explore all destinations",
  airports: ["LON", "PAR", "AMS", "BCN", "ATH", "DXB", "BKK", "NYC", "IST", "MAD"],
};

export function cityPlace(code: string): PlaceOption | null {
  const meta = CITY_AIRPORTS[code.toUpperCase()];
  if (!meta) return null;
  const upper = code.toUpperCase();
  return {
    id: `city-${upper}`,
    code: upper,
    name: meta.name,
    kind: "city",
    countryCode: meta.countryCode,
    countryName: meta.countryName,
    subtitle:
      meta.airports.length > 1
        ? `All airports · ${meta.airports.join(", ")}`
        : meta.countryName,
    airports: meta.airports,
  };
}

export function placeLabel(place: Pick<PlaceOption, "kind" | "code" | "name" | "airports" | "subtitle">): {
  primary: string;
  secondary: string;
} {
  if (place.kind === "city") {
    const airports = place.airports ?? CITY_AIRPORTS[place.code]?.airports;
    if (airports && airports.length > 1) {
      return { primary: place.name, secondary: `All airports · ${place.code}` };
    }
    return { primary: place.name, secondary: place.code };
  }
  if (place.kind === "country") {
    return { primary: place.name, secondary: `All cities · ${place.code}` };
  }
  if (place.kind === "region") {
    return { primary: place.name, secondary: `All cities · Region` };
  }
  if (place.kind === "anywhere") {
    return { primary: place.name, secondary: "All destinations" };
  }
  return { primary: place.name, secondary: place.code };
}

/**
 * Expand a place into Google Flights search codes.
 * Cities keep their metro code (PAR/LON/NYC) so Google searches all airports.
 * Countries/regions expand to hub city/airport codes.
 */
export function expandPlaceToSearchCodes(
  code: string,
  kind?: string,
  explicitAirports?: string[]
): string[] {
  const upper = code.toUpperCase();
  if (upper === "ANYWHERE" || kind === "anywhere") {
    return ANYWHERE.airports ?? [];
  }
  if (kind === "country" || COUNTRIES.some((c) => c.code === upper)) {
    const country = COUNTRIES.find((c) => c.code === upper || c.id === code);
    if (country?.airports?.length) return country.airports;
  }
  if (kind === "region" || REGIONS.some((r) => r.code === upper)) {
    const region = REGIONS.find((r) => r.code === upper || r.id === code);
    if (region?.airports?.length) return region.airports;
  }
  if (explicitAirports?.length && (kind === "country" || kind === "region")) {
    return explicitAirports;
  }
  // City metro codes: use city code when it differs from member airports
  // (PAR/LON/NYC). If the city code is also an airport code (IST), expand
  // to every airport so Sabiha/etc. are not dropped.
  if (kind === "city" || CITY_AIRPORTS[upper]) {
    const meta = CITY_AIRPORTS[upper];
    if (meta && meta.airports.length > 1 && meta.airports.includes(upper)) {
      return [...meta.airports];
    }
    return [upper];
  }
  return [upper];
}

export function expandPlaceToAirports(place: PlaceOption | null | undefined): string[] {
  if (!place) return [];
  return expandPlaceToSearchCodes(place.code, place.kind, place.airports);
}

export function findStaticPlace(query: string): PlaceOption[] {
  const q = query.trim().toLowerCase();
  if (!q) return [ANYWHERE, ...REGIONS.slice(0, 5), ...COUNTRIES.slice(0, 4)];

  const cities = Object.keys(CITY_AIRPORTS)
    .map((code) => cityPlace(code))
    .filter((p): p is PlaceOption => Boolean(p));

  const pool = [ANYWHERE, ...REGIONS, ...COUNTRIES, ...cities];
  return pool.filter(
    (p) =>
      p.name.toLowerCase().includes(q) ||
      p.code.toLowerCase().includes(q) ||
      p.countryName?.toLowerCase().includes(q) ||
      p.subtitle?.toLowerCase().includes(q)
  );
}

/** Individual airports belonging to a city metro, for picker listing. */
export function airportsForCityQuery(query: string): PlaceOption[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  const out: PlaceOption[] = [];
  for (const [cityCode, meta] of Object.entries(CITY_AIRPORTS)) {
    if (
      meta.name.toLowerCase().includes(q) ||
      cityCode.toLowerCase().includes(q) ||
      meta.airports.some((a) => a.toLowerCase() === q)
    ) {
      for (const ap of meta.airports) {
        out.push({
          id: `airport-${ap}`,
          code: ap,
          name: airportDisplayName(ap, meta.name),
          kind: "airport",
          countryCode: meta.countryCode,
          countryName: meta.countryName,
          subtitle: `${meta.name} · Airport`,
        });
      }
    }
  }
  return out;
}

function airportDisplayName(code: string, cityName: string): string {
  const names: Record<string, string> = {
    CDG: "Paris Charles de Gaulle",
    ORY: "Paris Orly",
    BVA: "Paris Beauvais",
    LHR: "London Heathrow",
    LGW: "London Gatwick",
    STN: "London Stansted",
    LTN: "London Luton",
    LCY: "London City",
    JFK: "New York JFK",
    EWR: "Newark Liberty",
    LGA: "New York LaGuardia",
    MXP: "Milan Malpensa",
    LIN: "Milan Linate",
    BGY: "Milan Bergamo",
    FCO: "Rome Fiumicino",
    CIA: "Rome Ciampino",
    IST: "Istanbul Airport",
    SAW: "Istanbul Sabiha Gökçen",
    HND: "Tokyo Haneda",
    NRT: "Tokyo Narita",
    ICN: "Seoul Incheon",
    GMP: "Seoul Gimpo",
    BKK: "Bangkok Suvarnabhumi",
    DMK: "Bangkok Don Mueang",
    DXB: "Dubai International",
    DWC: "Dubai World Central",
  };
  return names[code] ?? `${cityName} (${code})`;
}
