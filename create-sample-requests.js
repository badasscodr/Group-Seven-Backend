/**
 * Create sample service requests for testing pagination
 */

require('dotenv').config();
const { query } = require('./dist/core/config/database');

async function createSampleRequests() {
  try {
    console.log('🔧 Creating sample service requests for pagination testing...');

    // First, get a client user to associate requests with
    const clientUsers = await query(`
      SELECT id, email, first_name, last_name 
      FROM users 
      WHERE role = 'client' AND is_active = true 
      LIMIT 5
    `);

    if (clientUsers.rows.length === 0) {
      console.log('❌ No client users found. Creating a sample client first...');
      
      const hashedPassword = '$2b$10$rOzJqQjQjQjQjQjQjQjQjOzJqQjQjQjQjQjQjQjQjQjQjQjQjQjQjQ'; // hash for 'Client@123456'
      
      const newClient = await query(`
        INSERT INTO users (email, password_hash, first_name, last_name, role, is_active, created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())
        RETURNING id, email, first_name, last_name
      `, [
        'testclient@gsiprojects.com',
        hashedPassword,
        'Test',
        'Client',
        'client',
        true
      ]);
      
      clientUsers.rows.push(newClient.rows[0]);
    }

    console.log(`✅ Found ${clientUsers.rows.length} client users`);

    // Sample request data
    const sampleRequests = [
      {
        title: 'Urgent Visa Processing for Dubai',
        description: 'Need urgent visa processing for business trip to Dubai. Multiple employees require immediate processing.',
        category: 'visa',
        priority: 'high',
        budget_min: 5000,
        budget_max: 10000,
        deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days from now
        location: 'Dubai, UAE',
        requirements: 'Multiple entry visa, business purpose, 3 employees'
      },
      {
        title: 'Manpower Supply for Construction Project',
        description: 'Looking for skilled labor for ongoing construction project. Need 50 workers with various skills.',
        category: 'manpower',
        priority: 'medium',
        budget_min: 25000,
        budget_max: 50000,
        deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days from now
        location: 'Riyadh, Saudi Arabia',
        requirements: 'Skilled construction workers, safety certified'
      },
      {
        title: 'HR Outsourcing for IT Department',
        description: 'Complete HR outsourcing for growing IT department. Need recruitment, payroll, and compliance management.',
        category: 'hr_outsourcing',
        priority: 'high',
        budget_min: 15000,
        budget_max: 25000,
        deadline: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(), // 14 days from now
        location: 'Remote',
        requirements: 'IT recruitment specialists, payroll processing, compliance management'
      },
      {
        title: 'Transportation Services for Staff',
        description: 'Daily transportation services for office staff. Need buses for 100 employees.',
        category: 'transport',
        priority: 'medium',
        budget_min: 8000,
        budget_max: 12000,
        deadline: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000).toISOString(), // 21 days from now
        location: 'Dammam, Saudi Arabia',
        requirements: 'Air-conditioned buses, experienced drivers, insurance coverage'
      },
      {
        title: 'Student Visa Processing for UK',
        description: 'Student visa processing for multiple students going to UK for higher education.',
        category: 'visa',
        priority: 'medium',
        budget_min: 3000,
        budget_max: 6000,
        deadline: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000).toISOString(), // 45 days from now
        location: 'London, UK',
        requirements: 'Student visas, documentation assistance, embassy appointments'
      },
      {
        title: 'Temporary Staff for Event Management',
        description: 'Need temporary staff for upcoming corporate event. Various roles available.',
        category: 'manpower',
        priority: 'low',
        budget_min: 5000,
        budget_max: 8000,
        deadline: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString(), // 10 days from now
        location: 'Jeddah, Saudi Arabia',
        requirements: 'Event staff, hospitality experience, flexible timing'
      },
      {
        title: 'Complete HR Department Setup',
        description: 'Setting up complete HR department for new company. Need policies, systems, and staff.',
        category: 'hr_outsourcing',
        priority: 'high',
        budget_min: 30000,
        budget_max: 50000,
        deadline: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString(), // 60 days from now
        location: 'Dubai, UAE',
        requirements: 'HR policies, recruitment systems, training programs, compliance setup'
      },
      {
        title: 'Fleet Transportation Services',
        description: 'Long-term transportation contract for company fleet. Multiple vehicles and routes.',
        category: 'transport',
        priority: 'high',
        budget_min: 20000,
        budget_max: 35000,
        deadline: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(), // 90 days from now
        location: 'Multiple locations',
        requirements: 'Fleet management, GPS tracking, maintenance, 24/7 support'
      },
      {
        title: 'Business Visa for Europe',
        description: 'Multiple business visas for European trade show. Urgent processing required.',
        category: 'visa',
        priority: 'high',
        budget_min: 8000,
        budget_max: 15000,
        deadline: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(), // 5 days from now
        location: 'Germany, France, Netherlands',
        requirements: 'Schengen visas, business invitations, travel insurance'
      },
      {
        title: 'IT Professionals Recruitment',
        description: 'Need to hire 10 IT professionals with various specializations for software development.',
        category: 'manpower',
        priority: 'high',
        budget_min: 40000,
        budget_max: 60000,
        deadline: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000).toISOString(), // 20 days from now
        location: 'Riyadh, Saudi Arabia',
        requirements: 'Software developers, system administrators, network engineers'
      },
      {
        title: 'Payroll Outsourcing Service',
        description: 'Complete payroll processing and management for 200+ employees.',
        category: 'hr_outsourcing',
        priority: 'medium',
        budget_min: 10000,
        budget_max: 18000,
        deadline: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString(), // 15 days from now
        location: 'Remote',
        requirements: 'Monthly payroll, tax calculations, compliance reporting'
      },
      {
        title: 'Cargo Transportation Services',
        description: 'Heavy cargo transportation for industrial equipment. Specialized vehicles required.',
        category: 'transport',
        priority: 'medium',
        budget_min: 15000,
        budget_max: 25000,
        deadline: new Date(Date.now() + 25 * 24 * 60 * 60 * 1000).toISOString(), // 25 days from now
        location: 'Eastern Province, Saudi Arabia',
        requirements: 'Heavy-duty trucks, experienced drivers, cargo insurance'
      }
    ];

    // Create the sample requests
    let createdCount = 0;
    for (let i = 0; i < sampleRequests.length; i++) {
      const request = sampleRequests[i];
      const client = clientUsers.rows[i % clientUsers.rows.length]; // Rotate through available clients
      
      // Create multiple variations of each request
      for (let j = 1; j <= 3; j++) { // Create 3 variations of each
        const variation = {
          ...request,
          title: `${request.title} - Option ${j}`,
          description: `${request.description} This is option ${j} with slightly different requirements and timeline.`,
          budget_min: request.budget_min * (0.9 + (j * 0.1)), // Vary budget slightly
          budget_max: request.budget_max * (0.9 + (j * 0.1)),
        };

        const result = await query(`
          INSERT INTO service_requests (
            client_id, title, description, category, priority, 
            budget_min, budget_max, deadline, location, requirements,
            status, created_at, updated_at
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW(), NOW())
          RETURNING id, title
        `, [
          client.id,
          variation.title,
          variation.description,
          variation.category,
          variation.priority,
          variation.budget_min,
          variation.budget_max,
          variation.deadline,
          variation.location,
          variation.requirements,
          j === 1 ? 'pending_admin' : j === 2 ? 'in_progress' : 'completed' // Vary status
        ]);

        createdCount++;
        console.log(`✅ Created: ${result.rows[0].title}`);
      }
    }

    console.log(`\n🎉 Successfully created ${createdCount} sample service requests!`);
    console.log(`📊 This should be enough to test pagination properly.`);
    console.log(`🔍 You can now test pagination with different page sizes (5, 10, 20 items per page).`);

    // Check the total count
    const totalRequests = await query('SELECT COUNT(*) as count FROM service_requests');
    console.log(`📈 Total service requests in database: ${totalRequests.rows[0].count}`);

  } catch (error) {
    console.error('❌ Error creating sample requests:', error);
  } finally {
    process.exit(0);
  }
}

createSampleRequests();
