/**
 * controllers/authController.js
 *
 * Handles the auth endpoints: login, logout, getMe.
 *
 * Controllers are responsible for:
 *   1. Reading from req (body, params, user)
 *   2. Calling models / business logic
 *   3. Sending the response
 *
 * They do NOT contain SQL — that's the model's job.
 * They do NOT do routing — that's the route's job.
 */

import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { findByEmail, findById, updateUser, updatePassword } from '../models/User.js';

// ─── Helper — sign a JWT ───────────────────────────────────────────────────────
// We embed id + role in the token payload.
// role is included so the `authorize` middleware can check it without a DB hit.
//
// jwt.sign(payload, secret, options) → returns the token string
// The token is self-contained — anyone with the secret can verify it.
function signToken(user) {
  return jwt.sign(
    { id: user.id, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' },
  );
}

// ─────────────────────────────────────────────────────────────────────────────

/**
 * POST /api/auth/login
 *
 * Flow:
 *  1. Pull email + password from req.body
 *  2. Find the user in DB by email
 *  3. Compare the submitted password against the stored bcrypt hash
 *  4. If both checks pass → sign a JWT → send it back with the user object
 */
export async function login(req, res, next) {
  try {
    const { email, password } = req.body;

    // ── Basic validation ───────────────────────────────────────────────────
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required.' });
    }

    // ── Step 1: Look up user ───────────────────────────────────────────────
    // findByEmail returns null if not found.
    // We deliberately use the same error message for "not found" and "wrong
    // password" — this prevents user enumeration (attackers can't tell if an
    // email exists in your system).
    const user = await findByEmail(email);
    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password.' });
    }

    // ── Step 2: Check if account is active ────────────────────────────────
    if (!user.is_active) {
      return res.status(403).json({ message: 'Account is disabled. Contact support.' });
    }

    // ── Step 3: Verify password ────────────────────────────────────────────
    // bcrypt.compare(plaintext, hash) → true or false
    // It re-hashes the plaintext with the same salt embedded in the stored
    // hash, then compares. You never need to hash the input yourself first.
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid email or password.' });
    }

    // ── Step 4: Sign token and respond ────────────────────────────────────
    const token = signToken(user);

    // Don't send the password hash to the client — destructure it away.
    const { password: _pw, ...safeUser } = user;

    res.status(200).json({
      message: 'Login successful.',
      token,
      user: safeUser,
    });
  } catch (err) {
    // Pass unexpected errors to the global error handler (errorHandler.js)
    next(err);
  }
}

// ─────────────────────────────────────────────────────────────────────────────

/**
 * POST /api/auth/logout
 *
 * JWTs are stateless — the server doesn't store them, so there's nothing to
 * invalidate server-side. The client is responsible for deleting the token
 * (from localStorage / cookie). We just return 200 to confirm the action.
 *
 * For production apps you'd maintain a token blacklist in Redis, but that's
 * out of scope for now.
 */
export async function logout(_req, res) {
  res.status(200).json({ message: 'Logged out successfully.' });
}

// ─────────────────────────────────────────────────────────────────────────────

/**
 * GET /api/auth/me
 *
 * Protected by the `protect` middleware — if we reach here, req.user is
 * already populated with the decoded JWT payload { id, role }.
 *
 * We use that id to fetch the fresh user record from the DB, so the client
 * always gets up-to-date info (e.g. if name/email changed since token issue).
 */
export async function getMe(req, res, next) {
  try {
    // req.user.id was set by the `protect` middleware after verifying the JWT
    const user = await findById(req.user.id);

    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    res.status(200).json({ user });
  } catch (err) {
    next(err);
  }
}

// ─────────────────────────────────────────────────────────────────────────────

/**
 * PATCH /api/users/me
 *
 * Update the logged-in user's name and/or email.
 * Requires: { name?, email? } in req.body.
 */
export async function updateMe(req, res, next) {
  try {
    const { name, email } = req.body;

    if (!name && !email) {
      return res.status(400).json({ message: 'Provide at least one field to update.' });
    }

    const updated = await updateUser(req.user.id, { name, email });
    if (!updated) {
      return res.status(404).json({ message: 'User not found.' });
    }

    res.status(200).json({ message: 'Profile updated.', user: updated });
  } catch (err) {
    // Unique constraint violation (duplicate email)
    if (err.name === 'SequelizeUniqueConstraintError') {
      return res.status(409).json({ message: 'Email is already in use.' });
    }
    next(err);
  }
}

// ─────────────────────────────────────────────────────────────────────────────

/**
 * PATCH /api/users/me/password
 *
 * Change the logged-in user's password.
 * Requires: { currentPassword, newPassword } in req.body.
 */
export async function changePassword(req, res, next) {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: 'currentPassword and newPassword are required.' });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({ message: 'New password must be at least 8 characters.' });
    }

    // Fetch the full user row (including password hash) to verify current password
    const user = await findByEmail(
      // findByEmail needs email — we fetch the user record first to get it
      (await findById(req.user.id))?.email,
    );

    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Current password is incorrect.' });
    }

    const hashed = await bcrypt.hash(newPassword, 12);
    await updatePassword(req.user.id, hashed);

    res.status(200).json({ message: 'Password updated successfully.' });
  } catch (err) {
    next(err);
  }
}
