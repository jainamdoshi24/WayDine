/**
 * OSRM routing service client.
 *
 * Delegates actual road-routing to the public OSRM demo server
 * (router.project-osrm.org) or a configured self-hosted instance.
 *
 * All custom graph algorithms (Dijkstra, A*) are clearly separate from
 * OSRM-calculated routes.
 */

import { Coordinate, RouteResponse, DetourInfo } from '../types/index.js';

const OSRM_BASE = process.env.OSRM_BASE_URL || 'http://router.project-osrm.org';
const TIMEOUT_MS = 8000;

/**
 * Fetch a driving route between two coordinates from OSRM.
 * Returns null if the request fails or the service is unavailable.
 */
export async function fetchOsrmRoute(
  origin: Coordinate,
  destination: Coordinate
): Promise<RouteResponse | null> {
  const url =
    `${OSRM_BASE}/route/v1/driving/` +
    `${origin.lng},${origin.lat};${destination.lng},${destination.lat}` +
    `?overview=full&geometries=geojson&steps=false`;

  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(timer);

    if (!res.ok) return null;

    const data = await res.json() as OsrmRouteResponse;
    if (data.code !== 'Ok' || !data.routes?.[0]) return null;

    const route = data.routes[0];
    const coords: Coordinate[] = (
      route.geometry.coordinates as [number, number][]
    ).map(([lng, lat]) => ({ lat, lng }));

    return {
      geometry: coords,
      distance: route.distance,
      duration: route.duration,
      source: 'osrm',
    };
  } catch {
    return null;
  }
}

/**
 * Geocode an address string using Nominatim (OSM geocoder).
 */
export async function geocodeAddress(
  query: string
): Promise<Coordinate | null> {
  const encoded = encodeURIComponent(query);
  const url = `https://nominatim.openstreetmap.org/search?q=${encoded}&format=json&limit=1`;

  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

    const res = await fetch(url, {
      signal: controller.signal,
      headers: { 'User-Agent': 'WayDine/1.0 (hackathon demo)' },
    });
    clearTimeout(timer);

    if (!res.ok) return null;

    const results = await res.json() as NominatimResult[];
    if (!results?.[0]) return null;

    return {
      lat: parseFloat(results[0].lat),
      lng: parseFloat(results[0].lon),
    };
  } catch {
    return null;
  }
}

/**
 * Compute driving detour distance/duration via OSRM.
 * Detour = (entry→restaurant) + (restaurant→exit) − direct(entry→exit).
 */
export async function fetchOsrmDetour(
  entry: Coordinate,
  restaurant: Coordinate,
  exit: Coordinate
): Promise<DetourInfo | null> {
  // Batch as a single OSRM trip with 3 waypoints
  const coords = [entry, restaurant, exit];
  const coordStr = coords.map((c) => `${c.lng},${c.lat}`).join(';');
  const url =
    `${OSRM_BASE}/route/v1/driving/${coordStr}` +
    `?overview=false&steps=false`;

  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(timer);

    if (!res.ok) return null;

    const data = await res.json() as OsrmRouteResponse;
    if (data.code !== 'Ok' || !data.routes?.[0]) return null;

    // Also get direct entry→exit distance
    const directUrl =
      `${OSRM_BASE}/route/v1/driving/${entry.lng},${entry.lat};${exit.lng},${exit.lat}` +
      `?overview=false&steps=false`;

    const directRes = await fetch(directUrl, {
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    if (!directRes.ok) return null;

    const directData = await directRes.json() as OsrmRouteResponse;
    if (directData.code !== 'Ok' || !directData.routes?.[0]) return null;

    const viaRoute = data.routes[0];
    const directRoute = directData.routes[0];

    const detourDistanceMetres = Math.max(0, viaRoute.distance - directRoute.distance);
    const detourDurationSeconds = Math.max(0, viaRoute.duration - directRoute.duration);

    return {
      detourDistanceMetres,
      detourDurationSeconds,
      detourSource: 'osrm',
    };
  } catch {
    return null;
  }
}

// OSRM response types
interface OsrmRouteResponse {
  code: string;
  routes?: Array<{
    distance: number;
    duration: number;
    geometry: {
      coordinates: [number, number][];
    };
  }>;
}

interface NominatimResult {
  lat: string;
  lon: string;
  display_name: string;
}
