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

// Create all necessary tables
const createTables = async () => {
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
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('📋 Users table ready');

    // Add additional columns if they don't exist
    const columnsToAdd = [
      'company_name VARCHAR(255)',
      'business_type VARCHAR(100)',
      'address TEXT',
      'skills TEXT',
      'experience TEXT',
      'avatar VARCHAR(500)'
    ];

    for (const column of columnsToAdd) {
      const [columnName] = column.split(' ');
      try {
        await pool.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS ${column}`);
        console.log(`✅ Added column: ${columnName}`);
      } catch (error) {
        console.log(`⚠️  Column ${columnName} might already exist`);
      }
    }

    // Service Requests table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS service_requests (
        id SERIAL PRIMARY KEY,
        client_id INTEGER REFERENCES users(id) NOT NULL,
        title VARCHAR(255) NOT NULL,
        description TEXT NOT NULL,
        category VARCHAR(100) NOT NULL,
        priority VARCHAR(20) DEFAULT 'medium',
        status VARCHAR(20) DEFAULT 'draft',
        budget_min DECIMAL(10,2),
        budget_max DECIMAL(10,2),
        deadline DATE,
        location VARCHAR(255),
        requirements TEXT,
        assigned_supplier_id INTEGER REFERENCES users(id),
        assigned_employee_id INTEGER REFERENCES users(id),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('📋 Service requests table ready');

    // Quotations table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS quotations (
        id SERIAL PRIMARY KEY,
        service_request_id INTEGER REFERENCES service_requests(id) NOT NULL,
        supplier_id INTEGER REFERENCES users(id) NOT NULL,
        amount DECIMAL(10,2) NOT NULL,
        description TEXT,
        estimated_duration VARCHAR(100),
        terms_conditions TEXT,
        status VARCHAR(20) DEFAULT 'pending',
        valid_until DATE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('📋 Quotations table ready');

    // Service categories table for reference
    await pool.query(`
      CREATE TABLE IF NOT EXISTS service_categories (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        description TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('📋 Service categories table ready');

    console.log('📋 All database tables structure updated');

    // Insert default users if they don't exist
    const adminExists = await pool.query('SELECT id FROM users WHERE email = $1', ['admin@example.com']);
    if (adminExists.rows.length === 0) {
      const hashedPassword = await bcrypt.hash('password123', 12);
      await pool.query(`
        INSERT INTO users (email, password_hash, first_name, last_name, role)
        VALUES ($1, $2, $3, $4, $5)
      `, ['admin@example.com', hashedPassword, 'Admin', 'User', 'admin']);
      console.log('👤 Created admin user');
    }

    const clientExists = await pool.query('SELECT id FROM users WHERE email = $1', ['client@example.com']);
    if (clientExists.rows.length === 0) {
      const hashedPassword = await bcrypt.hash('password123', 12);
      await pool.query(`
        INSERT INTO users (email, password_hash, first_name, last_name, role, company_name, business_type, address)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      `, ['client@example.com', hashedPassword, 'John', 'Client', 'client', 'Test Company Ltd', 'Technology', '123 Business Street, Dubai, UAE']);
      console.log('👤 Created client user with full profile');
    }

    const supplierExists = await pool.query('SELECT id FROM users WHERE email = $1', ['supplier@example.com']);
    if (supplierExists.rows.length === 0) {
      const hashedPassword = await bcrypt.hash('password123', 12);
      await pool.query(`
        INSERT INTO users (email, password_hash, first_name, last_name, role, company_name, business_type, address, skills, experience)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      `, ['supplier@example.com', hashedPassword, 'Sarah', 'Supplier', 'supplier', 'Professional Services LLC', 'Construction', '456 Service Avenue, Abu Dhabi, UAE', 'Project Management, Quality Control', '10+ years in construction industry']);
      console.log('👤 Created supplier user with full profile');
    }

    // Insert sample service categories
    const categoriesExist = await pool.query('SELECT COUNT(*) FROM service_categories');
    if (categoriesExist.rows[0].count === '0') {
      const categories = [
        ['Construction & Renovation', 'Building, renovation, and construction services'],
        ['IT & Technology', 'Software development, IT support, and technology consulting'],
        ['Legal Services', 'Legal consultation, documentation, and representation'],
        ['Marketing & Advertising', 'Digital marketing, branding, and advertising services'],
        ['Consulting', 'Business consulting, strategy, and advisory services'],
        ['Maintenance & Repair', 'Equipment maintenance, repairs, and facility management'],
        ['Training & Education', 'Corporate training, education, and skill development'],
        ['Financial Services', 'Accounting, auditing, and financial consulting'],
        ['Healthcare Services', 'Medical services, health consulting, and wellness programs'],
        ['Other', 'Other professional services not listed above']
      ];

      for (const [name, description] of categories) {
        await pool.query('INSERT INTO service_categories (name, description) VALUES ($1, $2)', [name, description]);
      }
      console.log('📂 Created service categories');
    }

    console.log('👥 Default users ready');

  } catch (error) {
    console.error('❌ Database setup error:', error);
  }
};

// Initialize tables
createTables();

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Service Request API server is healthy',
    timestamp: new Date().toISOString()
  });
});

// Authentication endpoints (existing)
app.post('/api/auth/register', async (req, res) => {
  try {
    const {
      email,
      password,
      firstName,
      lastName,
      phone,
      role,
      companyName,
      businessType,
      address,
      skills,
      experience
    } = req.body;

    if (!email || !password || !firstName || !lastName || !role) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Missing required fields: email, password, firstName, lastName, role'
        },
        timestamp: new Date().toISOString()
      });
    }

    const existingUser = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
    if (existingUser.rows.length > 0) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'EMAIL_EXISTS',
          message: 'Email already registered'
        },
        timestamp: new Date().toISOString()
      });
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const result = await pool.query(`
      INSERT INTO users (
        email, password_hash, first_name, last_name, phone, role,
        company_name, business_type, address, skills, experience
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      RETURNING id, email, first_name, last_name, phone, role,
                company_name, business_type, address, skills, experience, avatar
    `, [email, hashedPassword, firstName, lastName, phone, role, companyName, businessType, address, skills, experience]);

    const user = result.rows[0];
    const token = jwt.sign(
      {
        sub: user.id.toString(),
        email: user.email,
        role: user.role
      },
      process.env.JWT_SECRET || 'fallback-secret-key',
      { expiresIn: '24h' }
    );

    const refreshToken = jwt.sign(
      { sub: user.id.toString() },
      process.env.JWT_SECRET || 'fallback-secret-key',
      { expiresIn: '7d' }
    );

    res.status(201).json({
      success: true,
      data: {
        token,
        refreshToken,
        user: {
          id: user.id.toString(),
          email: user.email,
          firstName: user.first_name,
          lastName: user.last_name,
          role: user.role,
          phone: user.phone,
          companyName: user.company_name,
          businessType: user.business_type,
          address: user.address,
          skills: user.skills,
          experience: user.experience,
          avatar: user.avatar
        }
      },
      message: 'User registered successfully',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Registration failed'
      },
      timestamp: new Date().toISOString()
    });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Email and password are required'
        },
        timestamp: new Date().toISOString()
      });
    }

    const result = await pool.query(`
      SELECT id, email, password_hash, first_name, last_name, phone, role,
             company_name, business_type, address, skills, experience, avatar
      FROM users WHERE email = $1
    `, [email]);

    if (result.rows.length === 0) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'INVALID_CREDENTIALS',
          message: 'Invalid email or password'
        },
        timestamp: new Date().toISOString()
      });
    }

    const user = result.rows[0];
    const isValidPassword = await bcrypt.compare(password, user.password_hash);

    if (!isValidPassword) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'INVALID_CREDENTIALS',
          message: 'Invalid email or password'
        },
        timestamp: new Date().toISOString()
      });
    }

    const token = jwt.sign(
      {
        sub: user.id.toString(),
        email: user.email,
        role: user.role
      },
      process.env.JWT_SECRET || 'fallback-secret-key',
      { expiresIn: '24h' }
    );

    const refreshToken = jwt.sign(
      { sub: user.id.toString() },
      process.env.JWT_SECRET || 'fallback-secret-key',
      { expiresIn: '7d' }
    );

    res.json({
      success: true,
      data: {
        token,
        refreshToken,
        user: {
          id: user.id.toString(),
          email: user.email,
          firstName: user.first_name,
          lastName: user.last_name,
          role: user.role,
          phone: user.phone,
          companyName: user.company_name,
          businessType: user.business_type,
          address: user.address,
          skills: user.skills,
          experience: user.experience,
          avatar: user.avatar
        }
      },
      message: 'Login successful',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Login failed'
      },
      timestamp: new Date().toISOString()
    });
  }
});

// Middleware to verify JWT token
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({
      success: false,
      error: {
        code: 'NO_TOKEN',
        message: 'Authorization token required'
      },
      timestamp: new Date().toISOString()
    });
  }

  jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret-key', (err, user) => {
    if (err) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'INVALID_TOKEN',
          message: 'Invalid or expired token'
        },
        timestamp: new Date().toISOString()
      });
    }
    req.user = user;
    next();
  });
};

// User profile endpoints (existing)
app.get('/api/users/profile', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT id, email, first_name, last_name, phone, role,
             company_name, business_type, address, skills, experience, avatar
      FROM users WHERE id = $1
    `, [req.user.sub]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'USER_NOT_FOUND',
          message: 'User not found'
        },
        timestamp: new Date().toISOString()
      });
    }

    const user = result.rows[0];
    res.json({
      success: true,
      data: {
        id: user.id.toString(),
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        role: user.role,
        phone: user.phone,
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
    console.error('Get profile error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to get profile'
      },
      timestamp: new Date().toISOString()
    });
  }
});

app.put('/api/users/profile', authenticateToken, async (req, res) => {
  try {
    const {
      firstName,
      lastName,
      phone,
      companyName,
      businessType,
      address,
      skills,
      experience
    } = req.body;

    const result = await pool.query(`
      UPDATE users
      SET first_name = $1, last_name = $2, phone = $3,
          company_name = $4, business_type = $5, address = $6,
          skills = $7, experience = $8, updated_at = CURRENT_TIMESTAMP
      WHERE id = $9
      RETURNING id, email, first_name, last_name, phone, role,
                company_name, business_type, address, skills, experience, avatar
    `, [firstName, lastName, phone, companyName, businessType, address, skills, experience, req.user.sub]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'USER_NOT_FOUND',
          message: 'User not found'
        },
        timestamp: new Date().toISOString()
      });
    }

    const user = result.rows[0];
    res.json({
      success: true,
      data: {
        id: user.id.toString(),
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        role: user.role,
        phone: user.phone,
        companyName: user.company_name,
        businessType: user.business_type,
        address: user.address,
        skills: user.skills,
        experience: user.experience,
        avatar: user.avatar
      },
      message: 'Profile updated successfully',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to update profile'
      },
      timestamp: new Date().toISOString()
    });
  }
});

// ============ NEW: SERVICE REQUEST ENDPOINTS ============

// Get service categories (public)
app.get('/api/service-categories', async (req, res) => {
  try {
    const result = await pool.query('SELECT id, name, description FROM service_categories ORDER BY name');

    res.json({
      success: true,
      data: result.rows,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Get categories error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to get service categories'
      },
      timestamp: new Date().toISOString()
    });
  }
});

// CLIENT ENDPOINTS: Service Request Management

// Get client's service requests
app.get('/api/client/requests', authenticateToken, async (req, res) => {
  try {
    // Only clients can access this endpoint
    if (req.user.role !== 'client') {
      return res.status(403).json({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: 'Access denied. Client role required.'
        },
        timestamp: new Date().toISOString()
      });
    }

    const { status, category, priority, page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;

    let query = `
      SELECT sr.*, COUNT(q.id) as quotation_count
      FROM service_requests sr
      LEFT JOIN quotations q ON sr.id = q.service_request_id
      WHERE sr.client_id = $1
    `;
    const params = [req.user.sub];
    let paramIndex = 2;

    if (status) {
      query += ` AND sr.status = $${paramIndex}`;
      params.push(status);
      paramIndex++;
    }

    if (category) {
      query += ` AND sr.category = $${paramIndex}`;
      params.push(category);
      paramIndex++;
    }

    if (priority) {
      query += ` AND sr.priority = $${paramIndex}`;
      params.push(priority);
      paramIndex++;
    }

    query += ` GROUP BY sr.id ORDER BY sr.created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    params.push(limit, offset);

    const result = await pool.query(query, params);

    res.json({
      success: true,
      data: result.rows.map(row => ({
        id: row.id,
        title: row.title,
        description: row.description,
        category: row.category,
        priority: row.priority,
        status: row.status,
        budgetMin: row.budget_min,
        budgetMax: row.budget_max,
        deadline: row.deadline,
        location: row.location,
        requirements: row.requirements,
        quotationCount: parseInt(row.quotation_count),
        createdAt: row.created_at,
        updatedAt: row.updated_at
      })),
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: result.rows.length
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Get client requests error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to get service requests'
      },
      timestamp: new Date().toISOString()
    });
  }
});

// Create new service request
app.post('/api/client/requests', authenticateToken, async (req, res) => {
  try {
    // Only clients can access this endpoint
    if (req.user.role !== 'client') {
      return res.status(403).json({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: 'Access denied. Client role required.'
        },
        timestamp: new Date().toISOString()
      });
    }

    const {
      title,
      description,
      category,
      priority = 'medium',
      budgetMin,
      budgetMax,
      deadline,
      location,
      requirements
    } = req.body;

    // Validation
    if (!title || !description || !category) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Title, description, and category are required'
        },
        timestamp: new Date().toISOString()
      });
    }

    const result = await pool.query(`
      INSERT INTO service_requests (
        client_id, title, description, category, priority,
        budget_min, budget_max, deadline, location, requirements, status
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 'published')
      RETURNING *
    `, [req.user.sub, title, description, category, priority, budgetMin, budgetMax, deadline, location, requirements]);

    const request = result.rows[0];

    res.status(201).json({
      success: true,
      data: {
        id: request.id,
        title: request.title,
        description: request.description,
        category: request.category,
        priority: request.priority,
        status: request.status,
        budgetMin: request.budget_min,
        budgetMax: request.budget_max,
        deadline: request.deadline,
        location: request.location,
        requirements: request.requirements,
        createdAt: request.created_at,
        updatedAt: request.updated_at
      },
      message: 'Service request created successfully',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Create service request error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to create service request'
      },
      timestamp: new Date().toISOString()
    });
  }
});

// Get specific service request
app.get('/api/client/requests/:id', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'client') {
      return res.status(403).json({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: 'Access denied. Client role required.'
        },
        timestamp: new Date().toISOString()
      });
    }

    const result = await pool.query(`
      SELECT sr.*,
             (SELECT COUNT(*) FROM quotations WHERE service_request_id = sr.id) as quotation_count
      FROM service_requests sr
      WHERE sr.id = $1 AND sr.client_id = $2
    `, [req.params.id, req.user.sub]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Service request not found'
        },
        timestamp: new Date().toISOString()
      });
    }

    const request = result.rows[0];

    res.json({
      success: true,
      data: {
        id: request.id,
        title: request.title,
        description: request.description,
        category: request.category,
        priority: request.priority,
        status: request.status,
        budgetMin: request.budget_min,
        budgetMax: request.budget_max,
        deadline: request.deadline,
        location: request.location,
        requirements: request.requirements,
        quotationCount: parseInt(request.quotation_count),
        createdAt: request.created_at,
        updatedAt: request.updated_at
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Get service request error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to get service request'
      },
      timestamp: new Date().toISOString()
    });
  }
});

// SUPPLIER ENDPOINTS: Browse requests and submit quotations

// Get available service requests for suppliers
app.get('/api/supplier/requests', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'supplier') {
      return res.status(403).json({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: 'Access denied. Supplier role required.'
        },
        timestamp: new Date().toISOString()
      });
    }

    const { category, priority, budget_min, budget_max, page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;

    let query = `
      SELECT sr.*,
             u.first_name, u.last_name, u.company_name,
             (SELECT COUNT(*) FROM quotations WHERE service_request_id = sr.id) as quotation_count,
             (SELECT COUNT(*) FROM quotations WHERE service_request_id = sr.id AND supplier_id = $1) as my_quotation_count
      FROM service_requests sr
      JOIN users u ON sr.client_id = u.id
      WHERE sr.status = 'published'
    `;
    const params = [req.user.sub];
    let paramIndex = 2;

    if (category) {
      query += ` AND sr.category = $${paramIndex}`;
      params.push(category);
      paramIndex++;
    }

    if (priority) {
      query += ` AND sr.priority = $${paramIndex}`;
      params.push(priority);
      paramIndex++;
    }

    if (budget_min) {
      query += ` AND (sr.budget_max IS NULL OR sr.budget_max >= $${paramIndex})`;
      params.push(budget_min);
      paramIndex++;
    }

    if (budget_max) {
      query += ` AND (sr.budget_min IS NULL OR sr.budget_min <= $${paramIndex})`;
      params.push(budget_max);
      paramIndex++;
    }

    query += ` ORDER BY sr.created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    params.push(limit, offset);

    const result = await pool.query(query, params);

    res.json({
      success: true,
      data: result.rows.map(row => ({
        id: row.id,
        title: row.title,
        description: row.description,
        category: row.category,
        priority: row.priority,
        status: row.status,
        budgetMin: row.budget_min,
        budgetMax: row.budget_max,
        deadline: row.deadline,
        location: row.location,
        requirements: row.requirements,
        client: {
          name: `${row.first_name} ${row.last_name}`,
          companyName: row.company_name
        },
        quotationCount: parseInt(row.quotation_count),
        myQuotationCount: parseInt(row.my_quotation_count),
        createdAt: row.created_at,
        updatedAt: row.updated_at
      })),
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: result.rows.length
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Get supplier requests error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to get available requests'
      },
      timestamp: new Date().toISOString()
    });
  }
});

// Submit quotation for a service request
app.post('/api/supplier/requests/:id/quote', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'supplier') {
      return res.status(403).json({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: 'Access denied. Supplier role required.'
        },
        timestamp: new Date().toISOString()
      });
    }

    const serviceRequestId = req.params.id;
    const {
      amount,
      description,
      estimatedDuration,
      termsConditions,
      validUntil
    } = req.body;

    // Validation
    if (!amount || amount <= 0) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Amount is required and must be greater than 0'
        },
        timestamp: new Date().toISOString()
      });
    }

    // Check if service request exists and is published
    const requestCheck = await pool.query(
      'SELECT id, status FROM service_requests WHERE id = $1',
      [serviceRequestId]
    );

    if (requestCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Service request not found'
        },
        timestamp: new Date().toISOString()
      });
    }

    if (requestCheck.rows[0].status !== 'published') {
      return res.status(400).json({
        success: false,
        error: {
          code: 'REQUEST_NOT_AVAILABLE',
          message: 'Service request is not available for quotations'
        },
        timestamp: new Date().toISOString()
      });
    }

    // Check if supplier already submitted a quotation
    const existingQuote = await pool.query(
      'SELECT id FROM quotations WHERE service_request_id = $1 AND supplier_id = $2',
      [serviceRequestId, req.user.sub]
    );

    if (existingQuote.rows.length > 0) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'QUOTATION_EXISTS',
          message: 'You have already submitted a quotation for this request'
        },
        timestamp: new Date().toISOString()
      });
    }

    // Create quotation
    const result = await pool.query(`
      INSERT INTO quotations (
        service_request_id, supplier_id, amount, description,
        estimated_duration, terms_conditions, valid_until, status
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, 'pending')
      RETURNING *
    `, [serviceRequestId, req.user.sub, amount, description, estimatedDuration, termsConditions, validUntil]);

    const quotation = result.rows[0];

    res.status(201).json({
      success: true,
      data: {
        id: quotation.id,
        serviceRequestId: quotation.service_request_id,
        amount: quotation.amount,
        description: quotation.description,
        estimatedDuration: quotation.estimated_duration,
        termsConditions: quotation.terms_conditions,
        validUntil: quotation.valid_until,
        status: quotation.status,
        createdAt: quotation.created_at
      },
      message: 'Quotation submitted successfully',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Submit quotation error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to submit quotation'
      },
      timestamp: new Date().toISOString()
    });
  }
});

// Get supplier's quotations
app.get('/api/supplier/quotations', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'supplier') {
      return res.status(403).json({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: 'Access denied. Supplier role required.'
        },
        timestamp: new Date().toISOString()
      });
    }

    const { status, page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;

    let query = `
      SELECT q.*, sr.title, sr.category, sr.priority, sr.deadline,
             u.first_name, u.last_name, u.company_name
      FROM quotations q
      JOIN service_requests sr ON q.service_request_id = sr.id
      JOIN users u ON sr.client_id = u.id
      WHERE q.supplier_id = $1
    `;
    const params = [req.user.sub];
    let paramIndex = 2;

    if (status) {
      query += ` AND q.status = $${paramIndex}`;
      params.push(status);
      paramIndex++;
    }

    query += ` ORDER BY q.created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    params.push(limit, offset);

    const result = await pool.query(query, params);

    res.json({
      success: true,
      data: result.rows.map(row => ({
        id: row.id,
        serviceRequestId: row.service_request_id,
        serviceRequest: {
          title: row.title,
          category: row.category,
          priority: row.priority,
          deadline: row.deadline
        },
        client: {
          name: `${row.first_name} ${row.last_name}`,
          companyName: row.company_name
        },
        amount: row.amount,
        description: row.description,
        estimatedDuration: row.estimated_duration,
        termsConditions: row.terms_conditions,
        validUntil: row.valid_until,
        status: row.status,
        createdAt: row.created_at
      })),
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: result.rows.length
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Get supplier quotations error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to get quotations'
      },
      timestamp: new Date().toISOString()
    });
  }
});

// Logout endpoint
app.post('/api/auth/logout', (req, res) => {
  res.json({
    success: true,
    message: 'Logged out successfully',
    timestamp: new Date().toISOString()
  });
});

// 404 handler for unmatched routes
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: {
      code: 'NOT_FOUND',
      message: `API endpoint not found: ${req.method} ${req.path}`
    },
    timestamp: new Date().toISOString()
  });
});

app.listen(PORT, () => {
  console.log(`🚀 Service Request API server running on port ${PORT}`);
  console.log(`🏥 Health check available at: http://localhost:${PORT}/health`);
  console.log(`💾 Using PostgreSQL database: group_seven_db`);
  console.log('');
  console.log('📋 Available endpoints:');
  console.log('🔐 Authentication:');
  console.log('  POST /api/auth/register - User registration');
  console.log('  POST /api/auth/login - User login');
  console.log('  POST /api/auth/logout - User logout');
  console.log('');
  console.log('👤 User Management:');
  console.log('  GET /api/users/profile - Get user profile');
  console.log('  PUT /api/users/profile - Update user profile');
  console.log('');
  console.log('🎯 Service Requests:');
  console.log('  GET /api/service-categories - Get service categories');
  console.log('  GET /api/client/requests - Get client requests');
  console.log('  POST /api/client/requests - Create service request');
  console.log('  GET /api/client/requests/:id - Get specific request');
  console.log('  GET /api/supplier/requests - Browse available requests');
  console.log('  POST /api/supplier/requests/:id/quote - Submit quotation');
  console.log('  GET /api/supplier/quotations - Get supplier quotations');
  console.log('');
  console.log('🧪 Test users:');
  console.log('  admin@example.com / password123 (admin)');
  console.log('  client@example.com / password123 (client)');
  console.log('  supplier@example.com / password123 (supplier)');
});