import { Response } from 'express';
import { AuthenticatedRequest } from '../../core/middleware/auth';
import {
  createJob,
  getJobs,
  getJobById,
  updateJob,
  deleteJob,
  applyForJob,
  getApplications,
  getApplicationById,
  updateApplicationStatus,
  scheduleInterview,
  getInterviews,
  getJobStats
} from './job.service';
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
 * Create a new job posting (Admin only)
 */
export const createJobController = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: { code: 'UNAUTHORIZED', message: 'Authentication required' },
        timestamp: new Date().toISOString()
      });
      return;
    }

    // Check if user is admin
    if (req.user.role !== 'admin') {
      res.status(403).json({
        success: false,
        error: { code: 'FORBIDDEN', message: 'Admin access required' },
        timestamp: new Date().toISOString()
      });
      return;
    }

    const data: CreateJobData = req.body;
    const job = await createJob(req.user.sub, data);

    res.status(201).json({
      success: true,
      data: { job },
      message: 'Job posting created successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      error: {
        code: 'CREATE_FAILED',
        message: error.message || 'Failed to create job posting'
      },
      timestamp: new Date().toISOString()
    });
  }
};

/**
 * Get all job postings (Public - with filters)
 */
export const getJobsController = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const filters: JobFilters = {
      status: req.query.status as any,
      jobType: req.query.job_type as any,
      location: req.query.location as string,
      experience_min: req.query.experience_min ? parseInt(req.query.experience_min as string) : undefined,
      experience_max: req.query.experience_max ? parseInt(req.query.experience_max as string) : undefined,
      page: req.query.page ? parseInt(req.query.page as string) : 1,
      limit: req.query.limit ? parseInt(req.query.limit as string) : 10
    };

    const result = await getJobs(filters);

    res.status(200).json({
      success: true,
      data: result,
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: {
        code: 'FETCH_FAILED',
        message: error.message || 'Failed to fetch job postings'
      },
      timestamp: new Date().toISOString()
    });
  }
};

/**
 * Get specific job by ID
 */
export const getJobController = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;
    const job = await getJobById(id);

    res.status(200).json({
      success: true,
      data: { job },
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    const statusCode = error.message === 'Job posting not found' ? 404 : 500;
    res.status(statusCode).json({
      success: false,
      error: {
        code: statusCode === 404 ? 'NOT_FOUND' : 'FETCH_FAILED',
        message: error.message || 'Failed to fetch job posting'
      },
      timestamp: new Date().toISOString()
    });
  }
};

/**
 * Update job posting (Admin only)
 */
export const updateJobController = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: { code: 'UNAUTHORIZED', message: 'Authentication required' },
        timestamp: new Date().toISOString()
      });
      return;
    }

    // Check if user is admin
    if (req.user.role !== 'admin') {
      res.status(403).json({
        success: false,
        error: { code: 'FORBIDDEN', message: 'Admin access required' },
        timestamp: new Date().toISOString()
      });
      return;
    }

    const { id } = req.params;
    const data: UpdateJobData = req.body;
    const job = await updateJob(id, data);

    res.status(200).json({
      success: true,
      data: { job },
      message: 'Job posting updated successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    const statusCode = error.message === 'Job posting not found' ? 404 : 400;
    res.status(statusCode).json({
      success: false,
      error: {
        code: statusCode === 404 ? 'NOT_FOUND' : 'UPDATE_FAILED',
        message: error.message || 'Failed to update job posting'
      },
      timestamp: new Date().toISOString()
    });
  }
};

/**
 * Delete job posting (Admin only)
 */
export const deleteJobController = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: { code: 'UNAUTHORIZED', message: 'Authentication required' },
        timestamp: new Date().toISOString()
      });
      return;
    }

    // Check if user is admin
    if (req.user.role !== 'admin') {
      res.status(403).json({
        success: false,
        error: { code: 'FORBIDDEN', message: 'Admin access required' },
        timestamp: new Date().toISOString()
      });
      return;
    }

    const { id } = req.params;
    await deleteJob(id);

    res.status(200).json({
      success: true,
      message: 'Job posting deleted successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    const statusCode = error.message === 'Job posting not found' ? 404 : 500;
    res.status(statusCode).json({
      success: false,
      error: {
        code: statusCode === 404 ? 'NOT_FOUND' : 'DELETE_FAILED',
        message: error.message || 'Failed to delete job posting'
      },
      timestamp: new Date().toISOString()
    });
  }
};

/**
 * Apply for a job (Candidate only)
 */
export const applyForJobController = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: { code: 'UNAUTHORIZED', message: 'Authentication required' },
        timestamp: new Date().toISOString()
      });
      return;
    }

    const { id } = req.params;
    const data: CreateApplicationData = req.body;
    const application = await applyForJob(id, req.user.sub, data);

    res.status(201).json({
      success: true,
      data: { application },
      message: 'Application submitted successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    const statusCode = error.message.includes('already applied') ? 409 : 400;
    res.status(statusCode).json({
      success: false,
      error: {
        code: statusCode === 409 ? 'ALREADY_APPLIED' : 'APPLICATION_FAILED',
        message: error.message || 'Failed to submit application'
      },
      timestamp: new Date().toISOString()
    });
  }
};

/**
 * Get all applications (with filters)
 */
export const getApplicationsController = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: { code: 'UNAUTHORIZED', message: 'Authentication required' },
        timestamp: new Date().toISOString()
      });
      return;
    }

    const filters: ApplicationFilters = {
      status: req.query.status as any,
      jobId: req.query.job_id as string,
      candidateId: req.user.role === 'candidate' ? req.user.sub : (req.query.candidate_id as string),
      page: req.query.page ? parseInt(req.query.page as string) : 1,
      limit: req.query.limit ? parseInt(req.query.limit as string) : 10
    };

    const result = await getApplications(filters);

    res.status(200).json({
      success: true,
      data: result,
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: {
        code: 'FETCH_FAILED',
        message: error.message || 'Failed to fetch applications'
      },
      timestamp: new Date().toISOString()
    });
  }
};

/**
 * Get specific application by ID
 */
export const getApplicationController = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: { code: 'UNAUTHORIZED', message: 'Authentication required' },
        timestamp: new Date().toISOString()
      });
      return;
    }

    const { id } = req.params;
    const application = await getApplicationById(id);

    // Check authorization
    if (req.user.role === 'candidate' && application.candidate_id !== req.user.sub) {
      res.status(403).json({
        success: false,
        error: { code: 'FORBIDDEN', message: 'Access denied' },
        timestamp: new Date().toISOString()
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: { application },
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    const statusCode = error.message === 'Application not found' ? 404 : 500;
    res.status(statusCode).json({
      success: false,
      error: {
        code: statusCode === 404 ? 'NOT_FOUND' : 'FETCH_FAILED',
        message: error.message || 'Failed to fetch application'
      },
      timestamp: new Date().toISOString()
    });
  }
};

/**
 * Update application status (Admin only)
 */
export const updateApplicationStatusController = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: { code: 'UNAUTHORIZED', message: 'Authentication required' },
        timestamp: new Date().toISOString()
      });
      return;
    }

    // Check if user is admin
    if (req.user.role !== 'admin') {
      res.status(403).json({
        success: false,
        error: { code: 'FORBIDDEN', message: 'Admin access required' },
        timestamp: new Date().toISOString()
      });
      return;
    }

    const { id } = req.params;
    const data: UpdateApplicationData = req.body;
    const application = await updateApplicationStatus(id, data);

    res.status(200).json({
      success: true,
      data: { application },
      message: 'Application status updated successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    const statusCode = error.message === 'Application not found' ? 404 : 400;
    res.status(statusCode).json({
      success: false,
      error: {
        code: statusCode === 404 ? 'NOT_FOUND' : 'UPDATE_FAILED',
        message: error.message || 'Failed to update application status'
      },
      timestamp: new Date().toISOString()
    });
  }
};

/**
 * Schedule an interview (Admin only)
 */
export const scheduleInterviewController = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: { code: 'UNAUTHORIZED', message: 'Authentication required' },
        timestamp: new Date().toISOString()
      });
      return;
    }

    // Check if user is admin
    if (req.user.role !== 'admin') {
      res.status(403).json({
        success: false,
        error: { code: 'FORBIDDEN', message: 'Admin access required' },
        timestamp: new Date().toISOString()
      });
      return;
    }

    const { id } = req.params;
    const data: CreateInterviewData = req.body;
    const interview = await scheduleInterview(id, data);

    res.status(201).json({
      success: true,
      data: { interview },
      message: 'Interview scheduled successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      error: {
        code: 'SCHEDULE_FAILED',
        message: error.message || 'Failed to schedule interview'
      },
      timestamp: new Date().toISOString()
    });
  }
};

/**
 * Get interviews
 */
export const getInterviewsController = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: { code: 'UNAUTHORIZED', message: 'Authentication required' },
        timestamp: new Date().toISOString()
      });
      return;
    }

    const filters: any = {
      application_id: req.query.application_id as string,
      candidateId: req.user.role === 'candidate' ? req.user.sub : (req.query.candidate_id as string),
      status: req.query.status as string,
      page: req.query.page ? parseInt(req.query.page as string) : 1,
      limit: req.query.limit ? parseInt(req.query.limit as string) : 10
    };

    const result = await getInterviews(filters);

    res.status(200).json({
      success: true,
      data: result,
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: {
        code: 'FETCH_FAILED',
        message: error.message || 'Failed to fetch interviews'
      },
      timestamp: new Date().toISOString()
    });
  }
};

/**
 * Get job statistics
 */
export const getJobStatsController = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const stats = await getJobStats();

    res.status(200).json({
      success: true,
      data: { stats },
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: {
        code: 'FETCH_FAILED',
        message: error.message || 'Failed to fetch job statistics'
      },
      timestamp: new Date().toISOString()
    });
  }
};
