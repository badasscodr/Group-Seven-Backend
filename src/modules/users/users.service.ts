import pool from '../../core/config/database';
import { UserRole } from '../../shared/types/user.types';
import { UpdateProfileRequest, UserProfileResponse } from './users.types';

export const getUserById = async (userId: string) => {
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

export const getUserProfile = async (userId: string, role: UserRole): Promise<UserProfileResponse> => {
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

export const updateUserProfile = async (userId: string, role: UserRole, updateData: UpdateProfileRequest) => {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // Update user table
    const userUpdateFields: string[] = [];
    const userUpdateValues: any[] = [];
    let paramIndex = 1;

    if (updateData.firstName !== undefined) {
      userUpdateFields.push(`first_name = $${paramIndex}`);
      userUpdateValues.push(updateData.firstName);
      paramIndex++;
    }

    if (updateData.lastName !== undefined) {
      userUpdateFields.push(`last_name = $${paramIndex}`);
      userUpdateValues.push(updateData.lastName);
      paramIndex++;
    }

    if (updateData.phone !== undefined) {
      userUpdateFields.push(`phone = $${paramIndex}`);
      userUpdateValues.push(updateData.phone);
      paramIndex++;
    }

    if (userUpdateFields.length > 0) {
      userUpdateFields.push(`updated_at = CURRENT_TIMESTAMP`);
      userUpdateValues.push(userId);

      const userUpdateQuery = `
        UPDATE users
        SET ${userUpdateFields.join(', ')}
        WHERE id = $${paramIndex}
        RETURNING *
      `;

      await client.query(userUpdateQuery, userUpdateValues);
    }

    // Update profile data if provided
    if (updateData.profileData) {
      await updateRoleSpecificProfile(client, userId, role, updateData.profileData);
    }

    await client.query('COMMIT');

    // Return updated profile
    return await getUserProfile(userId, role);
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

const updateRoleSpecificProfile = async (client: any, userId: string, role: UserRole, profileData: any) => {
  switch (role) {
    case 'client':
      const clientFields: string[] = [];
      const clientValues: any[] = [];
      let clientParamIndex = 1;

      if (profileData.companyName !== undefined) {
        clientFields.push(`company_name = $${clientParamIndex}`);
        clientValues.push(profileData.companyName);
        clientParamIndex++;
      }

      if (profileData.industry !== undefined) {
        clientFields.push(`industry = $${clientParamIndex}`);
        clientValues.push(profileData.industry);
        clientParamIndex++;
      }

      if (profileData.companySize !== undefined) {
        clientFields.push(`company_size = $${clientParamIndex}`);
        clientValues.push(profileData.companySize);
        clientParamIndex++;
      }

      if (profileData.address !== undefined) {
        clientFields.push(`address = $${clientParamIndex}`);
        clientValues.push(profileData.address);
        clientParamIndex++;
      }

      if (profileData.city !== undefined) {
        clientFields.push(`city = $${clientParamIndex}`);
        clientValues.push(profileData.city);
        clientParamIndex++;
      }

      if (profileData.country !== undefined) {
        clientFields.push(`country = $${clientParamIndex}`);
        clientValues.push(profileData.country);
        clientParamIndex++;
      }

      if (profileData.website !== undefined) {
        clientFields.push(`website = $${clientParamIndex}`);
        clientValues.push(profileData.website);
        clientParamIndex++;
      }

      if (clientFields.length > 0) {
        clientValues.push(userId);
        const clientUpdateQuery = `
          UPDATE client_profiles
          SET ${clientFields.join(', ')}
          WHERE user_id = $${clientParamIndex}
        `;
        await client.query(clientUpdateQuery, clientValues);
      }
      break;

    case 'supplier':
      const supplierFields: string[] = [];
      const supplierValues: any[] = [];
      let supplierParamIndex = 1;

      if (profileData.companyName !== undefined) {
        supplierFields.push(`company_name = $${supplierParamIndex}`);
        supplierValues.push(profileData.companyName);
        supplierParamIndex++;
      }

      if (profileData.businessType !== undefined) {
        supplierFields.push(`business_type = $${supplierParamIndex}`);
        supplierValues.push(profileData.businessType);
        supplierParamIndex++;
      }

      if (profileData.licenseNumber !== undefined) {
        supplierFields.push(`license_number = $${supplierParamIndex}`);
        supplierValues.push(profileData.licenseNumber);
        supplierParamIndex++;
      }

      if (profileData.serviceCategories !== undefined) {
        supplierFields.push(`service_categories = $${supplierParamIndex}`);
        supplierValues.push(profileData.serviceCategories);
        supplierParamIndex++;
      }

      if (supplierFields.length > 0) {
        supplierValues.push(userId);
        const supplierUpdateQuery = `
          UPDATE supplier_profiles
          SET ${supplierFields.join(', ')}
          WHERE user_id = $${supplierParamIndex}
        `;
        await client.query(supplierUpdateQuery, supplierValues);
      }
      break;

    case 'employee':
      const employeeFields: string[] = [];
      const employeeValues: any[] = [];
      let employeeParamIndex = 1;

      if (profileData.employeeId !== undefined) {
        employeeFields.push(`employee_id = $${employeeParamIndex}`);
        employeeValues.push(profileData.employeeId);
        employeeParamIndex++;
      }

      if (profileData.department !== undefined) {
        employeeFields.push(`department = $${employeeParamIndex}`);
        employeeValues.push(profileData.department);
        employeeParamIndex++;
      }

      if (profileData.position !== undefined) {
        employeeFields.push(`position = $${employeeParamIndex}`);
        employeeValues.push(profileData.position);
        employeeParamIndex++;
      }

      if (employeeFields.length > 0) {
        employeeValues.push(userId);
        const employeeUpdateQuery = `
          UPDATE employee_profiles
          SET ${employeeFields.join(', ')}
          WHERE user_id = $${employeeParamIndex}
        `;
        await client.query(employeeUpdateQuery, employeeValues);
      }
      break;

    case 'candidate':
      const candidateFields: string[] = [];
      const candidateValues: any[] = [];
      let candidateParamIndex = 1;

      if (profileData.skills !== undefined) {
        candidateFields.push(`skills = $${candidateParamIndex}`);
        candidateValues.push(profileData.skills);
        candidateParamIndex++;
      }

      if (profileData.languages !== undefined) {
        candidateFields.push(`languages = $${candidateParamIndex}`);
        candidateValues.push(profileData.languages);
        candidateParamIndex++;
      }

      if (candidateFields.length > 0) {
        candidateValues.push(userId);
        const candidateUpdateQuery = `
          UPDATE candidate_profiles
          SET ${candidateFields.join(', ')}
          WHERE user_id = $${candidateParamIndex}
        `;
        await client.query(candidateUpdateQuery, candidateValues);
      }
      break;
  }
};