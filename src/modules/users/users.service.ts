import pool from '../../core/config/database';
import { UserRole } from '../../shared/types/user.types';
import { UpdateProfileRequest, UserProfileResponse } from './users.types';
import { uploadFileToR2, deleteFileFromR2, generateDownloadUrl, FileMetadata } from '../../core/services/cloudflare-r2.service';

export const getUserById = async (userId: string) => {
  const result = await pool.query(
    'SELECT * FROM users WHERE id = $1',
    [userId]
  );

  if (result.rows.length === 0) {
    return null;
  }

  const { passwordHash, ...userWithoutPassword } = result.rows[0];
  return userWithoutPassword;
};

export const getUserProfile = async (userId: string, role: UserRole): Promise<UserProfileResponse> => {
  const user = await getUserById(userId);

  if (!user) {
    throw new Error('User not found');
  }

  // Generate presigned URL for avatar if it exists (like documents do)
  if (user.avatarUrl) {
    try {
      const presignedUrl = await generateDownloadUrl(user.avatarUrl, 604800); // 7 days
      user.avatarUrl = presignedUrl;
    } catch (error) {
      console.error('Failed to generate presigned URL for avatar:', error);
    }
  }

  let profile = null;

  switch (role) {
    case 'client':
      const clientResult = await pool.query(
        'SELECT * FROM "clientProfiles" WHERE "userId" = $1',
        [userId]
      );
      profile = clientResult.rows[0] || null;
      break;

    case 'supplier':
      const supplierResult = await pool.query(
        'SELECT * FROM "supplierProfiles" WHERE "userId" = $1',
        [userId]
      );
      profile = supplierResult.rows[0] || null;
      break;

    case 'employee':
      const employeeResult = await pool.query(
        'SELECT * FROM "employeeProfiles" WHERE "userId" = $1',
        [userId]
      );
      profile = employeeResult.rows[0] || null;
      break;

    case 'candidate':
      const candidateResult = await pool.query(
        'SELECT * FROM "candidateProfiles" WHERE "userId" = $1',
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
      userUpdateFields.push(`"firstName" = $${paramIndex}`);
      userUpdateValues.push(updateData.firstName);
      paramIndex++;
    }

    if (updateData.lastName !== undefined) {
      userUpdateFields.push(`"lastName" = $${paramIndex}`);
      userUpdateValues.push(updateData.lastName);
      paramIndex++;
    }

    if (updateData.phone !== undefined) {
      userUpdateFields.push(`phone = $${paramIndex}`);
      userUpdateValues.push(updateData.phone);
      paramIndex++;
    }

    if (userUpdateFields.length > 0) {
      userUpdateFields.push(`"updatedAt" = CURRENT_TIMESTAMP`);
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
        clientFields.push(`"companyName" = $${clientParamIndex}`);
        clientValues.push(profileData.companyName);
        clientParamIndex++;
      }

      if (profileData.industry !== undefined) {
        clientFields.push(`industry = $${clientParamIndex}`);
        clientValues.push(profileData.industry);
        clientParamIndex++;
      }

      if (profileData.businessType !== undefined) {
        clientFields.push(`"businessType" = $${clientParamIndex}`);
        clientValues.push(profileData.businessType);
        clientParamIndex++;
      }

      if (profileData.companySize !== undefined) {
        clientFields.push(`"companySize" = $${clientParamIndex}`);
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
          UPDATE "clientProfiles"
          SET ${clientFields.join(', ')}
          WHERE "userId" = $${clientParamIndex}
        `;
        await client.query(clientUpdateQuery, clientValues);
      }
      break;

    case 'supplier':
      const supplierFields: string[] = [];
      const supplierValues: any[] = [];
      let supplierParamIndex = 1;

      if (profileData.companyName !== undefined) {
        supplierFields.push(`"companyName" = $${supplierParamIndex}`);
        supplierValues.push(profileData.companyName);
        supplierParamIndex++;
      }

      if (profileData.businessType !== undefined) {
        supplierFields.push(`"businessType" = $${supplierParamIndex}`);
        supplierValues.push(profileData.businessType);
        supplierParamIndex++;
      }

      if (profileData.licenseNumber !== undefined) {
        supplierFields.push(`"licenseNumber" = $${supplierParamIndex}`);
        supplierValues.push(profileData.licenseNumber);
        supplierParamIndex++;
      }

      if (profileData.serviceCategories !== undefined) {
        supplierFields.push(`"serviceCategories" = $${supplierParamIndex}`);
        supplierValues.push(profileData.serviceCategories);
        supplierParamIndex++;
      }

      if (supplierFields.length > 0) {
        supplierValues.push(userId);
        const supplierUpdateQuery = `
          UPDATE "supplierProfiles"
          SET ${supplierFields.join(', ')}
          WHERE "userId" = $${supplierParamIndex}
        `;
        await client.query(supplierUpdateQuery, supplierValues);
      }
      break;

    case 'employee':
      const employeeFields: string[] = [];
      const employeeValues: any[] = [];
      let employeeParamIndex = 1;

      if (profileData.employeeId !== undefined) {
        employeeFields.push(`"employeeId" = $${employeeParamIndex}`);
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
          UPDATE "employeeProfiles"
          SET ${employeeFields.join(', ')}
          WHERE "userId" = $${employeeParamIndex}
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
          UPDATE "candidateProfiles"
          SET ${candidateFields.join(', ')}
          WHERE "userId" = $${candidateParamIndex}
        `;
        await client.query(candidateUpdateQuery, candidateValues);
      }
      break;
  }
};

/**
 * Update user avatar
 */
export const updateUserAvatar = async (
  userId: string,
  file: Express.Multer.File
): Promise<{ avatarUrl: string; uploadResult: any }> => {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // Get current avatar to delete old one
    const currentAvatarResult = await client.query(
      'SELECT "avatarUrl" FROM users WHERE id = $1',
      [userId]
    );

    const currentAvatarUrl = currentAvatarResult.rows[0]?.avatarUrl;

    // Upload new avatar to Cloudflare R2
    const fileMetadata: FileMetadata = {
      originalName: file.originalname,
      mimeType: file.mimetype,
      fileSize: file.size,
      userId,
      category: 'avatars',
    };

    const uploadResult = await uploadFileToR2(file.buffer, fileMetadata);

    // Save filename (not URL) to database - same as documents
    const updateQuery = `
      UPDATE users
      SET "avatarUrl" = $1
      WHERE id = $2
      RETURNING "avatarUrl"
    `;

    // Save filename path only
    const result = await client.query(updateQuery, [uploadResult.filename, userId]);

    await client.query('COMMIT');

    // Delete old avatar if it exists and is different
    if (currentAvatarUrl && currentAvatarUrl !== uploadResult.filename) {
      try {
        await deleteFileFromR2(currentAvatarUrl);
      } catch (error) {
        console.warn('Failed to delete old avatar file:', error);
      }
    }

    // Generate presigned URL for response (7 days - same as documents)
    const presignedUrl = await generateDownloadUrl(uploadResult.filename, 604800);

    return {
      avatarUrl: presignedUrl, // Return presigned URL
      uploadResult,
    };
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error updating avatar:', error);
    throw new Error('Failed to update avatar');
  } finally {
    client.release();
  }
};

/**
 * Delete user avatar
 */
export const deleteUserAvatar = async (userId: string): Promise<boolean> => {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // Get current avatar URL
    const avatarResult = await client.query(
      'SELECT "avatarUrl" FROM users WHERE id = $1',
      [userId]
    );

    const avatarUrl = avatarResult.rows[0]?.avatarUrl;

    if (!avatarUrl) {
      return false; // No avatar to delete
    }

    // Remove avatar URL from database
    const updateQuery = `
      UPDATE users
      SET "avatarUrl" = NULL
      WHERE id = $1
    `;

    await client.query(updateQuery, [userId]);

    await client.query('COMMIT');

    // Delete file from Cloudflare R2
    try {
      // Extract filename from URL for deletion
      const filename = avatarUrl.split('/').pop();
      if (filename) {
        await deleteFileFromR2(`avatars/${userId}/${filename}`);
      }
    } catch (error) {
      console.warn('Failed to delete avatar file from storage:', error);
    }

    return true;
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error deleting avatar:', error);
    throw new Error('Failed to delete avatar');
  } finally {
    client.release();
  }
};
