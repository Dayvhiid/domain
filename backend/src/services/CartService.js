import { Cart } from '../models/Cart.js';
import { Domain } from '../models/Domain.js';

class CartService {
  /**
   * Get cart for user or session
   */
  async getCart(userId, sessionId) {
    return Cart.findOrCreate(userId, sessionId);
  }
  
  /**
   * Add item to cart
   */
  async addItem(userId, sessionId, itemData) {
    const cart = await this.getCart(userId, sessionId);
    
    // Check availability if not provided
    if (!itemData.availability || itemData.availability.status === 'unknown') {
      // Could check availability here
      itemData.availability = {
        status: 'available',
        checkedAt: new Date(),
      };
    }
    
    await cart.addItem(itemData);
    return cart;
  }
  
  /**
   * Remove item from cart
   */
  async removeItem(userId, sessionId, fullDomainName) {
    const cart = await this.getCart(userId, sessionId);
    await cart.removeItem(fullDomainName);
    return cart;
  }
  
  /**
   * Update item years
   */
  async updateItemYears(userId, sessionId, fullDomainName, years) {
    const cart = await this.getCart(userId, sessionId);
    await cart.updateItemYears(fullDomainName, years);
    return cart;
  }
  
  /**
   * Update item options
   */
  async updateItemOptions(userId, sessionId, fullDomainName, options) {
    const cart = await this.getCart(userId, sessionId);
    await cart.updateItemOptions(fullDomainName, options);
    return cart;
  }
  
  /**
   * Clear cart
   */
  async clearCart(userId, sessionId) {
    const cart = await this.getCart(userId, sessionId);
    await cart.clear();
    return cart;
  }
  
  /**
   * Apply coupon
   */
  async applyCoupon(userId, sessionId, couponData) {
    const cart = await this.getCart(userId, sessionId);
    await cart.applyCoupon(couponData);
    return cart;
  }
  
  /**
   * Remove coupon
   */
  async removeCoupon(userId, sessionId) {
    const cart = await this.getCart(userId, sessionId);
    await cart.removeCoupon();
    return cart;
  }
  
  /**
   * Merge session cart to user cart (on login)
   */
  async mergeCarts(userId, sessionId) {
    return Cart.mergeCarts(userId, sessionId);
  }
  
  /**
   * Get cart summary for checkout
   */
  async getCheckoutSummary(userId, sessionId) {
    const cart = await this.getCart(userId, sessionId);
    
    // Validate all items still available
    const validatedItems = [];
    for (const item of cart.items) {
      // Could check real-time availability here
      validatedItems.push({
        ...item.toObject(),
        available: item.availability?.status !== 'taken',
      });
    }
    
    return {
      items: validatedItems,
      subtotal: cart.subtotal,
      discount: 0, // Calculate from coupon
      tax: 0, // Calculate based on location
      total: cart.total,
      currency: cart.items[0]?.price?.currency || 'USD',
      itemCount: cart.itemCount,
    };
  }
  
  /**
   * Convert cart to order items
   */
  async cartToOrderItems(userId, sessionId) {
    const cart = await this.getCart(userId, sessionId);
    
    return cart.items.map(item => ({
      domainName: item.domainName,
      extension: item.extension,
      fullDomainName: item.fullDomainName,
      price: item.price,
      years: item.years,
      operation: 'register',
      options: item.options,
    }));
  }
}

export const cartService = new CartService();
export default cartService;