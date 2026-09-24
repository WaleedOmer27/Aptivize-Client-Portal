/**
 * models/Invoice.js
 *
 * Sequelize model for the "invoices" table.
 * Exports the same named functions as the old raw-SQL model:
 *
 *   centsToDisplay(cents)               → "$2,400.00"
 *   findAllByClient(clientId)           → invoice rows
 *   findAll()                           → all invoice rows (admin)
 *   findById(id)                        → invoice row | null
 *   markPaid(id)                        → updated invoice row | null
 *
 * Money is stored as integer cents (amount_cents) to avoid floating-point
 * rounding issues. The controller calls centsToDisplay() to format for the UI.
 */

import { DataTypes, literal } from 'sequelize';
import sequelize from '../config/sequelize.js';
import User from './User.js';
import Project from './Project.js';

// ─── Model Definition ─────────────────────────────────────────────────────────
const Invoice = sequelize.define('Invoice', {
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
  project_id: {
    type: DataTypes.INTEGER,
    references: { model: 'projects', key: 'id' },
  },
  invoice_no: {
    type: DataTypes.STRING(50),
    allowNull: false,
    unique: true,
  },
  description: {
    type: DataTypes.TEXT,
  },
  amount_cents: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
  },
  status: {
    type: DataTypes.STRING(20),
    defaultValue: 'pending',
  },
  due_date: {
    type: DataTypes.DATEONLY,
  },
  paid_at: {
    type: DataTypes.DATE,
  },
}, {
  tableName:  'invoices',
  timestamps: true,
  createdAt:  'created_at',
  updatedAt:  'updated_at',
});

// ─── Associations ──────────────────────────────────────────────────────────────
Invoice.belongsTo(User,    { foreignKey: 'client_id',  as: 'client'  });
Invoice.belongsTo(Project, { foreignKey: 'project_id', as: 'project' });

export default Invoice;

// ─── Helper: cents → USD display string ──────────────────────────────────────
export function centsToDisplay(cents) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(cents / 100);
}

// ─── Shared include config ─────────────────────────────────────────────────────
const INCLUDES = [
  { model: User,    as: 'client',  attributes: ['name'] },
  { model: Project, as: 'project', attributes: ['name'], required: false },
];

function flattenInvoice(inv) {
  const i = inv.toJSON();
  i.client_name  = i.client?.name  ?? null;
  i.project_name = i.project?.name ?? null;
  delete i.client;
  delete i.project;
  return i;
}

// ─── Named export functions ────────────────────────────────────────────────────

export async function findAllByClient(clientId) {
  const rows = await Invoice.findAll({
    where:   { client_id: clientId },
    include: INCLUDES,
    order:   [['created_at', 'DESC']],
  });
  return rows.map(flattenInvoice);
}

export async function findAll() {
  const rows = await Invoice.findAll({
    include: INCLUDES,
    order:   [['created_at', 'DESC']],
  });
  return rows.map(flattenInvoice);
}

export async function findById(id) {
  const inv = await Invoice.findByPk(id, { include: INCLUDES });
  return inv ? flattenInvoice(inv) : null;
}

export async function markPaid(id) {
  const [affected, rows] = await Invoice.update(
    { status: 'paid', paid_at: new Date() },
    { where: { id, status: 'pending' }, returning: true },
  );
  return affected > 0 ? rows[0].toJSON() : null;
}
