"use strict";
/**
 * WayDine — Central configuration for detour budget presets.
 * All numeric limits are authoritative and used by both backend enforcement
 * and frontend display. Modify here to change defaults globally.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.DETOUR_PRESETS = void 0;
exports.budgetToLimits = budgetToLimits;
exports.DETOUR_PRESETS = {
    strict: {
        id: 'strict',
        label: 'Strict',
        maxDistanceKm: 2,
        maxTimeMinutes: 5,
        description: 'Minimal extra driving — ideal for tight schedules',
    },
    balanced: {
        id: 'balanced',
        label: 'Balanced',
        maxDistanceKm: 5,
        maxTimeMinutes: 10,
        description: 'Reasonable detour — the recommended default',
    },
    flexible: {
        id: 'flexible',
        label: 'Flexible',
        maxDistanceKm: 10,
        maxTimeMinutes: 20,
        description: 'Extended detour — more restaurant options',
    },
};
/**
 * Translate a DetourBudget object to server-side limit values.
 * mode 'distance' → only distance enforced (time = Infinity)
 * mode 'time'     → only time enforced (distance = Infinity)
 * mode 'both'     → both enforced
 */
function budgetToLimits(budget) {
    return {
        maxDetourMetres: budget.mode !== 'time' ? budget.maxDistanceKm * 1000 : 999_999_999,
        maxDetourTimeSeconds: budget.mode !== 'distance' ? budget.maxTimeMinutes * 60 : 999_999_999,
    };
}
//# sourceMappingURL=presets.js.map