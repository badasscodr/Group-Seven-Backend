import { query } from './src/modules/core/config/database';

async function checkRecentRequests() {
  try {
    console.log('🔍 Checking recent service requests...');
    
    // Get the most recent request with all fields
    const result = await query(`
      SELECT 
        id, title, description, category, priority, status,
        budget_min, budget_max, deadline, location, requirements,
        created_at, updated_at
      FROM service_requests 
      ORDER BY created_at DESC 
      LIMIT 3
    `);
    
    console.log('Recent requests:', JSON.stringify(result.rows, null, 2));
    
    // Check for documents
    if (result.rows.length > 0) {
      const requestId = result.rows[0].id;
      const docResult = await query(`
        SELECT 
          srd.id,
          srd.service_request_id,
          d.id as document_id,
          d.file_name,
          d.original_name,
          d.mime_type,
          d.file_size,
          d.s3_url,
          srd.created_at
        FROM service_request_documents srd
        JOIN documents d ON srd.document_id = d.id
        WHERE srd.service_request_id = $1
      `, [requestId]);
      
      console.log('Documents for request:', requestId, JSON.stringify(docResult.rows, null, 2));
    }
    
  } catch (error: any) {
    console.error('❌ Error checking requests:', error.message);
  }
}

checkRecentRequests();
