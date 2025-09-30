import { Request, Response, NextFunction } from 'express';

/**
 * Transform snake_case keys to camelCase recursively
 * @param obj - Object or array to transform
 * @returns Transformed object with camelCase keys
 */
export function snakeToCamel(obj: any): any {
  // Handle null and undefined
  if (obj === null || obj === undefined) {
    return obj;
  }

  // Handle arrays
  if (Array.isArray(obj)) {
    return obj.map(snakeToCamel);
  }

  // Handle Date objects
  if (obj instanceof Date) {
    return obj;
  }

  // Handle plain objects
  if (obj !== null && typeof obj === 'object' && obj.constructor === Object) {
    return Object.keys(obj).reduce((acc: any, key: string) => {
      // Convert snake_case to camelCase
      const camelKey = key.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());

      // Recursively transform nested objects
      acc[camelKey] = snakeToCamel(obj[key]);

      return acc;
    }, {});
  }

  // Return primitives and other types as-is
  return obj;
}

/**
 * Transform camelCase keys to snake_case recursively
 * @param obj - Object or array to transform
 * @returns Transformed object with snake_case keys
 */
export function camelToSnake(obj: any): any {
  // Handle null and undefined
  if (obj === null || obj === undefined) {
    return obj;
  }

  // Handle arrays
  if (Array.isArray(obj)) {
    return obj.map(camelToSnake);
  }

  // Handle Date objects
  if (obj instanceof Date) {
    return obj;
  }

  // Handle plain objects
  if (obj !== null && typeof obj === 'object' && obj.constructor === Object) {
    return Object.keys(obj).reduce((acc: any, key: string) => {
      // Convert camelCase to snake_case
      const snakeKey = key.replace(/([A-Z])/g, '_$1').toLowerCase();

      // Recursively transform nested objects
      acc[snakeKey] = camelToSnake(obj[key]);

      return acc;
    }, {});
  }

  // Return primitives and other types as-is
  return obj;
}

/**
 * Middleware to transform response data from snake_case to camelCase
 * This ensures frontend receives data in JavaScript convention (camelCase)
 * while database uses SQL convention (snake_case)
 */
export const responseTransformer = (
  _req: Request,
  res: Response,
  next: NextFunction
): void => {
  // Store original json method
  const originalJson = res.json.bind(res);

  // Override res.json to transform response data
  res.json = function (data: any): Response {
    // Skip transformation for error responses with specific structure
    if (data && typeof data === 'object') {
      const transformed: any = {
        ...data,
      };

      // Transform specific fields that contain user/data objects
      if (data.data) {
        transformed.data = snakeToCamel(data.data);
      }

      if (data.user) {
        transformed.user = snakeToCamel(data.user);
      }

      if (data.users) {
        transformed.users = snakeToCamel(data.users);
      }

      if (data.serviceRequests) {
        transformed.serviceRequests = snakeToCamel(data.serviceRequests);
      }

      if (data.quotations) {
        transformed.quotations = snakeToCamel(data.quotations);
      }

      // Transform any array at root level
      Object.keys(data).forEach((key) => {
        if (Array.isArray(data[key]) && !transformed[key]) {
          transformed[key] = snakeToCamel(data[key]);
        }
      });

      return originalJson(transformed);
    }

    return originalJson(data);
  };

  next();
};

/**
 * Middleware to transform request body from camelCase to snake_case
 * This allows frontend to send camelCase data while backend processes snake_case
 */
export const requestTransformer = (
  req: Request,
  _res: Response,
  next: NextFunction
): void => {
  if (req.body && typeof req.body === 'object') {
    // Transform request body to snake_case for database operations
    req.body = camelToSnake(req.body);
  }

  next();
};