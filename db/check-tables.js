import 'dotenv/config';
import { pool } from './index.js';

async function checkTables() {
  try {
    console.log('🔍 Checking database tables and data...\n');
    
    // Check what tables exist
    const tablesResult = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `);
    
    console.log('📋 Available tables:');
    tablesResult.rows.forEach(row => {
      console.log(`  - ${row.table_name}`);
    });
    
    console.log('\n📊 Data counts:');
    
    // Check data in each table
    for (const row of tablesResult.rows) {
      const tableName = row.table_name;
      try {
        const countResult = await pool.query(`SELECT COUNT(*) as count FROM "${tableName}"`);
        const count = countResult.rows[0].count;
        console.log(`  ${tableName}: ${count} records`);
        
        // Show sample data for tables with data
        if (count > 0 && count <= 10) {
          const sampleResult = await pool.query(`SELECT * FROM "${tableName}" LIMIT 3`);
          console.log(`    Sample: ${JSON.stringify(sampleResult.rows[0], null, 2).substring(0, 100)}...`);
        }
      } catch (error) {
        console.log(`  ${tableName}: Error - ${error.message}`);
      }
    }
    
    // Check specific important tables
    console.log('\n🎯 Checking key data:');
    
    try {
      const artistsResult = await pool.query('SELECT id, name, slug FROM artists LIMIT 5');
      console.log(`  Artists: ${artistsResult.rows.length} found`);
      artistsResult.rows.forEach(artist => {
        console.log(`    - ${artist.name} (${artist.slug})`);
      });
    } catch (error) {
      console.log(`  Artists: Error - ${error.message}`);
    }
    
    try {
      const productsResult = await pool.query('SELECT id, name, slug FROM products LIMIT 5');
      console.log(`  Products: ${productsResult.rows.length} found`);
      productsResult.rows.forEach(product => {
        console.log(`    - ${product.name} (${product.slug})`);
      });
    } catch (error) {
      console.log(`  Products: Error - ${error.message}`);
    }
    
    try {
      const eventsResult = await pool.query('SELECT id, name, slug FROM events LIMIT 5');
      console.log(`  Events: ${eventsResult.rows.length} found`);
      eventsResult.rows.forEach(event => {
        console.log(`    - ${event.name} (${event.slug})`);
      });
    } catch (error) {
      console.log(`  Events: Error - ${error.message}`);
    }
    
  } catch (error) {
    console.error('❌ Error checking tables:', error);
  } finally {
    await pool.end();
  }
}

checkTables();
