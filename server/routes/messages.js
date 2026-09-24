/**
 * routes/messages.js
 * Mounted at: /api/messages
 *
 *   GET  /api/messages               → conversation thread list
 *   GET  /api/messages/unread-count  → badge count
 *   GET  /api/messages/:otherId      → conversation with a user
 *   POST /api/messages               → send a message
 */

import { Router } from 'express';
import { body }   from 'express-validator';
import { protect } from '../middleware/auth.js';
import validate    from '../middleware/validate.js';
import {
  getThreads,
  getConversationHandler,
  sendMessageHandler,
  getUnreadCount,
} from '../controllers/messageController.js';

const router = Router();

router.use(protect);

// NOTE: '/unread-count' must be BEFORE '/:otherId' to avoid Express matching
// "unread-count" as a dynamic :otherId parameter.
router.get('/unread-count', getUnreadCount);
router.get('/',             getThreads);
router.get('/:otherId',     getConversationHandler);

// POST /api/messages — send a message
router.post(
  '/',
  validate([
    body('receiverId')
      .notEmpty().withMessage('receiverId is required.')
      .isInt({ min: 1 }).withMessage('receiverId must be a positive integer.'),
    body('body')
      .trim()
      .notEmpty().withMessage('Message body is required.')
      .isLength({ max: 5000 }).withMessage('Message must be ≤ 5000 characters.'),
  ]),
  sendMessageHandler,
);

export default router;
