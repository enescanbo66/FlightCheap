# FlightList.io API Endpoints - Detailed Analysis

## Primary Endpoints Discovered

### 1. Location Autocomplete API
**Endpoint**: `https://www.flightlist.io/api/locations.js`

**Method**: GET

**Purpose**: Provides autocomplete suggestions for origin/destination fields

**Query Parameter**: Search term (e.g., "London", "Paris")

**Response**: Returns location objects with:
- Location name
- Airport codes
- City codes
- Country information
- Multiple airport options per city

**Example Observed**:
- Input: "London"
- Returns: London, United Kingdom with options:
  - All airports in London
  - London, United Kingdom (LCY) - London City
  - London, United Kingdom (LGW) - Gatwick
  - London, United Kingdom (LHR) - Heathrow
  - London, United Kingdom (LTN) - Luton
  - London, United Kingdom (STN) - London Stansted
  - London, Canada (YXU) - London International

### 2. Flight Search API
**Endpoint**: `https://www.flightlist.io/api/search.php`

**Method**: GET

**Purpose**: Main flight search endpoint that returns flight results

**Key Parameters Observed**:
```
fly_from=city:LON
fly_to=airport:ORY
date_from=30/09/2026
date_to=29/10/2026
adults=1
children=0
infants=0
selected_cabins=M  (M = Economy)
curr=USD
max_stopovers=10
sort=price
limit=100
```

**Parameter Format Patterns**:
- **Location format**: 
  - `city:LON` (city code)
  - `airport:LHR` (specific airport)
  - `country:UK` (entire country - likely)
  - `region:europe` (region - likely)
  
- **Date format**: `DD/MM/YYYY` (e.g., `30/09/2026`)

- **Cabin class codes**:
  - `M` = Economy
  - `W` = Premium Economy (likely)
  - `C` = Business (likely)
  - `F` = First (likely)

**Response Structure** (JSON):
```json
{
  "bags_price": { /* bag pricing info */ },
  "baglimit": { /* bag limits */ },
  "bags_conversion": { /* currency conversions for bags */ },
  "EUR": { /* EUR conversion rates */ },
  "USD": { /* USD conversion rates */ },
  "hold_dimensions_sum": Number,
  "hold_height": Number,
  "hold_length": Number,
  "hold_weight": Number,
  "hold_width": Number,
  "hand_dimensions_sum": Number,
  "personal_item_height": Number,
  "personal_item_length": Number,
  "personal_item_weight": Number,
  "personal_item_width": Number,
  "availability": { /* seat availability */ },
  "seats": Number,
  "airlines": [
    "VY", "U2", "AF", "BA", etc.
  ],
  "route": [
    {
      "id": String,
      "combination_id": String,
      "flyFrom": "LHR",
      "flyTo": "ORY",
      "cityFrom": "London",
      "cityCodeFrom": "LON",
      "cityTo": "Paris",
      "cityCodeTo": "PAR",
      "local_departure": "2026-10-07T15:00:00.000Z",
      "utc_departure": "2026-10-07T14:00:00.000Z",
      "local_arrival": "2026-10-07T17:35:00.000Z",
      "utc_arrival": "2026-10-07T15:35:00.000Z",
      "airline": "VY",
      "flight_no": "8961",
      "operating_carrier": String,
      "operating_flight_no": String,
      "fare_basis": String,
      "fare_category": "M",
      "fare_classes": "O",
      "fare_family": String,
      "return": 0,
      "bags_recheck_required": false,
      "vi_connection": false,
      "guarantee": false,
      "equipment": null,
      "vehicle_type": "aircraft"
    }
  ]
}
```

### 3. Static Assets

**Airline Logos**: Appear to be referenced as placeholders in format:
- `/img/airlines/{AIRLINE_CODE}.png`
- Example: `/img/airlines/VY.png` for Vueling

**CSS Resources**:
- `/css/v2/bootstrap.min.css`
- `/css/v2/jquery-ui.min.css`
- `/css/v2/font-awesome.min.css`
- `/css/v2/flightlist.css` (custom styles)
- `/css/v2/bootstrap-icons.min.css`
- `/css/v2/bootstrap-multiselect.css`
- `/css/v2/easy-autocomplete.min.css`
- `/css/v2/bootstrap-rangeslider.css`
- `/css/v2/daterangepicker.css`

**JavaScript Resources**:
- jQuery 3.x
- Moment.js
- Bootstrap JS
- Tether
- Custom: `/js/v2/flightlist.js`
- `/js/v2/daterangepicker.js`
- `/js/v2/bootstrap-multiselect.js`
- Skypicker integration scripts

### 4. Additional Files Observed

**Generated files**:
- `generate.php` - Likely generates some dynamic content (200 status, fetch)
- `placeholder.png` - Placeholder image for missing airline logos

**Image assets**:
- `VY.png`, `U2.png`, `TG.png` - Various airline logo PNGs (13-15 kB each)

## Network Behavior

### Request Flow:
1. **Page Load**: Initial HTML + CSS + JS
2. **User Types in Origin**: Triggers autocomplete API call to `/api/locations.js`
3. **User Types in Destination**: Another autocomplete API call
4. **User Clicks Search**: POST/GET request to `/api/search.php` with all parameters
5. **Results Display**: Flight cards rendered, airline logos loaded as images

### Performance:
- API responses are relatively fast (observed 85-200ms for autocomplete)
- Search results take 2-3 seconds (varies by query complexity)
- Static assets are cached

### Headers (Sample from search.php):
```
Request Method: GET
Status Code: 200 OK
Content-Type: application/json
```

## API Integration Strategy for Cloning

### Option 1: Use Existing Flight APIs
- **Kiwi.com Tequila API**: Very similar structure, likely what FlightList uses
- **Amadeus Flight Search API**: Enterprise option
- **Skyscanner API**: Popular alternative

### Option 2: Build Mock API for Testing
Create endpoints that mirror the structure:
```javascript
// Mock locations endpoint
GET /api/locations?term=London
Response: [
  {
    id: "airport:LHR",
    name: "London Heathrow",
    city: "London",
    country: "United Kingdom",
    code: "LHR"
  },
  // ...
]

// Mock search endpoint
GET /api/search?fly_from=city:LON&fly_to=airport:ORY&...
Response: {
  data: [
    {
      id: "flight1",
      price: 54,
      currency: "USD",
      route: [/* route segments */]
    }
  ]
}
```

## Key Insights

1. **The site uses URL-encoded parameters** in the search API, not POST body
2. **Location format is flexible**: city:CODE, airport:CODE, likely country:CODE and region:CODE
3. **Date range searches** are the key feature - search across multiple dates
4. **Response includes extensive metadata** about bags, dimensions, fare classes
5. **Airline codes are standard IATA codes** (2-letter)
6. **Multiple airports per city** are fully supported in autocomplete

## Recommended Tech Stack for Clone

### Backend:
- **Node.js + Express** or **Python + FastAPI**
- **Flight API**: Kiwi.com Tequila API (free tier available)
- **Database**: PostgreSQL for caching + airport/airline data
- **Cache**: Redis for API response caching (important for performance)

### Frontend:
- **React** or **Next.js** for SEO benefits
- **Tailwind CSS** or **Material-UI** for styling
- **React-DatePicker** for date range selection
- **React-Select** or custom autocomplete for locations
- **Axios** for API calls

### Data Sources:
- **Airport Database**: OpenFlights.org dataset (free)
- **Airline Logos**: Manually curated or from public sources
- **Country/Region Data**: Custom mapping or use Kiwi.com's location API

## Example Implementation

```javascript
// Search API call example
const searchFlights = async (params) => {
  const queryString = new URLSearchParams({
    fly_from: `city:${params.origin}`,
    fly_to: `airport:${params.destination}`,
    date_from: formatDate(params.dateFrom),
    date_to: formatDate(params.dateTo),
    adults: params.adults,
    children: params.children,
    infants: params.infants,
    selected_cabins: params.cabinClass,
    curr: params.currency,
    max_stopovers: params.maxStops,
    sort: params.sortBy,
    limit: params.limit
  }).toString();
  
  const response = await fetch(`/api/search?${queryString}`);
  return response.json();
};
```

---

**Date Created**: September 30, 2026  
**Source**: Network inspection of flightlist.io
