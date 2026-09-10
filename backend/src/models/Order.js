import mongoose from 'mongoose';

const orderItemSchema = new mongoose.Schema({
  domainName: { type: String, required: true, lowercase: true, trim: true },
  extension: { type: String, required: true, lowercase: true, trim: true },
  fullDomainName: { type: String, required: true, lowercase: true, trim: true },
  price: {
    registration: { type: Number, required: true },
    renewal: { type: Number, required: true },
    transfer: Number,
  currency: { type: String, default: 'ZAR' },
  },
  years: { type: Number, required: true, min: 1, max: 10, default: 1 },
  operation: { type: String, enum: ['register', 'transfer', 'renew'], required: true },
  options: {
    whoisPrivacy: { type: Boolean, default: true },
    autoRenew: { type: Boolean, default: true },
    nameserverGroup: String,
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
  registrarOrderId: String,
  registrarDomainId: String,
  status: {
    type: String,
    enum: ['pending', 'provisioning', 'completed', 'failed', 'cancelled'],
    default: 'pending',
  },
  error: String,
}, { _id: false });

const orderSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  orderNumber: {
    type: String,
    required: true,
    unique: true,
    index: true,
  },
  items: [orderItemSchema],
  // Pricing
  subtotal: { type: Number, required: true, default: 0 },
  tax: { type: Number, default: 0 },
  discount: { type: Number, default: 0 },
  total: { type: Number, required: true, default: 0 },
  currency: { type: String, default: 'USD' },
  // Status
  status: {
    type: String,
    enum: [
      'pending',
      'payment_initiated',
      'paid',
      'provisioning',
      'completed',
      'failed',
      'cancelled',
      'refunded',
    ],
    default: 'pending',
    index: true,
  },
  // Payment
  paymentProvider: { type: String, enum: ['paystack', 'flutterwave', 'payfast', 'manual'] },
  paymentReference: { type: String, index: true, sparse: true },
  paymentData: mongoose.Schema.Types.Mixed,
  paidAt: Date,
  // Provisioning
  provisioningStartedAt: Date,
  provisioningCompletedAt: Date,
  provisioningErrors: [String],
  // Metadata
  notes: String,
  metadata: mongoose.Schema.Types.Mixed,
  // Timestamps
  completedAt: Date,
  cancelledAt: Date,
  refundedAt: Date,
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

orderSchema.virtual('itemCount').get(function() {
  return this.items.length;
});

orderSchema.virtual('isPaid').get(function() {
  return ['paid', 'provisioning', 'completed'].includes(this.status);
});

orderSchema.virtual('canCancel').get(function() {
  return ['pending', 'payment_initiated'].includes(this.status);
});

// Pre-save to generate order number
orderSchema.pre('save', async function(next) {
  if (this.isNew && !this.orderNumber) {
    const date = new Date();
    const year = date.getFullYear().toString().slice(-2);
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    const random = Math.random().toString(36).substring(2, 8).toUpperCase();
    this.orderNumber = `DR${year}${month}${day}-${random}`;
  }
  
  // Calculate totals
  this.subtotal = this.items.reduce((sum, item) => sum + (item.price.registration * item.years), 0);
  this.total = this.subtotal + this.tax - this.discount;
  
  next();
});

// Method to mark as paid
orderSchema.methods.markPaid = function(paymentData) {
  this.status = 'paid';
  this.paidAt = new Date();
  this.paymentData = paymentData;
  this.paymentReference = paymentData.reference || paymentData.id;
  return this.save();
};

// Method to start provisioning
orderSchema.methods.startProvisioning = function() {
  this.status = 'provisioning';
  this.provisioningStartedAt = new Date();
  return this.save();
};

// Method to complete provisioning
orderSchema.methods.completeProvisioning = function(results) {
  this.status = 'completed';
  this.provisioningCompletedAt = new Date();
  this.completedAt = new Date();
  
  // Update items with registrar IDs
  results.forEach((result, index) => {
    if (this.items[index]) {
      this.items[index].registrarOrderId = result.registrarResult?.strUUID;
      this.items[index].status = 'completed';
    }
  });
  
  return this.save();
};

// Method to fail provisioning
orderSchema.methods.failProvisioning = function(errors) {
  this.status = 'failed';
  this.provisioningErrors = Array.isArray(errors) ? errors : [errors];
  return this.save();
};

// Method to cancel
orderSchema.methods.cancel = function(reason) {
  this.status = 'cancelled';
  this.cancelledAt = new Date();
  this.notes = (this.notes || '') + `\nCancelled: ${reason}`;
  return this.save();
};

// Static method to find by user
orderSchema.statics.findByUser = function(userId, options = {}) {
  const query = { userId };
  if (options.status) query.status = options.status;
  return this.find(query).sort({ createdAt: -1 });
};

// Static method to find by order number
orderSchema.statics.findByOrderNumber = function(orderNumber) {
  return this.findOne({ orderNumber });
};

// Indexes
orderSchema.index({ userId: 1, status: 1 });
orderSchema.index({ userId: 1, createdAt: -1 });
orderSchema.index({ paymentReference: 1 }, { sparse: true });
orderSchema.index({ orderNumber: 1 }, { unique: true });

export const Order = mongoose.model('Order', orderSchema);
export default Order;