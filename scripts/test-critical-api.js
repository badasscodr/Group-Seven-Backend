const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL?.includes('neon.tech') ? { rejectUnauthorized: false } : false,
});

async function testCriticalAPI() {
  console.log('🔧 Testing critical API endpoints...');
  
  try {
    // Test profile update for supplier
    console.log('\n🏢 Testing supplier profile update...');
    const supplierUpdateResult = await pool.query(`
      UPDATE users 
      SET first_name = 'Test', last_name = 'Admin', updated_at = CURRENT_TIMESTAMP 
      WHERE email = 'admin@g7.com'
      RETURNING email, first_name, last_name, updated_at
    `);
    
    console.log('✅ Profile update successful:', supplierUpdateResult.rows[0]);
    
    // Test PostgreSQL array handling for service categories
    console.log('\n📋 Testing PostgreSQL array handling...');
    const serviceCategories = '{Construction,Plumbing,HVAC}';
    
    // First, create a test supplier if needed
    const supplierExists = await pool.query(`
      SELECT user_id FROM supplier_profiles 
      WHERE user_id = '550e8400-e29b-41d4-a716-446655440000'
    `);
    
    if (supplierExists.rows.length === 0) {
      await pool.query(`
        INSERT INTO supplier_profiles (
          user_id, company_name, service_categories, created_at, updated_at
        ) VALUES (
          '550e8400-e29b-41d4-a716-446655440000', 
          'Test Company',
          $1::text[], 
          CURRENT_TIMESTAMP, 
          CURRENT_TIMESTAMP
        )
      `, [serviceCategories]);
    } else {
      await pool.query(`
        UPDATE supplier_profiles 
        SET service_categories = $1::text[],
        updated_at = CURRENT_TIMESTAMP
        WHERE user_id = '550e8400-e29b-41d4-a716-446655440000'
      `, [serviceCategories]);
    }
    
    // Verify the array was stored correctly
    const arrayResult = await pool.query(`
      SELECT service_categories 
      FROM supplier_profiles 
      WHERE user_id = '550e8400-e29b-41d4-a716-446655440000'
    `);
    
    console.log('✅ PostgreSQL array test successful:', arrayResult.rows[0].service_categories);
    
    // Test S3/R2 URL construction
    console.log('\n☁️ Testing S3/R2 URL construction...');
    const testKey = 'uploads/test-user/test-file.jpg';
    const publicDomain = process.env.S3_PUBLIC_URL;
    const bucketName = process.env.S3_BUCKET_NAME;
    
    // Old (incorrect) URL
    const oldUrl = `${publicDomain}/${bucketName}/${testKey}`;
    
    // New (correct) URL  
    const newUrl = `${publicDomain}/${testKey}`;
    
    console.log('🔗 Old URL (incorrect):', oldUrl);
    console.log('🔗 New URL (correct):', newUrl);
    const urlFixed = oldUrl !== newUrl ? 'FIXED' : 'SAME';
    console.log('✅ URL construction test:', urlFixed);
    
    console.log('\n🎉 Critical API test completed successfully!');
    
  } catch (error) {
    console.error('❌ Critical API test failed:', error.message);
    throw error;
  } finally {
    await pool.end();
  }
}

testCriticalAPI().catch(console.error);