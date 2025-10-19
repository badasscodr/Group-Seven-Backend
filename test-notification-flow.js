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

async function testNotificationFlow() {
  console.log('🧪 Testing complete notification flow...\n');
  
  try {
    const client = await pool.connect();
    
    try {
      // 1. Check if notifications table exists
      console.log('1️⃣ Checking notifications table...');
      const tableCheck = await client.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = 'notifications'
        );
      `);
      
      if (!tableCheck.rows[0].exists) {
        console.log('❌ Notifications table does not exist!');
        return;
      }
      console.log('✅ Notifications table exists');
      
      // 2. Check existing notifications
      console.log('\n2️⃣ Checking existing notifications...');
      const existingNotifications = await client.query(`
        SELECT COUNT(*) as count FROM notifications
      `);
      console.log(`📊 Existing notifications: ${existingNotifications.rows[0].count}`);
      
      // 3. Check service requests
      console.log('\n3️⃣ Checking service requests...');
      const serviceRequests = await client.query(`
        SELECT id, client_id, title, status 
        FROM service_requests 
        ORDER BY created_at DESC 
        LIMIT 5
      `);
      
      if (serviceRequests.rows.length === 0) {
        console.log('❌ No service requests found!');
        return;
      }
      
      console.log('📋 Recent service requests:');
      serviceRequests.rows.forEach((req, index) => {
        console.log(`  ${index + 1}. ${req.title} (Status: ${req.status}, Client: ${req.client_id})`);
      });
      
      // 4. Simulate a notification creation
      console.log('\n4️⃣ Simulating notification creation...');
      const testRequest = serviceRequests.rows[0];
      const testNotification = {
        user_id: testRequest.client_id,
        title: 'Request Status Update',
        message: `Your request "${testRequest.title}" status changed to 'in_progress'`,
        type: 'service_request',
        related_id: testRequest.id,
        related_type: 'service_request',
        status: 'unread',
        priority: 'medium',
        metadata: JSON.stringify({
          old_status: testRequest.status,
          new_status: 'in_progress',
          request_id: testRequest.id
        })
      };
      
      const insertResult = await client.query(`
        INSERT INTO notifications (user_id, title, message, type, related_id, related_type, status, priority, metadata)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        RETURNING *
      `, [
        testNotification.user_id,
        testNotification.title,
        testNotification.message,
        testNotification.type,
        testNotification.related_id,
        testNotification.related_type,
        testNotification.status,
        testNotification.priority,
        testNotification.metadata
      ]);
      
      if (insertResult.rows.length > 0) {
        const notification = insertResult.rows[0];
        console.log('✅ Test notification created successfully');
        console.log('📋 Notification ID:', notification.id);
        console.log('📅 Created at:', notification.created_at);
        console.log('👤 User ID:', notification.user_id);
        console.log('📝 Message:', notification.message);
      }
      
      // 5. Check notifications for that user
      console.log('\n5️⃣ Checking notifications for user...');
      const userNotifications = await client.query(`
        SELECT * FROM notifications 
        WHERE user_id = $1 
        ORDER BY created_at DESC
      `, [testRequest.client_id]);
      
      console.log(`📊 Notifications for user ${testRequest.client_id}: ${userNotifications.rows.length}`);
      userNotifications.rows.forEach((notif, index) => {
        console.log(`  ${index + 1}. ${notif.title}: ${notif.message} (${notif.status})`);
      });
      
      // 6. Test API endpoint simulation
      console.log('\n6️⃣ Testing API response format...');
      const apiResponse = {
        success: true,
        message: 'Notifications retrieved successfully',
        data: {
          notifications: userNotifications.rows.map(notif => ({
            id: notif.id,
            userId: notif.user_id,
            title: notif.title,
            message: notif.message,
            type: notif.type,
            relatedId: notif.related_id,
            relatedType: notif.related_type,
            status: notif.status,
            priority: notif.priority,
            metadata: notif.metadata,
            createdAt: notif.created_at,
            readAt: notif.read_at
          })),
          pagination: {
            page: 1,
            limit: 10,
            total: userNotifications.rows.length,
            totalPages: 1
          }
        }
      };
      
      console.log('✅ API response format ready');
      console.log('📊 Sample response:', JSON.stringify(apiResponse, null, 2).substring(0, 300) + '...');
      
      console.log('\n🎉 Notification flow test completed successfully!');
      console.log('\n💡 Next steps:');
      console.log('1. Make sure your backend server is running');
      console.log('2. Test the admin status update endpoint');
      console.log('3. Check if notifications are being created when status changes');
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
testNotificationFlow().catch(console.error);
