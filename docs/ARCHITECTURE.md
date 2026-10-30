# WayDine — System Architecture

## Overview

WayDine is a route-aware restaurant recommendation platform for highway travellers. It uses a deterministic, formula-based algorithm pipeline — no AI/ML models or LLM APIs.

```
┌─────────────────────────────────────────────────────────────────────┐
│  Browser (React + Vite + TypeScript)                                │
│                                                                     │
│  HeroSearch ──► App.tsx ──► MapView (Leaflet/OSM)                   │
│                    │                                                │
│                    ├──► ResultsPanel ──► RestaurantCard             │
│                    │                        │                       │
│                    └──► RestaurantDetailPanel (overlay)             │
│                                                                     │
│  FilterPanel ◄──► App.tsx ◄──► SavedStopsDrawer (localStorage)     │
│  DemoModal   ◄──► App.tsx                                           │
└──────────────────────────┬──────────────────────────────────────────┘
                           │ HTTP (fetch, /api proxy)
                           │
┌──────────────────────────▼──────────────────────────────────────────┐
│  Node.js + Express + TypeScript (port 3001)                         │
│                                                                     │
│  Rate Limiter (express-rate-limit)                                   │
│       │                                                             │
│  /api/routes ──────────────────► osrm.ts → OSRM / Nominatim        │
│  /api/recommendations ─────────► recommendations.ts pipeline        │
│  /api/restaurants ─────────────► pool.ts → PostgreSQL               │
│  /api/demo/scenarios ──────────► demo.ts (hardcoded scenarios)      │
│  /api/health ──────────────────► health.ts                          │
│                                                                     │
│  Algorithm Pipeline                                                  │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │ 1. SQL pre-filter (veg, price, cuisine, meal)               │   │
│  │ 2. buildRouteSegments() — geometry → RouteSegment[]         │   │
│  │ 3. projectPointOnSegment() — perpendicular projection       │   │
│  │ 4. ≤200m perpendicular filter                               │   │
│  │ 5. classifyAccessibility() — signed cross-track analysis    │   │
│  │ 6. fetchOsrmDetour() or estimateDuration() fallback         │   │
│  │ 7. detectBackwardTravel() — route-position check            │   │
│  │ 8. calculateEta() — Intl.DateTimeFormat, meal windows       │   │
│  │ 9. Hard eligibility constraints (detour > limit, opposite)  │   │
│  │10. Score = 100×(0.35×D + 0.25×S + 0.20×A + 0.10×T + 0.10×P)│  │
│  │11. Sort descending by score                                 │   │
│  └─────────────────────────────────────────────────────────────┘   │
└──────────────────────────┬──────────────────────────────────────────┘
                           │
           ┌───────────────┴───────────────┐
           │                               │
┌──────────▼──────────┐       ┌────────────▼───────────┐
│  PostgreSQL          │       │  External APIs          │
│  + PostGIS           │       │                        │
│                      │       │  OSRM (router.project- │
│  restaurants table   │       │  osrm.org)             │
│  ├ id, name, address │       │  - Route geometry      │
│  ├ lat, lng          │       │  - Duration            │
│  ├ entrance_lat/lng  │       │  - Detour calculation  │
│  ├ cuisine, price    │       │                        │
│  ├ is_vegetarian     │       │  Nominatim (OSM)       │
│  ├ opening_hours {}  │       │  - Address geocoding   │
│  ├ food_availability │       │  - Forward/reverse     │
│  ├ is_roadside       │       │                        │
│  ├ highway_access    │       └────────────────────────┘
│  ├ is_demo           │
│  └ data_source       │
└──────────────────────┘
```

## Component Architecture (Frontend)

```
App.tsx  (state machine: idle → routing → recommending → results/error)
├── Header.tsx          (logo, nav, Demo button, Saved Stops counter)
├── HeroSearch.tsx      (source/dest inputs, swap, quick examples)
├── MapView.tsx         (Leaflet, CartoDB tiles, route polyline, markers)
│   └── RouteSummaryCard.tsx  (floating: distance, duration, ETA)
├── ResultsPanel.tsx    (sort tabs, filter pills, card list)
│   ├── RestaurantCard.tsx    (rank, score ring, ETA, badges, stats)
│   │   └── ScoreBreakdownPanel.tsx (animated ring + bar chart)
│   └── RestaurantDetailPanel.tsx  (full detail overlay, navigation CTA)
├── FilterPanel.tsx     (meal chips, veg toggle, budget, detour, cuisine)
├── DemoModal.tsx       (5 scenario cards → triggers handleSearch)
└── SavedStopsDrawer.tsx (localStorage-backed saved stops list)
```

## Algorithm Pipeline (Backend)

```
POST /api/recommendations
        │
        ▼
SQL pre-filter
(veg, price_level, cuisine IN [...], food_availability->>meal)
        │
        ▼
buildRouteSegments(geometry)
→ RouteSegment[] with: start, end, length, bearing, cumulative distance
        │
        ▼
For each restaurant:
  projectPointOnSegment()
  → projectedPoint, perpendicularDistance, signedCrossTrack,
    routePosition, segmentBearing
        │
  perpendicularDistance ≤ 200m?  ──No──► discard
        │
        ▼
  classifyAccessibility(signedCrossTrack, restaurant)
  → status: confirmed_same_side | opposite_side | uncertain
  → accessibilityScore: 0.0 – 1.0
        │
        ▼
  fetchOsrmDetour(projectedPoint, restaurant, rejoinPoint)
  → detourDistanceMetres, detourDurationSeconds
  (fallback: estimateDuration from haversineDistance)
        │
        ▼
  detectBackwardTravel(routePosition, totalDistance)
  → hasBackwardTravel, backtrackDistanceMetres
        │
        ▼
  calculateEta(departureTime, routePosition, detour)
  → etaFormatted, mealAvailable, isOpenAtEta, closingWarning
  (uses Intl.DateTimeFormat for timezone-safe local time)
        │
        ▼
Hard eligibility check:
  • detourDistanceMetres > maxDetourMetres → FAIL
  • detourDurationSeconds > 1200 (20 min) → FAIL
  • strict mode + opposite_side + no entrance → FAIL
        │
        ▼
Score = 100 × (
  0.35 × detourEfficiency      (1 - detour/maxDetour, capped)
  0.25 × directionSuitability  (bearing alignment + forward penalty)
  0.20 × accessibility         (0 opposite, 0.5 uncertain, 1.0 same-side)
  0.10 × timeSuitability       (open + meal window match)
  0.10 × preferenceMatch       (veg, cuisine, price)
)
        │
        ▼
Sort descending by score → return top results
```

## Data Flow (End-to-End User Journey)

```
User types "Mumbai" → "Pune"
        │
        ▼
POST /api/routes
  geocodeAddress("Mumbai") → {lat, lng}
  geocodeAddress("Pune") → {lat, lng}
  fetchOsrmRoute(src, dst) → RouteResponse {geometry, distance, duration}
  (fallback: straight-line with warning banner)
        │
        ▼
Route displayed on MapView (blue polyline)
        │
        ▼
POST /api/recommendations
  SQL: SELECT * FROM restaurants WHERE ...
  Pipeline: project → filter → score → sort
  → Recommendation[] with score, ETA, access, detour
        │
        ▼
ResultsPanel shows ranked cards
User clicks a card → RestaurantDetailPanel opens
User clicks "Navigate" → Google Maps deeplink
User clicks "Save" → localStorage via useSavedStops hook
```

## Database Schema

```sql
CREATE TABLE restaurants (
  id                    SERIAL PRIMARY KEY,
  name                  TEXT NOT NULL,
  address               TEXT NOT NULL,
  latitude              DOUBLE PRECISION NOT NULL,
  longitude             DOUBLE PRECISION NOT NULL,
  entrance_lat          DOUBLE PRECISION,         -- actual entrance point
  entrance_lng          DOUBLE PRECISION,
  cuisine               TEXT NOT NULL,
  price_level           INTEGER NOT NULL,          -- 1 (₹) to 4 (₹₹₹₹)
  is_vegetarian         BOOLEAN NOT NULL DEFAULT FALSE,
  has_vegetarian_options BOOLEAN NOT NULL DEFAULT TRUE,
  opening_hours         JSONB NOT NULL DEFAULT '{}',  -- {mon: "06:00-23:00", ...}
  food_availability     JSONB NOT NULL DEFAULT '{}',  -- {breakfast, lunch, dinner, snacks}
  is_roadside           BOOLEAN NOT NULL DEFAULT FALSE,
  highway_access        TEXT,                     -- human description of access
  rating                NUMERIC(3,1),             -- 1.0–5.0
  review_count          INTEGER NOT NULL DEFAULT 0,
  phone                 TEXT,
  website               TEXT,
  image_url             TEXT,
  data_source           TEXT NOT NULL DEFAULT 'unknown',
  is_demo               BOOLEAN NOT NULL DEFAULT FALSE,
  verified_at           TIMESTAMPTZ,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_restaurants_location ON restaurants (latitude, longitude);
CREATE INDEX idx_restaurants_cuisine ON restaurants (cuisine);
CREATE INDEX idx_restaurants_is_demo ON restaurants (is_demo);
```

## Security Measures

| Measure | Implementation |
|---------|---------------|
| SQL injection | Parameterized queries only (`$1, $2, ...`) |
| XSS | Helmet.js headers, React auto-escaping |
| Rate limiting | `express-rate-limit`: 60 req/min routes, 120 req/min recs |
| Input validation | Body schema checks before any DB/OSRM call |
| CORS | Explicit origin whitelist |
| Secrets | `.env` file, never in frontend code |
| Request size | JSON body limit 1MB |
| External timeouts | 10s timeout on OSRM + Nominatim requests |

## External Dependencies

| Service | Purpose | Licence |
|---------|---------|---------|
| OSRM (router.project-osrm.org) | Road routing & detour calculation | BSD 2-Clause |
| Nominatim (nominatim.openstreetmap.org) | Address geocoding | ODbL |
| OpenStreetMap (via CartoDB tiles) | Map tiles | ODbL |

All external services are used read-only and follow their acceptable-use policies.
No API keys required for the demo.

## Performance Notes

- Route geometry is cached client-side between filter changes (re-uses `lastRoute`)
- SQL pre-filtering eliminates unmatched restaurants before expensive spatial calculations
- OSRM detour calls are limited to candidates passing the 200m perpendicular filter
- Recommendations endpoint returns bounded results (all that pass the filter, sorted)
