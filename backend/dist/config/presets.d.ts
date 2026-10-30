/**
 * WayDine — Central configuration for detour budget presets.
 * All numeric limits are authoritative and used by both backend enforcement
 * and frontend display. Modify here to change defaults globally.
 */
export interface DetourPreset {
    id: 'strict' | 'balanced' | 'flexible';
    label: string;
    maxDistanceKm: number;
    maxTimeMinutes: number;
    description: string;
}
export declare const DETOUR_PRESETS: Record<string, DetourPreset>;
export type PresetId = keyof typeof DETOUR_PRESETS;
/**
 * Translate a DetourBudget object to server-side limit values.
 * mode 'distance' → only distance enforced (time = Infinity)
 * mode 'time'     → only time enforced (distance = Infinity)
 * mode 'both'     → both enforced
 */
export declare function budgetToLimits(budget: {
    maxDistanceKm: number;
    maxTimeMinutes: number;
    mode: 'distance' | 'time' | 'both';
}): {
    maxDetourMetres: number;
    maxDetourTimeSeconds: number;
};
//# sourceMappingURL=presets.d.ts.map