import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';

dotenv.config();

// Import the existing database connection
import { query } from '../src/core/config/database';

async function fixPasswordHashes() {
  console.log('🔧 Fixing password hashes for admin and employee users...');
  
  try {
    // Generate correct hash for "Abc123!@#"
    const password = 'Abc123!@#';
    const correctHash = await bcrypt.hash(password, 12);
    
    console.log('🔐 Generated correct hash for "Abc123!@#":', correctHash);
    
    // Update admin user password hash
    await query(`
      UPDATE users 
      SET password_hash = $1, updated_at = CURRENT_TIMESTAMP 
      WHERE email = 'admin@g7.com'
    `, [correctHash]);
    
    console.log('✅ Admin password hash updated');
    
    // Update employee user password hash
    await query(`
      UPDATE users 
      SET password_hash = $1, updated_at = CURRENT_TIMESTAMP 
      WHERE email = 'employee@g7.com'
    `, [correctHash]);
    
    console.log('✅ Employee password hash updated');
    
    // Verify the update
    const verifyQuery = `
      SELECT email, role, password_hash, created_at, updated_at
      FROM users 
      WHERE email IN ('admin@g7.com', 'employee@g7.com')
      ORDER BY role
    `;
    
    const result = await query(verifyQuery);
    
    console.log('\n✅ Password hashes fixed successfully!');
    console.log('\n📋 Updated Users:');
    result.rows.forEach(user => {
      console.log(`  📧 ${user.email}`);
      console.log(`  👤 ${user.role} (${user.firstName} ${user.lastName})`);
      console.log(`  🔑 Hash: ${user.password_hash.substring(0, 60)}...`);
      console.log(`  📅 Updated: ${user.updated_at.toISOString()}`);
      console.log('');
    });

    // Test the new hash
    console.log('\n🔐 Testing password verification...');
    bcrypt.compare(password, correctHash, (err, isValid) => {
      if (err) {
        console.error('❌ Bcrypt test error:', err);
      } else {
        console.log('✅ Password verification test:', isValid ? 'SUCCESS' : 'FAILED');
      }
    });

  } catch (error) {
    console.error('❌ Error fixing password hashes:', error.message);
    throw error;
  }
}

fixPasswordHashes().catch(console.error);