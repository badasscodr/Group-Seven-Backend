const { query } = require('./src/modules/core/config/database');

async function checkStatusEnum() {
  try {
    console.log('🔍 Checking service_requests table schema...');
    const result = await query(`
      SELECT column_name, data_type, column_default 
      FROM information_schema.columns 
      WHERE table_name = 'service_requests' 
      AND column_name = 'status'
    `);
    
    console.log('Status column info:', result.rows);
    
    // Check enum type values
    const enumResult = await query(`
      SELECT unnest(enumlabel) as status_value
      FROM pg_enum 
      WHERE enumtypid = (SELECT oid FROM pg_type WHERE typname = 'request_status_enum')
      ORDER BY enumlabel
    `);
    
    console.log('Available enum values:', enumResult.rows);
    
    // Check current requests and their statuses
    const requestsResult = await query(`
      SELECT id, status FROM service_requests LIMIT 5
    `);
    
    console.log('Current request statuses:', requestsResult.rows);
    
  } catch (error) {
    console.error('❌ Error checking enum:', error.message);
  }
}

checkStatusEnum();
