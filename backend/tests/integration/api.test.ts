/**
 * Integration tests — tests the Express app directly via supertest-like approach.
 * Uses vitest + node:http to avoid needing supertest installed.
 * Mocks the database pool so no real PostgreSQL is needed.
 */

import { describe, it, expect, vi, beforeAll } from 'vitest';

// ── Mock the database pool before importing the app ──────────────────────────
vi.mock('../../src/db/pool.js', () => ({
  default: { connect: vi.fn(), query: vi.fn(), end: vi.fn() },
  query: vi.fn().mockResolvedValue({ rows: [], rowCount: 0 }),
}));

// ── Mock OSRM service ─────────────────────────────────────────────────────────
vi.mock('../../src/services/osrm.js', () => ({
  fetchOsrmRoute: vi.fn().mockResolvedValue(null),
  geocodeAddress: vi.fn().mockResolvedValue({ lat: 18.9667, lng: 72.8333 }),
  fetchOsrmDetour: vi.fn().mockResolvedValue(null),
}));

import app from '../../src/index.js';
import http from 'node:http';

// ── Helper: make HTTP request to the Express app ─────────────────────────────
function request(
  app: http.RequestListener,
  method: string,
  path: string,
  body?: unknown,
): Promise<{ status: number; body: unknown }> {
  return new Promise((resolve, reject) => {
    const server = http.createServer(app);
    server.listen(0, () => {
      const addr = server.address() as { port: number };
      const port = addr.port;
      const bodyStr = body ? JSON.stringify(body) : '';
      const options: http.RequestOptions = {
        hostname: 'localhost',
        port,
        path,
        method,
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(bodyStr),
        },
      };
      const req = http.request(options, (res) => {
        let data = '';
        res.on('data', chunk => { data += chunk; });
        res.on('end', () => {
          server.close();
          try {
            resolve({ status: res.statusCode ?? 500, body: JSON.parse(data) });
          } catch {
            resolve({ status: res.statusCode ?? 500, body: data });
          }
        });
      });
      req.on('error', (err) => { server.close(); reject(err); });
      if (bodyStr) req.write(bodyStr);
      req.end();
    });
  });
}

// ── Minimal valid route for tests ─────────────────────────────────────────────
const VALID_ROUTE = {
  geometry: [
    { lat: 18.9667, lng: 72.8333 },
    { lat: 18.85, lng: 73.1 },
    { lat: 18.75, lng: 73.35 },
  ],
  distance: 45000,
  duration: 2700,
  source: 'osrm',
};

describe('GET /api/health', () => {
  it('returns 200 with status ok', async () => {
    const res = await request(app, 'GET', '/api/health');
    expect(res.status).toBe(200);
    expect((res.body as Record<string, unknown>).status).toBe('ok');
  });
});

describe('POST /api/routes', () => {
  it('returns 400 when body is empty', async () => {
    const res = await request(app, 'POST', '/api/routes', {});
    expect(res.status).toBe(400);
  });

  it('returns 422 when geocoding fails (mocked as success)', async () => {
    // geocodeAddress is mocked to return a coord, so should get a route response
    const res = await request(app, 'POST', '/api/routes', {
      source: 'Mumbai',
      destination: 'Pune',
    });
    // straight-line fallback since fetchOsrmRoute returns null
    expect(res.status).toBe(200);
    const body = res.body as Record<string, unknown>;
    expect(body.data).toBeDefined();
    expect((body.data as Record<string, unknown>).source).toBe('straight_line_fallback');
    expect(body.warning).toBeDefined();
  });

  it('returns 400 when source is missing', async () => {
    const res = await request(app, 'POST', '/api/routes', { destination: 'Pune' });
    expect(res.status).toBe(400);
  });
});

describe('POST /api/recommendations', () => {
  it('returns 400 when route geometry is missing', async () => {
    const res = await request(app, 'POST', '/api/recommendations', {
      route: { distance: 45000, duration: 2700, source: 'osrm' },
    });
    expect(res.status).toBe(400);
  });

  it('returns 400 when route has fewer than 2 points', async () => {
    const res = await request(app, 'POST', '/api/recommendations', {
      route: { geometry: [{ lat: 18.9, lng: 72.8 }], distance: 1000, duration: 60, source: 'osrm' },
    });
    expect(res.status).toBe(400);
  });

  it('returns 200 with empty results when DB returns no restaurants', async () => {
    const res = await request(app, 'POST', '/api/recommendations', {
      route: VALID_ROUTE,
      preferences: {},
    });
    expect(res.status).toBe(200);
    const body = res.body as Record<string, unknown>;
    expect(Array.isArray(body.data)).toBe(true);
    expect(body.total).toBe(0);
  });

  it('returns 200 with valid preferences object', async () => {
    const res = await request(app, 'POST', '/api/recommendations', {
      route: VALID_ROUTE,
      preferences: {
        vegetarianOnly: true,
        maxDetourMetres: 2000,
        meal: 'lunch',
        mode: 'strict',
      },
    });
    expect(res.status).toBe(200);
  });
});

describe('GET /api/demo/scenarios', () => {
  it('returns 5 demo scenarios', async () => {
    const res = await request(app, 'GET', '/api/demo/scenarios');
    expect(res.status).toBe(200);
    const body = res.body as Record<string, unknown>;
    expect(body.total).toBe(5);
    expect(Array.isArray(body.data)).toBe(true);
  });

  it('each scenario has required fields', async () => {
    const res = await request(app, 'GET', '/api/demo/scenarios');
    const scenarios = (res.body as Record<string, unknown>).data as Record<string, unknown>[];
    for (const s of scenarios) {
      expect(s.id).toBeDefined();
      expect(s.label).toBeDefined();
      expect(s.source).toBeDefined();
      expect(s.destination).toBeDefined();
    }
  });
});

describe('GET /api/demo/scenarios/:id', () => {
  it('returns scenario A', async () => {
    const res = await request(app, 'GET', '/api/demo/scenarios/A');
    expect(res.status).toBe(200);
    const body = res.body as Record<string, unknown>;
    expect((body.data as Record<string, unknown>).id).toBe('A');
  });

  it('returns 404 for unknown scenario', async () => {
    const res = await request(app, 'GET', '/api/demo/scenarios/Z');
    expect(res.status).toBe(404);
  });
});

describe('GET /api/restaurants', () => {
  it('returns 200 with data array', async () => {
    const res = await request(app, 'GET', '/api/restaurants');
    expect(res.status).toBe(200);
  });
});
