const { Pool } = require('pg');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

async function createMissingProfiles() {
  console.log('\n🔧 Creating missing profile records with default values...\n');
  console.log('═'.repeat(80));

  try {
    // Check which users need profile records
    console.log('\n📋 Checking existing users and profiles...');
    const users = await pool.query('SELECT "id", "email", "role", "firstName", "lastName" FROM users ORDER BY "createdAt"');
    console.log(`Found ${users.rows.length} users`);

    for (const user of users.rows) {
      console.log(`  - ${user.email} (${user.role})`);
    }

    // Create supplier profiles (companyName is required)
    console.log('\n\n📋 Creating supplier profiles...');
    const supplierResult = await pool.query(`
      INSERT INTO "supplierProfiles" (
        "id", "userId", "companyName", "businessType", "rating", "totalReviews", "isVerified", "createdAt", "updatedAt"
      )
      SELECT
        gen_random_uuid(),
        u."id",
        COALESCE(u."firstName" || ' ' || u."lastName", 'Supplier Company'),
        '',
        0.00,
        0,
        false,
        NOW(),
        NOW()
      FROM users u
      WHERE u."role" = 'supplier'
      AND NOT EXISTS (
        SELECT 1 FROM "supplierProfiles" sp WHERE sp."userId" = u."id"
      )
      RETURNING "userId"
    `);
    console.log(`✅ Created ${supplierResult.rowCount} supplier profile(s)`);

    // Create employee profiles (all nullable fields)
    console.log('\n📋 Creating employee profiles...');
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

    // Create candidate profiles (all nullable fields)
    console.log('\n📋 Creating candidate profiles...');
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

    // Verify all profiles exist
    console.log('\n\n📋 Verifying all profiles...');
    const verification = await pool.query(`
      SELECT
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

    // Check client profile data
    console.log('\n\n📋 Client profile data:');
    const clientProfiles = await pool.query('SELECT * FROM "clientProfiles"');
    console.log(`Found ${clientProfiles.rowCount} client profile(s)`);
    for (const profile of clientProfiles.rows) {
      console.log(`  User ID: ${profile.userId}`);
      console.log(`    Company: ${profile.companyName || 'N/A'}`);
      console.log(`    Business Type: ${profile.businessType || 'N/A'}`);
      console.log(`    Industry: ${profile.industry || 'N/A'}`);
      console.log(`    Address: ${profile.address || 'N/A'}`);
    }

    console.log('\n✅ All missing profiles created successfully!\n');

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error(error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

createMissingProfiles();
