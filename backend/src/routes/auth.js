import express from 'express';
import authController from '../controllers/authController.js';
import { requireAuth } from '../middleware/auth.js';

const router = express.Router();

const { 
  register, 
  login, 
  logout, 
  getMe, 
  updateProfile, 
  changePassword, 
  validate,
  schemas 
} = authController;

// Public routes
router.post('/register', validate(schemas.register), register);
router.post('/login', validate(schemas.login), login);
router.post('/logout', logout);

// Protected routes
router.get('/me', requireAuth, getMe);
router.put('/profile', requireAuth, validate(schemas.updateProfile), updateProfile);
router.put('/password', requireAuth, validate(schemas.changePassword), changePassword);

export default router;
