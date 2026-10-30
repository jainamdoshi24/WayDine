/**
 * Tests for the Explainable Rejection Engine (ruleEngine.ts).
 */

import { describe, it, expect } from 'vitest';
import {
  evaluateCandidate,
  computeAnalytics,
  RULE_IDS,
  EvaluationContext,
  RuleEvaluation,
} from '../src/algorithms/ruleEngine.js';
import type { Restaurant, DetourInfo, AccessibilityInfo, BackwardTravelInfo, EtaInfo } from '../src/types/index.js';

// ── Fixtures ────────────────────────────────────────────────────────────────

const BASE_RESTAURANT: Restaurant = {
  id: 1,
  name: 'Test Dhaba',
  address: 'NH48, Test',
  latitude: 18.78,
  longitude: 73.34,
  entrance_lat: null,
  entrance_lng: null,
  cuisine: 'North Indian',
  price_level: 2,
  is_vegetarian: false,
  has_vegetarian_options: true,
  is_roadside: true,
  highway_access: 'NH48 direct access',
  rating: 4.2,
  review_count: 100,
  phone: null,
  website: null,
  image_url: null,
  data_source: 'test',
  is_demo: true,
  verified_at: new Date().toISOString(),
  created_at: new Date().toISOString(),
  opening_hours: {
    mon: '06:00-23:00', tue: '06:00-23:00', wed: '06:00-23:00',
    thu: '06:00-23:00', fri: '06:00-23:00', sat: '06:00-23:00', sun: '06:00-23:00',
  },
  food_availability: { breakfast: true, lunch: true, dinner: true, snacks: true },
};

const BASE_DETOUR: DetourInfo = {
  detourDistanceMetres: 800,
  detourDurationSeconds: 120,
  detourSource: 'osrm',
};

const BASE_ACCESS: AccessibilityInfo = {
  status: 'confirmed_same_side',
  label: 'Same-side access confirmed',
  requiresCrossing: false,
  hasEntrance: false,
  isRoadside: true,
};

const BASE_BACKWARD: BackwardTravelInfo = {
  hasBackwardTravel: false,
  backtrackDistanceMetres: 0,
};

const BASE_ETA: EtaInfo = {
  eta: new Date(Date.now() + 3600_000).toISOString(),
  etaFormatted: '01:00 PM',
  mealAvailable: 'lunch',
  isOpenAtEta: true,
  closingWarning: false,
  availabilityLabel: 'Lunch available',
};

function makeCtx(overrides: Partial<EvaluationContext> = {}): EvaluationContext {
  return {
    restaurant:             BASE_RESTAURANT,
    perpendicularDistance:  80,
    routePosition:          5000,
    totalRouteDistance:     50000,
    signedCrossTrack:       80,
    detour:                 BASE_DETOUR,
    backward:               BASE_BACKWARD,
    accessibility:          BASE_ACCESS,
    eta:                    BASE_ETA,
    preferences:            { meal: 'any' },
    maxPerpendicularMetres: 200,
    maxDetourMetres:        5000,
    maxDetourTimeSeconds:   1200,
    score:                  78,
    ...overrides,
  };
}

// ── Tests ────────────────────────────────────────────────────────────────────

describe('Rule Engine — happy path', () => {
  it('passes all rules for a perfect candidate', () => {
    const result = evaluateCandidate(makeCtx());
    expect(result.failedRules).toHaveLength(0);
    expect(result.finalStatus).toBe('recommended');
    expect(result.score).toBe(78);
  });

  it('marks as eligible (not recommended) when score < 70', () => {
    const result = evaluateCandidate(makeCtx({ score: 65 }));
    expect(result.failedRules).toHaveLength(0);
    expect(result.finalStatus).toBe('eligible');
  });
});

describe('Rule Engine — data validity', () => {
  it('fails INVALID_COORDINATES for NaN latitude', () => {
    const r = evaluateCandidate(makeCtx({
      restaurant: { ...BASE_RESTAURANT, latitude: NaN },
    }));
    expect(r.failedRules).toContain(RULE_IDS.INVALID_COORDINATES);
    expect(r.finalStatus).toBe('rejected');
  });

  it('fails INVALID_COORDINATES for out-of-range longitude', () => {
    const r = evaluateCandidate(makeCtx({
      restaurant: { ...BASE_RESTAURANT, longitude: 999 },
    }));
    expect(r.failedRules).toContain(RULE_IDS.INVALID_COORDINATES);
  });

  it('warns STALE_RESTAURANT_DATA for old verified_at', () => {
    const oldDate = new Date();
    oldDate.setFullYear(oldDate.getFullYear() - 2);
    const r = evaluateCandidate(makeCtx({
      restaurant: { ...BASE_RESTAURANT, verified_at: oldDate.toISOString() },
    }));
    expect(r.warningRules).toContain(RULE_IDS.STALE_RESTAURANT_DATA);
  });
});

describe('Rule Engine — route corridor', () => {
  it('fails OUTSIDE_ROUTE_CORRIDOR when too far from route', () => {
    const r = evaluateCandidate(makeCtx({ perpendicularDistance: 250 }));
    expect(r.failedRules).toContain(RULE_IDS.OUTSIDE_ROUTE_CORRIDOR);
    expect(r.finalStatus).toBe('rejected');
  });

  it('passes when exactly at corridor limit', () => {
    const r = evaluateCandidate(makeCtx({ perpendicularDistance: 200 }));
    expect(r.failedRules).not.toContain(RULE_IDS.OUTSIDE_ROUTE_CORRIDOR);
  });

  it('warns INSUFFICIENT_ROUTE_DATA when totalRouteDistance is 0', () => {
    const r = evaluateCandidate(makeCtx({ totalRouteDistance: 0 }));
    expect(r.warningRules).toContain(RULE_IDS.INSUFFICIENT_ROUTE_DATA);
  });
});

describe('Rule Engine — backward travel', () => {
  it('warns for minor backtrack', () => {
    const r = evaluateCandidate(makeCtx({
      backward: { hasBackwardTravel: true, backtrackDistanceMetres: 300 },
    }));
    expect(r.warningRules).toContain(RULE_IDS.EXCESSIVE_BACKWARD_TRAVEL);
  });

  it('fails for excessive backtrack > 1000 m', () => {
    const r = evaluateCandidate(makeCtx({
      backward: { hasBackwardTravel: true, backtrackDistanceMetres: 1500 },
    }));
    expect(r.failedRules).toContain(RULE_IDS.EXCESSIVE_BACKWARD_TRAVEL);
  });
});

describe('Rule Engine — road access', () => {
  it('warns ACCESS_UNVERIFIED when uncertain', () => {
    const r = evaluateCandidate(makeCtx({
      accessibility: { ...BASE_ACCESS, status: 'uncertain' },
    }));
    expect(r.warningRules).toContain(RULE_IDS.ACCESS_UNVERIFIED);
    expect(r.finalStatus).toBe('needs_verification');
  });

  it('warns OPPOSITE_CARRIAGEWAY when opposite_side', () => {
    const r = evaluateCandidate(makeCtx({
      accessibility: { ...BASE_ACCESS, status: 'opposite_side', requiresCrossing: true },
    }));
    expect(r.warningRules).toContain(RULE_IDS.OPPOSITE_CARRIAGEWAY);
  });

  it('does NOT infer U_TURN from geometry alone — needs explicit note', () => {
    // opposite_side without "u-turn" in highway_access should not fail U_TURN_REQUIRED
    const r = evaluateCandidate(makeCtx({
      accessibility: { ...BASE_ACCESS, status: 'opposite_side', requiresCrossing: true },
      restaurant: { ...BASE_RESTAURANT, highway_access: 'NH48 left side exit' },
    }));
    expect(r.failedRules).not.toContain(RULE_IDS.U_TURN_REQUIRED);
  });

  it('not_evaluated when accessibility is null', () => {
    const r = evaluateCandidate(makeCtx({ accessibility: null }));
    const accessRule = r.rules.find(x => x.ruleId === RULE_IDS.ACCESS_UNVERIFIED);
    expect(accessRule?.status).toBe('not_evaluated');
  });
});

describe('Rule Engine — detour budget', () => {
  it('fails DISTANCE_BUDGET_EXCEEDED when detour too long', () => {
    const r = evaluateCandidate(makeCtx({
      detour: { ...BASE_DETOUR, detourDistanceMetres: 6000 },
      maxDetourMetres: 5000,
    }));
    expect(r.failedRules).toContain(RULE_IDS.DISTANCE_BUDGET_EXCEEDED);
  });

  it('fails TIME_BUDGET_EXCEEDED when detour time too long', () => {
    const r = evaluateCandidate(makeCtx({
      detour: { ...BASE_DETOUR, detourDurationSeconds: 700 },
      maxDetourTimeSeconds: 600,
    }));
    expect(r.failedRules).toContain(RULE_IDS.TIME_BUDGET_EXCEEDED);
  });

  it('handles zero distance budget gracefully', () => {
    const r = evaluateCandidate(makeCtx({
      detour: { ...BASE_DETOUR, detourDistanceMetres: 10 },
      maxDetourMetres: 0,
    }));
    // 10 > 0, so fails
    expect(r.failedRules).toContain(RULE_IDS.DISTANCE_BUDGET_EXCEEDED);
  });

  it('handles infinite budget (999_999_999) as unlimited', () => {
    const r = evaluateCandidate(makeCtx({
      detour: { ...BASE_DETOUR, detourDistanceMetres: 100000 },
      maxDetourMetres: 999_999_999,
    }));
    expect(r.failedRules).not.toContain(RULE_IDS.DISTANCE_BUDGET_EXCEEDED);
  });

  it('can fail both distance and time simultaneously', () => {
    const r = evaluateCandidate(makeCtx({
      detour: { detourDistanceMetres: 8000, detourDurationSeconds: 900, detourSource: 'osrm' },
      maxDetourMetres: 5000,
      maxDetourTimeSeconds: 600,
    }));
    expect(r.failedRules).toContain(RULE_IDS.DISTANCE_BUDGET_EXCEEDED);
    expect(r.failedRules).toContain(RULE_IDS.TIME_BUDGET_EXCEEDED);
  });

  it('computes budget utilization percentages', () => {
    const r = evaluateCandidate(makeCtx({
      detour: { detourDistanceMetres: 2500, detourDurationSeconds: 300, detourSource: 'osrm' },
      maxDetourMetres: 5000,
      maxDetourTimeSeconds: 600,
    }));
    expect(r.budgetUtilization?.distancePct).toBe(50);
    expect(r.budgetUtilization?.timePct).toBe(50);
  });

  it('marks budget as not_evaluated when detour is null', () => {
    const r = evaluateCandidate(makeCtx({ detour: null }));
    const dist = r.rules.find(x => x.ruleId === RULE_IDS.DISTANCE_BUDGET_EXCEEDED);
    const time = r.rules.find(x => x.ruleId === RULE_IDS.TIME_BUDGET_EXCEEDED);
    expect(dist?.status).toBe('not_evaluated');
    expect(time?.status).toBe('not_evaluated');
  });
});

describe('Rule Engine — ETA and meal', () => {
  it('fails RESTAURANT_CLOSED_AT_ETA when restaurant is closed', () => {
    const r = evaluateCandidate(makeCtx({
      eta: { ...BASE_ETA, isOpenAtEta: false },
    }));
    expect(r.failedRules).toContain(RULE_IDS.RESTAURANT_CLOSED_AT_ETA);
  });

  it('warns when opening hours unknown', () => {
    const r = evaluateCandidate(makeCtx({
      eta: { ...BASE_ETA, isOpenAtEta: null },
    }));
    expect(r.warningRules).toContain(RULE_IDS.RESTAURANT_CLOSED_AT_ETA);
  });

  it('fails MEAL_UNAVAILABLE when meal not served', () => {
    const r = evaluateCandidate(makeCtx({
      preferences: { meal: 'breakfast' },
      restaurant: { ...BASE_RESTAURANT, food_availability: { breakfast: false, lunch: true, dinner: true, snacks: true } },
    }));
    expect(r.failedRules).toContain(RULE_IDS.MEAL_UNAVAILABLE);
  });

  it('passes MEAL_UNAVAILABLE when meal is "any"', () => {
    const r = evaluateCandidate(makeCtx({ preferences: { meal: 'any' } }));
    expect(r.failedRules).not.toContain(RULE_IDS.MEAL_UNAVAILABLE);
  });
});

describe('Rule Engine — preferences', () => {
  it('fails PREFERENCE_MISMATCH when vegetarian filter and no veg options', () => {
    const r = evaluateCandidate(makeCtx({
      preferences: { vegetarianOnly: true },
      restaurant: { ...BASE_RESTAURANT, is_vegetarian: false, has_vegetarian_options: false },
    }));
    expect(r.failedRules).toContain(RULE_IDS.PREFERENCE_MISMATCH);
  });

  it('passes PREFERENCE_MISMATCH when restaurant has veg options', () => {
    const r = evaluateCandidate(makeCtx({
      preferences: { vegetarianOnly: true },
      restaurant: { ...BASE_RESTAURANT, has_vegetarian_options: true },
    }));
    expect(r.failedRules).not.toContain(RULE_IDS.PREFERENCE_MISMATCH);
  });

  it('fails PRICE_CONSTRAINT_EXCEEDED when price level too high', () => {
    const r = evaluateCandidate(makeCtx({
      preferences: { maxPriceLevel: 2 },
      restaurant: { ...BASE_RESTAURANT, price_level: 3 },
    }));
    expect(r.failedRules).toContain(RULE_IDS.PRICE_CONSTRAINT_EXCEEDED);
  });
});

describe('Rule Engine — multiple simultaneous failures', () => {
  it('accumulates multiple failures without stopping at first', () => {
    const r = evaluateCandidate(makeCtx({
      perpendicularDistance: 250,                    // OUTSIDE_ROUTE_CORRIDOR
      detour: { detourDistanceMetres: 9000, detourDurationSeconds: 900, detourSource: 'osrm' },
      maxDetourMetres: 5000,
      maxDetourTimeSeconds: 600,                     // TIME_BUDGET_EXCEEDED + DISTANCE_BUDGET_EXCEEDED
      preferences: { vegetarianOnly: true },
      restaurant: { ...BASE_RESTAURANT, is_vegetarian: false, has_vegetarian_options: false },
    }));
    expect(r.failedRules.length).toBeGreaterThanOrEqual(3);
    expect(r.finalStatus).toBe('rejected');
  });
});

describe('Rule Engine — analytics', () => {
  it('correctly counts recommended, eligible, rejected, needsVerification', () => {
    const evals: RuleEvaluation[] = [
      evaluateCandidate(makeCtx({ score: 80 })),
      evaluateCandidate(makeCtx({ score: 60 })),
      evaluateCandidate(makeCtx({ perpendicularDistance: 300, score: null })),
      evaluateCandidate(makeCtx({ accessibility: { ...BASE_ACCESS, status: 'uncertain' }, score: 70 })),
    ];
    const a = computeAnalytics(evals);
    expect(a.totalEvaluated).toBe(4);
    expect(a.recommended + a.eligible + a.rejected + a.needsVerification).toBe(4);
    expect(a.rejected).toBe(1);
    expect(a.needsVerification).toBe(1);
  });

  it('does not double-count restaurants', () => {
    const evals = [
      evaluateCandidate(makeCtx({ score: 75 })),
      evaluateCandidate(makeCtx({ score: 55 })),
    ];
    const a = computeAnalytics(evals);
    expect(a.recommended + a.eligible + a.rejected + a.needsVerification).toBe(a.totalEvaluated);
  });

  it('counts rejections by rule', () => {
    const evals = [
      evaluateCandidate(makeCtx({ perpendicularDistance: 300 })),
      evaluateCandidate(makeCtx({ perpendicularDistance: 400 })),
    ];
    const a = computeAnalytics(evals);
    expect(a.rejectionsByRule[RULE_IDS.OUTSIDE_ROUTE_CORRIDOR]).toBe(2);
  });
});
