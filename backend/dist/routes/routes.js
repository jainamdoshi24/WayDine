"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.routesRouter = void 0;
const express_1 = require("express");
const osrm_js_1 = require("../services/osrm.js");
const geo_js_1 = require("../algorithms/geo.js");
exports.routesRouter = (0, express_1.Router)();
/**
 * POST /api/routes
 * Computes a drivable route between two coordinates or address strings.
 *
 * Body:
 *   { source: {lat, lng} | string, destination: {lat, lng} | string }
 */
exports.routesRouter.post('/', async (req, res, next) => {
    try {
        const { source, destination } = req.body;
        if (!source || !destination) {
            res.status(400).json({
                error: 'source and destination are required',
                code: 'MISSING_PARAMS',
            });
            return;
        }
        // Resolve coordinates from strings if needed
        let srcCoord = null;
        let dstCoord = null;
        if (typeof source === 'string') {
            srcCoord = await (0, osrm_js_1.geocodeAddress)(source);
            if (!srcCoord) {
                res.status(422).json({
                    error: `Could not geocode source: "${source}"`,
                    code: 'GEOCODE_FAILED',
                });
                return;
            }
        }
        else {
            srcCoord = source;
        }
        if (typeof destination === 'string') {
            dstCoord = await (0, osrm_js_1.geocodeAddress)(destination);
            if (!dstCoord) {
                res.status(422).json({
                    error: `Could not geocode destination: "${destination}"`,
                    code: 'GEOCODE_FAILED',
                });
                return;
            }
        }
        else {
            dstCoord = destination;
        }
        // Validate coordinate ranges
        if (Math.abs(srcCoord.lat) > 90 || Math.abs(srcCoord.lng) > 180 ||
            Math.abs(dstCoord.lat) > 90 || Math.abs(dstCoord.lng) > 180) {
            res.status(400).json({
                error: 'Invalid coordinates. lat must be ±90, lng must be ±180.',
                code: 'INVALID_COORDS',
            });
            return;
        }
        // Try OSRM route
        const osrmRoute = await (0, osrm_js_1.fetchOsrmRoute)(srcCoord, dstCoord);
        if (osrmRoute) {
            res.json({
                data: osrmRoute,
                resolvedSource: srcCoord,
                resolvedDestination: dstCoord,
            });
            return;
        }
        // Fallback: straight-line with warning
        const distance = (0, geo_js_1.haversineDistance)(srcCoord, dstCoord);
        const duration = (0, geo_js_1.estimateDuration)(distance);
        const fallbackRoute = {
            geometry: [srcCoord, dstCoord],
            distance,
            duration,
            source: 'straight_line_fallback',
        };
        res.json({
            data: fallbackRoute,
            resolvedSource: srcCoord,
            resolvedDestination: dstCoord,
            warning: 'Road routing unavailable. Showing straight-line estimate.',
        });
    }
    catch (err) {
        next(err);
    }
});
//# sourceMappingURL=routes.js.map