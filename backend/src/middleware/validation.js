import { z } from 'zod';

/**
 * Request validation middleware using Zod schemas
 */
export function validateRequest(schema) {
  return (req, res, next) => {
    try {
      schema.parse(req);
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          success: false,
          error: {
            message: 'Validation failed',
            code: 'VALIDATION_ERROR',
            details: error.errors.map(e => ({
              field: e.path.join('.'),
              message: e.message,
            })),
          },
        });
      }
      next(error);
    }
  };
}

/**
 * Validate request body
 */
export function validateBody(schema) {
  return validateRequest(z.object({ body: schema }));
}

/**
 * Validate request query
 */
export function validateQuery(schema) {
  return validateRequest(z.object({ query: schema }));
}

/**
 * Validate request params
 */
export function validateParams(schema) {
  return validateRequest(z.object({ params: schema }));
}

/**
 * Sanitize input - remove undefined/null values
 */
export function sanitizeInput(req, res, next) {
  const sanitize = (obj) => {
    if (obj === null || obj === undefined) return obj;
    if (typeof obj !== 'object') return obj;
    if (Array.isArray(obj)) return obj.map(sanitize);
    
    const sanitized = {};
    for (const [key, value] of Object.entries(obj)) {
      if (value !== undefined && value !== null) {
        sanitized[key] = sanitize(value);
      }
    }
    return sanitized;
  };
  
  req.body = sanitize(req.body);
  req.query = sanitize(req.query);
  next();
}

/**
 * Validate MongoDB ObjectId
 */
export function validateObjectId(paramName = 'id') {
  return (req, res, next) => {
    const id = req.params[paramName];
    if (!id || !/^[0-9a-fA-F]{24}$/.test(id)) {
      return res.status(400).json({
        success: false,
        error: { message: `Invalid ${paramName}`, code: 'INVALID_ID' },
      });
    }
    next();
  };
}

export default {
  validateRequest,
  validateBody,
  validateQuery,
  validateParams,
  sanitizeInput,
  validateObjectId,
};