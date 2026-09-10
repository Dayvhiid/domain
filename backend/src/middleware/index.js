/**
 * Middleware Index - Export all middleware
 */

export { requireAuth, optionalAuth, requireAdmin, requireReseller, validateOwnership } from './auth.js';
export { validateRequest, validateBody, validateQuery, validateParams, sanitizeInput, validateObjectId } from './validation.js';
export { errorHandler, notFoundHandler, asyncHandler, AppError } from './errorHandler.js';
export { apiLimiter, authLimiter, domainCheckLimiter, paymentLimiter, createRateLimiter } from './rateLimiter.js';

export default {
  requireAuth,
  optionalAuth,
  requireAdmin,
  requireReseller,
  validateOwnership,
  validateRequest,
  validateBody,
  validateQuery,
  validateParams,
  sanitizeInput,
  validateObjectId,
  errorHandler,
  notFoundHandler,
  asyncHandler,
  AppError,
  apiLimiter,
  authLimiter,
  domainCheckLimiter,
  paymentLimiter,
  createRateLimiter,
};
