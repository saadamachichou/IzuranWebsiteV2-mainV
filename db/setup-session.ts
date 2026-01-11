import { Pool, neonConfig } from '@neondatabase/serverless';
import ws from 'ws';
import 'dotenv/config';

// Configure Neon to use WebSocket
neonConfig.webSocketConstructor = ws;

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL must be set');
}

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

/**
 * Create the session table required by connect-pg-simple
 */
async function setupSessionTable() {
  try {
    console.log('Attempting to connect to database...');
    
    // Test connection first
    const testResult = await pool.query('SELECT NOW()');
    console.log('Test query successful:', testResult.rows[0]);
    
    // Create the session table
    console.log('Creating session table...');
    await pool.query(`
      CREATE TABLE IF NOT EXISTS "session" (
        "sid" varchar NOT NULL COLLATE "default",
        "sess" json NOT NULL,
        "expire" timestamp(6) NOT NULL,
        CONSTRAINT "session_pkey" PRIMARY KEY ("sid")
      )
    `);
    
    // Create index on expire field
    console.log('Creating session index...');
    await pool.query(`
      CREATE INDEX IF NOT EXISTS "IDX_session_expire" ON "session" ("expire")
    `);
    
    console.log('Session table setup complete');
  } catch (err) {
    console.error('Error setting up session table:', err);
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

setupSessionTable();