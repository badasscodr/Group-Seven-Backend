import pool from '../core/config/database';

async function testEndpoints() {
  try {
    console.log('🧪 Testing Database Queries for Job, Payment, and Visa modules\n');

    // Test 1: Job Postings Query
    console.log('📋 Test 1: Job Postings Query');
    try {
      const jobQuery = `
        SELECT jp.*, u.first_name, u.last_name, u.email as posted_by_email,
               (SELECT COUNT(*) FROM job_applications WHERE job_id = jp.id) as application_count
        FROM job_postings jp
        LEFT JOIN users u ON jp.posted_by = u.id
        LIMIT 5
      `;
      const jobResult = await pool.query(jobQuery);
      console.log(`✅ Jobs found: ${jobResult.rows.length}`);
      if (jobResult.rows.length > 0) {
        console.log(`   Sample: ${jobResult.rows[0].title}`);
      }
    } catch (error: any) {
      console.log(`❌ Job query failed: ${error.message}`);
    }

    // Test 2: Payments Query with Joins
    console.log('\n💰 Test 2: Payments Query with Quotations');
    try {
      const paymentQuery = `
        SELECT p.*,
               s.first_name as supplier_first_name, s.last_name as supplier_last_name,
               s.email as supplier_email,
               c.first_name as client_first_name, c.last_name as client_last_name,
               c.email as client_email,
               q.amount as quotation_amount, q.description as quotation_description,
               sr.title as service_request_title
        FROM payments p
        LEFT JOIN users s ON p.supplier_id = s.id
        LEFT JOIN users c ON p.client_id = c.id
        LEFT JOIN quotations q ON p.quotation_id = q.id
        LEFT JOIN service_requests sr ON q.service_request_id = sr.id
        LIMIT 5
      `;
      const paymentResult = await pool.query(paymentQuery);
      console.log(`✅ Payments found: ${paymentResult.rows.length}`);
      if (paymentResult.rows.length > 0) {
        console.log(`   Sample amount: $${paymentResult.rows[0].amount}`);
      }
    } catch (error: any) {
      console.log(`❌ Payment query failed: ${error.message}`);
    }

    // Test 3: Visa Documents Query
    console.log('\n🛂 Test 3: Visa Documents Query');
    try {
      const visaQuery = `
        SELECT
          vd.*,
          d.filename, d.original_name, d.file_url, d.file_size, d.mime_type,
          u.first_name, u.last_name, u.email, u.role
        FROM visa_documents vd
        LEFT JOIN documents d ON vd.document_id = d.id
        LEFT JOIN users u ON vd.user_id = u.id
        LIMIT 5
      `;
      const visaResult = await pool.query(visaQuery);
      console.log(`✅ Visa documents found: ${visaResult.rows.length}`);
      if (visaResult.rows.length > 0) {
        console.log(`   Sample visa type: ${visaResult.rows[0].visa_type}`);
      }
    } catch (error: any) {
      console.log(`❌ Visa query failed: ${error.message}`);
    }

    // Test 4: Check for updated_at columns
    console.log('\n🔧 Test 4: Check updated_at Columns');
    const tables = ['job_postings', 'job_applications', 'interviews', 'payments'];
    for (const table of tables) {
      try {
        const columnCheck = await pool.query(`
          SELECT column_name
          FROM information_schema.columns
          WHERE table_name = $1 AND column_name = 'updated_at'
        `, [table]);

        if (columnCheck.rows.length > 0) {
          console.log(`✅ ${table}: updated_at column exists`);
        } else {
          console.log(`⚠️  ${table}: missing updated_at column`);
        }
      } catch (error: any) {
        console.log(`❌ ${table}: ${error.message}`);
      }
    }

    // Test 5: Application with Job details
    console.log('\n📝 Test 5: Applications Query');
    try {
      const appQuery = `
        SELECT ja.*,
               u.first_name, u.last_name, u.email as candidate_email,
               jp.title as job_title, jp.company, jp.location
        FROM job_applications ja
        LEFT JOIN users u ON ja.candidate_id = u.id
        LEFT JOIN job_postings jp ON ja.job_id = jp.id
        LIMIT 5
      `;
      const appResult = await pool.query(appQuery);
      console.log(`✅ Applications found: ${appResult.rows.length}`);
    } catch (error: any) {
      console.log(`❌ Applications query failed: ${error.message}`);
    }

    // Test 6: Interview scheduling
    console.log('\n📅 Test 6: Interviews Query');
    try {
      const interviewQuery = `
        SELECT i.*,
               ja.candidate_id, ja.job_id,
               u.first_name, u.last_name, u.email as candidate_email,
               jp.title as job_title
        FROM interviews i
        LEFT JOIN job_applications ja ON i.application_id = ja.id
        LEFT JOIN users u ON ja.candidate_id = u.id
        LEFT JOIN job_postings jp ON ja.job_id = jp.id
        LIMIT 5
      `;
      const interviewResult = await pool.query(interviewQuery);
      console.log(`✅ Interviews found: ${interviewResult.rows.length}`);
    } catch (error: any) {
      console.log(`❌ Interviews query failed: ${error.message}`);
    }

    console.log('\n✨ Database query tests complete!');
    await pool.end();
  } catch (error) {
    console.error('❌ Test failed:', error);
    process.exit(1);
  }
}

testEndpoints();
