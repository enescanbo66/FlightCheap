"use client";

import { addDays, format } from "date-fns";
import { ArrowLeftRight, Search, SlidersHorizontal } from "lucide-react";
import { useMemo, useState } from "react";
import type { DateRange } from "react-day-picker";

import { DateRangePicker } from "@/components/date-range-picker";
import { FlightResults } from "@/components/flight-results";
import { LocationPicker } from "@/components/location-picker";
import { Button, buttonVariants } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import type { CabinClass, FlightOffer, LocationResult, TripType } from "@/lib/types";
import { cn } from "@/lib/utils";

const defaultOutbound: DateRange = {
  from: addDays(new Date(), 7),
  to: addDays(new Date(), 21),
};

export function FlightSearchApp() {
  const [from, setFrom] = useState<LocationResult | null>({
    id: "city-IST",
    code: "IST",
    name: "Istanbul",
    kind: "city",
    countryCode: "TR",
    countryName: "Turkey",
    subtitle: "Turkey",
  });
  const [to, setTo] = useState<LocationResult | null>({
    id: "city-ATH",
    code: "ATH",
    name: "Athens",
    kind: "city",
    countryCode: "GR",
    countryName: "Greece",
    subtitle: "Greece",
  });
  const [trip, setTrip] = useState<TripType>("one-way");
  const [outbound, setOutbound] = useState<DateRange | undefined>(defaultOutbound);
  const [inbound, setInbound] = useState<DateRange | undefined>({
    from: addDays(new Date(), 14),
    to: addDays(new Date(), 28),
  });
  const [seat, setSeat] = useState<CabinClass>("economy");
  const [currency, setCurrency] = useState("USD");
  const [directOnly, setDirectOnly] = useState(false);
  const [maxPrice, setMaxPrice] = useState<number>(1500);
  const [priceEnabled, setPriceEnabled] = useState(false);
  const [airlineQuery, setAirlineQuery] = useState("");
  const [showFilters, setShowFilters] = useState(false);

  const [flights, setFlights] = useState<FlightOffer[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [warning, setWarning] = useState<string | null>(null);
  const [searched, setSearched] = useState(false);
  const [loading, setLoading] = useState(false);

  const canSearch = Boolean(from && to && outbound?.from);

  const swapPlaces = () => {
    setFrom(to);
    setTo(from);
  };

  const onSearch = async () => {
    if (!from || !to || !outbound?.from) return;

    const dateFrom = format(outbound.from, "yyyy-MM-dd");
    const dateTo = format(outbound.to ?? outbound.from, "yyyy-MM-dd");

    const params = new URLSearchParams({
      from: from.code,
      to: to.code,
      toKind: to.kind,
      dateFrom,
      dateTo,
      trip,
      seat,
      currency,
    });

    if (trip === "round-trip" && inbound?.from) {
      params.set("returnFrom", format(inbound.from, "yyyy-MM-dd"));
      params.set("returnTo", format(inbound.to ?? inbound.from, "yyyy-MM-dd"));
    }
    if (directOnly) params.set("maxStops", "0");
    if (priceEnabled) params.set("maxPrice", String(maxPrice));
    if (airlineQuery.trim()) params.set("airlines", airlineQuery.trim());

    setSearched(true);
    setError(null);
    setWarning(null);
    setLoading(true);
    try {
      const res = await fetch(`/api/flights?${params.toString()}`);
      const data = (await res.json()) as {
        ok: boolean;
        flights: FlightOffer[];
        error?: string;
        warning?: string;
      };
      if (!res.ok || !data.ok) {
        setFlights([]);
        setError(data.error ?? "Could not search flights");
        return;
      }
      setFlights(data.flights ?? []);
      setWarning(data.warning ?? null);
    } catch (err) {
      setFlights([]);
      setError(err instanceof Error ? err.message : "Network error");
    } finally {
      setLoading(false);
    }
  };

  const filterHint = useMemo(() => {
    const bits = [];
    if (directOnly) bits.push("direct only");
    if (priceEnabled) bits.push(`max ${currency} ${maxPrice}`);
    if (airlineQuery.trim()) bits.push(airlineQuery.trim());
    return bits.length ? bits.join(" · ") : "No extra filters";
  }, [airlineQuery, currency, directOnly, maxPrice, priceEnabled]);

  return (
    <div className="mx-auto w-full max-w-6xl px-4 pb-20 pt-6 sm:px-6 lg:px-8">
      <header className="mb-10 flex items-center justify-between gap-4">
        <a href="/" className="group flex items-center gap-2.5">
          <span className="grid size-9 place-items-center rounded-xl bg-sky-700 text-white shadow-lg shadow-sky-700/25 transition-transform duration-300 group-hover:-rotate-6">
            <svg viewBox="0 0 24 24" className="size-5 fill-current" aria-hidden>
              <path d="M21 16v-2l-8-5V3.5a1.5 1.5 0 0 0-3 0V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z" />
            </svg>
          </span>
          <span className="font-[family-name:var(--font-display)] text-2xl font-bold tracking-tight text-sky-950">
            FlyList
          </span>
        </a>
        <div className="flex items-center gap-2">
          <Select
            value={currency}
            onValueChange={(v) => {
              if (v) setCurrency(v);
            }}
          >
            <SelectTrigger className="h-9 w-[5.5rem] border-sky-900/10 bg-white/80">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {["USD", "EUR", "TRY", "GBP"].map((c) => (
                <SelectItem key={c} value={c}>
                  {c}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </header>

      <section className="relative mb-8 overflow-hidden rounded-[1.75rem] border border-sky-900/10 bg-white/70 p-5 shadow-[0_30px_80px_-48px_rgba(8,47,73,0.55)] backdrop-blur sm:p-7">
        <div className="pointer-events-none absolute -right-16 -top-20 size-56 rounded-full bg-sky-300/25 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 -left-10 size-64 rounded-full bg-cyan-200/30 blur-3xl" />

        <div className="relative">
          <p className="font-[family-name:var(--font-display)] text-4xl font-bold tracking-tight text-sky-950 sm:text-5xl">
            FlyList
          </p>
          <h1 className="mt-2 max-w-2xl text-xl font-medium text-slate-700 sm:text-2xl">
            Cheap Flights. Simplified.
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-600 sm:text-base">
            Search any airport, city, country or region across a flexible date range —
            then sort every airline by the lowest fare.
          </p>

          <div className="mt-6 flex flex-wrap gap-2">
            {(
              [
                ["one-way", "One-way"],
                ["round-trip", "Round-trip"],
              ] as const
            ).map(([value, label]) => (
              <button
                key={value}
                type="button"
                onClick={() => setTrip(value)}
                className={cn(
                  "rounded-full px-4 py-1.5 text-sm font-semibold transition-colors",
                  trip === value
                    ? "bg-sky-700 text-white"
                    : "bg-sky-50 text-sky-900 hover:bg-sky-100"
                )}
              >
                {label}
              </button>
            ))}
          </div>

          <div className="mt-5 grid gap-3 lg:grid-cols-[1fr_auto_1fr]">
            <LocationPicker label="From" value={from} onChange={setFrom} />
            <div className="flex items-end justify-center">
              <button
                type="button"
                onClick={swapPlaces}
                aria-label="Swap origin and destination"
                className={cn(
                  buttonVariants({ variant: "outline", size: "icon" }),
                  "mb-0.5 size-12 shrink-0 rounded-full border-sky-900/10 bg-white text-sky-800 hover:bg-sky-50"
                )}
              >
                <ArrowLeftRight className="size-4" />
              </button>
            </div>
            <LocationPicker
              label="To"
              value={to}
              onChange={setTo}
              placeholder="Anywhere, city, country, region…"
            />
          </div>

          <div className="mt-3 grid gap-3 md:grid-cols-2">
            <DateRangePicker
              label="Depart between"
              range={outbound}
              onChange={setOutbound}
            />
            <DateRangePicker
              label="Return between"
              range={inbound}
              onChange={setInbound}
              disabled={trip !== "round-trip"}
            />
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-3">
            <Select
              value={seat}
              onValueChange={(v) => {
                if (v) setSeat(v as CabinClass);
              }}
              items={{
                economy: "Economy",
                "premium-economy": "Premium economy",
                business: "Business",
                first: "First",
              }}
            >
              <SelectTrigger className="h-10 w-[11rem] border-sky-900/10 bg-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="economy">Economy</SelectItem>
                <SelectItem value="premium-economy">Premium economy</SelectItem>
                <SelectItem value="business">Business</SelectItem>
                <SelectItem value="first">First</SelectItem>
              </SelectContent>
            </Select>

            <Button
              type="button"
              variant="outline"
              className="h-10 border-sky-900/10 bg-white"
              onClick={() => setShowFilters((v) => !v)}
            >
              <SlidersHorizontal className="size-4" />
              Filters
            </Button>

            <button
              type="button"
              disabled={!canSearch || loading}
              onClick={() => {
                void onSearch();
              }}
              className={cn(
                buttonVariants(),
                "ml-auto h-11 min-w-[9rem] bg-sky-700 px-6 text-white hover:bg-sky-800 disabled:opacity-50"
              )}
            >
              <Search className="size-4" />
              {loading ? "Searching…" : "Search"}
            </button>
          </div>

          <div
            className={cn(
              "grid transition-[grid-template-rows,opacity,margin] duration-300 ease-out",
              showFilters
                ? "mt-4 grid-rows-[1fr] opacity-100"
                : "mt-0 grid-rows-[0fr] opacity-0"
            )}
          >
            <div className="min-h-0 overflow-hidden">
              <div className="grid gap-4 rounded-2xl bg-sky-50/80 p-4 ring-1 ring-sky-900/5 md:grid-cols-3">
                <label className="flex cursor-pointer items-center gap-3 rounded-xl bg-white/80 px-3 py-3 ring-1 ring-sky-900/5">
                  <Checkbox
                    checked={directOnly}
                    onCheckedChange={(v) => setDirectOnly(Boolean(v))}
                  />
                  <span>
                    <span className="block text-sm font-semibold text-slate-900">
                      Direct flights only
                    </span>
                    <span className="text-xs text-slate-500">No layovers</span>
                  </span>
                </label>

                <div className="rounded-xl bg-white/80 px-3 py-3 ring-1 ring-sky-900/5">
                  <div className="mb-2 flex items-center justify-between gap-2">
                    <Label className="text-sm font-semibold">Max budget</Label>
                    <label className="flex items-center gap-2 text-xs text-slate-500">
                      <Checkbox
                        checked={priceEnabled}
                        onCheckedChange={(v) => setPriceEnabled(Boolean(v))}
                      />
                      Enable
                    </label>
                  </div>
                  <Slider
                    min={50}
                    max={3000}
                    step={25}
                    value={[maxPrice]}
                    disabled={!priceEnabled}
                    onValueChange={(v) => {
                      const next = Array.isArray(v) ? v[0] : v;
                      if (typeof next === "number") setMaxPrice(next);
                    }}
                  />
                  <p className="mt-2 text-xs text-slate-500">
                    {currency} {maxPrice}
                  </p>
                </div>

                <div className="rounded-xl bg-white/80 px-3 py-3 ring-1 ring-sky-900/5">
                  <Label htmlFor="airline" className="text-sm font-semibold">
                    Airline filter
                  </Label>
                  <Input
                    id="airline"
                    value={airlineQuery}
                    onChange={(e) => setAirlineQuery(e.target.value)}
                    placeholder="e.g. Turkish, Ryanair"
                    className="mt-2 h-9 border-sky-900/10 bg-white"
                  />
                </div>
              </div>
              <p className="mt-2 text-xs text-slate-500">{filterHint}</p>
            </div>
          </div>
        </div>
      </section>

      <FlightResults
        flights={flights}
        loading={loading}
        error={error}
        warning={warning}
      />

      {!searched && !loading ? (
        <p className="mt-4 text-center text-xs text-slate-500">
          Tip: try Netherlands → Italy or Europe → South East Asia to uncover cheaper routes.
        </p>
      ) : null}
    </div>
  );
}
