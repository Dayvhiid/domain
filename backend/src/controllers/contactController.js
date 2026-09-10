import { Contact } from '../models/Contact.js';
import { z } from 'zod';

const createContactSchema = z.object({
  body: z.object({
    type: z.enum(['registrant', 'admin', 'tech', 'billing']),
    firstName: z.string().min(1).max(50),
    lastName: z.string().min(1).max(50),
    email: z.string().email(),
    phone: z.string().min(1),
    phoneCc: z.string().default('+1'),
    fax: z.string().optional(),
    faxCc: z.string().optional(),
    organization: z.string().max(100).optional(),
    organizationType: z.enum(['individual', 'company', 'organization', 'government']).default('individual'),
    address: z.object({
      street: z.string().min(1),
      street2: z.string().optional(),
      city: z.string().min(1),
      state: z.string().optional(),
      postalCode: z.string().min(1),
      country: z.string().length(2).toUpperCase(),
    }),
  }),
});

const updateContactSchema = z.object({
  body: z.object({
    firstName: z.string().min(1).max(50).optional(),
    lastName: z.string().min(1).max(50).optional(),
    email: z.string().email().optional(),
    phone: z.string().min(1).optional(),
    phoneCc: z.string().optional(),
    fax: z.string().optional(),
    faxCc: z.string().optional(),
    organization: z.string().max(100).optional(),
    organizationType: z.enum(['individual', 'company', 'organization', 'government']).optional(),
    address: z.object({
      street: z.string().min(1).optional(),
      street2: z.string().optional(),
      city: z.string().min(1).optional(),
      state: z.string().optional(),
      postalCode: z.string().min(1).optional(),
      country: z.string().length(2).toUpperCase().optional(),
    }).optional(),
  }),
  params: z.object({
    id: z.string().min(1),
  }),
});

const listContactsSchema = z.object({
  query: z.object({
    type: z.string().optional(),
    limit: z.coerce.number().int().min(1).max(100).default(20),
    offset: z.coerce.number().int().min(0).default(0),
  }),
});

/**
 * List contacts
 * GET /api/v1/contacts
 */
export async function listContacts(req, res, next) {
  try {
    const { type, limit, offset } = req.query;
    const query = { userId: req.user.id };
    if (type) query.type = type;
    
    const lim = Math.min(parseInt(limit) || 20, 100);
    const off = parseInt(offset) || 0;
    
    const [contacts, total] = await Promise.all([
      Contact.find(query).sort({ createdAt: -1 }).limit(lim).skip(off),
      Contact.countDocuments(query),
    ]);
    
    res.json({
      success: true,
      data: { contacts, total, limit: lim, offset: off },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Create contact
 * POST /api/v1/contacts
 */
export async function createContact(req, res, next) {
  try {
    const contact = await Contact.create({
      userId: req.user.id,
      ...req.body,
    });
    
    res.status(201).json({
      success: true,
      message: 'Contact created',
      data: contact,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Get contact by ID
 * GET /api/v1/contacts/:id
 */
export async function getContact(req, res, next) {
  try {
    const { id } = req.params;
    const contact = await Contact.findOne({ _id: id, userId: req.user.id });
    
    if (!contact) {
      return res.status(404).json({
        success: false,
        error: { message: 'Contact not found', code: 'NOT_FOUND' },
      });
    }
    
    res.json({
      success: true,
      data: contact,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Update contact
 * PUT /api/v1/contacts/:id
 */
export async function updateContact(req, res, next) {
  try {
    const { id } = req.params;
    const contact = await Contact.findOneAndUpdate(
      { _id: id, userId: req.user.id },
      { $set: req.body },
      { new: true, runValidators: true }
    );
    
    if (!contact) {
      return res.status(404).json({
        success: false,
        error: { message: 'Contact not found', code: 'NOT_FOUND' },
      });
    }
    
    res.json({
      success: true,
      message: 'Contact updated',
      data: contact,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Delete contact
 * DELETE /api/v1/contacts/:id
 */
export async function deleteContact(req, res, next) {
  try {
    const { id } = req.params;
    const contact = await Contact.findOneAndDelete({ _id: id, userId: req.user.id });
    
    if (!contact) {
      return res.status(404).json({
        success: false,
        error: { message: 'Contact not found', code: 'NOT_FOUND' },
      });
    }
    
    res.json({
      success: true,
      message: 'Contact deleted',
    });
  } catch (error) {
    next(error);
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
  listContacts,
  createContact,
  getContact,
  updateContact,
  deleteContact,
  validate,
  schemas: {
    createContact: createContactSchema,
    updateContact: updateContactSchema,
    listContacts: listContactsSchema,
  },
};