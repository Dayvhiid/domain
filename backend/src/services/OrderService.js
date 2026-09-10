import { Order } from '../models/Order.js';
import { Cart } from '../models/Cart.js';
import { cartService } from './CartService.js';
import { domainsClient } from './DomainsClient.js';
import { Domain } from '../models/Domain.js';

class OrderService {
  /**
   * Create order from cart
   */
  async createOrder(userId, sessionId, paymentProvider = 'manual') {
    const cart = await cartService.getCart(userId, sessionId);
    
    if (cart.items.length === 0) {
      throw new Error('Cart is empty');
    }
    
    const orderItems = await cartService.cartToOrderItems(userId, sessionId);
    
    const subtotal = orderItems.reduce((sum, item) => sum + (item.price.registration * item.years), 0);
    const tax = 0;
    const total = subtotal + tax;
    
    const order = await Order.create({
      userId,
      items: orderItems,
      subtotal,
      tax,
      total,
      currency: 'ZAR',
      status: 'pending',
      paymentProvider,
    });
    
    await cartService.clearCart(userId, sessionId);
    
    return order;
  }
  
  /**
   * Get order by ID
   */
  async getOrder(userId, orderId) {
    const order = await Order.findOne({ _id: orderId, userId });
    if (!order) throw new Error('Order not found');
    return order;
  }
  
  /**
   * Get order by order number
   */
  async getOrderByNumber(userId, orderNumber) {
    const order = await Order.findOne({ orderNumber, userId });
    if (!order) throw new Error('Order not found');
    return order;
  }
  
  /**
   * List user's orders
   */
  async listOrders(userId, filters = {}) {
    const query = { userId };
    if (filters.status) query.status = filters.status;
    
    const limit = Math.min(filters.limit || 20, 100);
    const offset = filters.offset || 0;
    const sort = filters.sort || { createdAt: -1 };
    
    const [orders, total] = await Promise.all([
      Order.find(query).sort(sort).limit(limit).skip(offset),
      Order.countDocuments(query),
    ]);
    
    return { orders, total, limit, offset };
  }
  
  /**
   * Mark order as paid
   */
  async markOrderPaid(orderId, paymentData) {
    const order = await Order.findById(orderId);
    if (!order) throw new Error('Order not found');
    
    if (order.status !== 'pending' && order.status !== 'payment_initiated') {
      throw new Error('Order cannot be marked as paid in current status');
    }
    
    await order.markPaid(paymentData);
    return order;
  }
  
  /**
   * Initiate payment for order
   */
  async initiatePayment(orderId) {
    const order = await Order.findById(orderId);
    if (!order) throw new Error('Order not found');
    
    if (order.status !== 'pending') {
      throw new Error('Order cannot be paid in current status');
    }
    
    order.status = 'payment_initiated';
    await order.save();
    
    return {
      orderId: order._id,
      orderNumber: order.orderNumber,
      amount: order.total,
      currency: order.currency,
      paymentProvider: order.paymentProvider,
    };
  }
  
  /**
   * Process order provisioning (register domains via Domains.co.za)
   */
  async processOrderProvisioning(orderId) {
    const order = await Order.findById(orderId);
    if (!order) throw new Error('Order not found');
    
    if (order.status !== 'paid') {
      throw new Error('Order must be paid before provisioning');
    }
    
    await order.startProvisioning();
    await domainsClient.initialize();
    
    const results = [];
    const errors = [];
    
    for (let i = 0; i < order.items.length; i++) {
      const item = order.items[i];
      
      try {
        let registrarResult;
        
        if (item.operation === 'register') {
          const regParams = {
            sld: item.domainName,
            tld: item.extension.replace(/^\./, ''),
            period: item.years,
            dns: 'managed',
          };

          // Apply nameservers if provided
          if (item.options?.nameservers?.length > 0) {
            regParams.dns = 'custom';
            item.options.nameservers.slice(0, 5).forEach((ns, idx) => {
              regParams[`ns${idx + 1}`] = ns.hostname || ns;
            });
          }

          registrarResult = await domainsClient.registerDomain(regParams);
          
        } else if (item.operation === 'transfer') {
          const transferParams = {
            sld: item.domainName,
            tld: item.extension.replace(/^\./, ''),
            eppKey: item.options.authCode || '',
            dns: 'keep',
          };

          registrarResult = await domainsClient.transferDomain(transferParams);
          
        } else if (item.operation === 'renew') {
          throw new Error('Renewal via order not yet implemented');
        }
        
        results.push({
          index: i,
          domainName: item.fullDomainName,
          domainId: null,
          registrarResult: registrarResult,
        });
        
      } catch (error) {
        errors.push({
          index: i,
          domainName: item.fullDomainName,
          error: error.message,
        });
      }
    }
    
    if (errors.length > 0 && results.length === 0) {
      await order.failProvisioning(errors.map(e => e.error));
      throw new Error('All domain provisioning failed');
    } else if (errors.length > 0) {
      await order.completeProvisioning(results);
      return { order, results, errors, partial: true };
    } else {
      await order.completeProvisioning(results);
      
      // Create local Domain records
      for (const result of results) {
        const item = order.items[result.index];
        const tld = item.extension.replace(/^\./, '');
        
        await Domain.create({
          userId: order.userId,
          domainName: item.domainName,
          extension: `.${tld}`,
          fullDomainName: item.fullDomainName,
          status: result.registrarResult?.intReturnCode === 1 ? 'active' : 'pending',
          price: item.price,
          autoRenew: item.options?.autoRenew ?? true,
          whoisPrivacy: item.options?.whoisPrivacy ?? true,
          orderId: order._id,
        });
      }
      
      return { order, results, errors: [], partial: false };
    }
  }
  
  /**
   * Cancel order
   */
  async cancelOrder(userId, orderId, reason = 'Cancelled by user') {
    const order = await Order.findOne({ _id: orderId, userId });
    if (!order) throw new Error('Order not found');
    
    if (!order.canCancel) {
      throw new Error('Order cannot be cancelled in current status');
    }
    
    await order.cancel(reason);
    return order;
  }
}

export const orderService = new OrderService();
export default orderService;
