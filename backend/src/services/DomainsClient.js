/**
 * Domains.co.za API Client
 * Handles all communication with Domains.co.za REST API (v5.0.19)
 * Uses URL-encoded params, JWT Bearer auth, and auto re-login on token expiry
 */

import { domainsCozaConfig, validateDomainsCozaConfig } from '../config/domainscoza.js';

class DomainsClient {
  constructor() {
    this.token = null;
    this.tokenExpiry = null;
    this.initialized = false;
  }

  async initialize() {
    if (this.initialized) return;
    validateDomainsCozaConfig();
    await this.login();
    this.initialized = true;
    console.log('Domains.co.za client initialized');
  }

  async login() {
    const { baseURL, username, password } = domainsCozaConfig;

    const res = await fetch(`${baseURL}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ username, password }),
    });

    const data = await res.json();

    if (data.intReturnCode !== 1) {
      throw new Error(`Domains.co.za login failed: ${data.strMessage}`);
    }

    this.token = data.token;
    this.tokenExpiry = Date.now() + 55 * 60 * 1000;
    console.log('Domains.co.za login successful');
    return this.token;
  }

  async request(endpoint, { method = 'GET', params = {} } = {}) {
    if (!this.initialized) await this.login();

    const doCall = async () => {
      const query = new URLSearchParams(params).toString();
      const { baseURL } = domainsCozaConfig;

      const isBody = method === 'POST' || method === 'PUT' || method === 'DELETE';
      const url = isBody
        ? `${baseURL}/${endpoint}`
        : `${baseURL}/${endpoint}${query ? `?${query}` : ''}`;

      const res = await fetch(url, {
        method,
        headers: {
          Authorization: `Bearer ${this.token}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: isBody ? query : undefined,
      });

      return res.json();
    };

    let data = await doCall();

    // Transparent re-auth on expired/invalid token
    if (data.intReturnCode === 6) {
      await this.login();
      data = await doCall();
    }

    return data;
  }

  // ─── Account ──────────────────────────────────────────

  async getBalance() {
    return this.request('domain/funds');
  }

  async getResellerInfo() {
    return this.request('reseller');
  }

  // ─── Domain Availability ──────────────────────────────

  async checkDomain(sld, tld) {
    return this.request('domain/check', {
      params: { sld, tld },
    });
  }

  async getTlds() {
    return this.request('domain/tlds');
  }

  // ─── Domain Lifecycle ─────────────────────────────────

  async listDomains(tld) {
    const params = {};
    if (tld) params.tld = tld;
    return this.request('domain/list', { params });
  }

  async getDomain(sld, tld) {
    return this.request('domain', { params: { sld, tld } });
  }

  async registerDomain(data) {
    const params = {
      sld: data.sld,
      tld: data.tld,
      period: data.period || 1,
    };

    if (data.dns) params.dns = data.dns;
    if (data.nsTemplate) params.nsTemplate = data.nsTemplate;
    if (data.ns1) params.ns1 = data.ns1;
    if (data.ns2) params.ns2 = data.ns2;
    if (data.ns3) params.ns3 = data.ns3;
    if (data.ns4) params.ns4 = data.ns4;
    if (data.ns5) params.ns5 = data.ns5;

    // Contact fields
    const contactFields = [
      'registrantName', 'registrantEmail', 'registrantCountry', 'registrantProvince',
      'registrantContactNumber', 'registrantPostalCode', 'registrantAddress1',
      'registrantAddress2', 'registrantAddress3', 'registrantCity',
      'adminName', 'adminEmail', 'adminCountry', 'adminProvince',
      'adminContactNumber', 'adminPostalCode', 'adminAddress1',
      'adminAddress2', 'adminAddress3', 'adminCity',
      'techName', 'techEmail', 'techCountry', 'techProvince',
      'techContactNumber', 'techPostalCode', 'techAddress1',
      'techAddress2', 'techAddress3', 'techCity',
      'billingName', 'billingEmail', 'billingCountry', 'billingProvince',
      'billingContactNumber', 'billingPostalCode', 'billingAddress1',
      'billingAddress2', 'billingAddress3', 'billingCity',
    ];

    for (const field of contactFields) {
      if (data[field]) params[field] = data[field];
    }

    return this.request('domain', { method: 'POST', params });
  }

  async renewDomain(sld, tld, period = 1, note = '') {
    return this.request('domain/renew', {
      method: 'POST',
      params: { sld, tld, period, note },
    });
  }

  async deleteDomain(sld, tld) {
    return this.request('domain', {
      method: 'DELETE',
      params: { sld, tld },
    });
  }

  async updateContacts(sld, tld, contactData) {
    const params = { sld, tld, ...contactData };
    return this.request('domain', { method: 'PUT', params });
  }

  // ─── Nameservers ──────────────────────────────────────

  async updateNameservers(sld, tld, data) {
    const params = { sld, tld };

    if (data.dns) params.dns = data.dns;
    if (data.nsTemplate) params.nsTemplate = data.nsTemplate;
    if (data.ns1) params.ns1 = data.ns1;
    if (data.ns2) params.ns2 = data.ns2;
    if (data.ns3) params.ns3 = data.ns3;
    if (data.ns4) params.ns4 = data.ns4;
    if (data.ns5) params.ns5 = data.ns5;
    if (data.dnsSec !== undefined) params.dnsSec = data.dnsSec ? '1' : '0';
    if (data.dnsSecData) params.dnsSecData = data.dnsSecData;

    return this.request('domain/ns', { method: 'POST', params });
  }

  // ─── Autorenew ────────────────────────────────────────

  async toggleAutorenew(sld, tld, autorenew) {
    const params = { sld, tld };
    if (autorenew !== undefined) params.autorenew = autorenew;
    return this.request('domain/autorenew', { method: 'POST', params });
  }

  // ─── Lock / Unlock ────────────────────────────────────

  async getLockStatus(sld, tld) {
    return this.request('domain/lock', { params: { sld, tld } });
  }

  async lockDomain(sld, tld) {
    return this.request('domain/lock', {
      method: 'POST',
      params: { sld, tld, action: 'lock' },
    });
  }

  async unlockDomain(sld, tld) {
    return this.request('domain/lock', {
      method: 'POST',
      params: { sld, tld, action: 'unlock' },
    });
  }

  // ─── EPP / Auth Codes ────────────────────────────────

  async getAuthCode(sld, tld) {
    return this.request('domain/eppKey', { params: { sld, tld } });
  }

  async sendAuthCode(sld, tld) {
    return this.request('domain/sendAuthCode', {
      method: 'POST',
      params: { sld, tld },
    });
  }

  // ─── Transfers ────────────────────────────────────────

  async transferDomain(data) {
    const params = {
      sld: data.sld,
      tld: data.tld,
      eppKey: data.eppKey,
    };

    if (data.dns) params.dns = data.dns;
    if (data.externalRef) params.externalRef = data.externalRef;

    // Contact fields (same as register)
    const contactFields = [
      'registrantName', 'registrantEmail', 'registrantCountry', 'registrantProvince',
      'registrantContactNumber', 'registrantPostalCode', 'registrantAddress1',
      'registrantAddress2', 'registrantAddress3', 'registrantCity',
    ];

    for (const field of contactFields) {
      if (data[field]) params[field] = data[field];
    }

    return this.request('domain/transfer', { method: 'POST', params });
  }

  async validateEppKey(sld, tld, authCode) {
    return this.request('domain/validateEppKey', {
      params: { sld, tld, auth: authCode },
    });
  }

  async getTransferList(params = {}) {
    return this.request('domain/transfer/transferInList', { params });
  }

  async respondToTransfer(key, response) {
    return this.request('domain/transfer/response', {
      method: 'POST',
      params: { key, response },
    });
  }

  // ─── DNS Zone ─────────────────────────────────────────

  async getDns(sld, tld) {
    return this.request('domain/dns', { params: { sld, tld } });
  }

  async setDns(sld, tld, records, append = false) {
    const params = { sld, tld, append: append ? 'true' : 'false' };

    records.forEach((record, i) => {
      const n = i + 1;
      params[`type${n}`] = record.type;
      params[`ttl${n}`] = record.ttl || 3600;
      params[`name${n}`] = record.name;
      params[`content${n}`] = record.content;
      if (record.prio) params[`prio${n}`] = record.prio;
    });

    return this.request('domain/dns', { method: 'POST', params });
  }

  async deleteDnsZone(sld, tld) {
    return this.request('domain/dns', {
      method: 'DELETE',
      params: { sld, tld },
    });
  }

  async addDnsEntry(sld, tld, record) {
    const params = {
      sld,
      tld,
      type: record.type,
      ttl: record.ttl || 3600,
      name: record.name,
      content: record.content,
    };
    if (record.prio) params.prio = record.prio;

    return this.request('domain/dns/entry', { method: 'POST', params });
  }

  async updateDnsEntry(sld, tld, dnsId, record) {
    const params = {
      sld,
      tld,
      dnsId,
      type: record.type,
      ttl: record.ttl || 3600,
      name: record.name,
      content: record.content,
    };
    if (record.prio) params.prio = record.prio;

    return this.request('domain/dns/entry', { method: 'PUT', params });
  }

  async deleteDnsEntry(sld, tld, dnsId) {
    return this.request('domain/dns/entry', {
      method: 'DELETE',
      params: { sld, tld, dnsId },
    });
  }

  // ─── DNSSEC ───────────────────────────────────────────

  async getDnssec(sld, tld) {
    return this.request('domain/dnssec', { params: { sld, tld } });
  }

  async addDnssec(sld, tld, record) {
    return this.request('domain/dnssec', {
      method: 'POST',
      params: { sld, tld, ...record },
    });
  }

  async deleteDnssec(sld, tld, record) {
    return this.request('domain/dnssec', {
      method: 'DELETE',
      params: { sld, tld, ...record },
    });
  }

  // ─── Host Records / Glue ──────────────────────────────

  async getHostRecords(host) {
    const params = {};
    if (host) params.host = host;
    return this.request('domain/hostrecords', { params });
  }

  async setHostRecords(host, records) {
    const params = { host, ...records };
    return this.request('domain/hostrecords', { method: 'POST', params });
  }

  async deleteHostRecords(host) {
    return this.request('domain/hostrecords', {
      method: 'DELETE',
      params: { host },
    });
  }

  async getGlueRecords() {
    return this.request('domain/gluerecords');
  }

  async setGlueRecords(data) {
    return this.request('domain/gluerecords', { method: 'POST', params: data });
  }

  // ─── Poll ─────────────────────────────────────────────

  async poll(filters = {}) {
    const params = {};
    if (filters.filter) params.filter = filters.filter;
    if (filters.acked) params.acked = filters.acked;
    if (filters.sortBy) params.sortBy = filters.sortBy;
    if (filters.order) params.order = filters.order;
    if (filters.startPoint) params.startPoint = filters.startPoint;
    if (filters.limit) params.limit = filters.limit;
    if (filters.domain) params.domain = filters.domain;

    return this.request('domain/poll', { params });
  }

  async ackPoll(pollIds) {
    const params = {};
    if (Array.isArray(pollIds)) {
      pollIds.forEach((id, i) => { params[`pollId[${i}]`] = id; });
    } else {
      params.pollId = pollIds;
    }

    return this.request('domain/poll', { method: 'POST', params });
  }

  // ─── Pricing ──────────────────────────────────────────

  async getPricing(format = 'tld') {
    return this.request('reseller/pricing', {
      params: { format },
    });
  }

  async getDefaultPricing(format = 'tld') {
    return this.request('reseller/defaultPricing', {
      params: { format },
    });
  }

  // ─── Suspend / Unsuspend ──────────────────────────────

  async suspendDomain(sld, tld) {
    return this.request('domain/suspend', {
      method: 'POST',
      params: { sld, tld },
    });
  }

  async unsuspendDomain(sld, tld) {
    return this.request('domain/unsuspend', {
      method: 'POST',
      params: { sld, tld },
    });
  }
}

export const domainsClient = new DomainsClient();
export default domainsClient;
