import { User } from '../models/User.js';
import { Domain } from '../models/Domain.js';
import { Order } from '../models/Order.js';
import { Invoice } from '../models/Invoice.js';
import { z } from 'zod';

const updateProfileSchema = z.object({
  body: z.object({
    firstName: z.string().min(1).max(50).optional(),
    lastName: z.string().min(1).max(50).optional(),
    preferences: z.object({
      currency: z.string().length(3).optional(),
      language: z.string().length(2).optional(),
      notifications: z.object({
        email: z.boolean().optional(),
        domainExpiry: z.boolean().optional(),
        invoiceCreated: z.boolean().optional(),
        paymentReceived: z.boolean().optional(),
      }).optional(),
      autoRenewDefault: z.boolean().optional(),
    }).optional(),
  }),
});

const changePasswordSchema = z.object({
  body: z.object({
    currentPassword: z.string().min(1, 'Current password is required'),
    newPassword: z.string().min(8, 'New password must be at least 8 characters'),
  }),
});

/**
 * Get user profile
 * GET /api/v1/users/profile
 */
export async function getProfile(req, res, next) {
  try {
    const user = req.user;
    
    // Remove sensitive fields
    const { passwordHash, emailVerificationToken, emailVerificationExpires,
            passwordResetToken, passwordResetExpires,
            loginAttempts, lockUntil, ...safeUser } = user.toObject();
    
    res.json({
      success: true,
      data: { user: safeUser },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Update user profile
 * PUT /api/v1/users/profile
 */
export async function updateProfile(req, res, next) {
  try {
    const allowedFields = ['firstName', 'lastName', 'preferences'];
    const updateData = {};
    
    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        updateData[field] = req.body[field];
      }
    }
    
    const user = await User.findByIdAndUpdate(
      req.user.id,
      { $set: updateData },
      { new: true, runValidators: true }
    );
    
    if (!user) {
      return res.status(404).json({
        success: false,
        error: { message: 'User not found', code: 'NOT_FOUND' },
      });
    }
    
    const { passwordHash, emailVerificationToken, emailVerificationExpires,
            passwordResetToken, passwordResetExpires,
            loginAttempts, lockUntil, ...safeUser } = user.toObject();
    
    res.json({
      success: true,
      message: 'Profile updated successfully',
      data: { user: safeUser },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Change password
 * PUT /api/v1/users/password
 */
export async function changePassword(req, res, next) {
  try {
    const user = await User.findById(req.user.id).select('+passwordHash');
    
    if (!user) {
      return res.status(404).json({
        success: false,
        error: { message: 'User not found', code: 'NOT_FOUND' },
      });
    }
    
    const isMatch = await user.comparePassword(req.body.currentPassword);
    if (!isMatch) {
      return res.status(400).json({
        success: false,
        error: { message: 'Current password is incorrect', code: 'INVALID_PASSWORD' },
      });
    }
    
    user.passwordHash = req.body.newPassword;
    await user.save();
    
    res.json({
      success: true,
      message: 'Password changed successfully',
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Get dashboard data
 * GET /api/v1/users/dashboard
 */
export async function getDashboard(req, res, next) {
  try {
    const userId = req.user.id;
    
    // Get domain stats
    const [totalDomains, expiringSoon, autoRenewEnabled, expiringDomains] = await Promise.all([
      Domain.countDocuments({ 
        userId, 
        status: { $in: ['active', 'registered', 'parked'] } 
      }),
      Domain.countDocuments({ 
        userId, 
        expirationDate: { $lte: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), $gt: new Date() },
        status: { $in: ['active', 'registered', 'parked'] },
        autoRenew: false,
      }),
      Domain.countDocuments({ 
        userId, 
        autoRenew: true, 
        status: { $in: ['active', 'registered', 'parked'] } 
      }),
      Domain.find({ 
        userId, 
        expirationDate: { $lte: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), $gt: new Date() },
        status: { $in: ['active', 'registered', 'parked'] },
      })
      .limit(5)
      .select('domainName extension expirationDate autoRenew price')
      .lean(),
    ]);
    
    // Get recent orders
    const recentOrders = await Order.find({ userId })
      .sort({ createdAt: -1 })
      .limit(5)
      .select('orderNumber status total createdAt items')
      .lean();
    
    // Get recent invoices
    const recentInvoices = await Invoice.find({ userId })
      .sort({ issueDate: -1 })
      .limit(5)
      .select('invoiceNumber status total dueDate')
      .lean();
    
    res.json({
      success: true,
      data: {
        stats: {
          totalDomains,
          expiringSoon,
          autoRenewEnabled,
        },
        expiringDomains,
        recentOrders,
        recentInvoices,
      },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Get user's domains (alias to domains route)
 * GET /api/v1/users/domains
 */
export async function getUserDomains(req, res, next) {
  try {
    const { status, limit, offset, sort, expiringSoon } = req.query;
    const query = { userId: req.user.id };
    
    if (status) query.status = status;
    if (expiringSoon === 'true') {
      const cutoff = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
      query.expirationDate = { $lte: cutoff, $gt: new Date() };
    }
    
    const lim = Math.min(parseInt(limit) || 20, 100);
    const off = parseInt(offset) || 0;
    const srt = sort ? JSON.parse(sort) : { expirationDate: 1 };
    
    const [domains, total] = await Promise.all([
      Domain.find(query).sort(srt).limit(lim).skip(off),
      Domain.countDocuments(query),
    ]);
    
    res.json({
      success: true,
      data: { domains, total, limit: lim, offset: off },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Get user's orders (alias to orders route)
 * GET /api/v1/users/orders
 */
export async function getUserOrders(req, res, next) {
  try {
    const { status, limit, offset } = req.query;
    const query = { userId: req.user.id };
    if (status) query.status = status;
    
    const lim = Math.min(parseInt(limit) || 20, 100);
    const off = parseInt(offset) || 0;
    
    const [orders, total] = await Promise.all([
      Order.find(query).sort({ createdAt: -1 }).limit(lim).skip(off),
      Order.countDocuments(query),
    ]);
    
    res.json({
      success: true,
      data: { orders, total, limit: lim, offset: off },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Get user's invoices (alias to invoices route)
 * GET /api/v1/users/invoices
 */
export async function getUserInvoices(req, res, next) {
  try {
    const { status, limit, offset, overdue } = req.query;
    const query = { userId: req.user.id };
    if (status) query.status = status;
    if (overdue === 'true') {
      query.status = 'pending';
      query.dueDate = { $lt: new Date() };
    }
    
    const lim = Math.min(parseInt(limit) || 20, 100);
    const off = parseInt(offset) || 0;
    
    const [invoices, total] = await Promise.all([
      Invoice.find(query).sort({ issueDate: -1 }).limit(lim).skip(off),
      Invoice.countDocuments(query),
    ]);
    
    res.json({
      success: true,
      data: { invoices, total, limit: lim, offset: off },
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
  getProfile,
  updateProfile,
  changePassword,
  getDashboard,
  getUserDomains,
  getUserOrders,
  getUserInvoices,
  validate,
  schemas: {
    updateProfile: updateProfileSchema,
    changePassword: changePasswordSchema,
  },
};