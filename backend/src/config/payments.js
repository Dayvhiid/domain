/**
 * Payment Providers Configuration
 * Supports Paystack, Flutterwave, and Payfast
 * v1: Config only - webhooks and processing in v2
 */

export const paymentConfig = {
  // Default currency
  defaultCurrency: 'USD',
  supportedCurrencies: ['USD', 'NGN', 'ZAR', 'GHS', 'KES', 'EUR', 'GBP'],
  
  // Paystack (Nigeria, Ghana, South Africa, Kenya)
  paystack: {
    enabled: !!process.env.PAYSTACK_SECRET_KEY,
    secretKey: process.env.PAYSTACK_SECRET_KEY,
    publicKey: process.env.PAYSTACK_PUBLIC_KEY,
    webhookSecret: process.env.PAYSTACK_WEBHOOK_SECRET,
    baseURL: 'https://api.paystack.co',
    // Supported currencies: NGN, GHS, ZAR, KES, USD
    supportedCurrencies: ['NGN', 'GHS', 'ZAR', 'KES', 'USD'],
    // Test mode uses test keys
    testMode: process.env.PAYSTACK_SECRET_KEY?.startsWith('sk_test_') ?? true,
  },
  
  // Flutterwave (Nigeria, Ghana, Kenya, Uganda, Tanzania, South Africa, Europe, UK, US)
  flutterwave: {
    enabled: !!process.env.FLUTTERWAVE_SECRET_KEY,
    secretKey: process.env.FLUTTERWAVE_SECRET_KEY,
    publicKey: process.env.FLUTTERWAVE_PUBLIC_KEY,
    webhookSecret: process.env.FLUTTERWAVE_WEBHOOK_SECRET,
    encryptionKey: process.env.FLUTTERWAVE_ENCRYPTION_KEY,
    baseURL: 'https://api.flutterwave.com/v3',
    // Supported currencies: NGN, GHS, KES, UGX, TZS, ZAR, USD, EUR, GBP
    supportedCurrencies: ['NGN', 'GHS', 'KES', 'UGX', 'TZS', 'ZAR', 'USD', 'EUR', 'GBP'],
    testMode: process.env.FLUTTERWAVE_SECRET_KEY?.includes('TEST') ?? true,
  },
  
  // Payfast (South Africa)
  payfast: {
    enabled: !!process.env.PAYFAST_MERCHANT_ID,
    merchantId: process.env.PAYFAST_MERCHANT_ID,
    merchantKey: process.env.PAYFAST_MERCHANT_KEY,
    passphrase: process.env.PAYFAST_PASSPHRASE,
    sandbox: process.env.PAYFAST_SANDBOX === 'true',
    webhookSecret: process.env.PAYFAST_WEBHOOK_SECRET,
    baseURL: process.env.PAYFAST_SANDBOX === 'true' 
      ? 'https://sandbox.payfast.co.za' 
      : 'https://www.payfast.co.za',
    // Supported currencies: ZAR
    supportedCurrencies: ['ZAR'],
  },
};

/**
 * Get enabled payment providers
 */
export function getEnabledProviders() {
  return Object.entries(paymentConfig)
    .filter(([key, config]) => key !== 'defaultCurrency' && key !== 'supportedCurrencies' && config.enabled)
    .map(([key, config]) => ({
      id: key,
      name: key.charAt(0).toUpperCase() + key.slice(1),
      supportedCurrencies: config.supportedCurrencies,
      testMode: config.testMode,
    }));
}

/**
 * Get provider config by ID
 */
export function getProviderConfig(providerId) {
  const config = paymentConfig[providerId];
  if (!config) {
    throw new Error(`Unknown payment provider: ${providerId}`);
  }
  return config;
}

/**
 * Check if provider supports currency
 */
export function providerSupportsCurrency(providerId, currency) {
  const config = paymentConfig[providerId];
  if (!config || !config.enabled) return false;
  return config.supportedCurrencies.includes(currency.toUpperCase());
}

export default paymentConfig;