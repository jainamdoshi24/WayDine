/**
 * Tests for DetourBudget Wallet preset config and limit translation.
 */

import { describe, it, expect } from 'vitest';
import { budgetToLimits, DETOUR_PRESETS } from '../src/config/presets.js';

describe('DetourBudget presets', () => {
  it('strict preset has correct limits', () => {
    const p = DETOUR_PRESETS['strict'];
    expect(p.maxDistanceKm).toBe(2);
    expect(p.maxTimeMinutes).toBe(5);
  });

  it('balanced preset has correct limits', () => {
    const p = DETOUR_PRESETS['balanced'];
    expect(p.maxDistanceKm).toBe(5);
    expect(p.maxTimeMinutes).toBe(10);
  });

  it('flexible preset has correct limits', () => {
    const p = DETOUR_PRESETS['flexible'];
    expect(p.maxDistanceKm).toBe(10);
    expect(p.maxTimeMinutes).toBe(20);
  });
});

describe('budgetToLimits — mode enforcement', () => {
  it('mode=distance: only distance enforced, time is unlimited', () => {
    const limits = budgetToLimits({ maxDistanceKm: 3, maxTimeMinutes: 10, mode: 'distance' });
    expect(limits.maxDetourMetres).toBe(3000);
    expect(limits.maxDetourTimeSeconds).toBeGreaterThan(999_000);
  });

  it('mode=time: only time enforced, distance is unlimited', () => {
    const limits = budgetToLimits({ maxDistanceKm: 3, maxTimeMinutes: 10, mode: 'time' });
    expect(limits.maxDetourTimeSeconds).toBe(600);
    expect(limits.maxDetourMetres).toBeGreaterThan(999_000);
  });

  it('mode=both: both enforced', () => {
    const limits = budgetToLimits({ maxDistanceKm: 5, maxTimeMinutes: 15, mode: 'both' });
    expect(limits.maxDetourMetres).toBe(5000);
    expect(limits.maxDetourTimeSeconds).toBe(900);
  });

  it('handles zero distance budget', () => {
    const limits = budgetToLimits({ maxDistanceKm: 0, maxTimeMinutes: 10, mode: 'both' });
    expect(limits.maxDetourMetres).toBe(0);
  });

  it('handles zero time budget', () => {
    const limits = budgetToLimits({ maxDistanceKm: 5, maxTimeMinutes: 0, mode: 'both' });
    expect(limits.maxDetourTimeSeconds).toBe(0);
  });

  it('converts km and minutes to metres and seconds correctly', () => {
    const limits = budgetToLimits({ maxDistanceKm: 2, maxTimeMinutes: 8, mode: 'both' });
    expect(limits.maxDetourMetres).toBe(2000);
    expect(limits.maxDetourTimeSeconds).toBe(480);
  });
});
