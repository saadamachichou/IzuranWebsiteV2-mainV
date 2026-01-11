import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from 'ws';
import * as schema from '../shared/schema';
import { sql } from 'drizzle-orm';

// Configure Neon for WebSockets
neonConfig.webSocketConstructor = ws;

// Connect to the database
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const db = drizzle(pool);

async function migrateProductsTable() {
  console.log('Starting migration of products table...');
  
  try {
    // Create product_type enum
    await pool.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'product_type') THEN
          CREATE TYPE product_type AS ENUM ('physical', 'digital');
        END IF;
      END
      $$;
    `);
    console.log('Created product_type enum if it didn\'t exist');
    
    // Create product_category enum
    await pool.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'product_category') THEN
          CREATE TYPE product_category AS ENUM ('vinyl', 'digital', 'merch', 'clothing', 'accessories', 'other');
        END IF;
      END
      $$;
    `);
    console.log('Created product_category enum if it didn\'t exist');
    
    // Add new columns to products table
    const columnsToAdd = [
      { name: 'currency', type: 'TEXT', default: '\'MAD\'' },
      { name: 'product_type', type: 'product_type' },
      { name: 'stock_level', type: 'INTEGER', default: '0' },
      { name: 'cmi_product_id', type: 'TEXT' },
      { name: 'paypal_product_id', type: 'TEXT' },
      { name: 'digital_file_url', type: 'TEXT' },
      { name: 'updated_at', type: 'TIMESTAMP' }
    ];
    
    // Check which columns need to be added
    const existingColumns = await pool.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'products' AND table_schema = 'public'
    `);
    
    const existingColumnNames = existingColumns.rows.map(row => row.column_name);
    
    // Add columns if they don't exist
    for (const column of columnsToAdd) {
      if (!existingColumnNames.includes(column.name)) {
        let query = `ALTER TABLE products ADD COLUMN ${column.name} ${column.type}`;
        
        if (column.default) {
          query += ` DEFAULT ${column.default}`;
        }
        
        console.log(`Adding column ${column.name} to products table...`);
        await pool.query(query);
      }
    }
    
    // Add archived column if it doesn't exist
    if (!existingColumnNames.includes('archived')) {
      console.log('Adding archived column to products table...');
      await pool.query(`ALTER TABLE products ADD COLUMN archived BOOLEAN DEFAULT FALSE`);
    }
    
    // Convert category column to use the enum
    // First, create a temporary column with the new enum type
    await pool.query(`ALTER TABLE products ADD COLUMN temp_category product_category`);
    
    // Map existing categories to enum values
    await pool.query(`
      UPDATE products 
      SET temp_category = 
        CASE 
          WHEN category ~* 'vinyl' THEN 'vinyl'::product_category
          WHEN category ~* 'digital' THEN 'digital'::product_category
          WHEN category ~* 'merch' THEN 'merch'::product_category
          WHEN category ~* 'clothing' THEN 'clothing'::product_category
          WHEN category ~* 'accessory' OR category ~* 'accessories' THEN 'accessories'::product_category
          ELSE 'other'::product_category
        END
    `);
    
    // Drop the original category column
    await pool.query(`ALTER TABLE products DROP COLUMN category`);
    
    // Rename the temp column to category
    await pool.query(`ALTER TABLE products RENAME COLUMN temp_category TO category`);
    
    // Set not null constraint
    await pool.query(`ALTER TABLE products ALTER COLUMN category SET NOT NULL`);
    
    // Set a default product_type based on category
    await pool.query(`
      UPDATE products
      SET product_type = 
        CASE 
          WHEN category IN ('vinyl', 'merch', 'clothing', 'accessories') THEN 'physical'::product_type
          WHEN category IN ('digital') THEN 'digital'::product_type
          ELSE 'physical'::product_type
        END
      WHERE product_type IS NULL
    `);
    
    console.log('Products table migration completed successfully');
  } catch (error) {
    console.error('Error during products table migration:', error);
    throw error;
  }
}

async function migrateOrdersTable() {
  console.log('Starting migration of orders table...');
  
  try {
    // Create payment_method enum
    await pool.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'payment_method') THEN
          CREATE TYPE payment_method AS ENUM ('cmi', 'paypal');
        END IF;
      END
      $$;
    `);
    console.log('Created payment_method enum if it didn\'t exist');
    
    // Create order_status enum
    await pool.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'order_status') THEN
          CREATE TYPE order_status AS ENUM ('pending', 'paid', 'shipped', 'delivered', 'cancelled', 'refunded');
        END IF;
      END
      $$;
    `);
    console.log('Created order_status enum if it didn\'t exist');
    
    // Add new columns to orders table
    const columnsToAdd = [
      { name: 'currency', type: 'TEXT', default: '\'MAD\'' },
      { name: 'payment_method', type: 'payment_method' },
      { name: 'payment_id', type: 'TEXT' },
      { name: 'cmi_session_url', type: 'TEXT' },
      { name: 'paypal_order_id', type: 'TEXT' },
      { name: 'customer_email', type: 'TEXT' },
      { name: 'customer_name', type: 'TEXT' },
      { name: 'shipping_address', type: 'TEXT' },
      { name: 'billing_address', type: 'TEXT' },
      { name: 'tracking_number', type: 'TEXT' },
      { name: 'notes', type: 'TEXT' }
    ];
    
    // Check which columns need to be added
    const existingColumns = await pool.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'orders' AND table_schema = 'public'
    `);
    
    const existingColumnNames = existingColumns.rows.map(row => row.column_name);
    
    // Add columns if they don't exist
    for (const column of columnsToAdd) {
      if (!existingColumnNames.includes(column.name)) {
        let query = `ALTER TABLE orders ADD COLUMN ${column.name} ${column.type}`;
        
        if (column.default) {
          query += ` DEFAULT ${column.default}`;
        }
        
        console.log(`Adding column ${column.name} to orders table...`);
        await pool.query(query);
      }
    }
    
    // Drop default from status column
    await pool.query(`ALTER TABLE orders ALTER COLUMN status DROP DEFAULT`);
    
    // Convert status column to use the enum
    await pool.query(`
      ALTER TABLE orders 
      ALTER COLUMN status TYPE order_status 
      USING 
        CASE 
          WHEN status = 'pending' THEN 'pending'::order_status
          WHEN status = 'paid' THEN 'paid'::order_status
          WHEN status = 'shipped' THEN 'shipped'::order_status
          WHEN status = 'delivered' THEN 'delivered'::order_status
          WHEN status = 'cancelled' THEN 'cancelled'::order_status
          WHEN status = 'refunded' THEN 'refunded'::order_status
          ELSE 'pending'::order_status
        END
    `);
    
    // Set default back
    await pool.query(`ALTER TABLE orders ALTER COLUMN status SET DEFAULT 'pending'::order_status`);
    
    console.log('Orders table migration completed successfully');
  } catch (error) {
    console.error('Error during orders table migration:', error);
    throw error;
  }
}

async function run() {
  try {
    await migrateProductsTable();
    await migrateOrdersTable();
    console.log('All migrations completed successfully!');
  } catch (error) {
    console.error('Migration failed:', error);
  } finally {
    await pool.end();
  }
}

run();