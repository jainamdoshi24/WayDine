/**
 * Phase 2 extended types for WayDine backend.
 * Extends Phase 1 types without breaking existing contracts.
 */

export interface Restaurant {
  id: number;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  entrance_lat: number | null;
  entrance_lng: number | null;
  cuisine: string;
  price_level: number;
  is_vegetarian: boolean;
  has_vegetarian_options: boolean;
  opening_hours: Record<string, string>;       // { mon: '06:00-23:00', ... }
  food_availability: FoodAvailability;
  is_roadside: boolean;
  highway_access: string | null;
  rating: number | null;
  review_count: number;
  phone: string | null;
  website: string | null;
  image_url: string | null;
  data_source: string;
  is_demo: boolean;
  verified_at: string;
  created_at: string;
}

export interface FoodAvailability {
  breakfast: boolean;
  lunch: boolean;
  dinner: boolean;
  snacks: boolean;
}

export interface Coordinate {
  lat: number;
  lng: number;
}

export interface RouteSegment {
  start: Coordinate;
  end: Coordinate;
  length: number;            // metres
  bearing: number;           // degrees 0–360, direction of travel
  cumulativeStart: number;   // cumulative distance at start
  cumulativeEnd: number;     // cumulative distance at end
}

export interface RouteGeometry {
  coordinates: Coordinate[];
  segments: RouteSegment[];
  totalDistance: number;
  totalDuration: number;
}

export interface ProjectionResult {
  restaurant: Restaurant;
  projectedPoint: Coordinate;
  perpendicularDistance: number;  // metres
  signedCrossTrack: number;       // +ve = right side, -ve = left side
  routePosition: number;          // cumulative metres along route
  segmentIndex: number;
  segmentBearing: number;         // degrees, travel direction at projection
}

export interface AccessibilityInfo {
  status: 'confirmed_same_side' | 'opposite_side' | 'uncertain';
  label: string;
  requiresCrossing: boolean;
  hasEntrance: boolean;
  isRoadside: boolean;
}

export interface BackwardTravelInfo {
  hasBackwardTravel: boolean;
  backtrackDistanceMetres: number;
}

export interface DetourInfo {
  detourDistanceMetres: number;
  detourDurationSeconds: number;
  detourSource: 'osrm' | 'estimated';
}

export interface EtaInfo {
  eta: string;                     // ISO timestamp
  etaFormatted: string;            // '12:40 PM'
  mealAvailable: MealWindow | null;
  isOpenAtEta: boolean | null;     // null = unknown
  closingWarning: boolean;         // closes within 30 min of ETA
  availabilityLabel: string;       // human-readable string
}

export type MealWindow = 'breakfast' | 'lunch' | 'snacks' | 'dinner' | 'all_day';

export interface MealWindowDef {
  name: MealWindow;
  label: string;
  startHour: number;  // inclusive
  startMin: number;
  endHour: number;    // inclusive
  endMin: number;
}

// ── Score components (all 0–1, higher = better) ─────────────────────────────

export interface ScoreComponents {
  detourEfficiency: number;      // weight 0.35
  directionSuitability: number;  // weight 0.25
  accessibility: number;         // weight 0.20
  timeSuitability: number;       // weight 0.10
  preferenceMatch: number;       // weight 0.10
}

export interface ScoreWeights {
  detourEfficiency: number;
  directionSuitability: number;
  accessibility: number;
  timeSuitability: number;
  preferenceMatch: number;
}

export const DEFAULT_WEIGHTS: ScoreWeights = {
  detourEfficiency:     0.35,
  directionSuitability: 0.25,
  accessibility:        0.20,
  timeSuitability:      0.10,
  preferenceMatch:      0.10,
};

export interface EligibilityResult {
  eligible: boolean;
  hardFailReasons: string[];
}

export interface RecommendationCandidate extends ProjectionResult {
  detour: DetourInfo;
  backward: BackwardTravelInfo;
  accessibility: AccessibilityInfo;
  eta: EtaInfo;
  score: number;                    // 0–100 (higher = better)
  scoreComponents: ScoreComponents;
  reasons: string[];                // human-readable explanation bullets
  mode: 'strict' | 'relaxed';
}

// ── Request / Response ───────────────────────────────────────────────────────

export interface RouteRequest {
  source: Coordinate | string;
  destination: Coordinate | string;
  departureTime?: string;
}

export interface RouteResponse {
  geometry: Coordinate[];
  distance: number;
  duration: number;
  source: string;
}

export interface DetourBudget {
  maxDistanceKm:  number;
  maxTimeMinutes: number;
  mode:           'distance' | 'time' | 'both';
  preset?:        'strict' | 'balanced' | 'flexible' | 'custom';
}

export interface UserPreferences {
  vegetarianOnly?: boolean;
  cuisines?: string[];
  maxPriceLevel?: number;
  maxDetourMetres?: number;
  maxDetourTimeSeconds?: number;
  maxPerpendicularMetres?: number;
  meal?: MealWindow | 'any';
  preferredArrivalWindow?: { from: string; to: string };
  maxAccessUncertainty?: 'confirmed' | 'uncertain' | 'any';
  mode?: 'strict' | 'relaxed';
  departureTime?: string;
  weights?: Partial<ScoreWeights>;
  detourBudget?: DetourBudget;
}

export interface RecommendationRequest {
  route: RouteResponse;
  preferences?: UserPreferences;
}

export interface ApiError {
  error: string;
  code: string;
  details?: unknown;
}
