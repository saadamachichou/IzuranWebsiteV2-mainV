import { Pool, neonConfig } from '@neondatabase/serverless';
import ws from 'ws';
import 'dotenv/config';

// Configure Neon to use WebSocket
neonConfig.webSocketConstructor = ws;

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL must be set');
}

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function migratePodcastDisplayOrder() {
  try {
    console.log('Adding display_order column to podcasts table...');
    
    // Add the display_order column
    await pool.query(`
      ALTER TABLE podcasts 
      ADD COLUMN IF NOT EXISTS display_order INTEGER DEFAULT 0
    `);
    
    console.log('Display order column added successfully');
    
    // Update existing podcasts with default display order
    await pool.query(`
      UPDATE podcasts 
      SET display_order = id 
      WHERE display_order IS NULL OR display_order = 0
    `);
    
    console.log('Existing podcasts updated with display order');
    
  } catch (err) {
    console.error('Error running migration:', err);
    if (err instanceof Error) {
      console.error('Error details:', {
        message: err.message,
        stack: err.stack
      });
    }
  } finally {
    // Close the pool
    await pool.end();
  }
}

migratePodcastDisplayOrder(); 