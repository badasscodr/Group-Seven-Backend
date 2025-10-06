const { Pool } = require('pg');
const bcrypt = require('bcrypt');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

async function createTestUsers() {
  console.log('\n👥 Creating test users...\n');
  console.log('═'.repeat(80));

  try {
    const password = 'Password123';
    const passwordHash = await bcrypt.hash(password, 10);

    const users = [
      {
        email: 'admin@example.com',
        role: 'admin',
        firstName: 'Admin',
        lastName: 'User'
      },
      {
        email: 'client@example.com',
        role: 'client',
        firstName: 'Client',
        lastName: 'User'
      },
      {
        email: 'supplier@example.com',
        role: 'supplier',
        firstName: 'Supplier',
        lastName: 'User'
      },
      {
        email: 'employee@example.com',
        role: 'employee',
        firstName: 'Employee',
        lastName: 'User'
      },
      {
        email: 'candidate@example.com',
        role: 'candidate',
        firstName: 'Candidate',
        lastName: 'User'
      }
    ];

    for (const user of users) {
      const result = await pool.query(`
        INSERT INTO users ("email", "passwordHash", "role", "firstName", "lastName", "isActive", "emailVerified")
        VALUES ($1, $2, $3, $4, $5, true, true)
        RETURNING "id", "email", "role"
      `, [user.email, passwordHash, user.role, user.firstName, user.lastName]);

      console.log(`✅ Created ${user.role}: ${user.email}`);
      console.log(`   ID: ${result.rows[0].id}`);
      console.log(`   Password: ${password}\n`);
    }

    console.log('═'.repeat(80));
    console.log('\n✅ All test users created successfully!\n');
    console.log('📝 Login credentials for all users:');
    console.log('   Password: Password123\n');
    console.log('Users:');
    users.forEach(u => {
      console.log(`   • ${u.email} (${u.role})`);
    });
    console.log('');

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

createTestUsers();
