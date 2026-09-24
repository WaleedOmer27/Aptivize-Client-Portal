/**
 * models/Notification.js
 *
 * Sequelize model for the "notifications" table.
 *
 * Notification types:
 *   - 'ticket_reply'   → someone replied to your ticket
 *   - 'ticket_status'  → your ticket status changed
 *   - 'invoice_paid'   → an invoice was marked paid
 *   - 'invoice_new'    → a new invoice was issued to you
 *   - 'message'        → you received a new message
 *   - 'project_update' → a project you're on was updated
 *
 * Named exports:
 *   createNotification({ userId, type, title, body?, link? })
 *   getForUser(userId, limit?)    → notifications[]
 *   getUnreadCount(userId)        → integer
 *   markRead(id, userId)          → boolean
 *   markAllRead(userId)           → integer (rows affected)
 */

import { DataTypes } from 'sequelize';
import sequelize from '../config/sequelize.js';
import User from './User.js';

// ─── Model ────────────────────────────────────────────────────────────────────
const Notification = sequelize.define('Notification', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  user_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: { model: 'users', key: 'id' },
  },
  type: {
    type: DataTypes.STRING(50),
    allowNull: false,
  },
  title: {
    type: DataTypes.STRING(255),
    allowNull: false,
  },
  body: {
    type: DataTypes.TEXT,
  },
  link: {
    type: DataTypes.STRING(255),
  },
  is_read: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
}, {
  tableName:  'notifications',
  timestamps: true,
  createdAt:  'created_at',
  updatedAt:  false,
});

// ─── Associations ─────────────────────────────────────────────────────────────
Notification.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

export default Notification;

// ─── Named helpers ────────────────────────────────────────────────────────────

/**
 * Create a notification for a specific user.
 */
export async function createNotification({ userId, type, title, body, link }) {
  const n = await Notification.create({ user_id: userId, type, title, body, link });
  return n.toJSON();
}

/**
 * Fetch the most recent notifications for a user (default: last 30).
 */
export async function getForUser(userId, limit = 30) {
  const rows = await Notification.findAll({
    where: { user_id: userId },
    order: [['created_at', 'DESC']],
    limit,
  });
  return rows.map((r) => r.toJSON());
}

/**
 * Count unread notifications for a user.
 */
export async function getUnreadCount(userId) {
  return Notification.count({ where: { user_id: userId, is_read: false } });
}

/**
 * Mark a single notification as read (scoped to the owner for security).
 */
export async function markRead(id, userId) {
  const [affected] = await Notification.update(
    { is_read: true },
    { where: { id, user_id: userId } },
  );
  return affected > 0;
}

/**
 * Mark ALL unread notifications for a user as read.
 */
export async function markAllRead(userId) {
  const [affected] = await Notification.update(
    { is_read: true },
    { where: { user_id: userId, is_read: false } },
  );
  return affected;
}
