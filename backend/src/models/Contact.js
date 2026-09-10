import mongoose from 'mongoose';

const addressSchema = new mongoose.Schema({
  street: { type: String, required: true, trim: true },
  street2: { type: String, trim: true },
  city: { type: String, required: true, trim: true },
  state: { type: String, trim: true },
  postalCode: { type: String, required: true, trim: true },
  country: { type: String, required: true, trim: true, uppercase: true, minlength: 2, maxlength: 2 },
}, { _id: false });

const contactSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  contactRef: {
    type: String,
    sparse: true,
    index: true,
  },
  type: {
    type: String,
    enum: ['registrant', 'admin', 'tech', 'billing'],
    required: true,
    index: true,
  },
  // Personal/Organization info
  firstName: { type: String, required: true, trim: true, maxlength: 50 },
  lastName: { type: String, required: true, trim: true, maxlength: 50 },
  email: { type: String, required: true, lowercase: true, trim: true, index: true },
  phone: { type: String, required: true, trim: true },
  phoneCc: { type: String, default: '+1', trim: true },
  fax: { type: String, trim: true },
  faxCc: { type: String, trim: true },
  // Organization
  organization: { type: String, trim: true, maxlength: 100 },
  organizationType: { type: String, enum: ['individual', 'company', 'organization', 'government'], default: 'individual' },
  // Address
  address: { type: addressSchema, required: true },
  // Verification
  emailVerified: { type: Boolean, default: false },
  emailVerificationToken: { type: String, select: false },
  emailVerificationExpires: { type: Date, select: false },
  // Additional data from registrar
  additionalData: mongoose.Schema.Types.Mixed,
  // Usage tracking
  usedForDomains: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Domain',
  }],
}, {
  timestamps: true,
  toJSON: {
    virtuals: true,
    transform: function(doc, ret) {
      delete ret.emailVerificationToken;
      delete ret.emailVerificationExpires;
      ret.id = ret._id;
      delete ret._id;
      delete ret.__v;
      return ret;
    },
  },
});

// Virtual for full name
contactSchema.virtual('fullName').get(function() {
  return `${this.firstName} ${this.lastName}`;
});

// Virtual for formatted phone
contactSchema.virtual('formattedPhone').get(function() {
  return `${this.phoneCc} ${this.phone}`;
});

// Indexes
contactSchema.index({ userId: 1, type: 1 });
contactSchema.index({ userId: 1, email: 1 });
contactSchema.index({ contactRef: 1 }, { unique: true, sparse: true });

// Method to get formatted address
contactSchema.methods.getFormattedAddress = function() {
  const a = this.address;
  return `${a.street}${a.street2 ? ', ' + a.street2 : ''}, ${a.city}, ${a.state}, ${a.postalCode}, ${a.country}`;
};

// Method to get registrar format for Domains.co.za
contactSchema.methods.toRegistrarFormat = function() {
  return {
    Name: `${this.firstName} ${this.lastName}`,
    Email: this.email,
    ContactNumber: this.phone,
    Country: this.address.country,
    Province: this.address.state,
    City: this.address.city,
    Address1: this.address.street,
    Address2: this.address.street2 || '',
    PostalCode: this.address.postalCode,
  };
};

// Static method to find by user and type
contactSchema.statics.findByUserAndType = function(userId, type) {
  return this.find({ userId, type }).sort({ createdAt: -1 });
};

// Static method to find default contact for user
contactSchema.statics.getDefaultForUser = function(userId, type = 'registrant') {
  return this.findOne({ userId, type }).sort({ createdAt: 1 });
};

export const Contact = mongoose.model('Contact', contactSchema);
export default Contact;