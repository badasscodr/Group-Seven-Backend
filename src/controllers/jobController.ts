import { Response } from 'express';
import { validationResult } from 'express-validator';
import * as jobService from '../services/jobService';
import { AuthenticatedRequest } from '../middleware/auth';

// Job Postings Controllers
export const createJobPosting = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'The given data was invalid',
          details: errors.array()
        },
        timestamp: new Date().toISOString()
      });
    }

    const jobData = {
      ...req.body,
      postedBy: req.user!.sub
    };

    const job = await jobService.createJobPosting(jobData);

    res.status(201).json({
      success: true,
      data: job,
      message: 'Job posting created successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Create job posting error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to create job posting'
      },
      timestamp: new Date().toISOString()
    });
  }
};

export const getJobPostings = async (req: any, res: Response) => {
  try {
    const filters = {
      jobType: req.query.jobType as string,
      location: req.query.location as string,
      status: req.query.status as string,
      limit: req.query.limit ? parseInt(req.query.limit as string) : 20,
      offset: req.query.offset ? parseInt(req.query.offset as string) : 0
    };

    const jobs = await jobService.getJobPostings(filters);

    res.json({
      success: true,
      data: {
        jobs,
        pagination: {
          limit: filters.limit,
          offset: filters.offset,
          total: jobs.length
        }
      },
      message: 'Job postings retrieved successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Get job postings error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to retrieve job postings'
      },
      timestamp: new Date().toISOString()
    });
  }
};

export const getJobPostingById = async (req: any, res: Response) => {
  try {
    const { id } = req.params;
    const job = await jobService.getJobPostingById(id!);

    if (!job) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Job posting not found'
        },
        timestamp: new Date().toISOString()
      });
    }

    res.json({
      success: true,
      data: job,
      message: 'Job posting retrieved successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Get job posting error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to retrieve job posting'
      },
      timestamp: new Date().toISOString()
    });
  }
};

export const updateJobPosting = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'The given data was invalid',
          details: errors.array()
        },
        timestamp: new Date().toISOString()
      });
    }

    const { id } = req.params;
    const updates = req.body;

    // Remove fields that shouldn't be updated
    delete updates.id;
    delete updates.posted_by;
    delete updates.created_at;

    const job = await jobService.updateJobPosting(id!, updates);

    if (!job) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Job posting not found'
        },
        timestamp: new Date().toISOString()
      });
    }

    res.json({
      success: true,
      data: job,
      message: 'Job posting updated successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Update job posting error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to update job posting'
      },
      timestamp: new Date().toISOString()
    });
  }
};

export const deleteJobPosting = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const deleted = await jobService.deleteJobPosting(id!);

    if (!deleted) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Job posting not found'
        },
        timestamp: new Date().toISOString()
      });
    }

    res.json({
      success: true,
      message: 'Job posting deleted successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Delete job posting error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to delete job posting'
      },
      timestamp: new Date().toISOString()
    });
  }
};

// Job Applications Controllers
export const createJobApplication = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'The given data was invalid',
          details: errors.array()
        },
        timestamp: new Date().toISOString()
      });
    }

    const applicationData = {
      ...req.body,
      candidateId: req.user!.sub
    };

    const application = await jobService.createJobApplication(applicationData);

    res.status(201).json({
      success: true,
      data: application,
      message: 'Job application submitted successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Create job application error:', error);

    if (error instanceof Error && error.message.includes('already applied')) {
      return res.status(409).json({
        success: false,
        error: {
          code: 'DUPLICATE_APPLICATION',
          message: error.message
        },
        timestamp: new Date().toISOString()
      });
    }

    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to submit job application'
      },
      timestamp: new Date().toISOString()
    });
  }
};

export const getJobApplications = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const filters = {
      jobId: req.query.jobId as string,
      candidateId: req.query.candidateId as string,
      status: req.query.status as string,
      limit: req.query.limit ? parseInt(req.query.limit as string) : 20,
      offset: req.query.offset ? parseInt(req.query.offset as string) : 0
    };

    // If user is a candidate, only show their applications
    if (req.user!.role === 'candidate') {
      filters.candidateId = req.user!.sub;
    }

    const applications = await jobService.getJobApplications(filters);

    res.json({
      success: true,
      data: {
        applications,
        pagination: {
          limit: filters.limit,
          offset: filters.offset,
          total: applications.length
        }
      },
      message: 'Job applications retrieved successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Get job applications error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to retrieve job applications'
      },
      timestamp: new Date().toISOString()
    });
  }
};

export const updateJobApplicationStatus = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const application = await jobService.updateJobApplicationStatus(id!, status);

    if (!application) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Job application not found'
        },
        timestamp: new Date().toISOString()
      });
    }

    res.json({
      success: true,
      data: application,
      message: 'Job application status updated successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Update job application status error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to update job application status'
      },
      timestamp: new Date().toISOString()
    });
  }
};

// Interview Controllers
export const scheduleInterview = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'The given data was invalid',
          details: errors.array()
        },
        timestamp: new Date().toISOString()
      });
    }

    const interviewData = {
      ...req.body,
      interviewerId: req.user!.sub
    };

    const interview = await jobService.scheduleInterview(interviewData);

    res.status(201).json({
      success: true,
      data: interview,
      message: 'Interview scheduled successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Schedule interview error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to schedule interview'
      },
      timestamp: new Date().toISOString()
    });
  }
};

export const getInterviews = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const filters = {
      applicationId: req.query.applicationId as string,
      interviewerId: req.query.interviewerId as string,
      candidateId: req.query.candidateId as string,
      status: req.query.status as string,
      limit: req.query.limit ? parseInt(req.query.limit as string) : 20,
      offset: req.query.offset ? parseInt(req.query.offset as string) : 0
    };

    // Role-based filtering
    if (req.user!.role === 'candidate') {
      filters.candidateId = req.user!.sub;
    } else if (req.user!.role === 'employee') {
      filters.interviewerId = req.user!.sub;
    }

    const interviews = await jobService.getInterviews(filters);

    res.json({
      success: true,
      data: {
        interviews,
        pagination: {
          limit: filters.limit,
          offset: filters.offset,
          total: interviews.length
        }
      },
      message: 'Interviews retrieved successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Get interviews error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to retrieve interviews'
      },
      timestamp: new Date().toISOString()
    });
  }
};

export const updateInterviewStatus = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { status, notes } = req.body;

    const interview = await jobService.updateInterviewStatus(id!, status, notes);

    if (!interview) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Interview not found'
        },
        timestamp: new Date().toISOString()
      });
    }

    res.json({
      success: true,
      data: interview,
      message: 'Interview status updated successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Update interview status error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to update interview status'
      },
      timestamp: new Date().toISOString()
    });
  }
};