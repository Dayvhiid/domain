import mongoose from 'mongoose';

const domainSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  // Domain details
  domainName: {
    type: String,
    required: true,
    lowercase: true,
    trim: true,
    index: true,
  },
  extension: {
    type: String,
    required: true,
    lowercase: true,
    trim: true,
  },
  fullDomainName: {
    type: String,
    required: true,
    lowercase: true,
    trim: true,
    index: true,
  },
  // Status
  status: {
    type: String,
    enum: [
      'active',
      'pending',
      'expired',
      'suspended',
      'deleted',
      'transfer_pending',
      'transfer_completed',
      'redemption_period',
      'pending_delete',
      'registered',
      'parked',
    ],
    default: 'pending',
    index: true,
  },
  // Dates
  registrationDate: Date,
  expirationDate: {
    type: Date,
    index: true,
  },
  renewalDate: {
    type: Date,
    index: true,
  },
  transferDate: Date,
  // Pricing
  price: {
    registration: {
      type: Number,
      required: true,
    },
    renewal: {
      type: Number,
      required: true,
    },
    transfer: Number,
    currency: {
      type: String,
      default: 'ZAR',
    },
    period: {
      type: Number,
      default: 1,
    },
  },
  // Auto-renewal
  autoRenew: {
    type: Boolean,
    default: true,
  },
  autoRenewPeriod: {
    type: Number,
    default: 1,
  },
  // Nameservers
  nameservers: [{
    hostname: String,
    ipv4: String,
    ipv6: String,
  }],
  nameserverGroup: {
    type: String,
    trim: true,
  },
  // Contacts (embedded references to local contacts)
  contacts: {
    registrant: { type: mongoose.Schema.Types.ObjectId, ref: 'Contact' },
    admin: { type: mongoose.Schema.Types.ObjectId, ref: 'Contact' },
    tech: { type: mongoose.Schema.Types.ObjectId, ref: 'Contact' },
    billing: { type: mongoose.Schema.Types.ObjectId, ref: 'Contact' },
  },
  // WHOIS Privacy
  whoisPrivacy: {
    type: Boolean,
    default: true,
  },
  // Registry statuses
  registryStatuses: [String],
  // DNS
  dnsSec: {
    enabled: { type: Boolean, default: false },
    keys: [{
      flags: Number,
      protocol: Number,
      algorithm: Number,
      publicKey: String,
    }],
  },
  // Additional metadata
  metadata: {
    applicationMode: String,
    comment: String,
    abuseContact: String,
    isAbusive: { type: Boolean, default: false },
  },
  // Order reference
  orderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order',
    index: true,
  },
  // Sync status
  lastSyncedAt: Date,
  syncStatus: {
    type: String,
    enum: ['synced', 'pending', 'error'],
    default: 'pending',
  },
  syncError: String,
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

// Virtual for days until expiration
domainSchema.virtual('daysUntilExpiration').get(function() {
  if (!this.expirationDate) return null;
  const diff = this.expirationDate - Date.now();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
});

// Virtual for is expiring soon (30 days)
domainSchema.virtual('isExpiringSoon').get(function() {
  const days = this.daysUntilExpiration;
  return days !== null && days <= 30 && days > 0;
});

// Virtual for is expired
domainSchema.virtual('isExpired').get(function() {
  const days = this.daysUntilExpiration;
  return days !== null && days <= 0;
});

// Indexes
domainSchema.index({ userId: 1, status: 1 });
domainSchema.index({ userId: 1, expirationDate: 1 });
domainSchema.index({ renewalDate: 1, autoRenew: 1 });

// Method to get display name
domainSchema.methods.getDisplayName = function() {
  return this.fullDomainName;
};

// Method to check if renewable
domainSchema.methods.isRenewable = function() {
  return ['active', 'expired', 'redemption_period'].includes(this.status);
};

// Static method to find by user
domainSchema.statics.findByUser = function(userId, options = {}) {
  const query = { userId };
  if (options.status) query.status = options.status;
  if (options.expiringSoon) {
    const thirtyDaysFromNow = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    query.expirationDate = { $lte: thirtyDaysFromNow, $gt: new Date() };
  }
  return this.find(query).sort({ expirationDate: 1 });
};

// Static method to find expiring domains
domainSchema.statics.findExpiring = function(days = 30) {
  const cutoff = new Date(Date.now() + days * 24 * 60 * 60 * 1000);
  return this.find({
    expirationDate: { $lte: cutoff, $gt: new Date() },
    status: { $in: ['active', 'registered', 'parked'] },
    autoRenew: false,
  }).populate('userId', 'email firstName lastName');
};

export const Domain = mongoose.model('Domain', domainSchema);
export default Domain;
