// Phase 2 extended frontend types

export interface Coordinate {
  lat: number;
  lng: number;
}

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
  opening_hours: Record<string, string>;
  food_availability: {
    breakfast: boolean;
    lunch: boolean;
    dinner: boolean;
    snacks: boolean;
  };
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
}

export interface RouteResponse {
  geometry: Coordinate[];
  distance: number;
  duration: number;
  source: string;
}

export interface DetourInfo {
  detourDistanceMetres: number;
  detourDurationSeconds: number;
  detourSource: 'osrm' | 'estimated';
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

export interface EtaInfo {
  eta: string;
  etaFormatted: string;
  mealAvailable: MealWindow | null;
  isOpenAtEta: boolean | null;
  closingWarning: boolean;
  availabilityLabel: string;
}

export type MealWindow = 'breakfast' | 'lunch' | 'snacks' | 'dinner' | 'all_day';

export interface ScoreComponents {
  detourEfficiency: number;
  directionSuitability: number;
  accessibility: number;
  timeSuitability: number;
  preferenceMatch: number;
}

export interface ScoreWeights {
  detourEfficiency: number;
  directionSuitability: number;
  accessibility: number;
  timeSuitability: number;
  preferenceMatch: number;
}

export interface Recommendation {
  restaurant: Restaurant;
  projectedPoint: Coordinate;
  perpendicularDistance: number;
  signedCrossTrack: number;
  routePosition: number;
  segmentIndex: number;
  segmentBearing: number;
  detour: DetourInfo;
  backward: BackwardTravelInfo;
  accessibility: AccessibilityInfo;
  eta: EtaInfo;
  score: number;            // 0–100
  scoreComponents: ScoreComponents;
  reasons: string[];
  mode: 'strict' | 'relaxed';
}

export interface UserPreferences {
  vegetarianOnly?: boolean;
  cuisines?: string[];
  maxPriceLevel?: number;
  maxDetourMetres?: number;
  maxDetourTimeSeconds?: number;
  maxPerpendicularMetres?: number;
  meal?: MealWindow | 'any';
  mode?: 'strict' | 'relaxed';
  departureTime?: string;
  detourBudget?: DetourBudget;
}

export type AppState = 'idle' | 'routing' | 'recommending' | 'results' | 'error';

export type SortMode = 'score' | 'detour' | 'rating' | 'eta';

// ── Detour Budget Wallet ─────────────────────────────────────────────────────

export interface DetourBudget {
  maxDistanceKm: number;
  maxTimeMinutes: number;
  mode: 'distance' | 'time' | 'both';
  preset?: 'strict' | 'balanced' | 'flexible' | 'custom';
}

export const DETOUR_PRESETS_FE = {
  strict:   { maxDistanceKm: 2,  maxTimeMinutes: 5,  label: 'Strict',   description: 'Minimal extra driving' },
  balanced: { maxDistanceKm: 5,  maxTimeMinutes: 10, label: 'Balanced', description: 'Recommended default' },
  flexible: { maxDistanceKm: 10, maxTimeMinutes: 20, label: 'Flexible', description: 'More options' },
} as const;

// ── Rule Engine ─────────────────────────────────────────────────────────────

export type RuleStatus = 'passed' | 'failed' | 'warning' | 'not_evaluated';

export interface RuleResult {
  ruleId: string;
  status: RuleStatus;
  label: string;
  reason?: string;
  actualValue?: string | number;
  allowedValue?: string | number;
}

export type FinalStatus = 'recommended' | 'eligible' | 'rejected' | 'needs_verification';

export interface BudgetUtilization {
  distanceActualMetres: number;
  distanceLimitMetres: number;
  distancePct: number | null;
  timeActualSeconds: number;
  timeLimitSeconds: number;
  timePct: number | null;
}

export interface RuleEvaluation {
  restaurantId: number;
  restaurantName: string;
  rules: RuleResult[];
  passedRules: string[];
  failedRules: string[];
  warningRules: string[];
  missingData: string[];
  finalStatus: FinalStatus;
  score: number | null;
  budgetUtilization: BudgetUtilization | null;
  explanation: string;
}

export interface RejectionAnalytics {
  totalEvaluated: number;
  recommended: number;
  eligible: number;
  rejected: number;
  needsVerification: number;
  rejectionsByRule: Record<string, number>;
}
