/**
 * controllers/adminController.js
 *
 * Handles all admin-only endpoints. Every handler here is called
 * AFTER the protect + authorize('admin') middleware chain in routes/admin.js,
 * so req.user.role === 'admin' is guaranteed.
 *
 *   listUsers        — GET    /api/admin/users
 *   createAdminUser  — POST   /api/admin/users
 *   editUser         — PATCH  /api/admin/users/:id
 *   softDeleteUser   — DELETE /api/admin/users/:id
 *   getAnalytics     — GET    /api/admin/analytics
 */

import bcrypt from 'bcryptjs';
import UserModel, {
  listUsers as modelListUsers,
  createUser,
  softDeleteUser as modelSoftDelete,
  findById,
} from '../models/User.js';
import Invoice from '../models/Invoice.js';

// ─────────────────────────────────────────────────────────────────────────────

/**
 * GET /api/admin/users?page=1&limit=20&role=client
 *
 * Returns a paginated list of users, optionally filtered by role.
 */
export async function listUsers(req, res, next) {
  try {
    const page  = Math.max(1, parseInt(req.query.page)  || 1);
    const limit = Math.min(100, parseInt(req.query.limit) || 20);
    const role  = req.query.role || undefined;

    const { rows, total } = await modelListUsers({ page, limit, role });

    res.status(200).json({
      users: rows,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  } catch (err) {
    next(err);
  }
}

// ─────────────────────────────────────────────────────────────────────────────

/**
 * POST /api/admin/users
 *
 * Creates a new user (any role). Password is hashed server-side.
 * Body: { name, email, password, role }
 */
export async function createAdminUser(req, res, next) {
  try {
    const { name, email, password, role = 'client' } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: 'name, email, and password are required.' });
    }

    const VALID_ROLES = ['client', 'employee', 'admin'];
    if (!VALID_ROLES.includes(role)) {
      return res.status(400).json({ message: `role must be one of: ${VALID_ROLES.join(', ')}` });
    }

    const hashed = await bcrypt.hash(password, 12);
    const user   = await createUser({ name, email, password: hashed, role });

    res.status(201).json({ message: 'User created.', user });
  } catch (err) {
    if (err.name === 'SequelizeUniqueConstraintError') {
      return res.status(409).json({ message: 'A user with that email already exists.' });
    }
    next(err);
  }
}

// ─────────────────────────────────────────────────────────────────────────────

/**
 * PATCH /api/admin/users/:id
 *
 * Update a user's name, email, and/or role.
 * Body: { name?, email?, role? }
 */
export async function editUser(req, res, next) {
  try {
    const { id } = req.params;
    const { name, email, role } = req.body;

    if (!name && !email && !role) {
      return res.status(400).json({ message: 'Provide at least one field to update.' });
    }

    // Build update object
    const updates = {};
    if (name)  updates.name  = name;
    if (email) updates.email = email;
    if (role) {
      const VALID_ROLES = ['client', 'employee', 'admin'];
      if (!VALID_ROLES.includes(role)) {
        return res.status(400).json({ message: `role must be one of: ${VALID_ROLES.join(', ')}` });
      }
      updates.role = role;
    }

    // PUBLIC_ATTRS we want back
    const PUBLIC_ATTRS = ['id', 'name', 'email', 'role', 'is_active', 'created_at'];

    const [affected, rows] = await UserModel.update(updates, {
      where: { id },
      returning: true,
    });

    if (affected === 0) {
      return res.status(404).json({ message: 'User not found.' });
    }

    const json = rows[0].toJSON();
    const { password: _pw, ...safe } = json;

    res.status(200).json({ message: 'User updated.', user: safe });
  } catch (err) {
    if (err.name === 'SequelizeUniqueConstraintError') {
      return res.status(409).json({ message: 'Email is already in use.' });
    }
    next(err);
  }
}

// ─────────────────────────────────────────────────────────────────────────────

/**
 * DELETE /api/admin/users/:id
 *
 * Soft-delete: sets is_active = false. The user can no longer log in
 * but their data is preserved.
 */
export async function softDeleteUser(req, res, next) {
  try {
    const { id } = req.params;

    // Prevent self-deletion
    if (parseInt(id) === req.user.id) {
      return res.status(400).json({ message: 'You cannot deactivate your own account.' });
    }

    const ok = await modelSoftDelete(id);
    if (!ok) {
      return res.status(404).json({ message: 'User not found.' });
    }

    res.status(200).json({ message: 'User deactivated.' });
  } catch (err) {
    next(err);
  }
}

// ─────────────────────────────────────────────────────────────────────────────

/**
 * GET /api/admin/analytics
 *
 * Aggregate stats across all core entities.
 */
export async function getAnalytics(req, res, next) {
  try {
    const sequelize = Invoice.sequelize;

    // ── Revenue ───────────────────────────────────────────────────────────────
    const [revenueRows] = await sequelize.query(`
      SELECT
        COALESCE(SUM(amount_cents), 0)                                        AS total_cents,
        COALESCE(SUM(CASE WHEN status = 'paid'    THEN amount_cents END), 0)  AS paid_cents,
        COALESCE(SUM(CASE WHEN status = 'pending' THEN amount_cents END), 0)  AS pending_cents
      FROM invoices
    `);
    const rev = revenueRows[0];

    // Monthly revenue (last 6 months, aggregated as paid)
    const [monthlyRows] = await sequelize.query(`
      SELECT
        TO_CHAR(DATE_TRUNC('month', created_at), 'Mon YYYY') AS month,
        DATE_TRUNC('month', created_at)                       AS month_start,
        COALESCE(SUM(CASE WHEN status = 'paid' THEN amount_cents END), 0) AS paid_cents,
        COALESCE(SUM(amount_cents), 0)                        AS total_cents
      FROM invoices
      WHERE created_at >= NOW() - INTERVAL '6 months'
      GROUP BY DATE_TRUNC('month', created_at)
      ORDER BY month_start ASC
    `);

    // ── Projects ──────────────────────────────────────────────────────────────
    const [projectRows] = await sequelize.query(`
      SELECT status, COUNT(*) AS count
      FROM projects
      GROUP BY status
    `);
    const projectStatus = {};
    projectRows.forEach((r) => { projectStatus[r.status] = parseInt(r.count); });
    const projectTotal = Object.values(projectStatus).reduce((s, v) => s + v, 0);

    // ── Tickets ───────────────────────────────────────────────────────────────
    const [ticketRows] = await sequelize.query(`
      SELECT status, COUNT(*) AS count
      FROM tickets
      GROUP BY status
    `);
    const ticketStatus = {};
    ticketRows.forEach((r) => { ticketStatus[r.status] = parseInt(r.count); });
    const ticketTotal = Object.values(ticketStatus).reduce((s, v) => s + v, 0);

    // ── Users ─────────────────────────────────────────────────────────────────
    const [userRows] = await sequelize.query(`
      SELECT role, COUNT(*) AS count
      FROM users
      WHERE is_active = true
      GROUP BY role
    `);
    const userByRole = {};
    userRows.forEach((r) => { userByRole[r.role] = parseInt(r.count); });
    const userTotal = Object.values(userByRole).reduce((s, v) => s + v, 0);

    res.status(200).json({
      revenue: {
        total_cents:   parseInt(rev.total_cents),
        paid_cents:    parseInt(rev.paid_cents),
        pending_cents: parseInt(rev.pending_cents),
        monthly:       monthlyRows,
      },
      projects: { total: projectTotal, by_status: projectStatus },
      tickets:  { total: ticketTotal,  by_status: ticketStatus  },
      users:    { total: userTotal,    by_role:   userByRole    },
    });
  } catch (err) {
    next(err);
  }
}
