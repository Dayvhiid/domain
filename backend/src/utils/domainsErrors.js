/**
 * Domains.co.za API Error Mapper
 * Maps intReturnCode to AppError instances with appropriate HTTP status codes
 */

import { AppError } from '../middleware/errorHandler.js';

const ERROR_MAP = {
  0:  { code: 'DOMAIN_NOT_AVAILABLE', status: 400, message: 'Domain is not available' },
  2:  { code: 'ACTION_QUEUED', status: 202, message: 'Action queued for processing' },
  4:  { code: 'NOT_PENDING', status: 200, message: 'Item is not pending action' },
  6:  { code: 'INVALID_CREDENTIALS', status: 401, message: 'Invalid login credentials' },
  7:  { code: 'NO_ACCESS', status: 403, message: 'No access to this domain or contact' },
  8:  { code: 'ASSOCIATION_PROHIBITED', status: 403, message: 'Association prohibits this operation' },
  9:  { code: 'REGISTRY_ERROR', status: 500, message: 'Unknown registry error' },
  10: { code: 'MISSING_PARAMETER', status: 400, message: 'Missing required parameter' },
  11: { code: 'NOT_FOUND', status: 404, message: 'Item does not exist' },
  12: { code: 'STATUS_PROHIBITS', status: 409, message: 'Domain status prohibits this operation' },
  13: { code: 'ALREADY_EXISTS', status: 409, message: 'Item already exists' },
  14: { code: 'SYNTAX_ERROR', status: 400, message: 'Command syntax error' },
  15: { code: 'UNKNOWN_COMMAND', status: 400, message: 'Unknown command' },
  16: { code: 'DATABASE_ERROR', status: 503, message: 'Database call failed, please retry' },
  17: { code: 'INTERNAL_ERROR', status: 500, message: 'Internal error, please retry' },
  18: { code: 'CONNECTION_REFUSED', status: 503, message: 'Connection refused by registry' },
  19: { code: 'INSUFFICIENT_CREDITS', status: 402, message: 'Insufficient credits for this operation' },
  20: { code: 'REQUEST_TIMEOUT', status: 504, message: 'Request timed out, please retry' },
  22: { code: 'PROVIDER_UNAVAILABLE', status: 503, message: 'Connection failed to provider' },
};

const RETRYABLE_CODES = new Set([16, 17, 18, 20, 22]);

/**
 * Map a Domains.co.za API response to an AppError if it indicates failure
 * @param {object} data - The API response
 * @param {string} context - Description of the operation for error messages
 * @returns {AppError|null} - AppError if response indicates failure, null if success
 */
export function mapDomainsError(data, context = 'Domain operation') {
  if (!data || data.intReturnCode === undefined) {
    return null;
  }

  const code = data.intReturnCode;

  // 1 = success, 2 = queued/pending (both are OK)
  if (code === 1 || code === 2) {
    return null;
  }

  const errorDef = ERROR_MAP[code];
  if (!errorDef) {
    return AppError.internal(`${context}: Unknown return code ${code} - ${data.strMessage}`);
  }

  const error = new AppError(errorDef.message, errorDef.code, errorDef.status);
  error.strUUID = data.strUUID;
  error.strApiHost = data.strApiHost;
  error.retryable = RETRYABLE_CODES.has(code);

  return error;
}

/**
 * Check if a Domains.co.za response indicates success (returnCode 1 or 2)
 */
export function isDomainsSuccess(data) {
  return data && (data.intReturnCode === 1 || data.intReturnCode === 2);
}

/**
 * Check if a response is queued/pending (returnCode 2)
 */
export function isDomainsPending(data) {
  return data && data.intReturnCode === 2;
}

export default { mapDomainsError, isDomainsSuccess, isDomainsPending };
