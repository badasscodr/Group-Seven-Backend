const { notificationService } = require('./dist/modules/notifications/services/notification.service.js');

const testNotifications = async () => {
  try {
    console.log('🔍 Checking notifications for client 39ed7e2d-e300-4947-b8f6-930c659138bb...');
    
    const result = await notificationService.getUserNotifications('39ed7e2d-e300-4947-b8f6-930c659138bb');
    
    console.log('📊 Result:');
    console.log(JSON.stringify(result, null, 2));
    
    if (result.success && result.data.length > 0) {
      console.log(`\n✅ Found ${result.data.length} notifications:`);
      result.data.forEach((notif, index) => {
        console.log(`  ${index + 1}. ${notif.title}: ${notif.message} (${notif.status})`);
      });
    } else {
      console.log('\n❌ No notifications found');
    }
    
    // Also check unread count
    const unreadResult = await notificationService.getUnreadCount('39ed7e2d-e300-4947-b8f6-930c659138bb');
    console.log('\n📧 Unread count:', unreadResult);
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
};

testNotifications();
