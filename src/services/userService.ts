import crypto from 'crypto';
import pool from '../config/database';
import { hashPassword, comparePassword } from '../utils/bcrypt';
import { generateTokens } from '../utils/jwt';
import { User, UserRole, ClientProfile, SupplierProfile, EmployeeProfile, CandidateProfile } from '../types';

export interface RegisterUserData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  phone?: string;
  profileData?: any;
}

export interface LoginData {
  email: string;
  password: string;
}

export const registerUser = async (userData: RegisterUserData) => {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // Check if user already exists
    const existingUser = await client.query(
      'SELECT id FROM users WHERE email = $1',
      [userData.email]
    );

    if (existingUser.rows.length > 0) {
      throw new Error('Email already exists');
    }

    // Hash password
    const passwordHash = await hashPassword(userData.password);

    // Create user
    const userId = crypto.randomUUID();
    const userResult = await client.query(
      `INSERT INTO users (id, email, password_hash, role, first_name, last_name, phone)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [
        userId,
        userData.email,
        passwordHash,
        userData.role,
        userData.firstName,
        userData.lastName,
        userData.phone || null,
      ]
    );

    const user = userResult.rows[0];

    // Create role-specific profile
    await createUserProfile(client, userId, userData.role, userData.profileData || {});

    await client.query('COMMIT');

    // Generate tokens
    const { accessToken, refreshToken } = generateTokens(user.id, user.email, user.role);

    // Return user without password hash
    const { password_hash, ...userWithoutPassword } = user;

    return {
      user: userWithoutPassword,
      accessToken,
      refreshToken,
    };
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

export const loginUser = async (loginData: LoginData) => {
  const result = await pool.query(
    'SELECT * FROM users WHERE email = $1 AND is_active = true',
    [loginData.email]
  );

  if (result.rows.length === 0) {
    throw new Error('Invalid credentials');
  }

  const user = result.rows[0];

  // Verify password
  const isPasswordValid = await comparePassword(loginData.password, user.password_hash);

  if (!isPasswordValid) {
    throw new Error('Invalid credentials');
  }

  // Update last login
  await pool.query(
    'UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = $1',
    [user.id]
  );

  // Generate tokens
  const { accessToken, refreshToken } = generateTokens(user.id, user.email, user.role);

  // Return user without password hash
  const { password_hash, ...userWithoutPassword } = user;

  return {
    user: userWithoutPassword,
    accessToken,
    refreshToken,
  };
};

export const getUserById = async (userId: string): Promise<User | null> => {
  const result = await pool.query(
    'SELECT * FROM users WHERE id = $1',
    [userId]
  );

  if (result.rows.length === 0) {
    return null;
  }

  const { password_hash, ...userWithoutPassword } = result.rows[0];
  return userWithoutPassword;
};

export const getUserProfile = async (userId: string, role: UserRole) => {
  const user = await getUserById(userId);

  if (!user) {
    throw new Error('User not found');
  }

  let profile = null;

  switch (role) {
    case 'client':
      const clientResult = await pool.query(
        'SELECT * FROM client_profiles WHERE user_id = $1',
        [userId]
      );
      profile = clientResult.rows[0] || null;
      break;

    case 'supplier':
      const supplierResult = await pool.query(
        'SELECT * FROM supplier_profiles WHERE user_id = $1',
        [userId]
      );
      profile = supplierResult.rows[0] || null;
      break;

    case 'employee':
      const employeeResult = await pool.query(
        'SELECT * FROM employee_profiles WHERE user_id = $1',
        [userId]
      );
      profile = employeeResult.rows[0] || null;
      break;

    case 'candidate':
      const candidateResult = await pool.query(
        'SELECT * FROM candidate_profiles WHERE user_id = $1',
        [userId]
      );
      profile = candidateResult.rows[0] || null;
      break;
  }

  return {
    ...user,
    profile,
  };
};

const createUserProfile = async (client: any, userId: string, role: UserRole, profileData: any) => {
  const profileId = crypto.randomUUID();

  switch (role) {
    case 'client':
      await client.query(
        `INSERT INTO client_profiles (id, user_id, company_name, industry, company_size, address, city, country, website, business_license)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
        [
          profileId,
          userId,
          profileData.companyName || null,
          profileData.industry || null,
          profileData.companySize || null,
          profileData.address || null,
          profileData.city || null,
          profileData.country || null,
          profileData.website || null,
          profileData.businessLicense || null,
        ]
      );
      break;

    case 'supplier':
      await client.query(
        `INSERT INTO supplier_profiles (id, user_id, company_name, business_type, license_number, service_categories)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [
          profileId,
          userId,
          profileData.companyName || '',
          profileData.businessType || null,
          profileData.licenseNumber || null,
          profileData.serviceCategories || [],
        ]
      );
      break;

    case 'employee':
      await client.query(
        `INSERT INTO employee_profiles (id, user_id, employee_id, department, position)
         VALUES ($1, $2, $3, $4, $5)`,
        [
          profileId,
          userId,
          profileData.employeeId || null,
          profileData.department || null,
          profileData.position || null,
        ]
      );
      break;

    case 'candidate':
      await client.query(
        `INSERT INTO candidate_profiles (id, user_id, skills, languages)
         VALUES ($1, $2, $3, $4)`,
        [
          profileId,
          userId,
          profileData.skills || [],
          profileData.languages || [],
        ]
      );
      break;
  }
};