const { Pool } = require('pg');
const fs = require('fs');

const pool = new Pool({
  connectionString: 'postgresql://neondb_owner:npg_jcmB61ryhgPk@ep-bold-surf-aeqws7il-pooler.c-2.us-east-2.aws.neon.tech/neondb?sslmode=require',
  ssl: { rejectUnauthorized: false }
});

const tables = [
  'users',
  'client_profiles',
  'supplier_profiles',
  'employee_profiles',
  'candidate_profiles',
  'service_requests',
  'quotations',
  'job_postings',
  'job_applications',
  'interviews',
  'documents',
  'messages',
  'notifications',
  'attendance',
  'leave_requests'
];

async function createFixedMigration() {
  let migrationSQL = '-- Corrected Migration: Rename snake_case columns to camelCase\n';
  migrationSQL += '-- Generated: ' + new Date().toISOString() + '\n';
  migrationSQL += '-- Only renames columns that contain underscores\n\n';
  migrationSQL += 'BEGIN;\n\n';

  for (const table of tables) {
    const result = await pool.query(`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name = $1
      AND column_name LIKE '%_%'
      ORDER BY ordinal_position
    `, [table]);

    if (result.rows.length > 0) {
      migrationSQL += `-- =====================================================\n`;
      migrationSQL += `-- ${table.toUpperCase()}\n`;
      migrationSQL += `-- =====================================================\n`;

      result.rows.forEach(row => {
        const snakeCase = row.column_name;
        const camelCase = snakeCase.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());

        // Only add if the names are different
        if (snakeCase !== camelCase) {
          migrationSQL += `ALTER TABLE ${table} RENAME COLUMN ${snakeCase} TO "${camelCase}";\n`;
        }
      });

      migrationSQL += '\n';
    }
  }

  migrationSQL += 'COMMIT;\n';

  fs.writeFileSync('./migrations/011_rename_to_camelCase_FIXED.sql', migrationSQL);

  console.log('✅ Fixed migration script created: migrations/011_rename_to_camelCase_FIXED.sql');

  await pool.end();
}

createFixedMigration().catch(err => {
  console.error('❌ Error:', err.message);
  pool.end();
  process.exit(1);
});
