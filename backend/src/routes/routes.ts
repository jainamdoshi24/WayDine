import { Router, Request, Response, NextFunction } from 'express';
import { fetchOsrmRoute, geocodeAddress } from '../services/osrm.js';
import { haversineDistance, estimateDuration } from '../algorithms/geo.js';
import { Coordinate, RouteResponse } from '../types/index.js';

export const routesRouter = Router();

/**
 * POST /api/routes
 * Computes a drivable route between two coordinates or address strings.
 *
 * Body:
 *   { source: {lat, lng} | string, destination: {lat, lng} | string }
 */
routesRouter.post('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { source, destination } = req.body as {
      source: Coordinate | string;
      destination: Coordinate | string;
    };

    if (!source || !destination) {
      res.status(400).json({
        error: 'source and destination are required',
        code: 'MISSING_PARAMS',
      });
      return;
    }

    // Resolve coordinates from strings if needed
    let srcCoord: Coordinate | null = null;
    let dstCoord: Coordinate | null = null;

    if (typeof source === 'string') {
      srcCoord = await geocodeAddress(source);
      if (!srcCoord) {
        res.status(422).json({
          error: `Could not geocode source: "${source}"`,
          code: 'GEOCODE_FAILED',
        });
        return;
      }
    } else {
      srcCoord = source;
    }

    if (typeof destination === 'string') {
      dstCoord = await geocodeAddress(destination);
      if (!dstCoord) {
        res.status(422).json({
          error: `Could not geocode destination: "${destination}"`,
          code: 'GEOCODE_FAILED',
        });
        return;
      }
    } else {
      dstCoord = destination;
    }

    // Validate coordinate ranges
    if (
      Math.abs(srcCoord.lat) > 90 || Math.abs(srcCoord.lng) > 180 ||
      Math.abs(dstCoord.lat) > 90 || Math.abs(dstCoord.lng) > 180
    ) {
      res.status(400).json({
        error: 'Invalid coordinates. lat must be ±90, lng must be ±180.',
        code: 'INVALID_COORDS',
      });
      return;
    }

    // Try OSRM route
    const osrmRoute = await fetchOsrmRoute(srcCoord, dstCoord);

    if (osrmRoute) {
      res.json({
        data: osrmRoute,
        resolvedSource: srcCoord,
        resolvedDestination: dstCoord,
      });
      return;
    }

    // Fallback: straight-line with warning
    const distance = haversineDistance(srcCoord, dstCoord);
    const duration = estimateDuration(distance);
    const fallbackRoute: RouteResponse = {
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
  } catch (err) {
    next(err);
  }
});
