/**
 * routes/notifications.js
 * Mounted at: /api/notifications
 *
 *   GET    /api/notifications              → list (last 30 for logged-in user)
 *   GET    /api/notifications/unread-count → badge count
 *   PATCH  /api/notifications/read-all     → mark all read
 *   PATCH  /api/notifications/:id/read     → mark one read
 */

import { Router } from 'express';
import { protect } from '../middleware/auth.js';
import {
  listNotifications,
  getUnread,
  markOneRead,
  markAllAsRead,
} from '../controllers/notificationController.js';

const router = Router();

router.use(protect);

// NOTE: static paths must come BEFORE dynamic /:id paths
router.get('/unread-count',  getUnread);
router.get('/',              listNotifications);
router.patch('/read-all',    markAllAsRead);
router.patch('/:id/read',    markOneRead);

export default router;
