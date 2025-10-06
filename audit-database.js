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

async function auditDatabase() {
  let output = '# Database Schema Audit - snake_case Columns\n\n';
  let migrationSQL = '-- Corrected Migration: Rename all columns to camelCase\n';
  migrationSQL += '-- Generated: ' + new Date().toISOString() + '\n\n';
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
      output += `## ${table} (${result.rows.length} columns)\n`;
      migrationSQL += `-- =====================================================\n`;
      migrationSQL += `-- ${table.toUpperCase()}\n`;
      migrationSQL += `-- =====================================================\n`;

      result.rows.forEach(row => {
        const snakeCase = row.column_name;
        const camelCase = snakeCase.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());

        output += `- ${snakeCase} → "${camelCase}"\n`;
        migrationSQL += `ALTER TABLE ${table} RENAME COLUMN ${snakeCase} TO "${camelCase}";\n`;
      });

      output += '\n';
      migrationSQL += '\n';
    }
  }

  migrationSQL += 'COMMIT;\n';

  // Save files
  fs.writeFileSync('./db-audit.md', output);
  fs.writeFileSync('./migrations/011_rename_to_camelCase_CORRECTED.sql', migrationSQL);

  console.log('✅ Audit complete!');
  console.log('📄 Audit report saved to: db-audit.md');
  console.log('📄 Migration script saved to: migrations/011_rename_to_camelCase_CORRECTED.sql');
  console.log('\n' + output);

  await pool.end();
}

auditDatabase().catch(err => {
  console.error('❌ Audit failed:', err.message);
  pool.end();
  process.exit(1);
});
