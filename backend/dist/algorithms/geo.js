"use strict";
/**
 * Phase 2 geospatial utilities.
 * Adds bearing, signed cross-track distance, backward-travel detection.
 * All Phase 1 exports are preserved.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.toRad = toRad;
exports.toDeg = toDeg;
exports.haversineDistance = haversineDistance;
exports.bearingDeg = bearingDeg;
exports.bearingDiff = bearingDiff;
exports.signedCrossTrackDistance = signedCrossTrackDistance;
exports.projectPointOnSegment = projectPointOnSegment;
exports.buildRouteSegments = buildRouteSegments;
exports.findNearestSegment = findNearestSegment;
exports.detectBackwardTravel = detectBackwardTravel;
exports.estimateDuration = estimateDuration;
exports.estimateArrivalTime = estimateArrivalTime;
exports.formatTime12h = formatTime12h;
exports.formatDistance = formatDistance;
exports.formatDuration = formatDuration;
const EARTH_RADIUS_M = 6_371_000;
// ── Basic math ───────────────────────────────────────────────────────────────
function toRad(deg) {
    return (deg * Math.PI) / 180;
}
function toDeg(rad) {
    return (rad * 180) / Math.PI;
}
/**
 * Haversine distance in metres.
 */
function haversineDistance(a, b) {
    const lat1 = toRad(a.lat);
    const lat2 = toRad(b.lat);
    const dLat = toRad(b.lat - a.lat);
    const dLng = toRad(b.lng - a.lng);
    const h = Math.sin(dLat / 2) ** 2 +
        Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
    return 2 * EARTH_RADIUS_M * Math.asin(Math.sqrt(h));
}
/**
 * Initial bearing from A → B in degrees (0 = North, 90 = East).
 */
function bearingDeg(a, b) {
    const lat1 = toRad(a.lat);
    const lat2 = toRad(b.lat);
    const dLng = toRad(b.lng - a.lng);
    const y = Math.sin(dLng) * Math.cos(lat2);
    const x = Math.cos(lat1) * Math.sin(lat2) -
        Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLng);
    return (toDeg(Math.atan2(y, x)) + 360) % 360;
}
/**
 * Angular difference between two bearings: result in [-180, 180].
 */
function bearingDiff(a, b) {
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
function signedCrossTrackDistance(point, segStart, segEnd) {
    const d13 = haversineDistance(segStart, point);
    const θ13 = toRad(bearingDeg(segStart, point));
    const θ12 = toRad(bearingDeg(segStart, segEnd));
    const xt = Math.asin(Math.sin(d13 / EARTH_RADIUS_M) * Math.sin(θ13 - θ12)) * EARTH_RADIUS_M;
    return xt; // +ve = right, -ve = left
}
/**
 * Project a point onto a segment using planar approximation.
 * Returns projected point and parameter t ∈ [0, 1].
 */
function projectPointOnSegment(point, segStart, segEnd) {
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
    if (lenSq === 0)
        return { projected: segStart, t: 0 };
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
function buildRouteSegments(coords) {
    const segments = [];
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
function findNearestSegment(point, segments) {
    let bestDist = Infinity;
    let bestSigned = 0;
    let bestPos = 0;
    let bestProj = segments[0].start;
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
function detectBackwardTravel(restaurantRoutePosition, exitRoutePosition, entryRoutePosition) {
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
function estimateDuration(distanceMetres, speedKmh = 70) {
    return (distanceMetres / 1000 / speedKmh) * 3600;
}
/**
 * Estimate arrival time given departure + elapsed seconds.
 */
function estimateArrivalTime(departure, elapsedSeconds) {
    return new Date(departure.getTime() + elapsedSeconds * 1000);
}
/**
 * Format a Date to 12-hour time string in IST.
 */
function formatTime12h(d) {
    return d.toLocaleTimeString('en-IN', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
        timeZone: 'Asia/Kolkata',
    });
}
function formatDistance(metres) {
    if (metres < 1000)
        return `${Math.round(metres)} m`;
    return `${(metres / 1000).toFixed(1)} km`;
}
function formatDuration(seconds) {
    const m = Math.round(seconds / 60);
    if (m < 60)
        return `${m} min`;
    return `${Math.floor(m / 60)}h ${m % 60}m`;
}
//# sourceMappingURL=geo.js.map