/**
 * Cloud Database Migration Script
 * Executes migration on Neon PostgreSQL
 */

const { Client } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const runMigration = async () => {
  console.log('\n========================================');
  console.log('GROUP SEVEN DATABASE MIGRATION');
  console.log('========================================\n');

  console.log('⚠️  WARNING: This will DELETE ALL DATA!\n');

  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    console.log('📡 Connecting to database...');
    await client.connect();
    console.log('✅ Connected successfully!\n');

    // Step 1: Drop all tables
    console.log('[1/3] 🗑️  Dropping all existing tables...');
    const dropSQL = fs.readFileSync(
      path.join(__dirname, '000_DROP_ALL_TABLES.sql'),
      'utf8'
    );
    await client.query(dropSQL);
    console.log('✅ All tables dropped\n');

    // Step 2: Create schema
    console.log('[2/3] 🏗️  Creating new schema with camelCase...');
    const schemaSQL = fs.readFileSync(
      path.join(__dirname, '001_COMPLETE_SCHEMA_CAMELCASE.sql'),
      'utf8'
    );
    await client.query(schemaSQL);
    console.log('✅ Schema created successfully\n');

    // Step 3: Insert seed data
    console.log('[3/3] 🌱 Inserting seed data...');
    const seedSQL = fs.readFileSync(
      path.join(__dirname, '002_SEED_DATA.sql'),
      'utf8'
    );
    await client.query(seedSQL);
    console.log('✅ Seed data inserted\n');

    // Verify migration
    console.log('🔍 Verifying migration...');
    const tablesResult = await client.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      ORDER BY table_name
    `);

    console.log(`\n✅ Migration completed! ${tablesResult.rows.length} tables created:`);
    tablesResult.rows.forEach(row => {
      console.log(`   - ${row.table_name}`);
    });

    // Test query
    console.log('\n🧪 Testing camelCase columns...');
    const testResult = await client.query(`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name = 'users'
      ORDER BY ordinal_position
      LIMIT 5
    `);

    console.log('First 5 columns in users table:');
    testResult.rows.forEach(row => {
      console.log(`   - ${row.column_name}`);
    });

    console.log('\n========================================');
    console.log('✅ MIGRATION COMPLETED SUCCESSFULLY!');
    console.log('========================================\n');
    console.log('Database is now using camelCase naming throughout.');
    console.log('All backend services must use quoted identifiers.\n');

  } catch (error) {
    console.error('\n❌ Migration failed:', error.message);
    console.error('Error details:', error);
    process.exit(1);
  } finally {
    await client.end();
    console.log('📡 Database connection closed.\n');
  }
};

runMigration();
