import { Pool, neonConfig } from '@neondatabase/serverless';
import ws from 'ws';
import 'dotenv/config';

// Configure Neon to use WebSocket
neonConfig.webSocketConstructor = ws;

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL must be set');
}

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function createTestProduct() {
  try {
    console.log('Creating test product...');
    
    // Create product_type enum if it doesn't exist
    await pool.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'product_type') THEN
          CREATE TYPE product_type AS ENUM ('physical', 'digital');
        END IF;
      END
      $$;
    `);
    
    // Create product_category enum if it doesn't exist
    await pool.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'product_category') THEN
          CREATE TYPE product_category AS ENUM ('vinyl', 'digital', 'merch', 'clothing', 'accessories', 'other');
        END IF;
      END
      $$;
    `);
    
    // Insert test product
    const result = await pool.query(`
      INSERT INTO products (
        name, slug, description, image_url, price, currency, 
        category, product_type, stock_level, is_new_release
      ) VALUES (
        'Test Product',
        'test-product',
        'This is a test product',
        'https://example.com/image.jpg',
        29.99,
        'MAD',
        'vinyl',
        'physical',
        10,
        true
      ) RETURNING *;
    `);
    
    console.log('Test product created:', result.rows[0]);
    
  } catch (err) {
    console.error('Error creating test product:', err);
  } finally {
    await pool.end();
  }
}

createTestProduct(); 