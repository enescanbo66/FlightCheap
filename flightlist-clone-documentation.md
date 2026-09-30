# FlightList.io - Complete Clone Documentation

## Executive Summary
FlightList.io is a flight search engine focused on flexible date ranges and finding cheap flights. The site emphasizes simplicity, country/region searches, and comparing prices across date ranges.

---

## 1. HOMEPAGE & LAYOUT STRUCTURE

### Header
- **Logo**: "✈ FlightList" (blue airplane icon + text, top-left)
- **Navigation**: 
  - "Menu" button (top-right, light blue bordered button)
  - "Share" button (top-right, solid blue button)
- **Menu Items** (dropdown):
  - Reviews
  - About
  - Blog
  - Press
  - Contact
  - Twitter
  - Instagram

### Hero Section
- **Headline**: "Cheap Flights. Simplified."
- **Subheadline**: "Find the cheapest flights to any destination in the world."
- **Feature callout**: "Discover more affordable routes and cheaper dates within a date range."
- **Key Feature Highlight** (with yellow star emoji): 
  "Search by country or region to discover more affordable routes, like Netherlands → Italy or Europe → South East Asia."

### Search Form
The search form is centered and contains multiple rows:

#### Row 1: Origin, Trip Type, Destination
- **Origin Field**: 
  - Icon: Blue airplane/location icon
  - Placeholder: "Departure city, airport, country or region"
  - Clear button (X)
  - Supports: Cities, airports, countries, regions
  - Autocomplete with multiple airport options per city
  
- **Trip Type Dropdown**:
  - Options: "One Way", "Round Trip" (likely)
  - Default: "One Way"
  
- **Destination Field**:
  - Icon: Blue airplane/location icon
  - Placeholder: "Destination city, airport, country or region"
  - Clear button (X)
  - Supports: Cities, airports, countries, regions, "Anywhere"

#### Row 2: Dates, Passengers
- **Date Range Picker**:
  - Icon: Calendar icon (blue)
  - Format: "Sep 30th - Oct 29th, 2026"
  - Shows date range selector
  
- **Passengers**:
  - **Adults**: Dropdown, icon of person, default "1 Adult"
  - **Children**: Dropdown, default "0 Children"
  - **Infants**: Dropdown, default "0 Infants"

#### Row 3: Class, Currency, Sort, Stops
- **Travel Class Dropdown**:
  - Icon: Seat icon
  - Default: "Economy"
  - Options likely include: Economy, Premium Economy, Business, First
  
- **Currency Dropdown**:
  - Icon: Dollar sign
  - Default: "US Dollar"
  - Multiple currency options available
  
- **Sort By Dropdown**:
  - Icon: Sort bars
  - Default: "Lowest Price"
  - Options likely include: Lowest Price, Shortest Duration, Best Value
  
- **Stops Filter Dropdown**:
  - Icon: Circle with dots (connection icon)
  - Default: "Any stops"
  - Options: Any stops, Direct only, 1 Stop, 2+ Stops

#### Row 4: Additional Options (Expandable)
- **"Additional Options" button** (light blue text, bordered button)
  
When expanded, shows:
- **Results Quantity**: Dropdown, default "100"
- **Cabin Bags**: Number input with info icon, default "0"
- **Checked Bags**: Number input with info icon, default "0"
- **Max Budget**: Input field with currency prefix "US$"
- **Max Duration**: Input with "Hours" unit, default "60"
- **Max Layover**: Input with "Hours" unit, default "48"
- **Length of Stay**: Input with "Nights" unit
- **Departure Time**: Dropdown, default "Anytime"
- **Connections**: Dropdown, default "Include self-transfer"
- **Select Airlines**: Dropdown, default "All selected (11)"

#### Row 5: Search Button
- **Large blue button**: "Search"
- Full width, prominent CTA

---

## 2. RESULTS LIST STRUCTURE

### Flight Card Layout
Each flight result card displays:

#### Left Section:
- **Price**: Large text, e.g., "us$54" (price + currency code)
- **Airline Logo**: Square icon showing airline brand

#### Middle Section:
- **Times**: "3:00pm - 5:35pm"
- **Date**: "Wed Oct 7th 2026"
- **Duration**: "1h 35m"
- **Route**: "London (LHR) → Paris (ORY)"

#### Right Section:
- **Connection Type**: "Direct" or "1 Stop" badge
- **Expand Icon**: Dropdown arrow to show details

### Expanded Flight Details
When a flight is expanded:
- **Full date and time**
- **Flight icon**: Type indicator (e.g., Vueling)
- **Flight number**: e.g., "VY 8961"
- **Departure details**: "Depart at 3:00pm from London (LHR)"
- **Flight duration icon**: "Fly for 1h 35m"
- **Arrival details**: "Arrive at 5:35pm in Paris (ORY)"
- **"Book Flight →" button**: Light bordered button, right-aligned

### Multi-stop flights show:
- Multiple airline logos side by side
- Longer duration
- "1 Stop", "2 Stops" badge

---

## 3. API ENDPOINTS & REQUEST STRUCTURE

### Primary Search Endpoint
**URL Pattern**: `https://www.flightlist.io/api/search.php?fly_from=city%3ALON&fly_to=airport%3AORY&...`

**Key Parameters** (from network inspection):
- `fly_from`: Origin (format: `city:LON`, `airport:LHR`, etc.)
- `fly_to`: Destination (format: `city:PAR`, `airport:ORY`, `region:europe`, etc.)
- `date_from`: Start date (format: `30%2F09%2F2026` = 30/09/2026)
- `date_to`: End date
- `return_from`: Return start date (for round trips)
- `return_to`: Return end date
- `adults`: Number of adults (e.g., `1`)
- `children`: Number of children
- `infants`: Number of infants
- `cabin_class`: Travel class (e.g., `economy`, `business`)
- `curr`: Currency code (e.g., `USD`, `EUR`, `GBP`)
- `max_stopovers`: Max connections (e.g., `10` for any, `0` for direct)
- `sort`: Sort order (e.g., `price`, `duration`)
- `limit`: Results limit (e.g., `100`)
- Additional filters for bags, budget, duration, layover time, etc.

### Autocomplete/Location Search Endpoint
**URL**: `https://www.flightlist.io/api/locations.js`

**Purpose**: Returns location suggestions (cities, airports, countries, regions) based on user input

**Parameters**:
- Query string for search term

**Response Structure** (observed from network):
```json
{
  "bags_price": {...},
  "baglimit": {...},
  "bags_conversion": {...},
  "EUR": {...},
  "USD": {...},
  "hold_dimensions_sum": ...,
  "hold_height": ...,
  "hold_length": ...,
  "hold_weight": ...,
  "hold_width": ...,
  "hand_dimensions_sum": ...,
  "personal_item_height": ...,
  "personal_item_length": ...,
  "personal_item_weight": ...,
  "personal_item_width": ...,
  "availability": {...},
  "seats": ...,
  "airlines": [...],
  "route": [
    {
      "id": "...",
      "combination_id": "...",
      "flyFrom": "LHR",
      "flyTo": "ORY",
      "cityFrom": "London",
      "cityCodeFrom": "LON",
      "cityTo": "Paris",
      "cityCodeTo": "PAR",
      "local_departure": "2026-...",
      "utc_departure": "2026-...",
      "local_arrival": "2026-...",
      "utc_arrival": "2026-...",
      "airline": "VY",
      "flight_no": "8961",
      "operating_carrier": "...",
      "operating_flight_no": "...",
      "fare_basis": "...",
      "fare_category": "M",
      "fare_classes": "O",
      "fare_family": "...",
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

---

## 4. VISUAL DESIGN & STYLE

### Color Palette
- **Primary Blue**: `#007BFF` or similar (buttons, icons, links)
- **Light Blue**: Border color for secondary buttons
- **White**: `#FFFFFF` (main background, cards)
- **Light Gray**: `#F5F5F5` or similar (subtle backgrounds)
- **Text Black**: Dark gray/black for main text
- **Price Text**: Emphasis color (likely black or dark blue)
- **Yellow/Gold**: Star emoji color for feature callouts

### Typography
- **Headings**: Sans-serif, bold, large (likely 32-48px for h1)
- **Body Text**: Sans-serif, regular weight (likely 14-16px)
- **Price Display**: Bold, larger than body (likely 18-24px)
- **Button Text**: Medium/Semibold weight
- **Font Family**: Appears to be system font stack or similar to "Inter", "sans-serif", "Apple system fonts"

### Layout & Spacing
- **Max Width**: Appears to be around 1200px centered container
- **Card Spacing**: Consistent vertical spacing between flight cards
- **Padding**: Generous padding in search form and cards
- **Border Radius**: Subtle rounded corners on buttons, inputs, cards (4-8px)
- **Shadows**: Subtle box shadows on cards and search form

### Icons
- **Style**: Line icons or minimal filled icons
- **Source**: Likely Font Awesome, Bootstrap Icons, or custom icon set
- **Used For**: 
  - Airplane for origin/destination
  - Calendar for dates
  - Person for passengers
  - Seat for class
  - Currency symbol for currency
  - Sort bars for sort options
  - Connection dots for stops

---

## 5. FOOTER & ADDITIONAL CONTENT

### Tips Section
Located before footer, includes boxes with tips:
- **"Be Flexible on Departure Day"**: Explains price variations by day of week
- **"Book at the Right Time"**: Booking window recommendations

### FAQ Section
**Title**: "Cheap Flights — Frequently Asked Questions"

**Questions** (from structured data):
1. How do I find the cheapest flights?
2. Is it cheaper to book one-way or round-trip flights?
3. When is the best time to book cheap flights?
4. What day of the week has the cheapest flights?
5. How do I find cheap flights to anywhere?

### Footer
- **Copyright**: "© 2018-2026 Inventure. All rights reserved."
- **Links**: 
  - Privacy Policy (right-aligned, blue link)

---

## 6. TECHNICAL STACK & ASSETS

### CSS Files (from source)
- Bootstrap CSS (core framework)
- jQuery UI CSS (datepicker, autocomplete)
- Font Awesome CSS (icons)
- Bootstrap Multiselect CSS (for dropdowns)
- Easy Autocomplete CSS (location search)
- Bootstrap Rangeslider CSS (range inputs)
- Daterangepicker CSS (date picker)
- Custom: `/css/v2/flightlist.css` (main styles)

### JavaScript Files
- jQuery (3.3.1 or similar)
- Tether (Bootstrap dependency)
- Bootstrap JS
- Moment.js (date handling)
- Daterangepicker JS
- Bootstrap Multiselect JS
- Easy Autocomplete JS
- Custom: Multiple `/js/...` files including:
  - `/js/v2/flightlist.js`
  - Airlines data JS
  - Skypicker integration JS

### External APIs/Services
- Flight data appears to come from a backend search API (likely aggregating from multiple sources)
- Possible integration with Kiwi.com/Skypicker API (based on JS references)

---

## 7. KEY FEATURES & FUNCTIONALITY

### Unique Features
1. **Country/Region Search**: Search from/to entire countries or regions (e.g., "Europe → South East Asia")
2. **Flexible Date Ranges**: Search across a date range, not just specific dates
3. **"Anywhere" Destination**: Leave destination blank to find cheapest options
4. **Price Comparison**: Shows cheapest flights across entire date range
5. **Self-Transfer Connections**: Option to include self-transfer flights
6. **Extensive Filters**: Budget, duration, layover time, airline selection, bags, etc.

### Search Behavior
- **Autocomplete**: Real-time suggestions for locations
- **Multiple Airport Support**: Shows all airports for a city (e.g., LHR, LGW, STN for London)
- **Date Range Selection**: Allows broad date ranges for flexibility
- **Results Refresh**: Search button triggers new API call, results update without page reload

### Results Display
- **Sorting**: By price (default), duration, or other criteria
- **Filtering**: Applied via dropdowns before search
- **Expandable Details**: Click arrow to see full flight details
- **Booking CTA**: "Book Flight →" button (likely redirects to booking partner)

---

## 8. SAMPLE SEARCH URL STRUCTURE

**Example**: London to Paris, One-way, Sep 30 - Oct 29, 2026, 1 Adult, Economy

```
https://www.flightlist.io/api/search.php?
fly_from=city:LON
&fly_to=airport:ORY
&date_from=30/09/2026
&date_to=29/10/2026
&adults=1
&children=0
&infants=0
&selected_cabins=M
&curr=USD
&max_stopovers=10
&sort=price
&limit=100
```

(URL-encoded in actual request)

---

## 9. STRUCTURED DATA (SEO)

From page source, includes:
- **Organization Schema**: FlightList organization details
- **WebSite Schema**: Site name, URL
- **FAQPage Schema**: FAQ questions and answers for SEO

---

## 10. RESPONSIVE DESIGN NOTES

- Layout appears responsive (Bootstrap framework)
- Mobile-first approach likely
- Search form stacks vertically on smaller screens
- Cards likely full-width on mobile

---

## 11. MONETIZATION

- **Booking Links**: Affiliate links via "Book Flight" buttons
- Likely redirects to booking partners (airlines, OTAs)
- No visible ads on main page

---

## 12. BROWSER SUPPORT

- Modern browsers (Chrome, Firefox, Safari, Edge)
- Uses modern CSS and JS (ES6+)
- jQuery dependency suggests support for older browsers as well

---

## 13. CLONING RECOMMENDATIONS

### Frontend
- **Framework**: React, Vue, or Next.js for modern SPA
- **UI Library**: Bootstrap or Tailwind CSS for rapid styling
- **Date Picker**: react-datepicker or similar
- **Autocomplete**: Custom component or library like react-select
- **Icons**: Font Awesome or Heroicons

### Backend
- **Flight Data**: Integrate with Kiwi.com Tequila API, Skyscanner API, or Amadeus API
- **Location Search**: Use airport/city database (OpenFlights, OurAirports)
- **Currency Conversion**: API like exchangerate-api.com
- **Caching**: Redis for API response caching

### Database
- Store user searches (optional)
- Cache popular routes
- Store airline/airport data locally

### API Structure
- RESTful API or GraphQL
- Endpoints:
  - `/api/search` - Flight search
  - `/api/locations` - Location autocomplete
  - `/api/airlines` - Airline data

### Key Challenges
1. **Flight Data Access**: Requires API partnership or aggregation
2. **Real-time Pricing**: Flight prices change frequently
3. **Performance**: Large result sets need optimization
4. **Booking Flow**: Redirect to partner or build booking system

---

## CONCLUSION

FlightList.io is a streamlined flight search engine emphasizing flexibility and simplicity. Its unique selling points are country/region searches, flexible date ranges, and "anywhere" destination searches. The site uses a modern tech stack with Bootstrap UI, jQuery for interactions, and a backend API for flight data aggregation.

To clone it successfully:
1. Build a clean, responsive search interface with all filters
2. Integrate with flight search APIs (Kiwi.com, Amadeus, etc.)
3. Implement robust autocomplete for locations
4. Create expandable flight cards with detailed information
5. Add sorting, filtering, and pagination for results
6. Implement affiliate booking links for monetization

The design is minimal and user-focused, prioritizing ease of use over complex features.
