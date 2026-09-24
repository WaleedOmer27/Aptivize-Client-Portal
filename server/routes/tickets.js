/**
 * routes/tickets.js
 * Mounted at: /api/tickets
 *
 *   GET    /api/tickets              → list (role-filtered)
 *   POST   /api/tickets              → create (client only)
 *   GET    /api/tickets/:id          → detail + replies
 *   POST   /api/tickets/:id/replies  → add reply
 *   PATCH  /api/tickets/:id          → update status (admin/employee)
 */

import { Router } from 'express';
import { body }   from 'express-validator';
import { protect, authorize } from '../middleware/auth.js';
import validate from '../middleware/validate.js';
import {
  listTickets,
  createTicketHandler,
  getTicket,
  addReplyHandler,
  patchTicket,
} from '../controllers/ticketController.js';

const router = Router();

const VALID_PRIORITIES = ['low', 'medium', 'high'];
const VALID_STATUSES   = ['open', 'in_review', 'resolved', 'closed'];

router.use(protect);

router.get('/', listTickets);

// POST /api/tickets — create ticket
router.post(
  '/',
  validate([
    body('title')
      .trim()
      .notEmpty().withMessage('Title is required.')
      .isLength({ min: 3, max: 200 }).withMessage('Title must be 3–200 characters.'),
    body('description')
      .optional()
      .trim()
      .isLength({ max: 2000 }).withMessage('Description must be ≤ 2000 characters.'),
    body('priority')
      .optional()
      .isIn(VALID_PRIORITIES).withMessage(`priority must be one of: ${VALID_PRIORITIES.join(', ')}`),
  ]),
  createTicketHandler,
);

router.get('/:id', getTicket);

// POST /api/tickets/:id/replies — add a reply
router.post(
  '/:id/replies',
  validate([
    body('body')
      .trim()
      .notEmpty().withMessage('Reply body is required.')
      .isLength({ max: 5000 }).withMessage('Reply must be ≤ 5000 characters.'),
  ]),
  addReplyHandler,
);

// PATCH /api/tickets/:id — update status (admin/employee only)
router.patch(
  '/:id',
  authorize('admin', 'employee'),
  validate([
    body('status')
      .notEmpty().withMessage('status is required.')
      .isIn(VALID_STATUSES).withMessage(`status must be one of: ${VALID_STATUSES.join(', ')}`),
  ]),
  patchTicket,
);

export default router;
