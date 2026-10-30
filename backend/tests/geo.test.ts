import { describe, it, expect } from 'vitest';
import {
  haversineDistance,
  projectPointOnSegment,
  buildRouteSegments,
  findNearestSegment,
  estimateDuration,
} from '../src/algorithms/geo.js';
import { Coordinate } from '../src/types/index.js';

describe('haversineDistance', () => {
  it('returns 0 for identical points', () => {
    const p: Coordinate = { lat: 18.96, lng: 72.82 };
    expect(haversineDistance(p, p)).toBe(0);
  });

  it('computes Mumbai–Pune distance ~120 km', () => {
    const mumbai: Coordinate = { lat: 19.076, lng: 72.877 };
    const pune: Coordinate = { lat: 18.52, lng: 73.856 };
    const dist = haversineDistance(mumbai, pune);
    // Straight-line ~120 km
    expect(dist).toBeGreaterThan(110_000);
    expect(dist).toBeLessThan(135_000);
  });

  it('is symmetric', () => {
    const a: Coordinate = { lat: 28.61, lng: 77.2 };
    const b: Coordinate = { lat: 27.17, lng: 78.04 };
    expect(haversineDistance(a, b)).toBeCloseTo(haversineDistance(b, a), 0);
  });
});

describe('projectPointOnSegment', () => {
  it('projects a perpendicular point onto the midpoint', () => {
    const start: Coordinate = { lat: 0, lng: 0 };
    const end: Coordinate = { lat: 0, lng: 1 };
    // Point directly above midpoint
    const point: Coordinate = { lat: 0.01, lng: 0.5 };
    const { t } = projectPointOnSegment(point, start, end);
    expect(t).toBeCloseTo(0.5, 1);
  });

  it('clamps t=0 for point before segment', () => {
    const start: Coordinate = { lat: 0, lng: 0 };
    const end: Coordinate = { lat: 0, lng: 1 };
    const point: Coordinate = { lat: 0, lng: -0.5 };
    const { t } = projectPointOnSegment(point, start, end);
    expect(t).toBe(0);
  });

  it('clamps t=1 for point after segment', () => {
    const start: Coordinate = { lat: 0, lng: 0 };
    const end: Coordinate = { lat: 0, lng: 1 };
    const point: Coordinate = { lat: 0, lng: 1.5 };
    const { t } = projectPointOnSegment(point, start, end);
    expect(t).toBe(1);
  });
});

describe('buildRouteSegments', () => {
  it('creates n-1 segments for n coordinates', () => {
    const coords: Coordinate[] = [
      { lat: 18.96, lng: 72.82 },
      { lat: 18.75, lng: 73.41 },
      { lat: 18.52, lng: 73.86 },
    ];
    const segments = buildRouteSegments(coords);
    expect(segments).toHaveLength(2);
  });

  it('sets cumulative distances correctly', () => {
    const coords: Coordinate[] = [
      { lat: 0, lng: 0 },
      { lat: 0, lng: 1 },
      { lat: 0, lng: 2 },
    ];
    const segments = buildRouteSegments(coords);
    expect(segments[0].cumulativeStart).toBe(0);
    expect(segments[1].cumulativeStart).toBeCloseTo(segments[0].length, 0);
    expect(segments[1].cumulativeEnd).toBeCloseTo(segments[0].length + segments[1].length, 0);
  });

  it('returns empty array for single coordinate', () => {
    expect(buildRouteSegments([{ lat: 0, lng: 0 }])).toHaveLength(0);
  });
});

describe('findNearestSegment', () => {
  const segments = buildRouteSegments([
    { lat: 18.96, lng: 72.82 },
    { lat: 18.75, lng: 73.41 },
    { lat: 18.52, lng: 73.86 },
  ]);

  it('finds a very close point with near-zero perpendicular distance', () => {
    // A point very close to the route midpoint
    const point: Coordinate = { lat: 18.75, lng: 73.42 };
    const result = findNearestSegment(point, segments);
    expect(result.perpendicularDistance).toBeLessThan(2000);
  });

  it('returns large distance for a point far from route', () => {
    const point: Coordinate = { lat: 25.0, lng: 80.0 };
    const result = findNearestSegment(point, segments);
    expect(result.perpendicularDistance).toBeGreaterThan(50_000);
  });

  it('route position is within route length', () => {
    const point: Coordinate = { lat: 18.75, lng: 73.4 };
    const result = findNearestSegment(point, segments);
    const totalLength = segments[segments.length - 1].cumulativeEnd;
    expect(result.routePosition).toBeGreaterThanOrEqual(0);
    expect(result.routePosition).toBeLessThanOrEqual(totalLength);
  });
});

describe('estimateDuration', () => {
  it('estimates 1 hour for 70 km at 70 km/h', () => {
    const duration = estimateDuration(70_000, 70);
    expect(duration).toBeCloseTo(3600, 0);
  });

  it('returns 0 for 0 distance', () => {
    expect(estimateDuration(0)).toBe(0);
  });
});
