/**
 * config/sequelize.js
 *
 * Creates and exports the single shared Sequelize instance for the whole app.
 * Every model imports `sequelize` from here — never creates its own connection.
 *
 * Dialect: postgres  (uses the existing `pg` package under the hood)
 * Auth:    DATABASE_URL from .env — same connection string as the old pg pool
 * SSL:     required for Neon; we pass it via dialectOptions
 */

import { Sequelize } from 'sequelize';

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL is not set. Check your .env file.');
}

const sequelize = new Sequelize(process.env.DATABASE_URL, {
  dialect: 'postgres',

  dialectOptions: {
    ssl: {
      // Neon requires SSL; rejectUnauthorized:false accepts self-signed certs
      rejectUnauthorized: false,
    },
  },

  // Disable automatic pluralisation of table names — our tables already have
  // the correct names (users, projects, messages, tickets, invoices…).
  define: {
    freezeTableName: true,
    underscored: true,         // camelCase JS fields → snake_case DB columns
    timestamps: true,          // managed per-model below; default ON
    createdAt: 'created_at',
    updatedAt: 'updated_at',
  },

  logging: false,              // set to console.log during debugging if needed
});

export default sequelize;
