const { Pool } = require('pg');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

async function fixAllProfileTables() {
  console.log('\n🔧 Fixing all profile tables...\n');
  console.log('═'.repeat(80));

  try {
    // Step 1: Check current columns in all profile tables
    console.log('\n📋 Step 1: Checking current profile table schemas...');
    const profileTables = ['clientProfiles', 'supplierProfiles', 'employeeProfiles', 'candidateProfiles'];

    for (const table of profileTables) {
      const columns = await pool.query(`
        SELECT column_name
        FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = $1
        ORDER BY ordinal_position
      `, [table]);

      console.log(`\n${table}:`);
      console.log(columns.rows.map(r => `  - ${r.column_name}`).join('\n'));
    }

    // Step 2: Add missing updatedAt column to all profile tables
    console.log('\n\n📋 Step 2: Adding missing updatedAt columns...');
    for (const table of profileTables) {
      try {
        await pool.query(`
          ALTER TABLE "${table}"
          ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        `);
        console.log(`✅ Added updatedAt to ${table}`);
      } catch (err) {
        console.log(`⚠️  ${table} updatedAt: ${err.message}`);
      }
    }

    // Step 3: Add businessType column to clientProfiles
    console.log('\n\n📋 Step 3: Adding businessType to clientProfiles...');
    try {
      await pool.query(`
        ALTER TABLE "clientProfiles"
        ADD COLUMN IF NOT EXISTS "businessType" VARCHAR(100)
      `);
      console.log('✅ Added businessType to clientProfiles');
    } catch (err) {
      console.log(`⚠️  businessType: ${err.message}`);
    }

    // Step 4: Check which users need profile records
    console.log('\n\n📋 Step 4: Checking existing users and profiles...');
    const users = await pool.query('SELECT "id", "email", "role" FROM users ORDER BY "createdAt"');
    console.log(`Found ${users.rows.length} users`);

    for (const user of users.rows) {
      console.log(`  - ${user.email} (${user.role})`);
    }

    // Step 5: Create profile records for users that don't have them
    console.log('\n\n📋 Step 5: Creating missing profile records...');

    // Client profiles
    const clientResult = await pool.query(`
      INSERT INTO "clientProfiles" ("id", "userId", "createdAt", "updatedAt")
      SELECT gen_random_uuid(), u."id", NOW(), NOW()
      FROM users u
      WHERE u."role" = 'client'
      AND NOT EXISTS (
        SELECT 1 FROM "clientProfiles" cp WHERE cp."userId" = u."id"
      )
      RETURNING "userId"
    `);
    console.log(`✅ Created ${clientResult.rowCount} client profile(s)`);

    // Supplier profiles
    const supplierResult = await pool.query(`
      INSERT INTO "supplierProfiles" ("id", "userId", "createdAt", "updatedAt")
      SELECT gen_random_uuid(), u."id", NOW(), NOW()
      FROM users u
      WHERE u."role" = 'supplier'
      AND NOT EXISTS (
        SELECT 1 FROM "supplierProfiles" sp WHERE sp."userId" = u."id"
      )
      RETURNING "userId"
    `);
    console.log(`✅ Created ${supplierResult.rowCount} supplier profile(s)`);

    // Employee profiles
    const employeeResult = await pool.query(`
      INSERT INTO "employeeProfiles" ("id", "userId", "createdAt", "updatedAt")
      SELECT gen_random_uuid(), u."id", NOW(), NOW()
      FROM users u
      WHERE u."role" = 'employee'
      AND NOT EXISTS (
        SELECT 1 FROM "employeeProfiles" ep WHERE ep."userId" = u."id"
      )
      RETURNING "userId"
    `);
    console.log(`✅ Created ${employeeResult.rowCount} employee profile(s)`);

    // Candidate profiles
    const candidateResult = await pool.query(`
      INSERT INTO "candidateProfiles" ("id", "userId", "createdAt", "updatedAt")
      SELECT gen_random_uuid(), u."id", NOW(), NOW()
      FROM users u
      WHERE u."role" = 'candidate'
      AND NOT EXISTS (
        SELECT 1 FROM "candidateProfiles" cp WHERE cp."userId" = u."id"
      )
      RETURNING "userId"
    `);
    console.log(`✅ Created ${candidateResult.rowCount} candidate profile(s)`);

    // Step 6: Verify all profiles exist
    console.log('\n\n📋 Step 6: Verifying all profiles...');
    const verification = await pool.query(`
      SELECT
        u."role",
        COUNT(CASE WHEN u."role" = 'client' THEN 1 END) as client_users,
        COUNT(CASE WHEN u."role" = 'client' AND cp."id" IS NOT NULL THEN 1 END) as client_profiles,
        COUNT(CASE WHEN u."role" = 'supplier' THEN 1 END) as supplier_users,
        COUNT(CASE WHEN u."role" = 'supplier' AND sp."id" IS NOT NULL THEN 1 END) as supplier_profiles,
        COUNT(CASE WHEN u."role" = 'employee' THEN 1 END) as employee_users,
        COUNT(CASE WHEN u."role" = 'employee' AND ep."id" IS NOT NULL THEN 1 END) as employee_profiles,
        COUNT(CASE WHEN u."role" = 'candidate' THEN 1 END) as candidate_users,
        COUNT(CASE WHEN u."role" = 'candidate' AND cdp."id" IS NOT NULL THEN 1 END) as candidate_profiles
      FROM users u
      LEFT JOIN "clientProfiles" cp ON cp."userId" = u."id" AND u."role" = 'client'
      LEFT JOIN "supplierProfiles" sp ON sp."userId" = u."id" AND u."role" = 'supplier'
      LEFT JOIN "employeeProfiles" ep ON ep."userId" = u."id" AND u."role" = 'employee'
      LEFT JOIN "candidateProfiles" cdp ON cdp."userId" = u."id" AND u."role" = 'candidate'
    `);

    console.log('\nProfile Statistics:');
    if (verification.rows[0]) {
      const stats = verification.rows[0];
      console.log(`  Clients: ${stats.client_profiles}/${stats.client_users} profiles`);
      console.log(`  Suppliers: ${stats.supplier_profiles}/${stats.supplier_users} profiles`);
      console.log(`  Employees: ${stats.employee_profiles}/${stats.employee_users} profiles`);
      console.log(`  Candidates: ${stats.candidate_profiles}/${stats.candidate_users} profiles`);
    }

    console.log('\n✅ All profile tables fixed successfully!\n');

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error(error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

fixAllProfileTables();
