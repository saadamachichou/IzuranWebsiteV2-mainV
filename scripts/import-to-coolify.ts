/**
 * Import schema + data to Coolify PostgreSQL.
 * 
 * 1. Set TARGET_DATABASE_URL in .env (your Coolify PostgreSQL URL)
 * 2. Run: npm run db:import
 * 
 * This will: push schema, then import the latest backup from backups/
 */
import pg from 'pg';
import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import 'dotenv/config';

const { Pool } = pg;

const targetUrl = process.env.TARGET_DATABASE_URL || process.env.COOLIFY_DATABASE_URL || process.env.DATABASE_URL;

if (!targetUrl) {
  console.error('Set DATABASE_URL (or TARGET_DATABASE_URL) in .env');
  process.exit(1);
}

async function run() {
  const backupDir = path.join(process.cwd(), 'backups');
  const backups = fs.existsSync(backupDir)
    ? fs.readdirSync(backupDir).filter((f) => f.endsWith('.sql')).sort().reverse()
    : [];

  if (backups.length === 0) {
    console.error('No backup found. Run "npm run db:export" first.');
    process.exit(1);
  }

  const backupFile = path.join(backupDir, backups[0]);
  console.log(`Using backup: ${backupFile}\n`);

  // Step 1: Push schema with drizzle-kit (use target URL)
  console.log('Step 1: Pushing schema to Coolify...');
  try {
    execSync(`npx drizzle-kit push --force --config=./drizzle.config.ts`, {
      env: { ...process.env, DATABASE_URL: targetUrl },
      stdio: 'inherit',
    });
    console.log('✓ Schema pushed\n');
  } catch (err) {
    console.error('Schema push failed. Ensure Coolify PostgreSQL is running and reachable.');
    process.exit(1);
  }

  // Step 2: Import data
  console.log('Step 2: Importing data...');
  const pool = new Pool({ connectionString: targetUrl });
  const sql = fs.readFileSync(backupFile, 'utf-8');

  // Split by statement (each ends with ;\n)
  const statements = sql
    .split(/;\s*\n/)
    .map((s) => s.trim())
    .filter((s) => s && !s.startsWith('--'));

  let imported = 0;
  try {
    for (const stmt of statements) {
      if (!stmt) continue;
      try {
        await pool.query(stmt + ';');
        if (stmt.toUpperCase().startsWith('INSERT')) imported++;
      } catch (err) {
        const msg = (err as Error).message;
        if (!msg.includes('does not exist') && !msg.includes('duplicate key')) {
          console.warn('Statement failed:', msg.slice(0, 100));
        }
      }
    }
    console.log(`  Imported ${imported} insert statements`);
    console.log('✓ Data imported\n');
  } finally {
    await pool.end();
  }

  console.log('Done! Update DATABASE_URL in .env to your Coolify URL and deploy.');
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
