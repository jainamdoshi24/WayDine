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
/**
 * Fetch a driving route between two coordinates from OSRM.
 * Returns null if the request fails or the service is unavailable.
 */
export declare function fetchOsrmRoute(origin: Coordinate, destination: Coordinate): Promise<RouteResponse | null>;
/**
 * Geocode an address string using Nominatim (OSM geocoder).
 */
export declare function geocodeAddress(query: string): Promise<Coordinate | null>;
/**
 * Compute driving detour distance/duration via OSRM.
 * Detour = (entry→restaurant) + (restaurant→exit) − direct(entry→exit).
 */
export declare function fetchOsrmDetour(entry: Coordinate, restaurant: Coordinate, exit: Coordinate): Promise<DetourInfo | null>;
//# sourceMappingURL=osrm.d.ts.map