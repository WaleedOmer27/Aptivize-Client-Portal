/**
 * routes/invoices.js
 * Mounted at: /api/invoices
 *
 *   GET   /api/invoices          → list (role-filtered)
 *   PATCH /api/invoices/:id/pay  → mark invoice as paid
 */

import { Router } from 'express';
import { param }  from 'express-validator';
import { protect } from '../middleware/auth.js';
import validate    from '../middleware/validate.js';
import { listInvoices, payInvoice } from '../controllers/invoiceController.js';

const router = Router();

router.use(protect);

router.get('/', listInvoices);

// PATCH /api/invoices/:id/pay — validate that :id is a positive integer
router.patch(
  '/:id/pay',
  validate([
    param('id')
      .isInt({ min: 1 }).withMessage('Invoice ID must be a positive integer.'),
  ]),
  payInvoice,
);

export default router;
