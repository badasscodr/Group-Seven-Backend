import pool from '../core/config/database';

async function addUpdatedAtColumns() {
  try {
    console.log('🔧 Adding updated_at columns...\n');

    // Add updated_at to job_applications
    console.log('Adding updated_at to job_applications...');
    await pool.query(`
      DO $$
      BEGIN
          IF NOT EXISTS (
              SELECT 1 FROM information_schema.columns
              WHERE table_name = 'job_applications' AND column_name = 'updated_at'
          ) THEN
              ALTER TABLE job_applications ADD COLUMN updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
          END IF;
      END $$;
    `);
    console.log('✅ job_applications.updated_at added');

    // Add updated_at to interviews
    console.log('Adding updated_at to interviews...');
    await pool.query(`
      DO $$
      BEGIN
          IF NOT EXISTS (
              SELECT 1 FROM information_schema.columns
              WHERE table_name = 'interviews' AND column_name = 'updated_at'
          ) THEN
              ALTER TABLE interviews ADD COLUMN updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
          END IF;
      END $$;
    `);
    console.log('✅ interviews.updated_at added');

    console.log('\n✨ Migration complete!');
    await pool.end();
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

addUpdatedAtColumns();
