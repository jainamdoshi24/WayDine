/**
 * ETA calculation and meal-window checking — Phase 2.
 *
 * Opening hours format: "HH:MM-HH:MM" (24h), "closed", "00:00-23:59" (all day).
 * Overnight ranges like "22:00-02:00" are handled correctly.
 * All local-time math is done via Intl.DateTimeFormat to avoid offset errors.
 */
import { EtaInfo, MealWindow, MealWindowDef, Restaurant } from '../types/index.js';
export declare const MEAL_WINDOWS: MealWindowDef[];
export declare const ALL_MEALS: MealWindow[];
export declare function getMealWindowsAtTime(date: Date, tz?: string): MealWindow[];
export declare function computeEta(departure: Date, routePosition: number, totalRouteDistance: number, totalRouteDuration: number, detourDurationSeconds: number, restaurant: Restaurant, requestedMeal?: MealWindow | 'any', tz?: string): EtaInfo;
//# sourceMappingURL=eta.d.ts.map