/**
 * controllers/messageController.js
 *
 * Handles messaging endpoints.
 *
 * For the client portal, a client always messages the admin team.
 * We look up the first admin user as the "other participant".
 *
 * Routes:
 *   GET  /api/messages           → list threads (conversation partners + last msg)
 *   GET  /api/messages/:userId   → full conversation with :userId
 *   POST /api/messages           → send a message
 */

import { listThreads, getConversation, sendMessage, countUnread } from '../models/Message.js';
import User from '../models/User.js';
import { createNotification } from '../models/Notification.js';

// ─── GET /api/messages ────────────────────────────────────────────────────────
/**
 * Returns list of conversation threads for the logged-in user.
 * Also returns unread count for badge display.
 */
export async function getThreads(req, res, next) {
  try {
    const threads = await listThreads(req.user.id);
    const unread  = await countUnread(req.user.id);
    res.status(200).json({ threads, unread });
  } catch (err) {
    next(err);
  }
}

// ─── GET /api/messages/:otherId ───────────────────────────────────────────────
/**
 * Returns all messages between the logged-in user and :otherId.
 * Opening this conversation also marks all incoming messages as read.
 */
export async function getConversationHandler(req, res, next) {
  try {
    const otherId = Number(req.params.otherId);
    if (!otherId) return res.status(400).json({ message: 'Invalid user id.' });

    const messages = await getConversation(req.user.id, otherId);
    res.status(200).json({ messages });
  } catch (err) {
    next(err);
  }
}

// ─── POST /api/messages ───────────────────────────────────────────────────────
/**
 * Send a message.
 * Body: { receiverId, body }
 * If receiverId is omitted and sender is a client, defaults to the first admin.
 */
export async function sendMessageHandler(req, res, next) {
  try {
    let { receiverId, body } = req.body;

    if (!body || !body.trim()) {
      return res.status(400).json({ message: 'Message body is required.' });
    }

    // If no receiverId provided, default to the first admin user
    if (!receiverId) {
      const admin = await User.findOne({ where: { role: 'admin' } });
      receiverId = admin?.id;
    }

    if (!receiverId) {
      return res.status(400).json({ message: 'receiverId is required.' });
    }

    const message = await sendMessage({
      senderId: req.user.id,
      receiverId: Number(receiverId),
      body: body.trim(),
    });

    // ── Notify the receiver ───────────────────────────────────────────────────
    try {
      await createNotification({
        userId: Number(receiverId),
        type:   'message',
        title:  `New message from ${req.user.name}`,
        body:   body.trim().slice(0, 120),
        link:   '/messages',
      });
    } catch (notifErr) {
      console.warn('⚠️ Notification create failed (message):', notifErr.message);
    }

    res.status(201).json({ message });
  } catch (err) {
    next(err);
  }
}

// ─── GET /api/messages/unread-count ──────────────────────────────────────────
/**
 * Returns the unread message count for badge display in the nav.
 */
export async function getUnreadCount(req, res, next) {
  try {
    const count = await countUnread(req.user.id);
    res.status(200).json({ count });
  } catch (err) {
    next(err);
  }
}
