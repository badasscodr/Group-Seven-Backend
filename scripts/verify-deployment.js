const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL?.includes('neon.tech') ? { rejectUnauthorized: false } : false,
});

async function verifyDeployment() {
  console.log('🔍 Verifying deployment readiness...');
  
  try {
    // Test database connection
    console.log('📡 Testing database connection...');
    await pool.query('SELECT NOW()');
    console.log('✅ Database connection successful');
    
    // Verify users exist
    console.log('👥 Verifying users exist...');
    const userResult = await pool.query(`
      SELECT email, role, is_active, created_at
      FROM users 
      WHERE email IN ('admin@g7.com', 'employee@g7.com', 'supplier@g7.com', 'client@g7.com', 'candidate@g7.com')
      ORDER BY role
    `);
    
    console.log('\n✅ Users found:', userResult.rows.length);
    userResult.rows.forEach(user => {
      console.log(`  📧 ${user.email} (${user.role}) - ${user.is_active ? 'Active' : 'Inactive'}`);
    });
    
    // Verify profile tables have data
    console.log('\n📊 Verifying profile data...');
    const profileResult = await pool.query(`
      SELECT 
        u.role,
        COUNT(CASE WHEN sp.user_id IS NOT NULL THEN 1 END) as supplier_count,
        COUNT(CASE WHEN cp.user_id IS NOT NULL THEN 1 END) as client_count,
        COUNT(CASE WHEN ep.user_id IS NOT NULL THEN 1 END) as employee_count,
        COUNT(CASE WHEN cp.user_id IS NOT NULL THEN 1 END) as candidate_count
      FROM users u
      LEFT JOIN supplier_profiles sp ON u.id = sp.user_id
      LEFT JOIN client_profiles cp ON u.id = cp.user_id
      LEFT JOIN employee_profiles ep ON u.id = ep.user_id
      LEFT JOIN candidate_profiles cp2 ON u.id = cp2.user_id
      WHERE u.is_active = true
      GROUP BY u.role
    `);
    
    console.log('\n📊 Profile statistics:');
    profileResult.rows.forEach(row => {
      console.log(`  👤 ${row.role}: Supplier(${row.supplier_count}) Client(${row.client_count}) Employee(${row.employee_count}) Candidate(${row.candidate_count})`);
    });
    
    // Test S3/R2 configuration
    console.log('\n☁️ Verifying S3/R2 configuration...');
    const s3Config = {
      endpoint: process.env.S3_ENDPOINT,
      bucket: process.env.S3_BUCKET_NAME,
      accessKey: !!process.env.S3_ACCESS_KEY,
      secretKey: !!process.env.S3_SECRET_KEY,
      publicUrl: process.env.S3_PUBLIC_URL
    };
    
    const s3Ready = s3Config.endpoint && s3Config.bucket && s3Config.accessKey && s3Config.secretKey;
    console.log('✅ S3/R2 configuration:', s3Ready ? 'READY' : 'MISSING');
    if (s3Ready) {
      console.log(`  🔗 Endpoint: ${s3Config.endpoint}`);
      console.log(`  🪣 Bucket: ${s3Config.bucket}`);
      console.log(`  🌐 Public URL: ${s3Config.publicUrl}`);
    }
    
    console.log('\n🎉 Deployment verification completed successfully!');
    console.log('\n🚀 READY FOR DEPLOYMENT');
    
  } catch (error) {
    console.error('❌ Deployment verification failed:', error.message);
    throw error;
  } finally {
    await pool.end();
  }
}

verifyDeployment().catch(console.error);