const API_URL = 'http://localhost:8000';

async function testLoginFlow() {
  console.log('\n🔍 TESTING LOGIN VALIDATION\n');
  console.log('═'.repeat(60));

  const timestamp = Date.now();
  const testEmail = `testuser${timestamp}@example.com`;
  const correctPassword = 'Test@123456';
  const wrongPassword = 'WrongPassword123';

  try {
    // Step 1: Register new user
    console.log('\n[1] Registering new user...');
    console.log('   Email:', testEmail);
    console.log('   Password:', correctPassword);

    const registerRes = await fetch(`${API_URL}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: testEmail,
        password: correctPassword,
        firstName: 'Test',
        lastName: 'User',
        role: 'client',
        phone: '+1234567890'
      })
    });

    const registerData = await registerRes.json();
    console.log('   Status:', registerRes.status);
    console.log('   Success:', registerData.success);

    if (!registerData.success) {
      console.log('   ❌ Registration failed:', registerData.error);
      return;
    }

    console.log('   ✅ User registered successfully');
    console.log('   User ID:', registerData.data.user.id);

    // Step 2: Try login with WRONG password
    console.log('\n[2] Testing login with WRONG password...');
    console.log('   Email:', testEmail);
    console.log('   Password:', wrongPassword, '(WRONG)');

    const wrongLoginRes = await fetch(`${API_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: testEmail,
        password: wrongPassword
      })
    });

    const wrongLoginData = await wrongLoginRes.json();
    console.log('   Status:', wrongLoginRes.status);
    console.log('   Response:', JSON.stringify(wrongLoginData, null, 2));

    if (wrongLoginRes.status === 401 || wrongLoginRes.status === 400) {
      console.log('   ✅ PASS - Wrong password correctly rejected');
    } else if (wrongLoginData.success === false) {
      console.log('   ✅ PASS - Wrong password correctly rejected (200 with error)');
    } else {
      console.log('   ❌ FAIL - Wrong password was NOT rejected!');
    }

    // Step 3: Try login with CORRECT password
    console.log('\n[3] Testing login with CORRECT password...');
    console.log('   Email:', testEmail);
    console.log('   Password:', correctPassword, '(CORRECT)');

    const correctLoginRes = await fetch(`${API_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: testEmail,
        password: correctPassword
      })
    });

    const correctLoginData = await correctLoginRes.json();
    console.log('   Status:', correctLoginRes.status);
    console.log('   Success:', correctLoginData.success);

    if (correctLoginData.success && correctLoginData.data.accessToken) {
      console.log('   ✅ PASS - Correct password accepted');
      console.log('   Token received:', correctLoginData.data.accessToken ? 'Yes' : 'No');
      console.log('   User data:', JSON.stringify(correctLoginData.data.user, null, 2));
    } else {
      console.log('   ❌ FAIL - Correct password was rejected!');
      console.log('   Response:', JSON.stringify(correctLoginData, null, 2));
    }

    console.log('\n' + '═'.repeat(60));
    console.log('\n✅ Login validation test completed\n');

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error(error.stack);
  }
}

testLoginFlow();
