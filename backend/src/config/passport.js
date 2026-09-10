import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { User } from '../models/User.js';

export function configurePassport() {
  // Only configure Google strategy if credentials are provided
  if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
    passport.use(new GoogleStrategy({
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: process.env.GOOGLE_CALLBACK_URL || '/api/v1/auth/oauth/google/callback',
      scope: ['profile', 'email'],
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        const { id: googleId, emails, displayName, photos } = profile;
        const email = emails?.[0]?.value;
        
        if (!email) {
          return done(new Error('No email found in Google profile'), null);
        }
        
        // Find or create user
        let user = await User.findOne({ googleId });
        
        if (!user) {
          user = await User.findByEmail(email);
          
          if (user) {
            // Link Google to existing account
            user.googleId = googleId;
            user.authProvider = 'google';
            if (photos?.[0]?.value) user.avatar = photos[0].value;
            await user.save();
          } else {
            // Create new user
            const nameParts = (displayName || '').split(' ');
            user = await User.create({
              email: email.toLowerCase(),
              firstName: nameParts[0] || 'User',
              lastName: nameParts.slice(1).join(' ') || '',
              googleId,
              authProvider: 'google',
              avatar: photos?.[0]?.value,
              emailVerified: true,
              role: 'user',
            });
          }
        }
        
        return done(null, user);
      } catch (error) {
        return done(error, null);
      }
    }));
    
    console.log('Google OAuth strategy configured');
  } else {
    console.log('Google OAuth disabled — set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET to enable');
  }
  
  // Serialize user to session
  passport.serializeUser((user, done) => {
    done(null, user._id);
  });
  
  // Deserialize user from session
  passport.deserializeUser(async (id, done) => {
    try {
      const user = await User.findById(id);
      done(null, user || false);
    } catch (error) {
      done(error, false);
    }
  });
  
  return passport;
}

export default configurePassport;
