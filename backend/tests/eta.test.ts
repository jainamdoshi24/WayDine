/**
 * Phase 2 tests: ETA, meal windows, opening hours, and all edge cases.
 * Uses a fixed clock for reproducible results.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  getMealWindowsAtTime,
  computeEta,
  MEAL_WINDOWS,
} from '../src/algorithms/eta.js';
import { Restaurant } from '../src/types/index.js';

// Fixed "now" = Thursday 2026-10-29 12:00:00 IST (06:30 UTC)
const FIXED_NOW = new Date('2026-10-29T06:30:00Z'); // 12:00 IST

const BASE_RESTAURANT: Restaurant = {
  id: 1,
  name: 'Test Restaurant',
  address: 'Test',
  latitude: 18.96,
  longitude: 72.82,
  entrance_lat: null,
  entrance_lng: null,
  cuisine: 'Indian',
  price_level: 2,
  is_vegetarian: false,
  has_vegetarian_options: true,
  opening_hours: { mon: '06:00-23:00', tue: '06:00-23:00', wed: '06:00-23:00',
                   thu: '06:00-23:00', fri: '06:00-23:00', sat: '06:00-23:00',
                   sun: '06:00-23:00' },
  food_availability: { breakfast: true, lunch: true, dinner: true, snacks: true },
  is_roadside: true,
  highway_access: 'Direct',
  rating: 4.2,
  review_count: 200,
  phone: null,
  website: null,
  image_url: null,
  data_source: 'test',
  is_demo: true,
  verified_at: '2026-01-01T00:00:00Z',
  created_at: '2026-01-01T00:00:00Z',
};

// ── Meal window detection ────────────────────────────────────────────────────

describe('getMealWindowsAtTime', () => {
  it('identifies breakfast at 07:30 IST', () => {
    // 07:30 IST = 02:00 UTC
    const d = new Date('2026-10-29T02:00:00Z');
    const windows = getMealWindowsAtTime(d, 'Asia/Kolkata');
    expect(windows).toContain('breakfast');
  });

  it('identifies lunch at 13:00 IST', () => {
    // 13:00 IST = 07:30 UTC
    const d = new Date('2026-10-29T07:30:00Z');
    const windows = getMealWindowsAtTime(d, 'Asia/Kolkata');
    expect(windows).toContain('lunch');
  });

  it('identifies snacks at 16:00 IST', () => {
    // 16:00 IST = 10:30 UTC
    const d = new Date('2026-10-29T10:30:00Z');
    const windows = getMealWindowsAtTime(d, 'Asia/Kolkata');
    expect(windows).toContain('snacks');
  });

  it('identifies dinner at 20:00 IST', () => {
    // 20:00 IST = 14:30 UTC
    const d = new Date('2026-10-29T14:30:00Z');
    const windows = getMealWindowsAtTime(d, 'Asia/Kolkata');
    expect(windows).toContain('dinner');
  });

  it('returns empty array at 04:00 IST (no meal window)', () => {
    // 04:00 IST = 22:30 UTC prev day
    const d = new Date('2026-10-28T22:30:00Z');
    const windows = getMealWindowsAtTime(d, 'Asia/Kolkata');
    expect(windows).toHaveLength(0);
  });

  it('returns empty at exactly meal window boundary (10:31 IST)', () => {
    // 10:31 IST — breakfast ends at 10:30, lunch starts at 11:30
    const d = new Date('2026-10-29T05:01:00Z'); // 10:31 IST
    const windows = getMealWindowsAtTime(d, 'Asia/Kolkata');
    expect(windows).not.toContain('breakfast');
    expect(windows).not.toContain('lunch');
  });
});

// ── ETA computation ───────────────────────────────────────────────────────────

describe('computeEta', () => {
  const departure = new Date('2026-10-29T06:30:00Z'); // 12:00 IST

  it('computes correct ETA for a 2-hour route at midpoint', () => {
    // totalDistance = 200km, totalDuration = 2h (7200s)
    // routePosition = 100km (midpoint)
    // detourDurationSeconds = 0
    // ETA = 12:00 + 1h = 13:00 IST
    const eta = computeEta(
      departure, 100_000, 200_000, 7200, 0, BASE_RESTAURANT, 'lunch'
    );
    const etaDate = new Date(eta.eta);
    // Should be around 13:00 IST = 07:30 UTC
    expect(etaDate.getUTCHours()).toBe(7);
    expect(etaDate.getUTCMinutes()).toBe(30);
  });

  it('adds detour duration to ETA', () => {
    // 0km along a 200km route + 600s detour → ETA = 12:10 IST
    const eta = computeEta(
      departure, 0, 200_000, 7200, 600, BASE_RESTAURANT
    );
    const etaDate = new Date(eta.eta);
    // 12:00 + 0min (no route progress) + 10min detour = 12:10 IST (06:40 UTC)
    expect(etaDate.getUTCHours()).toBe(6);
    expect(etaDate.getUTCMinutes()).toBe(40);
  });

  it('marks restaurant as open when ETA is within hours', () => {
    // ETA = 12:00 IST, restaurant opens 06:00-23:00
    const eta = computeEta(departure, 0, 200_000, 7200, 0, BASE_RESTAURANT);
    expect(eta.isOpenAtEta).toBe(true);
  });

  it('marks restaurant as closed on its closed day', () => {
    // Thursday, same restaurant has 'thu: closed'
    const closedRestaurant: Restaurant = {
      ...BASE_RESTAURANT,
      opening_hours: { ...BASE_RESTAURANT.opening_hours, thu: 'closed' },
    };
    const eta = computeEta(departure, 0, 200_000, 7200, 0, closedRestaurant);
    expect(eta.isOpenAtEta).toBe(false);
    expect(eta.availabilityLabel).toContain('Closed');
  });

  it('reports closing warning when closing within 30 min of ETA', () => {
    // ETA = 22:45 IST, restaurant closes 23:00
    // ETA UTC = 17:15, departure UTC = 17:15 - detour
    const lateRestaurant: Restaurant = {
      ...BASE_RESTAURANT,
      opening_hours: { '*': '06:00-23:00' },
    };
    // departure such that ETA = 22:45 IST (17:15 UTC)
    const lateDeparture = new Date('2026-10-29T17:15:00Z');
    const eta = computeEta(
      lateDeparture, 0, 200_000, 7200, 0, lateRestaurant
    );
    // ETA = 22:45 IST, closes 23:00 → within 30 min
    expect(eta.closingWarning).toBe(true);
  });

  it('handles overnight opening hours (22:00–02:00)', () => {
    const overnightRestaurant: Restaurant = {
      ...BASE_RESTAURANT,
      opening_hours: { '*': '22:00-02:00' },
    };
    // ETA = 23:00 IST = 17:30 UTC
    const lateDeparture = new Date('2026-10-29T17:30:00Z');
    const eta = computeEta(
      lateDeparture, 0, 200_000, 7200, 0, overnightRestaurant
    );
    expect(eta.isOpenAtEta).toBe(true);
  });

  it('reports meal available when lunch is requested and ETA is lunch time', () => {
    // ETA = 13:00 IST (lunch window 11:30-15:00)
    const eta = computeEta(departure, 100_000, 200_000, 7200, 0, BASE_RESTAURANT, 'lunch');
    expect(eta.mealAvailable).toBe('lunch');
    expect(eta.availabilityLabel).toContain('Lunch available');
  });

  it('reports meal window missed when ETA is after dinner closes', () => {
    // ETA = 23:30 IST — after dinner window (18:30-22:30)
    const veryLateDeparture = new Date('2026-10-29T18:00:00Z'); // 23:30 IST
    const eta = computeEta(
      veryLateDeparture, 0, 200_000, 7200, 0, BASE_RESTAURANT, 'dinner'
    );
    expect(eta.mealAvailable).toBeNull();
  });

  it('reports meal availability unverified when food_availability missing', () => {
    const noFoodData: Restaurant = {
      ...BASE_RESTAURANT,
      food_availability: { breakfast: false, lunch: false, dinner: false, snacks: false },
    };
    const eta = computeEta(departure, 100_000, 200_000, 7200, 0, noFoodData, 'lunch');
    expect(eta.mealAvailable).toBeNull();
  });
});
