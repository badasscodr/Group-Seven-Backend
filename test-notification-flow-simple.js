const https = require('https');
const http = require('http');

// Simple HTTP request function
function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const isHttps = url.startsWith('https://');
    const client = isHttps ? https : http;
    
    const req = client.request(url, options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const jsonData = JSON.parse(data);
          resolve({ status: res.statusCode, data: jsonData });
        } catch (e) {
          resolve({ status: res.statusCode, data: data });
        }
      });
    });

    req.on('error', reject);
    
    if (options.body) {
      req.write(options.body);
    }
    
    req.end();
  });
}

// Test complete notification flow
const testNotificationFlow = async () => {
  console.log('🧪 Testing Complete Notification Flow...\n');

  try {
    // Step 1: Login as client
    console.log('1️⃣ Logging in as client...');
    const clientLogin = await makeRequest('http://localhost:8000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'client@example.com',
        password: 'password123'
      })
    });
    
    if (!clientLogin.data.success) {
      throw new Error('Client login failed: ' + clientLogin.data.error?.message);
    }
    
    console.log('✅ Client logged in successfully');
    const clientToken = clientLogin.data.data.token;

    // Step 2: Create a new service request as client
    console.log('\n2️⃣ Creating new service request...');
    const createRequest = await makeRequest('http://localhost:8000/api/client/requests', {
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
    
    if (!createRequest.data.success) {
      throw new Error('Request creation failed: ' + createRequest.data.error?.message);
    }
    
    console.log('✅ Service request created successfully');
    console.log(`📋 Request ID: ${createRequest.data.data.id}`);

    // Step 3: Login as admin
    console.log('\n3️⃣ Logging in as admin...');
    const adminLogin = await makeRequest('http://localhost:8000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'admin@example.com',
        password: 'admin123'
      })
    });
    
    if (!adminLogin.data.success) {
      throw new Error('Admin login failed: ' + adminLogin.data.error?.message);
    }
    
    console.log('✅ Admin logged in successfully');
    const adminToken = adminLogin.data.data.token;

    // Step 4: Check admin notifications
    console.log('\n4️⃣ Checking admin notifications...');
    const adminNotifications = await makeRequest('http://localhost:8000/api/notifications', {
      headers: {
        'Authorization': `Bearer ${adminToken}`
      }
    });
    
    if (adminNotifications.data.success) {
      console.log(`✅ Admin has ${adminNotifications.data.data.length} notifications`);
      adminNotifications.data.data.forEach((notif, index) => {
        console.log(`  ${index + 1}. ${notif.title}: ${notif.message}`);
      });
    } else {
      console.log('❌ Failed to get admin notifications:', adminNotifications.data.error);
    }

    // Step 5: Admin changes status of the request
    console.log('\n5️⃣ Admin changing request status...');
    const statusUpdate = await makeRequest(`http://localhost:8000/api/admin/requests/${createRequest.data.data.id}/status`, {
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
    
    if (!statusUpdate.data.success) {
      throw new Error('Status update failed: ' + statusUpdate.data.error?.message);
    }
    
    console.log('✅ Request status updated successfully');

    // Step 6: Check client notifications
    console.log('\n6️⃣ Checking client notifications...');
    const clientNotifications = await makeRequest('http://localhost:8000/api/notifications', {
      headers: {
        'Authorization': `Bearer ${clientToken}`
      }
    });
    
    if (clientNotifications.data.success) {
      console.log(`✅ Client has ${clientNotifications.data.data.length} notifications`);
      clientNotifications.data.data.forEach((notif, index) => {
        console.log(`  ${index + 1}. ${notif.title}: ${notif.message} (${notif.status})`);
      });
    } else {
      console.log('❌ Failed to get client notifications:', clientNotifications.data.error);
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
