/**
 * models/Ticket.js
 *
 * Sequelize models for "tickets" and "ticket_replies" tables.
 * Exports the same named functions as the old raw-SQL model:
 *
 *   findAllByClient(clientId)
 *   findAll()
 *   findById(id)            → { ...ticket, replies: [] } | null
 *   createTicket({...})
 *   addReply({...})
 *   updateTicket(id, {...})
 */

import { DataTypes, fn, col, literal } from 'sequelize';
import sequelize from '../config/sequelize.js';
import User from './User.js';

// ─── Ticket Model ─────────────────────────────────────────────────────────────
const Ticket = sequelize.define('Ticket', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  client_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: { model: 'users', key: 'id' },
  },
  title: {
    type: DataTypes.STRING(255),
    allowNull: false,
  },
  description: {
    type: DataTypes.TEXT,
  },
  status: {
    type: DataTypes.STRING(30),
    defaultValue: 'open',
  },
  priority: {
    type: DataTypes.STRING(20),
    defaultValue: 'medium',
  },
}, {
  tableName:  'tickets',
  timestamps: true,
  createdAt:  'created_at',
  updatedAt:  'updated_at',
});

// ─── TicketReply Model ────────────────────────────────────────────────────────
const TicketReply = sequelize.define('TicketReply', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  ticket_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: { model: 'tickets', key: 'id' },
  },
  author_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: { model: 'users', key: 'id' },
  },
  body: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
}, {
  tableName:  'ticket_replies',
  timestamps: true,
  createdAt:  'created_at',
  updatedAt:  false,
});

// ─── Associations ──────────────────────────────────────────────────────────────
Ticket.belongsTo(User,        { foreignKey: 'client_id', as: 'client'  });
Ticket.hasMany(TicketReply,   { foreignKey: 'ticket_id', as: 'replies' });
TicketReply.belongsTo(Ticket, { foreignKey: 'ticket_id'                });
TicketReply.belongsTo(User,   { foreignKey: 'author_id', as: 'author'  });

export { TicketReply };
export default Ticket;

// ─── Helpers ──────────────────────────────────────────────────────────────────
function flattenTicket(t) {
  const row = t.toJSON();
  row.client_name = row.client?.name ?? null;
  delete row.client;
  return row;
}

function flattenReply(r) {
  const row = r.toJSON();
  row.author_name = row.author?.name ?? null;
  row.author_role = row.author?.role ?? null;
  delete row.author;
  return row;
}

// ─── Named export functions ────────────────────────────────────────────────────

export async function findAllByClient(clientId) {
  const tickets = await Ticket.findAll({
    where:   { client_id: clientId },
    include: [{ model: User, as: 'client', attributes: ['name'] }],
    order:   [['created_at', 'DESC']],
    // Fetch reply count via a subquery attribute
    attributes: {
      include: [[
        literal(`(SELECT COUNT(*) FROM ticket_replies tr WHERE tr.ticket_id = "Ticket".id)::int`),
        'reply_count',
      ]],
    },
  });
  return tickets.map(flattenTicket);
}

export async function findAll() {
  const tickets = await Ticket.findAll({
    include: [{ model: User, as: 'client', attributes: ['name'] }],
    order:   [['created_at', 'DESC']],
    attributes: {
      include: [[
        literal(`(SELECT COUNT(*) FROM ticket_replies tr WHERE tr.ticket_id = "Ticket".id)::int`),
        'reply_count',
      ]],
    },
  });
  return tickets.map(flattenTicket);
}

export async function findById(id) {
  const ticket = await Ticket.findByPk(id, {
    include: [
      { model: User, as: 'client', attributes: ['name'] },
      {
        model:   TicketReply,
        as:      'replies',
        include: [{ model: User, as: 'author', attributes: ['name', 'role'] }],
        order:   [['created_at', 'ASC']],
      },
    ],
  });
  if (!ticket) return null;

  const t = ticket.toJSON();
  t.client_name = t.client?.name ?? null;
  delete t.client;

  t.replies = (t.replies ?? []).map((r) => {
    r.author_name = r.author?.name ?? null;
    r.author_role = r.author?.role ?? null;
    delete r.author;
    return r;
  });

  return t;
}

export async function createTicket({ clientId, title, description, priority = 'medium' }) {
  const ticket = await Ticket.create({ client_id: clientId, title, description, priority });
  return ticket.toJSON();
}

export async function addReply({ ticketId, authorId, body }) {
  const reply = await TicketReply.create({ ticket_id: ticketId, author_id: authorId, body });

  // Eagerly fetch author name + role for the response
  const full = await TicketReply.findByPk(reply.id, {
    include: [{ model: User, as: 'author', attributes: ['name', 'role'] }],
  });

  return flattenReply(full);
}

export async function updateTicket(id, { status, priority }) {
  const updates = {};
  if (status   !== undefined) updates.status   = status;
  if (priority !== undefined) updates.priority = priority;
  if (Object.keys(updates).length === 0) return null;

  const [affected, rows] = await Ticket.update(updates, {
    where:     { id },
    returning: true,
  });
  return affected > 0 ? rows[0].toJSON() : null;
}
