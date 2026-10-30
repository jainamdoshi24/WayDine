"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.recommendationsRouter = void 0;
const express_1 = require("express");
const pool_js_1 = require("../db/pool.js");
const fallback_js_1 = require("../db/fallback.js");
const recommendations_js_1 = require("../algorithms/recommendations.js");
const index_js_1 = require("../types/index.js");
const presets_js_1 = require("../config/presets.js");
exports.recommendationsRouter = (0, express_1.Router)();
/**
 * POST /api/recommendations
 *
 * Body:
 *   {
 *     route: RouteResponse,
 *     preferences?: UserPreferences,
 *   }
 *
 * preferences.detourBudget (optional) overrides maxDetourMetres + maxDetourTimeSeconds.
 */
exports.recommendationsRouter.post('/', async (req, res, next) => {
    try {
        const { route, preferences = {} } = req.body;
        if (!route?.geometry || !Array.isArray(route.geometry) || route.geometry.length < 2) {
            res.status(400).json({ error: 'route.geometry must be an array of ≥ 2 coordinates', code: 'INVALID_ROUTE' });
            return;
        }
        if (typeof route.distance !== 'number' || route.distance <= 0) {
            res.status(400).json({ error: 'route.distance must be a positive number (metres)', code: 'INVALID_ROUTE' });
            return;
        }
        // ── Translate detourBudget → numeric limits ────────────────────────────
        let maxDetourMetres = preferences.maxDetourMetres ?? 5000;
        let maxDetourTimeSeconds = preferences.maxDetourTimeSeconds ?? 1200;
        if (preferences.detourBudget) {
            const budget = preferences.detourBudget;
            // Apply preset defaults if one is specified
            if (budget.preset && budget.preset !== 'custom' && presets_js_1.DETOUR_PRESETS[budget.preset]) {
                const p = presets_js_1.DETOUR_PRESETS[budget.preset];
                if (!budget.maxDistanceKm)
                    budget.maxDistanceKm = p.maxDistanceKm;
                if (!budget.maxTimeMinutes)
                    budget.maxTimeMinutes = p.maxTimeMinutes;
            }
            const limits = (0, presets_js_1.budgetToLimits)({
                maxDistanceKm: budget.maxDistanceKm ?? 5,
                maxTimeMinutes: budget.maxTimeMinutes ?? 10,
                mode: budget.mode ?? 'both',
            });
            maxDetourMetres = limits.maxDetourMetres;
            maxDetourTimeSeconds = limits.maxDetourTimeSeconds;
        }
        // ── Pre-filter in SQL before expensive spatial calculations ─────────────
        const conditions = [];
        const params = [];
        let p = 1;
        if (preferences.vegetarianOnly) {
            conditions.push(`(is_vegetarian = true OR has_vegetarian_options = true)`);
        }
        if (preferences.maxPriceLevel) {
            conditions.push(`price_level <= $${p++}`);
            params.push(preferences.maxPriceLevel);
        }
        if (preferences.cuisines && preferences.cuisines.length > 0) {
            const placeholders = preferences.cuisines.map(() => `$${p++}`).join(', ');
            conditions.push(`LOWER(cuisine) IN (${placeholders})`);
            params.push(...preferences.cuisines.map(c => c.toLowerCase()));
        }
        if (preferences.meal && preferences.meal !== 'any') {
            conditions.push(`(food_availability->>'${preferences.meal}')::boolean = true`);
        }
        const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
        let restaurants;
        try {
            const { rows } = await (0, pool_js_1.query)(`SELECT * FROM restaurants ${where} ORDER BY id`, params);
            restaurants = rows;
        }
        catch (dbErr) {
            console.warn('[WayDine] DB unavailable, using in-memory fallback:', dbErr.message);
            restaurants = fallback_js_1.FALLBACK_RESTAURANTS.filter(r => {
                if (preferences.vegetarianOnly && !r.is_vegetarian && !r.has_vegetarian_options)
                    return false;
                if (preferences.maxPriceLevel && r.price_level > preferences.maxPriceLevel)
                    return false;
                if (preferences.cuisines?.length) {
                    const low = preferences.cuisines.map((c) => c.toLowerCase());
                    if (!low.includes(r.cuisine.toLowerCase()))
                        return false;
                }
                if (preferences.meal && preferences.meal !== 'any') {
                    const fa = r.food_availability;
                    if (!fa[preferences.meal])
                        return false;
                }
                return true;
            });
        }
        const departure = preferences.departureTime
            ? new Date(preferences.departureTime)
            : new Date();
        const weights = { ...index_js_1.DEFAULT_WEIGHTS, ...(preferences.weights ?? {}) };
        const { candidates, allEvaluations, analytics } = await (0, recommendations_js_1.computeRecommendationsV2)(restaurants, route, {
            maxPerpendicularMetres: preferences.maxPerpendicularMetres ?? 200,
            maxDetourMetres,
            maxDetourTimeSeconds,
            departureTime: departure,
            mode: preferences.mode ?? 'strict',
            preferences,
            weights,
        });
        res.json({
            data: candidates,
            total: candidates.length,
            ruleEvaluations: allEvaluations,
            analytics,
            budgetApplied: {
                maxDetourMetres,
                maxDetourTimeSeconds,
                preset: preferences.detourBudget?.preset ?? null,
            },
            routeSummary: {
                distanceMetres: route.distance,
                durationSeconds: route.duration,
                waypointCount: route.geometry.length,
            },
            preferencesApplied: preferences,
            weights,
            generatedAt: new Date().toISOString(),
        });
    }
    catch (err) {
        next(err);
    }
});
//# sourceMappingURL=recommendations.js.map