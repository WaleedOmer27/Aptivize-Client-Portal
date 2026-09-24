/**
 * migrate.js — One-time schema migration script
 *
 * Run with:  node --env-file=.env config/migrate.js
 *
 * This creates all tables in the correct order and seeds one admin user
 * and one client user so you can test login immediately.
 *
 * Safe to re-run — uses CREATE TABLE IF NOT EXISTS so existing data is preserved.
 */

import sequelize from './sequelize.js';
import bcrypt from 'bcryptjs';

// Compat helper: mirrors the old pg pool query() signature so every
// call inside migrate() works without modification.
// pg uses $1/$2 placeholders; Sequelize with bind: [] uses the same syntax.
const query = (sql, params) => sequelize.query(sql, { bind: params ?? [], raw: true });

async function migrate() {
  console.log('🔄 Running migrations...\n');

  // ─── 1. users table ────────────────────────────────────────────────────────
  // This is the core auth table. Every person who can log in has a row here.
  //
  // id          → auto-incrementing primary key (SERIAL = integer + sequence)
  // email       → must be unique across all users — used as the login identifier
  // password    → bcrypt hash of the real password, NEVER the plaintext
  // role        → drives RBAC; 'admin' | 'employee' | 'client'
  // is_active   → soft disable an account without deleting it
  // created_at  → auto-set by DEFAULT NOW() — PostgreSQL fills this for you
  await query(`
    CREATE TABLE IF NOT EXISTS users (
      id         SERIAL PRIMARY KEY,
      name       VARCHAR(100) NOT NULL,
      email      VARCHAR(255) UNIQUE NOT NULL,
      password   VARCHAR(255) NOT NULL,
      role       VARCHAR(20)  NOT NULL DEFAULT 'client'
                   CHECK (role IN ('admin', 'employee', 'client')),
      is_active  BOOLEAN NOT NULL DEFAULT true,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);
  console.log('✅ Table: users');

  // ─── 2. projects table ─────────────────────────────────────────────────────
  // Each project belongs to a client (client_id → users.id).
  // status: 'In Progress' | 'Completed' | 'On Hold' | 'Planning'
  // progress: 0-100 integer representing % complete
  // color: used by the frontend to pick accent color (purple/blue/green/amber/cyan/red)
  await query(`
    CREATE TABLE IF NOT EXISTS projects (
      id          SERIAL PRIMARY KEY,
      client_id   INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      name        VARCHAR(200) NOT NULL,
      description TEXT,
      status      VARCHAR(30)  NOT NULL DEFAULT 'Planning'
                    CHECK (status IN ('Planning', 'In Progress', 'On Hold', 'Completed')),
      progress    INTEGER NOT NULL DEFAULT 0 CHECK (progress BETWEEN 0 AND 100),
      due_date    DATE,
      color       VARCHAR(20) NOT NULL DEFAULT 'purple',
      created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);
  console.log('✅ Table: projects');

  // ─── 3. milestones table ───────────────────────────────────────────────────
  // Milestones belong to a project and track sub-deliverables.
  // sort_order controls display ordering on the detail page.
  await query(`
    CREATE TABLE IF NOT EXISTS milestones (
      id          SERIAL PRIMARY KEY,
      project_id  INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
      title       VARCHAR(200) NOT NULL,
      is_complete BOOLEAN NOT NULL DEFAULT false,
      due_date    DATE,
      sort_order  INTEGER NOT NULL DEFAULT 0,
      created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);
  console.log('✅ Table: milestones');

  // ─── 4. Seed users ─────────────────────────────────────────────────────────
  // We use INSERT ... ON CONFLICT DO NOTHING so re-running this script
  // won't fail or create duplicate rows. If the email already exists,
  // PostgreSQL silently skips that insert.

  const saltRounds = 10; // bcrypt cost factor — 10 is the standard default

  const adminHash = await bcrypt.hash('Admin@123', saltRounds);
  const clientHash = await bcrypt.hash('Client@123', saltRounds);

  await query(
    `INSERT INTO users (name, email, password, role)
     VALUES ($1, $2, $3, $4)
     ON CONFLICT (email) DO NOTHING`,
    ['Waleed Omer', 'admin@aptivize.com', adminHash, 'admin'],
  );
  console.log('✅ Seed:  admin@aptivize.com  (password: Admin@123)');

  await query(
    `INSERT INTO users (name, email, password, role)
     VALUES ($1, $2, $3, $4)
     ON CONFLICT (email) DO NOTHING`,
    ['John Client', 'client@aptivize.com', clientHash, 'client'],
  );
  console.log('✅ Seed:  client@aptivize.com  (password: Client@123)');

  // ─── 5. Seed projects ──────────────────────────────────────────────────────
  // Look up the client user's id so we can link projects to them.
  // If projects already exist for this client, skip seeding.
  const clientRow = await query(
    `SELECT id FROM users WHERE email = $1 LIMIT 1`,
    ['client@aptivize.com'],
  );
  const clientId = clientRow.rows[0]?.id;

  if (clientId) {
    const existingProjects = await query(
      `SELECT id FROM projects WHERE client_id = $1 LIMIT 1`,
      [clientId],
    );

    if (existingProjects.rows.length === 0) {
      // Seed 3 realistic projects
      const p1 = await query(
        `INSERT INTO projects (client_id, name, description, status, progress, due_date, color)
         VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id`,
        [
          clientId,
          'Website Redesign',
          'Complete overhaul of the public-facing website with new brand guidelines and improved UX.',
          'In Progress',
          75,
          '2026-08-20',
          'purple',
        ],
      );

      const p2 = await query(
        `INSERT INTO projects (client_id, name, description, status, progress, due_date, color)
         VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id`,
        [
          clientId,
          'Mobile App MVP',
          'Cross-platform React Native app for iOS and Android. Core features: auth, dashboard, notifications.',
          'In Progress',
          40,
          '2026-09-05',
          'blue',
        ],
      );

      const p3 = await query(
        `INSERT INTO projects (client_id, name, description, status, progress, due_date, color)
         VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id`,
        [
          clientId,
          'Brand Identity',
          'Logo design, brand guidelines, color palette, typography, and marketing collateral.',
          'Completed',
          100,
          '2026-07-15',
          'green',
        ],
      );

      const pid1 = p1.rows[0].id;
      const pid2 = p2.rows[0].id;
      const pid3 = p3.rows[0].id;

      // Milestones for Website Redesign
      await query(
        `INSERT INTO milestones (project_id, title, is_complete, due_date, sort_order) VALUES
         ($1, 'Discovery & Requirements', true,  '2026-07-01', 1),
         ($1, 'Wireframes & Prototypes',  true,  '2026-07-15', 2),
         ($1, 'Design System & UI Kit',   true,  '2026-07-30', 3),
         ($1, 'Frontend Development',     false, '2026-08-15', 4),
         ($1, 'QA & Browser Testing',     false, '2026-08-18', 5),
         ($1, 'Go Live',                  false, '2026-08-20', 6)`,
        [pid1],
      );

      // Milestones for Mobile App MVP
      await query(
        `INSERT INTO milestones (project_id, title, is_complete, due_date, sort_order) VALUES
         ($1, 'Project Setup & Architecture', true,  '2026-07-20', 1),
         ($1, 'Authentication Screens',       true,  '2026-08-01', 2),
         ($1, 'Dashboard & Data Layer',       false, '2026-08-20', 3),
         ($1, 'Push Notifications',           false, '2026-08-28', 4),
         ($1, 'Beta Testing',                 false, '2026-09-01', 5),
         ($1, 'App Store Submission',         false, '2026-09-05', 6)`,
        [pid2],
      );

      // Milestones for Brand Identity (all complete)
      await query(
        `INSERT INTO milestones (project_id, title, is_complete, due_date, sort_order) VALUES
         ($1, 'Brand Audit & Research',   true, '2026-06-15', 1),
         ($1, 'Logo Concepts',            true, '2026-06-25', 2),
         ($1, 'Final Logo & Variations',  true, '2026-07-01', 3),
         ($1, 'Brand Guidelines PDF',     true, '2026-07-08', 4),
         ($1, 'Marketing Collateral',     true, '2026-07-15', 5)`,
        [pid3],
      );

      console.log('✅ Seed:  3 projects + milestones for client@aptivize.com');
    } else {
      console.log('⏭️  Seed:  Projects already seeded — skipping');
    }
  }

  console.log('\n🎉 Migration complete. Database is ready.');
  process.exit(0);
}

migrate().catch((err) => {
  console.error('❌ Migration failed:', err.message);
  process.exit(1);
});
