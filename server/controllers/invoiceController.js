/**
 * controllers/invoiceController.js
 *
 * Role rules:
 *   - Clients: can only see/pay their own invoices
 *   - Admin: can see all invoices
 *
 * Routes:
 *   GET   /api/invoices          → list (role-filtered)
 *   PATCH /api/invoices/:id/pay  → mark pending invoice as paid
 */

import { findAllByClient, findAll, findById, markPaid, centsToDisplay } from '../models/Invoice.js';
import User from '../models/User.js';
import { createNotification } from '../models/Notification.js';

// Helper: enrich a raw DB row with a display-formatted amount string
function enrichInvoice(row) {
  return { ...row, amount: centsToDisplay(row.amount_cents) };
}

// ─── GET /api/invoices ────────────────────────────────────────────────────────
export async function listInvoices(req, res, next) {
  try {
    const rows = req.user.role === 'client'
      ? await findAllByClient(req.user.id)
      : await findAll();

    const invoices = rows.map(enrichInvoice);
    res.status(200).json({ invoices });
  } catch (err) {
    next(err);
  }
}

// ─── PATCH /api/invoices/:id/pay ──────────────────────────────────────────────
/**
 * Mark a pending invoice as paid.
 * Clients can only pay their own invoices.
 * Already-paid invoices return 409 Conflict.
 */
export async function payInvoice(req, res, next) {
  try {
    const id = Number(req.params.id);

    // Fetch to check ownership & current status
    const invoice = await findById(id);
    if (!invoice) {
      return res.status(404).json({ message: 'Invoice not found.' });
    }

    // Ownership check for clients
    if (req.user.role === 'client' && invoice.client_id !== req.user.id) {
      return res.status(403).json({ message: 'Access denied.' });
    }

    if (invoice.status !== 'pending') {
      return res.status(409).json({ message: `Invoice is already ${invoice.status}.` });
    }

    const updated = await markPaid(id);

    // ── Notify admin that an invoice was paid ───────────────────────────────
    try {
      const admin = await User.findOne({ where: { role: 'admin' } });
      if (admin) {
        await createNotification({
          userId: admin.id,
          type:   'invoice_paid',
          title:  `Invoice #${invoice.invoice_no} paid`,
          body:   `${centsToDisplay(invoice.amount_cents)} paid by client.`,
          link:   '/invoices',
        });
      }
    } catch (notifErr) {
      console.warn('⚠️ Notification create failed (invoice paid):', notifErr.message);
    }

    res.status(200).json({ message: 'Invoice marked as paid.', invoice: enrichInvoice({ ...invoice, ...updated }) });
  } catch (err) {
    next(err);
  }
}
