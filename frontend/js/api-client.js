/**
 * Real API Client - Replaces MockAPI
 * Same interface, but makes real fetch calls to backend
 */

const API_BASE = (typeof import.meta !== 'undefined' && import.meta.env?.VITE_API_BASE_URL) 
  || '/api/v1';

class ApiError extends Error {
  constructor(message, code, status, details) {
    super(message);
    this.name = 'ApiError';
    this.code = code;
    this.status = status;
    this.details = details;
  }
}

async function apiRequest(endpoint, options = {}) {
  const url = `${API_BASE}${endpoint}`;
  
  const res = await fetch(url, {
    credentials: 'include', // Critical for session cookies
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  });

  const contentType = res.headers.get('content-type');
  const isJson = contentType?.includes('application/json');
  const data = isJson ? await res.json() : await res.text();

  if (!res.ok) {
    const message = (data && data.error?.message) || data || res.statusText;
    const code = (data && data.error?.code) || 'API_ERROR';
    throw new ApiError(message, code, res.status, data?.error?.details);
  }

  return data;
}

/**
 * Parse domain input into SLD and TLD
 */
function parseDomain(input) {
  if (!input || typeof input !== 'string') return null;
  const raw = input.trim().toLowerCase().replace(/^\./, '');
  if (!raw) return null;
  
  if (raw.includes('.')) {
    // Handle multi-part TLDs (co.za, com.au, org.za, etc.)
    const multiPartTlds = ['co.za', 'org.za', 'net.za', 'gov.za', 'ac.za', 'co.uk', 'co.nz', 'co.in', 'co.jp', 'co.kr', 'com.au', 'com.br', 'com.mx', 'com.sg', 'com.tw'];
    for (const tld of multiPartTlds) {
      if (raw.endsWith('.' + tld)) {
        const sld = raw.slice(0, -(tld.length + 1));
        if (sld) return { sld, tld: '.' + tld };
      }
    }
    const idx = raw.lastIndexOf('.');
    return { sld: raw.slice(0, idx), tld: raw.slice(idx) };
  }
  return { sld: raw, tld: null };
}

/**
 * Search domain with alternatives and suggestions
 * Matches MockAPI.searchDomain() interface
 */
async function searchDomain(query) {
  const parsed = parseDomain(query);
  if (!parsed || !parsed.sld) throw new Error('Invalid domain');
  
  const cleanSld = parsed.sld.replace(/[^a-z0-9-]/g, '').slice(0, 63);
  if (!cleanSld) throw new Error('Invalid domain name');
  
  const requestedTld = parsed.tld || '.com';
  
  const data = await apiRequest(`/domains/search?domain=${encodeURIComponent(cleanSld + requestedTld)}`);
  
  const result = data.data || data;
  
  // Flatten pricing for frontend compatibility
  const flatten = (item) => {
    if (!item) return item;
    return {
      ...item,
      registration: item.pricing?.registration || 0,
      renewal: item.pricing?.renewal || 0,
      transfer: item.pricing?.transfer || 0,
      currency: item.pricing?.currency || 'ZAR',
    };
  };
  
  return {
    primary: flatten(result.primary || {}),
    alternatives: (result.alternatives || []).map(flatten),
    suggestions: (result.suggestions || []).map(flatten),
  };
}

/**
 * Get all TLD pricing
 * Matches MockAPI.getPricing() interface
 */
async function getPricing() {
  const data = await apiRequest('/domains/pricing');
  // Backend returns { prices: [...] } or array directly
  return data.data?.prices || data.data || data;
}

/**
 * WHOIS lookup
 * Matches MockAPI.whoisLookup() interface
 */
async function whoisLookup(domain) {
  const parsed = parseDomain(domain);
  if (!parsed) throw new Error('Invalid domain');
  
  const fullDomain = parsed.tld ? `${parsed.sld}${parsed.tld}` : `${parsed.sld}.com`;
  
  const data = await apiRequest('/domains/whois', {
    method: 'POST',
    body: JSON.stringify({ domain: fullDomain }),
  });
  
  return data.data || data;
}

/**
 * Calculate total price
 */
function calculateTotal(registration, years) {
  return +(registration * years).toFixed(2);
}

/**
 * Auth API
 */
const authApi = {
  async register(userData) {
    const data = await apiRequest('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
    return data.data;
  },

  async login(email, password) {
    const data = await apiRequest('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    return data.data;
  },

  async logout() {
    const data = await apiRequest('/auth/logout', { method: 'POST' });
    return data;
  },

  async getMe() {
    const data = await apiRequest('/auth/me');
    return data.data;
  },

  async updateProfile(updates) {
    const data = await apiRequest('/auth/profile', {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
    return data.data;
  },

  async changePassword(currentPassword, newPassword) {
    const data = await apiRequest('/auth/password', {
      method: 'PUT',
      body: JSON.stringify({ currentPassword, newPassword }),
    });
    return data;
  },

  async getMe() {
    const data = await apiRequest('/auth/me');
    return data.data;
  },
};

/**
 * Cart API
 */
const cartApi = {
  async getCart() {
    const data = await apiRequest('/cart');
    return data.data;
  },

  async addItem(item) {
    const data = await apiRequest('/cart/items', {
      method: 'POST',
      body: JSON.stringify(item),
    });
    return data.data;
  },

  async removeItem(domainName) {
    const data = await apiRequest(`/cart/items/${encodeURIComponent(domainName)}`, {
      method: 'DELETE',
    });
    return data.data;
  },

  async updateItemYears(domainName, years) {
    const data = await apiRequest(`/cart/items/${encodeURIComponent(domainName)}/years`, {
      method: 'PUT',
      body: JSON.stringify({ years }),
    });
    return data.data;
  },

  async updateItemOptions(domainName, options) {
    const data = await apiRequest(`/cart/items/${encodeURIComponent(domainName)}/options`, {
      method: 'PUT',
      body: JSON.stringify(options),
    });
    return data.data;
  },

  async clearCart() {
    const data = await apiRequest('/cart', { method: 'DELETE' });
    return data.data;
  },

  async applyCoupon(couponData) {
    const data = await apiRequest('/cart/coupon', {
      method: 'POST',
      body: JSON.stringify(couponData),
    });
    return data.data;
  },

  async removeCoupon() {
    const data = await apiRequest('/cart/coupon', { method: 'DELETE' });
    return data.data;
  },

  async getCheckoutSummary() {
    const data = await apiRequest('/cart/checkout-summary');
    return data.data;
  },
};

/**
 * Orders API
 */
const ordersApi = {
  async createOrder(paymentProvider = 'manual') {
    const data = await apiRequest('/orders', {
      method: 'POST',
      body: JSON.stringify({ paymentProvider }),
    });
    return data.data;
  },

  async listOrders(filters = {}) {
    const params = new URLSearchParams(filters).toString();
    const data = await apiRequest(`/orders?${params}`);
    return data.data;
  },

  async getOrder(id) {
    const data = await apiRequest(`/orders/${id}`);
    return data.data;
  },

  async getOrderByNumber(orderNumber) {
    const data = await apiRequest(`/orders/number/${orderNumber}`);
    return data.data;
  },

  async initiatePayment(id) {
    const data = await apiRequest(`/orders/${id}/pay`, { method: 'POST' });
    return data.data;
  },

  async cancelOrder(id, reason) {
    const data = await apiRequest(`/orders/${id}/cancel`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    });
    return data.data;
  },
};

/**
 * Users API
 */
const usersApi = {
  async getDashboard() {
    const data = await apiRequest('/users/dashboard');
    return data.data;
  },

  async getProfile() {
    const data = await apiRequest('/users/profile');
    return data.data;
  },

  async updateProfile(updates) {
    const data = await apiRequest('/users/profile', {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
    return data.data;
  },

  async changePassword(currentPassword, newPassword) {
    const data = await apiRequest('/users/password', {
      method: 'PUT',
      body: JSON.stringify({ currentPassword, newPassword }),
    });
    return data;
  },

  async listDomains(filters = {}) {
    const params = new URLSearchParams(filters).toString();
    const data = await apiRequest(`/users/domains?${params}`);
    return data.data;
  },

  async listOrders(filters = {}) {
    const params = new URLSearchParams(filters).toString();
    const data = await apiRequest(`/users/orders?${params}`);
    return data.data;
  },

  async listInvoices(filters = {}) {
    const params = new URLSearchParams(filters).toString();
    const data = await apiRequest(`/users/invoices?${params}`);
    return data.data;
  },
};

/**
 * Domains API
 */
const domainsApi = {
  async checkDomain(domain, operation = 'register', period = 1) {
    const data = await apiRequest('/domains/check', {
      method: 'POST',
      body: JSON.stringify({ domain, operation, period }),
    });
    return data.data;
  },

  async getPricing(domain, operation = 'register', period = 1) {
    const params = new URLSearchParams({ domain, operation, period: String(period) }).toString();
    const data = await apiRequest(`/domains/pricing?${params}`);
    return data.data;
  },

  async registerDomain(domainData) {
    const data = await apiRequest('/domains/register', {
      method: 'POST',
      body: JSON.stringify(domainData),
    });
    return data.data;
  },

  async transferDomain(transferData) {
    const data = await apiRequest('/domains/transfer', {
      method: 'POST',
      body: JSON.stringify(transferData),
    });
    return data.data;
  },

  async renewDomain(id, years = 1) {
    const data = await apiRequest(`/domains/${id}/renew`, {
      method: 'POST',
      body: JSON.stringify({ years }),
    });
    return data.data;
  },

  async getDomain(id, fresh = false) {
    const data = await apiRequest(`/domains/${id}${fresh ? '?fresh=true' : ''}`);
    return data.data;
  },

  async listDomains(filters = {}) {
    const params = new URLSearchParams(filters).toString();
    const data = await apiRequest(`/domains?${params}`);
    return data.data;
  },

  async getAuthCode(id) {
    const data = await apiRequest(`/domains/${id}/auth-code`);
    return data.data;
  },

  async updateDomain(id, updates) {
    const data = await apiRequest(`/domains/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
    return data.data;
  },

  async deleteDomain(id, options = {}) {
    const params = new URLSearchParams(options).toString();
    const data = await apiRequest(`/domains/${id}?${params}`, { method: 'DELETE' });
    return data.data;
  },

  async getDashboardStats() {
    const data = await apiRequest('/domains/dashboard/stats');
    return data.data;
  },
};

/**
 * DNS API
 */
const dnsApi = {
  async listNameservers(filters = {}) {
    const params = new URLSearchParams(filters).toString();
    const data = await apiRequest(`/dns/nameservers?${params}`);
    return data.data;
  },

  async createNameserver(nameserverData) {
    const data = await apiRequest('/dns/nameservers', {
      method: 'POST',
      body: JSON.stringify(nameserverData),
    });
    return data.data;
  },

  async listNameserverGroups(filters = {}) {
    const params = new URLSearchParams(filters).toString();
    const data = await apiRequest(`/dns/nameserver-groups?${params}`);
    return data.data;
  },

  async createNameserverGroup(groupData) {
    const data = await apiRequest('/dns/nameserver-groups', {
      method: 'POST',
      body: JSON.stringify(groupData),
    });
    return data.data;
  },

  async getNameserverGroup(name) {
    const data = await apiRequest(`/dns/nameserver-groups/${encodeURIComponent(name)}`);
    return data.data;
  },

  async updateNameserverGroup(name, updates) {
    const data = await apiRequest(`/dns/nameserver-groups/${encodeURIComponent(name)}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
    return data.data;
  },

  async deleteNameserverGroup(name) {
    const data = await apiRequest(`/dns/nameserver-groups/${encodeURIComponent(name)}`, {
      method: 'DELETE',
    });
    return data.data;
  },

  async setDefaultNameserverGroup(name) {
    const data = await apiRequest(`/dns/nameserver-groups/${encodeURIComponent(name)}/default`, {
      method: 'POST',
    });
    return data.data;
  },

  async createDomainToken(domainName, extension) {
    const data = await apiRequest('/dns/domain-token', {
      method: 'POST',
      body: JSON.stringify({ domainName, extension }),
    });
    return data.data;
  },

  async syncNameserverGroups() {
    const data = await apiRequest('/dns/sync', { method: 'POST' });
    return data.data;
  },
};

/**
 * Contacts API
 */
const contactsApi = {
  async listContacts(filters = {}) {
    const params = new URLSearchParams(filters).toString();
    const data = await apiRequest(`/contacts?${params}`);
    return data.data;
  },

  async createContact(contactData) {
    const data = await apiRequest('/contacts', {
      method: 'POST',
      body: JSON.stringify(contactData),
    });
    return data.data;
  },

  async getContact(id) {
    const data = await apiRequest(`/contacts/${id}`);
    return data.data;
  },

  async updateContact(id, updates) {
    const data = await apiRequest(`/contacts/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
    return data.data;
  },

  async deleteContact(id) {
    const data = await apiRequest(`/contacts/${id}`, { method: 'DELETE' });
    return data.data;
  },
};

// Export the same interface as MockAPI for drop-in replacement
export const API = {
  // Core domain methods (matching MockAPI)
  searchDomain,
  getPricing,
  whoisLookup,
  calculateTotal,
  
  // Extended APIs
  authApi: authApi,
  cartApi: cartApi,
  ordersApi: ordersApi,
  usersApi: usersApi,
  domainsApi: domainsApi,
  dnsApi: dnsApi,
  contactsApi: contactsApi,
  
  // Error class for error handling
  ApiError,
};

// Backwards compatibility - can be used as window.API = API
if (typeof window !== 'undefined') {
  window.API = API;
}

export default API;