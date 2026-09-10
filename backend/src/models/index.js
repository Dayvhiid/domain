/**
 * Models Index - Export all models
 */

export { User } from './User.js';
export { Domain } from './Domain.js';
export { Contact } from './Contact.js';
export { NameserverGroup } from './Nameserver.js';
export { Cart } from './Cart.js';
export { Order } from './Order.js';
export { Invoice } from './Invoice.js';

/**
 * Initialize all models (ensures indexes are created)
 */
import mongoose from 'mongoose';

export async function initModels() {
  // This ensures all models are registered with Mongoose
  const models = [
    'User', 'Domain', 'Contact', 'NameserverGroup', 'Cart', 'Order', 'Invoice'
  ];
  
  for (const modelName of models) {
    if (!mongoose.models[modelName]) {
      console.warn(`Model ${modelName} not registered`);
    }
  }
  
  console.log('All models initialized');
  return true;
}

export default {
  User,
  Domain,
  Contact,
  NameserverGroup,
  Cart,
  Order,
  Invoice,
  initModels,
};