const { Pool } = require('pg');
const path = require('path');
const fs = require('fs');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

async function createFreshSchema() {
  console.log('\n🔨 Creating fresh camelCase schema...\n');
  console.log('═'.repeat(80));

  try {
    // Read the complete schema SQL file
    const schemaPath = path.join(__dirname, '001_COMPLETE_SCHEMA_CAMELCASE.sql');
    let schemaSql = fs.readFileSync(schemaPath, 'utf-8');

    // Replace all snake_case ENUM type names with camelCase
    const enumReplacements = {
      'user_role_enum': 'userRoleEnum',
      'priority_enum': 'priorityEnum',
      'request_status_enum': 'requestStatusEnum',
      'quotation_status_enum': 'quotationStatusEnum',
      'document_category_enum': 'documentCategoryEnum',
      'message_type_enum': 'messageTypeEnum',
      'notification_type_enum': 'notificationTypeEnum',
      'attendance_status_enum': 'attendanceStatusEnum',
      'leave_type_enum': 'leaveTypeEnum',
      'leave_status_enum': 'leaveStatusEnum',
      'job_type_enum': 'jobTypeEnum',
      'job_status_enum': 'jobStatusEnum',
      'application_status_enum': 'applicationStatusEnum',
      'interview_status_enum': 'interviewStatusEnum',
      'assignment_status_enum': 'assignmentStatusEnum',
      'assignment_priority_enum': 'assignmentPriorityEnum',
      'visa_type_enum': 'visaTypeEnum',
      'visa_status_enum': 'visaStatusEnum',
      'visa_notification_type': 'visaNotificationType'
    };

    // Replace all occurrences
    for (const [oldName, newName] of Object.entries(enumReplacements)) {
      schemaSql = schemaSql.replace(new RegExp(oldName, 'g'), `"${newName}"`);
    }

    console.log('📝 Running schema creation...\n');

    // Execute the modified SQL
    await pool.query(schemaSql);

    console.log('✅ Schema created successfully!\n');

    // Verify
    const tables = await pool.query(`
      SELECT table_name FROM information_schema.tables
      WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
      ORDER BY table_name
    `);

    const types = await pool.query(`
      SELECT typname FROM pg_type
      WHERE typtype = 'e' AND typnamespace = 'public'::regnamespace
      ORDER BY typname
    `);

    console.log('📊 Created tables:', tables.rows.length);
    console.log('📊 Created ENUM types:', types.rows.length);

    console.log('\n✅ Database schema ready!\n');

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

createFreshSchema();
