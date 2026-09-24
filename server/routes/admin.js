/**
 * routes/admin.js
 *
 * All routes here are protected by both:
 *   1. protect    — verifies JWT, sets req.user
 *   2. authorize('admin') — rejects any non-admin with 403
 *
 * Mounted in server.js as: app.use('/api/admin', adminRoutes)
 *
 * Full paths:
 *   GET    /api/admin/users          — list users (paginated, optional ?role=)
 *   POST   /api/admin/users          — create user
 *   PATCH  /api/admin/users/:id      — edit user
 *   DELETE /api/admin/users/:id      — soft delete user
 *   GET    /api/admin/analytics      — aggregate stats
 */

import { Router } from 'express';
import { body }   from 'express-validator';
import { protect, authorize } from '../middleware/auth.js';
import validate from '../middleware/validate.js';
import {
  listUsers,
  createAdminUser,
  editUser,
  softDeleteUser,
  getAnalytics,
} from '../controllers/adminController.js';

const router = Router();

const VALID_ROLES = ['client', 'employee', 'admin'];

// ── Guard: every admin route requires a valid JWT AND the admin role ──────────
router.use(protect, authorize('admin'));

// ── User Management ───────────────────────────────────────────────────────────
router.get('/users', listUsers);

router.post(
  '/users',
  validate([
    body('name')
      .trim()
      .notEmpty().withMessage('Name is required.')
      .isLength({ min: 2 }).withMessage('Name must be at least 2 characters.'),
    body('email')
      .trim()
      .notEmpty().withMessage('Email is required.')
      .isEmail().withMessage('Must be a valid email address.')
      .normalizeEmail(),
    body('password')
      .notEmpty().withMessage('Password is required.')
      .isLength({ min: 8 }).withMessage('Password must be at least 8 characters.'),
    body('role')
      .optional()
      .isIn(VALID_ROLES).withMessage(`role must be one of: ${VALID_ROLES.join(', ')}`),
  ]),
  createAdminUser,
);

router.patch(
  '/users/:id',
  validate([
    body('name')
      .optional()
      .trim()
      .notEmpty().withMessage('name cannot be blank.')
      .isLength({ min: 2 }).withMessage('Name must be at least 2 characters.'),
    body('email')
      .optional()
      .trim()
      .isEmail().withMessage('Must be a valid email address.')
      .normalizeEmail(),
    body('role')
      .optional()
      .isIn(VALID_ROLES).withMessage(`role must be one of: ${VALID_ROLES.join(', ')}`),
  ]),
  editUser,
);

router.delete('/users/:id', softDeleteUser);

// ── Analytics ─────────────────────────────────────────────────────────────────
router.get('/analytics', getAnalytics);

export default router;
