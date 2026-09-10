/**
 * Utils Index - Export all utilities
 */

export * from './domainUtils.js';
export * from './priceUtils.js';
export * from './apiResponse.js';
export * from './domainsErrors.js';

export default {
  // domainUtils
  parseDomain: null,
  isValidDomain: null,
  normalizeDomain: null,
  getSLD: null,
  getTLD: null,
  isPremiumSLD: null,
  generateSuggestions: null,
  isSubdomain: null,
  getRootDomain: null,
  
  // priceUtils
  formatPrice: null,
  calculateTotal: null,
  calculateMultiYearSavings: null,
  formatPriceBreakdown: null,
  parsePrice: null,
  roundPrice: null,
  comparePrices: null,
  
  // apiResponse
  successResponse: null,
  errorResponse: null,
  paginatedResponse: null,
  createdResponse: null,
  noContentResponse: null,
  validationErrorResponse: null,
  notFoundResponse: null,
  unauthorizedResponse: null,
  forbiddenResponse: null,
  conflictResponse: null,
  rateLimitResponse: null,
  serverErrorResponse: null,
  badGatewayResponse: null,
  serviceUnavailableResponse: null,
};