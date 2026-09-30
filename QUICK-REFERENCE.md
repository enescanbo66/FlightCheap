# FlightList.io - Quick Reference Guide

## 🎯 At a Glance

**Website**: https://www.flightlist.io/  
**Purpose**: Flight search engine for flexible travelers  
**Key Feature**: Search across date ranges and countries/regions

---

## 📋 Essential Information

### Core API Endpoints
```
Search: GET /api/search.php
Locations: GET /api/locations.js
```

### Search Parameters
```
fly_from     = city:CODE or airport:CODE
fly_to       = city:CODE or airport:CODE or region:CODE
date_from    = DD/MM/YYYY
date_to      = DD/MM/YYYY
adults       = 1
selected_cabins = M (Economy)
curr         = USD
sort         = price
limit        = 100
```

### Color Palette
```css
Primary Blue:   #007BFF
White:          #FFFFFF
Light Gray:     #F5F5F5
Text:           Dark gray/black
```

### Key Components

**Search Form**: 21 controls total
- Basic: Origin, Destination, Dates, Passengers (7 controls)
- Filters: Class, Currency, Sort, Stops (4 controls)
- Advanced: Bags, Budget, Duration, Airlines (10 controls)

**Flight Card**: 
- Price + Airline Logo
- Times + Date + Duration
- Route with airport codes
- Direct/1 Stop badge
- Expandable detail view

### Tech Stack
- **Frontend**: Bootstrap + jQuery
- **Backend**: PHP
- **APIs**: Likely Kiwi.com integration
- **Date Picker**: Moment.js + Daterangepicker
- **Icons**: Font Awesome

---

## 🔧 Cloning Checklist

### Must-Have Features
- ✅ Flexible date range search
- ✅ Location autocomplete (cities/airports/countries)
- ✅ All 21 search filters
- ✅ Expandable flight cards
- ✅ Responsive design
- ✅ Fast API responses

### Nice-to-Have Features
- "Anywhere" destination search
- Country/region-based searches
- Self-transfer flight options
- Multi-currency support
- Airline selection

### APIs to Integrate
1. **Kiwi.com Tequila API** (recommended)
2. **Airport Database** (OpenFlights.org)
3. **Currency API** (ExchangeRate-API)

---

## 📊 Sample Response Structure

```json
{
  "bags_price": {...},
  "airlines": ["VY", "BA", "AF"],
  "route": [
    {
      "flyFrom": "LHR",
      "flyTo": "ORY",
      "cityFrom": "London",
      "cityTo": "Paris",
      "airline": "VY",
      "flight_no": "8961",
      "local_departure": "2026-10-07T15:00:00.000Z",
      "local_arrival": "2026-10-07T17:35:00.000Z"
    }
  ]
}
```

---

## ⚡ Quick Tips

1. **Cache everything** - Flight API calls are slow and expensive
2. **Date ranges are the key feature** - Don't just copy other flight search sites
3. **Keep UI minimal** - FlightList's strength is simplicity
4. **Autocomplete is critical** - Must be fast (<200ms response)
5. **Mobile-first design** - Most users search on mobile

---

For full documentation, see:
- `flightlist-clone-documentation.md` - Complete UI/UX breakdown
- `api-endpoints-summary.md` - Technical API details
- `SUMMARY.md` - Executive summary with roadmap
