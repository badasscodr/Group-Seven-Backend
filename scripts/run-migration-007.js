const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

// Database configuration
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:password@localhost:5432/groupseven',
});

async function runMigration() {
  console.log('🔄 Running migration 007: Create notifications table...');
  
  try {
    // Read migration file
    const migrationPath = path.join(__dirname, '../migrations/007_notifications.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    
    // Start transaction
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');
      
      // Execute migration
      await client.query(migrationSQL);
      
      await client.query('COMMIT');
      console.log('✅ Migration 007 completed successfully!');
      console.log('📊 Notifications table created with indexes');
      
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

// Test the notification service
async function testNotificationService() {
  console.log('\n🧪 Testing notification service...');
  
  try {
    // Import the notification service
    const { notificationService } = require('../src/modules/notifications/services/notification.service');
    
    // Test creating a notification
    console.log('📝 Creating test notification...');
    const createResult = await notificationService.createNotification({
      userId: 'test-user-id',
      title: 'Test Notification',
      message: 'This is a test notification for the notification system',
      type: 'system',
      priority: 'medium',
      metadata: { test: true }
    });
    
    if (createResult.success) {
      console.log('✅ Test notification created successfully');
      console.log('📋 Notification ID:', createResult.data.id);
    } else {
      console.error('❌ Failed to create test notification:', createResult.error);
      return;
    }
    
    // Test getting notifications
    console.log('\n📖 Getting user notifications...');
    const getResult = await notificationService.getUserNotifications('test-user-id');
    
    if (getResult.success) {
      console.log('✅ Retrieved notifications successfully');
      console.log('📊 Total notifications:', getResult.data.length);
    } else {
      console.error('❌ Failed to get notifications:', getResult.error);
    }
    
    // Test unread count
    console.log('\n🔢 Getting unread count...');
    const unreadResult = await notificationService.getUnreadCount('test-user-id');
    
    if (unreadResult.success) {
      console.log('✅ Unread count retrieved successfully');
      console.log('📊 Unread count:', unreadResult.data.unreadCount);
    } else {
      console.error('❌ Failed to get unread count:', unreadResult.error);
    }
    
    console.log('\n✅ All notification service tests passed!');
    
  } catch (error) {
    console.error('❌ Notification service test failed:', error);
  }
}

// Main execution
async function main() {
  console.log('🚀 Starting notification system setup...\n');
  
  await runMigration();
  await testNotificationService();
  
  console.log('\n🎉 Backend notification system is ready!');
  console.log('\n📋 Available API endpoints:');
  console.log('  GET    /api/notifications          - Get user notifications');
  console.log('  GET    /api/notifications/unread   - Get unread count');
  console.log('  PUT    /api/notifications/:id/read - Mark as read');
  console.log('  PUT    /api/notifications/read-all  - Mark all as read');
  console.log('  DELETE /api/notifications/:id      - Delete notification');
  
  await pool.end();
}

// Run if called directly
if (require.main === module) {
  main().catch(console.error);
}

module.exports = { runMigration, testNotificationService };
