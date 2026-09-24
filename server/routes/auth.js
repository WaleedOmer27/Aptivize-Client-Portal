/**
 * routes/auth.js
 *
 * Maps HTTP method + URL path → controller function.
 * This file has zero logic — it's purely a routing table.
 *
 * Mounted in server.js as:  app.use('/api/auth', authRoutes)
 * So the full paths are:
 *   POST  /api/auth/login
 *   POST  /api/auth/logout
 *   GET   /api/auth/me
 *
 * Mounted in server.js as:  app.use('/api/users', authRoutes)
 *   PATCH /api/users/me          — update name/email
 *   PATCH /api/users/me/password — change password
 */

import { Router } from 'express';
import { body }   from 'express-validator';
import { login, logout, getMe, updateMe, changePassword } from '../controllers/authController.js';
import { protect }  from '../middleware/auth.js';
import validate     from '../middleware/validate.js';

const router = Router();

// ── POST /api/auth/login ──────────────────────────────────────────────────────
router.post(
  '/login',
  validate([
    body('email')
      .trim()
      .notEmpty().withMessage('Email is required.')
      .isEmail().withMessage('Must be a valid email address.')
      .normalizeEmail(),
    body('password')
      .notEmpty().withMessage('Password is required.'),
  ]),
  login,
);

// Public — no token required
router.post('/logout', logout);

// Protected route — `protect` middleware runs first, verifies JWT,
// then calls getMe if valid (or returns 401 if not)
router.get('/me', protect, getMe);

// ── PATCH /api/users/me — update name/email ───────────────────────────────────
router.patch(
  '/me',
  protect,
  validate([
    body('name')
      .optional()
      .trim()
      .isLength({ min: 2 }).withMessage('Name must be at least 2 characters.'),
    body('email')
      .optional()
      .trim()
      .isEmail().withMessage('Must be a valid email address.')
      .normalizeEmail(),
  ]),
  updateMe,
);

// ── PATCH /api/users/me/password — change password ───────────────────────────
router.patch(
  '/me/password',
  protect,
  validate([
    body('currentPassword')
      .notEmpty().withMessage('Current password is required.'),
    body('newPassword')
      .isLength({ min: 8 }).withMessage('New password must be at least 8 characters.'),
  ]),
  changePassword,
);

export default router;
