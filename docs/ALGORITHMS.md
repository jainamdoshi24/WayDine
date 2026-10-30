# WayDine — Algorithm Reference

All algorithms are deterministic and formula-based. No AI/ML models or LLM APIs are used.

---

## 1. Route Geometry Processing

### Haversine Distance
Computes great-circle distance between two coordinates.

```
R = 6371000  (Earth radius in metres)
Δlat = (lat2 - lat1) × π/180
Δlng = (lng2 - lng1) × π/180
a = sin²(Δlat/2) + cos(lat1) × cos(lat2) × sin²(Δlng/2)
distance = 2R × arcsin(√a)
```

### Bearing
Compass bearing from point A to point B (degrees 0–360):

```
θ = atan2(
  sin(Δlng) × cos(lat2),
  cos(lat1) × sin(lat2) − sin(lat1) × cos(lat2) × cos(Δlng)
)
bearing = (θ × 180/π + 360) mod 360
```

### Route Segments
Each consecutive pair of route waypoints forms a segment with:
- `length` — Haversine distance in metres
- `bearing` — travel direction at that segment
- `cumulativeStart`, `cumulativeEnd` — distance from route start

### Perpendicular Projection

For a restaurant R and a route segment (A→B):

```
t = clamp(dot(AR, AB) / |AB|², 0, 1)
projectedPoint = A + t × (B - A)
perpendicularDistance = haversine(R, projectedPoint)
```

where `AR`, `AB` are vectors in (lat, lng) space (approximated as planar for short segments).

### Signed Cross-Track Distance

Determines which side of the road a restaurant is on:

```
δ₁₃ = haversine(A, R) / R_earth     (angular distance A→R)
θ₁₃ = bearing(A, R)
θ₁₂ = bearing(A, B)

crossTrack = R_earth × arcsin(sin(δ₁₃) × sin(θ₁₃ - θ₁₂))
```

- **Positive** → restaurant is to the **right** of travel direction
- **Negative** → restaurant is to the **left** of travel direction

In India, vehicles drive on the **left**, so:
- Left side (`signedCrossTrack < 0`) → same-side access (nearer lane)
- Right side (`signedCrossTrack > 0`) → opposite side (requires crossing or u-turn)

---

## 2. Accessibility Classification

```typescript
function classifyAccessibility(signedCrossTrack, restaurant):
  if restaurant.is_roadside AND restaurant.highway_access != null:
    if signedCrossTrack < -10:          // clearly left side
      return 'confirmed_same_side'
    if signedCrossTrack > +30:          // clearly right side
      return 'opposite_side'
    return 'uncertain'
  if signedCrossTrack < -15:
    return 'confirmed_same_side'
  if signedCrossTrack > +30:
    return 'opposite_side'
  return 'uncertain'
```

| Status | Accessibility Score | Meaning |
|--------|-------------------|---------|
| `confirmed_same_side` | 1.0 | No lane crossing needed |
| `uncertain` | 0.5 | Side unclear from available data |
| `opposite_side` | 0.0 | Crossing or u-turn required |

---

## 3. ETA Calculation

```
departureEpoch = departure timestamp (ms)
routeTimeSoFar = routePosition / (totalDistance / totalDuration)
remainingDriveTime = totalDuration - routeTimeSoFar
detourDriveTime = detour.detourDurationSeconds

eta = new Date(departureEpoch + (remainingDriveTime + detourDriveTime) × 1000)
```

### Timezone Handling
Local time is extracted using `Intl.DateTimeFormat` — never manual UTC offset arithmetic:

```typescript
const fmt = new Intl.DateTimeFormat('en-IN', {
  timeZone: 'Asia/Kolkata',
  hour: '2-digit', minute: '2-digit', hour12: false,
});
```

### Meal Windows (IST)

| Window | Open | Close |
|--------|------|-------|
| Breakfast | 06:00 | 10:30 |
| Lunch | 11:30 | 15:00 |
| Snacks | 15:00 | 18:30 |
| Dinner | 18:30 | 22:30 |

### Opening Hours Check
Opening hours stored as `{ mon: "06:00-23:00", ... }`.

1. Extract day-of-week in IST
2. Parse `openMin` and `closeMin` as minutes-since-midnight
3. `closeMin > 1440` → overnight (e.g. "22:00-02:00" → closeMin = 26×60)
4. Compare `etaMinutes` against window, check closing within 30 min

---

## 4. Pitstop Efficiency Score

```
score = 100 × (
  w_D × detourEfficiency     +
  w_S × directionSuitability +
  w_A × accessibility        +
  w_T × timeSuitability      +
  w_P × preferenceMatch
)
```

Default weights: `w_D=0.35, w_S=0.25, w_A=0.20, w_T=0.10, w_P=0.10`

### Component Formulas

#### Detour Efficiency (0–1)
```
detourEfficiency = 1 - clamp(detourDistanceMetres / maxDetourMetres, 0, 1)
```
Penalised further if `detourDurationSeconds > 600`:
```
timePenalty = clamp((detourDurationSeconds - 600) / 600, 0, 0.5)
detourEfficiency -= timePenalty
```

#### Direction Suitability (0–1)
```
angleDiff = |segmentBearing - travelBearing|   (normalized to 0–180)
directionSuitability = (180 - angleDiff) / 180
```
If backward travel detected:
```
directionSuitability *= 0.5
```

#### Accessibility (0–1)
Directly from `accessibilityScore()`:  
`0.0` (opposite) → `0.5` (uncertain) → `1.0` (confirmed same-side)

#### Time Suitability (0–1)
```
if isOpenAtEta == null: timeSuitability = 0.5    // unverified
if isOpenAtEta == false: timeSuitability = 0.0   // closed
if isOpenAtEta == true:
  timeSuitability = 0.7
  if mealAvailable != null: timeSuitability = 1.0
```
Closing-within-30-min penalty: `timeSuitability *= 0.7`

#### Preference Match (0–1)
```
score = 0.0
if vegetarianPreferred AND (is_vegetarian OR has_vegetarian_options): +0.4
if cuisine in preferredCuisines: +0.4
if price_level <= maxPriceLevel: +0.2
preferenceMatch = score (capped at 1.0)
```

### Hard Eligibility Constraints
A restaurant is **excluded entirely** (not just scored low) if:
- `detourDistanceMetres > maxDetourMetres` (user preference)
- `detourDurationSeconds > 1200` (20-minute hard cap)
- **Strict mode + `opposite_side` + no entrance recorded** → excluded

---

## 5. Backward Travel Detection

```
routePosition = cumulative metres along the route at the restaurant projection

if routePosition < (totalDistance × 0.05):
  hasBackwardTravel = true
  backtrackDistanceMetres = totalDistance × 0.05 - routePosition
```

This flags stops that would require the traveller to drive backward relative to their destination direction.

---

## 6. Graph Shortest Path (Dijkstra / A*)

Used for internal graph reasoning (not for OSRM routes). Implemented in `dijkstra.ts`.

### Dijkstra
```
Q = priority queue (min-heap by distance)
dist[source] = 0; dist[all others] = ∞
while Q not empty:
  u = Q.extractMin()
  for each neighbour v of u:
    alt = dist[u] + weight(u, v)
    if alt < dist[v]:
      dist[v] = alt
      prev[v] = u
      Q.insert(v, alt)
```

### A* (heuristic extension)
```
f(n) = g(n) + h(n)
g(n) = actual cost from source to n
h(n) = heuristic (Haversine distance to goal)
```

A* terminates early when the destination node is dequeued, making it faster than Dijkstra for single-pair shortest path queries.

---

## 7. Detour Routing

When a restaurant passes the 200m filter, WayDine computes the actual road detour:

```
OSRM route: projectedPoint → restaurant → rejoinPoint
detourDistance = OsrmRoute.distance - originalSegmentDistance
detourDuration = OsrmRoute.duration
```

If OSRM is unavailable:
```
estimatedDuration = haversine(projectedPoint, restaurant) / (50 km/h) × 2
detourSource = 'estimated'
```

The `detourSource` field is always surfaced in the UI so users know when estimates are approximate.

---

## 8. Score Component Normalisation

All components are normalised to [0, 1] before multiplication. The final score is multiplied by 100 and rounded to an integer.

The weights sum to 1.0 (`0.35 + 0.25 + 0.20 + 0.10 + 0.10 = 1.00`), so the maximum possible score is 100 and the minimum is 0.

Weights are configurable via `UserPreferences.weights` — the API accepts a partial override, fills in defaults for any missing component.
