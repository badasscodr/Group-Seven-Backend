import pool from '../core/config/database';

async function listUsers() {
  try {
    const result = await pool.query(`
      SELECT id, email, role, first_name, last_name, is_active
      FROM users
      ORDER BY role, email
      LIMIT 20
    `);

    console.log('\n👥 Users in database:\n');
    result.rows.forEach((user: any) => {
      console.log(`${user.role.padEnd(12)} ${user.email.padEnd(30)} ${user.first_name} ${user.last_name} ${user.is_active ? '✓' : '✗'}`);
    });

    console.log(`\nTotal users: ${result.rows.length}`);
    await pool.end();
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

listUsers();
