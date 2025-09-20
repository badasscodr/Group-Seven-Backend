import { body, validationResult } from 'express-validator';
import { Request, Response, NextFunction } from 'express';

export const handleValidationErrors = (req: Request, res: Response, next: NextFunction): void => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    const errorDetails: Record<string, string[]> = {};

    errors.array().forEach((error: any) => {
      const field = error.path || error.param;
      if (!errorDetails[field]) {
        errorDetails[field] = [];
      }
      errorDetails[field].push(error.msg);
    });

    res.status(400).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'The given data was invalid',
        details: errorDetails,
      },
      timestamp: new Date().toISOString(),
    });
    return;
  }

  next();
};

export const registerValidation = [
  body('email')
    .isEmail()
    .withMessage('Must be a valid email address')
    .normalizeEmail(),

  body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Password must contain at least one lowercase letter, one uppercase letter, and one number'),

  body('firstName')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('First name must be between 2 and 50 characters')
    .matches(/^[a-zA-Z\s]+$/)
    .withMessage('First name can only contain letters and spaces'),

  body('lastName')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Last name must be between 2 and 50 characters')
    .matches(/^[a-zA-Z\s]+$/)
    .withMessage('Last name can only contain letters and spaces'),

  body('role')
    .isIn(['admin', 'client', 'supplier', 'employee', 'candidate'])
    .withMessage('Role must be one of: admin, client, supplier, employee, candidate'),

  body('phone')
    .optional()
    .matches(/^\+?[1-9]\d{1,14}$/)
    .withMessage('Phone number must be in valid international format'),
];

export const loginValidation = [
  body('email')
    .isEmail()
    .withMessage('Must be a valid email address')
    .normalizeEmail(),

  body('password')
    .notEmpty()
    .withMessage('Password is required'),
];

export const serviceRequestValidation = [
  body('title')
    .trim()
    .isLength({ min: 10, max: 255 })
    .withMessage('Title must be between 10 and 255 characters'),

  body('description')
    .trim()
    .isLength({ min: 50, max: 2000 })
    .withMessage('Description must be between 50 and 2000 characters'),

  body('category')
    .isIn(['construction', 'maintenance', 'consulting', 'technology', 'legal', 'other'])
    .withMessage('Category must be one of: construction, maintenance, consulting, technology, legal, other'),

  body('priority')
    .isIn(['low', 'medium', 'high', 'urgent'])
    .withMessage('Priority must be one of: low, medium, high, urgent'),

  body('budgetMin')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Budget minimum must be a positive number'),

  body('budgetMax')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Budget maximum must be a positive number')
    .custom((value, { req }) => {
      if (req.body.budgetMin && value <= req.body.budgetMin) {
        throw new Error('Budget maximum must be greater than budget minimum');
      }
      return true;
    }),

  body('deadline')
    .optional()
    .isISO8601()
    .withMessage('Deadline must be a valid date')
    .custom((value) => {
      if (new Date(value) <= new Date()) {
        throw new Error('Deadline must be in the future');
      }
      return true;
    }),

  body('location')
    .optional()
    .trim()
    .isLength({ max: 255 })
    .withMessage('Location must not exceed 255 characters'),
];

export const jobPostingValidation = [
  body('title')
    .trim()
    .isLength({ min: 5, max: 255 })
    .withMessage('Job title must be between 5 and 255 characters'),

  body('description')
    .trim()
    .isLength({ min: 100, max: 5000 })
    .withMessage('Job description must be between 100 and 5000 characters'),

  body('jobType')
    .isIn(['full_time', 'part_time', 'contract', 'internship'])
    .withMessage('Job type must be one of: full_time, part_time, contract, internship'),

  body('experienceRequired')
    .optional()
    .isInt({ min: 0, max: 50 })
    .withMessage('Experience required must be between 0 and 50 years'),

  body('salaryMin')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Minimum salary must be a positive number'),

  body('salaryMax')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Maximum salary must be a positive number')
    .custom((value, { req }) => {
      if (req.body.salaryMin && value <= req.body.salaryMin) {
        throw new Error('Maximum salary must be greater than minimum salary');
      }
      return true;
    }),

  body('skillsRequired')
    .optional()
    .isArray()
    .withMessage('Skills required must be an array'),

  body('benefits')
    .optional()
    .isArray()
    .withMessage('Benefits must be an array'),

  body('applicationDeadline')
    .optional()
    .isISO8601()
    .withMessage('Application deadline must be a valid date')
    .custom((value) => {
      if (new Date(value) <= new Date()) {
        throw new Error('Application deadline must be in the future');
      }
      return true;
    }),
];

export const jobApplicationValidation = [
  body('jobId')
    .isUUID()
    .withMessage('Job ID must be a valid UUID'),

  body('coverLetter')
    .optional()
    .trim()
    .isLength({ min: 50, max: 2000 })
    .withMessage('Cover letter must be between 50 and 2000 characters'),

  body('resumeUrl')
    .optional()
    .isURL()
    .withMessage('Resume URL must be a valid URL'),
];

export const interviewScheduleValidation = [
  body('applicationId')
    .isUUID()
    .withMessage('Application ID must be a valid UUID'),

  body('scheduledDate')
    .isISO8601()
    .withMessage('Scheduled date must be a valid datetime')
    .custom((value) => {
      const scheduledDate = new Date(value);
      const now = new Date();
      const oneHourFromNow = new Date(now.getTime() + 60 * 60 * 1000);

      if (scheduledDate <= oneHourFromNow) {
        throw new Error('Interview must be scheduled at least 1 hour in advance');
      }
      return true;
    }),

  body('duration')
    .optional()
    .isInt({ min: 15, max: 480 })
    .withMessage('Duration must be between 15 and 480 minutes'),

  body('interviewType')
    .optional()
    .isIn(['technical', 'behavioral', 'phone', 'video', 'in-person'])
    .withMessage('Interview type must be one of: technical, behavioral, phone, video, in-person'),

  body('location')
    .optional()
    .trim()
    .isLength({ max: 255 })
    .withMessage('Location must not exceed 255 characters'),

  body('notes')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Notes must not exceed 1000 characters'),
];

export const statusUpdateValidation = [
  body('status')
    .notEmpty()
    .withMessage('Status is required'),
];

export const applicationStatusValidation = [
  body('status')
    .isIn(['applied', 'screening', 'interview', 'hired', 'rejected'])
    .withMessage('Status must be one of: applied, screening, interview, hired, rejected'),
];

export const interviewStatusValidation = [
  body('status')
    .isIn(['scheduled', 'completed', 'cancelled', 'rescheduled'])
    .withMessage('Status must be one of: scheduled, completed, cancelled, rescheduled'),

  body('notes')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Notes must not exceed 1000 characters'),
];

export const documentUploadValidation = [
  body('category')
    .optional()
    .isIn(['resume', 'certificate', 'license', 'contract', 'invoice', 'passport', 'visa', 'insurance', 'other'])
    .withMessage('Category must be one of: resume, certificate, license, contract, invoice, passport, visa, insurance, other'),

  body('isPublic')
    .optional()
    .isBoolean()
    .withMessage('isPublic must be a boolean'),
];

export const documentUpdateValidation = [
  body('category')
    .optional()
    .isIn(['resume', 'certificate', 'license', 'contract', 'invoice', 'passport', 'visa', 'insurance', 'other'])
    .withMessage('Category must be one of: resume, certificate, license, contract, invoice, passport, visa, insurance, other'),

  body('isPublic')
    .optional()
    .isBoolean()
    .withMessage('isPublic must be a boolean'),
];

export const sendMessageValidation = [
  body('recipientId')
    .isUUID()
    .withMessage('Recipient ID must be a valid UUID'),

  body('content')
    .trim()
    .isLength({ min: 1, max: 5000 })
    .withMessage('Content must be between 1 and 5000 characters'),

  body('subject')
    .optional()
    .trim()
    .isLength({ min: 1, max: 255 })
    .withMessage('Subject must be between 1 and 255 characters'),

  body('messageType')
    .optional()
    .isIn(['direct', 'service_request', 'job_application', 'system'])
    .withMessage('Message type must be one of: direct, service_request, job_application, system'),

  body('referenceId')
    .optional()
    .isUUID()
    .withMessage('Reference ID must be a valid UUID'),
];

export const markMessagesAsReadValidation = [
  body('messageIds')
    .isArray()
    .withMessage('Message IDs must be an array'),

  body('messageIds.*')
    .isUUID()
    .withMessage('Each message ID must be a valid UUID'),
];

export const createNotificationValidation = [
  body('userId')
    .isUUID()
    .withMessage('User ID must be a valid UUID'),

  body('title')
    .trim()
    .isLength({ min: 1, max: 255 })
    .withMessage('Title must be between 1 and 255 characters'),

  body('content')
    .trim()
    .isLength({ min: 1, max: 1000 })
    .withMessage('Content must be between 1 and 1000 characters'),

  body('type')
    .isIn(['message', 'application', 'interview', 'payment', 'document', 'system', 'reminder'])
    .withMessage('Type must be one of: message, application, interview, payment, document, system, reminder'),

  body('actionUrl')
    .optional()
    .isURL()
    .withMessage('Action URL must be a valid URL'),
];

export const markNotificationsAsReadValidation = [
  body('notificationIds')
    .isArray()
    .withMessage('Notification IDs must be an array'),

  body('notificationIds.*')
    .isUUID()
    .withMessage('Each notification ID must be a valid UUID'),
];