import mongoose from 'mongoose';

const hostSchema = new mongoose.Schema({
  hostname: { type: String, required: true, trim: true, lowercase: true },
  ipv4: { type: String, trim: true },
  ipv6: { type: String, trim: true },
}, { _id: false });

const nameserverGroupSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  name: {
    type: String,
    required: true,
    trim: true,
    unique: true, // Per user
    index: true,
  },
  hosts: [hostSchema],
  isDefault: {
    type: Boolean,
    default: false,
  },
  domainCount: {
    type: Number,
    default: 0,
  },
  nameserverCount: {
    type: Number,
    default: 0,
  },
  // Sync tracking
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

// Compound index for user + name
nameserverGroupSchema.index({ userId: 1, name: 1 }, { unique: true });
nameserverGroupSchema.index({ userId: 1, isDefault: 1 });

// Pre-save to update counts
nameserverGroupSchema.pre('save', function(next) {
  this.nameserverCount = this.hosts.length;
  next();
});

// Virtual for primary nameserver
nameserverGroupSchema.virtual('primaryNameserver').get(function() {
  return this.hosts[0]?.hostname || null;
});

// Method to get hostnames only
nameserverGroupSchema.methods.getHostnames = function() {
  return this.hosts.map(h => h.hostname);
};

// Method to add host
nameserverGroupSchema.methods.addHost = function(hostname, ipv4, ipv6) {
  if (this.hosts.length >= 13) {
    throw new Error('Maximum 13 nameservers allowed per group');
  }
  this.hosts.push({ hostname: hostname.toLowerCase(), ipv4, ipv6 });
  return this.save();
};

// Method to remove host
nameserverGroupSchema.methods.removeHost = function(hostname) {
  this.hosts = this.hosts.filter(h => h.hostname !== hostname.toLowerCase());
  return this.save();
};

// Method to set as default
nameserverGroupSchema.methods.setAsDefault = async function() {
  await this.constructor.updateMany(
    { userId: this.userId, _id: { $ne: this._id } },
    { $set: { isDefault: false } }
  );
  this.isDefault = true;
  return this.save();
};

// Static method to find by user
nameserverGroupSchema.statics.findByUser = function(userId) {
  return this.find({ userId }).sort({ isDefault: -1, name: 1 });
};

// Static method to get default for user
nameserverGroupSchema.statics.getDefaultForUser = function(userId) {
  return this.findOne({ userId, isDefault: true });
};

export const NameserverGroup = mongoose.model('NameserverGroup', nameserverGroupSchema);
export default NameserverGroup;