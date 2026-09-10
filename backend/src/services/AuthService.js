import { User } from '../models/User.js';

class AuthService {
  /**
   * Register a new user
   */
  async register(userData) {
    const { email, password, firstName, lastName } = userData;
    
    const existingUser = await User.findByEmail(email);
    if (existingUser) {
      throw new Error('Email already registered');
    }
    
    const user = await User.create({
      email: email.toLowerCase(),
      passwordHash: password,
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      role: 'user',
    });
    
    return this.sanitizeUser(user);
  }
  
  /**
   * Login user with email and password
   */
  async login(email, password, req) {
    const user = await User.findOne({ email: email.toLowerCase() }).select('+passwordHash +loginAttempts +lockUntil');
    
    if (!user) {
      throw new Error('Invalid credentials');
    }
    
    if (user.isLocked) {
      throw new Error('Account temporarily locked due to too many failed attempts');
    }
    
    if (!user.isActive) {
      throw new Error('Account is deactivated');
    }
    
    if (!user.passwordHash) {
      throw new Error('Invalid credentials');
    }
    
    const isMatch = await user.comparePassword(password);
    
    if (!isMatch) {
      await user.incrementLoginAttempts();
      throw new Error('Invalid credentials');
    }
    
    await user.resetLoginAttempts();
    
    user.lastLoginAt = new Date();
    user.lastLoginIp = req.ip || req.connection?.remoteAddress;
    await user.save();
    
    // Create session
    req.session.userId = user._id;
    
    return {
      user: this.sanitizeUser(user),
    };
  }
  
  /**
   * Logout user
   */
  async logout(req) {
    return new Promise((resolve, reject) => {
      req.session.destroy((err) => {
        if (err) reject(err);
        else resolve({ message: 'Logged out successfully' });
      });
    });
  }
  
  /**
   * Get current user from session
   */
  async getCurrentUser(req) {
    if (!req.session?.userId) {
      return null;
    }
    
    const user = await User.findById(req.session.userId);
    if (!user || !user.isActive) {
      return null;
    }
    
    return this.sanitizeUser(user);
  }
  
  /**
   * Update user profile
   */
  async updateProfile(userId, updates) {
    const allowedFields = ['firstName', 'lastName', 'preferences'];
    const updateData = {};
    
    for (const field of allowedFields) {
      if (updates[field] !== undefined) {
        updateData[field] = updates[field];
      }
    }
    
    const user = await User.findByIdAndUpdate(
      userId,
      { $set: updateData },
      { new: true, runValidators: true }
    );
    
    if (!user) {
      throw new Error('User not found');
    }
    
    return this.sanitizeUser(user);
  }
  
  /**
   * Change password
   */
  async changePassword(userId, currentPassword, newPassword) {
    const user = await User.findById(userId).select('+passwordHash');
    
    if (!user) {
      throw new Error('User not found');
    }
    
    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      throw new Error('Current password is incorrect');
    }
    
    user.passwordHash = newPassword;
    await user.save();
    
    return { message: 'Password changed successfully' };
  }
  
  /**
   * Find or create user from Google OAuth profile
   */
  async findOrCreateGoogleUser(profile, req) {
    const { id: googleId, emails, displayName, photos } = profile;
    const email = emails?.[0]?.value;
    
    if (!email) {
      throw new Error('No email found in Google profile');
    }
    
    // Check if user already exists by googleId
    let user = await User.findOne({ googleId });
    
    if (user) {
      // Update last login
      user.lastLoginAt = new Date();
      user.lastLoginIp = req.ip || req.connection?.remoteAddress;
      await user.save();
      
      req.session.userId = user._id;
      return { user: this.sanitizeUser(user), isNewUser: false };
    }
    
    // Check if user exists by email
    user = await User.findByEmail(email);
    
    if (user) {
      // Link Google account to existing user
      user.googleId = googleId;
      user.authProvider = 'google';
      if (photos?.[0]?.value) user.avatar = photos[0].value;
      user.lastLoginAt = new Date();
      user.lastLoginIp = req.ip || req.connection?.remoteAddress;
      await user.save();
      
      req.session.userId = user._id;
      return { user: this.sanitizeUser(user), isNewUser: false };
    }
    
    // Create new user
    const nameParts = (displayName || '').split(' ');
    const firstName = nameParts[0] || 'User';
    const lastName = nameParts.slice(1).join(' ') || '';
    
    user = await User.create({
      email: email.toLowerCase(),
      firstName: firstName.trim(),
      lastName: lastName.trim() || 'User',
      googleId,
      authProvider: 'google',
      avatar: photos?.[0]?.value,
      emailVerified: true, // Google emails are verified
      role: 'user',
    });
    
    req.session.userId = user._id;
    return { user: this.sanitizeUser(user), isNewUser: true };
  }
  
  /**
   * Sanitize user object for response
   */
  sanitizeUser(user) {
    const obj = user.toObject ? user.toObject() : user;
    const { 
      passwordHash, 
      emailVerificationToken,
      emailVerificationExpires,
      passwordResetToken,
      passwordResetExpires,
      loginAttempts,
      lockUntil,
      ...sanitized 
    } = obj;
    return sanitized;
  }
}

export const authService = new AuthService();
export default authService;
