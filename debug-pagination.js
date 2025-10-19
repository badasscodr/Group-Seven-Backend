/**
 * Debug Pagination Implementation
 * Check if pagination is working and why it might not be visible
 */

const API_BASE_URL = 'http://localhost:8000/api';

// Test admin credentials
const ADMIN_CREDENTIALS = {
  email: 'admin@gsiprojects.com',
  password: 'Admin@123456'
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

async function debugPagination() {
  console.log('🔍 Debugging Admin Requests Pagination');
  console.log('=========================================');

  // Test different page sizes to see if pagination appears
  const testCases = [
    { limit: 5, page: 1, description: 'Small page size (5 items)' },
    { limit: 2, page: 1, description: 'Very small page size (2 items)' },
    { limit: 1, page: 1, description: 'Single item per page' },
    { limit: 10, page: 1, description: 'Default page size (10 items)' },
    { limit: 20, page: 1, description: 'Current page size (20 items)' },
    { limit: 50, page: 1, description: 'Large page size (50 items)' },
  ];

  for (const testCase of testCases) {
    console.log(`\n📋 Testing: ${testCase.description}`);
    console.log(`🔢 Parameters: limit=${testCase.limit}, page=${testCase.page}`);

    const queryString = `limit=${testCase.limit}&page=${testCase.page}`;
    const endpoint = `/admin/requests?${queryString}`;
    
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
      console.log(`   - Should Show Pagination: ${pagination.totalPages > 1 ? 'YES' : 'NO'}`);
      
      if (pagination.totalPages > 1) {
        console.log(`🎉 Pagination should be VISIBLE for this case!`);
      } else {
        console.log(`👁️  Pagination will be HIDDEN (totalPages = ${pagination.totalPages})`);
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

  // Test what happens with page 2
  console.log(`\n🔍 Testing Page 2 (to see if there are more items)`);
  const page2Response = await makeAuthenticatedRequest('/admin/requests?page=2&limit=5');
  
  if (page2Response) {
    const page2Data = await page2Response.json();
    if (page2Data.success) {
      console.log(`✅ Page 2 has ${page2Data.data.requests.length} items`);
      if (page2Data.data.requests.length > 0) {
        console.log(`🎉 There ARE items on page 2 - pagination should be visible!`);
      } else {
        console.log(`📭 No items on page 2 - this explains why pagination isn't visible`);
      }
    }
  }

  // Check total count without pagination
  console.log(`\n🔍 Checking total count (without pagination)`);
  const totalResponse = await makeAuthenticatedRequest('/admin/requests?limit=1000');
  
  if (totalResponse) {
    const totalData = await totalResponse.json();
    if (totalData.success) {
      console.log(`✅ Total requests in database: ${totalData.data.requests.length}`);
      
      if (totalData.data.pagination) {
        console.log(`📄 Pagination says total: ${totalData.data.pagination.total}`);
      }
      
      if (totalData.data.requests.length <= 20) {
        console.log(`👁️  Total requests (${totalData.data.requests.length}) <= page limit (20)`);
        console.log(`   This explains why pagination isn't visible!`);
        console.log(`   Need more than 20 requests to see pagination.`);
      } else {
        console.log(`🎉 Total requests (${totalData.data.requests.length}) > page limit (20)`);
        console.log(`   Pagination should be visible! Something is wrong.`);
      }
    }
  }
}

// Run the debug test
debugPagination().catch(error => {
  console.error('❌ Debug script error:', error);
});
