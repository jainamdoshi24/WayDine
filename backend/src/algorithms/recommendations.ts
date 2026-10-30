/**
 * Phase 2 — Complete recommendation pipeline.
 *
 * Replaces the Phase 1 recommendations.ts with the full 5-component scoring
 * system, ETA-awareness, accessibility classification, and backward-travel
 * detection.
 *
 * Score formula (higher = better, 0–100):
 *   score = 100 × (
 *     w1 × detour_efficiency    +   [default 0.35]
 *     w2 × direction_suitability +  [default 0.25]
 *     w3 × accessibility         +  [default 0.20]
 *     w4 × time_suitability      +  [default 0.10]
 *     w5 × preference_match      )  [default 0.10]
 *
 * Hard eligibility constraints are evaluated first.
 * A high score NEVER overrides a hard failure.
 */

import {
  Coordinate,
  Restaurant,
  RouteResponse,
  RecommendationCandidate,
  ProjectionResult,
  DetourInfo,
  ScoreComponents,
  ScoreWeights,
  DEFAULT_WEIGHTS,
  UserPreferences,
  EligibilityResult,
  MealWindow,
} from '../types/index.js';

import {
  buildRouteSegments,
  findNearestSegment,
  haversineDistance,
  estimateDuration,
  detectBackwardTravel,
} from './geo.js';

import { fetchOsrmDetour } from '../services/osrm.js';
import { computeEta } from './eta.js';
import { classifyAccessibility, accessibilityScore } from './accessibility.js';
import {
  evaluateCandidate,
  computeAnalytics,
  RuleEvaluation,
  RejectionAnalytics,
} from './ruleEngine.js';

// ── Configuration ─────────────────────────────────────────────────────────────

export interface RecommendationOptions {
  maxPerpendicularMetres: number;
  maxDetourMetres: number;
  maxDetourTimeSeconds: number;
  departureTime: Date;
  averageSpeedKmh: number;
  mode: 'strict' | 'relaxed';
  preferences: UserPreferences;
  weights: ScoreWeights;
}

const DEFAULTS: RecommendationOptions = {
  maxPerpendicularMetres: 200,
  maxDetourMetres: 5000,
  maxDetourTimeSeconds: 1200,   // 20 min hard ceiling (overridden by budget)
  departureTime: new Date(),
  averageSpeedKmh: 70,
  mode: 'strict',
  preferences: {},
  weights: { ...DEFAULT_WEIGHTS },
};

// ── Main pipeline ─────────────────────────────────────────────────────────────

export interface RecommendationResult {
  candidates:      RecommendationCandidate[];
  allEvaluations:  RuleEvaluation[];
  analytics:       RejectionAnalytics;
}

export async function computeRecommendations(
  restaurants: Restaurant[],
  route: RouteResponse,
  opts: Partial<RecommendationOptions> = {}
): Promise<RecommendationCandidate[]> {
  const result = await computeRecommendationsV2(restaurants, route, opts);
  return result.candidates;
}

export async function computeRecommendationsV2(
  restaurants: Restaurant[],
  route: RouteResponse,
  opts: Partial<RecommendationOptions> = {}
): Promise<RecommendationResult> {
  const options: RecommendationOptions = {
    ...DEFAULTS,
    ...opts,
    weights: { ...DEFAULT_WEIGHTS, ...(opts.weights ?? {}) },
    preferences: opts.preferences ?? {},
  };

  const {
    maxPerpendicularMetres,
    maxDetourMetres,
    departureTime,
    averageSpeedKmh,
    mode,
    preferences,
    weights,
  } = options;

  const segments = buildRouteSegments(route.geometry);
  if (segments.length === 0) return { candidates: [], allEvaluations: [], analytics: computeAnalytics([]) };

  const totalDistance = route.distance;
  const totalDuration  = route.duration;
  const maxDetourTimeSeconds = options.maxDetourTimeSeconds;

  // ── Step 1: Project + perpendicular filter ─────────────────────────────────
  // Collect ALL restaurants that are geometrically near the route so we can
  // build rule evaluations for rejected ones too.
  const allProjections: Array<{ proj: ProjectionResult; outsideCorridor: boolean }> = [];

  for (const restaurant of restaurants) {
    const point: Coordinate = { lat: restaurant.latitude, lng: restaurant.longitude };
    const nearest = findNearestSegment(point, segments);
    const outsideCorridor = nearest.perpendicularDistance > maxPerpendicularMetres;

    // Include up to 5× corridor width so we can explain rejections
    if (nearest.perpendicularDistance > maxPerpendicularMetres * 5) continue;
    if (nearest.routePosition < 0 || nearest.routePosition > totalDistance) continue;

    allProjections.push({
      proj: {
        restaurant,
        projectedPoint:       nearest.projectedPoint,
        perpendicularDistance: nearest.perpendicularDistance,
        signedCrossTrack:     nearest.signedCrossTrack,
        routePosition:        nearest.routePosition,
        segmentIndex:         nearest.segmentIndex,
        segmentBearing:       nearest.segmentBearing,
      },
      outsideCorridor,
    });
  }

  // ── Step 2: Detour + classification (batched) ──────────────────────────────
  const candidates:     RecommendationCandidate[] = [];
  const allEvaluations: RuleEvaluation[]          = [];

  const BATCH = 8;
  for (let i = 0; i < allProjections.length; i += BATCH) {
    const batch = allProjections.slice(i, i + BATCH);

    const results = await Promise.all(batch.map(async ({ proj, outsideCorridor }) => {
      const restaurantCoord: Coordinate = {
        lat: proj.restaurant.latitude,
        lng: proj.restaurant.longitude,
      };

      const exitPoint = findExitPoint(proj.routePosition + 1000, route.geometry, segments);

      // Detour (OSRM with estimate fallback)
      const detour = await computeDetour(
        proj.projectedPoint, restaurantCoord, exitPoint, averageSpeedKmh
      );

      // Backward travel
      const exitPos = findPositionOnRoute(exitPoint, segments);
      const backward = detectBackwardTravel(
        proj.routePosition, exitPos, proj.routePosition - 500
      );

      // Accessibility
      const accessibility = classifyAccessibility(
        proj.signedCrossTrack, proj.perpendicularDistance, proj.restaurant, mode === 'strict'
      );

      // ETA
      const meal = preferences.meal !== 'any' ? preferences.meal : undefined;
      const eta  = computeEta(
        departureTime, proj.routePosition, totalDistance, totalDuration,
        detour.detourDurationSeconds, proj.restaurant, meal
      );

      // Hard eligibility (includes time budget)
      const eligibility = checkEligibility(
        proj, detour, maxDetourMetres, maxDetourTimeSeconds, mode, preferences
      );
      const isEligible = eligibility.eligible && !outsideCorridor;

      // Score (compute even for rejected so rule engine can include it)
      const scoreComponents = buildScoreComponents(proj, detour, backward, accessibility, eta, preferences);
      const score           = computeFinalScore(scoreComponents, weights);
      const reasons         = buildReasons(proj, detour, backward, accessibility, eta, score);

      // Rule evaluation for every candidate
      const ruleEval = evaluateCandidate({
        restaurant:             proj.restaurant,
        perpendicularDistance:  proj.perpendicularDistance,
        routePosition:          proj.routePosition,
        totalRouteDistance:     totalDistance,
        signedCrossTrack:       proj.signedCrossTrack,
        detour,
        backward,
        accessibility,
        eta,
        preferences,
        maxPerpendicularMetres,
        maxDetourMetres,
        maxDetourTimeSeconds,
        score: isEligible ? score : null,
      });

      allEvaluations.push(ruleEval);

      if (!isEligible) return null;

      return {
        ...proj,
        detour,
        backward,
        accessibility,
        eta,
        score,
        scoreComponents,
        reasons,
        mode,
        ruleEvaluation: ruleEval,
      } as RecommendationCandidate & { ruleEvaluation: RuleEvaluation };
    }));

    for (const r of results) {
      if (r) candidates.push(r);
    }
  }

  // ── Step 3: Sort by score descending ──────────────────────────────────────
  candidates.sort((a, b) => b.score - a.score);

  const analytics = computeAnalytics(allEvaluations);

  return { candidates, allEvaluations, analytics };
}

// ── Hard eligibility constraints ───────────────────────────────────────────────

function checkEligibility(
  proj: ProjectionResult,
  detour: DetourInfo,
  maxDetourMetres: number,
  maxDetourTimeSeconds: number,
  mode: 'strict' | 'relaxed',
  prefs: UserPreferences
): EligibilityResult {
  const fails: string[] = [];

  if (detour.detourDistanceMetres > maxDetourMetres) {
    fails.push(`Detour ${Math.round(detour.detourDistanceMetres / 1000 * 10) / 10} km exceeds limit`);
  }

  if (detour.detourDurationSeconds > maxDetourTimeSeconds) {
    fails.push(`Detour time ${Math.ceil(detour.detourDurationSeconds / 60)} min exceeds time limit`);
  }

  if (proj.perpendicularDistance > (prefs.maxPerpendicularMetres ?? 200)) {
    fails.push('Too far from route');
  }

  // In strict mode, opposite-side without entrance data is rejected
  if (mode === 'strict') {
    const noEntrance =
      proj.restaurant.entrance_lat === null && proj.restaurant.entrance_lng === null;
    const clearlyOpposite = proj.signedCrossTrack < -100 && !proj.restaurant.is_roadside;

    if (noEntrance && clearlyOpposite) {
      fails.push('Opposite-side access unverifiable (strict mode)');
    }
  }

  return { eligible: fails.length === 0, hardFailReasons: fails };
}

// ── Score components ───────────────────────────────────────────────────────────

function buildScoreComponents(
  proj: ProjectionResult,
  detour: DetourInfo,
  backward: { hasBackwardTravel: boolean; backtrackDistanceMetres: number },
  access: ReturnType<typeof classifyAccessibility>,
  eta: ReturnType<typeof computeEta>,
  prefs: UserPreferences
): ScoreComponents {
  const MAX_DETOUR_M = 5000;
  const MAX_DETOUR_S = 1200; // 20 min

  // 1. Detour efficiency (lower detour = higher score)
  const rawDetourEff = 1 - Math.min(1, detour.detourDistanceMetres / MAX_DETOUR_M);
  const backtrackPenalty = backward.hasBackwardTravel
    ? Math.min(0.4, backward.backtrackDistanceMetres / 5000)
    : 0;
  const detourEfficiency = Math.max(0, rawDetourEff - backtrackPenalty);

  // 2. Direction suitability
  // Score based on segment bearing consistency and whether the approach
  // requires a U-turn or crossing.
  let directionSuitability = 1.0;
  if (access.requiresCrossing) directionSuitability -= 0.5;
  if (backward.hasBackwardTravel) {
    directionSuitability -= Math.min(0.4, backward.backtrackDistanceMetres / 3000);
  }
  // Perpendicular proximity bonus (closer = easier approach)
  directionSuitability -= Math.min(0.15, proj.perpendicularDistance / (200 / 0.15));
  directionSuitability = Math.max(0, directionSuitability);

  // 3. Accessibility
  const accessibility = accessibilityScore(access);

  // 4. Time suitability
  let timeSuitability = 0.5; // neutral if unknown
  if (eta.isOpenAtEta === false) {
    timeSuitability = 0;
  } else if (eta.isOpenAtEta === true) {
    timeSuitability = eta.mealAvailable ? 1.0 : 0.65;
    if (eta.closingWarning) timeSuitability *= 0.7;
  }

  // 5. Preference match
  const preferenceMatch = computePreferenceMatch(proj.restaurant, prefs);

  return {
    detourEfficiency,
    directionSuitability,
    accessibility,
    timeSuitability,
    preferenceMatch,
  };
}

function computePreferenceMatch(r: Restaurant, prefs: UserPreferences): number {
  let score = 1.0;
  let checks = 0;

  // Vegetarian
  checks++;
  if (prefs.vegetarianOnly) {
    score *= r.is_vegetarian || r.has_vegetarian_options ? 1.0 : 0;
  }

  // Cuisine match
  if (prefs.cuisines && prefs.cuisines.length > 0) {
    checks++;
    const matches = prefs.cuisines.some(
      c => r.cuisine.toLowerCase().includes(c.toLowerCase())
    );
    score *= matches ? 1.0 : 0.4;
  }

  // Price level
  if (prefs.maxPriceLevel) {
    checks++;
    score *= r.price_level <= prefs.maxPriceLevel ? 1.0 : 0.2;
  }

  // Rating bonus (not a filter, just a preference signal)
  if (r.rating !== null) {
    score = score * 0.85 + (r.rating / 5) * 0.15;
  }

  return Math.min(1, Math.max(0, score));
}

function computeFinalScore(components: ScoreComponents, weights: ScoreWeights): number {
  const total =
    weights.detourEfficiency     * components.detourEfficiency     +
    weights.directionSuitability * components.directionSuitability +
    weights.accessibility        * components.accessibility        +
    weights.timeSuitability      * components.timeSuitability      +
    weights.preferenceMatch      * components.preferenceMatch;

  return Math.round(Math.min(100, Math.max(0, total * 100)));
}

// ── Human-readable reasons ─────────────────────────────────────────────────────

function buildReasons(
  proj: ProjectionResult,
  detour: DetourInfo,
  backward: { hasBackwardTravel: boolean; backtrackDistanceMetres: number },
  access: ReturnType<typeof classifyAccessibility>,
  eta: ReturnType<typeof computeEta>,
  score: number
): string[] {
  const reasons: string[] = [];
  const detourKm = (detour.detourDistanceMetres / 1000).toFixed(1);
  const detourMin = Math.ceil(detour.detourDurationSeconds / 60);

  if (detour.detourDistanceMetres < 500) {
    reasons.push(`Virtually no detour — just ${Math.round(detour.detourDistanceMetres)} m off route`);
  } else {
    reasons.push(`+${detourKm} km · +${detourMin} min extra driving`);
  }

  if (proj.perpendicularDistance < 50) {
    reasons.push('Right beside the highway');
  } else {
    reasons.push(`${Math.round(proj.perpendicularDistance)} m from route`);
  }

  reasons.push(eta.availabilityLabel);
  reasons.push(access.label);

  if (backward.hasBackwardTravel) {
    reasons.push(`⚠ Requires ~${Math.round(backward.backtrackDistanceMetres)} m backtrack`);
  }

  return reasons;
}

// ── Geometry helpers ───────────────────────────────────────────────────────────

function findExitPoint(
  targetPosition: number,
  geometry: Coordinate[],
  segments: ReturnType<typeof buildRouteSegments>
): Coordinate {
  for (const seg of segments) {
    if (seg.cumulativeEnd >= targetPosition) {
      const fraction = (targetPosition - seg.cumulativeStart) / seg.length;
      return {
        lat: seg.start.lat + fraction * (seg.end.lat - seg.start.lat),
        lng: seg.start.lng + fraction * (seg.end.lng - seg.start.lng),
      };
    }
  }
  return geometry[geometry.length - 1];
}

function findPositionOnRoute(
  point: Coordinate,
  segments: ReturnType<typeof buildRouteSegments>
): number {
  const result = findNearestSegment(point, segments);
  return result.routePosition;
}

async function computeDetour(
  entryPoint: Coordinate,
  restaurant: Coordinate,
  exitPoint: Coordinate,
  speedKmh: number
): Promise<DetourInfo> {
  try {
    const result = await fetchOsrmDetour(entryPoint, restaurant, exitPoint);
    if (result) return result;
  } catch { /* fall through */ }

  // Fallback estimate
  const toRest = haversineDistance(entryPoint, restaurant);
  const fromRest = haversineDistance(restaurant, exitPoint);
  const direct = haversineDistance(entryPoint, exitPoint);
  const detourDist = Math.max(0, toRest + fromRest - direct);

  return {
    detourDistanceMetres: detourDist + toRest * 2,
    detourDurationSeconds: estimateDuration(detourDist + toRest * 2, speedKmh),
    detourSource: 'estimated',
  };
}
