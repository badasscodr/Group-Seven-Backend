const { Pool } = require('pg');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

async function fixTableNames() {
  console.log('\n🔧 Renaming tables to camelCase...\n');
  console.log('═'.repeat(80));

  try {
    const renames = [
      { old: 'candidate_profiles', new: 'candidateProfiles' },
      { old: 'client_profiles', new: 'clientProfiles' },
      { old: 'employee_assignments', new: 'employeeAssignments' },
      { old: 'employee_profiles', new: 'employeeProfiles' },
      { old: 'job_applications', new: 'jobApplications' },
      { old: 'job_postings', new: 'jobPostings' },
      { old: 'leave_requests', new: 'leaveRequests' },
      { old: 'service_categories', new: 'serviceCategories' },
      { old: 'service_requests', new: 'serviceRequests' },
      { old: 'supplier_profiles', new: 'supplierProfiles' },
      { old: 'task_assignments', new: 'taskAssignments' },
      { old: 'visa_documents', new: 'visaDocuments' },
      { old: 'visa_notifications', new: 'visaNotifications' }
    ];

    for (const rename of renames) {
      await pool.query(`ALTER TABLE ${rename.old} RENAME TO "${rename.new}"`);
      console.log(`✅ Renamed: ${rename.old} → ${rename.new}`);
    }

    // Fix the ENUM type
    console.log('\n🔧 Fixing ENUM type...\n');
    await pool.query(`ALTER TYPE assignment_priorityenum RENAME TO "assignmentPriorityEnum"`);
    console.log('✅ Renamed: assignment_priorityenum → assignmentPriorityEnum');

    console.log('\n' + '═'.repeat(80));
    console.log('\n✅ ALL TABLES AND TYPES RENAMED TO CAMELCASE!\n');

    // Verify
    const tables = await pool.query(`
      SELECT table_name FROM information_schema.tables
      WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
      AND table_name LIKE '%\_%'
    `);

    const types = await pool.query(`
      SELECT typname FROM pg_type
      WHERE typtype = 'e' AND typnamespace = 'public'::regnamespace
      AND typname LIKE '%\_%'
    `);

    console.log(`📊 Remaining snake_case tables: ${tables.rows.length}`);
    console.log(`📊 Remaining snake_case ENUM types: ${types.rows.length}\n`);

    if (tables.rows.length === 0 && types.rows.length === 0) {
      console.log('✅ 100% CAMELCASE VERIFIED!\n');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

fixTableNames();
