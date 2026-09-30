/** Region / country → representative airport (or city) IATA codes for expanded search. */

export type PlaceKind = "airport" | "city" | "country" | "region" | "anywhere";

export type PlaceOption = {
  id: string;
  code: string;
  name: string;
  kind: PlaceKind;
  countryCode?: string;
  countryName?: string;
  subtitle?: string;
  airports?: string[];
};

export const REGIONS: PlaceOption[] = [
  {
    id: "region-europe",
    code: "EUROPE",
    name: "Europe",
    kind: "region",
    subtitle: "Region",
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
    ],
  },
  {
    id: "region-se-asia",
    code: "SEASIA",
    name: "South East Asia",
    kind: "region",
    subtitle: "Region",
    airports: ["BKK", "SIN", "KUL", "CGK", "SGN", "HAN", "MNL", "HKT", "DPS", "PEN"],
  },
  {
    id: "region-east-asia",
    code: "EASIA",
    name: "East Asia",
    kind: "region",
    subtitle: "Region",
    airports: ["TYO", "OSA", "SEL", "ICN", "PEK", "SHA", "HKG", "TPE"],
  },
  {
    id: "region-south-asia",
    code: "SASIA",
    name: "South Asia",
    kind: "region",
    subtitle: "Region",
    airports: ["DEL", "BOM", "BLR", "MAA", "CMB", "KTM", "DAC"],
  },
  {
    id: "region-middle-east",
    code: "MEAST",
    name: "Middle East",
    kind: "region",
    subtitle: "Region",
    airports: ["DXB", "AUH", "DOH", "BAH", "RUH", "JED", "TLV", "AMM", "CAI"],
  },
  {
    id: "region-north-america",
    code: "NAMER",
    name: "North America",
    kind: "region",
    subtitle: "Region",
    airports: [
      "NYC",
      "LAX",
      "SFO",
      "CHI",
      "MIA",
      "BOS",
      "SEA",
      "YTO",
      "YVR",
      "MEX",
    ],
  },
  {
    id: "region-south-america",
    code: "SAMER",
    name: "South America",
    kind: "region",
    subtitle: "Region",
    airports: ["GRU", "GIG", "EZE", "SCL", "BOG", "LIM", "MVD"],
  },
  {
    id: "region-africa",
    code: "AFRICA",
    name: "Africa",
    kind: "region",
    subtitle: "Region",
    airports: ["CAI", "JNB", "CPT", "NBO", "ADD", "CMN", "LOS", "ACC"],
  },
  {
    id: "region-oceania",
    code: "OCEANIA",
    name: "Oceania",
    kind: "region",
    subtitle: "Region",
    airports: ["SYD", "MEL", "BNE", "AKL", "PER", "ADL"],
  },
  {
    id: "region-caribbean",
    code: "CARIB",
    name: "Caribbean",
    kind: "region",
    subtitle: "Region",
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
    subtitle: "Country",
    airports: ["IST", "SAW", "AYT", "ESB", "ADB", "BJV", "TZX", "GZT"],
  },
  {
    id: "country-IT",
    code: "IT",
    name: "Italy",
    kind: "country",
    countryCode: "IT",
    subtitle: "Country",
    airports: ["ROM", "MIL", "VCE", "NAP", "FLR", "BLQ", "PSA", "CTA"],
  },
  {
    id: "country-ES",
    code: "ES",
    name: "Spain",
    kind: "country",
    countryCode: "ES",
    subtitle: "Country",
    airports: ["MAD", "BCN", "AGP", "PMI", "ALC", "VLC", "SVQ"],
  },
  {
    id: "country-DE",
    code: "DE",
    name: "Germany",
    kind: "country",
    countryCode: "DE",
    subtitle: "Country",
    airports: ["BER", "FRA", "MUC", "HAM", "DUS", "CGN", "STR"],
  },
  {
    id: "country-FR",
    code: "FR",
    name: "France",
    kind: "country",
    countryCode: "FR",
    subtitle: "Country",
    airports: ["PAR", "NCE", "LYS", "MRS", "TLS", "BOD"],
  },
  {
    id: "country-GB",
    code: "GB",
    name: "United Kingdom",
    kind: "country",
    countryCode: "GB",
    subtitle: "Country",
    airports: ["LON", "MAN", "EDI", "BHX", "GLA", "BRS"],
  },
  {
    id: "country-NL",
    code: "NL",
    name: "Netherlands",
    kind: "country",
    countryCode: "NL",
    subtitle: "Country",
    airports: ["AMS", "EIN", "RTM"],
  },
  {
    id: "country-US",
    code: "US",
    name: "United States",
    kind: "country",
    countryCode: "US",
    subtitle: "Country",
    airports: ["NYC", "LAX", "CHI", "MIA", "SFO", "BOS", "SEA", "ATL", "DFW", "DEN"],
  },
  {
    id: "country-GR",
    code: "GR",
    name: "Greece",
    kind: "country",
    countryCode: "GR",
    subtitle: "Country",
    airports: ["ATH", "SKG", "HER", "RHO", "CFU", "JTR"],
  },
  {
    id: "country-PT",
    code: "PT",
    name: "Portugal",
    kind: "country",
    countryCode: "PT",
    subtitle: "Country",
    airports: ["LIS", "OPO", "FAO", "FNC"],
  },
  {
    id: "country-JP",
    code: "JP",
    name: "Japan",
    kind: "country",
    countryCode: "JP",
    subtitle: "Country",
    airports: ["TYO", "OSA", "NGO", "FUK", "CTS"],
  },
  {
    id: "country-TH",
    code: "TH",
    name: "Thailand",
    kind: "country",
    countryCode: "TH",
    subtitle: "Country",
    airports: ["BKK", "HKT", "CNX", "DMK"],
  },
];

export const ANYWHERE: PlaceOption = {
  id: "anywhere",
  code: "ANYWHERE",
  name: "Anywhere",
  kind: "anywhere",
  subtitle: "Explore",
  airports: ["LON", "PAR", "AMS", "BCN", "ATH", "DXB", "BKK", "NYC"],
};

export function expandPlaceToAirports(place: PlaceOption | null | undefined): string[] {
  if (!place) return [];
  if (place.kind === "airport" || place.kind === "city") {
    return [place.code];
  }
  return place.airports?.length ? place.airports : [place.code];
}

export function findStaticPlace(query: string): PlaceOption[] {
  const q = query.trim().toLowerCase();
  if (!q) return [ANYWHERE, ...REGIONS.slice(0, 6)];

  const pool = [ANYWHERE, ...REGIONS, ...COUNTRIES];
  return pool.filter(
    (p) =>
      p.name.toLowerCase().includes(q) ||
      p.code.toLowerCase().includes(q) ||
      p.countryName?.toLowerCase().includes(q)
  );
}
