import crypto from 'crypto';
import pool from '../../core/config/database';
import { hashPassword, comparePassword } from '../../core/utils/bcrypt';
import { generateTokens } from '../../core/utils/jwt';
import { RegisterRequest, LoginRequest, AuthResponse } from './auth.types';
import { UserRole } from '../../shared/types/user.types';

export const registerUser = async (userData: RegisterRequest): Promise<AuthResponse> => {
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
    const hashedPassword = await hashPassword(userData.password);

    // Create user
    const userId = crypto.randomUUID();
    const userResult = await client.query(
      `INSERT INTO users (id, email, "passwordHash", role, "firstName", "lastName", phone)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [
        userId,
        userData.email,
        hashedPassword,
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

    // Return user without password hash (column is now camelCase)
    const { passwordHash, ...userWithoutPassword } = user;

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

export const loginUser = async (loginData: LoginRequest): Promise<AuthResponse> => {
  const result = await pool.query(
    'SELECT * FROM users WHERE email = $1 AND "isActive" = true',
    [loginData.email]
  );

  if (result.rows.length === 0) {
    throw new Error('Invalid credentials');
  }

  const user = result.rows[0];

  // Verify password
  const isPasswordValid = await comparePassword(loginData.password, user.passwordHash);

  if (!isPasswordValid) {
    throw new Error('Invalid credentials');
  }

  // Update last login
  await pool.query(
    'UPDATE users SET "lastLogin" = CURRENT_TIMESTAMP WHERE id = $1',
    [user.id]
  );

  // Generate tokens
  const { accessToken, refreshToken } = generateTokens(user.id, user.email, user.role);

  // Return user without password hash
  const { passwordHash, ...userWithoutPassword } = user;

  return {
    user: userWithoutPassword,
    accessToken,
    refreshToken,
  };
};

const createUserProfile = async (client: any, userId: string, role: UserRole, profileData: any) => {
  const profileId = crypto.randomUUID();

  switch (role) {
    case 'client':
      await client.query(
        `INSERT INTO "clientProfiles" (id, "userId", "companyName", industry, "companySize", address, city, country, website, "businessLicense")
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
        `INSERT INTO "supplierProfiles" (id, "userId", "companyName", "businessType", "licenseNumber", "serviceCategories")
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
        `INSERT INTO "employeeProfiles" (id, "userId", "employeeId", department, position)
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
        `INSERT INTO "candidateProfiles" (id, "userId", skills, languages)
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
