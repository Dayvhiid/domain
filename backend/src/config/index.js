/**
 * Main Configuration Entry Point
 * Exports all configuration modules
 */

import { connectDB, getConnectionStatus, disconnectDB } from './database.js';
import { domainsCozaConfig, validateDomainsCozaConfig } from './domainscoza.js';
import { paymentConfig, getEnabledProviders, getProviderConfig, providerSupportsCurrency } from './payments.js';

export { connectDB, getConnectionStatus, disconnectDB };
export { domainsCozaConfig, validateDomainsCozaConfig };
export { paymentConfig, getEnabledProviders, getProviderConfig, providerSupportsCurrency };

/**
 * Application-wide constants
 */
export const APP_CONFIG = {
  name: 'Domain Reseller Platform',
  version: '1.0.0',
  apiPrefix: '/api/v1',
  
  // Pagination defaults
  pagination: {
    defaultLimit: 20,
    maxLimit: 100,
    defaultOffset: 0,
  },
  
  // Domain operations
  domain: {
    maxYears: 10,
    minYears: 1,
    defaultYears: 1,
    operations: ['register', 'transfer', 'renew', 'restore'],
    statuses: [
      'active',
      'pending',
      'expired',
      'suspended',
      'deleted',
      'transfer_pending',
      'transfer_completed',
      'redemption_period',
      'pending_delete',
    ],
  },
  
  // Cart
  cart: {
    maxItems: 50,
    itemTTL: 30 * 24 * 60 * 60 * 1000, // 30 days
  },
  
  // Order
  order: {
    statuses: [
      'pending',
      'payment_initiated',
      'paid',
      'provisioning',
      'completed',
      'failed',
      'cancelled',
      'refunded',
    ],
    paymentProviders: ['paystack', 'flutterwave', 'payfast'],
  },
  
  // User roles
  userRoles: ['user', 'admin', 'reseller'],
  
  // Contact types
  contactTypes: ['registrant', 'admin', 'tech', 'billing'],
  
  // Nameserver
  nameserver: {
    maxHosts: 13,
    minHosts: 1,
  },
};

/**
 * Validate all required environment variables
 */
export function validateConfig() {
  const required = [
    'MONGODB_URI',
    'SESSION_SECRET',
    'DOMAINS_USERNAME',
    'DOMAINS_PASSWORD',
    'DOMAINS_API_URL',
  ];
  
  const missing = required.filter(key => !process.env[key]);
  
  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }
  
  validateDomainsCozaConfig();
  
  console.log('Configuration validated successfully');
  return true;
}

export default {
  connectDB,
  getConnectionStatus,
  disconnectDB,
  domainsCozaConfig,
  validateDomainsCozaConfig,
  paymentConfig,
  getEnabledProviders,
  getProviderConfig,
  providerSupportsCurrency,
  APP_CONFIG,
  validateConfig,
};
