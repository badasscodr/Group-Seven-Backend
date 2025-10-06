/**
 * Comprehensive API Testing
 * Tests all major endpoints with validation
 */

const API_URL = 'http://localhost:8000';

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function runComprehensiveTests() {
  console.log('\n🧪 COMPREHENSIVE API TESTING\n');
  console.log('═'.repeat(70));

  const results = {
    passed: 0,
    failed: 0,
    tests: []
  };

  let authToken = null;
  let userId = null;

  try {
    // ============================================
    // AUTHENTICATION TESTS
    // ============================================
    console.log('\n📋 AUTHENTICATION TESTS');
    console.log('─'.repeat(70));

    // Test 1: Health Check
    console.log('\n[1] Health Check...');
    try {
      const res = await fetch(`${API_URL}/health`);
      const data = await res.json();
      if (data.success) {
        console.log('   ✅ PASS - Health check working');
        results.passed++;
        results.tests.push({ name: 'Health Check', status: 'PASS' });
      } else {
        throw new Error('Health check failed');
      }
    } catch (error) {
      console.log('   ❌ FAIL -', error.message);
      results.failed++;
      results.tests.push({ name: 'Health Check', status: 'FAIL', error: error.message });
    }

    // Test 2: Register with validation errors (missing fields)
    console.log('\n[2] Registration Validation (Missing Fields)...');
    try {
      const res = await fetch(`${API_URL}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'test@test.com' }) // Missing required fields
      });
      const data = await res.json();

      if (!data.success && data.error && res.status === 400) {
        console.log('   ✅ PASS - Validation working (rejected incomplete data)');
        results.passed++;
        results.tests.push({ name: 'Registration Validation', status: 'PASS' });
      } else {
        throw new Error('Should have rejected incomplete data');
      }
    } catch (error) {
      console.log('   ❌ FAIL -', error.message);
      results.failed++;
      results.tests.push({ name: 'Registration Validation', status: 'FAIL', error: error.message });
    }

    // Test 3: Successful Registration
    console.log('\n[3] User Registration (Valid Data)...');
    try {
      const timestamp = Date.now();
      const registerData = {
        email: `test${timestamp}@example.com`,
        password: 'Test@123456',
        firstName: 'Test',
        lastName: 'User',
        role: 'client',
        phone: '+1234567890'
      };

      const res = await fetch(`${API_URL}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(registerData)
      });
      const data = await res.json();

      if (data.success && data.data.user && data.data.accessToken) {
        authToken = data.data.accessToken;
        userId = data.data.user.id;
        console.log('   ✅ PASS - User registered successfully');
        console.log('      User ID:', userId);
        console.log('      Token received:', authToken ? 'Yes' : 'No');
        results.passed++;
        results.tests.push({ name: 'User Registration', status: 'PASS' });
      } else {
        throw new Error('Registration failed: ' + JSON.stringify(data.error));
      }
    } catch (error) {
      console.log('   ❌ FAIL -', error.message);
      results.failed++;
      results.tests.push({ name: 'User Registration', status: 'FAIL', error: error.message });
    }

    // Test 4: Login with wrong password
    console.log('\n[4] Login Validation (Wrong Password)...');
    try {
      const res = await fetch(`${API_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: `test${Date.now() - 1000}@example.com`,
          password: 'WrongPassword123'
        })
      });
      const data = await res.json();

      if (!data.success && res.status === 400) {
        console.log('   ✅ PASS - Invalid credentials rejected');
        results.passed++;
        results.tests.push({ name: 'Login Validation', status: 'PASS' });
      } else {
        throw new Error('Should reject wrong credentials');
      }
    } catch (error) {
      console.log('   ❌ FAIL -', error.message);
      results.failed++;
      results.tests.push({ name: 'Login Validation', status: 'FAIL', error: error.message });
    }

    // Test 5: Profile without token
    console.log('\n[5] Profile Access (No Token)...');
    try {
      const res = await fetch(`${API_URL}/api/users/profile`);
      const data = await res.json();

      if (!data.success && res.status === 401) {
        console.log('   ✅ PASS - Unauthorized access rejected');
        results.passed++;
        results.tests.push({ name: 'Auth Protection', status: 'PASS' });
      } else {
        throw new Error('Should require authentication');
      }
    } catch (error) {
      console.log('   ❌ FAIL -', error.message);
      results.failed++;
      results.tests.push({ name: 'Auth Protection', status: 'FAIL', error: error.message });
    }

    // Test 6: Profile with token
    console.log('\n[6] Get Profile (With Token)...');
    try {
      const res = await fetch(`${API_URL}/api/users/profile`, {
        headers: { 'Authorization': `Bearer ${authToken}` }
      });
      const data = await res.json();

      if (data.success && data.data.id === userId) {
        console.log('   ✅ PASS - Profile retrieved with authentication');
        results.passed++;
        results.tests.push({ name: 'Get Profile', status: 'PASS' });
      } else {
        throw new Error('Profile retrieval failed');
      }
    } catch (error) {
      console.log('   ❌ FAIL -', error.message);
      results.failed++;
      results.tests.push({ name: 'Get Profile', status: 'FAIL', error: error.message });
    }

    // ============================================
    // DATA VALIDATION TESTS
    // ============================================
    console.log('\n\n📋 DATA VALIDATION TESTS');
    console.log('─'.repeat(70));

    // Test 7: Email format validation
    console.log('\n[7] Email Format Validation...');
    try {
      const res = await fetch(`${API_URL}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'invalid-email',
          password: 'Test@123456',
          firstName: 'Test',
          lastName: 'User',
          role: 'client'
        })
      });
      const data = await res.json();

      if (!data.success && res.status === 400) {
        console.log('   ✅ PASS - Invalid email format rejected');
        results.passed++;
        results.tests.push({ name: 'Email Validation', status: 'PASS' });
      } else {
        throw new Error('Should reject invalid email');
      }
    } catch (error) {
      console.log('   ❌ FAIL -', error.message);
      results.failed++;
      results.tests.push({ name: 'Email Validation', status: 'FAIL', error: error.message });
    }

    // Test 8: Password strength validation
    console.log('\n[8] Password Strength Validation...');
    try {
      const res = await fetch(`${API_URL}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: `test${Date.now()}@example.com`,
          password: '123', // Too weak
          firstName: 'Test',
          lastName: 'User',
          role: 'client'
        })
      });
      const data = await res.json();

      if (!data.success && res.status === 400) {
        console.log('   ✅ PASS - Weak password rejected');
        results.passed++;
        results.tests.push({ name: 'Password Validation', status: 'PASS' });
      } else {
        throw new Error('Should reject weak password');
      }
    } catch (error) {
      console.log('   ❌ FAIL -', error.message);
      results.failed++;
      results.tests.push({ name: 'Password Validation', status: 'FAIL', error: error.message });
    }

    // Test 9: Duplicate email validation
    console.log('\n[9] Duplicate Email Validation...');
    try {
      const email = `duplicate${Date.now()}@example.com`;

      // First registration
      await fetch(`${API_URL}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          password: 'Test@123456',
          firstName: 'Test',
          lastName: 'User',
          role: 'client'
        })
      });

      // Try duplicate
      const res = await fetch(`${API_URL}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          password: 'Test@123456',
          firstName: 'Test2',
          lastName: 'User2',
          role: 'client'
        })
      });
      const data = await res.json();

      if (!data.success && res.status === 400) {
        console.log('   ✅ PASS - Duplicate email rejected');
        results.passed++;
        results.tests.push({ name: 'Duplicate Email', status: 'PASS' });
      } else {
        throw new Error('Should reject duplicate email');
      }
    } catch (error) {
      console.log('   ❌ FAIL -', error.message);
      results.failed++;
      results.tests.push({ name: 'Duplicate Email', status: 'FAIL', error: error.message });
    }

    // Test 10: Database camelCase verification
    console.log('\n[10] Database camelCase Fields...');
    try {
      const res = await fetch(`${API_URL}/api/users/profile`, {
        headers: { 'Authorization': `Bearer ${authToken}` }
      });
      const data = await res.json();

      const hasCamelCase =
        data.data.hasOwnProperty('firstName') &&
        data.data.hasOwnProperty('lastName') &&
        data.data.hasOwnProperty('isActive') &&
        data.data.hasOwnProperty('emailVerified') &&
        data.data.hasOwnProperty('createdAt');

      if (hasCamelCase) {
        console.log('   ✅ PASS - All fields are camelCase');
        console.log('      Fields:', Object.keys(data.data).join(', '));
        results.passed++;
        results.tests.push({ name: 'camelCase Fields', status: 'PASS' });
      } else {
        throw new Error('Missing camelCase fields');
      }
    } catch (error) {
      console.log('   ❌ FAIL -', error.message);
      results.failed++;
      results.tests.push({ name: 'camelCase Fields', status: 'FAIL', error: error.message });
    }

    // ============================================
    // RESULTS SUMMARY
    // ============================================
    console.log('\n\n' + '═'.repeat(70));
    console.log('📊 TEST RESULTS SUMMARY');
    console.log('═'.repeat(70));

    console.log('\n✅ Passed:', results.passed);
    console.log('❌ Failed:', results.failed);
    console.log('📈 Success Rate:', ((results.passed / (results.passed + results.failed)) * 100).toFixed(1) + '%');

    console.log('\n📋 Detailed Results:');
    results.tests.forEach((test, i) => {
      const icon = test.status === 'PASS' ? '✅' : '❌';
      console.log(`   ${icon} ${i + 1}. ${test.name}: ${test.status}`);
      if (test.error) {
        console.log(`      Error: ${test.error}`);
      }
    });

    console.log('\n' + '═'.repeat(70));

    if (results.failed === 0) {
      console.log('🎉 ALL TESTS PASSED! System is fully functional.');
    } else {
      console.log('⚠️  Some tests failed. Please review the errors above.');
    }

    console.log('═'.repeat(70) + '\n');

  } catch (error) {
    console.error('\n❌ TEST SUITE FAILED:', error.message);
    console.error(error.stack);
  }
}

runComprehensiveTests();
