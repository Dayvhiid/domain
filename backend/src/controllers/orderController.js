import { orderService } from '../services/OrderService.js';
import { z } from 'zod';

const createOrderSchema = z.object({
  body: z.object({
    paymentProvider: z.enum(['paystack', 'flutterwave', 'payfast', 'manual']).default('manual'),
  }),
});

const initiatePaymentSchema = z.object({
  params: z.object({
    id: z.string().min(1),
  }),
});

const listOrdersSchema = z.object({
  query: z.object({
    status: z.string().optional(),
    limit: z.coerce.number().int().min(1).max(100).default(20),
    offset: z.coerce.number().int().min(0).default(0),
  }),
});

const cancelOrderSchema = z.object({
  body: z.object({
    reason: z.string().optional(),
  }),
  params: z.object({
    id: z.string().min(1),
  }),
});

/**
 * Create order from cart
 * POST /api/v1/orders
 */
export async function createOrder(req, res, next) {
  try {
    const { paymentProvider } = req.body;
    const userId = req.user.id;
    const sessionId = req.sessionID;
    
    const order = await orderService.createOrder(userId, sessionId, paymentProvider);
    
    res.status(201).json({
      success: true,
      message: 'Order created successfully',
      data: order,
    });
  } catch (error) {
    const statusCode = error.message === 'Cart is empty' ? 400 : 500;
    res.status(statusCode).json({
      success: false,
      error: { message: error.message, code: 'CREATE_FAILED' },
    });
  }
}

/**
 * Get order by ID
 * GET /api/v1/orders/:id
 */
export async function getOrder(req, res, next) {
  try {
    const { id } = req.params;
    const order = await orderService.getOrder(req.user.id, id);
    
    res.json({
      success: true,
      data: order,
    });
  } catch (error) {
    const statusCode = error.message === 'Order not found' ? 404 : 500;
    res.status(statusCode).json({
      success: false,
      error: { message: error.message, code: 'NOT_FOUND' },
    });
  }
}

/**
 * Get order by order number
 * GET /api/v1/orders/number/:orderNumber
 */
export async function getOrderByNumber(req, res, next) {
  try {
    const { orderNumber } = req.params;
    const order = await orderService.getOrderByNumber(req.user.id, orderNumber);
    
    res.json({
      success: true,
      data: order,
    });
  } catch (error) {
    const statusCode = error.message === 'Order not found' ? 404 : 500;
    res.status(statusCode).json({
      success: false,
      error: { message: error.message, code: 'NOT_FOUND' },
    });
  }
}

/**
 * List user's orders
 * GET /api/v1/orders
 */
export async function listOrders(req, res, next) {
  try {
    const { status, limit, offset } = req.query;
    
    const result = await orderService.listOrders(req.user.id, {
      status,
      limit: parseInt(limit),
      offset: parseInt(offset),
    });
    
    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Initiate payment for order
 * POST /api/v1/orders/:id/pay
 */
export async function initiatePayment(req, res, next) {
  try {
    const { id } = req.params;
    const paymentData = await orderService.initiatePayment(id);
    
    res.json({
      success: true,
      message: 'Payment initiated',
      data: paymentData,
    });
  } catch (error) {
    const statusCode = error.message === 'Order not found' ? 404 : 
                       error.message.includes('cannot be paid') ? 400 : 500;
    res.status(statusCode).json({
      success: false,
      error: { message: error.message, code: 'PAYMENT_FAILED' },
    });
  }
}

/**
 * Cancel order
 * POST /api/v1/orders/:id/cancel
 */
export async function cancelOrder(req, res, next) {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    
    const order = await orderService.cancelOrder(req.user.id, id, reason || 'Cancelled by user');
    
    res.json({
      success: true,
      message: 'Order cancelled',
      data: order,
    });
  } catch (error) {
    const statusCode = error.message === 'Order not found' ? 404 :
                       error.message.includes('cannot be cancelled') ? 400 : 500;
    res.status(statusCode).json({
      success: false,
      error: { message: error.message, code: 'CANCEL_FAILED' },
    });
  }
}

// Validation middleware
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
  createOrder,
  getOrder,
  getOrderByNumber,
  listOrders,
  initiatePayment,
  cancelOrder,
  validate,
  schemas: {
    createOrder: createOrderSchema,
    initiatePayment: initiatePaymentSchema,
    listOrders: listOrdersSchema,
    cancelOrder: cancelOrderSchema,
  },
};