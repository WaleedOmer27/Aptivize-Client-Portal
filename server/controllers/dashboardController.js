/**
 * controllers/dashboardController.js
 *
 * Provides summary data for the Dashboard page using Sequelize ORM.
 *
 * getStats    → live counts for stat cards (projects, invoices, tickets, messages)
 * getActivity → recent project activity feed (last 5 project updates)
 */

import { Op, literal, QueryTypes } from 'sequelize';
import sequelize   from '../config/sequelize.js';
import Project     from '../models/Project.js';
import Message     from '../models/Message.js';
import Ticket      from '../models/Ticket.js';
import Invoice     from '../models/Invoice.js';

// ─── GET /api/dashboard/stats ─────────────────────────────────────────────────
/**
 * Returns aggregate counts for the dashboard stat cards.
 * For clients: counts only their own data.
 * For admins:  counts everything.
 */
export async function getStats(req, res, next) {
  try {
    const isClient = req.user.role === 'client';
    const userId   = req.user.id;

    // Client-scope filter — empty object means "no filter" (admin sees all)
    const clientScope = isClient ? { client_id: userId } : {};

    const [
      activeProjects,
      completedProjects,
      totalProjects,
      pendingInvoices,
      unreadMessages,
      openTickets,
    ] = await Promise.all([
      Project.count({ where: { status: 'In Progress', ...clientScope } }),
      Project.count({ where: { status: 'Completed',   ...clientScope } }),
      Project.count({ where: clientScope }),
      Invoice.count({ where: { status: 'pending',     ...clientScope } }),
      Message.count({ where: { receiver_id: userId, is_read: false  } }),
      Ticket.count({  where: { status: { [Op.in]: ['open', 'in_review'] }, ...clientScope } }),
    ]);

    res.status(200).json({
      stats: {
        activeProjects,
        completedProjects,
        totalProjects,
        pendingInvoices,
        unreadMessages,
        openTickets,
        avgResponseTime: '2h',
      },
    });
  } catch (err) {
    next(err);
  }
}

// ─── GET /api/dashboard/activity ─────────────────────────────────────────────
/**
 * Returns a recent activity feed built from project update timestamps.
 * Each item: { id, text, time, type }
 *
 * Uses sequelize.query() for the correlated subquery (milestone counts)
 * which is awkward to express with Sequelize's query builder.
 */
export async function getActivity(req, res, next) {
  try {
    const isClient = req.user.role === 'client';
    const userId   = req.user.id;

    const clientClause = isClient ? 'WHERE p.client_id = :userId' : '';

    const rows = await sequelize.query(
      `SELECT
         p.id,
         p.name,
         p.status,
         p.progress,
         p.updated_at,
         (SELECT COUNT(*)::int FROM milestones m WHERE m.project_id = p.id AND m.is_complete = true)  AS milestones_done,
         (SELECT COUNT(*)::int FROM milestones m WHERE m.project_id = p.id)                           AS milestones_total
       FROM projects p
       ${clientClause}
       ORDER BY p.updated_at DESC
       LIMIT 5`,
      {
        replacements: { userId },
        type: QueryTypes.SELECT,
      },
    );

    const activity = rows.map((p) => {
      const text = p.status === 'Completed'
        ? `Project "${p.name}" marked as Completed ✅`
        : `Project "${p.name}" updated to ${p.progress}% — ${p.milestones_done}/${p.milestones_total} milestones done`;

      return { id: p.id, text, time: formatRelativeTime(p.updated_at), type: 'project' };
    });

    res.status(200).json({ activity });
  } catch (err) {
    next(err);
  }
}

// ─── Helper ───────────────────────────────────────────────────────────────────
function formatRelativeTime(date) {
  const d   = new Date(date);
  const now = new Date();

  const timeStr = d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });

  const isToday     = d.toDateString() === now.toDateString();
  const yesterday   = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  const isYesterday = d.toDateString() === yesterday.toDateString();

  if (isToday)     return `Today, ${timeStr}`;
  if (isYesterday) return `Yesterday, ${timeStr}`;
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) + `, ${timeStr}`;
}
