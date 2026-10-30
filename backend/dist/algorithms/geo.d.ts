/**
 * Phase 2 geospatial utilities.
 * Adds bearing, signed cross-track distance, backward-travel detection.
 * All Phase 1 exports are preserved.
 */
import { Coordinate, RouteSegment } from '../types/index.js';
export declare function toRad(deg: number): number;
export declare function toDeg(rad: number): number;
/**
 * Haversine distance in metres.
 */
export declare function haversineDistance(a: Coordinate, b: Coordinate): number;
/**
 * Initial bearing from A → B in degrees (0 = North, 90 = East).
 */
export declare function bearingDeg(a: Coordinate, b: Coordinate): number;
/**
 * Angular difference between two bearings: result in [-180, 180].
 */
export declare function bearingDiff(a: number, b: number): number;
/**
 * Signed cross-track distance (metres).
 * +ve  → point is to the RIGHT of the A→B great circle.
 * -ve  → point is to the LEFT.
 *
 * Formula: d_xt = asin(sin(d13/R) × sin(θ13 − θ12)) × R
 */
export declare function signedCrossTrackDistance(point: Coordinate, segStart: Coordinate, segEnd: Coordinate): number;
/**
 * Project a point onto a segment using planar approximation.
 * Returns projected point and parameter t ∈ [0, 1].
 */
export declare function projectPointOnSegment(point: Coordinate, segStart: Coordinate, segEnd: Coordinate): {
    projected: Coordinate;
    t: number;
};
/**
 * Build route segments with cumulative distances AND bearing per segment.
 */
export declare function buildRouteSegments(coords: Coordinate[]): RouteSegment[];
/**
 * Find the nearest segment to a point. Returns:
 *  - perpendicularDistance  : absolute metres to segment
 *  - signedCrossTrack       : signed metres (+right, -left)
 *  - routePosition          : cumulative metres along route
 *  - projectedPoint
 *  - segmentIndex
 *  - segmentBearing
 */
export declare function findNearestSegment(point: Coordinate, segments: RouteSegment[]): {
    perpendicularDistance: number;
    signedCrossTrack: number;
    routePosition: number;
    projectedPoint: Coordinate;
    segmentIndex: number;
    segmentBearing: number;
};
/**
 * Detect backward travel: given the restaurant's route position and the
 * position of the "exit" (re-join) point, determine if the vehicle must
 * travel backward along the original route direction.
 */
export declare function detectBackwardTravel(restaurantRoutePosition: number, exitRoutePosition: number, entryRoutePosition: number): {
    hasBackwardTravel: boolean;
    backtrackDistanceMetres: number;
};
/**
 * Estimate travel time (seconds) from distance at given speed.
 */
export declare function estimateDuration(distanceMetres: number, speedKmh?: number): number;
/**
 * Estimate arrival time given departure + elapsed seconds.
 */
export declare function estimateArrivalTime(departure: Date, elapsedSeconds: number): Date;
/**
 * Format a Date to 12-hour time string in IST.
 */
export declare function formatTime12h(d: Date): string;
export declare function formatDistance(metres: number): string;
export declare function formatDuration(seconds: number): string;
//# sourceMappingURL=geo.d.ts.map