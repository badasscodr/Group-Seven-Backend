import pool from '../config/database';
import { JobPosting, JobApplication, Interview } from '../types';

// Job Postings
export const createJobPosting = async (jobData: {
  title: string;
  description: string;
  company?: string;
  location: string;
  jobType: 'full_time' | 'part_time' | 'contract' | 'internship';
  experienceRequired?: number;
  salaryMin?: number;
  salaryMax?: number;
  skillsRequired?: string[];
  benefits?: string[];
  applicationDeadline?: Date;
  postedBy: string;
}): Promise<JobPosting> => {
  const {
    title,
    description,
    company,
    location,
    jobType,
    experienceRequired,
    salaryMin,
    salaryMax,
    skillsRequired = [],
    benefits = [],
    applicationDeadline,
    postedBy
  } = jobData;

  const query = `
    INSERT INTO job_postings (
      title, description, company, location, job_type, experience_required,
      salary_min, salary_max, skills_required, benefits, application_deadline, posted_by
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
    RETURNING *
  `;

  const values = [
    title,
    description,
    company,
    location,
    jobType,
    experienceRequired,
    salaryMin,
    salaryMax,
    skillsRequired,
    benefits,
    applicationDeadline,
    postedBy
  ];

  const result = await pool.query(query, values);
  return result.rows[0];
};

export const getJobPostings = async (filters: {
  jobType?: string;
  location?: string;
  status?: string;
  limit?: number;
  offset?: number;
} = {}): Promise<JobPosting[]> => {
  let query = `
    SELECT jp.*, u.first_name, u.last_name
    FROM job_postings jp
    LEFT JOIN users u ON jp.posted_by = u.id
    WHERE 1=1
  `;

  const values: any[] = [];
  let paramCount = 0;

  if (filters.jobType) {
    paramCount++;
    query += ` AND jp.job_type = $${paramCount}`;
    values.push(filters.jobType);
  }

  if (filters.location) {
    paramCount++;
    query += ` AND jp.location ILIKE $${paramCount}`;
    values.push(`%${filters.location}%`);
  }

  if (filters.status) {
    paramCount++;
    query += ` AND jp.status = $${paramCount}`;
    values.push(filters.status);
  } else {
    query += ` AND jp.status = 'published'`;
  }

  query += ` ORDER BY jp.created_at DESC`;

  if (filters.limit) {
    paramCount++;
    query += ` LIMIT $${paramCount}`;
    values.push(filters.limit);
  }

  if (filters.offset) {
    paramCount++;
    query += ` OFFSET $${paramCount}`;
    values.push(filters.offset);
  }

  const result = await pool.query(query, values);
  return result.rows;
};

export const getJobPostingById = async (jobId: string): Promise<JobPosting | null> => {
  const query = `
    SELECT jp.*, u.first_name, u.last_name
    FROM job_postings jp
    LEFT JOIN users u ON jp.posted_by = u.id
    WHERE jp.id = $1
  `;

  const result = await pool.query(query, [jobId]);
  return result.rows[0] || null;
};

export const updateJobPosting = async (
  jobId: string,
  updates: Partial<JobPosting>
): Promise<JobPosting | null> => {
  const setClause = Object.keys(updates)
    .map((key, index) => `${key} = $${index + 2}`)
    .join(', ');

  const query = `
    UPDATE job_postings
    SET ${setClause}, updated_at = CURRENT_TIMESTAMP
    WHERE id = $1
    RETURNING *
  `;

  const values = [jobId, ...Object.values(updates)];
  const result = await pool.query(query, values);
  return result.rows[0] || null;
};

export const deleteJobPosting = async (jobId: string): Promise<boolean> => {
  const query = 'DELETE FROM job_postings WHERE id = $1';
  const result = await pool.query(query, [jobId]);
  return result.rowCount > 0;
};

// Job Applications
export const createJobApplication = async (applicationData: {
  jobId: string;
  candidateId: string;
  coverLetter?: string;
  resumeUrl?: string;
}): Promise<JobApplication> => {
  // Check if candidate already applied for this job
  const existingApplication = await pool.query(
    'SELECT id FROM job_applications WHERE job_id = $1 AND candidate_id = $2',
    [applicationData.jobId, applicationData.candidateId]
  );

  if (existingApplication.rows.length > 0) {
    throw new Error('You have already applied for this job');
  }

  const query = `
    INSERT INTO job_applications (job_id, candidate_id, cover_letter, resume_url)
    VALUES ($1, $2, $3, $4)
    RETURNING *
  `;

  const values = [
    applicationData.jobId,
    applicationData.candidateId,
    applicationData.coverLetter,
    applicationData.resumeUrl
  ];

  const result = await pool.query(query, values);
  return result.rows[0];
};

export const getJobApplications = async (filters: {
  jobId?: string;
  candidateId?: string;
  status?: string;
  limit?: number;
  offset?: number;
}): Promise<JobApplication[]> => {
  let query = `
    SELECT ja.*,
           jp.title as job_title, jp.company,
           u.first_name, u.last_name, u.email,
           cp.experience_years, cp.skills
    FROM job_applications ja
    JOIN job_postings jp ON ja.job_id = jp.id
    JOIN users u ON ja.candidate_id = u.id
    LEFT JOIN candidate_profiles cp ON u.id = cp.user_id
    WHERE 1=1
  `;

  const values: any[] = [];
  let paramCount = 0;

  if (filters.jobId) {
    paramCount++;
    query += ` AND ja.job_id = $${paramCount}`;
    values.push(filters.jobId);
  }

  if (filters.candidateId) {
    paramCount++;
    query += ` AND ja.candidate_id = $${paramCount}`;
    values.push(filters.candidateId);
  }

  if (filters.status) {
    paramCount++;
    query += ` AND ja.status = $${paramCount}`;
    values.push(filters.status);
  }

  query += ` ORDER BY ja.applied_at DESC`;

  if (filters.limit) {
    paramCount++;
    query += ` LIMIT $${paramCount}`;
    values.push(filters.limit);
  }

  if (filters.offset) {
    paramCount++;
    query += ` OFFSET $${paramCount}`;
    values.push(filters.offset);
  }

  const result = await pool.query(query, values);
  return result.rows;
};

export const updateJobApplicationStatus = async (
  applicationId: string,
  status: 'applied' | 'screening' | 'interview' | 'hired' | 'rejected'
): Promise<JobApplication | null> => {
  const query = `
    UPDATE job_applications
    SET status = $2
    WHERE id = $1
    RETURNING *
  `;

  const result = await pool.query(query, [applicationId, status]);
  return result.rows[0] || null;
};

// Interview Scheduling
export const scheduleInterview = async (interviewData: {
  applicationId: string;
  scheduledDate: Date;
  duration?: number;
  interviewType?: string;
  location?: string;
  interviewerId: string;
  notes?: string;
}): Promise<Interview> => {
  const {
    applicationId,
    scheduledDate,
    duration = 60,
    interviewType = 'technical',
    location,
    interviewerId,
    notes
  } = interviewData;

  const query = `
    INSERT INTO interviews (
      application_id, scheduled_date, duration, interview_type,
      location, interviewer_id, notes
    ) VALUES ($1, $2, $3, $4, $5, $6, $7)
    RETURNING *
  `;

  const values = [
    applicationId,
    scheduledDate,
    duration,
    interviewType,
    location,
    interviewerId,
    notes
  ];

  const result = await pool.query(query, values);

  // Update application status to 'interview'
  await updateJobApplicationStatus(applicationId, 'interview');

  return result.rows[0];
};

export const getInterviews = async (filters: {
  applicationId?: string;
  interviewerId?: string;
  candidateId?: string;
  status?: string;
  limit?: number;
  offset?: number;
}): Promise<Interview[]> => {
  let query = `
    SELECT i.*,
           ja.job_id, ja.candidate_id,
           jp.title as job_title,
           u.first_name as candidate_first_name, u.last_name as candidate_last_name,
           interviewer.first_name as interviewer_first_name,
           interviewer.last_name as interviewer_last_name
    FROM interviews i
    JOIN job_applications ja ON i.application_id = ja.id
    JOIN job_postings jp ON ja.job_id = jp.id
    JOIN users u ON ja.candidate_id = u.id
    LEFT JOIN users interviewer ON i.interviewer_id = interviewer.id
    WHERE 1=1
  `;

  const values: any[] = [];
  let paramCount = 0;

  if (filters.applicationId) {
    paramCount++;
    query += ` AND i.application_id = $${paramCount}`;
    values.push(filters.applicationId);
  }

  if (filters.interviewerId) {
    paramCount++;
    query += ` AND i.interviewer_id = $${paramCount}`;
    values.push(filters.interviewerId);
  }

  if (filters.candidateId) {
    paramCount++;
    query += ` AND ja.candidate_id = $${paramCount}`;
    values.push(filters.candidateId);
  }

  if (filters.status) {
    paramCount++;
    query += ` AND i.status = $${paramCount}`;
    values.push(filters.status);
  }

  query += ` ORDER BY i.scheduled_date ASC`;

  if (filters.limit) {
    paramCount++;
    query += ` LIMIT $${paramCount}`;
    values.push(filters.limit);
  }

  if (filters.offset) {
    paramCount++;
    query += ` OFFSET $${paramCount}`;
    values.push(filters.offset);
  }

  const result = await pool.query(query, values);
  return result.rows;
};

export const updateInterviewStatus = async (
  interviewId: string,
  status: 'scheduled' | 'completed' | 'cancelled' | 'rescheduled',
  notes?: string
): Promise<Interview | null> => {
  const query = `
    UPDATE interviews
    SET status = $2, notes = COALESCE($3, notes)
    WHERE id = $1
    RETURNING *
  `;

  const result = await pool.query(query, [interviewId, status, notes]);
  return result.rows[0] || null;
};