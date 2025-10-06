import { Router } from 'express';
import { authenticate } from '../../core/middleware/auth';
import {
  createJobController,
  getJobsController,
  getJobController,
  updateJobController,
  deleteJobController,
  applyForJobController,
  getApplicationsController,
  getApplicationController,
  updateApplicationStatusController,
  scheduleInterviewController,
  getInterviewsController,
  getJobStatsController
} from './job.controller';

const router = Router();

/**
 * @swagger
 * /api/jobs:
 *   post:
 *     summary: Create new job posting (Admin only)
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
 *               status:
 *                 type: string
 *                 enum: [draft, published, closed, cancelled]
 *               applicationDeadline:
 *                 type: string
 *                 format: date
 *     responses:
 *       201:
 *         description: Job posting created successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Admin access required
 */
router.post('/', authenticate, createJobController);

/**
 * @swagger
 * /api/jobs:
 *   get:
 *     summary: Get all job postings (Public with auth)
 *     tags: [Jobs]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [draft, published, closed, cancelled]
 *       - in: query
 *         name: jobType
 *         schema:
 *           type: string
 *           enum: [full_time, part_time, contract, internship]
 *       - in: query
 *         name: location
 *         schema:
 *           type: string
 *       - in: query
 *         name: experienceMin
 *         schema:
 *           type: integer
 *       - in: query
 *         name: experienceMax
 *         schema:
 *           type: integer
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *     responses:
 *       200:
 *         description: Job postings retrieved successfully
 */
router.get('/', authenticate, getJobsController);

/**
 * @swagger
 * /api/jobs/stats:
 *   get:
 *     summary: Get job statistics
 *     tags: [Jobs]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Job statistics retrieved successfully
 */
router.get('/stats', authenticate, getJobStatsController);

/**
 * @swagger
 * /api/jobs/{id}:
 *   get:
 *     summary: Get specific job posting
 *     tags: [Jobs]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Job posting retrieved successfully
 *       404:
 *         description: Job posting not found
 */
router.get('/:id', authenticate, getJobController);

/**
 * @swagger
 * /api/jobs/{id}:
 *   put:
 *     summary: Update job posting (Admin only)
 *     tags: [Jobs]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: Job posting updated successfully
 *       404:
 *         description: Job posting not found
 */
router.put('/:id', authenticate, updateJobController);

/**
 * @swagger
 * /api/jobs/{id}:
 *   delete:
 *     summary: Delete job posting (Admin only)
 *     tags: [Jobs]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Job posting deleted successfully
 *       404:
 *         description: Job posting not found
 */
router.delete('/:id', authenticate, deleteJobController);

/**
 * @swagger
 * /api/jobs/{id}/apply:
 *   post:
 *     summary: Apply for a job (Candidate)
 *     tags: [Jobs]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Job posting ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               coverLetter:
 *                 type: string
 *               resumeUrl:
 *                 type: string
 *     responses:
 *       201:
 *         description: Application submitted successfully
 *       409:
 *         description: Already applied for this job
 */
router.post('/:id/apply', authenticate, applyForJobController);

/**
 * @swagger
 * /api/applications:
 *   get:
 *     summary: Get applications (filtered by role)
 *     tags: [Applications]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [applied, screening, interview, hired, rejected]
 *       - in: query
 *         name: jobId
 *         schema:
 *           type: string
 *       - in: query
 *         name: candidateId
 *         schema:
 *           type: string
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *     responses:
 *       200:
 *         description: Applications retrieved successfully
 */
router.get('/applications', authenticate, getApplicationsController);

/**
 * @swagger
 * /api/applications/{id}:
 *   get:
 *     summary: Get specific application
 *     tags: [Applications]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Application retrieved successfully
 *       404:
 *         description: Application not found
 */
router.get('/applications/:id', authenticate, getApplicationController);

/**
 * @swagger
 * /api/applications/{id}/status:
 *   put:
 *     summary: Update application status (Admin only)
 *     tags: [Applications]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
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
 *               notes:
 *                 type: string
 *     responses:
 *       200:
 *         description: Application status updated successfully
 *       404:
 *         description: Application not found
 */
router.put('/applications/:id/status', authenticate, updateApplicationStatusController);

/**
 * @swagger
 * /api/applications/{id}/interview:
 *   post:
 *     summary: Schedule interview (Admin only)
 *     tags: [Applications]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Application ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - scheduledDate
 *             properties:
 *               scheduledDate:
 *                 type: string
 *                 format: date-time
 *               duration:
 *                 type: integer
 *               interviewType:
 *                 type: string
 *               location:
 *                 type: string
 *               interviewerId:
 *                 type: string
 *               notes:
 *                 type: string
 *     responses:
 *       201:
 *         description: Interview scheduled successfully
 */
router.post('/applications/:id/interview', authenticate, scheduleInterviewController);

/**
 * @swagger
 * /api/interviews:
 *   get:
 *     summary: Get interviews (filtered by role)
 *     tags: [Applications]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: applicationId
 *         schema:
 *           type: string
 *       - in: query
 *         name: candidateId
 *         schema:
 *           type: string
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [scheduled, completed, cancelled, rescheduled]
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *     responses:
 *       200:
 *         description: Interviews retrieved successfully
 */
router.get('/interviews', authenticate, getInterviewsController);

export default router;
