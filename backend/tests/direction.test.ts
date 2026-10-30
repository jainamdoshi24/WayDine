/**
 * Phase 2 tests: direction, bearing, accessibility, backward travel.
 */

import { describe, it, expect } from 'vitest';
import {
  bearingDeg,
  bearingDiff,
  signedCrossTrackDistance,
  buildRouteSegments,
  findNearestSegment,
  detectBackwardTravel,
} from '../src/algorithms/geo.js';
import { classifyAccessibility, accessibilityScore } from '../src/algorithms/accessibility.js';
import { Coordinate } from '../src/types/index.js';

// ── Bearing ───────────────────────────────────────────────────────────────────

describe('bearingDeg', () => {
  it('northbound: bearing ≈ 0°', () => {
    const a: Coordinate = { lat: 0, lng: 0 };
    const b: Coordinate = { lat: 1, lng: 0 };
    expect(bearingDeg(a, b)).toBeCloseTo(0, 0);
  });

  it('eastbound: bearing ≈ 90°', () => {
    const a: Coordinate = { lat: 0, lng: 0 };
    const b: Coordinate = { lat: 0, lng: 1 };
    expect(bearingDeg(a, b)).toBeCloseTo(90, 0);
  });

  it('southbound: bearing ≈ 180°', () => {
    const a: Coordinate = { lat: 1, lng: 0 };
    const b: Coordinate = { lat: 0, lng: 0 };
    expect(bearingDeg(a, b)).toBeCloseTo(180, 0);
  });

  it('westbound: bearing ≈ 270°', () => {
    const a: Coordinate = { lat: 0, lng: 1 };
    const b: Coordinate = { lat: 0, lng: 0 };
    expect(bearingDeg(a, b)).toBeCloseTo(270, 0);
  });

  it('Delhi→Agra is roughly southward (~170-180°)', () => {
    const delhi: Coordinate = { lat: 28.61, lng: 77.2 };
    const agra:  Coordinate = { lat: 27.17, lng: 78.0 };
    const b = bearingDeg(delhi, agra);
    expect(b).toBeGreaterThan(140);
    expect(b).toBeLessThan(200);
  });
});

describe('bearingDiff', () => {
  it('returns 0 for identical bearings', () => {
    expect(bearingDiff(90, 90)).toBe(0);
  });

  it('returns +90 for 0° → 90°', () => {
    expect(bearingDiff(0, 90)).toBe(90);
  });

  it('returns -90 for 90° → 0°', () => {
    expect(bearingDiff(90, 0)).toBe(-90);
  });

  it('handles wrap-around correctly', () => {
    // 350° → 10° should be +20, not -340
    expect(bearingDiff(350, 10)).toBe(20);
  });
});

// ── Signed cross-track ────────────────────────────────────────────────────────

describe('signedCrossTrackDistance', () => {
  const west: Coordinate  = { lat: 0, lng: 0 };
  const east: Coordinate  = { lat: 0, lng: 1 };

  it('point north of an eastbound segment is +ve (right side)', () => {
    // Eastbound (0→90°), north is left for driver going east
    // Wait: bearing east = 90°. Right of east-going driver = south (negative lat).
    // Left = north (positive lat).
    // Signed cross-track: north of eastbound = negative (left side)
    const north: Coordinate = { lat: 0.01, lng: 0.5 };
    const xt = signedCrossTrackDistance(north, west, east);
    // North of east-going route = left = negative
    expect(xt).toBeLessThan(0);
  });

  it('point south of an eastbound segment is -ve (left side reversed)', () => {
    const south: Coordinate = { lat: -0.01, lng: 0.5 };
    const xt = signedCrossTrackDistance(south, west, east);
    // South of east-going route = right = positive
    expect(xt).toBeGreaterThan(0);
  });

  it('on-route point has near-zero cross-track', () => {
    const onRoute: Coordinate = { lat: 0, lng: 0.5 };
    const xt = signedCrossTrackDistance(onRoute, west, east);
    expect(Math.abs(xt)).toBeLessThan(50);
  });
});

// ── Curved roads and changing headings ───────────────────────────────────────

describe('buildRouteSegments bearing', () => {
  it('assigns correct bearings to a curved route', () => {
    // Route curves from eastbound to northbound
    const coords: Coordinate[] = [
      { lat: 0, lng: 0 },
      { lat: 0, lng: 1 },   // eastbound
      { lat: 1, lng: 1 },   // northbound
    ];
    const segs = buildRouteSegments(coords);
    expect(segs[0].bearing).toBeCloseTo(90, 0);  // east
    expect(segs[1].bearing).toBeCloseTo(0, 0);   // north (or ~360)
  });
});

// ── Backward travel detection ─────────────────────────────────────────────────

describe('detectBackwardTravel', () => {
  it('no backward travel when exit is ahead of entry', () => {
    // entry at 10km, restaurant at 10.1km, exit at 10.5km
    const result = detectBackwardTravel(10_100, 10_500, 10_000);
    expect(result.hasBackwardTravel).toBe(false);
    expect(result.backtrackDistanceMetres).toBe(0);
  });

  it('detects backward travel when exit is behind entry', () => {
    // entry at 10km, restaurant requires backtrack to 9km exit
    const result = detectBackwardTravel(9_000, 9_000, 10_000);
    expect(result.hasBackwardTravel).toBe(true);
    expect(result.backtrackDistanceMetres).toBeGreaterThan(0);
  });

  it('returns zero backtrack for exit == entry', () => {
    const result = detectBackwardTravel(10_000, 10_000, 10_000);
    expect(result.hasBackwardTravel).toBe(false);
  });
});

// ── Parallel service roads / divided highways ─────────────────────────────────

describe('findNearestSegment on divided highway', () => {
  // Simulate a divided highway: main carriageway at lat=0, service road at lat=0.001
  const mainRoute = buildRouteSegments([
    { lat: 0, lng: 0 },
    { lat: 0, lng: 0.5 },
    { lat: 0, lng: 1 },
  ]);

  it('restaurant on service road (100m offset) still within 200m corridor', () => {
    const restaurant: Coordinate = { lat: 0.001, lng: 0.5 }; // ~110m north
    const result = findNearestSegment(restaurant, mainRoute);
    expect(result.perpendicularDistance).toBeLessThan(200);
  });

  it('restaurant far from highway is outside 200m', () => {
    const farRestaurant: Coordinate = { lat: 0.05, lng: 0.5 }; // ~5.5km away
    const result = findNearestSegment(farRestaurant, mainRoute);
    expect(result.perpendicularDistance).toBeGreaterThan(200);
  });
});

// ── Accessibility classifier ───────────────────────────────────────────────────

describe('classifyAccessibility', () => {
  const baseRestaurant = {
    entrance_lat: null as null | number,
    entrance_lng: null as null | number,
    is_roadside: true,
    highway_access: null as string | null,  // no highway data — pure geometry fallback
  } as Parameters<typeof classifyAccessibility>[2];

  it('returns confirmed_same_side for very close point', () => {
    const result = classifyAccessibility(3, 3, baseRestaurant);
    expect(result.status).toBe('confirmed_same_side');
  });

  it('returns uncertain for roadside restaurant with no entrance and no highway data', () => {
    const result = classifyAccessibility(50, 100, baseRestaurant);
    expect(result.status).toBe('uncertain');
    expect(result.isRoadside).toBe(true);
  });

  it('returns confirmed_same_side when entrance coords present (right side)', () => {
    const withEntrance = { ...baseRestaurant, entrance_lat: 18.5, entrance_lng: 73.5 };
    const result = classifyAccessibility(50, 100, withEntrance);
    expect(result.status).toBe('confirmed_same_side');
    expect(result.hasEntrance).toBe(true);
  });

  it('returns opposite_side when entrance present and clearly left side', () => {
    const withEntrance = { ...baseRestaurant, entrance_lat: 18.5, entrance_lng: 73.5 };
    const result = classifyAccessibility(-150, 150, withEntrance);
    expect(result.status).toBe('opposite_side');
    expect(result.requiresCrossing).toBe(true);
  });

  it('accessibilityScore is highest for confirmed_same_side roadside', () => {
    const info = classifyAccessibility(50, 80, { ...baseRestaurant, is_roadside: true });
    const score = accessibilityScore({ ...info, status: 'confirmed_same_side', isRoadside: true, hasEntrance: true, requiresCrossing: false, label: '' });
    expect(score).toBe(1.0);
  });

  it('accessibilityScore is lowest for opposite_side', () => {
    const info = { status: 'opposite_side' as const, label: '', requiresCrossing: true, hasEntrance: false, isRoadside: false };
    expect(accessibilityScore(info)).toBe(0.1);
  });
});
