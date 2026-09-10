import express from 'express';
import orderController from '../controllers/orderController.js';
import { requireAuth } from '../middleware/auth.js';

const router = express.Router();

const { 
  createOrder,
  getOrder,
  getOrderByNumber,
  listOrders,
  initiatePayment,
  cancelOrder,
  validate,
  schemas,
} = orderController;

// All order routes require authentication
router.use(requireAuth);

router.post('/', validate(schemas.createOrder), createOrder);
router.get('/', validate(schemas.listOrders), listOrders);
router.get('/:id', getOrder);
router.get('/number/:orderNumber', getOrderByNumber);
router.post('/:id/pay', validate(schemas.initiatePayment), initiatePayment);
router.post('/:id/cancel', validate(schemas.cancelOrder), cancelOrder);

export default router;