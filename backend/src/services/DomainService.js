import { domainsClient } from './DomainsClient.js';
import { Domain } from '../models/Domain.js';
import { Contact } from '../models/Contact.js';
import { NameserverGroup } from '../models/Nameserver.js';
import { User } from '../models/User.js';

class DomainService {
  /**
   * Check domain availability and get pricing
   */
  async checkDomain(domainInput, options = {}) {
    const { sld, tld } = this.parseDomain(domainInput);
    
    if (!sld || !tld) {
      throw new Error('Invalid domain format');
    }
    
    try {
      await domainsClient.initialize();
      const result = await domainsClient.checkDomain(sld, tld);

      const available = result.isAvailable === 'true';
      const premium = result.isPremium === 'true';

      let pricing = {
        registration: parseFloat(result.registrationPrice || result.registration || 0),
        renewal: parseFloat(result.renewalPrice || result.renewal || 0),
        transfer: parseFloat(result.transferPrice || result.transfer || 0),
        currency: result.objReseller?.currency || 'ZAR',
      };

      // Fallback: look up pricing from arrPrices if check doesn't include it
      if (pricing.registration === 0) {
        try {
          const pricingResult = await domainsClient.getPricing();
          const tlds = pricingResult.arrPrices || {};
          const tldKey = tld.startsWith('.') ? tld : '.' + tld;
          const tldPricing = tlds[tldKey] || tlds[tld] || {};
          if (tldPricing.registration) pricing.registration = parseFloat(tldPricing.registration);
          if (tldPricing.renewal) pricing.renewal = parseFloat(tldPricing.renewal);
          if (tldPricing.transfer) pricing.transfer = parseFloat(tldPricing.transfer);
        } catch {}
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
    } catch (error) {
      console.error('Domain check failed:', error);
      return {
        domain: `${sld}.${tld}`,
        sld,
        tld: `.${tld}`,
        available: false,
        premium: false,
        status: 'unknown',
        pricing: { registration: 0, renewal: 0, transfer: 0, currency: 'ZAR' },
        error: error.message,
      };
    }
  }
  
  /**
   * Search domain with alternatives and suggestions
   */
  async searchDomain(query, options = {}) {
    const { sld, tld } = this.parseDomain(query);
    
    if (!sld) {
      throw new Error('Invalid domain name');
    }
    
    const requestedTld = tld || 'com';
    
    // Check primary domain
    const primaryResult = await this.checkDomain(`${sld}.${requestedTld}`, options);
    
    // Common TLDs for alternatives
    const commonTlds = ['com', 'net', 'org', 'io', 'co', 'ng', 'co.za', 'africa', 'online', 'store', 'tech', 'xyz'];
    
    // Check alternatives in parallel (max 8)
    const altPromises = commonTlds
      .filter(altTld => altTld !== requestedTld)
      .slice(0, 8)
      .map(async (altTld) => {
        try {
          const altResult = await this.checkDomain(`${sld}.${altTld}`, options);
          return {
            domain: altResult.domain,
            tld: `.${altTld}`,
            status: altResult.status,
            pricing: altResult.pricing,
          };
        } catch {
          return {
            domain: `${sld}.${altTld}`,
            tld: `.${altTld}`,
            status: 'unknown',
            pricing: { registration: 0, renewal: 0, transfer: 0, currency: 'ZAR' },
          };
        }
      });
    
    const alternatives = await Promise.all(altPromises);
    
    // Generate suggestions if primary is taken
    const suggestions = [];
    if (primaryResult.status === 'taken' || primaryResult.status === 'premium') {
      const prefixes = ['get', 'my', 'try', 'go', 'the'];
      const suffixes = ['hub', 'ly', 'hq', 'online', 'app', 'site'];
      
      const sugPromises = [
        ...prefixes.map(p => `${p}${sld}`),
        ...suffixes.map(s => `${sld}${s}`),
      ].slice(0, 8).map(async (name) => {
        try {
          const result = await this.checkDomain(`${name}.${requestedTld}`, options);
          if (result.status === 'available') {
            return {
              domain: result.domain,
              status: 'available',
              pricing: result.pricing,
            };
          }
        } catch {}
        return null;
      });
      
      const sugResults = await Promise.all(sugPromises);
      for (const sug of sugResults) {
        if (sug && suggestions.length < 4) suggestions.push(sug);
      }
    }
    
    return {
      primary: primaryResult,
      alternatives,
      suggestions,
    };
  }
  
  /**
   * Get pricing for all TLDs
   */
  async getPricing() {
    await domainsClient.initialize();
    const result = await domainsClient.getPricing();

    if (result.intReturnCode !== 1) {
      throw new Error('Failed to fetch pricing: ' + (result.strMessage || 'unknown'));
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
      const contact = await this.resolveContactForRegistrar(userId, contacts);
      if (contact) {
        regParams.registrantName = contact.fullName || `${contact.firstName} ${contact.lastName}`;
        regParams.registrantEmail = contact.email;
        regParams.registrantCountry = contact.address?.country || 'ZA';
        regParams.registrantProvince = contact.address?.state || '';
        regParams.registrantContactNumber = contact.phone || '';
        regParams.registrantPostalCode = contact.address?.postalCode || '';
        regParams.registrantAddress1 = contact.address?.street || '';
        regParams.registrantCity = contact.address?.city || '';
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
      const contact = await this.resolveContactForRegistrar(userId, contacts);
      if (contact) {
        transferParams.registrantName = contact.fullName || `${contact.firstName} ${contact.lastName}`;
        transferParams.registrantEmail = contact.email;
        transferParams.registrantCountry = contact.address?.country || 'ZA';
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
    if (!domain) throw new Error('Domain not found');
    
    if (!domain.isRenewable) {
      throw new Error('Domain cannot be renewed in current status');
    }
    
    await domainsClient.initialize();
    const sld = domain.domainName;
    const tld = domain.extension.replace(/^\./, '');
    
    const result = await domainsClient.renewDomain(sld, tld, years);
    
    domain.status = 'active';
    domain.expirationDate = new Date(domain.expirationDate.getTime() + years * 365 * 24 * 60 * 60 * 1000);
    domain.renewalDate = domain.expirationDate;
    domain.price.period = years;
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
    
    if (!domain) throw new Error('Domain not found');
    
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
    if (!domain) throw new Error('Domain not found');
    
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
    if (!domain) throw new Error('Domain not found');
    
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
  async deleteDomain(userId, domainId) {
    const domain = await Domain.findOne({ _id: domainId, userId });
    if (!domain) throw new Error('Domain not found');
    
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
    if (!sld || !tld) throw new Error('Invalid domain');
    
    try {
      await domainsClient.initialize();
      const checkResult = await domainsClient.checkDomain(sld, tld);

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
      } catch {}

      return {
        domain: `${sld}.${tld}`,
        available: false,
        registrar: 'Unknown',
      };
    } catch {
      return { domain: `${sld}.${tld}`, available: true };
    }
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
    // contactRefs can be IDs or objects with contact details
    const contactId = contactRefs.registrant || contactRefs.admin;
    if (!contactId) return null;

    if (typeof contactId === 'object' && contactId.firstName) {
      return {
        fullName: `${contactId.firstName} ${contactId.lastName}`,
        firstName: contactId.firstName,
        lastName: contactId.lastName,
        email: contactId.email,
        phone: contactId.phone,
        address: contactId.address,
      };
    }

    const contact = await Contact.findById(contactId);
    if (!contact) return null;

    return {
      fullName: contact.fullName,
      firstName: contact.firstName,
      lastName: contact.lastName,
      email: contact.email,
      phone: contact.formattedPhone,
      address: contact.address,
    };
  }
  
  async getDefaultNameservers(userId) {
    const nsGroup = await NameserverGroup.getDefaultForUser(userId);
    if (nsGroup) return nsGroup.getHostnames();
    return [];
  }
}

export const domainService = new DomainService();
export default domainService;
