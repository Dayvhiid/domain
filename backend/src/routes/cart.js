import express from 'express';
import cartController from '../controllers/cartController.js';
import { optionalAuth } from '../middleware/auth.js';

const router = express.Router();

const { 
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
  schemas,
} = cartController;

// Cart routes use optional auth (works for guests and logged-in users)
router.use(optionalAuth);

router.get('/', getCart);
router.post('/items', validate(schemas.addItem), addItem);
router.delete('/items/:domainName', removeItem);
router.put('/items/:domainName/years', validate(schemas.updateYears), updateItemYears);
router.put('/items/:domainName/options', validate(schemas.updateOptions), updateItemOptions);
router.delete('/', clearCart);
router.post('/coupon', validate(schemas.coupon), applyCoupon);
router.delete('/coupon', removeCoupon);
router.get('/checkout-summary', getCheckoutSummary);

export default router;