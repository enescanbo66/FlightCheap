# FlyList

Cheap flights across any date range — a FlightList-style search app.

Search from any airport/city to another airport, city, country, region, or **Anywhere**. Results span a flexible departure window, sorted by lowest price, with filters for direct flights, budget, cabin class, and airline.

## Stack

- Next.js + TypeScript + Tailwind + shadcn/ui
- Place autocomplete via Travelpayouts Places API
- Live fares via Google Flights (`fast-flights` Python helper)

## Run locally

```bash
# Node deps
npm install

# Python helper used by /api/flights
pip install fast-flights httpx

npm run dev
```

App runs at [http://localhost:4321](http://localhost:4321).

## How search works

1. Pick **From** / **To** (airport, city, country, region, or Anywhere)
2. Choose a **date range** (and return range for round-trip)
3. Optionally filter: direct only, max budget, airline, cabin
4. Hit **Search** — the API fans out Google Flights queries across the range (and across destination airports for countries/regions), then merges & sorts by price

Booking links open Google Flights for the selected itinerary.

## Notes

- Wide date ranges are sampled (not every single day) to keep searches responsive
- Country / region / Anywhere destinations expand to a curated set of hub airports
- No API keys required for the default Google Flights + Places setup
