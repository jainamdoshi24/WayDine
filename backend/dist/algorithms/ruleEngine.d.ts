/**
 * WayDine — Explainable Rejection Engine (Phase 4).
 *
 * Evaluates each candidate against deterministic named rules.
 * Hard constraints are NEVER overridden by a high score.
 * ALL independent rules are evaluated (not stopped at first failure).
 * Dependent checks are marked 'not_evaluated' when prerequisites fail.
 *
 * Evaluation order:
 *  1. Data validity
 *  2. Route corridor (perpendicular distance ≤ 200 m)
 *  3. Route direction / backward travel
 *  4. Road access / crossing / U-turn
 *  5. Detour distance and time budget
 *  6. ETA / opening hours / meal availability
 *  7. Dietary, cuisine, price preferences
 */
import { Restaurant, AccessibilityInfo, BackwardTravelInfo, DetourInfo, EtaInfo, UserPreferences } from '../types/index.js';
export declare const RULE_IDS: {
    readonly INVALID_COORDINATES: "INVALID_COORDINATES";
    readonly OUTSIDE_ROUTE_CORRIDOR: "OUTSIDE_ROUTE_CORRIDOR";
    readonly BEHIND_CURRENT_POSITION: "BEHIND_CURRENT_POSITION";
    readonly EXCESSIVE_BACKWARD_TRAVEL: "EXCESSIVE_BACKWARD_TRAVEL";
    readonly ACCESS_UNVERIFIED: "ACCESS_UNVERIFIED";
    readonly OPPOSITE_CARRIAGEWAY: "OPPOSITE_CARRIAGEWAY";
    readonly U_TURN_REQUIRED: "U_TURN_REQUIRED";
    readonly ROAD_RESTRICTION: "ROAD_RESTRICTION";
    readonly DISTANCE_BUDGET_EXCEEDED: "DISTANCE_BUDGET_EXCEEDED";
    readonly TIME_BUDGET_EXCEEDED: "TIME_BUDGET_EXCEEDED";
    readonly RESTAURANT_CLOSED_AT_ETA: "RESTAURANT_CLOSED_AT_ETA";
    readonly MEAL_UNAVAILABLE: "MEAL_UNAVAILABLE";
    readonly PREFERENCE_MISMATCH: "PREFERENCE_MISMATCH";
    readonly PRICE_CONSTRAINT_EXCEEDED: "PRICE_CONSTRAINT_EXCEEDED";
    readonly STALE_RESTAURANT_DATA: "STALE_RESTAURANT_DATA";
    readonly INSUFFICIENT_ROUTE_DATA: "INSUFFICIENT_ROUTE_DATA";
};
export type RuleId = typeof RULE_IDS[keyof typeof RULE_IDS];
export type RuleStatus = 'passed' | 'failed' | 'warning' | 'not_evaluated';
export interface RuleResult {
    ruleId: RuleId;
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
    passedRules: RuleId[];
    failedRules: RuleId[];
    warningRules: RuleId[];
    missingData: string[];
    finalStatus: FinalStatus;
    score: number | null;
    budgetUtilization: BudgetUtilization | null;
    explanation: string;
}
export interface EvaluationContext {
    restaurant: Restaurant;
    perpendicularDistance: number;
    routePosition: number;
    totalRouteDistance: number;
    signedCrossTrack: number;
    detour: DetourInfo | null;
    backward: BackwardTravelInfo | null;
    accessibility: AccessibilityInfo | null;
    eta: EtaInfo | null;
    preferences: UserPreferences;
    maxPerpendicularMetres: number;
    maxDetourMetres: number;
    maxDetourTimeSeconds: number;
    score: number | null;
}
export declare function evaluateCandidate(ctx: EvaluationContext): RuleEvaluation;
export interface RejectionAnalytics {
    totalEvaluated: number;
    recommended: number;
    eligible: number;
    rejected: number;
    needsVerification: number;
    rejectionsByRule: Partial<Record<RuleId, number>>;
}
export declare function computeAnalytics(evaluations: RuleEvaluation[]): RejectionAnalytics;
//# sourceMappingURL=ruleEngine.d.ts.map