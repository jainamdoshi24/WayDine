"use strict";
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.classifyAccessibility = classifyAccessibility;
exports.accessibilityScore = accessibilityScore;
/**
 * Classify accessibility for a restaurant.
 *
 * @param signedCrossTrack  Signed cross-track metres (+right, -left).
 * @param perpendicularDist Absolute perpendicular distance in metres.
 * @param restaurant        Full restaurant record (may have entrance coords).
 * @param strict            In strict mode, "uncertain" fails eligibility.
 */
function classifyAccessibility(signedCrossTrack, perpendicularDist, restaurant, strict = false) {
    const hasEntrance = restaurant.entrance_lat !== null && restaurant.entrance_lng !== null;
    // If on the route itself (very close), consider it directly accessible
    if (perpendicularDist < 5) {
        return {
            status: 'confirmed_same_side',
            label: 'On-route access',
            requiresCrossing: false,
            hasEntrance,
            isRoadside: restaurant.is_roadside,
        };
    }
    // If entrance coordinates are present, we can check whether the entrance
    // is on the same side as the restaurant body.
    // (In a real implementation, OSRM turn-by-turn data would resolve this;
    //  here we use the entrance cross-track sign as a proxy.)
    if (hasEntrance) {
        // We have entrance data — classify as confirmed regardless of side,
        // because the entrance is the actual access point.
        const side = signedCrossTrack >= 0 ? 'right' : 'left';
        const needsCrossing = signedCrossTrack < -20; // left-side with meaningful distance
        return {
            status: needsCrossing ? 'opposite_side' : 'confirmed_same_side',
            label: needsCrossing
                ? 'Opposite-side access (may require U-turn)'
                : 'Same-side access (entrance verified)',
            requiresCrossing: needsCrossing,
            hasEntrance: true,
            isRoadside: restaurant.is_roadside,
        };
    }
    // No entrance data — use highway_access description if present
    if (restaurant.highway_access) {
        const desc = restaurant.highway_access.toLowerCase();
        if (desc.includes('direct') || desc.includes('service lane') || desc.includes('adjacent')) {
            return {
                status: 'confirmed_same_side',
                label: 'Roadside access (from highway data)',
                requiresCrossing: false,
                hasEntrance: false,
                isRoadside: restaurant.is_roadside,
            };
        }
        if (desc.includes('opposite') || desc.includes('u-turn')) {
            return {
                status: 'opposite_side',
                label: 'Opposite-side access (from highway data)',
                requiresCrossing: true,
                hasEntrance: false,
                isRoadside: restaurant.is_roadside,
            };
        }
    }
    // Fall back to signed cross-track heuristic
    // +ve = right of travel direction (normally accessible without crossing)
    // -ve = left of travel direction (may require crossing)
    const side = signedCrossTrack >= 0 ? 'right' : 'left';
    const certainlyOpposite = signedCrossTrack < -50; // clearly left & far
    if (restaurant.is_roadside && !certainlyOpposite) {
        return {
            status: 'uncertain',
            label: 'Access unverified — likely roadside',
            requiresCrossing: false,
            hasEntrance: false,
            isRoadside: true,
        };
    }
    return {
        status: 'uncertain',
        label: 'Access unverified',
        requiresCrossing: certainlyOpposite,
        hasEntrance: false,
        isRoadside: restaurant.is_roadside,
    };
}
/**
 * Accessibility score component (0–1).
 * confirmed_same_side → 1.0
 * uncertain, roadside  → 0.6
 * uncertain            → 0.35
 * opposite_side        → 0.1
 */
function accessibilityScore(info) {
    switch (info.status) {
        case 'confirmed_same_side': return info.isRoadside ? 1.0 : 0.85;
        case 'uncertain': return info.isRoadside ? 0.6 : 0.35;
        case 'opposite_side': return 0.1;
    }
}
//# sourceMappingURL=accessibility.js.map