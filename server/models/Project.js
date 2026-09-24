/**
 * models/Project.js
 *
 * Sequelize models for "projects" and "milestones" tables.
 * Exports the same named functions that controllers already call:
 *
 *   findAllByClient(clientId)
 *   findAll()
 *   findById(id)          → { ...project, milestones: [] }
 *   create({...})
 *   updateProject(id, {...})
 */

import { DataTypes, Op } from 'sequelize';
import sequelize from '../config/sequelize.js';
import User from './User.js';

// ─── Project Model ─────────────────────────────────────────────────────────────
const Project = sequelize.define('Project', {
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
  name: {
    type: DataTypes.STRING(255),
    allowNull: false,
  },
  description: {
    type: DataTypes.TEXT,
  },
  status: {
    type: DataTypes.STRING(50),
    defaultValue: 'Planning',
  },
  progress: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
  due_date: {
    type: DataTypes.DATEONLY,
  },
  color: {
    type: DataTypes.STRING(30),
    defaultValue: 'purple',
  },
}, {
  tableName:  'projects',
  timestamps: true,
  createdAt:  'created_at',
  updatedAt:  'updated_at',
});

// ─── Milestone Model ───────────────────────────────────────────────────────────
const Milestone = sequelize.define('Milestone', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  project_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: { model: 'projects', key: 'id' },
  },
  title: {
    type: DataTypes.STRING(255),
    allowNull: false,
  },
  is_complete: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  due_date: {
    type: DataTypes.DATEONLY,
  },
  sort_order: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
}, {
  tableName:  'milestones',
  timestamps: false,         // milestones table has no updated_at
  createdAt:  'created_at',
  updatedAt:  false,
});

// ─── Associations ──────────────────────────────────────────────────────────────
Project.belongsTo(User,      { foreignKey: 'client_id', as: 'client' });
Project.hasMany(Milestone,   { foreignKey: 'project_id', as: 'milestones' });

export { Milestone };
export default Project;

// ─── Shared include config for client JOIN ────────────────────────────────────
const CLIENT_INCLUDE = {
  model: User,
  as: 'client',
  attributes: [['name', 'client_name']],  // aliased so controllers get client_name
};

// Helper to flatten the nested Sequelize association onto the project object
function flattenProject(project) {
  const p = project.toJSON();
  p.client_name = p.client?.client_name ?? p.client?.name ?? null;
  delete p.client;
  return p;
}

// ─── Named export functions ────────────────────────────────────────────────────

export async function findAllByClient(clientId) {
  const rows = await Project.findAll({
    where: { client_id: clientId },
    include: [{ model: User, as: 'client', attributes: ['name'] }],
    order: [['created_at', 'DESC']],
  });
  return rows.map((r) => {
    const p = r.toJSON();
    p.client_name = p.client?.name ?? null;
    delete p.client;
    return p;
  });
}

export async function findAll() {
  const rows = await Project.findAll({
    include: [{ model: User, as: 'client', attributes: ['name'] }],
    order: [['created_at', 'DESC']],
  });
  return rows.map((r) => {
    const p = r.toJSON();
    p.client_name = p.client?.name ?? null;
    delete p.client;
    return p;
  });
}

export async function findById(id) {
  const project = await Project.findByPk(id, {
    include: [
      { model: User,      as: 'client',     attributes: ['name'] },
      { model: Milestone, as: 'milestones', attributes: ['id', 'title', 'is_complete', 'due_date', 'sort_order'],
        order: [['sort_order', 'ASC']] },
    ],
  });
  if (!project) return null;

  const p = project.toJSON();
  p.client_name = p.client?.name ?? null;
  delete p.client;
  // Sequelize returns milestones ordered by the association order option
  return p;
}

export async function create({ clientId, name, description, status = 'Planning', progress = 0, dueDate, color = 'purple' }) {
  const project = await Project.create({
    client_id:   clientId,
    name,
    description,
    status,
    progress,
    due_date:    dueDate,
    color,
  });
  return project.toJSON();
}

export async function updateProject(id, { status, progress, name, description, dueDate }) {
  const updates = {};
  if (status      !== undefined) updates.status      = status;
  if (progress    !== undefined) updates.progress    = progress;
  if (name        !== undefined) updates.name        = name;
  if (description !== undefined) updates.description = description;
  if (dueDate     !== undefined) updates.due_date    = dueDate;

  if (Object.keys(updates).length === 0) return null;

  const [affectedCount, rows] = await Project.update(updates, {
    where:     { id },
    returning: true,
  });

  return affectedCount > 0 ? rows[0].toJSON() : null;
}
