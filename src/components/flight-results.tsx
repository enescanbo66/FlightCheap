"use client";

import { format } from "date-fns";
import { AlertTriangle, ChevronDown, ExternalLink } from "lucide-react";
import { useMemo, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import type { FlightOffer, FlightSegment } from "@/lib/types";
import { cn } from "@/lib/utils";

function formatMoney(price: number, currency: string) {
  const locale =
    currency === "TRY" ? "tr-TR" : currency === "EUR" ? "de-DE" : "en-US";
  try {
    return new Intl.NumberFormat(locale, {
      style: "currency",
      currency,
      maximumFractionDigits: 0,
    }).format(price);
  } catch {
    return `${currency} ${price}`;
  }
}

function formatPrettyDate(iso: string) {
  try {
    return format(new Date(`${iso}T12:00:00`), "EEE MMM do yyyy");
  } catch {
    return iso;
  }
}

function formatLayover(minutes?: number | null) {
  if (minutes == null || minutes <= 0) return null;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h && m) return `${h}h ${m}m layover`;
  if (h) return `${h}h layover`;
  return `${m}m layover`;
}

function googleFlightsUrl(flight: FlightOffer) {
  const origin = flight.departure.airport;
  const dest = flight.arrival.airport;
  const date = flight.departure.date;
  if (flight.trip === "round-trip" && flight.returnDeparture) {
    return `https://www.google.com/travel/flights#flt=${origin}.${dest}.${date}*${dest}.${origin}.${flight.returnDeparture.date}`;
  }
  return `https://www.google.com/travel/flights#flt=${origin}.${dest}.${date}`;
}

function dealUrl(flight: FlightOffer) {
  if (flight.deepLink) return flight.deepLink;
  return googleFlightsUrl(flight);
}

function SegmentList({
  title,
  segments,
  price,
  currency,
}: {
  title: string;
  segments: FlightSegment[];
  price?: number;
  currency: string;
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-sky-800/70">
          {title}
        </p>
        {price != null ? (
          <p className="text-sm font-semibold tabular-nums text-sky-950">
            {formatMoney(price, currency)}
          </p>
        ) : null}
      </div>
      {segments.map((segment, index) => (
        <div
          key={`${title}-${segment.from.code}-${segment.to.code}-${index}`}
          className="rounded-xl bg-white/80 px-3 py-3 text-sm ring-1 ring-sky-900/5"
        >
          <div className="font-medium text-slate-900">
            {segment.departure.time} → {segment.arrival.time}
            <span className="ml-2 font-normal text-slate-500">
              {segment.durationLabel}
            </span>
          </div>
          <div className="mt-1 text-slate-600">
            {segment.from.name} ({segment.from.code}) → {segment.to.name} (
            {segment.to.code})
          </div>
          {segment.aircraft ? (
            <div className="mt-1 text-xs text-slate-400">{segment.aircraft}</div>
          ) : null}
        </div>
      ))}
    </div>
  );
}

function alternateHint(flight: FlightOffer) {
  const bits: string[] = [];
  if (flight.alternateOrigin) {
    bits.push(`departs ${flight.departure.airport}`);
  }
  if (flight.alternateDestination) {
    bits.push(`arrives ${flight.arrival.airport}`);
  }
  if (!bits.length) return "Uses a nearby airport";
  return `Nearby airport: ${bits.join(" · ")}`;
}

function FlightRow({ flight }: { flight: FlightOffer }) {
  const [open, setOpen] = useState(false);
  const stopLabel =
    flight.stops === 0 ? "Direct" : flight.stops === 1 ? "1 stop" : `${flight.stops} stops`;
  const isRoundTrip = flight.trip === "round-trip" && flight.returnDeparture;
  const layoverLabel = formatLayover(flight.maxLayoverMinutes);
  const isAlternate = Boolean(flight.usesAlternateAirport);

  return (
    <article
      className={cn(
        "group border-b border-sky-900/8 transition-colors hover:bg-sky-50/50",
        open && "bg-sky-50/70",
        isAlternate && "bg-amber-50/40 hover:bg-amber-50/70"
      )}
    >
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="grid w-full grid-cols-[7.5rem_1fr_auto] items-center gap-4 px-4 py-4 text-left sm:grid-cols-[8.5rem_1fr_9rem_auto] sm:gap-6 sm:px-5"
      >
        <div>
          <div className="flex items-center gap-1.5">
            {isAlternate ? (
              <span
                title={alternateHint(flight)}
                className="inline-flex size-6 shrink-0 items-center justify-center rounded-md bg-amber-100 text-amber-700 ring-1 ring-amber-300/70"
              >
                <AlertTriangle className="size-3.5" aria-hidden />
                <span className="sr-only">Nearby airport alternative</span>
              </span>
            ) : null}
            <div className="text-2xl font-bold tracking-tight text-sky-950 sm:text-[1.7rem]">
              {formatMoney(flight.price, flight.currency)}
            </div>
          </div>
          {isRoundTrip ? (
            <div className="mt-0.5 text-[11px] font-medium uppercase tracking-wide text-sky-700/80">
              Round-trip
            </div>
          ) : null}
          {isAlternate ? (
            <div className="mt-0.5 text-[11px] font-medium text-amber-800">
              {alternateHint(flight)}
            </div>
          ) : null}
        </div>

        <div className="min-w-0">
          <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
            <span className="text-base font-semibold text-slate-900 sm:text-lg">
              {flight.departure.time} – {flight.arrival.time}
            </span>
            <span className="text-sm text-slate-500">
              {formatPrettyDate(flight.departure.date)}
            </span>
          </div>
          {isRoundTrip && flight.returnDeparture && flight.returnArrival ? (
            <div className="mt-1 flex flex-wrap items-baseline gap-x-2 gap-y-1 text-sm">
              <span className="font-semibold text-slate-800">
                {flight.returnDeparture.time} – {flight.returnArrival.time}
              </span>
              <span className="text-slate-500">
                {formatPrettyDate(flight.returnDeparture.date)} · return
              </span>
            </div>
          ) : null}
          <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-slate-600">
            <span className="font-medium text-slate-800">{flight.durationLabel}</span>
            <span className="text-slate-300">·</span>
            <span>
              {flight.departure.airport} → {flight.arrival.airport}
              {isRoundTrip ? ` → ${flight.departure.airport}` : ""}
            </span>
            {layoverLabel ? (
              <>
                <span className="text-slate-300">·</span>
                <span>{layoverLabel}</span>
              </>
            ) : null}
          </div>
          <div className="mt-1 truncate text-sm text-slate-500 sm:hidden">
            {flight.airlines.join(", ")}
          </div>
        </div>

        <div className="hidden sm:block">
          <Badge
            variant="secondary"
            className={cn(
              "rounded-md px-2.5 py-1 text-xs font-semibold",
              flight.direct
                ? "bg-emerald-50 text-emerald-800 hover:bg-emerald-50"
                : "bg-amber-50 text-amber-900 hover:bg-amber-50"
            )}
          >
            {stopLabel}
          </Badge>
          <div className="mt-2 truncate text-sm text-slate-500">
            {flight.airlines.join(", ")}
          </div>
        </div>

        <ChevronDown
          className={cn(
            "size-5 text-slate-400 transition-transform duration-200",
            open && "rotate-180"
          )}
        />
      </button>

      <div
        className={cn(
          "grid overflow-hidden transition-[grid-template-rows,opacity] duration-300 ease-out",
          open ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
        )}
      >
        <div className="min-h-0">
          <div className="space-y-4 border-t border-sky-900/5 px-4 pb-4 pt-3 sm:px-5">
            <div className="sm:hidden">
              <Badge
                variant="secondary"
                className={cn(
                  "rounded-md px-2.5 py-1 text-xs font-semibold",
                  flight.direct
                    ? "bg-emerald-50 text-emerald-800"
                    : "bg-amber-50 text-amber-900"
                )}
              >
                {stopLabel}
              </Badge>
            </div>
            <SegmentList
              title="Outbound"
              segments={flight.segments}
              price={flight.outboundPrice}
              currency={flight.currency}
            />
            {flight.returnSegments?.length ? (
              <SegmentList
                title="Return"
                segments={flight.returnSegments}
                price={flight.returnPrice}
                currency={flight.currency}
              />
            ) : null}
            <div className="flex flex-wrap items-center gap-2 pt-1">
              <a
                href={dealUrl(flight)}
                target="_blank"
                rel="noreferrer"
                className={cn(
                  buttonVariants(),
                  "bg-sky-700 text-white hover:bg-sky-800"
                )}
              >
                View deal
                <ExternalLink className="size-4" />
              </a>
              <span className="text-xs text-slate-500">
                {flight.deepLink
                  ? "Opens booking link (Kiwi)"
                  : "Opens Google Flights to compare & book"}
              </span>
            </div>
          </div>
        </div>
      </div>
    </article>
  );
}

export function FlightResults({
  flights,
  loading,
  error,
  warning,
}: {
  flights: FlightOffer[];
  loading: boolean;
  error?: string | null;
  warning?: string | null;
}) {
  const content = useMemo(() => {
    if (loading) {
      return (
        <div className="space-y-0 divide-y divide-sky-900/8">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="animate-pulse px-5 py-5">
              <div className="flex gap-6">
                <div className="h-8 w-20 rounded bg-sky-100" />
                <div className="flex-1 space-y-2">
                  <div className="h-5 w-2/3 rounded bg-sky-100" />
                  <div className="h-4 w-1/2 rounded bg-sky-50" />
                </div>
              </div>
            </div>
          ))}
        </div>
      );
    }

    if (error) {
      return (
        <div className="px-5 py-10 text-center">
          <p className="text-lg font-semibold text-slate-900">Search failed</p>
          <p className="mt-2 text-sm text-slate-600">{error}</p>
        </div>
      );
    }

    if (!flights.length) {
      return (
        <div className="px-5 py-14 text-center">
          <p className="text-lg font-semibold text-slate-900">No flights yet</p>
          <p className="mx-auto mt-2 max-w-md text-sm text-slate-600">
            Pick an origin, destination (city, country or region), and a date range to
            scan every airline for the cheapest options.
          </p>
        </div>
      );
    }

    return flights.map((flight) => <FlightRow key={flight.id} flight={flight} />);
  }, [error, flights, loading]);

  return (
    <section className="overflow-hidden rounded-2xl border border-sky-900/10 bg-white/90 shadow-[0_20px_60px_-40px_rgba(8,47,73,0.45)] backdrop-blur">
      <div className="flex items-center justify-between gap-3 border-b border-sky-900/8 px-5 py-3">
        <div>
          <h2 className="text-sm font-semibold text-slate-900">
            {loading ? "Searching flights…" : `${flights.length} flights`}
          </h2>
          {warning ? <p className="text-xs text-amber-700">{warning}</p> : null}
        </div>
        <p className="text-xs text-slate-500">Sorted by lowest price</p>
      </div>
      <div>{content}</div>
    </section>
  );
}
