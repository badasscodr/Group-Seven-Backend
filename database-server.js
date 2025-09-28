const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const app =  express();
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

// Create users table if it doesn't exist
const createUsersTable = async () => {
  try {
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
    console.log('📋 Basic users table ready');

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
        // Column might already exist
        console.log(`⚠️  Column ${columnName} might already exist`);
      }
    }

    console.log('📋 Users table structure updated');

    // Insert default users if they don't exist (simple version first)
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
      // Try with all columns, but if it fails, create basic user
      try {
        await pool.query(`
          INSERT INTO users (email, password_hash, first_name, last_name, role, company_name, business_type, address)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        `, ['client@example.com', hashedPassword, 'John', 'Client', 'client', 'Test Company Ltd', 'Technology', '123 Business Street, Dubai, UAE']);
        console.log('👤 Created client user with full profile');
      } catch (error) {
        // Fallback to basic user creation
        await pool.query(`
          INSERT INTO users (email, password_hash, first_name, last_name, role)
          VALUES ($1, $2, $3, $4, $5)
        `, ['client@example.com', hashedPassword, 'John', 'Client', 'client']);
        console.log('👤 Created basic client user');
      }
    }

    console.log('👥 Default users ready');
  } catch (error) {
    console.error('❌ Database setup error:', error);
  }
};

// Initialize database
createUsersTable();

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
    message: 'Database server is healthy',
    timestamp: new Date().toISOString()
  });
});

// Register endpoint
app.post('/api/auth/register', async (req, res) => {
  try {
    console.log('🔐 Registration attempt:', {
      email: req.body.email,
      role: req.body.role,
      hasAdditionalFields: !!(req.body.companyName || req.body.skills)
    });

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

    // Check if user already exists
    const existingUser = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
    if (existingUser.rows.length > 0) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'USER_EXISTS',
          message: 'User with this email already exists'
        },
        timestamp: new Date().toISOString()
      });
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 12);

    // Insert new user with all fields
    const result = await pool.query(`
      INSERT INTO users (
        email, password_hash, first_name, last_name, phone, role,
        company_name, business_type, address, skills, experience
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      RETURNING id, email, first_name, last_name, role, phone, company_name, business_type, address, skills, experience
    `, [
      email,
      passwordHash,
      firstName,
      lastName,
      phone,
      role || 'client',
      companyName || null,
      businessType || null,
      address || null,
      skills || null,
      experience || null
    ]);

    const newUser = result.rows[0];

    // Generate tokens
    const token = generateToken(newUser);
    const refreshToken = generateRefreshToken(newUser);

    console.log('✅ User registered successfully:', newUser.email);

    res.status(201).json({
      success: true,
      data: {
        token,
        refreshToken,
        user: {
          id: newUser.id.toString(),
          email: newUser.email,
          firstName: newUser.first_name,
          lastName: newUser.last_name,
          role: newUser.role,
          phone: newUser.phone,
          companyName: newUser.company_name,
          businessType: newUser.business_type,
          address: newUser.address,
          skills: newUser.skills,
          experience: newUser.experience
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

// Login endpoint
app.post('/api/auth/login', async (req, res) => {
  try {
    console.log('🔐 Login attempt:', req.body.email);

    const { email, password } = req.body;

    // Find user
    const result = await pool.query(`
      SELECT id, email, password_hash, first_name, last_name, role, phone,
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

    // Verify password
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

    // Generate tokens
    const token = generateToken(user);
    const refreshToken = generateRefreshToken(user);

    console.log('✅ Login successful:', user.email);

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
          message: 'Invalid authorization token'
        },
        timestamp: new Date().toISOString()
      });
    }
    req.user = user;
    next();
  });
};

// Get user profile
app.get('/api/users/profile', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.sub;

    const result = await pool.query(`
      SELECT id, email, first_name, last_name, role, phone,
             company_name, business_type, address, skills, experience, avatar
      FROM users WHERE id = $1
    `, [userId]);

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
      message: 'Profile retrieved successfully',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to retrieve profile'
      },
      timestamp: new Date().toISOString()
    });
  }
});

// Update user profile
app.put('/api/users/profile', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.sub;
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
      UPDATE users SET
        first_name = COALESCE($1, first_name),
        last_name = COALESCE($2, last_name),
        phone = COALESCE($3, phone),
        company_name = COALESCE($4, company_name),
        business_type = COALESCE($5, business_type),
        address = COALESCE($6, address),
        skills = COALESCE($7, skills),
        experience = COALESCE($8, experience),
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $9
      RETURNING id, email, first_name, last_name, role, phone,
                company_name, business_type, address, skills, experience, avatar
    `, [
      firstName,
      lastName,
      phone,
      companyName,
      businessType,
      address,
      skills,
      experience,
      userId
    ]);

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

    console.log('📝 Profile updated for user:', user.email);

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
  console.log(`🚀 Database-integrated API server running on port ${PORT}`);
  console.log(`🏥 Health check available at: http://localhost:${PORT}/health`);
  console.log(`💾 Using PostgreSQL database: group_seven_db`);
  console.log('📋 Available endpoints:');
  console.log('  POST /api/auth/register - User registration (saves ALL fields)');
  console.log('  POST /api/auth/login - User login');
  console.log('  GET /api/users/profile - Get user profile');
  console.log('  PUT /api/users/profile - Update user profile');
  console.log('  POST /api/auth/logout - User logout');
  console.log('');
  console.log('🧪 Test users:');
  console.log('  admin@example.com / password123 (admin)');
  console.log('  client@example.com / password123 (client)');
});