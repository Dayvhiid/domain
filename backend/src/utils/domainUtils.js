/**
 * Domain Utility Functions
 */

/**
 * Parse domain into SLD and TLD
 * @param {string} input - Domain input (e.g., "example.com" or "example")
 * @returns {{sld: string|null, tld: string|null}}
 */
export function parseDomain(input) {
  if (!input || typeof input !== 'string') {
    return { sld: null, tld: null };
  }
  
  const raw = input.trim().toLowerCase();
  if (!raw) return { sld: null, tld: null };
  
  if (raw.includes('.')) {
    const idx = raw.lastIndexOf('.');
    return { 
      sld: raw.slice(0, idx), 
      tld: raw.slice(idx) 
    };
  }
  
  return { sld: raw, tld: '.com' };
}

/**
 * Validate domain name format
 * @param {string} domain - Full domain name
 * @returns {boolean}
 */
export function isValidDomain(domain) {
  if (!domain || typeof domain !== 'string') return false;
  
  const { sld, tld } = parseDomain(domain);
  if (!sld || !tld) return false;
  
  // SLD validation: alphanumeric and hyphens, not starting/ending with hyphen
  const sldRegex = /^[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?$/i;
  if (!sldRegex.test(sld)) return false;
  
  // TLD validation: starts with dot, alphanumeric and hyphens
  const tldRegex = /^\.[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?$/i;
  if (!tldRegex.test(tld)) return false;
  
  // Total length check
  if (domain.length > 253) return false;
  
  return true;
}

/**
 * Normalize domain to lowercase
 * @param {string} domain 
 * @returns {string}
 */
export function normalizeDomain(domain) {
  return domain?.toLowerCase().trim() || '';
}

/**
 * Extract SLD from full domain
 * @param {string} domain 
 * @returns {string|null}
 */
export function getSLD(domain) {
  const { sld } = parseDomain(domain);
  return sld;
}

/**
 * Extract TLD from full domain
 * @param {string} domain 
 * @returns {string|null}
 */
export function getTLD(domain) {
  const { tld } = parseDomain(domain);
  return tld;
}

/**
 * Check if domain is premium (placeholder - would check against premium list)
 * @param {string} sld 
 * @returns {boolean}
 */
export function isPremiumSLD(sld) {
  const premiumKeywords = ['premium', 'vip', 'gold', 'platinum', 'diamond'];
  return premiumKeywords.some(kw => sld.includes(kw));
}

/**
 * Generate domain suggestions based on keyword
 * @param {string} keyword 
 * @param {string[]} tlds 
 * @returns {string[]}
 */
export function generateSuggestions(keyword, tlds = ['.com', '.net', '.org', '.io', '.co']) {
  const cleanKeyword = keyword.replace(/[^a-z0-9]/gi, '').toLowerCase();
  if (!cleanKeyword) return [];
  
  const suggestions = [];
  const prefixes = ['get', 'my', 'try', 'go', 'the', 'use', 'app'];
  const suffixes = ['hub', 'ly', 'hq', 'online', 'app', 'site', 'io', 'co'];
  
  // Prefix suggestions
  for (const prefix of prefixes) {
    suggestions.push(`${prefix}${cleanKeyword}`);
  }
  
  // Suffix suggestions
  for (const suffix of suffixes) {
    suggestions.push(`${cleanKeyword}${suffix}`);
  }
  
  // TLD variations
  for (const tld of tlds) {
    if (!suggestions.some(s => s.endsWith(tld))) {
      suggestions.push(`${cleanKeyword}${tld}`);
    }
  }
  
  return [...new Set(suggestions)].slice(0, 20);
}

/**
 * Check if domain is likely a subdomain
 * @param {string} domain 
 * @returns {boolean}
 */
export function isSubdomain(domain) {
  const parts = domain.split('.');
  return parts.length > 2;
}

/**
 * Get root domain from subdomain
 * @param {string} domain 
 * @returns {string}
 */
export function getRootDomain(domain) {
  const parts = domain.split('.');
  if (parts.length <= 2) return domain;
  return parts.slice(-2).join('.');
}

export default {
  parseDomain,
  isValidDomain,
  normalizeDomain,
  getSLD,
  getTLD,
  isPremiumSLD,
  generateSuggestions,
  isSubdomain,
  getRootDomain,
};