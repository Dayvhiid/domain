/**
 * Utils Index - Export all utilities
 */

export * from './domainUtils.js';
export * from './priceUtils.js';
export * from './apiResponse.js';
export * from './domainsErrors.js';

import * as domainUtils from './domainUtils.js';
import * as priceUtils from './priceUtils.js';
import * as apiResponse from './apiResponse.js';
import * as domainsErrors from './domainsErrors.js';

export default {
  ...domainUtils,
  ...priceUtils,
  ...apiResponse,
  ...domainsErrors,
};