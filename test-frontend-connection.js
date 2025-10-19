const http = require('http');

// Test the notification API endpoint
function testNotificationAPI() {
  const options = {
    hostname: 'localhost',
    port: 8000,
    path: '/api/notifications',
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer test-token' // We'll test without auth first
    }
  };

  const req = http.request(options, (res) => {
    console.log(`🔍 Testing notification API...`);
    console.log(`📊 Status Code: ${res.statusCode}`);
    console.log(`📋 Headers:`, res.headers);

    let data = '';
    res.on('data', (chunk) => {
      data += chunk;
    });

    res.on('end', () => {
      try {
        const response = JSON.parse(data);
        console.log('✅ API Response:', response);
        
        if (res.statusCode === 200) {
          console.log('🎉 Notification API is working!');
        } else if (res.statusCode === 401) {
          console.log('🔐 API requires authentication (this is expected)');
        } else {
          console.log('⚠️ Unexpected status code');
        }
      } catch (error) {
        console.log('❌ Failed to parse response:', error.message);
        console.log('Raw response:', data);
      }
    });
  });

  req.on('error', (error) => {
    console.error('❌ Request failed:', error.message);
  });

  req.end();
}

// Test health endpoint
function testHealthAPI() {
  const options = {
    hostname: 'localhost',
    port: 8000,
    path: '/health',
    method: 'GET'
  };

  const req = http.request(options, (res) => {
    console.log(`🏥 Testing health endpoint...`);
    console.log(`📊 Status Code: ${res.statusCode}`);

    let data = '';
    res.on('data', (chunk) => {
      data += chunk;
    });

    res.on('end', () => {
      try {
        const response = JSON.parse(data);
        console.log('✅ Health check response:', response);
      } catch (error) {
        console.log('❌ Failed to parse health response:', error.message);
      }
    });
  });

  req.on('error', (error) => {
    console.error('❌ Health check failed:', error.message);
  });

  req.end();
}

console.log('🧪 Testing backend API connectivity...\n');

testHealthAPI();
setTimeout(() => {
  testNotificationAPI();
}, 1000);
