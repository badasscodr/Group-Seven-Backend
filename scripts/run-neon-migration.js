const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
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

// Validate required database config
if (!poolConfig.connectionString) {
  console.error('❌ DATABASE_URL is required but not set');
  process.exit(1);
}

const pool = new Pool(poolConfig);

async function runNeonMigration() {
  console.log('🔄 Running migration 007 on Neon PostgreSQL...');
  
  const maxRetries = 3;
  const retryDelay = 1000; // 1 second

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      // Read migration file
      const migrationPath = path.join(__dirname, '../migrations/007_notifications.sql');
      const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
      
      console.log('📋 Migration SQL loaded:', migrationSQL.substring(0, 100) + '...');
      
      // Start transaction
      const client = await pool.connect();
      
      try {
        await client.query('BEGIN');
        
        // Execute migration
        await client.query(migrationSQL);
        
        await client.query('COMMIT');
        console.log('✅ Migration 007 completed successfully on Neon!');
        console.log('📊 Notifications table created with indexes');
        
        // Verify table exists
        const checkTable = await client.query(`
          SELECT table_name, column_name, data_type 
          FROM information_schema.columns 
          WHERE table_name = 'notifications' 
          ORDER BY ordinal_position
        `);
        
        console.log('🔍 Table structure verified:');
        checkTable.rows.forEach(row => {
          console.log(`  - ${row.column_name}: ${row.data_type}`);
        });
        
        return; // Success, exit the retry loop
        
      } catch (error) {
        await client.query('ROLLBACK');
        
        // Check if it's a network/DNS error that can be retried
        const isRetriableError = error.code === 'EAI_AGAIN' || 
                             error.code === 'ENOTFOUND' || 
                             error.code === 'ETIMEDOUT' ||
                             error.message?.includes('getaddrinfo') ||
                             error.message?.includes('Connection terminated');

        if (isRetriableError && attempt < maxRetries) {
          console.warn(`🔄 Migration retry ${attempt}/${maxRetries} due to network error:`, error.code || error.message);
          await new Promise(resolve => setTimeout(resolve, retryDelay));
          continue;
        }

        // For non-retriable errors or last attempt, throw the error
        throw error;
      } finally {
        client.release();
      }
      
    } catch (error) {
      // Check if it's a network/DNS error that can be retried
      const isRetriableError = error.code === 'EAI_AGAIN' || 
                           error.code === 'ENOTFOUND' || 
                           error.code === 'ETIMEDOUT' ||
                           error.message?.includes('getaddrinfo') ||
                           error.message?.includes('Connection terminated');

      if (isRetriableError && attempt < maxRetries) {
        console.warn(`🔄 Migration retry ${attempt}/${maxRetries} due to network error:`, error.code || error.message);
        await new Promise(resolve => setTimeout(resolve, retryDelay));
        continue;
      }

      // For non-retriable errors or last attempt, throw the error
      console.error('❌ Migration failed:', error);
      throw error;
    }
  }
}

async function testNotificationService() {
  console.log('\n🧪 Testing notification service on Neon...');
  
  try {
    // Import the notification service
    const { notificationService } = require('../src/modules/notifications/services/notification.service');
    
    // Test creating a notification
    console.log('📝 Creating test notification...');
    const createResult = await notificationService.createNotification({
      userId: 'test-user-id',
      title: 'Test Notification',
      message: 'This is a test notification from Neon database',
      type: 'system',
      priority: 'medium',
      metadata: { test: true, timestamp: new Date().toISOString() }
    });
    
    if (createResult.success) {
      console.log('✅ Test notification created successfully');
      console.log('📋 Notification ID:', createResult.data.id);
      console.log('📅 Created at:', createResult.data.createdAt);
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
      getResult.data.forEach(notification => {
        console.log(`  - ${notification.title}: ${notification.message}`);
      });
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
    
    console.log('\n✅ All notification service tests passed on Neon!');
    
  } catch (error) {
    console.error('❌ Notification service test failed:', error);
  }
}

// Main execution
async function main() {
  console.log('🚀 Starting Neon notification system setup...\n');
  
  try {
    await runNeonMigration();
    await testNotificationService();
    
    console.log('\n🎉 Neon notification system is ready!');
    console.log('\n📋 Available API endpoints:');
    console.log('  GET    /api/notifications          - Get user notifications');
    console.log('  GET    /api/notifications/unread   - Get unread count');
    console.log('  PUT    /api/notifications/:id/read - Mark as read');
    console.log('  PUT    /api/notifications/read-all  - Mark all as read');
    console.log('  DELETE /api/notifications/:id      - Delete notification');
    
  } catch (error) {
    console.error('\n❌ Setup failed:', error);
    console.log('\n💡 Make sure:');
    console.log('  1. DATABASE_URL is set correctly in .env');
    console.log('  2. Neon database is accessible');
    console.log('  3. You have proper permissions');
  } finally {
    await pool.end();
  }
}

// Run if called directly
if (require.main === module) {
  main().catch(console.error);
}

module.exports = { runNeonMigration, testNotificationService };
