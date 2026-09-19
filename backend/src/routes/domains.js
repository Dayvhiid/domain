import express from 'express';
import domainController from '../controllers/domainController.js';
import { requireAuth } from '../middleware/auth.js';
import { domainsClient } from '../services/DomainsClient.js';
import { Domain } from '../models/Domain.js';
import { mapDomainsError } from '../utils/domainsErrors.js';

const router = express.Router();

const { 
  checkDomain,
  searchDomain,
  getPricing,
  registerDomain,
  transferDomain,
  renewDomain,
  getDomain,
  listDomains,
  getAuthCode,
  updateDomain,
  deleteDomain,
  whoisLookup,
  getDashboardStats,
  validate,
  schemas,
} = domainController;

// Public routes (no auth required)
router.post('/check', validate(schemas.checkDomain), checkDomain);
router.get('/search', validate(schemas.searchDomain), searchDomain);
router.get('/pricing', getPricing);
router.post('/whois', whoisLookup);

// All other domain routes require authentication
router.use(requireAuth);

// Dashboard stats
router.get('/dashboard/stats', getDashboardStats);

// Domain listing
router.get('/', validate(schemas.listDomains), listDomains);

// Domain operations
router.post('/register', validate(schemas.registerDomain), registerDomain);
router.post('/transfer', validate(schemas.transferDomain), transferDomain);

// Single domain routes (with ID)
router.get('/:id', getDomain);
router.put('/:id', validate(schemas.updateDomain), updateDomain);
router.delete('/:id', deleteDomain);
router.post('/:id/renew', validate(schemas.renewDomain), renewDomain);
router.get('/:id/auth-code', getAuthCode);

// ─── Lock / Unlock / Autorenew / WHOIS Privacy ────────────

// Get lock status
router.get('/:id/lock', async (req, res, next) => {
  try {
    const domain = await Domain.findOne({ _id: req.params.id, userId: req.user.id });
    if (!domain) return res.status(404).json({ success: false, error: { message: 'Domain not found', code: 'NOT_FOUND' } });
    await domainsClient.initialize();
    const sld = domain.domainName;
    const tld = domain.extension.replace(/^\./, '');
    const result = await domainsClient.getLockStatus(sld, tld);
    const err = mapDomainsError(result, 'Get lock status');
    if (err) throw err;
    res.json({ success: true, data: { locked: result.data?.locked ?? result.locked ?? false } });
  } catch (error) { next(error); }
});

// Lock domain
router.post('/:id/lock', async (req, res, next) => {
  try {
    const domain = await Domain.findOne({ _id: req.params.id, userId: req.user.id });
    if (!domain) return res.status(404).json({ success: false, error: { message: 'Domain not found', code: 'NOT_FOUND' } });
    await domainsClient.initialize();
    const sld = domain.domainName;
    const tld = domain.extension.replace(/^\./, '');
    const result = await domainsClient.lockDomain(sld, tld);
    const err = mapDomainsError(result, 'Lock domain');
    if (err) throw err;
    res.json({ success: true, message: 'Domain locked' });
  } catch (error) { next(error); }
});

// Unlock domain
router.post('/:id/unlock', async (req, res, next) => {
  try {
    const domain = await Domain.findOne({ _id: req.params.id, userId: req.user.id });
    if (!domain) return res.status(404).json({ success: false, error: { message: 'Domain not found', code: 'NOT_FOUND' } });
    await domainsClient.initialize();
    const sld = domain.domainName;
    const tld = domain.extension.replace(/^\./, '');
    const result = await domainsClient.unlockDomain(sld, tld);
    const err = mapDomainsError(result, 'Unlock domain');
    if (err) throw err;
    res.json({ success: true, message: 'Domain unlocked' });
  } catch (error) { next(error); }
});

// Toggle autorenew (standalone route)
router.post('/:id/autorenew', async (req, res, next) => {
  try {
    const domain = await Domain.findOne({ _id: req.params.id, userId: req.user.id });
    if (!domain) return res.status(404).json({ success: false, error: { message: 'Domain not found', code: 'NOT_FOUND' } });
    const { enabled } = req.body;
    await domainsClient.initialize();
    const sld = domain.domainName;
    const tld = domain.extension.replace(/^\./, '');
    const result = await domainsClient.toggleAutorenew(sld, tld, enabled);
    const err = mapDomainsError(result, 'Toggle autorenew');
    if (err) throw err;
    domain.autoRenew = !!enabled;
    await domain.save();
    res.json({ success: true, message: `Auto-renew ${enabled ? 'enabled' : 'disabled'}` });
  } catch (error) { next(error); }
});

// Toggle WHOIS privacy (local only — registrar API doesn't support this directly)
router.post('/:id/whois-privacy', async (req, res, next) => {
  try {
    const domain = await Domain.findOne({ _id: req.params.id, userId: req.user.id });
    if (!domain) return res.status(404).json({ success: false, error: { message: 'Domain not found', code: 'NOT_FOUND' } });
    const { enabled } = req.body;
    domain.whoisPrivacy = !!enabled;
    await domain.save();
    res.json({ success: true, message: `WHOIS privacy ${enabled ? 'enabled' : 'disabled'}` });
  } catch (error) { next(error); }
});

export default router;
