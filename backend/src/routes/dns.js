import express from 'express';
import dnsController from '../controllers/dnsController.js';
import { requireAuth } from '../middleware/auth.js';

const router = express.Router();

const { 
  listNameservers,
  createNameserver,
  listNameserverGroups,
  createNameserverGroup,
  getNameserverGroup,
  updateNameserverGroup,
  deleteNameserverGroup,
  setDefaultNameserverGroup,
  createDomainToken,
  syncNameserverGroups,
  validate,
  schemas,
} = dnsController;

// All DNS routes require authentication
router.use(requireAuth);

// Nameservers
router.get('/nameservers', listNameservers);
router.post('/nameservers', createNameserver);

// Nameserver Groups
router.get('/nameserver-groups', listNameserverGroups);
router.post('/nameserver-groups', validate(schemas.createNameserverGroup), createNameserverGroup);
router.get('/nameserver-groups/:name', getNameserverGroup);
router.put('/nameserver-groups/:name', validate(schemas.updateNameserverGroup), updateNameserverGroup);
router.delete('/nameserver-groups/:name', deleteNameserverGroup);
router.post('/nameserver-groups/:name/default', setDefaultNameserverGroup);

// Domain Token
router.post('/domain-token', validate(schemas.domainToken), createDomainToken);

// Sync
router.post('/sync', syncNameserverGroups);

export default router;