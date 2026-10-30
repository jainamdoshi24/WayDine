/**
 * Accessibility classifier.
 *
 * Determines whether a restaurant is accessible from the travel direction
 * using signed cross-track geometry and available entrance data.
 *
 * Signed cross-track: +ve = right of travel, -ve = left.
 * For a road driven in a given direction:
 *   - right-hand side is generally accessible without crossing.
 *   - left-hand side may require a U-turn or crossing.
 *
 * Where entrance coordinates or road-access metadata are present, these
 * are used to refine the classification. Otherwise "uncertain" is returned.
 */
import { AccessibilityInfo, Restaurant } from '../types/index.js';
/**
 * Classify accessibility for a restaurant.
 *
 * @param signedCrossTrack  Signed cross-track metres (+right, -left).
 * @param perpendicularDist Absolute perpendicular distance in metres.
 * @param restaurant        Full restaurant record (may have entrance coords).
 * @param strict            In strict mode, "uncertain" fails eligibility.
 */
export declare function classifyAccessibility(signedCrossTrack: number, perpendicularDist: number, restaurant: Restaurant, strict?: boolean): AccessibilityInfo;
/**
 * Accessibility score component (0–1).
 * confirmed_same_side → 1.0
 * uncertain, roadside  → 0.6
 * uncertain            → 0.35
 * opposite_side        → 0.1
 */
export declare function accessibilityScore(info: AccessibilityInfo): number;
//# sourceMappingURL=accessibility.d.ts.map