import express from 'express';
import passport from 'passport';

const router = express.Router();

function getBaseUrl(req) {
  if (process.env.FRONTEND_URL) return process.env.FRONTEND_URL;
  const proto = req.get('x-forwarded-proto') || req.protocol;
  const host = req.get('x-forwarded-host') || req.get('host');
  return `${proto}://${host}`;
}

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
    failureRedirect: '/login.html?error=oauth_failed',
    failureMessage: true,
  }),
  (req, res) => {
    const baseUrl = getBaseUrl(req);
    res.redirect(`${baseUrl}/index.html?oauth=success`);
  }
);

// ─── Apple OAuth (placeholder) ─────────────────────────
router.get('/apple', (req, res) => {
  const baseUrl = getBaseUrl(req);
  res.redirect(`${baseUrl}/login.html?error=apple_not_configured`);
});

export default router;
