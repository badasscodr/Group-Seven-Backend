const { Pool } = require('pg');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

async function checkAllObjects() {
  console.log('\n🔍 CHECKING ALL POSTGRESQL OBJECTS...\n');

  try {
    // Check sequences
    console.log('📋 SEQUENCES:');
    const sequences = await pool.query(`
      SELECT sequencename
      FROM pg_sequences
      WHERE schemaname = 'public'
      ORDER BY sequencename
    `);
    sequences.rows.forEach(r => console.log(`  ${r.sequencename}`));
    console.log(`Total: ${sequences.rows.length}\n`);

    // Check triggers
    console.log('📋 TRIGGERS:');
    const triggers = await pool.query(`
      SELECT trigger_name, event_object_table
      FROM information_schema.triggers
      WHERE trigger_schema = 'public'
      ORDER BY event_object_table, trigger_name
    `);
    triggers.rows.forEach(r => console.log(`  ${r.event_object_table} → ${r.trigger_name}`));
    console.log(`Total: ${triggers.rows.length}\n`);

    // Check functions
    console.log('📋 FUNCTIONS:');
    const functions = await pool.query(`
      SELECT proname
      FROM pg_proc
      WHERE pronamespace = 'public'::regnamespace
      ORDER BY proname
    `);
    functions.rows.forEach(r => console.log(`  ${r.proname}`));
    console.log(`Total: ${functions.rows.length}\n`);

    // Check views
    console.log('📋 VIEWS:');
    const views = await pool.query(`
      SELECT table_name
      FROM information_schema.views
      WHERE table_schema = 'public'
      ORDER BY table_name
    `);
    views.rows.forEach(r => console.log(`  ${r.table_name}`));
    console.log(`Total: ${views.rows.length}\n`);

    // Check foreign keys with details
    console.log('📋 FOREIGN KEY DETAILS:');
    const fkeys = await pool.query(`
      SELECT
        tc.table_name,
        kcu.column_name,
        ccu.table_name AS foreign_table_name,
        ccu.column_name AS foreign_column_name,
        tc.constraint_name
      FROM information_schema.table_constraints AS tc
      JOIN information_schema.key_column_usage AS kcu
        ON tc.constraint_name = kcu.constraint_name
        AND tc.table_schema = kcu.table_schema
      JOIN information_schema.constraint_column_usage AS ccu
        ON ccu.constraint_name = tc.constraint_name
        AND ccu.table_schema = tc.table_schema
      WHERE tc.constraint_type = 'FOREIGN KEY'
      AND tc.table_schema = 'public'
      ORDER BY tc.table_name, kcu.column_name
    `);

    fkeys.rows.forEach(r => {
      console.log(`  ${r.table_name}.${r.column_name} → ${r.foreign_table_name}.${r.foreign_column_name}`);
      console.log(`    Constraint: ${r.constraint_name}\n`);
    });
    console.log(`Total foreign keys: ${fkeys.rows.length}\n`);

  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await pool.end();
  }
}

checkAllObjects();
