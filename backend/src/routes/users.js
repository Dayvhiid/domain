import express from 'express';
import userController from '../controllers/userController.js';
import { requireAuth } from '../middleware/auth.js';

const router = express.Router();

const { 
  getProfile,
  updateProfile,
  changePassword,
  getDashboard,
  getUserDomains,
  getUserOrders,
  getUserInvoices,
  validate,
  schemas,
} = userController;

// All user routes require authentication
router.use(requireAuth);

router.get('/profile', getProfile);
router.put('/profile', validate(schemas.updateProfile), updateProfile);
router.put('/password', validate(schemas.changePassword), changePassword);
router.get('/dashboard', getDashboard);
router.get('/domains', getUserDomains);
router.get('/orders', getUserOrders);
router.get('/invoices', getUserInvoices);

export default router;