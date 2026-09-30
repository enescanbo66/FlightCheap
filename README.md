# FlyList

Cheap flights across any date range — a FlightList-style search app.

Search from any airport/city to another airport, city, country, region, or **Anywhere**. Results span a flexible departure window, sorted by lowest price, with filters for direct flights, budget, cabin class, and airline.

## Stack

- Next.js + TypeScript + Tailwind + shadcn/ui
- Place autocomplete via Travelpayouts Places API
- Primary fares via **Kiwi Tequila** (or FlightList proxy) with booking `deep_link`
- Fallback fares via Google Flights (`fast-flights` Python helper)

## Run locally

```bash
# Node deps
npm install

# Python helper used by /api/flights (Google fallback)
pip install fast-flights httpx

# Optional — preferred for EU ULCC + deep links
export TEQUILA_API_KEY=your_tequila_key
# (or KIWI_API_KEY)

npm run dev
```

App runs at [http://localhost:4321](http://localhost:4321).

## How search works

1. Pick **From** / **To** (airport, city, country, region, or Anywhere)
2. Choose a **date range** (and return range for round-trip)
3. Optionally filter: direct only, max budget, airline, cabin
4. Hit **Search** — `/api/flights` tries **Kiwi first** (native country codes like `PL`, airport prefixes like `airport:MAD`), then falls back to Google Flights when Kiwi cannot cover the query (region / Anywhere) or is unavailable

**View deal** uses the Kiwi `deep_link` when present; otherwise opens Google Flights for that itinerary.

### Nearby airports

Optionally expand origin and/or destination to other flightable airports within a radius (default **250 km**, adjustable 50–500 km). Each side has its own toggle and checklist so you can drop airports you do not want (e.g. keep SAW only, exclude OGU near Rize). Results that use an airport outside your original place are marked with an alert icon.

## Notes

- Set `TEQUILA_API_KEY` (or `KIWI_API_KEY`) for reliable Kiwi/Tequila results. Without a key, the app may try the public FlightList proxy, then fall back to Google.
- Wide date ranges on the Google path are sampled (not every single day) to keep searches responsive
- Country / region / Anywhere destinations expand to hub airports on the Google path; Kiwi accepts ISO country codes natively
- Nearby-airport mode is available for city and airport selections (not country/region/Anywhere)
- No API keys required for the Google Flights + Places fallback
