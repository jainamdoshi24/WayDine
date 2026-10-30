import { Router, Request, Response, NextFunction } from 'express';
import { query } from '../db/pool.js';
import { Restaurant } from '../types/index.js';

export const restaurantsRouter = Router();

/**
 * GET /api/restaurants
 * Returns all restaurants with optional filters.
 * Query params: cuisine, vegetarian, maxPrice, limit, offset
 */
restaurantsRouter.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const {
      cuisine,
      vegetarian,
      maxPrice,
      limit = '100',
      offset = '0',
    } = req.query as Record<string, string>;

    const conditions: string[] = [];
    const params: unknown[] = [];
    let paramIndex = 1;

    if (cuisine) {
      conditions.push(`LOWER(cuisine) ILIKE $${paramIndex++}`);
      params.push(`%${cuisine.toLowerCase()}%`);
    }

    if (vegetarian === 'true') {
      conditions.push(`(is_vegetarian = true OR has_vegetarian_options = true)`);
    }

    if (maxPrice) {
      const priceNum = parseInt(maxPrice, 10);
      if (!isNaN(priceNum) && priceNum >= 1 && priceNum <= 4) {
        conditions.push(`price_level <= $${paramIndex++}`);
        params.push(priceNum);
      }
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    const limitVal = Math.min(parseInt(limit, 10) || 100, 500);
    const offsetVal = parseInt(offset, 10) || 0;

    const sql = `
      SELECT 
        id, name, address, latitude, longitude,
        entrance_lat, entrance_lng, cuisine, price_level,
        is_vegetarian, has_vegetarian_options,
        opening_hours, food_availability,
        is_roadside, highway_access,
        rating, review_count, phone, website, image_url,
        data_source, is_demo, verified_at, created_at
      FROM restaurants
      ${whereClause}
      ORDER BY name ASC
      LIMIT $${paramIndex++} OFFSET $${paramIndex++}
    `;
    params.push(limitVal, offsetVal);

    const { rows, rowCount } = await query<Restaurant>(sql, params);

    res.json({
      data: rows,
      total: rowCount,
      limit: limitVal,
      offset: offsetVal,
    });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/restaurants/:id
 */
restaurantsRouter.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      res.status(400).json({ error: 'Invalid restaurant ID', code: 'INVALID_ID' });
      return;
    }

    const { rows } = await query<Restaurant>(
      `SELECT * FROM restaurants WHERE id = $1`,
      [id]
    );

    if (rows.length === 0) {
      res.status(404).json({ error: 'Restaurant not found', code: 'NOT_FOUND' });
      return;
    }

    res.json({ data: rows[0] });
  } catch (err) {
    next(err);
  }
});
