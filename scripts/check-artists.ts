import pg from 'pg';
import 'dotenv/config';
const { Pool } = pg;
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const r = await pool.query('SELECT id, name, slug FROM artists ORDER BY id');
console.log('Artists count:', r.rows.length);
console.table(r.rows);
await pool.end();
