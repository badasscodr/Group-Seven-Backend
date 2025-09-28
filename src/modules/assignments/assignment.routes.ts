import express from 'express';
import { authenticate } from '../../core/middleware/auth';
import {
  getProjectsController,
  getProjectController,
  createProjectController,
  updateProjectController,
  getAssignmentsController,
  getEmployeeAssignmentsController,
  createAssignmentController,
  updateAssignmentStatusController,
  getTasksController,
  createTaskController,
  updateTaskController
} from './assignment.controller';

const router = express.Router();

// Project Routes (Admin only for most operations)
/**
 * @swagger
 * /api/assignments/projects:
 *   get:
 *     summary: Get all projects
 *     tags: [Assignments]
 *     security:
 *       - bearerAuth: []
 */
router.get('/projects', authenticate, getProjectsController);

/**
 * @swagger
 * /api/assignments/projects/{id}:
 *   get:
 *     summary: Get project by ID
 *     tags: [Assignments]
 *     security:
 *       - bearerAuth: []
 */
router.get('/projects/:id', authenticate, getProjectController);

/**
 * @swagger
 * /api/assignments/projects:
 *   post:
 *     summary: Create new project (Admin only)
 *     tags: [Assignments]
 *     security:
 *       - bearerAuth: []
 */
router.post('/projects', authenticate, createProjectController);

/**
 * @swagger
 * /api/assignments/projects/{id}:
 *   put:
 *     summary: Update project (Admin only)
 *     tags: [Assignments]
 *     security:
 *       - bearerAuth: []
 */
router.put('/projects/:id', authenticate, updateProjectController);

// Assignment Routes
/**
 * @swagger
 * /api/assignments:
 *   get:
 *     summary: Get all assignments (Admin only)
 *     tags: [Assignments]
 *     security:
 *       - bearerAuth: []
 */
router.get('/', authenticate, getAssignmentsController);

/**
 * @swagger
 * /api/assignments/employee:
 *   get:
 *     summary: Get assignments for current employee
 *     tags: [Assignments]
 *     security:
 *       - bearerAuth: []
 */
router.get('/employee', authenticate, getEmployeeAssignmentsController);

/**
 * @swagger
 * /api/assignments:
 *   post:
 *     summary: Create new assignment (Admin only)
 *     tags: [Assignments]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - employee_id
 *               - project_id
 *             properties:
 *               employee_id:
 *                 type: string
 *               project_id:
 *                 type: string
 *               role_in_project:
 *                 type: string
 *               start_date:
 *                 type: string
 *                 format: date
 *               end_date:
 *                 type: string
 *                 format: date
 *               hours_allocated:
 *                 type: integer
 *               notes:
 *                 type: string
 */
router.post('/', authenticate, createAssignmentController);

/**
 * @swagger
 * /api/assignments/{id}/status:
 *   put:
 *     summary: Update assignment status
 *     tags: [Assignments]
 *     security:
 *       - bearerAuth: []
 */
router.put('/:id/status', authenticate, updateAssignmentStatusController);

// Task Routes
/**
 * @swagger
 * /api/assignments/{assignmentId}/tasks:
 *   get:
 *     summary: Get tasks for assignment
 *     tags: [Assignments]
 *     security:
 *       - bearerAuth: []
 */
router.get('/:assignmentId/tasks', authenticate, getTasksController);

/**
 * @swagger
 * /api/assignments/tasks:
 *   post:
 *     summary: Create new task
 *     tags: [Assignments]
 *     security:
 *       - bearerAuth: []
 */
router.post('/tasks', authenticate, createTaskController);

/**
 * @swagger
 * /api/assignments/tasks/{id}:
 *   put:
 *     summary: Update task progress
 *     tags: [Assignments]
 *     security:
 *       - bearerAuth: []
 */
router.put('/tasks/:id', authenticate, updateTaskController);

export default router;