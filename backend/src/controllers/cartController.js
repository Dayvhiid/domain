import { cartService } from '../services/CartService.js';
import { z } from 'zod';

const addItemSchema = z.object({
  body: z.object({
    domainName: z.string().min(1),
    extension: z.string().min(1).startsWith('.'),
    price: z.object({
      registration: z.number().positive(),
      renewal: z.number().positive(),
      transfer: z.number().optional(),
      currency: z.string().length(3).default('USD'),
    }),
    years: z.number().int().min(1).max(10).default(1),
    options: z.object({
      whoisPrivacy: z.boolean().default(true),
      autoRenew: z.boolean().default(true),
      nameserverGroup: z.string().optional(),
      nameservers: z.array(z.object({
        hostname: z.string(),
        ipv4: z.string().optional(),
        ipv6: z.string().optional(),
      })).optional(),
      contacts: z.object({
        registrant: z.string().optional(),
        admin: z.string().optional(),
        tech: z.string().optional(),
        billing: z.string().optional(),
      }).optional(),
    }).optional(),
    availability: z.object({
      status: z.enum(['available', 'taken', 'premium', 'reserved', 'unknown']).default('unknown'),
      checkedAt: z.date().optional(),
      premiumPrice: z.number().optional(),
    }).optional(),
  }),
});

const updateYearsSchema = z.object({
  body: z.object({
    years: z.number().int().min(1).max(10),
  }),
  params: z.object({
    domainName: z.string().min(1),
  }),
});

const updateOptionsSchema = z.object({
  body: z.object({
    whoisPrivacy: z.boolean().optional(),
    autoRenew: z.boolean().optional(),
    nameserverGroup: z.string().optional(),
    nameservers: z.array(z.object({
      hostname: z.string(),
      ipv4: z.string().optional(),
      ipv6: z.string().optional(),
    })).optional(),
    contacts: z.object({
      registrant: z.string().optional(),
      admin: z.string().optional(),
      tech: z.string().optional(),
      billing: z.string().optional(),
    }).optional(),
  }),
  params: z.object({
    domainName: z.string().min(1),
  }),
});

const couponSchema = z.object({
  body: z.object({
    code: z.string().min(1),
    discountType: z.enum(['percentage', 'fixed']),
    discountValue: z.number().positive(),
    expiresAt: z.date().optional(),
  }),
});

/**
 * Get cart
 * GET /api/v1/cart
 */
export async function getCart(req, res, next) {
  try {
    const userId = req.user?.id;
    const sessionId = req.sessionID;
    
    const cart = await cartService.getCart(userId, sessionId);
    
    res.json({
      success: true,
      data: {
        items: cart.items,
        subtotal: cart.subtotal,
        total: cart.total,
        itemCount: cart.itemCount,
        coupon: cart.coupon,
      },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Add item to cart
 * POST /api/v1/cart/items
 */
export async function addItem(req, res, next) {
  try {
    const userId = req.user?.id;
    const sessionId = req.sessionID;
    
    const cart = await cartService.addItem(userId, sessionId, req.body);
    
    res.status(201).json({
      success: true,
      message: 'Item added to cart',
      data: {
        items: cart.items,
        itemCount: cart.itemCount,
        subtotal: cart.subtotal,
        total: cart.total,
      },
    });
  } catch (error) {
    const statusCode = error.message === 'Domain already in cart' ? 409 : 500;
    res.status(statusCode).json({
      success: false,
      error: { message: error.message, code: 'ADD_FAILED' },
    });
  }
}

/**
 * Remove item from cart
 * DELETE /api/v1/cart/items/:domainName
 */
export async function removeItem(req, res, next) {
  try {
    const userId = req.user?.id;
    const sessionId = req.sessionID;
    const { domainName } = req.params;
    
    const cart = await cartService.removeItem(userId, sessionId, domainName);
    
    res.json({
      success: true,
      message: 'Item removed from cart',
      data: {
        items: cart.items,
        itemCount: cart.itemCount,
        subtotal: cart.subtotal,
        total: cart.total,
      },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Update item years
 * PUT /api/v1/cart/items/:domainName/years
 */
export async function updateItemYears(req, res, next) {
  try {
    const userId = req.user?.id;
    const sessionId = req.sessionID;
    const { domainName } = req.params;
    const { years } = req.body;
    
    const cart = await cartService.updateItemYears(userId, sessionId, domainName, years);
    
    res.json({
      success: true,
      message: 'Item updated',
      data: {
        items: cart.items,
        subtotal: cart.subtotal,
        total: cart.total,
      },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Update item options
 * PUT /api/v1/cart/items/:domainName/options
 */
export async function updateItemOptions(req, res, next) {
  try {
    const userId = req.user?.id;
    const sessionId = req.sessionID;
    const { domainName } = req.params;
    
    const cart = await cartService.updateItemOptions(userId, sessionId, domainName, req.body);
    
    res.json({
      success: true,
      message: 'Item options updated',
      data: {
        items: cart.items,
      },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Clear cart
 * DELETE /api/v1/cart
 */
export async function clearCart(req, res, next) {
  try {
    const userId = req.user?.id;
    const sessionId = req.sessionID;
    
    await cartService.clearCart(userId, sessionId);
    
    res.json({
      success: true,
      message: 'Cart cleared',
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Apply coupon
 * POST /api/v1/cart/coupon
 */
export async function applyCoupon(req, res, next) {
  try {
    const userId = req.user?.id;
    const sessionId = req.sessionID;
    
    const cart = await cartService.applyCoupon(userId, sessionId, req.body);
    
    res.json({
      success: true,
      message: 'Coupon applied',
      data: {
        subtotal: cart.subtotal,
        total: cart.total,
        coupon: cart.coupon,
      },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Remove coupon
 * DELETE /api/v1/cart/coupon
 */
export async function removeCoupon(req, res, next) {
  try {
    const userId = req.user?.id;
    const sessionId = req.sessionID;
    
    const cart = await cartService.removeCoupon(userId, sessionId);
    
    res.json({
      success: true,
      message: 'Coupon removed',
      data: {
        subtotal: cart.subtotal,
        total: cart.total,
      },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Get checkout summary
 * GET /api/v1/cart/checkout-summary
 */
export async function getCheckoutSummary(req, res, next) {
  try {
    const userId = req.user?.id;
    const sessionId = req.sessionID;
    
    const summary = await cartService.getCheckoutSummary(userId, sessionId);
    
    res.json({
      success: true,
      data: summary,
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
  getCart,
  addItem,
  removeItem,
  updateItemYears,
  updateItemOptions,
  clearCart,
  applyCoupon,
  removeCoupon,
  getCheckoutSummary,
  validate,
  schemas: {
    addItem: addItemSchema,
    updateYears: updateYearsSchema,
    updateOptions: updateOptionsSchema,
    coupon: couponSchema,
  },
};