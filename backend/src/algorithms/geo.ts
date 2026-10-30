/**
 * Phase 2 geospatial utilities.
 * Adds bearing, signed cross-track distance, backward-travel detection.
 * All Phase 1 exports are preserved.
 */

import { Coordinate, RouteSegment } from '../types/index.js';

const EARTH_RADIUS_M = 6_371_000;

// ── Basic math ───────────────────────────────────────────────────────────────

export function toRad(deg: number): number {
  return (deg * Math.PI) / 180;
}

export function toDeg(rad: number): number {
  return (rad * 180) / Math.PI;
}

/**
 * Haversine distance in metres.
 */
export function haversineDistance(a: Coordinate, b: Coordinate): number {
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);

  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;

  return 2 * EARTH_RADIUS_M * Math.asin(Math.sqrt(h));
}

/**
 * Initial bearing from A → B in degrees (0 = North, 90 = East).
 */
export function bearingDeg(a: Coordinate, b: Coordinate): number {
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const dLng = toRad(b.lng - a.lng);

  const y = Math.sin(dLng) * Math.cos(lat2);
  const x =
    Math.cos(lat1) * Math.sin(lat2) -
    Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLng);

  return (toDeg(Math.atan2(y, x)) + 360) % 360;
}

/**
 * Angular difference between two bearings: result in [-180, 180].
 */
export function bearingDiff(a: number, b: number): number {
  let d = ((b - a + 540) % 360) - 180;
  return d;
}

/**
 * Signed cross-track distance (metres).
 * +ve  → point is to the RIGHT of the A→B great circle.
 * -ve  → point is to the LEFT.
 *
 * Formula: d_xt = asin(sin(d13/R) × sin(θ13 − θ12)) × R
 */
export function signedCrossTrackDistance(
  point: Coordinate,
  segStart: Coordinate,
  segEnd: Coordinate
): number {
  const d13 = haversineDistance(segStart, point);
  const θ13 = toRad(bearingDeg(segStart, point));
  const θ12 = toRad(bearingDeg(segStart, segEnd));

  const xt = Math.asin(
    Math.sin(d13 / EARTH_RADIUS_M) * Math.sin(θ13 - θ12)
  ) * EARTH_RADIUS_M;

  return xt; // +ve = right, -ve = left
}

/**
 * Project a point onto a segment using planar approximation.
 * Returns projected point and parameter t ∈ [0, 1].
 */
export function projectPointOnSegment(
  point: Coordinate,
  segStart: Coordinate,
  segEnd: Coordinate
): { projected: Coordinate; t: number } {
  const cosLat = Math.cos(toRad((segStart.lat + segEnd.lat) / 2));

  const ax = segStart.lng * cosLat;
  const ay = segStart.lat;
  const bx = segEnd.lng * cosLat;
  const by = segEnd.lat;
  const px = point.lng * cosLat;
  const py = point.lat;

  const dx = bx - ax;
  const dy = by - ay;
  const lenSq = dx * dx + dy * dy;

  if (lenSq === 0) return { projected: segStart, t: 0 };

  const t = Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / lenSq));

  return {
    projected: {
      lat: ay + t * dy,
      lng: (ax + t * dx) / cosLat,
    },
    t,
  };
}

/**
 * Build route segments with cumulative distances AND bearing per segment.
 */
export function buildRouteSegments(coords: Coordinate[]): RouteSegment[] {
  const segments: RouteSegment[] = [];
  let cumulative = 0;

  for (let i = 0; i < coords.length - 1; i++) {
    const start = coords[i];
    const end = coords[i + 1];
    const length = haversineDistance(start, end);
    const bearing = bearingDeg(start, end);

    segments.push({
      start,
      end,
      length,
      bearing,
      cumulativeStart: cumulative,
      cumulativeEnd: cumulative + length,
    });
    cumulative += length;
  }

  return segments;
}

/**
 * Find the nearest segment to a point. Returns:
 *  - perpendicularDistance  : absolute metres to segment
 *  - signedCrossTrack       : signed metres (+right, -left)
 *  - routePosition          : cumulative metres along route
 *  - projectedPoint
 *  - segmentIndex
 *  - segmentBearing
 */
export function findNearestSegment(
  point: Coordinate,
  segments: RouteSegment[]
): {
  perpendicularDistance: number;
  signedCrossTrack: number;
  routePosition: number;
  projectedPoint: Coordinate;
  segmentIndex: number;
  segmentBearing: number;
} {
  let bestDist = Infinity;
  let bestSigned = 0;
  let bestPos = 0;
  let bestProj: Coordinate = segments[0].start;
  let bestIdx = 0;
  let bestBearing = 0;

  for (let i = 0; i < segments.length; i++) {
    const seg = segments[i];
    const { projected, t } = projectPointOnSegment(point, seg.start, seg.end);
    const dist = haversineDistance(point, projected);

    if (dist < bestDist) {
      bestDist = dist;
      bestSigned = signedCrossTrackDistance(point, seg.start, seg.end);
      bestPos = seg.cumulativeStart + t * seg.length;
      bestProj = projected;
      bestIdx = i;
      bestBearing = seg.bearing;
    }
  }

  return {
    perpendicularDistance: bestDist,
    signedCrossTrack: bestSigned,
    routePosition: bestPos,
    projectedPoint: bestProj,
    segmentIndex: bestIdx,
    segmentBearing: bestBearing,
  };
}

/**
 * Detect backward travel: given the restaurant's route position and the
 * position of the "exit" (re-join) point, determine if the vehicle must
 * travel backward along the original route direction.
 */
export function detectBackwardTravel(
  restaurantRoutePosition: number,
  exitRoutePosition: number,
  entryRoutePosition: number
): { hasBackwardTravel: boolean; backtrackDistanceMetres: number } {
  // The driver approaches from entryRoutePosition, visits the restaurant
  // at routePosition, then exits at exitRoutePosition.
  // If exitRoutePosition < entryRoutePosition, there is backward travel.
  const backtrack = Math.max(0, entryRoutePosition - exitRoutePosition);
  return {
    hasBackwardTravel: backtrack > 50, // >50m is meaningful
    backtrackDistanceMetres: backtrack,
  };
}

/**
 * Estimate travel time (seconds) from distance at given speed.
 */
export function estimateDuration(distanceMetres: number, speedKmh = 70): number {
  return (distanceMetres / 1000 / speedKmh) * 3600;
}

/**
 * Estimate arrival time given departure + elapsed seconds.
 */
export function estimateArrivalTime(departure: Date, elapsedSeconds: number): Date {
  return new Date(departure.getTime() + elapsedSeconds * 1000);
}

/**
 * Format a Date to 12-hour time string in IST.
 */
export function formatTime12h(d: Date): string {
  return d.toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
    timeZone: 'Asia/Kolkata',
  });
}

export function formatDistance(metres: number): string {
  if (metres < 1000) return `${Math.round(metres)} m`;
  return `${(metres / 1000).toFixed(1)} km`;
}

export function formatDuration(seconds: number): string {
  const m = Math.round(seconds / 60);
  if (m < 60) return `${m} min`;
  return `${Math.floor(m / 60)}h ${m % 60}m`;
}
