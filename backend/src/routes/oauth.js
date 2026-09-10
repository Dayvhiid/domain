import express from 'express';
import passport from 'passport';

const router = express.Router();

const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3001';

// ─── Google OAuth ──────────────────────────────────────

// Step 1: Redirect to Google for authentication
router.get('/google', (req, res, next) => {
  passport.authenticate('google', {
    scope: ['profile', 'email'],
    prompt: 'select_account',
  })(req, res, next);
});

// Step 2: Google redirects back here with the auth code
router.get('/google/callback',
  passport.authenticate('google', {
    failureRedirect: `${FRONTEND_URL}/login.html?error=oauth_failed`,
    failureMessage: true,
  }),
  (req, res) => {
    // Passport deserialized the user and session is set
    // Redirect to frontend — the JS will call GET /auth/me
    res.redirect(`${FRONTEND_URL}/index.html?oauth=success`);
  }
);

// ─── Apple OAuth (placeholder) ─────────────────────────
router.get('/apple', (req, res) => {
  res.redirect(`${FRONTEND_URL}/login.html?error=apple_not_configured`);
});

export default router;
