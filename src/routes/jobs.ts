import express from 'express';
import { authenticate, authorize } from '../middleware/auth';
import * as jobController from '../controllers/jobController';
import {
  jobPostingValidation,
  jobApplicationValidation,
  interviewScheduleValidation,
  applicationStatusValidation,
  interviewStatusValidation,
  handleValidationErrors
} from '../utils/validation';

const router = express.Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     JobPosting:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *         title:
 *           type: string
 *         description:
 *           type: string
 *         company:
 *           type: string
 *         location:
 *           type: string
 *         jobType:
 *           type: string
 *           enum: [full_time, part_time, contract, internship]
 *         experienceRequired:
 *           type: integer
 *         salaryMin:
 *           type: number
 *         salaryMax:
 *           type: number
 *         skillsRequired:
 *           type: array
 *           items:
 *             type: string
 *         benefits:
 *           type: array
 *           items:
 *             type: string
 *         applicationDeadline:
 *           type: string
 *           format: date
 */

// Public routes - Job browsing
/**
 * @swagger
 * /api/jobs:
 *   get:
 *     summary: Get all job postings (public)
 *     tags: [Jobs]
 *     parameters:
 *       - in: query
 *         name: jobType
 *         schema:
 *           type: string
 *         description: Filter by job type
 *       - in: query
 *         name: location
 *         schema:
 *           type: string
 *         description: Filter by location
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         description: Number of results to return
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *         description: Number of results to skip
 *     responses:
 *       200:
 *         description: Job postings retrieved successfully
 */
router.get('/', jobController.getJobPostings);

/**
 * @swagger
 * /api/jobs/{id}:
 *   get:
 *     summary: Get job posting by ID (public)
 *     tags: [Jobs]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Job posting retrieved successfully
 *       404:
 *         description: Job posting not found
 */
router.get('/:id', jobController.getJobPostingById);

// Protected routes - Candidate actions
/**
 * @swagger
 * /api/candidate/applications:
 *   post:
 *     summary: Apply for a job (candidates only)
 *     tags: [Job Applications]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - jobId
 *             properties:
 *               jobId:
 *                 type: string
 *                 format: uuid
 *               coverLetter:
 *                 type: string
 *               resumeUrl:
 *                 type: string
 *                 format: uri
 *     responses:
 *       201:
 *         description: Application submitted successfully
 *       409:
 *         description: Already applied for this job
 */
router.post('/applications',
  authenticate,
  authorize(['candidate']),
  jobApplicationValidation,
  handleValidationErrors,
  jobController.createJobApplication
);

/**
 * @swagger
 * /api/candidate/applications:
 *   get:
 *     summary: Get candidate's job applications
 *     tags: [Job Applications]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Applications retrieved successfully
 */
router.get('/applications',
  authenticate,
  authorize(['candidate', 'admin']),
  jobController.getJobApplications
);

/**
 * @swagger
 * /api/candidate/interviews:
 *   get:
 *     summary: Get candidate's scheduled interviews
 *     tags: [Interviews]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Interviews retrieved successfully
 */
router.get('/interviews',
  authenticate,
  authorize(['candidate', 'admin', 'employee']),
  jobController.getInterviews
);

// Admin/HR routes - Job management
/**
 * @swagger
 * /api/admin/jobs:
 *   post:
 *     summary: Create a new job posting (admin only)
 *     tags: [Jobs]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - description
 *               - location
 *               - jobType
 *             properties:
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               company:
 *                 type: string
 *               location:
 *                 type: string
 *               jobType:
 *                 type: string
 *                 enum: [full_time, part_time, contract, internship]
 *               experienceRequired:
 *                 type: integer
 *               salaryMin:
 *                 type: number
 *               salaryMax:
 *                 type: number
 *               skillsRequired:
 *                 type: array
 *                 items:
 *                   type: string
 *               benefits:
 *                 type: array
 *                 items:
 *                   type: string
 *               applicationDeadline:
 *                 type: string
 *                 format: date
 *     responses:
 *       201:
 *         description: Job posting created successfully
 */
router.post('/admin',
  authenticate,
  authorize(['admin']),
  jobPostingValidation,
  handleValidationErrors,
  jobController.createJobPosting
);

/**
 * @swagger
 * /api/admin/jobs:
 *   get:
 *     summary: Get all job postings (admin view)
 *     tags: [Jobs]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Job postings retrieved successfully
 */
router.get('/admin',
  authenticate,
  authorize(['admin']),
  jobController.getJobPostings
);

/**
 * @swagger
 * /api/admin/jobs/{id}:
 *   put:
 *     summary: Update job posting (admin only)
 *     tags: [Jobs]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Job posting updated successfully
 */
router.put('/admin/:id',
  authenticate,
  authorize(['admin']),
  jobController.updateJobPosting
);

/**
 * @swagger
 * /api/admin/jobs/{id}:
 *   delete:
 *     summary: Delete job posting (admin only)
 *     tags: [Jobs]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Job posting deleted successfully
 */
router.delete('/admin/:id',
  authenticate,
  authorize(['admin']),
  jobController.deleteJobPosting
);

/**
 * @swagger
 * /api/admin/jobs/{id}/applications:
 *   get:
 *     summary: Get applications for a specific job (admin only)
 *     tags: [Job Applications]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Applications retrieved successfully
 */
router.get('/admin/:id/applications',
  authenticate,
  authorize(['admin']),
  (req: any, res: any, next: any) => {
    req.query.jobId = req.params.id;
    next();
  },
  jobController.getJobApplications
);

/**
 * @swagger
 * /api/admin/applications/{id}/status:
 *   put:
 *     summary: Update application status (admin only)
 *     tags: [Job Applications]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - status
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [applied, screening, interview, hired, rejected]
 *     responses:
 *       200:
 *         description: Application status updated successfully
 */
router.put('/admin/applications/:id/status',
  authenticate,
  authorize(['admin']),
  applicationStatusValidation,
  handleValidationErrors,
  jobController.updateJobApplicationStatus
);

/**
 * @swagger
 * /api/admin/interviews:
 *   post:
 *     summary: Schedule an interview (admin only)
 *     tags: [Interviews]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - applicationId
 *               - scheduledDate
 *             properties:
 *               applicationId:
 *                 type: string
 *                 format: uuid
 *               scheduledDate:
 *                 type: string
 *                 format: date-time
 *               duration:
 *                 type: integer
 *               interviewType:
 *                 type: string
 *               location:
 *                 type: string
 *               notes:
 *                 type: string
 *     responses:
 *       201:
 *         description: Interview scheduled successfully
 */
router.post('/admin/interviews',
  authenticate,
  authorize(['admin', 'employee']),
  interviewScheduleValidation,
  handleValidationErrors,
  jobController.scheduleInterview
);

/**
 * @swagger
 * /api/admin/interviews/{id}/status:
 *   put:
 *     summary: Update interview status (admin only)
 *     tags: [Interviews]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - status
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [scheduled, completed, cancelled, rescheduled]
 *               notes:
 *                 type: string
 *     responses:
 *       200:
 *         description: Interview status updated successfully
 */
router.put('/admin/interviews/:id/status',
  authenticate,
  authorize(['admin', 'employee']),
  interviewStatusValidation,
  handleValidationErrors,
  jobController.updateInterviewStatus
);

export default router;