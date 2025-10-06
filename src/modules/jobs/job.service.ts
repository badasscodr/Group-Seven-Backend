import pool from '../../core/config/database';
import {
  CreateJobData,
  UpdateJobData,
  JobFilters,
  CreateApplicationData,
  UpdateApplicationData,
  CreateInterviewData,
  ApplicationFilters
} from './job.types';

/**
 * Create a new job posting
 */
export const createJob = async (postedBy: string, data: any) => {
  const query = `
    INSERT INTO "jobPostings" (
      "title", "description", "company", "location", "jobType",
      "experienceRequired", "salaryMin", "salaryMax",
      "skillsRequired", "benefits", "status", "postedBy",
      "applicationDeadline", "createdAt"
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, CURRENT_TIMESTAMP)
    RETURNING *
  `;

  const values = [
    data.title,
    data.description,
    data.company || null,
    data.location || null,
    data.jobType,
    data.experienceRequired || null,
    data.salaryMin || null,
    data.salaryMax || null,
    data.skillsRequired || null,
    data.benefits || null,
    data.status || 'draft',
    postedBy,
    data.applicationDeadline || null
  ];

  const result = await pool.query(query, values);
  return result.rows[0];
};

/**
 * Get all job postings with filters
 */
export const getJobs = async (filters: JobFilters = {}) => {
  const {
    status,
    jobType,
    location,
    experience_min,
    experience_max,
    page = 1,
    limit = 10
  } = filters;

  let query = `
    SELECT jp.*, u."firstName", u."lastName", u."email" as "postedByEmail",
           (SELECT COUNT(*) FROM "jobApplications" WHERE "jobId" = jp."id") as "applicationCount"
    FROM "jobPostings" jp
    LEFT JOIN users u ON jp."postedBy" = u."id"
    WHERE 1=1
  `;

  const values: any[] = [];
  let paramCount = 1;

  if (status) {
    query += ` AND jp."status" = $${paramCount}`;
    values.push(status);
    paramCount++;
  }

  if (jobType) {
    query += ` AND jp."jobType" = $${paramCount}`;
    values.push(jobType);
    paramCount++;
  }

  if (location) {
    query += ` AND jp."location" ILIKE $${paramCount}`;
    values.push(`%${location}%`);
    paramCount++;
  }

  if (experience_min !== undefined) {
    query += ` AND jp."experienceRequired" >= $${paramCount}`;
    values.push(experience_min);
    paramCount++;
  }

  if (experience_max !== undefined) {
    query += ` AND jp."experienceRequired" <= $${paramCount}`;
    values.push(experience_max);
    paramCount++;
  }

  query += ` ORDER BY jp."createdAt" DESC`;

  // Add pagination
  const offset = (page - 1) * limit;
  query += ` LIMIT $${paramCount} OFFSET $${paramCount + 1}`;
  values.push(limit, offset);

  const result = await pool.query(query, values);

  // Get total count
  let countQuery = `SELECT COUNT(*) FROM "jobPostings" WHERE 1=1`;
  const countValues: any[] = [];
  let countParamNum = 1;

  if (status) {
    countQuery += ` AND "status" = $${countParamNum}`;
    countValues.push(status);
    countParamNum++;
  }

  if (jobType) {
    countQuery += ` AND "jobType" = $${countParamNum}`;
    countValues.push(jobType);
    countParamNum++;
  }

  const countResult = await pool.query(countQuery, countValues);
  const totalCount = parseInt(countResult.rows[0].count);

  return {
    jobs: result.rows,
    pagination: {
      total: totalCount,
      page,
      limit,
      totalPages: Math.ceil(totalCount / limit)
    }
  };
};

/**
 * Get job by ID
 */
export const getJobById = async (jobId: string) => {
  const query = `
    SELECT jp.*, u."firstName", u."lastName", u."email" as "postedByEmail",
           (SELECT COUNT(*) FROM "jobApplications" WHERE "jobId" = jp."id") as "applicationCount"
    FROM "jobPostings" jp
    LEFT JOIN users u ON jp."postedBy" = u."id"
    WHERE jp."id" = $1
  `;

  const result = await pool.query(query, [jobId]);

  if (result.rows.length === 0) {
    throw new Error('Job posting not found');
  }

  return result.rows[0];
};

/**
 * Update job posting
 */
export const updateJob = async (jobId: string, data: UpdateJobData) => {
  const fields: string[] = [];
  const values: any[] = [];
  let paramCount = 1;

  Object.entries(data).forEach(([key, value]) => {
    if (value !== undefined) {
      fields.push(`"${key}" = $${paramCount}`);
      values.push(value);
      paramCount++;
    }
  });

  if (fields.length === 0) {
    throw new Error('No fields to update');
  }

  fields.push(`"updatedAt" = CURRENT_TIMESTAMP`);

  const query = `
    UPDATE "jobPostings"
    SET ${fields.join(', ')}
    WHERE "id" = $${paramCount}
    RETURNING *
  `;

  values.push(jobId);

  const result = await pool.query(query, values);

  if (result.rows.length === 0) {
    throw new Error('Job posting not found');
  }

  return result.rows[0];
};

/**
 * Delete job posting
 */
export const deleteJob = async (jobId: string) => {
  const query = `DELETE FROM "jobPostings" WHERE "id" = $1 RETURNING *`;
  const result = await pool.query(query, [jobId]);

  if (result.rows.length === 0) {
    throw new Error('Job posting not found');
  }

  return result.rows[0];
};

/**
 * Apply for a job
 */
export const applyForJob = async (
  jobId: string,
  candidateId: string,
  data: CreateApplicationData
) => {
  // Check if already applied
  const checkQuery = `
    SELECT * FROM "jobApplications"
    WHERE "jobId" = $1 AND "candidateId" = $2
  `;
  const checkResult = await pool.query(checkQuery, [jobId, candidateId]);

  if (checkResult.rows.length > 0) {
    throw new Error('You have already applied for this job');
  }

  // Check if job exists and is published
  const jobQuery = `SELECT * FROM "jobPostings" WHERE "id" = $1 AND "status" = 'published'`;
  const jobResult = await pool.query(jobQuery, [jobId]);

  if (jobResult.rows.length === 0) {
    throw new Error('Job posting not found or not accepting applications');
  }

  const query = `
    INSERT INTO "jobApplications" (
      "jobId", "candidateId", "coverLetter", "resumeUrl", "status", "appliedAt"
    )
    VALUES ($1, $2, $3, $4, 'applied', CURRENT_TIMESTAMP)
    RETURNING *
  `;

  const values = [jobId, candidateId, data.coverLetter, data.resumeUrl];
  const result = await pool.query(query, values);

  return result.rows[0];
};

/**
 * Get applications with filters
 */
export const getApplications = async (filters: ApplicationFilters = {}) => {
  const { status, jobId, candidateId, page = 1, limit = 10 } = filters;

  let query = `
    SELECT ja.*,
           u."firstName", u."lastName", u."email" as "candidateEmail",
           jp."title" as "jobTitle", jp."company", jp."location"
    FROM "jobApplications" ja
    LEFT JOIN users u ON ja."candidateId" = u."id"
    LEFT JOIN "jobPostings" jp ON ja."jobId" = jp."id"
    WHERE 1=1
  `;

  const values: any[] = [];
  let paramCount = 1;

  if (status) {
    query += ` AND ja."status" = $${paramCount}`;
    values.push(status);
    paramCount++;
  }

  if (jobId) {
    query += ` AND ja."jobId" = $${paramCount}`;
    values.push(jobId);
    paramCount++;
  }

  if (candidateId) {
    query += ` AND ja."candidateId" = $${paramCount}`;
    values.push(candidateId);
    paramCount++;
  }

  query += ` ORDER BY ja."appliedAt" DESC`;

  const offset = (page - 1) * limit;
  query += ` LIMIT $${paramCount} OFFSET $${paramCount + 1}`;
  values.push(limit, offset);

  const result = await pool.query(query, values);

  // Get total count
  let countQuery = `SELECT COUNT(*) FROM "jobApplications" WHERE 1=1`;
  const countValues: any[] = [];
  let countParamNum = 1;

  if (status) {
    countQuery += ` AND "status" = $${countParamNum}`;
    countValues.push(status);
    countParamNum++;
  }

  if (jobId) {
    countQuery += ` AND "jobId" = $${countParamNum}`;
    countValues.push(jobId);
    countParamNum++;
  }

  if (candidateId) {
    countQuery += ` AND "candidateId" = $${countParamNum}`;
    countValues.push(candidateId);
    countParamNum++;
  }

  const countResult = await pool.query(countQuery, countValues);
  const totalCount = parseInt(countResult.rows[0].count);

  return {
    applications: result.rows,
    pagination: {
      total: totalCount,
      page,
      limit,
      totalPages: Math.ceil(totalCount / limit)
    }
  };
};

/**
 * Get application by ID
 */
export const getApplicationById = async (applicationId: string) => {
  const query = `
    SELECT ja.*,
           u."firstName", u."lastName", u."email" as "candidateEmail", u."phone" as "candidatePhone",
           jp."title" as "jobTitle", jp."company", jp."location", jp."description"
    FROM "jobApplications" ja
    LEFT JOIN users u ON ja."candidateId" = u."id"
    LEFT JOIN "jobPostings" jp ON ja."jobId" = jp."id"
    WHERE ja."id" = $1
  `;

  const result = await pool.query(query, [applicationId]);

  if (result.rows.length === 0) {
    throw new Error('Application not found');
  }

  return result.rows[0];
};

/**
 * Update application status
 */
export const updateApplicationStatus = async (
  applicationId: string,
  data: UpdateApplicationData
) => {
  const query = `
    UPDATE "jobApplications"
    SET "status" = $1, "updatedAt" = CURRENT_TIMESTAMP
    WHERE "id" = $2
    RETURNING *
  `;

  const result = await pool.query(query, [data.status, applicationId]);

  if (result.rows.length === 0) {
    throw new Error('Application not found');
  }

  return result.rows[0];
};

/**
 * Schedule an interview
 */
export const scheduleInterview = async (
  applicationId: string,
  data: CreateInterviewData
) => {
  const query = `
    INSERT INTO interviews (
      "applicationId", "scheduledDate", "duration", "interviewType",
      "location", "interviewerId", "status", "notes", "createdAt"
    )
    VALUES ($1, $2, $3, $4, $5, $6, 'scheduled', $7, CURRENT_TIMESTAMP)
    RETURNING *
  `;

  const values = [
    applicationId,
    data.scheduledDate,
    data.duration || 60,
    data.interviewType || 'technical',
    data.location,
    data.interviewerId,
    data.notes
  ];

  const result = await pool.query(query, values);

  // Update application status to 'interview'
  await pool.query(
    `UPDATE "jobApplications" SET "status" = 'interview' WHERE "id" = $1`,
    [applicationId]
  );

  return result.rows[0];
};

/**
 * Get interviews
 */
export const getInterviews = async (filters: any = {}) => {
  const { applicationId, candidateId, status, page = 1, limit = 10 } = filters;

  let query = `
    SELECT i.*,
           ja."candidateId", ja."jobId",
           u."firstName", u."lastName", u."email" as "candidateEmail",
           jp."title" as "jobTitle"
    FROM interviews i
    LEFT JOIN "jobApplications" ja ON i."applicationId" = ja."id"
    LEFT JOIN users u ON ja."candidateId" = u."id"
    LEFT JOIN "jobPostings" jp ON ja."jobId" = jp."id"
    WHERE 1=1
  `;

  const values: any[] = [];
  let paramCount = 1;

  if (applicationId) {
    query += ` AND i."applicationId" = $${paramCount}`;
    values.push(applicationId);
    paramCount++;
  }

  if (candidateId) {
    query += ` AND ja."candidateId" = $${paramCount}`;
    values.push(candidateId);
    paramCount++;
  }

  if (status) {
    query += ` AND i."status" = $${paramCount}`;
    values.push(status);
    paramCount++;
  }

  query += ` ORDER BY i."scheduledDate" ASC`;

  const offset = (page - 1) * limit;
  query += ` LIMIT $${paramCount} OFFSET $${paramCount + 1}`;
  values.push(limit, offset);

  const result = await pool.query(query, values);

  return {
    interviews: result.rows,
    pagination: { page, limit }
  };
};

/**
 * Get job statistics
 */
export const getJobStats = async () => {
  const query = `
    SELECT
      COUNT(*) FILTER (WHERE "status" = 'published') as "publishedJobs",
      COUNT(*) FILTER (WHERE "status" = 'closed') as "closedJobs",
      COUNT(*) as "totalJobs",
      (SELECT COUNT(*) FROM "jobApplications") as "totalApplications",
      (SELECT COUNT(*) FROM "jobApplications" WHERE "status" = 'hired') as "totalHired"
    FROM "jobPostings"
  `;

  const result = await pool.query(query);
  return result.rows[0];
};
