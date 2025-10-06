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
      },
      timeout: 10000
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

let testResults = {
  total: 0,
  passed: 0,
  failed: 0,
  tests: []
};

function recordTest(name, passed, message = '') {
  testResults.total++;
  if (passed) {
    testResults.passed++;
    console.log(`✅ ${name}`);
  } else {
    testResults.failed++;
    console.log(`❌ ${name}`);
    if (message) console.log(`   ${message}`);
  }
  testResults.tests.push({ name, passed, message });
}

async function comprehensiveTest() {
  console.log('🧪 COMPREHENSIVE API ENDPOINT TESTING\n');
  console.log('=' .repeat(60));

  try {
    // ===== SECTION 1: HEALTH & INFRASTRUCTURE =====
    console.log('\n📡 SECTION 1: Health & Infrastructure');
    console.log('-'.repeat(60));

    const health = await makeRequest('GET', '/health');
    recordTest('Health Check', health.status === 200);

    const ready = await makeRequest('GET', '/ready');
    recordTest('Readiness Check', ready.status === 200);

    // ===== SECTION 2: AUTHENTICATION =====
    console.log('\n🔐 SECTION 2: Authentication');
    console.log('-'.repeat(60));

    // Login with test admin user
    const login = await makeRequest('POST', '/api/auth/login', {
      email: 'testadmin@test.com',
      password: 'Test123!@#'
    });

    let token = null;
    if (login.status === 200 && login.data.success) {
      token = login.data.data.accessToken;
      recordTest('Admin Login', true, `Token: ${token.substring(0, 20)}...`);
    } else {
      recordTest('Admin Login', false, login.data.error?.message || 'Failed');
      console.log('\n⚠️  Cannot proceed with authenticated tests without token');
      return;
    }

    // ===== SECTION 3: USER MANAGEMENT =====
    console.log('\n👥 SECTION 3: User Management');
    console.log('-'.repeat(60));

    const profile = await makeRequest('GET', '/api/users/profile', null, token);
    recordTest('Get User Profile', profile.status === 200 && profile.data.success);

    // ===== SECTION 4: JOB MODULE =====
    console.log('\n💼 SECTION 4: Job Module');
    console.log('-'.repeat(60));

    const jobs = await makeRequest('GET', '/api/jobs', null, token);
    recordTest('Get All Jobs', jobs.status === 200 && jobs.data.success);
    if (jobs.data.data?.jobs) {
      console.log(`   Found ${jobs.data.data.jobs.length} jobs`);
    }

    const jobStats = await makeRequest('GET', '/api/jobs/stats', null, token);
    recordTest('Get Job Statistics', jobStats.status === 200 && jobStats.data.success);
    if (jobStats.data.data?.stats) {
      console.log(`   Total jobs: ${jobStats.data.data.stats.total_jobs || 0}`);
      console.log(`   Published: ${jobStats.data.data.stats.published_jobs || 0}`);
    }

    const applications = await makeRequest('GET', '/api/applications', null, token);
    recordTest('Get Applications', applications.status === 200 && applications.data.success);
    if (applications.data.data?.applications) {
      console.log(`   Found ${applications.data.data.applications.length} applications`);
    }

    const interviews = await makeRequest('GET', '/api/interviews', null, token);
    recordTest('Get Interviews', interviews.status === 200 && interviews.data.success);

    // Create a test job posting
    const newJob = await makeRequest('POST', '/api/jobs', {
      title: 'Test Backend Developer',
      description: 'Test job posting for automated testing',
      jobType: 'full_time',
      location: 'Remote',
      experienceRequired: 2,
      salaryMin: 50000,
      salaryMax: 80000,
      skillsRequired: ['Node.js', 'TypeScript'],
      status: 'published'
    }, token);
    recordTest('Create Job Posting', newJob.status === 201 && newJob.data.success);

    let createdJobId = null;
    if (newJob.data.success && newJob.data.data?.job?.id) {
      createdJobId = newJob.data.data.job.id;
      console.log(`   Created job ID: ${createdJobId}`);

      // Get specific job
      const specificJob = await makeRequest('GET', `/api/jobs/${createdJobId}`, null, token);
      recordTest('Get Specific Job', specificJob.status === 200 && specificJob.data.success);

      // Update job
      const updateJob = await makeRequest('PUT', `/api/jobs/${createdJobId}`, {
        title: 'Updated Test Backend Developer'
      }, token);
      recordTest('Update Job Posting', updateJob.status === 200 && updateJob.data.success);

      // Delete job
      const deleteJob = await makeRequest('DELETE', `/api/jobs/${createdJobId}`, null, token);
      recordTest('Delete Job Posting', deleteJob.status === 200 && deleteJob.data.success);
    }

    // ===== SECTION 5: PAYMENT MODULE =====
    console.log('\n💰 SECTION 5: Payment Module');
    console.log('-'.repeat(60));

    const payments = await makeRequest('GET', '/api/payments', null, token);
    recordTest('Get All Payments', payments.status === 200 && payments.data.success);
    if (payments.data.data?.payments) {
      console.log(`   Found ${payments.data.data.payments.length} payments`);
    }

    const paymentStats = await makeRequest('GET', '/api/payments/stats', null, token);
    recordTest('Get Payment Statistics', paymentStats.status === 200 && paymentStats.data.success);
    if (paymentStats.data.data?.stats) {
      console.log(`   Total payments: ${paymentStats.data.data.stats.totalPayments || 0}`);
      console.log(`   Total amount: $${paymentStats.data.data.stats.totalAmount || 0}`);
    }

    const overduePayments = await makeRequest('GET', '/api/payments/overdue', null, token);
    recordTest('Get Overdue Payments', overduePayments.status === 200 && overduePayments.data.success);

    // ===== SECTION 6: VISA MODULE =====
    console.log('\n🛂 SECTION 6: Visa Module');
    console.log('-'.repeat(60));

    const visas = await makeRequest('GET', '/api/visa', null, token);
    recordTest('Get All Visas', visas.status === 200 && visas.data.success);
    if (visas.data.data?.visas) {
      console.log(`   Found ${visas.data.data.visas.length} visa documents`);
    }

    const visaStats = await makeRequest('GET', '/api/visa/stats', null, token);
    recordTest('Get Visa Statistics', visaStats.status === 200 && visaStats.data.success);
    if (visaStats.data.data?.stats) {
      console.log(`   Total visas: ${visaStats.data.data.stats.totalVisas || 0}`);
      console.log(`   Active: ${visaStats.data.data.stats.activeVisas || 0}`);
      console.log(`   Expiring soon: ${visaStats.data.data.stats.expiringWithin30Days || 0}`);
    }

    // ===== SECTION 7: DOCUMENT MODULE =====
    console.log('\n📄 SECTION 7: Document Module');
    console.log('-'.repeat(60));

    const documents = await makeRequest('GET', '/api/documents', null, token);
    recordTest('Get All Documents', documents.status === 200 && documents.data.success);
    if (documents.data.data?.documents) {
      console.log(`   Found ${documents.data.data.documents.length} documents`);
    }

    // ===== SECTION 8: SERVICE REQUESTS =====
    console.log('\n📋 SECTION 8: Service Requests (Client Module)');
    console.log('-'.repeat(60));

    const requests = await makeRequest('GET', '/api/client/requests', null, token);
    recordTest('Get Service Requests', requests.status === 200 && requests.data.success);

    // ===== SECTION 9: SUPPLIER MODULE =====
    console.log('\n🏢 SECTION 9: Supplier Module');
    console.log('-'.repeat(60));

    const availableRequests = await makeRequest('GET', '/api/supplier/requests', null, token);
    recordTest('Get Available Requests (Supplier)', availableRequests.status === 200 && availableRequests.data.success);

    const quotations = await makeRequest('GET', '/api/supplier/quotations', null, token);
    recordTest('Get Supplier Quotations', quotations.status === 200 && quotations.data.success);

    // ===== SECTION 10: ADMIN MODULE =====
    console.log('\n⚙️  SECTION 10: Admin Module');
    console.log('-'.repeat(60));

    const adminStats = await makeRequest('GET', '/api/admin/stats', null, token);
    recordTest('Get Admin Statistics', adminStats.status === 200 && adminStats.data.success);

    const allUsers = await makeRequest('GET', '/api/admin/users', null, token);
    recordTest('Get All Users (Admin)', allUsers.status === 200 && allUsers.data.success);
    if (allUsers.data.data?.users) {
      console.log(`   Total users: ${allUsers.data.data.users.length}`);
    }

    // ===== SECTION 11: MESSAGING =====
    console.log('\n💬 SECTION 11: Messaging Module');
    console.log('-'.repeat(60));

    const conversations = await makeRequest('GET', '/api/messages/conversations', null, token);
    recordTest('Get Conversations', conversations.status === 200 && conversations.data.success);

    // ===== SECTION 12: NOTIFICATIONS =====
    console.log('\n🔔 SECTION 12: Notifications Module');
    console.log('-'.repeat(60));

    const notifications = await makeRequest('GET', '/api/notifications', null, token);
    recordTest('Get Notifications', notifications.status === 200 && notifications.data.success);

    // ===== SECTION 13: ASSIGNMENTS =====
    console.log('\n📊 SECTION 13: Assignments Module');
    console.log('-'.repeat(60));

    const projects = await makeRequest('GET', '/api/assignments/projects', null, token);
    recordTest('Get Projects', projects.status === 200 && projects.data.success);

    const assignments = await makeRequest('GET', '/api/assignments', null, token);
    recordTest('Get Assignments', assignments.status === 200 && assignments.data.success);

    // ===== FINAL SUMMARY =====
    console.log('\n' + '='.repeat(60));
    console.log('📊 TEST SUMMARY');
    console.log('='.repeat(60));
    console.log(`Total Tests: ${testResults.total}`);
    console.log(`✅ Passed: ${testResults.passed}`);
    console.log(`❌ Failed: ${testResults.failed}`);
    console.log(`Success Rate: ${((testResults.passed / testResults.total) * 100).toFixed(1)}%`);

    if (testResults.failed > 0) {
      console.log('\n❌ Failed Tests:');
      testResults.tests.filter(t => !t.passed).forEach(t => {
        console.log(`   - ${t.name}: ${t.message}`);
      });
    }

    console.log('\n✨ Testing Complete!\n');

  } catch (error) {
    console.error('\n❌ Test suite failed:', error);
    process.exit(1);
  }
}

comprehensiveTest();
