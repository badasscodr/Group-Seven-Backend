const { Pool } = require('pg');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

async function dropAllTables() {
  console.log('\n⚠️  WARNING: DROPPING ALL TABLES AND DATA!\n');
  console.log('═'.repeat(80));

  try {
    console.log('🗑️  Dropping all tables in reverse dependency order...\n');

    // Drop tables in reverse dependency order
    const dropCommands = [
      'DROP TABLE IF EXISTS "visaNotifications" CASCADE',
      'DROP TABLE IF EXISTS "taskAssignments" CASCADE',
      'DROP TABLE IF EXISTS "visaDocuments" CASCADE',
      'DROP TABLE IF EXISTS "employeeAssignments" CASCADE',
      'DROP TABLE IF EXISTS payments CASCADE',
      'DROP TABLE IF EXISTS attendance CASCADE',
      'DROP TABLE IF EXISTS "candidateProfiles" CASCADE',
      'DROP TABLE IF EXISTS "clientProfiles" CASCADE',
      'DROP TABLE IF EXISTS documents CASCADE',
      'DROP TABLE IF EXISTS "employeeProfiles" CASCADE',
      'DROP TABLE IF EXISTS interviews CASCADE',
      'DROP TABLE IF EXISTS "jobApplications" CASCADE',
      'DROP TABLE IF EXISTS "jobPostings" CASCADE',
      'DROP TABLE IF EXISTS "leaveRequests" CASCADE',
      'DROP TABLE IF EXISTS messages CASCADE',
      'DROP TABLE IF EXISTS notifications CASCADE',
      'DROP TABLE IF EXISTS projects CASCADE',
      'DROP TABLE IF EXISTS quotations CASCADE',
      'DROP TABLE IF EXISTS "serviceRequests" CASCADE',
      'DROP TABLE IF EXISTS "supplierProfiles" CASCADE',
      'DROP TABLE IF EXISTS "serviceCategories" CASCADE',
      'DROP TABLE IF EXISTS users CASCADE'
    ];

    for (const cmd of dropCommands) {
      const tableName = cmd.match(/TABLE IF EXISTS (.+?) CASCADE/)[1];
      await pool.query(cmd);
      console.log(`✅ Dropped: ${tableName}`);
    }

    console.log('\n🗑️  Dropping all ENUM types...\n');

    const enumTypes = [
      'applicationStatusEnum',
      'assignmentPriorityEnum',
      'assignmentStatusEnum',
      'attendanceStatusEnum',
      'documentCategoryEnum',
      'interviewStatusEnum',
      'jobStatusEnum',
      'jobTypeEnum',
      'leaveStatusEnum',
      'leaveTypeEnum',
      'messageTypeEnum',
      'notificationTypeEnum',
      'priorityEnum',
      'quotationStatusEnum',
      'requestStatusEnum',
      'userRoleEnum',
      'visaNotificationType',
      'visaStatusEnum',
      'visaTypeEnum'
    ];

    for (const enumType of enumTypes) {
      await pool.query(`DROP TYPE IF EXISTS "${enumType}" CASCADE`);
      console.log(`✅ Dropped ENUM: ${enumType}`);
    }

    console.log('\n🗑️  Dropping functions...\n');
    await pool.query('DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE');
    console.log('✅ Dropped function: update_updated_at_column');

    console.log('\n' + '═'.repeat(80));
    console.log('\n✅ ALL TABLES, TYPES, AND FUNCTIONS DROPPED!\n');

    // Verify nothing remains
    const tables = await pool.query(`
      SELECT table_name FROM information_schema.tables
      WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
    `);

    const types = await pool.query(`
      SELECT typname FROM pg_type
      WHERE typtype = 'e' AND typnamespace = 'public'::regnamespace
    `);

    console.log(`📊 Remaining tables: ${tables.rows.length}`);
    console.log(`📊 Remaining ENUM types: ${types.rows.length}`);

    if (tables.rows.length === 0 && types.rows.length === 0) {
      console.log('\n✅ Database is completely clean!\n');
    } else {
      console.log('\n⚠️  Some objects still remain:');
      tables.rows.forEach(r => console.log(`  Table: ${r.table_name}`));
      types.rows.forEach(r => console.log(`  Type: ${r.typname}`));
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

dropAllTables();
