#!/usr/bin/env python3
"""Date-range flight search via Google Flights (fast-flights)."""

from __future__ import annotations

import argparse
import json
import sys
from concurrent.futures import ThreadPoolExecutor, as_completed
from datetime import date, datetime, timedelta
from typing import Any

from fast_flights import FlightQuery, Passengers, create_query, get_flights
from fast_flights.exceptions import FlightsNotFound


def daterange(start: date, end: date) -> list[date]:
    days = (end - start).days
    if days < 0:
        return []
    return [start + timedelta(days=i) for i in range(days + 1)]


def fmt_time(dt: Any) -> str:
    h, m = dt.time
    return f"{h:02d}:{m:02d}"


def fmt_date(dt: Any) -> str:
    y, mo, d = dt.date
    return f"{y:04d}-{mo:02d}-{d:02d}"


def duration_label(minutes: int) -> str:
    h, m = divmod(max(0, minutes), 60)
    if h and m:
        return f"{h}h {m}m"
    if h:
        return f"{h}h"
    return f"{m}m"


def serialize_offer(offer: Any, currency: str) -> dict[str, Any]:
    legs = offer.flights or []
    first = legs[0]
    last = legs[-1]
    stops = max(0, len(legs) - 1)
    total_duration = sum(getattr(leg, "duration", 0) or 0 for leg in legs)

    segments = []
    for leg in legs:
        segments.append(
            {
                "from": {
                    "code": leg.from_airport.code,
                    "name": leg.from_airport.name,
                },
                "to": {
                    "code": leg.to_airport.code,
                    "name": leg.to_airport.name,
                },
                "departure": {
                    "date": fmt_date(leg.departure),
                    "time": fmt_time(leg.departure),
                },
                "arrival": {
                    "date": fmt_date(leg.arrival),
                    "time": fmt_time(leg.arrival),
                },
                "durationMinutes": leg.duration,
                "durationLabel": duration_label(leg.duration),
                "aircraft": getattr(leg, "plane_type", None),
            }
        )

    airlines = list(offer.airlines or [])
    return {
        "id": (
            f"{first.from_airport.code}-{last.to_airport.code}-"
            f"{fmt_date(first.departure)}-{fmt_time(first.departure)}-"
            f"{'-'.join(airlines)}-{offer.price}-{stops}"
        ),
        "price": offer.price,
        "currency": currency,
        "airlines": airlines,
        "stops": stops,
        "direct": stops == 0,
        "durationMinutes": total_duration,
        "durationLabel": duration_label(total_duration),
        "departure": {
            "airport": first.from_airport.code,
            "airportName": first.from_airport.name,
            "date": fmt_date(first.departure),
            "time": fmt_time(first.departure),
        },
        "arrival": {
            "airport": last.to_airport.code,
            "airportName": last.to_airport.name,
            "date": fmt_date(last.arrival),
            "time": fmt_time(last.arrival),
        },
        "segments": segments,
    }


def search_one_day(
    *,
    origin: str,
    destination: str,
    day: date,
    return_day: date | None,
    trip: str,
    seat: str,
    currency: str,
    language: str,
    max_stops: int | None,
) -> list[dict[str, Any]]:
    flights = [
        FlightQuery(
            date=day.isoformat(),
            from_airport=origin,
            to_airport=destination,
            max_stops=max_stops,
        )
    ]
    if trip == "round-trip" and return_day is not None:
        flights.append(
            FlightQuery(
                date=return_day.isoformat(),
                from_airport=destination,
                to_airport=origin,
                max_stops=max_stops,
            )
        )

    query = create_query(
        flights=flights,
        trip="round-trip" if trip == "round-trip" else "one-way",
        seat=seat,  # type: ignore[arg-type]
        passengers=Passengers(adults=1),
        currency=currency,  # type: ignore[arg-type]
        language=language,  # type: ignore[arg-type]
        max_stops=max_stops,
    )

    try:
        result = get_flights(query)
    except FlightsNotFound:
        return []
    except Exception:
        return []

    offers = list(result) if result else []
    return [serialize_offer(o, currency) for o in offers if getattr(o, "price", None) is not None]


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--from", dest="origin", required=True)
    parser.add_argument(
        "--to",
        dest="destinations",
        required=True,
        help="Comma-separated destination IATA codes",
    )
    parser.add_argument("--date-from", required=True)
    parser.add_argument("--date-to", required=True)
    parser.add_argument("--return-from")
    parser.add_argument("--return-to")
    parser.add_argument("--trip", default="one-way", choices=["one-way", "round-trip"])
    parser.add_argument("--seat", default="economy")
    parser.add_argument("--currency", default="USD")
    parser.add_argument("--language", default="en-US")
    parser.add_argument("--max-stops", type=int)
    parser.add_argument("--max-price", type=int)
    parser.add_argument("--airlines")
    parser.add_argument("--limit", type=int, default=80)
    parser.add_argument("--workers", type=int, default=6)
    args = parser.parse_args()

    start = datetime.strptime(args.date_from, "%Y-%m-%d").date()
    end = datetime.strptime(args.date_to, "%Y-%m-%d").date()
    if (end - start).days > 90:
        end = start + timedelta(days=90)

    outbound_days = daterange(start, end)
    return_days: list[date] = []
    if args.trip == "round-trip":
        rf = args.return_from or args.date_from
        rt = args.return_to or args.date_to
        return_start = datetime.strptime(rf, "%Y-%m-%d").date()
        return_end = datetime.strptime(rt, "%Y-%m-%d").date()
        if (return_end - return_start).days > 90:
            return_end = return_start + timedelta(days=90)
        return_days = daterange(return_start, return_end)

    airline_filter = {
        a.strip().lower()
        for a in (args.airlines or "").split(",")
        if a.strip()
    }

    destinations = [
        code.strip().upper()
        for code in args.destinations.split(",")
        if code.strip()
    ][:10]
    if not destinations:
        json.dump({"ok": False, "error": "No destinations", "flights": [], "count": 0}, sys.stdout)
        return 1

    # Scale date sampling down when searching many destinations.
    max_out = 24 if len(destinations) == 1 else max(4, 16 // len(destinations) + 2)
    max_ret = 4 if len(destinations) == 1 else 2

    day_jobs: list[tuple[date, date | None]] = []
    if args.trip == "round-trip" and return_days:
        out_sample = outbound_days
        if len(out_sample) > max_out:
            step = max(1, len(out_sample) // max_out)
            out_sample = out_sample[::step][:max_out]
        ret_sample = return_days
        if len(ret_sample) > max_ret:
            step = max(1, len(ret_sample) // max_ret)
            ret_sample = ret_sample[::step][:max_ret]
        for od in out_sample:
            for rd in ret_sample:
                if rd >= od:
                    day_jobs.append((od, rd))
    else:
        out_sample = outbound_days
        if len(out_sample) > max_out:
            step = max(1, len(out_sample) // max_out)
            out_sample = out_sample[::step][:max_out]
        day_jobs = [(d, None) for d in out_sample]

    jobs: list[tuple[str, date, date | None]] = [
        (dest, od, rd) for dest in destinations for od, rd in day_jobs
    ]

    results: list[dict[str, Any]] = []
    errors = 0

    with ThreadPoolExecutor(max_workers=max(1, args.workers)) as pool:
        futures = [
            pool.submit(
                search_one_day,
                origin=args.origin.upper(),
                destination=dest,
                day=od,
                return_day=rd,
                trip=args.trip,
                seat=args.seat,
                currency=args.currency.upper(),
                language=args.language,
                max_stops=args.max_stops,
            )
            for dest, od, rd in jobs
        ]
        for fut in as_completed(futures):
            try:
                results.extend(fut.result())
            except Exception:
                errors += 1

    # Deduplicate
    seen: set[str] = set()
    unique: list[dict[str, Any]] = []
    for item in results:
        key = item["id"]
        if key in seen:
            continue
        seen.add(key)
        unique.append(item)

    if airline_filter:
        unique = [
            f
            for f in unique
            if any(a.lower() in airline_filter or airline_filter.intersection({x.lower() for x in f["airlines"]}) for a in f["airlines"])
            or any(wanted in " ".join(f["airlines"]).lower() for wanted in airline_filter)
        ]

    if args.max_price is not None:
        unique = [f for f in unique if f["price"] <= args.max_price]

    unique.sort(key=lambda f: (f["price"], f["durationMinutes"], f["departure"]["date"]))
    unique = unique[: args.limit]

    payload = {
        "ok": True,
        "count": len(unique),
        "queriedDays": len(jobs),
        "errors": errors,
        "flights": unique,
    }
    json.dump(payload, sys.stdout, ensure_ascii=False)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
