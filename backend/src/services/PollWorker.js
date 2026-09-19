import { domainsClient } from './DomainsClient.js';
import { Domain } from '../models/Domain.js';
import { mapDomainsError } from '../utils/domainsErrors.js';

class PollWorker {
  constructor() {
    this._interval = null;
    this._running = false;
    this._intervalMs = parseInt(process.env.POLL_INTERVAL_MS) || 5 * 60 * 1000; // 5 min default
  }

  /**
   * Start the poll worker with periodic interval
   */
  start() {
    if (this._interval) return;
    if (process.env.ENABLE_POLL_WORKER === 'false') {
      console.log('Poll worker disabled (ENABLE_POLL_WORKER=false)');
      return;
    }

    console.log(`Poll worker started (interval: ${this._intervalMs / 1000}s)`);
    this._interval = setInterval(() => this._poll(), this._intervalMs);

    // Run immediately on start (after a short delay to let server finish starting)
    setTimeout(() => this._poll(), 10000);
  }

  /**
   * Stop the poll worker
   */
  stop() {
    if (this._interval) {
      clearInterval(this._interval);
      this._interval = null;
      console.log('Poll worker stopped');
    }
  }

  /**
   * Execute one poll cycle
   */
  async _poll() {
    if (this._running) return;
    this._running = true;

    try {
      await domainsClient.initialize();

      // Fetch unacknowledged poll messages
      const result = await domainsClient.poll({ acked: 'false', limit: 50 });
      const messages = result?.data?.arrPoll || result?.arrPoll || [];

      if (messages.length === 0) {
        this._running = false;
        return;
      }

      console.log(`Poll worker: processing ${messages.length} messages`);
      const processedIds = [];

      for (const msg of messages) {
        try {
          await this._processMessage(msg);
          if (msg.intPollId) processedIds.push(msg.intPollId);
        } catch (err) {
          console.error(`Poll worker: failed to process message ${msg.intPollId}:`, err.message);
        }
      }

      // Acknowledge processed messages
      if (processedIds.length > 0) {
        try {
          await domainsClient.ackPoll(processedIds);
          console.log(`Poll worker: acknowledged ${processedIds.length} messages`);
        } catch (err) {
          console.error('Poll worker: failed to acknowledge messages:', err.message);
        }
      }
    } catch (err) {
      console.error('Poll worker error:', err.message);
    } finally {
      this._running = false;
    }
  }

  /**
   * Process a single poll message
   */
  async _processMessage(msg) {
    const strMessage = msg.strMessage || '';
    const domain = msg.strDomain || msg.domain || '';

    // Parse domain into sld and tld
    if (!domain) return;
    const dotIdx = domain.indexOf('.');
    if (dotIdx === -1) return;
    const sld = domain.slice(0, dotIdx);
    const tld = domain.slice(dotIdx + 1);

    // Find matching local domain by full domain name (globally unique)
    const localDomain = await Domain.findOne({
      fullDomainName: domain.toLowerCase(),
    });

    if (!localDomain) return;

    // Process based on message type
    if (strMessage.includes('transfer') && strMessage.includes('completed')) {
      localDomain.status = 'active';
      localDomain.syncStatus = 'synced';
      localDomain.lastSyncedAt = new Date();
      await localDomain.save();
      console.log(`Poll: domain ${domain} transfer completed → active`);
    } else if (strMessage.includes('transfer') && strMessage.includes('failed')) {
      localDomain.status = 'active'; // Revert to active if transfer failed
      localDomain.syncStatus = 'synced';
      localDomain.lastSyncedAt = new Date();
      await localDomain.save();
      console.log(`Poll: domain ${domain} transfer failed → active`);
    } else if (strMessage.includes('registration') && strMessage.includes('completed')) {
      localDomain.status = 'active';
      localDomain.syncStatus = 'synced';
      localDomain.lastSyncedAt = new Date();
      await localDomain.save();
      console.log(`Poll: domain ${domain} registration completed → active`);
    } else if (strMessage.includes('expired')) {
      localDomain.status = 'expired';
      localDomain.syncStatus = 'synced';
      localDomain.lastSyncedAt = new Date();
      await localDomain.save();
      console.log(`Poll: domain ${domain} expired`);
    } else if (strMessage.includes('deleted')) {
      localDomain.status = 'deleted';
      localDomain.isDeleted = true;
      localDomain.deletedAt = new Date();
      localDomain.syncStatus = 'synced';
      localDomain.lastSyncedAt = new Date();
      await localDomain.save();
      console.log(`Poll: domain ${domain} deleted`);
    } else if (strMessage.includes('suspended')) {
      localDomain.status = 'suspended';
      localDomain.syncStatus = 'synced';
      localDomain.lastSyncedAt = new Date();
      await localDomain.save();
      console.log(`Poll: domain ${domain} suspended`);
    } else {
      // Unknown message type — just mark as synced
      localDomain.syncStatus = 'synced';
      localDomain.lastSyncedAt = new Date();
      await localDomain.save();
      console.log(`Poll: domain ${domain} — unhandled message: ${strMessage.slice(0, 80)}`);
    }
  }
}

export const pollWorker = new PollWorker();
export default pollWorker;
