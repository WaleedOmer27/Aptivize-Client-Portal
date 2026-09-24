/**
 * models/Message.js
 *
 * Sequelize model for the "messages" table.
 * Exports the same named functions as the old raw-SQL model:
 *
 *   getConversation(meId, otherId)        → marks msgs read + returns thread
 *   sendMessage({ senderId, receiverId, body }) → created message row
 *   countUnread(userId)                   → number
 *   listThreads(userId)                   → thread summary array
 *
 * Note: listThreads uses a PostgreSQL-specific DISTINCT ON query — we use
 * sequelize.query() for that one since Sequelize's query builder can't
 * express it cleanly. All other ops use the Sequelize ORM API.
 */

import { DataTypes, Op, QueryTypes } from 'sequelize';
import sequelize from '../config/sequelize.js';
import User from './User.js';

// ─── Model Definition ─────────────────────────────────────────────────────────
const Message = sequelize.define('Message', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  sender_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: { model: 'users', key: 'id' },
  },
  receiver_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: { model: 'users', key: 'id' },
  },
  body: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  is_read: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
}, {
  tableName:  'messages',
  timestamps: true,
  createdAt:  'created_at',
  updatedAt:  false,         // messages table has no updated_at column
});

// ─── Associations ──────────────────────────────────────────────────────────────
Message.belongsTo(User, { foreignKey: 'sender_id',   as: 'sender'   });
Message.belongsTo(User, { foreignKey: 'receiver_id', as: 'receiver' });

export default Message;

// ─── Named export functions ────────────────────────────────────────────────────

/**
 * Mark all unread messages from `otherId` → `meId` as read,
 * then return the full chronological conversation between the two users.
 */
export async function getConversation(meId, otherId) {
  // Mark incoming messages as read
  await Message.update(
    { is_read: true },
    {
      where: {
        sender_id:   otherId,
        receiver_id: meId,
        is_read:     false,
      },
    },
  );

  // Fetch conversation ordered oldest → newest, with sender name
  const messages = await Message.findAll({
    where: {
      [Op.or]: [
        { sender_id: meId,    receiver_id: otherId },
        { sender_id: otherId, receiver_id: meId    },
      ],
    },
    include: [{ model: User, as: 'sender', attributes: ['name'] }],
    order: [['created_at', 'ASC']],
  });

  return messages.map((m) => {
    const msg = m.toJSON();
    msg.sender_name = msg.sender?.name ?? null;
    delete msg.sender;
    return msg;
  });
}

/**
 * Insert a new message row.
 */
export async function sendMessage({ senderId, receiverId, body }) {
  const message = await Message.create({ sender_id: senderId, receiver_id: receiverId, body });
  return message.toJSON();
}

/**
 * Count unread messages where receiver_id = userId.
 */
export async function countUnread(userId) {
  return Message.count({ where: { receiver_id: userId, is_read: false } });
}

/**
 * Returns one summary row per conversation partner:
 *   { other_id, other_name, last_message, last_time, unread_count }
 *
 * Uses a native DISTINCT ON query (PostgreSQL-specific) because Sequelize's
 * query builder doesn't support DISTINCT ON directly.
 * sequelize.query() still uses the same managed connection pool.
 */
export async function listThreads(userId) {
  const rows = await sequelize.query(
    `SELECT DISTINCT ON (other_id)
            other_id,
            u.name        AS other_name,
            m.body        AS last_message,
            m.created_at  AS last_time,
            (
              SELECT COUNT(*)
              FROM   messages um
              WHERE  um.sender_id   = other_id
              AND    um.receiver_id = :userId
              AND    um.is_read     = false
            )::int AS unread_count
     FROM (
       SELECT CASE WHEN sender_id = :userId THEN receiver_id ELSE sender_id END AS other_id,
              id, body, created_at
       FROM   messages
       WHERE  sender_id = :userId OR receiver_id = :userId
     ) sub
     JOIN messages m ON m.id = sub.id
     JOIN users    u ON u.id = sub.other_id
     ORDER  BY other_id, m.created_at DESC`,
    {
      replacements: { userId },
      type: QueryTypes.SELECT,
    },
  );
  return rows;
}
