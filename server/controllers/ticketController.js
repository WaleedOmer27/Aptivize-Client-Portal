/**
 * controllers/ticketController.js
 *
 * Role rules:
 *   - Clients: can only see/create their own tickets, add replies
 *   - Admin / Employee: can see all tickets, update status
 *
 * Routes:
 *   GET    /api/tickets              → list (role-filtered)
 *   POST   /api/tickets              → create (client)
 *   GET    /api/tickets/:id          → detail + replies
 *   POST   /api/tickets/:id/replies  → add reply
 *   PATCH  /api/tickets/:id          → update status (admin/employee)
 */

import {
  findAllByClient,
  findAll,
  findById,
  createTicket,
  addReply,
  updateTicket,
} from '../models/Ticket.js';
import { createNotification } from '../models/Notification.js';

// ─── GET /api/tickets ─────────────────────────────────────────────────────────
export async function listTickets(req, res, next) {
  try {
    const tickets = req.user.role === 'client'
      ? await findAllByClient(req.user.id)
      : await findAll();

    res.status(200).json({ tickets });
  } catch (err) {
    next(err);
  }
}

// ─── POST /api/tickets ────────────────────────────────────────────────────────
/**
 * Clients create new support tickets.
 * Body: { title, description?, priority? }
 */
export async function createTicketHandler(req, res, next) {
  try {
    const { title, description, priority } = req.body;

    if (!title || !title.trim()) {
      return res.status(400).json({ message: 'Title is required.' });
    }

    // Only clients can submit tickets on their own behalf
    if (req.user.role !== 'client') {
      return res.status(403).json({ message: 'Only clients can create tickets.' });
    }

    const ticket = await createTicket({
      clientId: req.user.id,
      title: title.trim(),
      description: description?.trim(),
      priority,
    });

    res.status(201).json({ message: 'Ticket created.', ticket });
  } catch (err) {
    next(err);
  }
}

// ─── GET /api/tickets/:id ─────────────────────────────────────────────────────
/**
 * Returns ticket detail + all replies.
 * Clients can only view their own tickets.
 */
export async function getTicket(req, res, next) {
  try {
    const ticket = await findById(Number(req.params.id));

    if (!ticket) {
      return res.status(404).json({ message: 'Ticket not found.' });
    }

    // Ownership check for clients
    if (req.user.role === 'client' && ticket.client_id !== req.user.id) {
      return res.status(403).json({ message: 'Access denied.' });
    }

    res.status(200).json({ ticket });
  } catch (err) {
    next(err);
  }
}

// ─── POST /api/tickets/:id/replies ────────────────────────────────────────────
/**
 * Add a reply to a ticket.
 * Any authenticated user can reply (client, admin, employee).
 * Body: { body }
 */
export async function addReplyHandler(req, res, next) {
  try {
    const ticketId = Number(req.params.id);
    const { body } = req.body;

    if (!body || !body.trim()) {
      return res.status(400).json({ message: 'Reply body is required.' });
    }

    // Check ticket exists and client can only reply to their own
    const ticket = await findById(ticketId);
    if (!ticket) return res.status(404).json({ message: 'Ticket not found.' });
    if (req.user.role === 'client' && ticket.client_id !== req.user.id) {
      return res.status(403).json({ message: 'Access denied.' });
    }

    const reply = await addReply({
      ticketId,
      authorId: req.user.id,
      body: body.trim(),
    });

    // ── Fire notification to the other party ──────────────────────────────────
    // If a non-client replied → notify the ticket owner (client)
    // If the client replied   → notify all admins/employees (notify ticket.client_id's opposite)
    try {
      let notifyUserId;
      if (req.user.role === 'client') {
        // client replied → notify admin (first admin; in future you could notify the assigned agent)
        const User = (await import('../models/User.js')).default;
        const admin = await User.findOne({ where: { role: 'admin' } });
        notifyUserId = admin?.id;
      } else {
        // admin/employee replied → notify the client who owns the ticket
        notifyUserId = ticket.client_id;
      }

      if (notifyUserId && notifyUserId !== req.user.id) {
        await createNotification({
          userId: notifyUserId,
          type:   'ticket_reply',
          title:  `New reply on ticket: ${ticket.title}`,
          body:   body.trim().slice(0, 120),
          link:   `/support/${ticketId}`,
        });
      }
    } catch (notifErr) {
      // Notification failure must never break the main response
      console.warn('⚠️ Notification create failed (ticket reply):', notifErr.message);
    }

    res.status(201).json({ message: 'Reply added.', reply });
  } catch (err) {
    next(err);
  }
}

// ─── PATCH /api/tickets/:id ───────────────────────────────────────────────────
/**
 * Update ticket status or priority (admin/employee only).
 * Body: { status?, priority? }
 */
export async function patchTicket(req, res, next) {
  try {
    const id = Number(req.params.id);
    const { status, priority } = req.body;

    const updated = await updateTicket(id, { status, priority });

    if (!updated) {
      return res.status(404).json({ message: 'Ticket not found or no valid fields to update.' });
    }

    // ── Notify the ticket owner when status changes ───────────────────────────
    if (status) {
      try {
        await createNotification({
          userId: updated.client_id,
          type:   'ticket_status',
          title:  `Ticket status updated: ${updated.title}`,
          body:   `Status changed to "${status}"`,
          link:   `/support/${id}`,
        });
      } catch (notifErr) {
        console.warn('⚠️ Notification create failed (ticket status):', notifErr.message);
      }
    }

    res.status(200).json({ message: 'Ticket updated.', ticket: updated });
  } catch (err) {
    next(err);
  }
}
