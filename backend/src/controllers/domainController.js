import { domainService } from '../services/DomainService.js';
import { z } from 'zod';

// Validation schemas
const checkDomainSchema = z.object({
  body: z.object({
    domain: z.string().min(1, 'Domain is required'),
    operation: z.enum(['register', 'transfer', 'renew']).optional(),
    period: z.number().int().min(1).max(10).optional(),
  }),
});

const searchDomainSchema = z.object({
  query: z.object({
    domain: z.string().min(1, 'Domain query is required'),
  }),
});

const registerDomainSchema = z.object({
  body: z.object({
    domainName: z.string().min(1, 'Domain name is required'),
    extension: z.string().min(1, 'Extension is required').startsWith('.'),
    years: z.number().int().min(1).max(10).default(1),
    contacts: z.object({
      registrant: z.string().optional(),
      admin: z.string().optional(),
      tech: z.string().optional(),
      billing: z.string().optional(),
    }).optional(),
    nameservers: z.array(z.object({
      hostname: z.string(),
      ipv4: z.string().optional(),
      ipv6: z.string().optional(),
    })).optional(),
    whoisPrivacy: z.boolean().default(true),
    autoRenew: z.boolean().default(true),
    orderId: z.string().optional(),
  }),
});

const transferDomainSchema = z.object({
  body: z.object({
    domainName: z.string().min(1, 'Domain name is required'),
    extension: z.string().min(1, 'Extension is required').startsWith('.'),
    authCode: z.string().min(1, 'Auth code is required'),
    contacts: z.object({
      registrant: z.string().optional(),
      admin: z.string().optional(),
      tech: z.string().optional(),
      billing: z.string().optional(),
    }).optional(),
    nameservers: z.array(z.object({
      hostname: z.string(),
      ipv4: z.string().optional(),
      ipv6: z.string().optional(),
    })).optional(),
    whoisPrivacy: z.boolean().default(true),
    autoRenew: z.boolean().default(true),
    orderId: z.string().optional(),
  }),
});

const renewDomainSchema = z.object({
  body: z.object({
    years: z.number().int().min(1).max(10).default(1),
  }),
  params: z.object({
    id: z.string().min(1),
  }),
});

const listDomainsSchema = z.object({
  query: z.object({
    status: z.string().optional(),
    limit: z.coerce.number().int().min(1).max(100).default(20),
    offset: z.coerce.number().int().min(0).default(0),
    sort: z.string().optional(),
    expiringSoon: z.coerce.boolean().default(false),
  }),
});

const updateDomainSchema = z.object({
  body: z.object({
    autoRenew: z.boolean().optional(),
    autoRenewPeriod: z.number().int().min(1).max(10).optional(),
    whoisPrivacy: z.boolean().optional(),
    nameservers: z.array(z.object({
      hostname: z.string(),
      ipv4: z.string().optional(),
      ipv6: z.string().optional(),
    })).optional(),
    nameserverGroup: z.string().optional(),
    contacts: z.object({
      registrant: z.string().optional(),
      admin: z.string().optional(),
      tech: z.string().optional(),
      billing: z.string().optional(),
    }).optional(),
  }),
  params: z.object({
    id: z.string().min(1),
  }),
});

/**
 * Check domain availability
 * POST /api/v1/domains/check
 */
export async function checkDomain(req, res, next) {
  try {
    const { domain, operation, period } = req.body;
    const result = await domainService.checkDomain(domain, { operation, period });
    
    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Search domain with alternatives and suggestions
 * GET /api/v1/domains/search
 */
export async function searchDomain(req, res, next) {
  try {
    const { domain } = req.query;
    const result = await domainService.searchDomain(domain);
    
    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Get domain pricing (all TLDs)
 * GET /api/v1/domains/pricing
 */
export async function getPricing(req, res, next) {
  try {
    const pricing = await domainService.getPricing();
    
    res.json({
      success: true,
      data: pricing,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Register a domain
 * POST /api/v1/domains/register
 */
export async function registerDomain(req, res, next) {
  try {
    const result = await domainService.registerDomain(req.user.id, req.body);
    
    res.status(201).json({
      success: true,
      message: 'Domain registration initiated',
      data: result,
    });
  } catch (error) {
    const statusCode = error.message.includes('not available') ? 409 : 500;
    res.status(statusCode).json({
      success: false,
      error: { message: error.message, code: 'REGISTRATION_FAILED' },
    });
  }
}

/**
 * Transfer a domain
 * POST /api/v1/domains/transfer
 */
export async function transferDomain(req, res, next) {
  try {
    const result = await domainService.transferDomain(req.user.id, req.body);
    
    res.status(201).json({
      success: true,
      message: 'Domain transfer initiated',
      data: result,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Renew a domain
 * POST /api/v1/domains/:id/renew
 */
export async function renewDomain(req, res, next) {
  try {
    const { id } = req.params;
    const { years } = req.body;
    
    const result = await domainService.renewDomain(req.user.id, id, years);
    
    res.json({
      success: true,
      message: 'Domain renewed successfully',
      data: result,
    });
  } catch (error) {
    const statusCode = error.message === 'Domain not found' ? 404 : 
                       error.message.includes('cannot be renewed') ? 400 : 500;
    res.status(statusCode).json({
      success: false,
      error: { message: error.message, code: 'RENEWAL_FAILED' },
    });
  }
}

/**
 * Get domain by ID
 * GET /api/v1/domains/:id
 */
export async function getDomain(req, res, next) {
  try {
    const { id } = req.params;
    const fresh = req.query.fresh === 'true';
    
    const domain = await domainService.getDomain(req.user.id, id, { fresh });
    
    res.json({
      success: true,
      data: domain,
    });
  } catch (error) {
    const statusCode = error.message === 'Domain not found' ? 404 : 500;
    res.status(statusCode).json({
      success: false,
      error: { message: error.message, code: 'DOMAIN_NOT_FOUND' },
    });
  }
}

/**
 * List user's domains
 * GET /api/v1/domains
 */
export async function listDomains(req, res, next) {
  try {
    const { status, limit, offset, sort, expiringSoon } = req.query;
    
    const result = await domainService.listDomains(req.user.id, {
      status,
      limit: parseInt(limit),
      offset: parseInt(offset),
      sort: sort ? JSON.parse(sort) : undefined,
      expiringSoon: expiringSoon === 'true',
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
 * Get auth code for domain
 * GET /api/v1/domains/:id/auth-code
 */
export async function getAuthCode(req, res, next) {
  try {
    const { id } = req.params;
    const authCode = await domainService.getAuthCode(req.user.id, id);
    
    res.json({
      success: true,
      data: { authCode },
    });
  } catch (error) {
    const statusCode = error.message === 'Domain not found' ? 404 : 500;
    res.status(statusCode).json({
      success: false,
      error: { message: error.message, code: 'AUTH_CODE_FAILED' },
    });
  }
}

/**
 * Update domain
 * PUT /api/v1/domains/:id
 */
export async function updateDomain(req, res, next) {
  try {
    const { id } = req.params;
    const domain = await domainService.updateDomain(req.user.id, id, req.body);
    
    res.json({
      success: true,
      message: 'Domain updated successfully',
      data: domain,
    });
  } catch (error) {
    const statusCode = error.message === 'Domain not found' ? 404 : 500;
    res.status(statusCode).json({
      success: false,
      error: { message: error.message, code: 'UPDATE_FAILED' },
    });
  }
}

/**
 * Delete domain
 * DELETE /api/v1/domains/:id
 */
export async function deleteDomain(req, res, next) {
  try {
    const { id } = req.params;
    const { type, skipSoftQuarantine, forceDelete } = req.query;
    
    await domainService.deleteDomain(req.user.id, id, {
      type,
      skipSoftQuarantine: skipSoftQuarantine === 'true',
      forceDelete: forceDelete === 'true',
    });
    
    res.json({
      success: true,
      message: 'Domain deleted successfully',
    });
  } catch (error) {
    const statusCode = error.message === 'Domain not found' ? 404 : 500;
    res.status(statusCode).json({
      success: false,
      error: { message: error.message, code: 'DELETE_FAILED' },
    });
  }
}

/**
 * WHOIS lookup
 * POST /api/v1/domains/whois
 */
export async function whoisLookup(req, res, next) {
  try {
    const { domain } = req.body;
    
    if (!domain) {
      return res.status(400).json({
        success: false,
        error: { message: 'Domain is required', code: 'MISSING_DOMAIN' },
      });
    }
    
    const result = await domainService.whoisLookup(domain);
    
    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Get dashboard stats
 * GET /api/v1/domains/dashboard/stats
 */
export async function getDashboardStats(req, res, next) {
  try {
    const stats = await domainService.getDashboardStats(req.user.id);
    
    res.json({
      success: true,
      data: stats,
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
  schemas: {
    checkDomain: checkDomainSchema,
    searchDomain: searchDomainSchema,
    registerDomain: registerDomainSchema,
    transferDomain: transferDomainSchema,
    renewDomain: renewDomainSchema,
    listDomains: listDomainsSchema,
    updateDomain: updateDomainSchema,
  },
};