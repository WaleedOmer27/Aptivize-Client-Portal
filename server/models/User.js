/**
 * models/User.js
 *
 * Sequelize model for the "users" table.
 * Exports the same named functions that controllers already call, so no
 * controller changes are needed.
 *
 *   findByEmail(email)                          → user row (with password) | null
 *   findById(id)                                → safe user row (no password) | null
 *   createUser({ name, email, password, role }) → safe user row
 *   updateUser(id, { name, email })             → safe user row | null
 *   updatePassword(id, hashedPassword)          → boolean
 *   listUsers({ page, limit, role })            → { rows, total }
 *   softDeleteUser(id)                          → boolean
 */

import { DataTypes, Op } from 'sequelize';
import sequelize from '../config/sequelize.js';

// ─── Model Definition ─────────────────────────────────────────────────────────
const User = sequelize.define('User', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  name: {
    type: DataTypes.STRING(100),
    allowNull: false,
  },
  email: {
    type: DataTypes.STRING(255),
    allowNull: false,
    unique: true,
  },
  password: {
    type: DataTypes.STRING(255),
    allowNull: false,
  },
  role: {
    type: DataTypes.STRING(20),
    allowNull: false,
    defaultValue: 'client',
  },
  is_active: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
  },
  // created_at / updated_at handled by Sequelize timestamps
}, {
  tableName:  'users',
  timestamps: true,
  createdAt:  'created_at',
  updatedAt:  'updated_at',
});

export default User;

// ─── Columns safe to return to the client (no password) ────────────────────────
const PUBLIC_ATTRS = ['id', 'name', 'email', 'role', 'is_active', 'created_at'];

// ─── Named export functions (keep the same API as the old raw-SQL model) ────────

/**
 * Find user by email — returns the full row including password hash.
 * Only used by the login endpoint for bcrypt.compare().
 */
export async function findByEmail(email) {
  const user = await User.findOne({ where: { email } });
  return user ? user.toJSON() : null;
}

/**
 * Find user by primary key — excludes password.
 */
export async function findById(id) {
  const user = await User.findByPk(id, { attributes: PUBLIC_ATTRS });
  return user ? user.toJSON() : null;
}

/**
 * Create a new user. Password must already be hashed before calling this.
 */
export async function createUser({ name, email, password, role = 'client' }) {
  const user = await User.create({ name, email, password, role });
  // Return without the password field
  const json = user.toJSON();
  const { password: _pw, ...safe } = json;
  return safe;
}

/**
 * Update a user's name and/or email.
 * Returns the updated safe user row, or null if not found.
 */
export async function updateUser(id, { name, email }) {
  const updates = {};
  if (name  !== undefined) updates.name  = name;
  if (email !== undefined) updates.email = email;
  if (Object.keys(updates).length === 0) return null;

  const [affected, rows] = await User.update(updates, {
    where: { id },
    returning: true,
  });
  if (affected === 0) return null;

  const json = rows[0].toJSON();
  const { password: _pw, ...safe } = json;
  return safe;
}

/**
 * Replace a user's password hash.
 */
export async function updatePassword(id, hashedPassword) {
  const [affected] = await User.update(
    { password: hashedPassword },
    { where: { id } },
  );
  return affected > 0;
}

/**
 * Paginated list of users with optional role filter.
 * Returns { rows: SafeUser[], total: number }
 */
export async function listUsers({ page = 1, limit = 20, role } = {}) {
  const where = {};
  if (role) where.role = role;

  const offset = (page - 1) * limit;

  const { count, rows } = await User.findAndCountAll({
    where,
    attributes: PUBLIC_ATTRS,
    order: [['created_at', 'DESC']],
    limit,
    offset,
  });

  return { rows: rows.map((r) => r.toJSON()), total: count };
}

/**
 * Soft-delete: marks the user as inactive instead of removing the row.
 */
export async function softDeleteUser(id) {
  const [affected] = await User.update(
    { is_active: false },
    { where: { id } },
  );
  return affected > 0;
}
