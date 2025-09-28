import express from 'express';
import { authenticate } from '../../core/middleware/auth';
import {
  clockInController,
  clockOutController,
  getAttendanceController,
  getTodayAttendanceController,
  submitLeaveRequestController,
  getLeaveRequestsController,
  getProfileController,
  createProfileController
} from './employee.controller';

const router = express.Router();

/**
 * @swagger
 * /api/employee/profile:
 *   get:
 *     summary: Get employee profile
 *     tags: [Employee]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Employee profile retrieved successfully
 *       404:
 *         description: Employee profile not found
 *       401:
 *         description: Unauthorized
 */
router.get('/profile', authenticate, getProfileController);

/**
 * @swagger
 * /api/employee/profile:
 *   post:
 *     summary: Create employee profile
 *     tags: [Employee]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               employeeId:
 *                 type: string
 *               department:
 *                 type: string
 *               position:
 *                 type: string
 *               hireDate:
 *                 type: string
 *                 format: date
 *               salary:
 *                 type: number
 *               managerId:
 *                 type: string
 *     responses:
 *       201:
 *         description: Employee profile created successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 */
router.post('/profile', authenticate, createProfileController);

/**
 * @swagger
 * /api/employee/attendance:
 *   get:
 *     summary: Get attendance records
 *     tags: [Employee]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Start date for filtering
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         description: End date for filtering
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         description: Maximum number of records to return
 *     responses:
 *       200:
 *         description: Attendance records retrieved successfully
 *       401:
 *         description: Unauthorized
 */
router.get('/attendance', authenticate, getAttendanceController);

/**
 * @swagger
 * /api/employee/attendance/today:
 *   get:
 *     summary: Get today's attendance status
 *     tags: [Employee]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Today's attendance retrieved successfully
 *       401:
 *         description: Unauthorized
 */
router.get('/attendance/today', authenticate, getTodayAttendanceController);

/**
 * @swagger
 * /api/employee/clock-in:
 *   post:
 *     summary: Clock in for the day
 *     tags: [Employee]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Successfully clocked in
 *       400:
 *         description: Already clocked in or validation error
 *       401:
 *         description: Unauthorized
 */
router.post('/clock-in', authenticate, clockInController);

/**
 * @swagger
 * /api/employee/clock-out:
 *   post:
 *     summary: Clock out for the day
 *     tags: [Employee]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Successfully clocked out
 *       400:
 *         description: Must clock in first or already clocked out
 *       401:
 *         description: Unauthorized
 */
router.post('/clock-out', authenticate, clockOutController);

/**
 * @swagger
 * /api/employee/leave-requests:
 *   get:
 *     summary: Get leave requests
 *     tags: [Employee]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Leave requests retrieved successfully
 *       401:
 *         description: Unauthorized
 */
router.get('/leave-requests', authenticate, getLeaveRequestsController);

/**
 * @swagger
 * /api/employee/leave-request:
 *   post:
 *     summary: Submit a leave request
 *     tags: [Employee]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               leaveType:
 *                 type: string
 *                 enum: [annual, sick, personal, emergency, maternity, paternity]
 *               startDate:
 *                 type: string
 *                 format: date
 *               endDate:
 *                 type: string
 *                 format: date
 *               reason:
 *                 type: string
 *     responses:
 *       201:
 *         description: Leave request submitted successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 */
router.post('/leave-request', authenticate, submitLeaveRequestController);

export default router;