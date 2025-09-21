import express from 'express';
import { authenticate } from '../../core/middleware/auth';
import {
  getProfile,
  updateProfile,
  uploadAvatar,
  deleteAvatar,
  changePassword
} from './users.controller';

const router = express.Router();

/**
 * @swagger
 * /api/users/profile:
 *   get:
 *     summary: Get user profile
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Profile retrieved successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: User not found
 */
router.get('/profile', authenticate, getProfile);

/**
 * @swagger
 * /api/users/profile:
 *   put:
 *     summary: Update user profile
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               firstName:
 *                 type: string
 *               lastName:
 *                 type: string
 *               phone:
 *                 type: string
 *               profileData:
 *                 type: object
 *     responses:
 *       200:
 *         description: Profile updated successfully
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Update failed
 */
router.put('/profile', authenticate, updateProfile);

router.post('/avatar', authenticate, uploadAvatar);
router.delete('/avatar', authenticate, deleteAvatar);
router.put('/password', authenticate, changePassword);

export default router;