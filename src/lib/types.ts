export type TripType = "one-way" | "round-trip";
export type CabinClass = "economy" | "premium-economy" | "business" | "first";

export type FlightEndpoint = {
  airport: string;
  airportName: string;
  date: string;
  time: string;
};

export type FlightSegment = {
  from: { code: string; name: string };
  to: { code: string; name: string };
  departure: { date: string; time: string };
  arrival: { date: string; time: string };
  durationMinutes: number;
  durationLabel: string;
  aircraft?: string | null;
};

export type FlightOffer = {
  id: string;
  price: number;
  currency: string;
  airlines: string[];
  stops: number;
  direct: boolean;
  durationMinutes: number;
  durationLabel: string;
  maxLayoverMinutes?: number | null;
  trip?: TripType;
  departure: FlightEndpoint;
  arrival: FlightEndpoint;
  segments: FlightSegment[];
  returnDeparture?: FlightEndpoint | null;
  returnArrival?: FlightEndpoint | null;
  returnSegments?: FlightSegment[] | null;
  outboundPrice?: number;
  returnPrice?: number;
  /** Affiliate / booking deep link (Kiwi). Falls back to Google Flights in UI. */
  deepLink?: string | null;
  provider?: "kiwi" | "google";
};

export type FlightSearchParams = {
  from: string;
  to: string;
  dateFrom: string;
  dateTo: string;
  returnFrom?: string;
  returnTo?: string;
  trip?: TripType;
  seat?: CabinClass;
  currency?: string;
  maxStops?: number | null;
  maxLayoverMinutes?: number | null;
  maxPrice?: number | null;
  airlines?: string[];
  limit?: number;
};

export type FlightSearchResponse = {
  ok: boolean;
  count: number;
  queriedDays?: number;
  errors?: number;
  flights: FlightOffer[];
  warning?: string;
  error?: string;
};

export type LocationResult = {
  id: string;
  code: string;
  name: string;
  kind: "airport" | "city" | "country" | "region" | "anywhere";
  countryCode?: string;
  countryName?: string;
  subtitle?: string;
  airports?: string[];
};
