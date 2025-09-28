const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 8000;

// Database connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:Abc123%21%40%23@localhost:5432/group_seven_db',
  ssl: false
});

// Test database connection
pool.on('connect', () => {
  console.log('✅ Connected to PostgreSQL database');
});

pool.on('error', (err) => {
  console.error('❌ PostgreSQL connection error:', err);
});

// Middleware
app.use(cors({
  origin: 'http://localhost:3000',
  credentials: true
}));
app.use(express.json());

// Create tables
const initializeTables = async () => {
  try {
    // Users table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        first_name VARCHAR(100),
        last_name VARCHAR(100),
        phone VARCHAR(20),
        role VARCHAR(50) DEFAULT 'client',
        company_name VARCHAR(255),
        business_type VARCHAR(100),
        address TEXT,
        skills TEXT,
        experience TEXT,
        avatar VARCHAR(500),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('📋 Users table ready');

    // Service requests table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS service_requests (
        id SERIAL PRIMARY KEY,
        client_id INTEGER REFERENCES users(id),
        title VARCHAR(255) NOT NULL,
        description TEXT NOT NULL,
        category VARCHAR(100) NOT NULL,
        priority VARCHAR(20) DEFAULT 'medium',
        status VARCHAR(50) DEFAULT 'pending',
        budget_min DECIMAL(10,2),
        budget_max DECIMAL(10,2),
        deadline DATE,
        location VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('📋 Service requests table ready');

    // Job postings table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS job_postings (
        id SERIAL PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        description TEXT NOT NULL,
        company VARCHAR(255),
        location VARCHAR(255),
        job_type VARCHAR(50) DEFAULT 'full_time',
        salary_min DECIMAL(10,2),
        salary_max DECIMAL(10,2),
        status VARCHAR(50) DEFAULT 'active',
        posted_by INTEGER REFERENCES users(id),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('📋 Job postings table ready');

    // Insert default users if they don't exist
    await createDefaultUsers();
    await createSampleData();

    console.log('🎉 Database initialization complete');
  } catch (error) {
    console.error('❌ Database setup error:', error);
  }
};

const createDefaultUsers = async () => {
  try {
    // Admin user
    const adminExists = await pool.query('SELECT id FROM users WHERE email = $1', ['admin@example.com']);
    if (adminExists.rows.length === 0) {
      const hashedPassword = await bcrypt.hash('password123', 12);
      await pool.query(`
        INSERT INTO users (email, password_hash, first_name, last_name, role)
        VALUES ($1, $2, $3, $4, $5)
      `, ['admin@example.com', hashedPassword, 'Admin', 'User', 'admin']);
      console.log('👤 Created admin user');
    }

    // Client user
    const clientExists = await pool.query('SELECT id FROM users WHERE email = $1', ['client@example.com']);
    if (clientExists.rows.length === 0) {
      const hashedPassword = await bcrypt.hash('password123', 12);
      await pool.query(`
        INSERT INTO users (email, password_hash, first_name, last_name, role, company_name, business_type, address)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      `, ['client@example.com', hashedPassword, 'John', 'Client', 'client', 'ABC Corporation', 'Technology', '123 Business Street, Dubai, UAE']);
      console.log('👤 Created client user');
    }

    // Supplier user
    const supplierExists = await pool.query('SELECT id FROM users WHERE email = $1', ['supplier@example.com']);
    if (supplierExists.rows.length === 0) {
      const hashedPassword = await bcrypt.hash('password123', 12);
      await pool.query(`
        INSERT INTO users (email, password_hash, first_name, last_name, role, company_name, business_type)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
      `, ['supplier@example.com', hashedPassword, 'Sarah', 'Supplier', 'supplier', 'XYZ Services Ltd', 'Professional Services']);
      console.log('👤 Created supplier user');
    }

    console.log('👥 Default users ready');
  } catch (error) {
    console.error('❌ Error creating default users:', error);
  }
};

const createSampleData = async () => {
  try {
    // Check if sample data already exists
    const existingRequests = await pool.query('SELECT COUNT(*) FROM service_requests');
    if (parseInt(existingRequests.rows[0].count) > 0) {
      console.log('📋 Sample data already exists');
      return;
    }

    // Get client user ID
    const clientResult = await pool.query('SELECT id FROM users WHERE email = $1', ['client@example.com']);
    if (clientResult.rows.length === 0) return;

    const clientId = clientResult.rows[0].id;

    // Sample service requests
    const sampleRequests = [
      {
        title: 'Visa Processing for 5 Employees',
        description: 'Need help processing work visas for 5 new employees joining our Dubai office.',
        category: 'visa_services',
        priority: 'high',
        status: 'pending',
        location: 'Dubai, UAE'
      },
      {
        title: 'Manpower Recruitment - Software Engineers',
        description: 'Looking for 3 experienced software engineers for our tech team.',
        category: 'manpower',
        priority: 'medium',
        status: 'processing',
        location: 'Abu Dhabi, UAE'
      },
      {
        title: 'HR Outsourcing Services',
        description: 'Complete HR management solution for 50+ employee company.',
        category: 'hr_outsourcing',
        priority: 'medium',
        status: 'completed',
        location: 'Sharjah, UAE'
      },
      {
        title: 'Secure Transportation Service',
        description: 'Transport valuable equipment from Dubai to Abu Dhabi.',
        category: 'transportation',
        priority: 'high',
        status: 'pending',
        location: 'Dubai to Abu Dhabi'
      }
    ];

    for (const request of sampleRequests) {
      await pool.query(`
        INSERT INTO service_requests (client_id, title, description, category, priority, status, location)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
      `, [clientId, request.title, request.description, request.category, request.priority, request.status, request.location]);
    }

    // Sample job postings
    const adminResult = await pool.query('SELECT id FROM users WHERE email = $1', ['admin@example.com']);
    if (adminResult.rows.length > 0) {
      const adminId = adminResult.rows[0].id;

      const sampleJobs = [
        {
          title: 'Senior Software Engineer',
          description: 'We are looking for an experienced software engineer to join our growing team.',
          company: 'Group Seven Initiatives',
          location: 'Dubai, UAE',
          job_type: 'full_time',
          salary_min: 15000,
          salary_max: 25000
        },
        {
          title: 'HR Manager',
          description: 'Manage HR operations and employee relations for our expanding organization.',
          company: 'Group Seven Initiatives',
          location: 'Abu Dhabi, UAE',
          job_type: 'full_time',
          salary_min: 12000,
          salary_max: 18000
        },
        {
          title: 'Business Development Executive',
          description: 'Drive business growth and client acquisition initiatives.',
          company: 'Group Seven Initiatives',
          location: 'Dubai, UAE',
          job_type: 'full_time',
          salary_min: 8000,
          salary_max: 15000
        }
      ];

      for (const job of sampleJobs) {
        await pool.query(`
          INSERT INTO job_postings (title, description, company, location, job_type, salary_min, salary_max, posted_by)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        `, [job.title, job.description, job.company, job.location, job.job_type, job.salary_min, job.salary_max, adminId]);
      }
    }

    console.log('📋 Sample data created');
  } catch (error) {
    console.error('❌ Error creating sample data:', error);
  }
};

// Initialize database
initializeTables();

// Auth middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({
      success: false,
      error: { code: 'NO_TOKEN', message: 'Access token required' },
      timestamp: new Date().toISOString()
    });
  }

  jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret-key', (err, user) => {
    if (err) {
      return res.status(403).json({
        success: false,
        error: { code: 'INVALID_TOKEN', message: 'Invalid or expired token' },
        timestamp: new Date().toISOString()
      });
    }
    req.user = user;
    next();
  });
};

// Utility functions
const generateToken = (user) => {
  return jwt.sign(
    {
      sub: user.id.toString(),
      email: user.email,
      role: user.role
    },
    process.env.JWT_SECRET || 'fallback-secret-key',
    { expiresIn: '24h' }
  );
};

const generateRefreshToken = (user) => {
  return jwt.sign(
    { sub: user.id.toString() },
    process.env.JWT_REFRESH_SECRET || 'fallback-refresh-secret',
    { expiresIn: '7d' }
  );
};

// Health check
app.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Enhanced server is healthy',
    timestamp: new Date().toISOString()
  });
});

// Authentication endpoints
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: { code: 'MISSING_FIELDS', message: 'Email and password are required' },
        timestamp: new Date().toISOString()
      });
    }

    const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);

    if (result.rows.length === 0) {
      return res.status(401).json({
        success: false,
        error: { code: 'INVALID_CREDENTIALS', message: 'Invalid email or password' },
        timestamp: new Date().toISOString()
      });
    }

    const user = result.rows[0];
    const validPassword = await bcrypt.compare(password, user.password_hash);

    if (!validPassword) {
      return res.status(401).json({
        success: false,
        error: { code: 'INVALID_CREDENTIALS', message: 'Invalid email or password' },
        timestamp: new Date().toISOString()
      });
    }

    const token = generateToken(user);
    const refreshToken = generateRefreshToken(user);

    res.json({
      success: true,
      data: {
        accessToken: token,
        token: token, // For backward compatibility
        refreshToken: refreshToken,
        user: {
          id: user.id,
          email: user.email,
          first_name: user.first_name,
          last_name: user.last_name,
          role: user.role,
          is_active: true
        }
      },
      message: 'Login successful',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Login error:', error);
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Internal server error' },
      timestamp: new Date().toISOString()
    });
  }
});

// Admin Dashboard Endpoints
app.get('/api/admin/stats', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: { code: 'INSUFFICIENT_PERMISSIONS', message: 'Admin access required' },
        timestamp: new Date().toISOString()
      });
    }

    // Get dashboard statistics
    const [usersCount, requestsCount, jobsCount] = await Promise.all([
      pool.query('SELECT COUNT(*) FROM users'),
      pool.query('SELECT COUNT(*) FROM service_requests'),
      pool.query('SELECT COUNT(*) FROM job_postings')
    ]);

    // Get recent requests with pending status
    const pendingRequests = await pool.query('SELECT COUNT(*) FROM service_requests WHERE status = $1', ['pending']);

    const stats = {
      totalUsers: parseInt(usersCount.rows[0].count),
      serviceRequests: parseInt(requestsCount.rows[0].count),
      jobPostings: parseInt(jobsCount.rows[0].count),
      pendingRequests: parseInt(pendingRequests.rows[0].count),
      revenue: 125430 // Mock data for now
    };

    res.json({
      success: true,
      data: stats,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Admin stats error:', error);
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Internal server error' },
      timestamp: new Date().toISOString()
    });
  }
});

app.get('/api/admin/recent-requests', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: { code: 'INSUFFICIENT_PERMISSIONS', message: 'Admin access required' },
        timestamp: new Date().toISOString()
      });
    }

    const result = await pool.query(`
      SELECT
        sr.id,
        sr.title,
        sr.category,
        sr.priority,
        sr.status,
        sr.created_at,
        sr.location,
        u.first_name || ' ' || u.last_name as client_name,
        u.company_name
      FROM service_requests sr
      JOIN users u ON sr.client_id = u.id
      ORDER BY sr.created_at DESC
      LIMIT 10
    `);

    const requests = result.rows.map(row => ({
      id: `REQ-${row.id.toString().padStart(3, '0')}`,
      title: row.title,
      client: row.company_name || row.client_name,
      type: row.category.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()),
      status: row.status,
      priority: row.priority,
      date: row.created_at.toISOString().split('T')[0],
      location: row.location
    }));

    res.json({
      success: true,
      data: requests,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Recent requests error:', error);
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Internal server error' },
      timestamp: new Date().toISOString()
    });
  }
});

app.get('/api/admin/users', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: { code: 'INSUFFICIENT_PERMISSIONS', message: 'Admin access required' },
        timestamp: new Date().toISOString()
      });
    }

    const result = await pool.query(`
      SELECT id, email, first_name, last_name, role, company_name, created_at
      FROM users
      ORDER BY created_at DESC
    `);

    res.json({
      success: true,
      data: result.rows,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Users list error:', error);
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Internal server error' },
      timestamp: new Date().toISOString()
    });
  }
});

// User profile endpoints
app.get('/api/users/profile', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM users WHERE id = $1', [req.user.sub]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: { code: 'USER_NOT_FOUND', message: 'User not found' },
        timestamp: new Date().toISOString()
      });
    }

    const user = result.rows[0];

    res.json({
      success: true,
      data: {
        id: user.id,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        phone: user.phone,
        role: user.role,
        companyName: user.company_name,
        businessType: user.business_type,
        address: user.address,
        skills: user.skills,
        experience: user.experience,
        avatar: user.avatar
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Profile fetch error:', error);
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Internal server error' },
      timestamp: new Date().toISOString()
    });
  }
});

// Service request endpoints
app.get('/api/client/requests', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT * FROM service_requests
      WHERE client_id = $1
      ORDER BY created_at DESC
    `, [req.user.sub]);

    res.json({
      success: true,
      data: result.rows,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Client requests error:', error);
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Internal server error' },
      timestamp: new Date().toISOString()
    });
  }
});

app.post('/api/client/requests', authenticateToken, async (req, res) => {
  try {
    const { title, description, category, priority, budget_min, budget_max, deadline, location } = req.body;

    if (!title || !description || !category) {
      return res.status(400).json({
        success: false,
        error: { code: 'MISSING_FIELDS', message: 'Title, description, and category are required' },
        timestamp: new Date().toISOString()
      });
    }

    const result = await pool.query(`
      INSERT INTO service_requests (client_id, title, description, category, priority, budget_min, budget_max, deadline, location)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *
    `, [req.user.sub, title, description, category, priority || 'medium', budget_min, budget_max, deadline, location]);

    res.status(201).json({
      success: true,
      data: result.rows[0],
      message: 'Service request created successfully',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Create request error:', error);
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Internal server error' },
      timestamp: new Date().toISOString()
    });
  }
});

// Logout endpoint
app.post('/api/auth/logout', (req, res) => {
  res.json({
    success: true,
    message: 'Logout successful',
    timestamp: new Date().toISOString()
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Enhanced API server running on port ${PORT}`);
  console.log(`🏥 Health check available at: http://localhost:${PORT}/health`);
  console.log(`💾 Using PostgreSQL database`);
  console.log(`📋 Available endpoints:`);
  console.log(`  POST /api/auth/login - User login`);
  console.log(`  GET /api/admin/stats - Admin dashboard statistics`);
  console.log(`  GET /api/admin/recent-requests - Recent service requests`);
  console.log(`  GET /api/admin/users - All users list`);
  console.log(`  GET /api/users/profile - User profile`);
  console.log(`  GET /api/client/requests - Client's service requests`);
  console.log(`  POST /api/client/requests - Create service request`);
  console.log(`🧪 Test users:`);
  console.log(`  admin@example.com / password123 (admin)`);
  console.log(`  client@example.com / password123 (client)`);
  console.log(`  supplier@example.com / password123 (supplier)`);
});