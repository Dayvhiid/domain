import { User } from '../models/User.js';

/**
 * Authentication middleware - requires valid session
 */
export async function requireAuth(req, res, next) {
  try {
    const userId = req.session?.userId;
    
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: { message: 'Authentication required', code: 'UNAUTHORIZED' },
      });
    }
    
    const user = await User.findById(userId);
    
    if (!user || !user.isActive) {
      req.session.destroy();
      return res.status(401).json({
        success: false,
        error: { message: 'User not found or deactivated', code: 'USER_NOT_FOUND' },
      });
    }
    
    req.user = user;
    next();
  } catch (error) {
    next(error);
  }
}

/**
 * Optional authentication - attaches user if session exists
 */
export async function optionalAuth(req, res, next) {
  try {
    const userId = req.session?.userId;
    
    if (userId) {
      const user = await User.findById(userId);
      if (user && user.isActive) {
        req.user = user;
      }
    }
    
    next();
  } catch (error) {
    next(error);
  }
}

/**
 * Admin only middleware
 */
export function requireAdmin(req, res, next) {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      error: { message: 'Authentication required', code: 'UNAUTHORIZED' },
    });
  }
  
  if (req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      error: { message: 'Admin access required', code: 'FORBIDDEN' },
    });
  }
  
  next();
}

/**
 * Reseller or admin middleware
 */
export function requireReseller(req, res, next) {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      error: { message: 'Authentication required', code: 'UNAUTHORIZED' },
    });
  }
  
  if (!['admin', 'reseller'].includes(req.user.role)) {
    return res.status(403).json({
      success: false,
      error: { message: 'Reseller access required', code: 'FORBIDDEN' },
    });
  }
  
  next();
}

/**
 * Validate session ownership of resource
 */
export function validateOwnership(resourceUserIdField = 'userId') {
  return (req, res, next) => {
    const resourceUserId = req.resource?.[resourceUserIdField] || req.params[resourceUserIdField];
    
    if (!resourceUserId) {
      return next();
    }
    
    if (req.user.role === 'admin') {
      return next();
    }
    
    if (resourceUserId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        error: { message: 'Access denied', code: 'FORBIDDEN' },
      });
    }
    
    next();
  };
}

export default {
  requireAuth,
  optionalAuth,
  requireAdmin,
  requireReseller,
  validateOwnership,
};
