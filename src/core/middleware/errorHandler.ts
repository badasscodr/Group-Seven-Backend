import { Request, Response, NextFunction } from 'express';

export interface AppError extends Error {
  statusCode?: number;
  isOperational?: boolean;
  details?: any;
  field?: string;
}

/**
 * Categorize error based on status code
 */
function categorizeError(statusCode: number): { code: string; message: string } {
  const errorCategories: Record<number, { code: string; message: string }> = {
    400: {
      code: 'VALIDATION_ERROR',
      message: 'The data provided is invalid. Please check your input.',
    },
    401: {
      code: 'AUTHENTICATION_ERROR',
      message: 'Your session has expired. Please login again.',
    },
    403: {
      code: 'AUTHORIZATION_ERROR',
      message: 'You don\'t have permission to perform this action.',
    },
    404: {
      code: 'NOT_FOUND',
      message: 'The requested resource was not found.',
    },
    409: {
      code: 'CONFLICT_ERROR',
      message: 'This resource already exists or conflicts with existing data.',
    },
    422: {
      code: 'UNPROCESSABLE_ENTITY',
      message: 'The data provided cannot be processed.',
    },
    429: {
      code: 'RATE_LIMIT_EXCEEDED',
      message: 'Too many requests. Please try again later.',
    },
    500: {
      code: 'INTERNAL_SERVER_ERROR',
      message: 'An unexpected server error occurred. Please try again later.',
    },
    502: {
      code: 'BAD_GATEWAY',
      message: 'The server is temporarily unavailable. Please try again later.',
    },
    503: {
      code: 'SERVICE_UNAVAILABLE',
      message: 'Service is temporarily unavailable. Please try again later.',
    },
  };

  return errorCategories[statusCode] || {
    code: 'UNKNOWN_ERROR',
    message: 'An unexpected error occurred.',
  };
}

/**
 * Enhanced error handler middleware with proper categorization and user-friendly messages
 */
export const errorHandler = (
  err: AppError,
  req: Request,
  res: Response,
  _next: NextFunction
): void => {
  const statusCode = err.statusCode || 500;
  const isDevelopment = process.env.NODE_ENV === 'development';

  // Get error category and default message
  const { code: errorCode, message: defaultMessage } = categorizeError(statusCode);

  // Use custom error message if provided, otherwise use default
  const userMessage = err.message || defaultMessage;

  // Log detailed error for debugging
  console.error(`[${errorCode}] ${statusCode}: ${err.message}`);
  if (isDevelopment) {
    console.error('Error Stack:', err.stack);
    console.error('Request Details:', {
      method: req.method,
      url: req.url,
      body: req.body,
      params: req.params,
      query: req.query,
    });
  }

  // Construct error response
  const errorResponse: any = {
    success: false,
    error: {
      code: errorCode,
      message: userMessage,
      statusCode,
    },
    timestamp: new Date().toISOString(),
  };

  // Add additional details in development mode or for validation errors
  if (isDevelopment || statusCode === 400 || statusCode === 422) {
    if (err.details) {
      errorResponse.error.details = err.details;
    }
    if (err.field) {
      errorResponse.error.field = err.field;
    }
    // In development, include stack trace
    if (isDevelopment) {
      errorResponse.error.stack = err.stack;
    }
  }

  // Send error response
  res.status(statusCode).json(errorResponse);
};

/**
 * Create a custom error with additional properties
 */
export class CustomError extends Error implements AppError {
  statusCode: number;
  isOperational: boolean;
  details?: any;
  field?: string;

  constructor(
    message: string,
    statusCode: number = 500,
    details?: any,
    field?: string
  ) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
    this.details = details;
    this.field = field;

    // Maintains proper stack trace for where our error was thrown
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Helper functions to create specific error types
 */
export const createValidationError = (message: string, details?: any, field?: string) =>
  new CustomError(message, 400, details, field);

export const createAuthError = (message: string = 'Authentication failed') =>
  new CustomError(message, 401);

export const createForbiddenError = (message: string = 'Access forbidden') =>
  new CustomError(message, 403);

export const createNotFoundError = (message: string = 'Resource not found') =>
  new CustomError(message, 404);

export const createConflictError = (message: string, details?: any) =>
  new CustomError(message, 409, details);