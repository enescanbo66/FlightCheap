#!/usr/bin/env python3
"""Date-range flight search via Google Flights (fast-flights).

Supports multi-origin × multi-destination expansion, stop/layover filters,
and round-trip pairing (outbound + return searched separately then combined).
"""

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


def sample_days(days: list[date], max_n: int) -> list[date]:
    if len(days) <= max_n:
        return days
    if max_n <= 1:
        return [days[0]]
    # Evenly sample including endpoints
    idxs = sorted({round(i * (len(days) - 1) / (max_n - 1)) for i in range(max_n)})
    return [days[i] for i in idxs]


def fmt_time(dt: Any) -> str:
    h, m = dt.time
    return f"{h:02d}:{m:02d}"


def fmt_date(dt: Any) -> str:
    y, mo, d = dt.date
    return f"{y:04d}-{mo:02d}-{d:02d}"


def parse_dt(d: str, t: str) -> datetime:
    return datetime.strptime(f"{d} {t}", "%Y-%m-%d %H:%M")


def duration_label(minutes: int) -> str:
    h, m = divmod(max(0, int(minutes)), 60)
    if h and m:
        return f"{h}h {m}m"
    if h:
        return f"{h}h"
    return f"{m}m"


def layover_minutes(segments: list[dict[str, Any]]) -> int | None:
    if len(segments) < 2:
        return 0
    total = 0
    for i in range(len(segments) - 1):
        arr = parse_dt(segments[i]["arrival"]["date"], segments[i]["arrival"]["time"])
        dep = parse_dt(
            segments[i + 1]["departure"]["date"], segments[i + 1]["departure"]["time"]
        )
        gap = int((dep - arr).total_seconds() // 60)
        if gap > 0:
            total = max(total, gap)  # longest single layover
    return total


def serialize_offer(
    offer: Any,
    currency: str,
    *,
    trip: str = "one-way",
    return_segments: list[dict[str, Any]] | None = None,
    return_meta: dict[str, Any] | None = None,
) -> dict[str, Any]:
    legs = offer.flights or []
    first = legs[0]
    last = legs[-1]
    stops = max(0, len(legs) - 1)
    total_duration = sum(getattr(leg, "duration", 0) or 0 for leg in legs)

    segments: list[dict[str, Any]] = []
    for leg in legs:
        segments.append(
            {
                "from": {"code": leg.from_airport.code, "name": leg.from_airport.name},
                "to": {"code": leg.to_airport.code, "name": leg.to_airport.name},
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
    max_layover = layover_minutes(segments)
    price = offer.price

    ret_segs = return_segments or []
    if ret_segs and return_meta:
        price = (offer.price or 0) + (return_meta.get("price") or 0)
        airlines = list(dict.fromkeys(airlines + list(return_meta.get("airlines") or [])))
        stops = max(stops, return_meta.get("stops", 0))
        total_duration += return_meta.get("durationMinutes", 0)
        ret_layover = layover_minutes(ret_segs)
        if ret_layover is not None and max_layover is not None:
            max_layover = max(max_layover, ret_layover)

    return {
        "id": (
            f"{trip}-{first.from_airport.code}-{last.to_airport.code}-"
            f"{fmt_date(first.departure)}-{fmt_time(first.departure)}-"
            f"{'-'.join(airlines)}-{price}-{stops}"
            + (
                f"-ret-{return_meta['departure']['date']}-{return_meta['departure']['time']}"
                if return_meta
                else ""
            )
        ),
        "price": price,
        "currency": currency,
        "airlines": airlines,
        "stops": stops,
        "direct": stops == 0,
        "durationMinutes": total_duration,
        "durationLabel": duration_label(total_duration),
        "maxLayoverMinutes": max_layover,
        "trip": trip,
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
        "returnDeparture": return_meta.get("departure") if return_meta else None,
        "returnArrival": return_meta.get("arrival") if return_meta else None,
        "returnSegments": ret_segs or None,
    }


def search_one_way_day(
    *,
    origin: str,
    destination: str,
    day: date,
    seat: str,
    currency: str,
    language: str,
    max_stops: int | None,
    max_layover_minutes: int | None,
) -> list[dict[str, Any]]:
    query = create_query(
        flights=[
            FlightQuery(
                date=day.isoformat(),
                from_airport=origin,
                to_airport=destination,
                max_stops=max_stops,
                max_layover_minutes=max_layover_minutes,
            )
        ],
        trip="one-way",
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
    out = []
    for o in offers:
        if getattr(o, "price", None) is None:
            continue
        serialized = serialize_offer(o, currency, trip="one-way")
        if max_layover_minutes is not None and serialized.get("maxLayoverMinutes") is not None:
            if serialized["maxLayoverMinutes"] > max_layover_minutes:
                continue
        if max_stops is not None and serialized["stops"] > max_stops:
            continue
        out.append(serialized)
    return out


def pair_round_trips(
    outbound: list[dict[str, Any]],
    inbound: list[dict[str, Any]],
    *,
    limit: int,
) -> list[dict[str, Any]]:
    """Combine outbound + return one-ways into round-trip offers."""
    combined: list[dict[str, Any]] = []
    # Sort both by price for early pruning
    outbound_sorted = sorted(outbound, key=lambda f: f["price"])[:80]
    inbound_sorted = sorted(inbound, key=lambda f: f["price"])[:80]

    for out in outbound_sorted:
        out_arr = parse_dt(out["arrival"]["date"], out["arrival"]["time"])
        for ret in inbound_sorted:
            # Return must leave after outbound arrives (same calendar day ok if later)
            ret_dep = parse_dt(ret["departure"]["date"], ret["departure"]["time"])
            if ret_dep <= out_arr:
                continue
            # Prefer returns that leave from arrival metro / nearby — soft match
            price = out["price"] + ret["price"]
            airlines = list(dict.fromkeys(out["airlines"] + ret["airlines"]))
            stops = max(out["stops"], ret["stops"])
            duration = out["durationMinutes"] + ret["durationMinutes"]
            max_layover = max(
                out.get("maxLayoverMinutes") or 0,
                ret.get("maxLayoverMinutes") or 0,
            )
            combined.append(
                {
                    "id": f"round-{out['id']}__{ret['id']}",
                    "price": price,
                    "currency": out["currency"],
                    "airlines": airlines,
                    "stops": stops,
                    "direct": stops == 0,
                    "durationMinutes": duration,
                    "durationLabel": duration_label(duration),
                    "maxLayoverMinutes": max_layover,
                    "trip": "round-trip",
                    "departure": out["departure"],
                    "arrival": out["arrival"],
                    "segments": out["segments"],
                    "returnDeparture": ret["departure"],
                    "returnArrival": ret["arrival"],
                    "returnSegments": ret["segments"],
                    "outboundPrice": out["price"],
                    "returnPrice": ret["price"],
                }
            )

    combined.sort(key=lambda f: (f["price"], f["durationMinutes"]))
    # Deduplicate near-identical combos
    seen: set[str] = set()
    unique: list[dict[str, Any]] = []
    for item in combined:
        key = (
            f"{item['departure']['airport']}-{item['arrival']['airport']}-"
            f"{item['departure']['date']}-{item['departure']['time']}-"
            f"{item['returnDeparture']['date']}-{item['returnDeparture']['time']}-"
            f"{item['price']}"
        )
        if key in seen:
            continue
        seen.add(key)
        unique.append(item)
        if len(unique) >= limit:
            break
    return unique


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument(
        "--from",
        dest="origins",
        required=True,
        help="Comma-separated origin IATA / city codes",
    )
    parser.add_argument(
        "--to",
        dest="destinations",
        required=True,
        help="Comma-separated destination IATA / city codes",
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
    parser.add_argument("--max-layover", type=int, help="Max layover minutes")
    parser.add_argument("--max-price", type=int)
    parser.add_argument("--airlines")
    parser.add_argument("--limit", type=int, default=100)
    parser.add_argument("--workers", type=int, default=10)
    args = parser.parse_args()

    origins = [c.strip().upper() for c in args.origins.split(",") if c.strip()][:12]
    destinations = [
        c.strip().upper() for c in args.destinations.split(",") if c.strip()
    ][:12]
    if not origins or not destinations:
        json.dump(
            {"ok": False, "error": "origins and destinations required", "flights": [], "count": 0},
            sys.stdout,
        )
        return 1

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
        a.strip().lower() for a in (args.airlines or "").split(",") if a.strip()
    }

    pair_count = max(1, len(origins) * len(destinations))
    # More coverage than before — scale with pair count
    max_out = max(6, min(28, 40 // max(1, pair_count // 4 + 1)))
    max_ret = max(4, min(14, 24 // max(1, pair_count // 4 + 1)))

    out_sample = sample_days(outbound_days, max_out)
    ret_sample = sample_days(return_days, max_ret) if return_days else []

    route_pairs = [(o, d) for o in origins for d in destinations if o != d]
    # Cap extreme country×country matrices
    if len(route_pairs) > 36:
        # Prefer first hubs (already curated lists put major hubs first)
        route_pairs = route_pairs[:36]

    def run_leg(origin: str, dest: str, days: list[date]) -> list[dict[str, Any]]:
        results: list[dict[str, Any]] = []
        with ThreadPoolExecutor(max_workers=max(1, args.workers)) as pool:
            futures = [
                pool.submit(
                    search_one_way_day,
                    origin=origin,
                    destination=dest,
                    day=day,
                    seat=args.seat,
                    currency=args.currency.upper(),
                    language=args.language,
                    max_stops=args.max_stops,
                    max_layover_minutes=args.max_layover,
                )
                for day in days
            ]
            for fut in as_completed(futures):
                try:
                    results.extend(fut.result())
                except Exception:
                    pass
        return results

    # Fan out route pairs in parallel batches
    outbound_all: list[dict[str, Any]] = []
    inbound_all: list[dict[str, Any]] = []
    errors = 0
    queried = 0

    with ThreadPoolExecutor(max_workers=min(8, max(1, len(route_pairs)))) as pair_pool:
        out_futures = {
            pair_pool.submit(run_leg, o, d, out_sample): ("out", o, d)
            for o, d in route_pairs
        }
        queried += len(route_pairs) * len(out_sample)

        in_futures = {}
        if args.trip == "round-trip" and ret_sample:
            in_futures = {
                pair_pool.submit(run_leg, d, o, ret_sample): ("in", d, o)
                for o, d in route_pairs
            }
            queried += len(route_pairs) * len(ret_sample)

        for fut in as_completed({**out_futures, **in_futures}):
            kind, *_ = out_futures.get(fut) or in_futures[fut]
            try:
                rows = fut.result()
                if kind == "out":
                    outbound_all.extend(rows)
                else:
                    inbound_all.extend(rows)
            except Exception:
                errors += 1

    if args.trip == "round-trip":
        unique = pair_round_trips(outbound_all, inbound_all, limit=args.limit * 2)
        if not unique and outbound_all:
            # Fallback: show outbound with a warning flag if pairing failed
            unique = outbound_all
    else:
        unique = outbound_all

    # Deduplicate one-ways
    if args.trip != "round-trip" or (unique and unique[0].get("trip") != "round-trip"):
        seen: set[str] = set()
        deduped: list[dict[str, Any]] = []
        for item in unique:
            key = item["id"]
            if key in seen:
                continue
            seen.add(key)
            deduped.append(item)
        unique = deduped

    if airline_filter:
        unique = [
            f
            for f in unique
            if any(
                wanted in " ".join(f["airlines"]).lower() for wanted in airline_filter
            )
        ]

    if args.max_price is not None:
        unique = [f for f in unique if f["price"] <= args.max_price]

    if args.max_stops is not None:
        unique = [f for f in unique if f["stops"] <= args.max_stops]

    if args.max_layover is not None:
        unique = [
            f
            for f in unique
            if (f.get("maxLayoverMinutes") or 0) <= args.max_layover
        ]

    unique.sort(
        key=lambda f: (f["price"], f["durationMinutes"], f["departure"]["date"])
    )
    unique = unique[: args.limit]

    payload = {
        "ok": True,
        "count": len(unique),
        "queriedDays": queried,
        "errors": errors,
        "origins": origins,
        "destinations": destinations,
        "flights": unique,
    }
    json.dump(payload, sys.stdout, ensure_ascii=False)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
