/**
 * Domains.co.za API Configuration
 */

export const domainsCozaConfig = {
  baseURL: process.env.DOMAINS_API_URL || 'https://api.domains.co.za/api',
  username: process.env.DOMAINS_USERNAME,
  password: process.env.DOMAINS_PASSWORD,

  tokenRefreshBuffer: 5 * 60 * 1000,

  retry: {
    maxRetries: 3,
    baseDelay: 1000,
    maxDelay: 10000,
    retryableStatuses: [408, 429, 500, 502, 503, 504],
  },

  timeout: 30000,
};

export function validateDomainsCozaConfig() {
  const required = ['username', 'password', 'baseURL'];
  const missing = required.filter(key => !domainsCozaConfig[key]);

  if (missing.length > 0) {
    throw new Error(`Domains.co.za configuration missing: ${missing.join(', ')}`);
  }

  return true;
}

export default domainsCozaConfig;
