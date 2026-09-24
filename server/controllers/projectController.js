/**
 * controllers/projectController.js
 *
 * Handles all project-related HTTP endpoints.
 *
 * Role rules:
 *   - Clients: can only READ their own projects (list + detail)
 *   - Admin / Employee: can read ALL projects, create, and update
 */

import {
  findAllByClient,
  findAll,
  findById,
  create,
  updateProject,
} from '../models/Project.js';
import { createNotification } from '../models/Notification.js';

// ─── GET /api/projects ────────────────────────────────────────────────────────
/**
 * List projects — role-filtered.
 *   client   → returns only their own projects (WHERE client_id = req.user.id)
 *   admin/employee → returns all projects
 */
export async function listProjects(req, res, next) {
  try {
    let projects;

    if (req.user.role === 'client') {
      projects = await findAllByClient(req.user.id);
    } else {
      // admin or employee sees everything
      projects = await findAll();
    }

    res.status(200).json({ projects });
  } catch (err) {
    next(err);
  }
}

// ─── GET /api/projects/:id ────────────────────────────────────────────────────
/**
 * Get a single project with its milestones.
 *
 * Clients can only view their own projects.
 * A 403 is returned instead of 404 to avoid leaking whether a project exists.
 */
export async function getProject(req, res, next) {
  try {
    const project = await findById(Number(req.params.id));

    if (!project) {
      return res.status(404).json({ message: 'Project not found.' });
    }

    // Ownership check for clients
    if (req.user.role === 'client' && project.client_id !== req.user.id) {
      return res.status(403).json({ message: 'Access denied.' });
    }

    res.status(200).json({ project });
  } catch (err) {
    next(err);
  }
}

// ─── POST /api/projects ───────────────────────────────────────────────────────
/**
 * Create a new project (admin only — enforced by authorize() in the route).
 *
 * Required body fields: clientId, name
 * Optional: description, status, progress, dueDate, color
 */
export async function createProject(req, res, next) {
  try {
    const { clientId, name, description, status, progress, dueDate, color } = req.body;

    if (!clientId || !name) {
      return res.status(400).json({ message: 'clientId and name are required.' });
    }

    const project = await create({ clientId, name, description, status, progress, dueDate, color });

    // ── Notify the client that a new project was created for them ────────────
    try {
      await createNotification({
        userId: Number(clientId),
        type:   'project_update',
        title:  `New project: ${name}`,
        body:   `A new project has been created for you.`,
        link:   '/projects',
      });
    } catch (notifErr) {
      console.warn('⚠️ Notification create failed (project create):', notifErr.message);
    }

    res.status(201).json({ message: 'Project created.', project });
  } catch (err) {
    next(err);
  }
}

// ─── PATCH /api/projects/:id ──────────────────────────────────────────────────
/**
 * Update a project (admin only — enforced by authorize() in the route).
 *
 * Partial update — only include the fields you want to change in the body.
 * Fields: status, progress, name, description, dueDate
 */
export async function patchProject(req, res, next) {
  try {
    const id = Number(req.params.id);
    const { status, progress, name, description, dueDate } = req.body;

    const updated = await updateProject(id, { status, progress, name, description, dueDate });

    if (!updated) {
      return res.status(404).json({ message: 'Project not found or no valid fields to update.' });
    }

    res.status(200).json({ message: 'Project updated.', project: updated });
  } catch (err) {
    next(err);
  }
}
