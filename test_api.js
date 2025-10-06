/**
 * API Test Script
 * Tests backend endpoints after migration
 */

const API_URL = 'http://localhost:8000';

async function testAPI() {
  console.log('\n🧪 TESTING GROUP SEVEN API\n');

  try {
    // Test 1: Health check
    console.log('[1/4] Testing health endpoint...');
    const healthResponse = await fetch(`${API_URL}/health`);
    const healthData = await healthResponse.json();
    console.log('✅ Health:', healthData.message);

    // Test 2: Register user
    console.log('\n[2/4] Testing user registration...');
    const registerData = {
      email: `test${Date.now()}@example.com`,
      password: 'Test@123456',
      firstName: 'Test',
      lastName: 'User',
      role: 'client',
      phone: '+1234567890'
    };

    const registerResponse = await fetch(`${API_URL}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(registerData)
    });

    const registerResult = await registerResponse.json();

    if (registerResult.success) {
      console.log('✅ Registration successful!');
      console.log('   User ID:', registerResult.data.user.id);
      console.log('   Email:', registerResult.data.user.email);
      console.log('   Name:', registerResult.data.user.firstName, registerResult.data.user.lastName);

      const token = registerResult.data.accessToken;

      // Test 3: Get user profile
      console.log('\n[3/4] Testing profile endpoint...');
      const profileResponse = await fetch(`${API_URL}/api/users/profile`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      const profileResult = await profileResponse.json();
      if (profileResult.success) {
        console.log('✅ Profile retrieved!');
        console.log('   Role:', profileResult.data.role);
        console.log('   Active:', profileResult.data.isActive);
      } else {
        console.log('❌ Profile failed:', profileResult.error?.message);
      }

      // Test 4: Login
      console.log('\n[4/4] Testing login...');
      const loginResponse = await fetch(`${API_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: registerData.email,
          password: registerData.password
        })
      });

      const loginResult = await loginResponse.json();
      if (loginResult.success) {
        console.log('✅ Login successful!');
        console.log('   Token received:', loginResult.data.accessToken ? 'Yes' : 'No');
      } else {
        console.log('❌ Login failed:', loginResult.error?.message);
      }

    } else {
      console.log('❌ Registration failed:', registerResult.error?.message);
      if (registerResult.error?.details) {
        console.log('   Details:', registerResult.error.details);
      }
    }

    console.log('\n✅ API TESTS COMPLETED!\n');

  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    console.error('   Make sure the backend server is running on port 8000\n');
  }
}

testAPI();
