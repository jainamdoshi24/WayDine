"use strict";
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.RULE_IDS = void 0;
exports.evaluateCandidate = evaluateCandidate;
exports.computeAnalytics = computeAnalytics;
// ── Rule identifiers ──────────────────────────────────────────────────────────
exports.RULE_IDS = {
    INVALID_COORDINATES: 'INVALID_COORDINATES',
    OUTSIDE_ROUTE_CORRIDOR: 'OUTSIDE_ROUTE_CORRIDOR',
    BEHIND_CURRENT_POSITION: 'BEHIND_CURRENT_POSITION',
    EXCESSIVE_BACKWARD_TRAVEL: 'EXCESSIVE_BACKWARD_TRAVEL',
    ACCESS_UNVERIFIED: 'ACCESS_UNVERIFIED',
    OPPOSITE_CARRIAGEWAY: 'OPPOSITE_CARRIAGEWAY',
    U_TURN_REQUIRED: 'U_TURN_REQUIRED',
    ROAD_RESTRICTION: 'ROAD_RESTRICTION',
    DISTANCE_BUDGET_EXCEEDED: 'DISTANCE_BUDGET_EXCEEDED',
    TIME_BUDGET_EXCEEDED: 'TIME_BUDGET_EXCEEDED',
    RESTAURANT_CLOSED_AT_ETA: 'RESTAURANT_CLOSED_AT_ETA',
    MEAL_UNAVAILABLE: 'MEAL_UNAVAILABLE',
    PREFERENCE_MISMATCH: 'PREFERENCE_MISMATCH',
    PRICE_CONSTRAINT_EXCEEDED: 'PRICE_CONSTRAINT_EXCEEDED',
    STALE_RESTAURANT_DATA: 'STALE_RESTAURANT_DATA',
    INSUFFICIENT_ROUTE_DATA: 'INSUFFICIENT_ROUTE_DATA',
};
// ── Main evaluator ─────────────────────────────────────────────────────────────
function evaluateCandidate(ctx) {
    const rules = [];
    const missingData = [];
    // ── 1. Data validity ────────────────────────────────────────────────────────
    const coordsValid = isFinite(ctx.restaurant.latitude) &&
        isFinite(ctx.restaurant.longitude) &&
        ctx.restaurant.latitude >= -90 && ctx.restaurant.latitude <= 90 &&
        ctx.restaurant.longitude >= -180 && ctx.restaurant.longitude <= 180;
    rules.push({
        ruleId: exports.RULE_IDS.INVALID_COORDINATES,
        status: coordsValid ? 'passed' : 'failed',
        label: 'Valid coordinates',
        reason: coordsValid ? undefined : 'Restaurant has invalid or missing GPS coordinates',
    });
    // Data freshness — warn if verified > 1 year ago
    const verifiedAt = ctx.restaurant.verified_at ? new Date(ctx.restaurant.verified_at) : null;
    const dataAgeMs = verifiedAt ? Date.now() - verifiedAt.getTime() : null;
    const isStale = dataAgeMs !== null && dataAgeMs > 365 * 24 * 3_600_000;
    rules.push({
        ruleId: exports.RULE_IDS.STALE_RESTAURANT_DATA,
        status: isStale ? 'warning' : 'passed',
        label: 'Data freshness',
        reason: isStale
            ? `Data last verified ${Math.round(dataAgeMs / (30 * 24 * 3_600_000))} months ago`
            : undefined,
    });
    // Short-circuit remaining rules if coords are invalid
    if (!coordsValid) {
        const remaining = [
            exports.RULE_IDS.OUTSIDE_ROUTE_CORRIDOR, exports.RULE_IDS.BEHIND_CURRENT_POSITION,
            exports.RULE_IDS.EXCESSIVE_BACKWARD_TRAVEL, exports.RULE_IDS.ACCESS_UNVERIFIED,
            exports.RULE_IDS.OPPOSITE_CARRIAGEWAY, exports.RULE_IDS.U_TURN_REQUIRED,
            exports.RULE_IDS.ROAD_RESTRICTION, exports.RULE_IDS.DISTANCE_BUDGET_EXCEEDED,
            exports.RULE_IDS.TIME_BUDGET_EXCEEDED, exports.RULE_IDS.RESTAURANT_CLOSED_AT_ETA,
            exports.RULE_IDS.MEAL_UNAVAILABLE, exports.RULE_IDS.PREFERENCE_MISMATCH,
            exports.RULE_IDS.PRICE_CONSTRAINT_EXCEEDED, exports.RULE_IDS.INSUFFICIENT_ROUTE_DATA,
        ];
        for (const ruleId of remaining) {
            rules.push({ ruleId, status: 'not_evaluated', label: ruleIdLabel(ruleId) });
        }
        return buildResult(ctx.restaurant, rules, missingData, null, null);
    }
    // ── 2. Route corridor ───────────────────────────────────────────────────────
    const withinCorridor = ctx.perpendicularDistance <= ctx.maxPerpendicularMetres;
    rules.push({
        ruleId: exports.RULE_IDS.OUTSIDE_ROUTE_CORRIDOR,
        status: withinCorridor ? 'passed' : 'failed',
        label: `Within ${ctx.maxPerpendicularMetres} m of route`,
        actualValue: Math.round(ctx.perpendicularDistance),
        allowedValue: ctx.maxPerpendicularMetres,
        reason: withinCorridor
            ? undefined
            : `${Math.round(ctx.perpendicularDistance)} m from route (limit: ${ctx.maxPerpendicularMetres} m)`,
    });
    // Route data sufficiency
    const hasRouteData = ctx.totalRouteDistance > 0 && isFinite(ctx.routePosition);
    rules.push({
        ruleId: exports.RULE_IDS.INSUFFICIENT_ROUTE_DATA,
        status: hasRouteData ? 'passed' : 'warning',
        label: 'Route data sufficient',
        reason: hasRouteData ? undefined : 'Route geometry insufficient for position analysis',
    });
    if (!hasRouteData)
        missingData.push('Route geometry');
    // ── 3. Route direction ──────────────────────────────────────────────────────
    const behindRoute = ctx.routePosition < 0;
    rules.push({
        ruleId: exports.RULE_IDS.BEHIND_CURRENT_POSITION,
        status: behindRoute ? 'failed' : 'passed',
        label: 'Ahead on route',
        reason: behindRoute ? 'Restaurant is behind the route start position' : undefined,
    });
    if (ctx.backward !== null) {
        const excessiveBackward = ctx.backward.hasBackwardTravel && ctx.backward.backtrackDistanceMetres > 1000;
        rules.push({
            ruleId: exports.RULE_IDS.EXCESSIVE_BACKWARD_TRAVEL,
            status: excessiveBackward ? 'failed'
                : ctx.backward.hasBackwardTravel ? 'warning'
                    : 'passed',
            label: 'No excessive backtrack',
            actualValue: Math.round(ctx.backward.backtrackDistanceMetres),
            allowedValue: 1000,
            reason: excessiveBackward
                ? `Requires ${Math.round(ctx.backward.backtrackDistanceMetres)} m backtrack`
                : ctx.backward.hasBackwardTravel
                    ? `Minor backtrack of ~${Math.round(ctx.backward.backtrackDistanceMetres)} m`
                    : undefined,
        });
    }
    else {
        rules.push({
            ruleId: exports.RULE_IDS.EXCESSIVE_BACKWARD_TRAVEL,
            status: 'not_evaluated',
            label: 'Backward travel check',
        });
        missingData.push('Backward travel data');
    }
    // ── 4. Road access ──────────────────────────────────────────────────────────
    if (ctx.accessibility !== null) {
        const { status: accStatus, requiresCrossing } = ctx.accessibility;
        // U-turn: only infer from explicit highway_access notes — NEVER from geometry alone
        const accessNote = ctx.restaurant.highway_access?.toLowerCase() ?? '';
        const uTurnRequired = requiresCrossing && accStatus === 'opposite_side'
            && accessNote.includes('u-turn');
        rules.push({
            ruleId: exports.RULE_IDS.U_TURN_REQUIRED,
            status: uTurnRequired ? 'failed' : 'passed',
            label: 'No U-turn required',
            reason: uTurnRequired ? 'Highway access notes indicate U-turn is required' : undefined,
        });
        // Opposite carriageway — a warning (not a hard fail by itself)
        const oppositeCarriageway = accStatus === 'opposite_side';
        rules.push({
            ruleId: exports.RULE_IDS.OPPOSITE_CARRIAGEWAY,
            status: oppositeCarriageway ? 'warning' : 'passed',
            label: 'Same-side carriageway',
            reason: oppositeCarriageway
                ? 'Restaurant appears to be on the opposite carriageway — crossing may be required'
                : undefined,
        });
        // Access unverified
        const accessUnverified = accStatus === 'uncertain';
        rules.push({
            ruleId: exports.RULE_IDS.ACCESS_UNVERIFIED,
            status: accessUnverified ? 'warning' : 'passed',
            label: 'Road access verified',
            reason: accessUnverified
                ? 'Road accessibility could not be confirmed from available data'
                : undefined,
        });
        if (accessUnverified)
            missingData.push('Confirmed road access');
        // Road restriction from highway_access text
        const restrictionKeywords = ['restricted', 'no entry', 'closed', 'toll only', 'permit required'];
        const hasRestriction = restrictionKeywords.some(kw => accessNote.includes(kw));
        rules.push({
            ruleId: exports.RULE_IDS.ROAD_RESTRICTION,
            status: hasRestriction ? 'failed' : 'passed',
            label: 'No access restrictions',
            reason: hasRestriction
                ? `Access note indicates restriction: "${ctx.restaurant.highway_access}"`
                : undefined,
        });
    }
    else {
        for (const ruleId of [
            exports.RULE_IDS.U_TURN_REQUIRED, exports.RULE_IDS.OPPOSITE_CARRIAGEWAY,
            exports.RULE_IDS.ACCESS_UNVERIFIED, exports.RULE_IDS.ROAD_RESTRICTION,
        ]) {
            rules.push({ ruleId, status: 'not_evaluated', label: ruleIdLabel(ruleId) });
        }
        missingData.push('Accessibility data');
    }
    // ── 5. Detour budget ────────────────────────────────────────────────────────
    let budgetUtilization = null;
    if (ctx.detour !== null) {
        const distLimit = isFinite(ctx.maxDetourMetres) ? ctx.maxDetourMetres : null;
        const timeLimit = isFinite(ctx.maxDetourTimeSeconds) ? ctx.maxDetourTimeSeconds : null;
        const distExceeded = distLimit !== null && ctx.detour.detourDistanceMetres > distLimit;
        const distPct = distLimit !== null && distLimit > 0
            ? Math.round((ctx.detour.detourDistanceMetres / distLimit) * 100)
            : null;
        rules.push({
            ruleId: exports.RULE_IDS.DISTANCE_BUDGET_EXCEEDED,
            status: distExceeded ? 'failed' : 'passed',
            label: 'Within distance budget',
            actualValue: Math.round(ctx.detour.detourDistanceMetres),
            allowedValue: distLimit ?? '∞',
            reason: distExceeded
                ? `Extra distance ${(ctx.detour.detourDistanceMetres / 1000).toFixed(1)} km exceeds limit of ${((distLimit ?? 0) / 1000).toFixed(1)} km`
                : undefined,
        });
        const timeExceeded = timeLimit !== null && ctx.detour.detourDurationSeconds > timeLimit;
        const timePct = timeLimit !== null && timeLimit > 0
            ? Math.round((ctx.detour.detourDurationSeconds / timeLimit) * 100)
            : null;
        rules.push({
            ruleId: exports.RULE_IDS.TIME_BUDGET_EXCEEDED,
            status: timeExceeded ? 'failed' : 'passed',
            label: 'Within time budget',
            actualValue: Math.round(ctx.detour.detourDurationSeconds / 60),
            allowedValue: timeLimit !== null ? Math.round(timeLimit / 60) : '∞',
            reason: timeExceeded
                ? `Extra time ${Math.ceil(ctx.detour.detourDurationSeconds / 60)} min exceeds limit of ${Math.ceil((timeLimit ?? 0) / 60)} min`
                : undefined,
        });
        budgetUtilization = {
            distanceActualMetres: ctx.detour.detourDistanceMetres,
            distanceLimitMetres: distLimit ?? Infinity,
            distancePct: distPct,
            timeActualSeconds: ctx.detour.detourDurationSeconds,
            timeLimitSeconds: timeLimit ?? Infinity,
            timePct: timePct,
        };
    }
    else {
        rules.push({ ruleId: exports.RULE_IDS.DISTANCE_BUDGET_EXCEEDED, status: 'not_evaluated', label: 'Distance budget' }, { ruleId: exports.RULE_IDS.TIME_BUDGET_EXCEEDED, status: 'not_evaluated', label: 'Time budget' });
        missingData.push('Detour data');
    }
    // ── 6. ETA / opening hours / meal ──────────────────────────────────────────
    if (ctx.eta !== null) {
        const closedAtEta = ctx.eta.isOpenAtEta === false;
        rules.push({
            ruleId: exports.RULE_IDS.RESTAURANT_CLOSED_AT_ETA,
            status: closedAtEta ? 'failed'
                : ctx.eta.isOpenAtEta === null ? 'warning'
                    : 'passed',
            label: 'Open at estimated arrival',
            reason: closedAtEta
                ? `Restaurant will be closed at estimated arrival (${ctx.eta.etaFormatted})`
                : ctx.eta.isOpenAtEta === null
                    ? 'Opening hours not available — cannot verify'
                    : ctx.eta.closingWarning
                        ? `Closes within 30 min of arrival (${ctx.eta.etaFormatted})`
                        : undefined,
        });
        if (ctx.eta.isOpenAtEta === null)
            missingData.push('Opening hours');
        const meal = ctx.preferences.meal && ctx.preferences.meal !== 'any'
            ? ctx.preferences.meal : null;
        if (meal) {
            const fa = ctx.restaurant.food_availability;
            const mealAvail = fa[meal] === true;
            rules.push({
                ruleId: exports.RULE_IDS.MEAL_UNAVAILABLE,
                status: mealAvail ? 'passed' : 'failed',
                label: `${meal.charAt(0).toUpperCase() + meal.slice(1)} available`,
                reason: mealAvail ? undefined : `${meal} is not served at this restaurant`,
            });
        }
        else {
            rules.push({ ruleId: exports.RULE_IDS.MEAL_UNAVAILABLE, status: 'passed', label: 'Meal availability (any)' });
        }
    }
    else {
        rules.push({ ruleId: exports.RULE_IDS.RESTAURANT_CLOSED_AT_ETA, status: 'not_evaluated', label: 'Open at arrival' }, { ruleId: exports.RULE_IDS.MEAL_UNAVAILABLE, status: 'not_evaluated', label: 'Meal availability' });
        missingData.push('ETA data');
    }
    // ── 7. Preferences ──────────────────────────────────────────────────────────
    const r = ctx.restaurant;
    const prefs = ctx.preferences;
    const vegRequired = prefs.vegetarianOnly === true;
    const vegOk = !vegRequired || r.is_vegetarian || r.has_vegetarian_options;
    rules.push({
        ruleId: exports.RULE_IDS.PREFERENCE_MISMATCH,
        status: vegOk ? 'passed' : 'failed',
        label: 'Dietary preference',
        reason: vegOk ? undefined : 'Vegetarian filter active — restaurant has no vegetarian options',
    });
    const maxPrice = prefs.maxPriceLevel;
    const priceOk = !maxPrice || r.price_level <= maxPrice;
    rules.push({
        ruleId: exports.RULE_IDS.PRICE_CONSTRAINT_EXCEEDED,
        status: priceOk ? 'passed' : 'failed',
        label: 'Price constraint',
        actualValue: r.price_level,
        allowedValue: maxPrice ?? 4,
        reason: priceOk ? undefined : `Price level ${r.price_level} exceeds limit of ${maxPrice}`,
    });
    return buildResult(ctx.restaurant, rules, missingData, ctx.score, budgetUtilization);
}
// ── Build final evaluation result ─────────────────────────────────────────────
function buildResult(restaurant, rules, missingData, score, budgetUtilization) {
    const failedRules = rules.filter(r => r.status === 'failed').map(r => r.ruleId);
    const passedRules = rules.filter(r => r.status === 'passed').map(r => r.ruleId);
    const warningRules = rules.filter(r => r.status === 'warning').map(r => r.ruleId);
    let finalStatus;
    let explanation;
    if (failedRules.length === 0 && warningRules.length === 0) {
        finalStatus = score !== null && score >= 70 ? 'recommended' : 'eligible';
        explanation = finalStatus === 'recommended'
            ? `Strong match — passes all rules with score ${score}/100`
            : `Eligible stop — passes all mandatory rules`;
    }
    else if (failedRules.length > 0) {
        finalStatus = 'rejected';
        const failRule = rules.find(r => r.ruleId === failedRules[0]);
        explanation = `Rejected: ${failRule?.reason ?? failedRules[0]}`;
        if (failedRules.length > 1) {
            explanation += ` (+${failedRules.length - 1} more issue${failedRules.length > 2 ? 's' : ''})`;
        }
    }
    else {
        finalStatus = 'needs_verification';
        const warnRule = rules.find(r => r.ruleId === warningRules[0]);
        explanation = `Needs verification: ${warnRule?.reason ?? warningRules[0]}`;
    }
    return {
        restaurantId: restaurant.id,
        restaurantName: restaurant.name,
        rules,
        passedRules,
        failedRules,
        warningRules,
        missingData,
        finalStatus,
        score,
        budgetUtilization,
        explanation,
    };
}
function ruleIdLabel(ruleId) {
    const labels = {
        INVALID_COORDINATES: 'Valid coordinates',
        OUTSIDE_ROUTE_CORRIDOR: 'Within route corridor',
        BEHIND_CURRENT_POSITION: 'Ahead on route',
        EXCESSIVE_BACKWARD_TRAVEL: 'No excessive backtrack',
        ACCESS_UNVERIFIED: 'Road access verified',
        OPPOSITE_CARRIAGEWAY: 'Same-side carriageway',
        U_TURN_REQUIRED: 'No U-turn required',
        ROAD_RESTRICTION: 'No road restrictions',
        DISTANCE_BUDGET_EXCEEDED: 'Within distance budget',
        TIME_BUDGET_EXCEEDED: 'Within time budget',
        RESTAURANT_CLOSED_AT_ETA: 'Open at arrival',
        MEAL_UNAVAILABLE: 'Meal available',
        PREFERENCE_MISMATCH: 'Dietary preference',
        PRICE_CONSTRAINT_EXCEEDED: 'Price constraint',
        STALE_RESTAURANT_DATA: 'Data freshness',
        INSUFFICIENT_ROUTE_DATA: 'Route data sufficient',
    };
    return labels[ruleId] ?? ruleId;
}
function computeAnalytics(evaluations) {
    const analytics = {
        totalEvaluated: evaluations.length,
        recommended: 0,
        eligible: 0,
        rejected: 0,
        needsVerification: 0,
        rejectionsByRule: {},
    };
    for (const ev of evaluations) {
        switch (ev.finalStatus) {
            case 'recommended':
                analytics.recommended++;
                break;
            case 'eligible':
                analytics.eligible++;
                break;
            case 'rejected':
                analytics.rejected++;
                break;
            case 'needs_verification':
                analytics.needsVerification++;
                break;
        }
        for (const ruleId of ev.failedRules) {
            analytics.rejectionsByRule[ruleId] = (analytics.rejectionsByRule[ruleId] ?? 0) + 1;
        }
    }
    return analytics;
}
//# sourceMappingURL=ruleEngine.js.map