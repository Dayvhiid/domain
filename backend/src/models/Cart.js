import mongoose from 'mongoose';

const cartItemSchema = new mongoose.Schema({
  domainName: { type: String, required: true, lowercase: true, trim: true },
  extension: { type: String, required: true, lowercase: true, trim: true },
  fullDomainName: { type: String, required: true, lowercase: true, trim: true },
  price: {
    registration: { type: Number, required: true },
    renewal: { type: Number, required: true },
    transfer: Number,
    currency: { type: String, default: 'USD' },
  },
  years: { type: Number, required: true, min: 1, max: 10, default: 1 },
  options: {
    whoisPrivacy: { type: Boolean, default: true },
    autoRenew: { type: Boolean, default: true },
    nameserverGroup: { type: String, trim: true },
    nameservers: [{
      hostname: String,
      ipv4: String,
      ipv6: String,
    }],
    contacts: {
      registrant: { type: mongoose.Schema.Types.ObjectId, ref: 'Contact' },
      admin: { type: mongoose.Schema.Types.ObjectId, ref: 'Contact' },
      tech: { type: mongoose.Schema.Types.ObjectId, ref: 'Contact' },
      billing: { type: mongoose.Schema.Types.ObjectId, ref: 'Contact' },
    },
  },
  availability: {
    status: { type: String, enum: ['available', 'taken', 'premium', 'reserved', 'unknown'], default: 'unknown' },
    checkedAt: Date,
    premiumPrice: Number,
  },
  addedAt: { type: Date, default: Date.now },
  metadata: mongoose.Schema.Types.Mixed,
}, { _id: false });

const cartSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    sparse: true,
    index: true,
  },
  sessionId: {
    type: String,
    sparse: true,
    index: true,
  },
  items: [cartItemSchema],
  coupon: {
    code: String,
    discountType: { type: String, enum: ['percentage', 'fixed'] },
    discountValue: Number,
    expiresAt: Date,
  },
  notes: String,
  metadata: mongoose.Schema.Types.Mixed,
}, {
  timestamps: true,
  toJSON: {
    virtuals: true,
    transform: function(doc, ret) {
      ret.id = ret._id;
      delete ret._id;
      delete ret.__v;
      return ret;
    },
  },
});

cartSchema.virtual('itemCount').get(function() {
  return this.items.length;
});

cartSchema.virtual('subtotal').get(function() {
  return this.items.reduce((sum, item) => {
    return sum + (item.price.registration * item.years);
  }, 0);
});

cartSchema.virtual('total').get(function() {
  let total = this.subtotal;
  if (this.coupon && this.coupon.code && this.coupon.discountValue) {
    const now = new Date();
    if (!this.coupon.expiresAt || this.coupon.expiresAt > now) {
      if (this.coupon.discountType === 'percentage') {
        total -= total * (this.coupon.discountValue / 100);
      } else {
        total -= this.coupon.discountValue;
      }
    }
  }
  return Math.max(0, total);
});

cartSchema.methods.addItem = function(itemData) {
  const existingIndex = this.items.findIndex(
    item => item.fullDomainName === itemData.fullDomainName
  );
  if (existingIndex >= 0) {
    throw new Error('Domain already in cart');
  }
  this.items.push({ ...itemData, addedAt: new Date() });
  return this.save();
};

cartSchema.methods.removeItem = function(fullDomainName) {
  this.items = this.items.filter(item => item.fullDomainName !== fullDomainName);
  return this.save();
};

cartSchema.methods.updateItemYears = function(fullDomainName, years) {
  const item = this.items.find(item => item.fullDomainName === fullDomainName);
  if (item) {
    item.years = Math.max(1, Math.min(10, parseInt(years) || 1));
  }
  return this.save();
};

cartSchema.methods.updateItemOptions = function(fullDomainName, options) {
  const item = this.items.find(item => item.fullDomainName === fullDomainName);
  if (item) {
    item.options = { ...item.options, ...options };
  }
  return this.save();
};

cartSchema.methods.clear = function() {
  this.items = [];
  this.coupon = null;
  return this.save();
};

cartSchema.methods.applyCoupon = function(couponData) {
  this.coupon = couponData;
  return this.save();
};

cartSchema.methods.removeCoupon = function() {
  this.coupon = null;
  return this.save();
};

cartSchema.statics.findOrCreate = async function(userId, sessionId) {
  const query = userId ? { userId } : { sessionId };
  let cart = await this.findOne(query);
  if (!cart) {
    cart = await this.create(query);
  }
  return cart;
};

cartSchema.statics.mergeCarts = async function(userId, sessionId) {
  const sessionCart = await this.findOne({ sessionId });
  if (!sessionCart || sessionCart.items.length === 0) return null;
  const userCart = await this.findOrCreate(userId);
  for (const item of sessionCart.items) {
    try { await userCart.addItem(item); } catch (error) { /* skip */ }
  }
  await sessionCart.deleteOne();
  return userCart;
};

cartSchema.index({ userId: 1 });
cartSchema.index({ sessionId: 1 });
cartSchema.index({ updatedAt: 1 }, { expireAfterSeconds: 30 * 24 * 60 * 60 });

export const Cart = mongoose.model('Cart', cartSchema);
export default Cart;