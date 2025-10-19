const fetch = require('node-fetch');

// Test complete notification flow
const testNotificationFlow = async () => {
  console.log('🧪 Testing Complete Notification Flow...\n');

  try {
    // Step 1: Login as client
    console.log('1️⃣ Logging in as client...');
    const clientLogin = await fetch('http://localhost:8000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'client@example.com',
        password: 'password123'
      })
    });
    
    const clientAuth = await clientLogin.json();
    if (!clientAuth.success) {
      throw new Error('Client login failed: ' + clientAuth.error?.message);
    }
    
    console.log('✅ Client logged in successfully');
    const clientToken = clientAuth.data.token;

    // Step 2: Create a new service request as client
    console.log('\n2️⃣ Creating new service request...');
    const createRequest = await fetch('http://localhost:8000/api/client/requests', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${clientToken}`
      },
      body: JSON.stringify({
        title: 'Test Notification Flow Request',
        description: 'This is a test request to verify notification flow is working properly',
        category: 'Test Category',
        priority: 'high',
        budget_min: 100,
        budget_max: 500
      })
    });
    
    const requestResult = await createRequest.json();
    if (!requestResult.success) {
      throw new Error('Request creation failed: ' + requestResult.error?.message);
    }
    
    console.log('✅ Service request created successfully');
    console.log(`📋 Request ID: ${requestResult.data.id}`);

    // Step 3: Login as admin
    console.log('\n3️⃣ Logging in as admin...');
    const adminLogin = await fetch('http://localhost:8000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'admin@example.com',
        password: 'admin123'
      })
    });
    
    const adminAuth = await adminLogin.json();
    if (!adminAuth.success) {
      throw new Error('Admin login failed: ' + adminAuth.error?.message);
    }
    
    console.log('✅ Admin logged in successfully');
    const adminToken = adminAuth.data.token;

    // Step 4: Check admin notifications
    console.log('\n4️⃣ Checking admin notifications...');
    const adminNotifications = await fetch('http://localhost:8000/api/notifications', {
      headers: {
        'Authorization': `Bearer ${adminToken}`
      }
    });
    
    const adminNotifResult = await adminNotifications.json();
    if (adminNotifResult.success) {
      console.log(`✅ Admin has ${adminNotifResult.data.length} notifications`);
      adminNotifResult.data.forEach((notif, index) => {
        console.log(`  ${index + 1}. ${notif.title}: ${notif.message}`);
      });
    } else {
      console.log('❌ Failed to get admin notifications:', adminNotifResult.error);
    }

    // Step 5: Admin changes status of the request
    console.log('\n5️⃣ Admin changing request status...');
    const statusUpdate = await fetch(`http://localhost:8000/api/admin/requests/${requestResult.data.id}/status`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminToken}`
      },
      body: JSON.stringify({
        status: 'in_progress',
        adminNotes: 'Starting work on this request'
      })
    });
    
    const statusResult = await statusUpdate.json();
    if (!statusResult.success) {
      throw new Error('Status update failed: ' + statusResult.error?.message);
    }
    
    console.log('✅ Request status updated successfully');

    // Step 6: Check client notifications
    console.log('\n6️⃣ Checking client notifications...');
    const clientNotifications = await fetch('http://localhost:8000/api/notifications', {
      headers: {
        'Authorization': `Bearer ${clientToken}`
      }
    });
    
    const clientNotifResult = await clientNotifications.json();
    if (clientNotifResult.success) {
      console.log(`✅ Client has ${clientNotifResult.data.length} notifications`);
      clientNotifResult.data.forEach((notif, index) => {
        console.log(`  ${index + 1}. ${notif.title}: ${notif.message} (${notif.status})`);
      });
    } else {
      console.log('❌ Failed to get client notifications:', clientNotifResult.error);
    }

    console.log('\n🎉 Complete notification flow test finished!');
    console.log('\n📊 Summary:');
    console.log('- ✅ Client created new request');
    console.log('- ✅ Admin should have notification about new request');
    console.log('- ✅ Admin changed request status');
    console.log('- ✅ Client should have notification about status change');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error(error.stack);
  }
};

// Run the test
testNotificationFlow();
