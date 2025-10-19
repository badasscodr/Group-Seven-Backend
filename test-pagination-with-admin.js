/**
 * Test pagination with the existing admin account
 */

const API_BASE_URL = 'http://localhost:8000/api';

// Use the admin account that was already created
const ADMIN_CREDENTIALS = {
  email: 'admin@example.com',
  password: 'Password123'
};

async function makeAuthenticatedRequest(endpoint, options = {}) {
  try {
    // First login to get auth token
    const loginResponse = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(ADMIN_CREDENTIALS)
    });

    if (!loginResponse.ok) {
      console.log(`❌ Login failed: ${loginResponse.status}`);
      const errorText = await loginResponse.text();
      console.log(`Error details: ${errorText}`);
      return null;
    }

    const loginData = await loginResponse.json();
    const token = loginData.data?.accessToken || loginData.data?.token;

    if (!token) {
      console.log('❌ No access token received from login');
      console.log('Login response:', loginData);
      return null;
    }

    console.log('✅ Login successful');

    // Make authenticated request
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        ...options.headers
      }
    });

    return response;
  } catch (error) {
    console.log(`❌ Request error: ${error.message}`);
    return null;
  }
}

async function testPaginationNow() {
  console.log('🔍 Testing Admin Pagination with Existing Account');
  console.log('===============================================');

  // Test different page sizes
  const testCases = [
    { limit: 5, description: '5 items per page' },
    { limit: 10, description: '10 items per page' },
    { limit: 20, description: '20 items per page (current default)' },
    { limit: 50, description: '50 items per page' },
  ];

  for (const testCase of testCases) {
    console.log(`\n📋 Testing: ${testCase.description}`);
    console.log(`🔢 Parameters: limit=${testCase.limit}, page=1`);

    const endpoint = `/admin/requests?limit=${testCase.limit}&page=1`;
    
    const response = await makeAuthenticatedRequest(endpoint);
    
    if (!response) {
      console.log('❌ Failed to make request');
      continue;
    }

    const data = await response.json();

    if (!response.ok) {
      console.log(`❌ API Error: ${response.status}`);
      console.log(`Error: ${data.error?.message || 'Unknown error'}`);
      continue;
    }

    if (!data.success) {
      console.log(`❌ Business Logic Error: ${data.error?.message || 'Unknown error'}`);
      continue;
    }

    const { requests, pagination } = data.data;

    console.log(`✅ Response successful`);
    console.log(`📊 Results: ${requests.length} requests returned`);
    
    if (pagination) {
      console.log(`📄 Pagination Info:`);
      console.log(`   - Current Page: ${pagination.page}`);
      console.log(`   - Page Limit: ${pagination.limit}`);
      console.log(`   - Total Items: ${pagination.total}`);
      console.log(`   - Total Pages: ${pagination.totalPages}`);
      console.log(`   - Should Show Pagination: ${pagination.totalPages > 1 ? 'YES ✅' : 'NO ❌'}`);
      
      if (pagination.totalPages > 1) {
        console.log(`🎉 Pagination WILL BE VISIBLE for this case!`);
        
        // Test page 2
        console.log(`🔍 Testing page 2...`);
        const page2Response = await makeAuthenticatedRequest(`/admin/requests?limit=${testCase.limit}&page=2`);
        if (page2Response) {
          const page2Data = await page2Response.json();
          if (page2Data.success) {
            console.log(`✅ Page 2 has ${page2Data.data.requests.length} items`);
          }
        }
      } else {
        console.log(`👁️  Pagination will be HIDDEN (totalPages = ${pagination.totalPages})`);
        console.log(`💡 Need more than ${testCase.limit} total requests to see pagination`);
      }
    } else {
      console.log(`❌ No pagination data in response`);
    }

    // Show sample request data
    if (requests.length > 0) {
      console.log(`📋 Sample Request Data:`);
      const sample = requests[0];
      console.log(`   - ID: ${sample.id}`);
      console.log(`   - Title: ${sample.title}`);
      console.log(`   - Status: ${sample.status}`);
      console.log(`   - Client: ${sample.client_first_name} ${sample.client_last_name}`);
      console.log(`   - Created: ${sample.created_at}`);
    }
  }

  // Create a simple test request if needed
  console.log(`\n🔧 Checking if we need to create test data...`);
  
  const totalResponse = await makeAuthenticatedRequest('/admin/requests?limit=1000');
  if (totalResponse) {
    const totalData = await totalResponse.json();
    if (totalData.success) {
      const totalRequests = totalData.data.requests.length;
      console.log(`📈 Total requests in database: ${totalRequests}`);
      
      if (totalRequests < 25) {
        console.log(`💡 Only ${totalRequests} requests found. Pagination might not be visible.`);
        console.log(`🔧 You need more than 20 requests to see pagination with the default limit.`);
        console.log(`📝 Try creating some service requests through the client interface first.`);
      } else {
        console.log(`✅ You have ${totalRequests} requests - pagination should work!`);
      }
    }
  }

  console.log(`\n🎯 Summary:`);
  console.log(`- Admin credentials: admin@example.com / Password123`);
  console.log(`- Pagination UI is now ALWAYS visible for debugging`);
  console.log(`- Use the page size buttons (5, 10, 20) to test different limits`);
  console.log(`- Check the yellow text that indicates when pagination would be hidden`);
  console.log(`- Create more service requests through the client interface if needed`);
}

// Run the test
testPaginationNow().catch(error => {
  console.error('❌ Test script error:', error);
});
