/**
 * migrate_notifications.js — Adds the notifications table
 *
 * Run with:  node --env-file=.env config/migrate_notifications.js
 *
 * Safe to re-run — uses CREATE TABLE IF NOT EXISTS.
 */

import sequelize from './sequelize.js';

const query = (sql, params) => sequelize.query(sql, { bind: params ?? [], raw: true });

async function migrate() {
  console.log('🔄 Running notifications migration...\n');

  await query(`
    CREATE TABLE IF NOT EXISTS notifications (
      id         SERIAL PRIMARY KEY,
      user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      type       VARCHAR(50)  NOT NULL,
      title      VARCHAR(255) NOT NULL,
      body       TEXT,
      link       VARCHAR(255),
      is_read    BOOLEAN NOT NULL DEFAULT false,
      created_at TIMESTAMPTZ  NOT NULL DEFAULT NOW()
    )
  `);
  console.log('✅ Table: notifications');

  await query(`CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id)`);
  await query(`CREATE INDEX IF NOT EXISTS idx_notifications_is_read  ON notifications(is_read)`);
  console.log('✅ Indexes created');

  await sequelize.close();
  console.log('\n✅ Notifications migration complete.');
}

migrate().catch((err) => {
  console.error('❌ Migration failed:', err.message);
  process.exit(1);
});
