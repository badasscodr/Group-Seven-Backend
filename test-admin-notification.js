const { Pool } = require('pg');
require('dotenv').config();

// Use the exact same configuration as your existing database
const poolConfig = {
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL?.includes('neon.tech') ? { rejectUnauthorized: false } : false,
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
  statement_timeout: 30000,
  query_timeout: 30000,
  application_name: 'group-seven-backend',
  connect_timeoutMS: 30000,
};

const pool = new Pool(poolConfig);

async function testAdminNotificationIntegration() {
  console.log('🧪 Testing admin notification integration...\n');
  
  try {
    const client = await pool.connect();
    
    try {
      // 1. Get a service request to test with
      console.log('1️⃣ Getting a service request to test with...');
      const serviceRequests = await client.query(`
        SELECT id, client_id, title, status 
        FROM service_requests 
        ORDER BY created_at DESC 
        LIMIT 1
      `);
      
      if (serviceRequests.rows.length === 0) {
        console.log('❌ No service requests found!');
        return;
      }
      
      const testRequest = serviceRequests.rows[0];
      console.log(`📋 Testing with request: "${testRequest.title}" (Status: ${testRequest.status})`);
      console.log(`👤 Client ID: ${testRequest.client_id}`);
      
      // 2. Clear existing notifications for this user
      console.log('\n2️⃣ Clearing existing notifications for this user...');
      await client.query(`
        DELETE FROM notifications WHERE user_id = $1
      `, [testRequest.client_id]);
      
      // 3. Simulate what the admin status update should do
      console.log('\n3️⃣ Simulating admin status update...');
      const oldStatus = testRequest.status;
      const newStatus = 'in_progress';
      const adminId = 'test-admin-id';
      
      console.log(`📊 Status change: ${oldStatus} → ${newStatus}`);
      
      // Update the request status
      await client.query(`
        UPDATE service_requests 
        SET status = $1, updated_at = CURRENT_TIMESTAMP
        WHERE id = $2
      `, [newStatus, testRequest.id]);
      
      console.log('✅ Service request status updated');
      
      // 4. Create the notification (this is what should happen in admin.routes.ts)
      console.log('\n4️⃣ Creating notification for client...');
      const notificationData = {
        user_id: testRequest.client_id,
        title: 'Request Status Updated',
        message: `Your request "${testRequest.title}" status has been changed from "${oldStatus}" to "${newStatus}"`,
        type: 'service_request',
        related_id: testRequest.id,
        related_type: 'service_request',
        status: 'unread',
        priority: 'medium',
        metadata: JSON.stringify({
          old_status: oldStatus,
          new_status: newStatus,
          request_id: testRequest.id,
          request_title: testRequest.title,
          changed_by: adminId
        })
      };
      
      const insertResult = await client.query(`
        INSERT INTO notifications (user_id, title, message, type, related_id, related_type, status, priority, metadata)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        RETURNING *
      `, [
        notificationData.user_id,
        notificationData.title,
        notificationData.message,
        notificationData.type,
        notificationData.related_id,
        notificationData.related_type,
        notificationData.status,
        notificationData.priority,
        notificationData.metadata
      ]);
      
      if (insertResult.rows.length > 0) {
        const notification = insertResult.rows[0];
        console.log('✅ Notification created successfully');
        console.log('📋 Notification ID:', notification.id);
        console.log('📝 Message:', notification.message);
      }
      
      // 5. Verify the notification exists
      console.log('\n5️⃣ Verifying notification was created...');
      const notifications = await client.query(`
        SELECT * FROM notifications 
        WHERE user_id = $1 AND related_id = $2
        ORDER BY created_at DESC
      `, [testRequest.client_id, testRequest.id]);
      
      console.log(`📊 Found ${notifications.rows.length} notifications for this user/request`);
      
      if (notifications.rows.length > 0) {
        notifications.rows.forEach((notif, index) => {
          console.log(`  ${index + 1}. ${notif.title}: ${notif.message} (${notif.status})`);
        });
      }
      
      // 6. Test what the client would see
      console.log('\n6️⃣ Testing client API response...');
      const clientNotifications = await client.query(`
        SELECT id, title, message, type, status, priority, metadata, created_at
        FROM notifications 
        WHERE user_id = $1 
        ORDER BY created_at DESC
        LIMIT 10
      `, [testRequest.client_id]);
      
      const apiResponse = {
        success: true,
        message: 'Notifications retrieved successfully',
        data: {
          notifications: clientNotifications.rows,
          unreadCount: clientNotifications.rows.filter(n => n.status === 'unread').length
        }
      };
      
      console.log('✅ Client API response ready');
      console.log('📊 Unread count:', apiResponse.data.unreadCount);
      console.log('📋 Notifications:', apiResponse.data.notifications.length);
      
      console.log('\n🎉 Admin notification integration test completed!');
      console.log('\n💡 If you run this test and then check your client dashboard,');
      console.log('   you should see the notification if the frontend is connected.');
      console.log('\n🔧 To fix the issue:');
      console.log('1. Make sure your backend server is running');
      console.log('2. Check that admin.routes.ts is properly integrated');
      console.log('3. Verify the notification service is imported in admin routes');
      console.log('4. Add frontend notification components to display notifications');
      
    } finally {
      client.release();
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await pool.end();
  }
}

// Run the test
testAdminNotificationIntegration().catch(console.error);
