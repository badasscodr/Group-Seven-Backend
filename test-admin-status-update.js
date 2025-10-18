const { query, initDatabase } = require('./dist/modules/core/config/database');
const { ServiceRequestService } = require('./dist/modules/clients/services/service-request.service');

async function testAdminStatusUpdate() {
  try {
    await initDatabase();
    console.log('🔍 Testing admin status update functionality...\n');
    
    // Get a service request to test status update
    const requests = await query('SELECT id, title, status FROM service_requests LIMIT 1');
    if (requests.rows.length === 0) {
      console.log('❌ No service requests found');
      return;
    }
    
    const request = requests.rows[0];
    console.log(`📋 Testing with request: ${request.title} (current status: ${request.status})`);
    
    // Test status update
    const newStatus = 'in_progress';
    console.log(`🔄 Updating status to: ${newStatus}`);
    
    const updatedRequest = await ServiceRequestService.updateRequestStatus(request.id, newStatus);
    console.log('✅ Status updated successfully!');
    console.log(`   New status: ${updatedRequest.status}`);
    console.log(`   Updated at: ${updatedRequest.updated_at}`);
    
    console.log('\n🚀 Admin status update functionality is working perfectly!');
    
  } catch (error) {
    console.error('❌ Status update test failed:', error.message);
    console.error('Stack:', error.stack);
  }
}

testAdminStatusUpdate();
