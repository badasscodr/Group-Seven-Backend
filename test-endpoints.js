const http = require('http');

const API_URL = 'http://localhost:8000';

// Helper function to make HTTP requests
function makeRequest(method, path, data = null, token = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, API_URL);
    const options = {
      method,
      headers: {
        'Content-Type': 'application/json',
      }
    };

    if (token) {
      options.headers['Authorization'] = `Bearer ${token}`;
    }

    const req = http.request(url, options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          const jsonBody = JSON.parse(body);
          resolve({ status: res.statusCode, data: jsonBody });
        } catch {
          resolve({ status: res.statusCode, data: body });
        }
      });
    });

    req.on('error', reject);

    if (data) {
      req.write(JSON.stringify(data));
    }

    req.end();
  });
}

async function testEndpoints() {
  console.log('🧪 Testing Job, Payment, and Visa Endpoints\n');

  try {
    // Test 1: Health Check
    console.log('1️⃣  Testing Health Check...');
    const health = await makeRequest('GET', '/health');
    console.log(health.status === 200 ? '✅ Health check passed' : '❌ Health check failed');
    console.log(`   Response: ${JSON.stringify(health.data)}\n`);

    // Test 2: Register a new test user and login
    console.log('2️⃣  Testing Registration and Login...');

    const testEmail = `test${Date.now()}@test.com`;
    const testPassword = 'Test123!@#';

    // Register
    const register = await makeRequest('POST', '/api/auth/register', {
      email: testEmail,
      password: testPassword,
      firstName: 'Test',
      lastName: 'User',
      phone: '1234567890',
      role: 'admin'
    });

    console.log(register.data.success ? '✅ Registration successful' : `⚠️  Registration: ${register.data.error?.message}`);

    // Login
    const login = await makeRequest('POST', '/api/auth/login', {
      email: testEmail,
      password: testPassword
    });

    if (login.status === 200 && login.data.success) {
      console.log('✅ Login successful');
      const token = login.data.data.accessToken;
      console.log(`   Token: ${token.substring(0, 20)}...\n`);

      // Test 3: Get Jobs
      console.log('3️⃣  Testing GET /api/jobs...');
      const jobs = await makeRequest('GET', '/api/jobs', null, token);
      console.log(jobs.data.success ? `✅ Jobs retrieved: ${jobs.data.data?.jobs?.length || 0} jobs` : '❌ Failed to get jobs');
      console.log(`   Response: ${JSON.stringify(jobs.data).substring(0, 150)}...\n`);

      // Test 4: Get Applications
      console.log('4️⃣  Testing GET /api/applications...');
      const apps = await makeRequest('GET', '/api/applications', null, token);
      console.log(apps.data.success ? `✅ Applications retrieved: ${apps.data.data?.applications?.length || 0} applications` : '❌ Failed to get applications');
      console.log(`   Response: ${JSON.stringify(apps.data).substring(0, 150)}...\n`);

      // Test 5: Get Payments
      console.log('5️⃣  Testing GET /api/payments...');
      const payments = await makeRequest('GET', '/api/payments', null, token);
      console.log(payments.data.success ? `✅ Payments retrieved: ${payments.data.data?.payments?.length || 0} payments` : '❌ Failed to get payments');
      console.log(`   Response: ${JSON.stringify(payments.data).substring(0, 150)}...\n`);

      // Test 6: Get Visa Documents
      console.log('6️⃣  Testing GET /api/visa...');
      const visas = await makeRequest('GET', '/api/visa', null, token);
      console.log(visas.data.success ? `✅ Visa documents retrieved: ${visas.data.data?.visas?.length || 0} visas` : '❌ Failed to get visas');
      console.log(`   Response: ${JSON.stringify(visas.data).substring(0, 150)}...\n`);

      // Test 7: Get Job Stats
      console.log('7️⃣  Testing GET /api/jobs/stats...');
      const jobStats = await makeRequest('GET', '/api/jobs/stats', null, token);
      console.log(jobStats.data.success ? '✅ Job stats retrieved' : '❌ Failed to get job stats');
      console.log(`   Response: ${JSON.stringify(jobStats.data)}\n`);

      // Test 8: Get Payment Stats
      console.log('8️⃣  Testing GET /api/payments/stats...');
      const paymentStats = await makeRequest('GET', '/api/payments/stats', null, token);
      console.log(paymentStats.data.success ? '✅ Payment stats retrieved' : '❌ Failed to get payment stats');
      console.log(`   Response: ${JSON.stringify(paymentStats.data)}\n`);

      // Test 9: Get Visa Stats
      console.log('9️⃣  Testing GET /api/visa/stats...');
      const visaStats = await makeRequest('GET', '/api/visa/stats', null, token);
      console.log(visaStats.data.success ? '✅ Visa stats retrieved' : '❌ Failed to get visa stats');
      console.log(`   Response: ${JSON.stringify(visaStats.data)}\n`);

    } else {
      console.log('❌ Login failed - cannot test authenticated endpoints');
      console.log(`   Response: ${JSON.stringify(login.data)}\n`);
    }

    console.log('✨ Endpoint testing complete!');

  } catch (error) {
    console.error('❌ Test failed:', error);
    process.exit(1);
  }
}

testEndpoints();
