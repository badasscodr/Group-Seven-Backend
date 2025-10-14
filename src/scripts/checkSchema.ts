import { Pool } from 'pg';

async function checkDatabaseSchema() {
  // Hardcode the DATABASE_URL since we know it works
  const connectionString = 'postgresql://neondb_owner:npg_jcmB61ryhgPk@ep-bold-surf-aeqws7il-pooler.c-2.us-east-2.aws.neon.tech/neondb?sslmode=require';
  
  console.log('🔍 Using hardcoded DATABASE_URL');
  
  try {
    console.log('🔍 Checking client_profiles table schema...');
    
    const pool = new Pool({
      connectionString,
      ssl: { rejectUnauthorized: false }
    });

    const result = await pool.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'client_profiles' 
      ORDER BY ordinal_position;
    `);
    
    console.log('📋 client_profiles columns:');
    result.rows.forEach(row => {
      console.log(`  - ${row.column_name} (${row.data_type})`);
    });
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

checkDatabaseSchema();