import { domainsClient } from './DomainsClient.js';
import { Domain } from '../models/Domain.js';
import { Contact } from '../models/Contact.js';
import { NameserverGroup } from '../models/Nameserver.js';
import { User } from '../models/User.js';
import { mapDomainsError } from '../utils/domainsErrors.js';
import { AppError } from '../middleware/errorHandler.js';

class DomainService {
  constructor() {
    this._pricingCache = null;
    this._pricingCacheExpiry = 0;
    this._PRICING_CACHE_TTL = 60 * 60 * 1000; // 1 hour
  }
  /**
   * Check domain availability and get pricing
   */
  async checkDomain(domainInput, options = {}) {
    const { sld, tld } = this.parseDomain(domainInput);
    
    if (!sld || !tld) {
      throw AppError.badRequest('Invalid domain format');
    }
    
    await domainsClient.initialize();
    const result = await domainsClient.checkDomain(sld, tld);

    // Check for API-level errors
    const apiError = mapDomainsError(result, `Domain check ${sld}.${tld}`);
    if (apiError) throw apiError;

    const available = result.isAvailable === 'true';
    const premium = result.isPremium === 'true';

    let pricing = {
      registration: parseFloat(result.registrationPrice || result.registration || 0),
      renewal: parseFloat(result.renewalPrice || result.renewal || 0),
      transfer: parseFloat(result.transferPrice || result.transfer || 0),
      currency: result.objReseller?.currency || 'ZAR',
    };

    // Fallback: look up pricing from cache if check doesn't include it
    if (pricing.registration === 0) {
      try {
        const allPricing = await this.getPricing();
        const tldKey = tld.startsWith('.') ? tld : '.' + tld;
        const match = allPricing.find(p => p.tld === tldKey || p.tld === tld);
        if (match) {
          if (match.registration) pricing.registration = match.registration;
          if (match.renewal) pricing.renewal = match.renewal;
          if (match.transfer) pricing.transfer = match.transfer;
        }
      } catch (err) {
        console.warn('Failed to fetch pricing fallback:', err.message);
      }
    }

    return {
      domain: `${sld}.${tld}`,
      sld,
      tld: `.${tld}`,
      available,
      premium,
      status: available ? (premium ? 'premium' : 'available') : 'taken',
      pricing,
      balance: result.objReseller?.balance,
      checkedAt: new Date(),
    };
  }
  
  /**
   * Search domain with alternatives and suggestions
   */
  async searchDomain(query, options = {}) {
    const { sld, tld } = this.parseDomain(query);
    
    if (!sld) {
      throw AppError.badRequest('Invalid domain name');
    }
    
    const requestedTld = tld || 'com';
    
    // Check primary domain
    const primaryResult = await this.checkDomain(`${sld}.${requestedTld}`, options);
    
    // Common TLDs for alternatives — check in batches to avoid hammering API
    const commonTlds = ['com', 'net', 'org', 'io', 'co', 'ng', 'co.za', 'africa', 'online', 'store', 'tech', 'xyz'];
    
    // Use cached pricing to avoid individual check calls per alternative
    let allPricing = [];
    try {
      allPricing = await this.getPricing();
    } catch (err) {
      console.warn('Failed to load pricing for alternatives:', err.message);
    }
    
    const alternatives = commonTlds
      .filter(altTld => altTld !== requestedTld)
      .slice(0, 8)
      .map(altTld => {
        const tldKey = altTld.startsWith('.') ? altTld : '.' + altTld;
        const match = allPricing.find(p => p.tld === tldKey || p.tld === altTld);
        // Pricing exists means the TLD is supported, but we haven't checked availability
        const hasPricing = match && match.registration > 0;
        return {
          domain: `${sld}.${altTld}`,
          tld: `.${altTld}`,
          status: hasPricing ? 'priced' : 'unsupported',
          pricing: {
            registration: match?.registration || 0,
            renewal: match?.renewal || 0,
            transfer: match?.transfer || 0,
            currency: match?.currency || 'ZAR',
          },
        };
      });
    
    // Generate suggestions if primary is taken
    const suggestions = [];
    if (primaryResult.status === 'taken' || primaryResult.status === 'premium') {
      const prefixes = ['get', 'my', 'try', 'go', 'the'];
      const suffixes = ['hub', 'ly', 'hq', 'online', 'app', 'site'];
      
      const names = [
        ...prefixes.map(p => `${p}${sld}`),
        ...suffixes.map(s => `${sld}${s}`),
      ].slice(0, 8);
      
      // Use pricing cache to suggest available names without extra API calls
      const tldKey = requestedTld.startsWith('.') ? requestedTld : '.' + requestedTld;
      for (const name of names) {
        if (suggestions.length >= 4) break;
        const tldMatch = allPricing.find(p => p.tld === tldKey || p.tld === requestedTld);
        if (tldMatch && tldMatch.registration > 0) {
          suggestions.push({
            domain: `${name}.${requestedTld}`,
            status: 'unchecked',
            pricing: {
              registration: tldMatch.registration,
              renewal: tldMatch.renewal,
              transfer: tldMatch.transfer,
              currency: tldMatch.currency || 'ZAR',
            },
          });
        }
      }
    }
    
    return {
      primary: primaryResult,
      alternatives,
      suggestions,
    };
  }
  
  /**
   * Get pricing for all TLDs (cached for 1 hour)
   */
  async getPricing() {
    const now = Date.now();
    if (this._pricingCache && now < this._pricingCacheExpiry) {
      return this._pricingCache;
    }

    await domainsClient.initialize();
    const result = await domainsClient.getPricing();

    if (result.intReturnCode !== 1) {
      throw AppError.internal('Failed to fetch pricing: ' + (result.strMessage || 'unknown'));
    }

    const pricing = [];
    let tlds = result.data || result.arrTlds || result.arrPrices || [];

    // arrPrices is an object keyed by TLD (e.g. { "co.za": { registration: "89.00", ... } })
    if (tlds && !Array.isArray(tlds) && typeof tlds === 'object') {
      tlds = Object.entries(tlds).map(([tld, info]) => ({
        tld: tld.startsWith('.') ? tld : '.' + tld,
        ...(typeof info === 'object' ? info : {}),
      }));
    }

    for (const tld of tlds) {
      pricing.push({
        tld: tld.tld || tld.extension || tld.strTld,
        registration: parseFloat(tld.registration || tld.reg_price || tld.intRegPrice || 0),
        renewal: parseFloat(tld.renewal || tld.ren_price || tld.intRenPrice || 0),
        transfer: parseFloat(tld.transfer || tld.trn_price || tld.intTrnPrice || 0),
        currency: tld.currency || 'ZAR',
        category: tld.category || 'General',
      });
    }

    this._pricingCache = pricing;
    this._pricingCacheExpiry = now + this._PRICING_CACHE_TTL;

    return pricing;
  }
  
  /**
   * Register a domain
   */
  async registerDomain(userId, domainData) {
    const { domainName, extension, years = 1, contacts, nameservers, whoisPrivacy = true, autoRenew = true } = domainData;
    
    const tld = extension.replace(/^\./, '');
    
    // Validate domain is available
    const check = await this.checkDomain(`${domainName}.${tld}`, { operation: 'register' });
    if (!check.available && !check.premium) {
      throw new Error('Domain is not available for registration');
    }
    
    await domainsClient.initialize();

    // Build registration params
    const regParams = {
      sld: domainName,
      tld,
      period: years,
    };

    // Nameservers
    if (nameservers && nameservers.length > 0) {
      regParams.dns = 'custom';
      nameservers.slice(0, 5).forEach((ns, i) => {
        regParams[`ns${i + 1}`] = ns.hostname || ns;
      });
    } else {
      regParams.dns = 'managed';
    }

    // Contact details from local contacts or user profile
    if (contacts) {
      const resolved = await this.resolveContactForRegistrar(userId, contacts);
      if (resolved.registrant) {
        const r = resolved.registrant;
        regParams.registrantName = r.fullName || `${r.firstName} ${r.lastName}`;
        regParams.registrantEmail = r.email;
        regParams.registrantCountry = r.address?.country || 'ZA';
        regParams.registrantProvince = r.address?.state || '';
        regParams.registrantContactNumber = r.phone || '';
        regParams.registrantPostalCode = r.address?.postalCode || '';
        regParams.registrantAddress1 = r.address?.street || '';
        regParams.registrantCity = r.address?.city || '';
      }
      if (resolved.admin) {
        const a = resolved.admin;
        regParams.adminName = a.fullName || `${a.firstName} ${a.lastName}`;
        regParams.adminEmail = a.email;
        regParams.adminCountry = a.address?.country || 'ZA';
        regParams.adminProvince = a.address?.state || '';
        regParams.adminContactNumber = a.phone || '';
        regParams.adminPostalCode = a.address?.postalCode || '';
        regParams.adminAddress1 = a.address?.street || '';
        regParams.adminCity = a.address?.city || '';
      }
      if (resolved.tech) {
        const t = resolved.tech;
        regParams.techName = t.fullName || `${t.firstName} ${t.lastName}`;
        regParams.techEmail = t.email;
        regParams.techCountry = t.address?.country || 'ZA';
        regParams.techProvince = t.address?.state || '';
        regParams.techContactNumber = t.phone || '';
        regParams.techPostalCode = t.address?.postalCode || '';
        regParams.techAddress1 = t.address?.street || '';
        regParams.techCity = t.address?.city || '';
      }
      if (resolved.billing) {
        const b = resolved.billing;
        regParams.billingName = b.fullName || `${b.firstName} ${b.lastName}`;
        regParams.billingEmail = b.email;
        regParams.billingCountry = b.address?.country || 'ZA';
        regParams.billingProvince = b.address?.state || '';
        regParams.billingContactNumber = b.phone || '';
        regParams.billingPostalCode = b.address?.postalCode || '';
        regParams.billingAddress1 = b.address?.street || '';
        regParams.billingCity = b.address?.city || '';
      }
    }

    const result = await domainsClient.registerDomain(regParams);
    
    // Create local domain record
    const domain = await Domain.create({
      userId,
      domainName,
      extension: `.${tld}`,
      fullDomainName: `${domainName}.${tld}`,
      status: result.intReturnCode === 1 ? 'active' : 'pending',
      price: {
        registration: check.pricing.registration,
        renewal: check.pricing.renewal,
        transfer: check.pricing.transfer,
        currency: check.pricing.currency,
        period: years,
      },
      autoRenew,
      autoRenewPeriod: years,
      whoisPrivacy,
      orderId: domainData.orderId,
      registryStatuses: result.intReturnCode === 2 ? ['pending'] : [],
    });
    
    return { domain, registrarResult: result };
  }
  
  /**
   * Transfer a domain
   */
  async transferDomain(userId, transferData) {
    const { domainName, extension, authCode, contacts, nameservers, whoisPrivacy = true, autoRenew = true } = transferData;
    
    const tld = extension.replace(/^\./, '');
    
    await domainsClient.initialize();

    const transferParams = {
      sld: domainName,
      tld,
      eppKey: authCode,
      dns: 'keep',
    };

    if (nameservers && nameservers.length > 0) {
      transferParams.dns = 'custom';
      nameservers.slice(0, 5).forEach((ns, i) => {
        transferParams[`ns${i + 1}`] = ns.hostname || ns;
      });
    }

    if (contacts) {
      const resolved = await this.resolveContactForRegistrar(userId, contacts);
      if (resolved.registrant) {
        const r = resolved.registrant;
        transferParams.registrantName = r.fullName || `${r.firstName} ${r.lastName}`;
        transferParams.registrantEmail = r.email;
        transferParams.registrantCountry = r.address?.country || 'ZA';
        transferParams.registrantProvince = r.address?.state || '';
        transferParams.registrantContactNumber = r.phone || '';
        transferParams.registrantPostalCode = r.address?.postalCode || '';
        transferParams.registrantAddress1 = r.address?.street || '';
        transferParams.registrantCity = r.address?.city || '';
      }
      if (resolved.admin) {
        const a = resolved.admin;
        transferParams.adminName = a.fullName || `${a.firstName} ${a.lastName}`;
        transferParams.adminEmail = a.email;
        transferParams.adminCountry = a.address?.country || 'ZA';
        transferParams.adminProvince = a.address?.state || '';
        transferParams.adminContactNumber = a.phone || '';
        transferParams.adminPostalCode = a.address?.postalCode || '';
        transferParams.adminAddress1 = a.address?.street || '';
        transferParams.adminCity = a.address?.city || '';
      }
      if (resolved.tech) {
        const t = resolved.tech;
        transferParams.techName = t.fullName || `${t.firstName} ${t.lastName}`;
        transferParams.techEmail = t.email;
        transferParams.techCountry = t.address?.country || 'ZA';
        transferParams.techProvince = t.address?.state || '';
        transferParams.techContactNumber = t.phone || '';
        transferParams.techPostalCode = t.address?.postalCode || '';
        transferParams.techAddress1 = t.address?.street || '';
        transferParams.techCity = t.address?.city || '';
      }
      if (resolved.billing) {
        const b = resolved.billing;
        transferParams.billingName = b.fullName || `${b.firstName} ${b.lastName}`;
        transferParams.billingEmail = b.email;
        transferParams.billingCountry = b.address?.country || 'ZA';
        transferParams.billingProvince = b.address?.state || '';
        transferParams.billingContactNumber = b.phone || '';
        transferParams.billingPostalCode = b.address?.postalCode || '';
        transferParams.billingAddress1 = b.address?.street || '';
        transferParams.billingCity = b.address?.city || '';
      }
    }

    const result = await domainsClient.transferDomain(transferParams);
    
    const domain = await Domain.create({
      userId,
      domainName,
      extension: `.${tld}`,
      fullDomainName: `${domainName}.${tld}`,
      status: 'transfer_pending',
      price: {
        registration: 0,
        renewal: 0,
        transfer: 0,
        currency: 'ZAR',
        period: 1,
      },
      autoRenew,
      whoisPrivacy,
      orderId: transferData.orderId,
    });
    
    return { domain, registrarResult: result };
  }
  
  /**
   * Renew a domain
   */
  async renewDomain(userId, domainId, years = 1) {
    const domain = await Domain.findOne({ _id: domainId, userId });
    if (!domain) throw AppError.notFound('Domain not found');
    
    if (!domain.isRenewable()) {
      throw AppError.badRequest('Domain cannot be renewed in current status');
    }
    
    await domainsClient.initialize();
    const sld = domain.domainName;
    const tld = domain.extension.replace(/^\./, '');
    
    const result = await domainsClient.renewDomain(sld, tld, years);

    const apiError = mapDomainsError(result, `Domain renewal ${domain.fullDomainName}`);
    if (apiError) throw apiError;
    
    domain.status = 'active';
    // Add renewal period in days (365 per year, approximate)
    const renewalMs = years * 365 * 24 * 60 * 60 * 1000;
    domain.expirationDate = new Date(domain.expirationDate.getTime() + renewalMs);
    domain.renewalDate = domain.expirationDate;
    // Preserve original registration period, don't overwrite with renewal years
    await domain.save();
    
    return { domain, registrarResult: result };
  }
  
  /**
   * Get domain by ID
   */
  async getDomain(userId, domainId, options = {}) {
    const domain = await Domain.findOne({ _id: domainId, userId })
      .populate('contacts.registrant')
      .populate('contacts.admin')
      .populate('contacts.tech')
      .populate('contacts.billing');
    
    if (!domain) throw AppError.notFound('Domain not found');
    
    // Optionally fetch fresh data from registrar
    if (options.fresh) {
      try {
        await domainsClient.initialize();
        const sld = domain.domainName;
        const tld = domain.extension.replace(/^\./, '');
        const fresh = await domainsClient.getDomain(sld, tld);

        if (fresh.intReturnCode === 1 && fresh.data) {
          domain.registryStatuses = fresh.data.statuses || [];
          domain.nameservers = (fresh.data.nameservers || []).map(ns => ({
            hostname: ns.name || ns.hostname,
            ipv4: ns.ipv4,
            ipv6: ns.ipv6,
          }));
        }
      } catch (err) {
        console.warn('Failed to fetch fresh domain data:', err.message);
      }
    }
    
    return domain;
  }
  
  /**
   * List user's domains
   */
  async listDomains(userId, filters = {}) {
    const query = { userId };
    
    if (filters.status) query.status = filters.status;
    if (filters.expiringSoon) {
      const cutoff = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
      query.expirationDate = { $lte: cutoff, $gt: new Date() };
    }
    
    const limit = Math.min(filters.limit || 20, 100);
    const offset = filters.offset || 0;
    const sort = filters.sort || { expirationDate: 1 };
    
    const [domains, total] = await Promise.all([
      Domain.find(query).sort(sort).limit(limit).skip(offset),
      Domain.countDocuments(query),
    ]);
    
    return { domains, total, limit, offset };
  }
  
  /**
   * Get auth code for domain
   */
  async getAuthCode(userId, domainId) {
    const domain = await Domain.findOne({ _id: domainId, userId });
    if (!domain) throw AppError.notFound('Domain not found');
    
    await domainsClient.initialize();
    const sld = domain.domainName;
    const tld = domain.extension.replace(/^\./, '');
    
    const result = await domainsClient.getAuthCode(sld, tld);
    return result.strEPPKey || result.data?.strEPPKey || result;
  }
  
  /**
   * Update domain
   */
  async updateDomain(userId, domainId, updateData) {
    const domain = await Domain.findOne({ _id: domainId, userId });
    if (!domain) throw AppError.notFound('Domain not found');
    
    await domainsClient.initialize();
    const sld = domain.domainName;
    const tld = domain.extension.replace(/^\./, '');
    
    // Handle nameserver updates
    if (updateData.nameservers) {
      const nsParams = {
        dns: 'custom',
      };
      updateData.nameservers.slice(0, 5).forEach((ns, i) => {
        nsParams[`ns${i + 1}`] = ns.hostname || ns;
      });
      await domainsClient.updateNameservers(sld, tld, nsParams);
      domain.nameservers = updateData.nameservers;
    }
    
    // Handle autorenew toggle
    if (updateData.autoRenew !== undefined) {
      await domainsClient.toggleAutorenew(sld, tld, updateData.autoRenew);
      domain.autoRenew = updateData.autoRenew;
    }
    
    // Handle nameserver group
    if (updateData.nameserverGroup) {
      domain.nameserverGroup = updateData.nameserverGroup;
    }
    
    // Local-only updates
    if (updateData.whoisPrivacy !== undefined) {
      domain.whoisPrivacy = updateData.whoisPrivacy;
    }
    
    await domain.save();
    return domain;
  }
  
  /**
   * Delete domain
   */
  async deleteDomain(userId, domainId, options = {}) {
    const domain = await Domain.findOne({ _id: domainId, userId });
    if (!domain) throw AppError.notFound('Domain not found');
    
    await domainsClient.initialize();
    const sld = domain.domainName;
    const tld = domain.extension.replace(/^\./, '');
    
    await domainsClient.deleteDomain(sld, tld);
    
    domain.status = 'deleted';
    domain.isDeleted = true;
    domain.deletedAt = new Date();
    await domain.save();
    
    return domain;
  }
  
  /**
   * WHOIS lookup
   */
  async whoisLookup(domainInput) {
    const { sld, tld } = this.parseDomain(domainInput);
    if (!sld || !tld) throw AppError.badRequest('Invalid domain');
    
    await domainsClient.initialize();
    const checkResult = await domainsClient.checkDomain(sld, tld);

    const apiError = mapDomainsError(checkResult, `WHOIS lookup ${sld}.${tld}`);
    if (apiError) throw apiError;

    const available = checkResult.isAvailable === 'true';

    if (available) {
      return { domain: `${sld}.${tld}`, available: true };
    }

    // Domain is registered — try to get details
    try {
      const domainInfo = await domainsClient.getDomain(sld, tld);
      if (domainInfo.intReturnCode === 1 && domainInfo.data) {
        return {
          domain: `${sld}.${tld}`,
          available: false,
          registrar: 'Domains.co.za',
          created: domainInfo.data.intCrDate ? new Date(domainInfo.data.intCrDate * 1000).toISOString() : null,
          expires: domainInfo.data.intExDate ? new Date(domainInfo.data.intExDate * 1000).toISOString() : null,
          status: domainInfo.data.status || 'registered',
          nameServers: domainInfo.data.nameservers?.map(ns => ns.name) || [],
          privacy: domainInfo.data.bPrivacy || false,
        };
      }
    } catch (err) {
      console.warn('WHOIS domain detail fetch failed:', err.message);
    }

    return {
      domain: `${sld}.${tld}`,
      available: false,
      registrar: 'Unknown',
    };
  }
  
  /**
   * Get dashboard stats for user
   */
  async getDashboardStats(userId) {
    const [total, expiringSoon, autoRenewEnabled, expiring] = await Promise.all([
      Domain.countDocuments({ userId, status: { $in: ['active', 'registered', 'parked'] } }),
      Domain.countDocuments({ 
        userId, 
        expirationDate: { $lte: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), $gt: new Date() },
        status: { $in: ['active', 'registered', 'parked'] },
        autoRenew: false,
      }),
      Domain.countDocuments({ userId, autoRenew: true, status: { $in: ['active', 'registered', 'parked'] } }),
      Domain.find({ 
        userId, 
        expirationDate: { $lte: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), $gt: new Date() },
        status: { $in: ['active', 'registered', 'parked'] },
      }).limit(5).select('domainName extension expirationDate autoRenew price'),
    ]);
    
    return {
      totalDomains: total,
      expiringSoon: expiringSoon,
      autoRenewEnabled,
      expiring,
    };
  }

  // ─── Helper Methods ─────────────────────────────────

  parseDomain(input) {
    const raw = input.trim().toLowerCase().replace(/^\./, '');
    if (!raw) return { sld: null, tld: null };

    if (raw.includes('.')) {
      // Handle multi-part TLDs (co.za, com.au, org.za, etc.)
      const multiPartTlds = ['co.za', 'org.za', 'net.za', 'gov.za', 'ac.za', 'co.uk', 'co.nz', 'co.in', 'co.jp', 'co.kr', 'com.au', 'com.br', 'com.mx', 'com.sg', 'com.tw'];
      for (const tld of multiPartTlds) {
        if (raw.endsWith('.' + tld)) {
          const sld = raw.slice(0, -(tld.length + 1));
          if (sld) return { sld, tld };
        }
      }
      // Default: split on last dot
      const idx = raw.lastIndexOf('.');
      return { sld: raw.slice(0, idx), tld: raw.slice(idx + 1) };
    }
    return { sld: raw, tld: 'com' };
  }
  
  async getDefaultContacts(userId) {
    const contactTypes = ['registrant', 'admin', 'tech', 'billing'];
    const contacts = {};
    
    for (const type of contactTypes) {
      let contact = await Contact.findOne({ userId, type });
      if (!contact) {
        const user = await User.findById(userId);
        if (user) {
          contact = await Contact.create({
            userId,
            type,
            firstName: user.firstName,
            lastName: user.lastName,
            email: user.email,
            phone: '+27000000000',
            address: {
              street: '123 Main St',
              city: 'Johannesburg',
              state: 'Gauteng',
              postalCode: '2000',
              country: 'ZA',
            },
          });
        }
      }
      if (contact) contacts[type] = contact._id;
    }
    
    return contacts;
  }

  async resolveContactForRegistrar(userId, contactRefs) {
    // Resolve any contact reference (ID or object) to a contact record
    const resolveOne = async (ref) => {
      if (!ref) return null;
      if (typeof ref === 'object' && ref.firstName) {
        return {
          fullName: `${ref.firstName} ${ref.lastName}`,
          firstName: ref.firstName,
          lastName: ref.lastName,
          email: ref.email,
          phone: ref.phone,
          address: ref.address,
        };
      }
      const contact = await Contact.findById(ref);
      if (!contact) return null;
      return {
        fullName: contact.fullName,
        firstName: contact.firstName,
        lastName: contact.lastName,
        email: contact.email,
        phone: contact.formattedPhone,
        address: contact.address,
      };
    };

    // Resolve all four contact types
    const [registrant, admin, tech, billing] = await Promise.all([
      resolveOne(contactRefs.registrant),
      resolveOne(contactRefs.admin),
      resolveOne(contactRefs.tech),
      resolveOne(contactRefs.billing),
    ]);

    return { registrant, admin, tech, billing };
  }
  
  async getDefaultNameservers(userId) {
    const nsGroup = await NameserverGroup.getDefaultForUser(userId);
    if (nsGroup) return nsGroup.getHostnames();
    return [];
  }
}

export const domainService = new DomainService();
export default domainService;
