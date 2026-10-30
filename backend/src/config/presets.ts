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

export const DETOUR_PRESETS: Record<string, DetourPreset> = {
  strict: {
    id:             'strict',
    label:          'Strict',
    maxDistanceKm:  2,
    maxTimeMinutes: 5,
    description:    'Minimal extra driving — ideal for tight schedules',
  },
  balanced: {
    id:             'balanced',
    label:          'Balanced',
    maxDistanceKm:  5,
    maxTimeMinutes: 10,
    description:    'Reasonable detour — the recommended default',
  },
  flexible: {
    id:             'flexible',
    label:          'Flexible',
    maxDistanceKm:  10,
    maxTimeMinutes: 20,
    description:    'Extended detour — more restaurant options',
  },
} as const;

export type PresetId = keyof typeof DETOUR_PRESETS;

/**
 * Translate a DetourBudget object to server-side limit values.
 * mode 'distance' → only distance enforced (time = Infinity)
 * mode 'time'     → only time enforced (distance = Infinity)
 * mode 'both'     → both enforced
 */
export function budgetToLimits(budget: {
  maxDistanceKm: number;
  maxTimeMinutes: number;
  mode: 'distance' | 'time' | 'both';
}): { maxDetourMetres: number; maxDetourTimeSeconds: number } {
  return {
    maxDetourMetres:      budget.mode !== 'time'     ? budget.maxDistanceKm  * 1000 : 999_999_999,
    maxDetourTimeSeconds: budget.mode !== 'distance'  ? budget.maxTimeMinutes * 60   : 999_999_999,
  };
}
