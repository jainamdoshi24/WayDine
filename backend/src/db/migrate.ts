import pool from './pool';

const migrations = [
  `
  CREATE EXTENSION IF NOT EXISTS postgis;
  `,
  `
  CREATE TABLE IF NOT EXISTS restaurants (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    address TEXT NOT NULL,
    latitude DOUBLE PRECISION NOT NULL,
    longitude DOUBLE PRECISION NOT NULL,
    entrance_lat DOUBLE PRECISION,
    entrance_lng DOUBLE PRECISION,
    cuisine VARCHAR(100) NOT NULL,
    price_level INTEGER CHECK (price_level BETWEEN 1 AND 4) DEFAULT 2,
    is_vegetarian BOOLEAN DEFAULT false,
    has_vegetarian_options BOOLEAN DEFAULT false,
    opening_hours JSONB DEFAULT '{}',
    food_availability JSONB DEFAULT '{"breakfast": false, "lunch": true, "dinner": true, "snacks": true}',
    is_roadside BOOLEAN DEFAULT true,
    highway_access TEXT,
    rating NUMERIC(2,1) CHECK (rating BETWEEN 1.0 AND 5.0),
    review_count INTEGER DEFAULT 0,
    phone VARCHAR(50),
    website VARCHAR(500),
    image_url VARCHAR(500),
    data_source VARCHAR(100) DEFAULT 'synthetic_demo',
    is_demo BOOLEAN DEFAULT true,
    verified_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
  );
  `,
  `
  DO $$
  BEGIN
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'restaurants' AND column_name = 'location'
    ) THEN
      ALTER TABLE restaurants 
      ADD COLUMN location GEOMETRY(POINT, 4326);
    END IF;
  END $$;
  `,
  `
  CREATE OR REPLACE FUNCTION update_restaurant_location()
  RETURNS TRIGGER AS $$
  BEGIN
    NEW.location = ST_SetSRID(ST_MakePoint(NEW.longitude, NEW.latitude), 4326);
    RETURN NEW;
  END;
  $$ LANGUAGE plpgsql;
  `,
  `
  DROP TRIGGER IF EXISTS restaurants_location_trigger ON restaurants;
  CREATE TRIGGER restaurants_location_trigger
    BEFORE INSERT OR UPDATE ON restaurants
    FOR EACH ROW EXECUTE FUNCTION update_restaurant_location();
  `,
  `
  CREATE INDEX IF NOT EXISTS idx_restaurants_location 
    ON restaurants USING GIST(location);
  `,
  `
  CREATE INDEX IF NOT EXISTS idx_restaurants_cuisine ON restaurants(cuisine);
  `,
  `
  CREATE INDEX IF NOT EXISTS idx_restaurants_price ON restaurants(price_level);
  `,
  `
  CREATE TABLE IF NOT EXISTS route_cache (
    id SERIAL PRIMARY KEY,
    cache_key VARCHAR(100) UNIQUE NOT NULL,
    route_data JSONB NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ DEFAULT NOW() + INTERVAL '24 hours'
  );
  `,
  `
  CREATE INDEX IF NOT EXISTS idx_route_cache_key ON route_cache(cache_key);
  `,
];

async function runMigrations() {
  const client = await pool.connect();
  try {
    console.log('🔄 Running database migrations...');

    // Try PostGIS first, fall back gracefully
    for (const migration of migrations) {
      try {
        await client.query(migration);
      } catch (err: unknown) {
        const error = err as { message?: string };
        // PostGIS may not be available — skip spatial parts gracefully
        if (error.message?.includes('postgis') || error.message?.includes('geometry') || error.message?.includes('ST_')) {
          console.warn('⚠️  PostGIS not available, skipping spatial migration:', error.message?.substring(0, 80));
        } else {
          throw err;
        }
      }
    }

    console.log('✅ Migrations complete.');
  } finally {
    client.release();
  }
  await pool.end();
}

runMigrations().catch((err) => {
  console.error('❌ Migration failed:', err.message);
  process.exit(1);
});
