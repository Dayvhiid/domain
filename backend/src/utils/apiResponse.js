/**
 * Standardized API Response Helpers
 */

/**
 * Success response
 * @param {object} res - Express response object
 * @param {any} data - Response data
 * @param {string} message - Success message
 * @param {number} statusCode - HTTP status code
 * @returns {object}
 */
export function successResponse(res, data, message = 'Success', statusCode = 200) {
  return res.status(statusCode).json({
    success: true,
    message,
    data,
  });
}

/**
 * Error response
 * @param {object} res - Express response object
 * @param {string} message - Error message
 * @param {string} code - Error code
 * @param {number} statusCode - HTTP status code
 * @param {any} details - Additional error details
 * @returns {object}
 */
export function errorResponse(res, message, code = 'ERROR', statusCode = 500, details = null) {
  const response = {
    success: false,
    error: { message, code },
  };
  
  if (details) response.error.details = details;
  
  return res.status(statusCode).json(response);
}

/**
 * Paginated response
 * @param {object} res - Express response object
 * @param {Array} items - Data items
 * @param {number} total - Total count
 * @param {number} limit - Page limit
 * @param {number} offset - Page offset
 * @param {string} message - Success message
 * @returns {object}
 */
export function paginatedResponse(res, items, total, limit, offset, message = 'Success') {
  return res.json({
    success: true,
    message,
    data: {
      items,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + limit < total,
        page: Math.floor(offset / limit) + 1,
        totalPages: Math.ceil(total / limit),
      },
    },
  });
}

/**
 * Created response (201)
 * @param {object} res - Express response object
 * @param {any} data - Created resource
 * @param {string} message - Success message
 * @returns {object}
 */
export function createdResponse(res, data, message = 'Created successfully') {
  return successResponse(res, data, message, 201);
}

/**
 * No content response (204)
 * @param {object} res - Express response object
 * @returns {object}
 */
export function noContentResponse(res) {
  return res.status(204).send();
}

/**
 * Validation error response (400)
 * @param {object} res - Express response object
 * @param {Array} errors - Validation errors
 * @returns {object}
 */
export function validationErrorResponse(res, errors) {
  return res.status(400).json({
    success: false,
    error: {
      message: 'Validation failed',
      code: 'VALIDATION_ERROR',
      details: errors,
    },
  });
}

/**
 * Not found response (404)
 * @param {object} res - Express response object
 * @param {string} resource - Resource name
 * @returns {object}
 */
export function notFoundResponse(res, resource = 'Resource') {
  return errorResponse(res, `${resource} not found`, 'NOT_FOUND', 404);
}

/**
 * Unauthorized response (401)
 * @param {object} res - Express response object
 * @param {string} message - Error message
 * @returns {object}
 */
export function unauthorizedResponse(res, message = 'Unauthorized') {
  return errorResponse(res, message, 'UNAUTHORIZED', 401);
}

/**
 * Forbidden response (403)
 * @param {object} res - Express response object
 * @param {string} message - Error message
 * @returns {object}
 */
export function forbiddenResponse(res, message = 'Forbidden') {
  return errorResponse(res, message, 'FORBIDDEN', 403);
}

/**
 * Conflict response (409)
 * @param {object} res - Express response object
 * @param {string} message - Error message
 * @returns {object}
 */
export function conflictResponse(res, message) {
  return errorResponse(res, message, 'CONFLICT', 409);
}

/**
 * Too many requests response (429)
 * @param {object} res - Express response object
 * @param {string} message - Error message
 * @returns {object}
 */
export function rateLimitResponse(res, message = 'Too many requests') {
  return errorResponse(res, message, 'RATE_LIMIT_EXCEEDED', 429);
}

/**
 * Internal server error response (500)
 * @param {object} res - Express response object
 * @param {string} message - Error message
 * @returns {object}
 */
export function serverErrorResponse(res, message = 'Internal server error') {
  return errorResponse(res, message, 'INTERNAL_ERROR', 500);
}

/**
 * Bad gateway response (502)
 * @param {object} res - Express response object
 * @param {string} message - Error message
 * @returns {object}
 */
export function badGatewayResponse(res, message = 'Bad gateway') {
  return errorResponse(res, message, 'BAD_GATEWAY', 502);
}

/**
 * Service unavailable response (503)
 * @param {object} res - Express response object
 * @param {string} message - Error message
 * @returns {object}
 */
export function serviceUnavailableResponse(res, message = 'Service unavailable') {
  return errorResponse(res, message, 'SERVICE_UNAVAILABLE', 503);
}

export default {
  successResponse,
  errorResponse,
  paginatedResponse,
  createdResponse,
  noContentResponse,
  validationErrorResponse,
  notFoundResponse,
  unauthorizedResponse,
  forbiddenResponse,
  conflictResponse,
  rateLimitResponse,
  serverErrorResponse,
  badGatewayResponse,
  serviceUnavailableResponse,
};