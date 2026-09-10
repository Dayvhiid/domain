import mongoose from 'mongoose';

const invoiceItemSchema = new mongoose.Schema({
  description: { type: String, required: true },
  domainName: { type: String, lowercase: true, trim: true },
  extension: { type: String, lowercase: true, trim: true },
  quantity: { type: Number, default: 1 },
  unitPrice: { type: Number, required: true },
  totalPrice: { type: Number, required: true },
  period: { type: Number, default: 1 },
  operation: { type: String, enum: ['register', 'transfer', 'renew', 'restore'] },
}, { _id: false });

const invoiceSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  orderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order',
    index: true,
  },
  registrarInvoiceId: {
    type: String,
    sparse: true,
    index: true,
  },
  invoiceNumber: {
    type: String,
    required: true,
    unique: true,
    index: true,
  },
  items: [invoiceItemSchema],
  // Amounts
  subtotal: { type: Number, required: true, default: 0 },
  tax: { type: Number, default: 0 },
  total: { type: Number, required: true, default: 0 },
  currency: { type: String, default: 'ZAR' },
  // Status
  status: {
    type: String,
    enum: ['draft', 'pending', 'paid', 'overdue', 'cancelled', 'refunded'],
    default: 'pending',
    index: true,
  },
  // Dates
  issueDate: { type: Date, default: Date.now },
  dueDate: { type: Date, index: true },
  paidAt: Date,
  // Payment
  paymentProvider: String,
  paymentReference: String,
  // PDF/Document
  pdfUrl: String,
  // Metadata
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

invoiceSchema.virtual('isOverdue').get(function() {
  return this.status === 'pending' && this.dueDate && this.dueDate < new Date();
});

invoiceSchema.virtual('daysOverdue').get(function() {
  if (!this.dueDate || this.status === 'paid') return 0;
  const diff = Date.now() - this.dueDate.getTime();
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
});

invoiceSchema.virtual('balanceDue').get(function() {
  return this.status === 'paid' ? 0 : this.total;
});

// Method to mark as paid
invoiceSchema.methods.markPaid = function(paymentData) {
  this.status = 'paid';
  this.paidAt = new Date();
  this.paymentProvider = paymentData.provider;
  this.paymentReference = paymentData.reference;
  return this.save();
};

// Method to cancel
invoiceSchema.methods.cancel = function(reason) {
  this.status = 'cancelled';
  this.notes = (this.notes || '') + `\nCancelled: ${reason}`;
  return this.save();
};

// Static method to find by user
invoiceSchema.statics.findByUser = function(userId, options = {}) {
  const query = { userId };
  if (options.status) query.status = options.status;
  if (options.overdue) {
    query.status = 'pending';
    query.dueDate = { $lt: new Date() };
  }
  return this.find(query).sort({ issueDate: -1 });
};

// Static method to find overdue invoices
invoiceSchema.statics.findOverdue = function() {
  return this.find({
    status: 'pending',
    dueDate: { $lt: new Date() },
  }).populate('userId', 'email firstName lastName');
};

// Indexes
invoiceSchema.index({ userId: 1, status: 1 });
invoiceSchema.index({ userId: 1, issueDate: -1 });
invoiceSchema.index({ dueDate: 1, status: 1 });
invoiceSchema.index({ invoiceNumber: 1 }, { unique: true });

export const Invoice = mongoose.model('Invoice', invoiceSchema);
export default Invoice;