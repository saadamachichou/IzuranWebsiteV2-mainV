/**
 * Export data from Neon (or any PostgreSQL) to a SQL backup file.
 * Uses pg client - no pg_dump required.
 * Run: npm run db:export
 */
import pg from 'pg';
import fs from 'fs';
import path from 'path';
import 'dotenv/config';

const { Pool } = pg;

// Tables in dependency order (parents before children) for FK constraints
const TABLE_ORDER = [
  'artists',
  'events',
  'streams',
  'articles',
  'gallery_items',
  'contact_messages',
  'delivery_personnel',
  'users',
  'podcasts',
  'products',
  'favorite_podcasts',
  'orders',
  'order_items',
  'event_ticket_limits',
  'tickets',
  'ticket_validation_logs',
  'session',
];

function escapeSql(val: unknown): string {
  if (val === null) return 'NULL';
  if (typeof val === 'boolean') return val ? 'TRUE' : 'FALSE';
  if (typeof val === 'number') return String(val);
  if (val instanceof Date) return `'${val.toISOString()}'`;
  if (typeof val === 'object') return `'${JSON.stringify(val).replace(/'/g, "''")}'`;
  return `'${String(val).replace(/'/g, "''").replace(/\\/g, '\\\\')}'`;
}

async function exportDatabase() {
  if (!process.env.DATABASE_URL) {
    console.error('DATABASE_URL must be set in .env');
    process.exit(1);
  }

  const backupDir = path.join(process.cwd(), 'backups');
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  const backupFile = path.join(backupDir, `neon_backup_${timestamp}.sql`);

  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
  }

  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const lines: string[] = [
    '-- Izuran Database Export',
    `-- Exported at ${new Date().toISOString()}`,
    '-- Run db:push first on target DB, then import this file',
    '',
  ];

  try {
    // Get actual tables that exist
    const tablesResult = await pool.query(`
      SELECT tablename FROM pg_tables WHERE schemaname = 'public'
    `);
    const existingTables = new Set(tablesResult.rows.map((r) => r.tablename));

    // Process in dependency order
    const tables = TABLE_ORDER.filter((t) => existingTables.has(t));
    const extraTables = [...existingTables].filter((t) => !TABLE_ORDER.includes(t));
    const allTables = [...tables, ...extraTables];

    for (const table of allTables) {
      try {
        const result = await pool.query(`SELECT * FROM "${table}"`);
        if (result.rows.length === 0) continue;

        const columns = result.fields.map((f) => f.name);
        lines.push(`-- Table: ${table} (${result.rows.length} rows)`);
        lines.push(`TRUNCATE TABLE "${table}" CASCADE;`);
        lines.push('');

        for (const row of result.rows) {
          const values = columns.map((col) => escapeSql(row[col]));
          lines.push(`INSERT INTO "${table}" (${columns.map((c) => `"${c}"`).join(', ')}) VALUES (${values.join(', ')});`);
        }
        lines.push('');
        console.log(`  Exported ${table}: ${result.rows.length} rows`);
      } catch (err) {
        console.warn(`  Skipped ${table}:`, (err as Error).message);
      }
    }

    fs.writeFileSync(backupFile, lines.join('\n'), 'utf-8');
    console.log(`\n✓ Backup saved to: ${backupFile}`);
  } finally {
    await pool.end();
  }
}

exportDatabase().catch((err) => {
  console.error('Export failed:', err);
  process.exit(1);
});
