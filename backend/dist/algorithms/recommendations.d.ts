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
import { Restaurant, RouteResponse, RecommendationCandidate, ScoreWeights, UserPreferences } from '../types/index.js';
import { RuleEvaluation, RejectionAnalytics } from './ruleEngine.js';
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
export interface RecommendationResult {
    candidates: RecommendationCandidate[];
    allEvaluations: RuleEvaluation[];
    analytics: RejectionAnalytics;
}
export declare function computeRecommendations(restaurants: Restaurant[], route: RouteResponse, opts?: Partial<RecommendationOptions>): Promise<RecommendationCandidate[]>;
export declare function computeRecommendationsV2(restaurants: Restaurant[], route: RouteResponse, opts?: Partial<RecommendationOptions>): Promise<RecommendationResult>;
//# sourceMappingURL=recommendations.d.ts.map