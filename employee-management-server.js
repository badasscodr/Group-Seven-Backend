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

// Initialize Employee Management Database Schema
const initializeEmployeeTables = async () => {
  try {
    // Users table (already exists, but let's ensure it has employee fields)
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
        employee_id VARCHAR(50),
        department VARCHAR(100),
        position VARCHAR(100),
        hire_date DATE,
        salary DECIMAL(12,2),
        manager_id INTEGER REFERENCES users(id),
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('📋 Users table ready');

    // Attendance table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS attendance (
        id SERIAL PRIMARY KEY,
        employee_id INTEGER NOT NULL REFERENCES users(id),
        date DATE NOT NULL,
        clock_in TIME,
        clock_out TIME,
        break_start TIME,
        break_end TIME,
        total_hours DECIMAL(4,2),
        status VARCHAR(20) DEFAULT 'present',
        notes TEXT,
        location VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(employee_id, date)
      )
    `);
    console.log('📋 Attendance table ready');

    // Leave requests table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS leave_requests (
        id SERIAL PRIMARY KEY,
        employee_id INTEGER NOT NULL REFERENCES users(id),
        leave_type VARCHAR(50) NOT NULL,
        start_date DATE NOT NULL,
        end_date DATE NOT NULL,
        days_requested INTEGER NOT NULL,
        reason TEXT,
        status VARCHAR(20) DEFAULT 'pending',
        approved_by INTEGER REFERENCES users(id),
        approved_at TIMESTAMP,
        rejection_reason TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('📋 Leave requests table ready');

    // Employee performance/notes table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS employee_notes (
        id SERIAL PRIMARY KEY,
        employee_id INTEGER NOT NULL REFERENCES users(id),
        created_by INTEGER NOT NULL REFERENCES users(id),
        note_type VARCHAR(50) NOT NULL,
        title VARCHAR(255),
        content TEXT NOT NULL,
        is_private BOOLEAN DEFAULT false,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('📋 Employee notes table ready');

    // Service requests table (from previous implementation)
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

    // Job postings table (from previous implementation)
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

    // Create sample employee data
    await createSampleEmployeeData();

    console.log('🎉 Employee Management database initialization complete');
  } catch (error) {
    console.error('❌ Database setup error:', error);
  }
};

const createSampleEmployeeData = async () => {
  try {
    // Check if sample employees already exist
    const existingEmployees = await pool.query('SELECT COUNT(*) FROM users WHERE role = $1', ['employee']);
    if (parseInt(existingEmployees.rows[0].count) > 0) {
      console.log('📋 Sample employee data already exists');
      return;
    }

    // Create sample employees
    const employees = [
      {
        email: 'john.doe@groupseven.com',
        firstName: 'John',
        lastName: 'Doe',
        department: 'IT',
        position: 'Software Developer',
        employeeId: 'EMP001',
        hireDate: '2024-01-15',
        salary: 75000
      },
      {
        email: 'sarah.smith@groupseven.com',
        firstName: 'Sarah',
        lastName: 'Smith',
        department: 'HR',
        position: 'HR Manager',
        employeeId: 'EMP002',
        hireDate: '2023-06-01',
        salary: 85000
      },
      {
        email: 'mike.wilson@groupseven.com',
        firstName: 'Mike',
        lastName: 'Wilson',
        department: 'Operations',
        position: 'Operations Coordinator',
        employeeId: 'EMP003',
        hireDate: '2024-03-10',
        salary: 65000
      }
    ];

    const hashedPassword = await bcrypt.hash('password123', 12);

    for (const emp of employees) {
      await pool.query(`
        INSERT INTO users (
          email, password_hash, first_name, last_name, role,
          employee_id, department, position, hire_date, salary, is_active
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      `, [
        emp.email, hashedPassword, emp.firstName, emp.lastName, 'employee',
        emp.employeeId, emp.department, emp.position, emp.hireDate, emp.salary, true
      ]);
    }

    // Create sample attendance records for the last week
    const employees_result = await pool.query('SELECT id FROM users WHERE role = $1', ['employee']);
    const today = new Date();

    for (const employee of employees_result.rows) {
      for (let i = 7; i >= 1; i--) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);

        // Skip weekends
        if (date.getDay() === 0 || date.getDay() === 6) continue;

        const clockIn = '09:00:00';
        const clockOut = '17:30:00';
        const totalHours = 8.5;

        await pool.query(`
          INSERT INTO attendance (employee_id, date, clock_in, clock_out, total_hours, status)
          VALUES ($1, $2, $3, $4, $5, $6)
          ON CONFLICT (employee_id, date) DO NOTHING
        `, [employee.id, date.toISOString().split('T')[0], clockIn, clockOut, totalHours, 'present']);
      }
    }

    // Create sample leave requests
    const employee1 = employees_result.rows[0];
    if (employee1) {
      await pool.query(`
        INSERT INTO leave_requests (employee_id, leave_type, start_date, end_date, days_requested, reason, status)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
      `, [
        employee1.id, 'vacation', '2024-12-20', '2024-12-24', 3, 'Christmas vacation', 'pending'
      ]);
    }

    console.log('📋 Sample employee data created');
  } catch (error) {
    console.error('❌ Error creating sample employee data:', error);
  }
};

// Initialize database
initializeEmployeeTables();

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
    message: 'Employee Management server is healthy',
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
        token: token,
        refreshToken: refreshToken,
        user: {
          id: user.id,
          email: user.email,
          first_name: user.first_name,
          last_name: user.last_name,
          role: user.role,
          is_active: true,
          employee_id: user.employee_id,
          department: user.department,
          position: user.position
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

// Employee Attendance Endpoints
app.post('/api/employee/clock-in', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'employee') {
      return res.status(403).json({
        success: false,
        error: { code: 'INSUFFICIENT_PERMISSIONS', message: 'Employee access required' },
        timestamp: new Date().toISOString()
      });
    }

    const today = new Date().toISOString().split('T')[0];
    const currentTime = new Date().toTimeString().split(' ')[0];

    // Check if already clocked in today
    const existingRecord = await pool.query(
      'SELECT * FROM attendance WHERE employee_id = $1 AND date = $2',
      [req.user.sub, today]
    );

    if (existingRecord.rows.length > 0 && existingRecord.rows[0].clock_in) {
      return res.status(400).json({
        success: false,
        error: { code: 'ALREADY_CLOCKED_IN', message: 'Already clocked in today' },
        timestamp: new Date().toISOString()
      });
    }

    // Insert or update attendance record
    const result = await pool.query(`
      INSERT INTO attendance (employee_id, date, clock_in, status)
      VALUES ($1, $2, $3, $4)
      ON CONFLICT (employee_id, date)
      DO UPDATE SET clock_in = $3, status = $4, updated_at = CURRENT_TIMESTAMP
      RETURNING *
    `, [req.user.sub, today, currentTime, 'present']);

    res.json({
      success: true,
      data: result.rows[0],
      message: 'Clocked in successfully',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Clock in error:', error);
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Internal server error' },
      timestamp: new Date().toISOString()
    });
  }
});

app.post('/api/employee/clock-out', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'employee') {
      return res.status(403).json({
        success: false,
        error: { code: 'INSUFFICIENT_PERMISSIONS', message: 'Employee access required' },
        timestamp: new Date().toISOString()
      });
    }

    const today = new Date().toISOString().split('T')[0];
    const currentTime = new Date().toTimeString().split(' ')[0];

    // Check if clocked in today
    const existingRecord = await pool.query(
      'SELECT * FROM attendance WHERE employee_id = $1 AND date = $2',
      [req.user.sub, today]
    );

    if (existingRecord.rows.length === 0 || !existingRecord.rows[0].clock_in) {
      return res.status(400).json({
        success: false,
        error: { code: 'NOT_CLOCKED_IN', message: 'Must clock in first' },
        timestamp: new Date().toISOString()
      });
    }

    if (existingRecord.rows[0].clock_out) {
      return res.status(400).json({
        success: false,
        error: { code: 'ALREADY_CLOCKED_OUT', message: 'Already clocked out today' },
        timestamp: new Date().toISOString()
      });
    }

    // Calculate total hours
    const clockIn = existingRecord.rows[0].clock_in;
    const clockInDate = new Date(`1970-01-01T${clockIn}Z`);
    const clockOutDate = new Date(`1970-01-01T${currentTime}Z`);
    const totalHours = ((clockOutDate - clockInDate) / (1000 * 60 * 60)).toFixed(2);

    // Update attendance record
    const result = await pool.query(`
      UPDATE attendance
      SET clock_out = $1, total_hours = $2, updated_at = CURRENT_TIMESTAMP
      WHERE employee_id = $3 AND date = $4
      RETURNING *
    `, [currentTime, totalHours, req.user.sub, today]);

    res.json({
      success: true,
      data: result.rows[0],
      message: 'Clocked out successfully',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Clock out error:', error);
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Internal server error' },
      timestamp: new Date().toISOString()
    });
  }
});

app.get('/api/employee/attendance', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'employee') {
      return res.status(403).json({
        success: false,
        error: { code: 'INSUFFICIENT_PERMISSIONS', message: 'Employee access required' },
        timestamp: new Date().toISOString()
      });
    }

    const { startDate, endDate } = req.query;
    const limit = parseInt(req.query.limit) || 30;

    let query = `
      SELECT * FROM attendance
      WHERE employee_id = $1
    `;
    let params = [req.user.sub];

    if (startDate && endDate) {
      query += ` AND date BETWEEN $2 AND $3`;
      params.push(startDate, endDate);
    }

    query += ` ORDER BY date DESC LIMIT $${params.length + 1}`;
    params.push(limit);

    const result = await pool.query(query, params);

    res.json({
      success: true,
      data: result.rows,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Get attendance error:', error);
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Internal server error' },
      timestamp: new Date().toISOString()
    });
  }
});

// Leave Management Endpoints
app.post('/api/employee/leave-request', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'employee') {
      return res.status(403).json({
        success: false,
        error: { code: 'INSUFFICIENT_PERMISSIONS', message: 'Employee access required' },
        timestamp: new Date().toISOString()
      });
    }

    const { leaveType, startDate, endDate, reason } = req.body;

    if (!leaveType || !startDate || !endDate) {
      return res.status(400).json({
        success: false,
        error: { code: 'MISSING_FIELDS', message: 'Leave type, start date, and end date are required' },
        timestamp: new Date().toISOString()
      });
    }

    // Calculate days requested
    const start = new Date(startDate);
    const end = new Date(endDate);
    const daysRequested = Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1;

    const result = await pool.query(`
      INSERT INTO leave_requests (employee_id, leave_type, start_date, end_date, days_requested, reason)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `, [req.user.sub, leaveType, startDate, endDate, daysRequested, reason]);

    res.json({
      success: true,
      data: result.rows[0],
      message: 'Leave request submitted successfully',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Leave request error:', error);
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Internal server error' },
      timestamp: new Date().toISOString()
    });
  }
});

app.get('/api/employee/leave-requests', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'employee') {
      return res.status(403).json({
        success: false,
        error: { code: 'INSUFFICIENT_PERMISSIONS', message: 'Employee access required' },
        timestamp: new Date().toISOString()
      });
    }

    const result = await pool.query(`
      SELECT
        lr.*,
        u.first_name || ' ' || u.last_name as approved_by_name
      FROM leave_requests lr
      LEFT JOIN users u ON lr.approved_by = u.id
      WHERE lr.employee_id = $1
      ORDER BY lr.created_at DESC
    `, [req.user.sub]);

    res.json({
      success: true,
      data: result.rows,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Get leave requests error:', error);
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Internal server error' },
      timestamp: new Date().toISOString()
    });
  }
});

// Admin/HR Endpoints
app.get('/api/admin/employees', authenticateToken, async (req, res) => {
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
        id, email, first_name, last_name, employee_id, department,
        position, hire_date, is_active, created_at
      FROM users
      WHERE role = 'employee'
      ORDER BY first_name, last_name
    `);

    res.json({
      success: true,
      data: result.rows,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Get employees error:', error);
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Internal server error' },
      timestamp: new Date().toISOString()
    });
  }
});

app.get('/api/admin/attendance-summary', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: { code: 'INSUFFICIENT_PERMISSIONS', message: 'Admin access required' },
        timestamp: new Date().toISOString()
      });
    }

    const { date } = req.query;
    const targetDate = date || new Date().toISOString().split('T')[0];

    const result = await pool.query(`
      SELECT
        u.id,
        u.first_name || ' ' || u.last_name as employee_name,
        u.employee_id,
        u.department,
        a.clock_in,
        a.clock_out,
        a.total_hours,
        a.status
      FROM users u
      LEFT JOIN attendance a ON u.id = a.employee_id AND a.date = $1
      WHERE u.role = 'employee' AND u.is_active = true
      ORDER BY u.first_name, u.last_name
    `, [targetDate]);

    res.json({
      success: true,
      data: result.rows,
      date: targetDate,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Get attendance summary error:', error);
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Internal server error' },
      timestamp: new Date().toISOString()
    });
  }
});

app.get('/api/admin/leave-requests', authenticateToken, async (req, res) => {
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
        lr.*,
        u.first_name || ' ' || u.last_name as employee_name,
        u.employee_id,
        u.department,
        approver.first_name || ' ' || approver.last_name as approved_by_name
      FROM leave_requests lr
      JOIN users u ON lr.employee_id = u.id
      LEFT JOIN users approver ON lr.approved_by = approver.id
      ORDER BY lr.created_at DESC
    `);

    res.json({
      success: true,
      data: result.rows,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Get leave requests error:', error);
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Internal server error' },
      timestamp: new Date().toISOString()
    });
  }
});

app.put('/api/admin/leave-request/:id', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: { code: 'INSUFFICIENT_PERMISSIONS', message: 'Admin access required' },
        timestamp: new Date().toISOString()
      });
    }

    const { id } = req.params;
    const { status, rejectionReason } = req.body;

    if (!status || !['approved', 'rejected'].includes(status)) {
      return res.status(400).json({
        success: false,
        error: { code: 'INVALID_STATUS', message: 'Status must be approved or rejected' },
        timestamp: new Date().toISOString()
      });
    }

    const updateFields = {
      status,
      approved_by: req.user.sub,
      approved_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    if (status === 'rejected' && rejectionReason) {
      updateFields.rejection_reason = rejectionReason;
    }

    const result = await pool.query(`
      UPDATE leave_requests
      SET status = $1, approved_by = $2, approved_at = $3, rejection_reason = $4, updated_at = $5
      WHERE id = $6
      RETURNING *
    `, [status, req.user.sub, updateFields.approved_at, rejectionReason || null, updateFields.updated_at, id]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Leave request not found' },
        timestamp: new Date().toISOString()
      });
    }

    res.json({
      success: true,
      data: result.rows[0],
      message: `Leave request ${status} successfully`,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Update leave request error:', error);
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Internal server error' },
      timestamp: new Date().toISOString()
    });
  }
});

// Previous endpoints (admin stats, recent requests, users)
app.get('/api/admin/stats', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: { code: 'INSUFFICIENT_PERMISSIONS', message: 'Admin access required' },
        timestamp: new Date().toISOString()
      });
    }

    const [usersCount, requestsCount, jobsCount, employeesCount] = await Promise.all([
      pool.query('SELECT COUNT(*) FROM users'),
      pool.query('SELECT COUNT(*) FROM service_requests'),
      pool.query('SELECT COUNT(*) FROM job_postings'),
      pool.query('SELECT COUNT(*) FROM users WHERE role = $1', ['employee'])
    ]);

    const today = new Date().toISOString().split('T')[0];
    const presentToday = await pool.query('SELECT COUNT(*) FROM attendance WHERE date = $1 AND status = $2', [today, 'present']);

    const stats = {
      totalUsers: parseInt(usersCount.rows[0].count),
      serviceRequests: parseInt(requestsCount.rows[0].count),
      jobPostings: parseInt(jobsCount.rows[0].count),
      employees: parseInt(employeesCount.rows[0].count),
      presentToday: parseInt(presentToday.rows[0].count),
      revenue: 125430
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

// Logout endpoint
app.post('/api/auth/logout', (req, res) => {
  res.json({
    success: true,
    message: 'Logout successful',
    timestamp: new Date().toISOString()
  });
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
        avatar: user.avatar,
        employeeId: user.employee_id,
        department: user.department,
        position: user.position,
        hireDate: user.hire_date,
        salary: user.salary
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

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Employee Management API server running on port ${PORT}`);
  console.log(`🏥 Health check available at: http://localhost:${PORT}/health`);
  console.log(`💾 Using PostgreSQL database with Employee Management schema`);
  console.log(`📋 Available endpoints:`);
  console.log(`  POST /api/auth/login - User login`);
  console.log(`  POST /api/employee/clock-in - Employee clock in`);
  console.log(`  POST /api/employee/clock-out - Employee clock out`);
  console.log(`  GET /api/employee/attendance - Employee attendance history`);
  console.log(`  POST /api/employee/leave-request - Submit leave request`);
  console.log(`  GET /api/employee/leave-requests - Employee leave requests`);
  console.log(`  GET /api/admin/employees - All employees list`);
  console.log(`  GET /api/admin/attendance-summary - Daily attendance summary`);
  console.log(`  GET /api/admin/leave-requests - All leave requests`);
  console.log(`  PUT /api/admin/leave-request/:id - Approve/reject leave request`);
  console.log(`🧪 Test users:`);
  console.log(`  admin@example.com / password123 (admin)`);
  console.log(`  john.doe@groupseven.com / password123 (employee)`);
  console.log(`  sarah.smith@groupseven.com / password123 (employee)`);
  console.log(`  mike.wilson@groupseven.com / password123 (employee)`);
});