import express from 'express';
import contactController from '../controllers/contactController.js';
import { requireAuth } from '../middleware/auth.js';

const router = express.Router();

const { 
  listContacts,
  createContact,
  getContact,
  updateContact,
  deleteContact,
  validate,
  schemas,
} = contactController;

// All contact routes require authentication
router.use(requireAuth);

router.get('/', validate(schemas.listContacts), listContacts);
router.post('/', validate(schemas.createContact), createContact);
router.get('/:id', getContact);
router.put('/:id', validate(schemas.updateContact), updateContact);
router.delete('/:id', deleteContact);

export default router;