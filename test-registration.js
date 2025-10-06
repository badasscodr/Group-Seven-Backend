const API_URL = 'http://localhost:8000/api';

async function testRegistration(role, testData) {
  console.log(`\n🧪 Testing ${role} registration...`);

  try {
    const response = await fetch(`${API_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testData)
    });

    const data = await response.json();

    if (data.success) {
      console.log(`✅ ${role} registration SUCCESS`);
      console.log(`   User ID: ${data.data.user.id}`);
      console.log(`   Email: ${data.data.user.email}`);
      console.log(`   Name: ${data.data.user.firstName} ${data.data.user.lastName}`);
      console.log(`   Token: ${data.data.token ? 'Generated' : 'Missing'}`);
    } else {
      console.log(`❌ ${role} registration FAILED`);
      console.log(`   Error: ${data.error.message}`);
      if (data.error.details) {
        console.log(`   Details:`, JSON.stringify(data.error.details, null, 2));
      }
    }
  } catch (error) {
    console.log(`❌ ${role} registration ERROR: ${error.message}`);
  }
}

async function runTests() {
  console.log('🚀 Starting Registration Tests with camelCase\n');
  console.log('='.repeat(60));

  // Test 1: Employee
  await testRegistration('employee', {
    role: 'employee',
    email: `emp.test.${Date.now()}@example.com`,
    password: 'TestPass123',
    firstName: 'John',
    lastName: 'Doe',
    phone: '+1234567890'
  });

  // Test 2: Client
  await testRegistration('client', {
    role: 'client',
    email: `client.test.${Date.now()}@example.com`,
    password: 'TestPass123',
    firstName: 'Jane',
    lastName: 'Smith',
    phone: '+1234567891',
    profileData: {
      companyName: 'ABC Corp',
      businessType: 'Technology'
    }
  });

  // Test 3: Supplier
  await testRegistration('supplier', {
    role: 'supplier',
    email: `supplier.test.${Date.now()}@example.com`,
    password: 'TestPass123',
    firstName: 'Bob',
    lastName: 'Johnson',
    phone: '+1234567892',
    profileData: {
      companyName: 'XYZ Services',
      businessType: 'Consulting'
    }
  });

  // Test 4: Candidate
  await testRegistration('candidate', {
    role: 'candidate',
    email: `candidate.test.${Date.now()}@example.com`,
    password: 'TestPass123',
    firstName: 'Alice',
    lastName: 'Williams',
    phone: '+1234567893'
  });

  // Test 5: Admin
  await testRegistration('admin', {
    role: 'admin',
    email: `admin.test.${Date.now()}@example.com`,
    password: 'TestPass123',
    firstName: 'Admin',
    lastName: 'User',
    phone: '+1234567894'
  });

  console.log('\n' + '='.repeat(60));
  console.log('✅ All registration tests completed!');
}

runTests().catch(console.error);
