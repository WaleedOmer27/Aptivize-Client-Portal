/**
 * controllers/notificationController.js
 *
 * Routes:
 *   GET    /api/notifications              → list (latest 30 for user)
 *   GET    /api/notifications/unread-count → just the badge count
 *   PATCH  /api/notifications/:id/read     → mark one as read
 *   PATCH  /api/notifications/read-all     → mark all as read
 */

import {
  getForUser,
  getUnreadCount,
  markRead,
  markAllRead,
} from '../models/Notification.js';

// ─── GET /api/notifications/unread-count ─────────────────────────────────────
export async function getUnread(req, res, next) {
  try {
    const count = await getUnreadCount(req.user.id);
    res.status(200).json({ count });
  } catch (err) {
    next(err);
  }
}

// ─── GET /api/notifications ───────────────────────────────────────────────────
export async function listNotifications(req, res, next) {
  try {
    const notifications = await getForUser(req.user.id, 30);
    const unread        = await getUnreadCount(req.user.id);
    res.status(200).json({ notifications, unread });
  } catch (err) {
    next(err);
  }
}

// ─── PATCH /api/notifications/:id/read ───────────────────────────────────────
export async function markOneRead(req, res, next) {
  try {
    const ok = await markRead(Number(req.params.id), req.user.id);
    if (!ok) return res.status(404).json({ message: 'Notification not found.' });
    res.status(200).json({ message: 'Marked as read.' });
  } catch (err) {
    next(err);
  }
}

// ─── PATCH /api/notifications/read-all ────────────────────────────────────────
export async function markAllAsRead(req, res, next) {
  try {
    const count = await markAllRead(req.user.id);
    res.status(200).json({ message: 'All notifications marked as read.', count });
  } catch (err) {
    next(err);
  }
}
