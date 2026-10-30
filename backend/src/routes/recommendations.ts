import { Router, Request, Response, NextFunction } from 'express';
import { query } from '../db/pool.js';
import { FALLBACK_RESTAURANTS } from '../db/fallback.js';
import { computeRecommendationsV2 } from '../algorithms/recommendations.js';
import { Restaurant, RouteResponse, UserPreferences, DEFAULT_WEIGHTS } from '../types/index.js';
import { budgetToLimits, DETOUR_PRESETS } from '../config/presets.js';

export const recommendationsRouter = Router();

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
recommendationsRouter.post('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { route, preferences = {} } = req.body as {
      route: RouteResponse;
      preferences?: UserPreferences;
    };

    if (!route?.geometry || !Array.isArray(route.geometry) || route.geometry.length < 2) {
      res.status(400).json({ error: 'route.geometry must be an array of ≥ 2 coordinates', code: 'INVALID_ROUTE' });
      return;
    }
    if (typeof route.distance !== 'number' || route.distance <= 0) {
      res.status(400).json({ error: 'route.distance must be a positive number (metres)', code: 'INVALID_ROUTE' });
      return;
    }

    // ── Translate detourBudget → numeric limits ────────────────────────────
    let maxDetourMetres      = preferences.maxDetourMetres      ?? 5000;
    let maxDetourTimeSeconds = preferences.maxDetourTimeSeconds ?? 1200;

    if (preferences.detourBudget) {
      const budget = preferences.detourBudget;
      // Apply preset defaults if one is specified
      if (budget.preset && budget.preset !== 'custom' && DETOUR_PRESETS[budget.preset]) {
        const p = DETOUR_PRESETS[budget.preset];
        if (!budget.maxDistanceKm)  budget.maxDistanceKm  = p.maxDistanceKm;
        if (!budget.maxTimeMinutes) budget.maxTimeMinutes = p.maxTimeMinutes;
      }
      const limits = budgetToLimits({
        maxDistanceKm:  budget.maxDistanceKm  ?? 5,
        maxTimeMinutes: budget.maxTimeMinutes ?? 10,
        mode:           budget.mode           ?? 'both',
      });
      maxDetourMetres      = limits.maxDetourMetres;
      maxDetourTimeSeconds = limits.maxDetourTimeSeconds;
    }

    // ── Pre-filter in SQL before expensive spatial calculations ─────────────
    const conditions: string[] = [];
    const params: unknown[]    = [];
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

    let restaurants: Restaurant[];
    try {
      const { rows } = await query<Restaurant>(
        `SELECT * FROM restaurants ${where} ORDER BY id`,
        params
      );
      restaurants = rows;
    } catch (dbErr) {
      console.warn('[WayDine] DB unavailable, using in-memory fallback:', (dbErr as Error).message);
      restaurants = FALLBACK_RESTAURANTS.filter(r => {
        if (preferences.vegetarianOnly && !r.is_vegetarian && !r.has_vegetarian_options) return false;
        if (preferences.maxPriceLevel && r.price_level > preferences.maxPriceLevel) return false;
        if (preferences.cuisines?.length) {
          const low = preferences.cuisines.map((c: string) => c.toLowerCase());
          if (!low.includes(r.cuisine.toLowerCase())) return false;
        }
        if (preferences.meal && preferences.meal !== 'any') {
          const fa = r.food_availability as unknown as Record<string, boolean>;
          if (!fa[preferences.meal]) return false;
        }
        return true;
      });
    }

    const departure = preferences.departureTime
      ? new Date(preferences.departureTime)
      : new Date();

    const weights = { ...DEFAULT_WEIGHTS, ...(preferences.weights ?? {}) };

    const { candidates, allEvaluations, analytics } = await computeRecommendationsV2(
      restaurants,
      route,
      {
        maxPerpendicularMetres: preferences.maxPerpendicularMetres ?? 200,
        maxDetourMetres,
        maxDetourTimeSeconds,
        departureTime: departure,
        mode:          preferences.mode ?? 'strict',
        preferences,
        weights,
      }
    );

    res.json({
      data:               candidates,
      total:              candidates.length,
      ruleEvaluations:    allEvaluations,
      analytics,
      budgetApplied: {
        maxDetourMetres,
        maxDetourTimeSeconds,
        preset: preferences.detourBudget?.preset ?? null,
      },
      routeSummary: {
        distanceMetres:  route.distance,
        durationSeconds: route.duration,
        waypointCount:   route.geometry.length,
      },
      preferencesApplied: preferences,
      weights,
      generatedAt: new Date().toISOString(),
    });
  } catch (err) {
    next(err);
  }
});
