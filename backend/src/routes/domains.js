import express from 'express';
import domainController from '../controllers/domainController.js';
import { requireAuth } from '../middleware/auth.js';

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

export default router;
