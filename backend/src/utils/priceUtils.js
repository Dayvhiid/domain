/**
 * Price Utility Functions
 */

/**
 * Format price for display
 * @param {number} amount - Price amount
 * @param {string} currency - Currency code (USD, NGN, ZAR, etc.)
 * @param {object} options - Formatting options
 * @returns {string}
 */
export function formatPrice(amount, currency = 'USD', options = {}) {
  const { 
    minimumFractionDigits = 2, 
    maximumFractionDigits = 2,
    showCurrencySymbol = true,
  } = options;
  
  if (typeof amount !== 'number' || isNaN(amount)) {
    return showCurrencySymbol ? '$0.00' : '0.00';
  }
  
  const formatter = new Intl.NumberFormat('en-US', {
    style: showCurrencySymbol ? 'currency' : 'decimal',
    currency: currency,
    minimumFractionDigits,
    maximumFractionDigits,
  });
  
  return formatter.format(amount);
}

/**
 * Calculate total for multiple years
 * @param {number} yearlyPrice - Price per year
 * @param {number} years - Number of years
 * @returns {number}
 */
export function calculateTotal(yearlyPrice, years) {
  if (typeof yearlyPrice !== 'number' || typeof years !== 'number') return 0;
  return Math.round(yearlyPrice * years * 100) / 100;
}

/**
 * Calculate savings for multi-year registration
 * @param {number} yearlyPrice - Price per year
 * @param {number} years - Number of years
 * @param {number} discountPercent - Discount percentage (e.g., 10 for 10%)
 * @returns {{total: number, savings: number, discountedTotal: number}}
 */
export function calculateMultiYearSavings(yearlyPrice, years, discountPercent = 0) {
  const total = calculateTotal(yearlyPrice, years);
  const savings = Math.round(total * (discountPercent / 100) * 100) / 100;
  const discountedTotal = Math.round((total - savings) * 100) / 100;
  
  return { total, savings, discountedTotal };
}

/**
 * Format price breakdown for display
 * @param {number} registration - Registration price
 * @param {number} renewal - Renewal price
 * @param {number} years - Number of years
 * @param {string} currency - Currency code
 * @returns {object}
 */
export function formatPriceBreakdown(registration, renewal, years = 1, currency = 'USD') {
  const regTotal = calculateTotal(registration, years);
  
  return {
    registration: formatPrice(regTotal, currency),
    registrationPerYear: formatPrice(registration, currency),
    renewal: formatPrice(renewal, currency),
    renewalPerYear: formatPrice(renewal, currency),
    years,
    currency,
  };
}

/**
 * Parse price string to number
 * @param {string} priceStr - Price string (e.g., "$12.99")
 * @returns {number}
 */
export function parsePrice(priceStr) {
  if (typeof priceStr !== 'string') return 0;
  const num = parseFloat(priceStr.replace(/[^0-9.-]/g, ''));
  return isNaN(num) ? 0 : num;
}

/**
 * Round price to 2 decimal places
 * @param {number} price 
 * @returns {number}
 */
export function roundPrice(price) {
  return Math.round(price * 100) / 100;
}

/**
 * Compare prices
 * @param {number} price1 
 * @param {number} price2 
 * @returns {-1|0|1}
 */
export function comparePrices(price1, price2) {
  if (price1 < price2) return -1;
  if (price1 > price2) return 1;
  return 0;
}

export default {
  formatPrice,
  calculateTotal,
  calculateMultiYearSavings,
  formatPriceBreakdown,
  parsePrice,
  roundPrice,
  comparePrices,
};