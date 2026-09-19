import express from 'express';
import { z } from 'zod';
import dnsController from '../controllers/dnsController.js';
import { requireAuth } from '../middleware/auth.js';
import { domainsClient } from '../services/DomainsClient.js';
import { Domain } from '../models/Domain.js';
import { mapDomainsError } from '../utils/domainsErrors.js';

const router = express.Router();

// Validation schemas for DNS operations
const dnsRecordSchema = z.object({
  type: z.string().min(1).max(10),
  name: z.string().min(1).max(255),
  content: z.string().min(1).max(1000),
  ttl: z.number().int().min(60).max(86400).optional(),
  prio: z.number().int().min(0).max(65535).optional(),
});

const setZoneSchema = z.object({
  records: z.array(dnsRecordSchema).max(100),
  append: z.boolean().optional(),
});

const addEntrySchema = dnsRecordSchema;

const updateEntrySchema = dnsRecordSchema;

function validateBody(schema) {
  return (req, res, next) => {
    try {
      schema.parse(req.body);
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          success: false,
          error: {
            message: 'Validation failed',
            code: 'VALIDATION_ERROR',
            details: error.errors.map(e => ({
              field: e.path.join('.'),
              message: e.message,
            })),
          },
        });
      }
      next(error);
    }
  };
}

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

// Middleware: verify user owns the domain before allowing DNS operations
async function verifyDomainOwnership(req, res, next) {
  try {
    const { sld, tld } = req.params;
    const domain = await Domain.findOne({
      userId: req.user.id,
      domainName: sld,
      extension: '.' + tld,
    });
    if (!domain) {
      return res.status(403).json({
        success: false,
        error: { message: 'You do not own this domain', code: 'FORBIDDEN' },
      });
    }
    next();
  } catch (error) {
    next(error);
  }
}

// ─── DNS Zone Management ────────────────────────────────

// Get DNS zone for a domain
router.get('/zone/:sld/:tld', verifyDomainOwnership, async (req, res, next) => {
  try {
    const { sld, tld } = req.params;
    await domainsClient.initialize();
    const result = await domainsClient.getDns(sld, tld);
    const err = mapDomainsError(result, 'Get DNS zone');
    if (err) throw err;
    res.json({ success: true, data: result });
  } catch (error) { next(error); }
});

// Set DNS zone records (full replace)
router.post('/zone/:sld/:tld', verifyDomainOwnership, validateBody(setZoneSchema), async (req, res, next) => {
  try {
    const { sld, tld } = req.params;
    const { records, append } = req.body;
    await domainsClient.initialize();
    const result = await domainsClient.setDns(sld, tld, records || [], append);
    const err = mapDomainsError(result, 'Set DNS zone');
    if (err) throw err;
    res.json({ success: true, message: 'DNS zone updated', data: result });
  } catch (error) { next(error); }
});

// Delete DNS zone
router.delete('/zone/:sld/:tld', verifyDomainOwnership, async (req, res, next) => {
  try {
    const { sld, tld } = req.params;
    await domainsClient.initialize();
    const result = await domainsClient.deleteDnsZone(sld, tld);
    const err = mapDomainsError(result, 'Delete DNS zone');
    if (err) throw err;
    res.json({ success: true, message: 'DNS zone deleted', data: result });
  } catch (error) { next(error); }
});

// Add a single DNS record
router.post('/entry/:sld/:tld', verifyDomainOwnership, validateBody(addEntrySchema), async (req, res, next) => {
  try {
    const { sld, tld } = req.params;
    const record = req.body;
    await domainsClient.initialize();
    const result = await domainsClient.addDnsEntry(sld, tld, record);
    const err = mapDomainsError(result, 'Add DNS entry');
    if (err) throw err;
    res.json({ success: true, message: 'DNS record added', data: result });
  } catch (error) { next(error); }
});

// Update a single DNS record
router.put('/entry/:sld/:tld/:dnsId', verifyDomainOwnership, validateBody(updateEntrySchema), async (req, res, next) => {
  try {
    const { sld, tld, dnsId } = req.params;
    const record = req.body;
    await domainsClient.initialize();
    const result = await domainsClient.updateDnsEntry(sld, tld, dnsId, record);
    const err = mapDomainsError(result, 'Update DNS entry');
    if (err) throw err;
    res.json({ success: true, message: 'DNS record updated', data: result });
  } catch (error) { next(error); }
});

// Delete a single DNS record
router.delete('/entry/:sld/:tld/:dnsId', verifyDomainOwnership, async (req, res, next) => {
  try {
    const { sld, tld, dnsId } = req.params;
    await domainsClient.initialize();
    const result = await domainsClient.deleteDnsEntry(sld, tld, dnsId);
    const err = mapDomainsError(result, 'Delete DNS entry');
    if (err) throw err;
    res.json({ success: true, message: 'DNS record deleted', data: result });
  } catch (error) { next(error); }
});

// ─── Nameservers ────────────────────────────────────────

router.get('/nameservers', listNameservers);
router.post('/nameservers', createNameserver);

// ─── Nameserver Groups ──────────────────────────────────

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