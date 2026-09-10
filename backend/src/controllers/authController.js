import { authService } from '../services/AuthService.js';
import { z } from 'zod';

// Validation schemas
const registerSchema = z.object({
  body: z.object({
    email: z.string().email('Invalid email address'),
    password: z.string().min(8, 'Password must be at least 8 characters'),
    firstName: z.string().min(1, 'First name is required').max(50),
    lastName: z.string().min(1, 'Last name is required').max(50),
  }),
});

const loginSchema = z.object({
  body: z.object({
    email: z.string().email('Invalid email address'),
    password: z.string().min(1, 'Password is required'),
  }),
});

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
 * Register a new user
 * POST /api/v1/auth/register
 */
export async function register(req, res, next) {
  try {
    const result = await authService.register(req.body);
    
    res.status(201).json({
      success: true,
      message: 'Registration successful',
      data: result,
    });
  } catch (error) {
    if (error.message === 'Email already registered') {
      return res.status(409).json({
        success: false,
        error: { message: error.message, code: 'EMAIL_EXISTS' },
      });
    }
    next(error);
  }
}

/**
 * Login user
 * POST /api/v1/auth/login
 */
export async function login(req, res, next) {
  try {
    const { user } = await authService.login(req.body.email, req.body.password, req);
    
    res.json({
      success: true,
      message: 'Login successful',
      data: { user },
    });
  } catch (error) {
    const statusCode = error.message.includes('locked') ? 423 : 401;
    res.status(statusCode).json({
      success: false,
      error: { message: error.message, code: 'INVALID_CREDENTIALS' },
    });
  }
}

/**
 * Logout user
 * POST /api/v1/auth/logout
 */
export async function logout(req, res, next) {
  try {
    await authService.logout(req);
    
    res.clearCookie(process.env.SESSION_COOKIE_NAME || 'dr_session');
    
    res.json({
      success: true,
      message: 'Logged out successfully',
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Get current user
 * GET /api/v1/auth/me
 */
export async function getMe(req, res, next) {
  try {
    const user = await authService.getCurrentUser(req);
    
    if (!user) {
      return res.status(401).json({
        success: false,
        error: { message: 'Not authenticated', code: 'NOT_AUTHENTICATED' },
      });
    }
    
    res.json({
      success: true,
      data: { user },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Update user profile
 * PUT /api/v1/auth/profile
 */
export async function updateProfile(req, res, next) {
  try {
    const user = await authService.updateProfile(req.user.id, req.body);
    
    res.json({
      success: true,
      message: 'Profile updated successfully',
      data: { user },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Change password
 * PUT /api/v1/auth/password
 */
export async function changePassword(req, res, next) {
  try {
    const result = await authService.changePassword(
      req.user.id,
      req.body.currentPassword,
      req.body.newPassword
    );
    
    res.json({
      success: true,
      message: result.message,
    });
  } catch (error) {
    const statusCode = error.message === 'Current password is incorrect' ? 400 : 500;
    res.status(statusCode).json({
      success: false,
      error: { message: error.message, code: 'PASSWORD_CHANGE_FAILED' },
    });
  }
}

// Validation middleware factory
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
  register,
  login,
  logout,
  getMe,
  updateProfile,
  changePassword,
  validate,
  schemas: {
    register: registerSchema,
    login: loginSchema,
    updateProfile: updateProfileSchema,
    changePassword: changePasswordSchema,
  },
};
