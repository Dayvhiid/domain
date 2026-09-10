import { dnsService } from '../services/DnsService.js';
import { z } from 'zod';

const createNameserverGroupSchema = z.object({
  body: z.object({
    name: z.string().min(1, 'Group name is required').max(100),
    nameservers: z.array(z.object({
      hostname: z.string().min(1),
      ipv4: z.string().optional(),
      ipv6: z.string().optional(),
    })).min(1, 'At least one nameserver is required').max(13),
    isDefault: z.boolean().default(false),
  }),
});

const updateNameserverGroupSchema = z.object({
  body: z.object({
    nameservers: z.array(z.object({
      hostname: z.string(),
      ipv4: z.string().optional(),
      ipv6: z.string().optional(),
    })).optional(),
    isDefault: z.boolean().optional(),
  }),
  params: z.object({
    name: z.string().min(1),
  }),
});

const domainTokenSchema = z.object({
  body: z.object({
    domainName: z.string().min(1),
    extension: z.string().min(1).startsWith('.'),
  }),
});

/**
 * List nameservers
 * GET /api/v1/dns/nameservers
 */
export async function listNameservers(req, res, next) {
  try {
    const { limit, offset, name, ip, pattern, order, orderBy } = req.query;
    
    const result = await dnsService.listNameservers(req.user.id, {
      limit: parseInt(limit) || 100,
      offset: parseInt(offset) || 0,
      name,
      ip,
      pattern,
      order,
      orderBy,
    });
    
    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Create nameserver
 * POST /api/v1/dns/nameservers
 */
export async function createNameserver(req, res, next) {
  try {
    const result = await dnsService.createNameserver(req.user.id, req.body);
    
    res.status(201).json({
      success: true,
      message: 'Nameserver created',
      data: result,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * List nameserver groups
 * GET /api/v1/dns/nameserver-groups
 */
export async function listNameserverGroups(req, res, next) {
  try {
    const { limit, offset, withDomainCount, withNsCount, nsGroupPattern, nsNamePattern, nsIpPattern } = req.query;
    
    const result = await dnsService.listNameserverGroups(req.user.id, {
      limit: parseInt(limit) || 100,
      offset: parseInt(offset) || 0,
      withDomainCount: withDomainCount === 'true',
      withNsCount: withNsCount === 'true',
      nsGroupPattern,
      nsNamePattern,
      nsIpPattern,
    });
    
    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Create nameserver group
 * POST /api/v1/dns/nameserver-groups
 */
export async function createNameserverGroup(req, res, next) {
  try {
    const result = await dnsService.createNameserverGroup(req.user.id, req.body);
    
    res.status(201).json({
      success: true,
      message: 'Nameserver group created',
      data: result,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Get nameserver group
 * GET /api/v1/dns/nameserver-groups/:name
 */
export async function getNameserverGroup(req, res, next) {
  try {
    const { name } = req.params;
    const group = await dnsService.getNameserverGroup(req.user.id, name);
    
    if (!group) {
      return res.status(404).json({
        success: false,
        error: { message: 'Nameserver group not found', code: 'NOT_FOUND' },
      });
    }
    
    res.json({
      success: true,
      data: group,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Update nameserver group
 * PUT /api/v1/dns/nameserver-groups/:name
 */
export async function updateNameserverGroup(req, res, next) {
  try {
    const { name } = req.params;
    const group = await dnsService.updateNameserverGroup(req.user.id, name, req.body);
    
    res.json({
      success: true,
      message: 'Nameserver group updated',
      data: group,
    });
  } catch (error) {
    const statusCode = error.message === 'Nameserver group not found' ? 404 : 500;
    res.status(statusCode).json({
      success: false,
      error: { message: error.message, code: 'UPDATE_FAILED' },
    });
  }
}

/**
 * Delete nameserver group
 * DELETE /api/v1/dns/nameserver-groups/:name
 */
export async function deleteNameserverGroup(req, res, next) {
  try {
    const { name } = req.params;
    await dnsService.deleteNameserverGroup(req.user.id, name);
    
    res.json({
      success: true,
      message: 'Nameserver group deleted',
    });
  } catch (error) {
    const statusCode = error.message === 'Nameserver group not found' ? 404 : 
                       error.message.includes('associated domains') ? 400 : 500;
    res.status(statusCode).json({
      success: false,
      error: { message: error.message, code: 'DELETE_FAILED' },
    });
  }
}

/**
 * Set default nameserver group
 * POST /api/v1/dns/nameserver-groups/:name/default
 */
export async function setDefaultNameserverGroup(req, res, next) {
  try {
    const { name } = req.params;
    const group = await dnsService.setDefaultNameserverGroup(req.user.id, name);
    
    res.json({
      success: true,
      message: 'Default nameserver group updated',
      data: group,
    });
  } catch (error) {
    const statusCode = error.message === 'Nameserver group not found' ? 404 : 500;
    res.status(statusCode).json({
      success: false,
      error: { message: error.message, code: 'DEFAULT_FAILED' },
    });
  }
}

/**
 * Create domain token for external DNS
 * POST /api/v1/dns/domain-token
 */
export async function createDomainToken(req, res, next) {
  try {
    const { domainName, extension } = req.body;
    const result = await dnsService.createDomainToken(req.user.id, domainName, extension);
    
    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Sync nameserver groups
 * POST /api/v1/dns/sync
 */
export async function syncNameserverGroups(req, res, next) {
  try {
    const result = await dnsService.syncFromDomains(req.user.id);
    
    res.json({
      success: true,
      message: `Synced ${result.synced} nameserver groups`,
      data: result,
    });
  } catch (error) {
    next(error);
  }
}

// Validation middleware
export function validate(schema) {
  return (req, res, next) => {
    try {
      schema.parse(req);
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

export default {
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
  schemas: {
    createNameserverGroup: createNameserverGroupSchema,
    updateNameserverGroup: updateNameserverGroupSchema,
    domainToken: domainTokenSchema,
  },
};