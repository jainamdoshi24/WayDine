# WayDine — Route-Based Highway Restaurant Recommendations

> Find food stops that fit your route, schedule, and detour budget — ranked by actual driving distance, ETA, and road accessibility. Not straight-line guesses.

**No AI/ML models.** Built entirely on graph algorithms, geometry, deterministic rule-based logic, and SQL.

---

## Quick Start

### Prerequisites

- Node.js 18+
- npm 9+
- An ORS (OpenRouteService) API key — or the app falls back to in-memory demo data automatically

### 1. Backend

```bash
cd backend
npm install
cp .env.example .env     # fill in ORS_API_KEY, DATABASE_URL (optional)
npm run dev              # starts on http://localhost:3001
```

### 2. Frontend

```bash
cd frontend
npm install
npm run dev              # starts on http://localhost:5173
```

### 3. Database (optional)

Without PostgreSQL the app uses in-memory fallback restaurant data automatically.

```bash
cd backend
npm run db:migrate       # creates tables
npm run db:seed          # seeds demo restaurants
```

---

## Environment Variables

| Variable | Required | Description |
|---|---|---|
| `ORS_API_KEY` | No | OpenRouteService API key for routing. Falls back to OSRM demo server. |
| `DATABASE_URL` | No | PostgreSQL connection string. Falls back to in-memory data. |
| `PORT` | No | Backend port (default: 3001) |
| `RATE_LIMIT_WINDOW_MS` | No | Rate limiting window in ms (default: 60000) |
| `RATE_LIMIT_MAX` | No | Max requests per window (default: 60) |

---

## Architecture

```
Route Input (city names)
    │
    ▼ Nominatim geocoding
Coordinate Pair
    │
    ▼ OSRM / ORS routing
Route Polyline + Duration
    │
    ▼ Cross-track distance filter (≤ 200 m)
Candidate Restaurants
    │
    ▼ Rule Engine (16 rules)
Evaluated Candidates
    │
    ▼ Detour Budget Wallet enforcement
Eligible Candidates
    │
    ▼ Deterministic efficiency score
Ranked Results + Rejection Analytics
```

---

## Algorithms

### Haversine Distance
Computes spherical-Earth distance between two lat/lng points. Used for all point-to-point measurements.

```
a = sin²(Δlat/2) + cos(lat1)·cos(lat2)·sin²(Δlon/2)
d = 2R·arcsin(√a)
```

### Cross-Track Distance
Measures the perpendicular distance from a point to a great-circle path segment. Used to determine if a restaurant is within 200 m of the route polyline.

### OSRM Routing
Open Source Routing Machine provides real drivable routes, distances, and travel durations. Used to compute actual detour when a restaurant is selected.

### Detour Budget Wallet
```
Distance utilization = actual extra distance / max distance budget
Time utilization     = actual extra time     / max time budget
```
Hard-rejects any candidate exceeding active budget constraints. Never treats straight-line distance as driving detour.

### Efficiency Score (0–100)
Weighted combination of:
- Perpendicular distance to route (lower is better)
- Driving detour (lower is better)
- ETA margin to closing time (higher is better)
- Meal availability match
- Cuisine/dietary preference match

Hard constraints (road access, budget, opening hours, corridor) are evaluated **before** scoring. A high score cannot override a failed hard constraint.

---

## Feature A — Detour Budget Wallet

Controls how much extra driving a user accepts for a restaurant stop.

**Presets** (configurable in `backend/src/config/presets.ts`):

| Preset | Max Distance | Max Time |
|---|---|---|
| Strict | 2 km | 5 min |
| Balanced | 5 km | 10 min |
| Flexible | 15 km | 25 min |

**Modes:** distance-only, time-only, or both.

Backend enforces eligibility — frontend-only filtering is not used.

---

## Feature B — Explainable Rejection Engine

16 named rule IDs evaluated deterministically for every candidate in priority order:

| Rule ID | Description |
|---|---|
| `INVALID_COORDINATES` | Restaurant has missing or out-of-range coordinates |
| `OUTSIDE_ROUTE_CORRIDOR` | More than 200 m from any route segment |
| `BEHIND_CURRENT_POSITION` | Behind the driver (requires excessive backtracking) |
| `EXCESSIVE_BACKWARD_TRAVEL` | Forward but requires too much backtracking |
| `ACCESS_UNVERIFIED` | Road access to the restaurant cannot be confirmed |
| `OPPOSITE_CARRIAGEWAY` | Restaurant appears to be on the opposite side of a divided road |
| `U_TURN_REQUIRED` | Access requires a U-turn |
| `ROAD_RESTRICTION` | Known road restriction prevents access |
| `DISTANCE_BUDGET_EXCEEDED` | Driving detour exceeds the distance budget |
| `TIME_BUDGET_EXCEEDED` | Driving detour exceeds the time budget |
| `RESTAURANT_CLOSED_AT_ETA` | Restaurant is closed at the estimated arrival time |
| `MEAL_UNAVAILABLE` | Selected meal type is not served at arrival time |
| `PREFERENCE_MISMATCH` | Cuisine or dietary preferences not met |
| `PRICE_CONSTRAINT_EXCEEDED` | Price level exceeds the user's maximum |
| `STALE_RESTAURANT_DATA` | Restaurant data is older than the staleness threshold |
| `INSUFFICIENT_ROUTE_DATA` | Route data is missing or incomplete |

**Final statuses:** `recommended` · `eligible` · `rejected` · `needs_verification`

---

## Data Sources & Limitations

| Data type | Source | Notes |
|---|---|---|
| Road routing | OSRM / ORS | Real road network |
| Geocoding | Nominatim (OSM) | City-level accuracy |
| Restaurant data | In-memory seed / PostgreSQL | **Demo data only** — synthetic businesses |
| Opening hours | Seed data | Not live; for demonstration |
| Road access | Geometry + `highway_access` field | Unverified unless explicitly set |

> **Important:** Restaurant data is synthetic and for demonstration purposes only. Do not use for real navigation decisions.

Attribution: Road data © [OpenStreetMap contributors](https://www.openstreetmap.org/copyright) (ODbL) · Routing by [OSRM](http://project-osrm.org) · Geocoding by [Nominatim](https://nominatim.org)

---

## Testing

```bash
cd backend
npm test        # 112 tests across 7 test files
npm run build   # TypeScript compilation check
```

```bash
cd frontend
npm run build   # TypeScript + Vite production build
```

**Test coverage:**
- `geo.test.ts` — Haversine, cross-track, road-side geometry (14 tests)
- `eta.test.ts` — ETA calculation and opening-hours evaluation (15 tests)
- `direction.test.ts` — Route direction and forward-position checks (24 tests)
- `dijkstra.test.ts` — Shortest-path algorithm (5 tests)
- `ruleEngine.test.ts` — All 16 rule IDs, multiple failures, analytics (32 tests)
- `detourBudget.test.ts` — Preset translation and budget enforcement (9 tests)
- `integration/api.test.ts` — Full API endpoint integration (13 tests)

---

## Project Structure

```
WayDine/
├── backend/
│   ├── src/
│   │   ├── algorithms/     # geo, eta, recommendations, ruleEngine, dijkstra
│   │   ├── config/         # presets (detour budget defaults)
│   │   ├── db/             # pool, migrate, seed, fallback data
│   │   ├── middleware/      # errorHandler, rate limiting
│   │   ├── routes/         # health, routes, recommendations, restaurants, demo
│   │   ├── services/        # osrm (routing)
│   │   └── types/          # shared TypeScript interfaces
│   └── tests/
└── frontend/
    └── src/
        ├── components/
        │   ├── analytics/   # RejectionAnalyticsPanel
        │   ├── demo/        # DemoModal
        │   ├── filters/     # FilterPanel
        │   ├── map/         # MapView, RouteSummaryCard
        │   ├── restaurants/ # RestaurantCard, ResultsPanel, DetailPanel, RejectionPanel
        │   ├── saved/       # SavedStopsDrawer
        │   ├── ui/          # Button, Card, Badge, Input, Skeleton
        │   └── wallet/      # DetourWalletPanel
        ├── sections/        # Landing page sections (10 total)
        ├── hooks/           # useSavedStops
        ├── lib/             # api, utils
        ├── types/           # frontend TypeScript interfaces
        ├── LandingPage.tsx  # Root landing page orchestrator
        ├── Planner.tsx      # Interactive route planner component
        └── App.tsx          # App root (renders LandingPage)
```
