import { domainsClient } from './DomainsClient.js';
import { NameserverGroup } from '../models/Nameserver.js';

class DnsService {
  /**
   * List nameservers
   */
  async listNameservers(userId, filters = {}) {
    // Domains.co.za doesn't have a standalone nameserver list endpoint
    // Return locally stored nameserver groups
    const groups = await NameserverGroup.findByUser(userId);
    return { nameservers: groups, total: groups.length };
  }
  
  /**
   * Create nameserver (glue record)
   */
  async createNameserver(userId, nameserverData) {
    await domainsClient.initialize();
    const result = await domainsClient.setGlueRecords(nameserverData);
    return result;
  }
  
  /**
   * List nameserver groups
   */
  async listNameserverGroups(userId, filters = {}) {
    const localGroups = await NameserverGroup.findByUser(userId);
    return { groups: localGroups, total: localGroups.length };
  }
  
  /**
   * Create nameserver group
   */
  async createNameserverGroup(userId, groupData) {
    const localGroup = await NameserverGroup.create({
      userId,
      name: groupData.name,
      hosts: groupData.nameservers || [],
      isDefault: groupData.isDefault || false,
    });
    
    return { group: localGroup };
  }
  
  /**
   * Get nameserver group by name
   */
  async getNameserverGroup(userId, name) {
    const localGroup = await NameserverGroup.findOne({ userId, name });
    if (localGroup) return localGroup;
    throw new Error('Nameserver group not found');
  }
  
  /**
   * Update nameserver group
   */
  async updateNameserverGroup(userId, name, updateData) {
    const localGroup = await NameserverGroup.findOne({ userId, name });
    if (!localGroup) throw new Error('Nameserver group not found');
    
    if (updateData.hosts) localGroup.hosts = updateData.hosts;
    if (updateData.isDefault) {
      await localGroup.setAsDefault();
    }
    
    await localGroup.save();
    return localGroup;
  }
  
  /**
   * Delete nameserver group
   */
  async deleteNameserverGroup(userId, name) {
    const localGroup = await NameserverGroup.findOne({ userId, name });
    if (!localGroup) throw new Error('Nameserver group not found');
    
    if (localGroup.domainCount > 0) {
      throw new Error('Cannot delete group with associated domains');
    }
    
    await localGroup.deleteOne();
    return { success: true };
  }
  
  /**
   * Set default nameserver group
   */
  async setDefaultNameserverGroup(userId, name) {
    const localGroup = await NameserverGroup.findOne({ userId, name });
    if (!localGroup) throw new Error('Nameserver group not found');
    
    await localGroup.setAsDefault();
    return localGroup;
  }
  
  /**
   * Create domain token for external DNS
   */
  async createDomainToken(userId, domainName, extension) {
    // Domains.co.za doesn't have a domain token endpoint
    // Return a placeholder or use glue records instead
    return { message: 'Domain token not supported by Domains.co.za API' };
  }
  
  /**
   * Sync nameserver groups (no-op for Domains.co.za)
   */
  async syncFromDomains(userId) {
    // Domains.co.za manages nameservers per-domain, not via groups
    // This is a local-only operation
    const localGroups = await NameserverGroup.findByUser(userId);
    return { synced: localGroups.length, groups: localGroups };
  }
  
  /**
   * Get DNS zone for a domain
   */
  async getDnsZone(userId, sld, tld) {
    await domainsClient.initialize();
    const result = await domainsClient.getDns(sld, tld);
    return result;
  }
  
  /**
   * Set DNS zone records
   */
  async setDnsZone(userId, sld, tld, records, append = false) {
    await domainsClient.initialize();
    const result = await domainsClient.setDns(sld, tld, records, append);
    return result;
  }
  
  /**
   * Add a single DNS record
   */
  async addDnsEntry(userId, sld, tld, record) {
    await domainsClient.initialize();
    const result = await domainsClient.addDnsEntry(sld, tld, record);
    return result;
  }
  
  /**
   * Update a single DNS record
   */
  async updateDnsEntry(userId, sld, tld, dnsId, record) {
    await domainsClient.initialize();
    const result = await domainsClient.updateDnsEntry(sld, tld, dnsId, record);
    return result;
  }
  
  /**
   * Delete a single DNS record
   */
  async deleteDnsEntry(userId, sld, tld, dnsId) {
    await domainsClient.initialize();
    const result = await domainsClient.deleteDnsEntry(sld, tld, dnsId);
    return result;
  }
  
  /**
   * Delete entire DNS zone
   */
  async deleteDnsZone(userId, sld, tld) {
    await domainsClient.initialize();
    const result = await domainsClient.deleteDnsZone(sld, tld);
    return result;
  }
  
  /**
   * Get nameservers for a domain
   */
  async getDomainNameservers(domainName, extension) {
    return [];
  }
}

export const dnsService = new DnsService();
export default dnsService;
