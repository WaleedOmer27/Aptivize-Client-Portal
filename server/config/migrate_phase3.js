/**
 * migrate_phase3.js — Phase 3 schema migration
 *
 * Run with:  node --env-file=.env config/migrate_phase3.js
 *
 * Creates:
 *   - messages
 *   - tickets
 *   - ticket_replies
 *   - invoices
 *
 * Safe to re-run — uses CREATE TABLE IF NOT EXISTS + ON CONFLICT DO NOTHING.
 */

import sequelize from './sequelize.js';

// Compat helper: mirrors the old pg pool query() signature.
const query = (sql, params) => sequelize.query(sql, { bind: params ?? [], raw: true });


async function migrate() {
  console.log('🔄 Running Phase 3 migrations…\n');

  // ─── 1. messages ─────────────────────────────────────────────────────────────
  // Flat direct-message model between a client and admin/team.
  // is_read: drives the unread badge count in the sidebar.
  await query(`
    CREATE TABLE IF NOT EXISTS messages (
      id          SERIAL PRIMARY KEY,
      sender_id   INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      receiver_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      body        TEXT    NOT NULL,
      is_read     BOOLEAN NOT NULL DEFAULT false,
      created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);
  console.log('✅ Table: messages');

  await query(`CREATE INDEX IF NOT EXISTS idx_messages_receiver ON messages(receiver_id)`);
  await query(`CREATE INDEX IF NOT EXISTS idx_messages_sender   ON messages(sender_id)`);

  // ─── 2. tickets ──────────────────────────────────────────────────────────────
  // Support tickets created by clients.
  // status:   'open' | 'in_review' | 'resolved' | 'closed'
  // priority: 'low'  | 'medium'    | 'high'
  await query(`
    CREATE TABLE IF NOT EXISTS tickets (
      id          SERIAL PRIMARY KEY,
      client_id   INTEGER      NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      title       VARCHAR(200) NOT NULL,
      description TEXT,
      status      VARCHAR(20)  NOT NULL DEFAULT 'open'
                    CHECK (status IN ('open', 'in_review', 'resolved', 'closed')),
      priority    VARCHAR(10)  NOT NULL DEFAULT 'medium'
                    CHECK (priority IN ('low', 'medium', 'high')),
      created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);
  console.log('✅ Table: tickets');

  // ─── 3. ticket_replies ────────────────────────────────────────────────────────
  await query(`
    CREATE TABLE IF NOT EXISTS ticket_replies (
      id         SERIAL PRIMARY KEY,
      ticket_id  INTEGER NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
      author_id  INTEGER NOT NULL REFERENCES users(id)   ON DELETE CASCADE,
      body       TEXT    NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);
  console.log('✅ Table: ticket_replies');

  // ─── 4. invoices ─────────────────────────────────────────────────────────────
  // amount_cents: store money as integer cents (avoids float rounding issues).
  // invoice_no:   human-readable identifier like "INV-001".
  await query(`
    CREATE TABLE IF NOT EXISTS invoices (
      id           SERIAL PRIMARY KEY,
      client_id    INTEGER      NOT NULL REFERENCES users(id)     ON DELETE CASCADE,
      project_id   INTEGER               REFERENCES projects(id)  ON DELETE SET NULL,
      invoice_no   VARCHAR(30)  NOT NULL UNIQUE,
      description  TEXT,
      amount_cents INTEGER      NOT NULL CHECK (amount_cents >= 0),
      status       VARCHAR(10)  NOT NULL DEFAULT 'pending'
                     CHECK (status IN ('pending', 'paid', 'overdue')),
      due_date     DATE,
      paid_at      TIMESTAMPTZ,
      created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);
  console.log('✅ Table: invoices');

  // ─── 5. Seed data ─────────────────────────────────────────────────────────────
  const adminRow  = await query(`SELECT id FROM users WHERE email = $1 LIMIT 1`, ['admin@aptivize.com']);
  const clientRow = await query(`SELECT id FROM users WHERE email = $1 LIMIT 1`, ['client@aptivize.com']);
  const adminId  = adminRow.rows[0]?.id;
  const clientId = clientRow.rows[0]?.id;

  if (!adminId || !clientId) {
    console.log('⚠️  Seed users not found — run migrate.js first');
    process.exit(0);
  }

  // ── Seed messages ────────────────────────────────────────────────────────────
  const existingMsgs = await query(`SELECT id FROM messages LIMIT 1`);
  if (existingMsgs.rows.length === 0) {
    await query(`
      INSERT INTO messages (sender_id, receiver_id, body, is_read, created_at) VALUES
      ($1, $2, 'Hi John! The design files for the Website Redesign project have been updated. Please review when you get a chance.', true,  NOW() - INTERVAL '2 days'),
      ($2, $1, 'Thanks! I''ll take a look this afternoon.', true,  NOW() - INTERVAL '2 days' + INTERVAL '1 hour'),
      ($1, $2, 'Quick heads-up: the Mobile App MVP is right on track. We are starting the Dashboard & Data Layer milestone this week.', false, NOW() - INTERVAL '1 hour'),
      ($1, $2, 'Also, Invoice INV-004 has been issued for the Dashboard milestone. Please review it at your convenience.', false, NOW() - INTERVAL '30 minutes')
    `, [adminId, clientId]);
    console.log('✅ Seed: messages');
  } else {
    console.log('⏭️  Seed: Messages already seeded — skipping');
  }

  // ── Seed tickets ─────────────────────────────────────────────────────────────
  const existingTickets = await query(`SELECT id FROM tickets LIMIT 1`);
  if (existingTickets.rows.length === 0) {
    const t1 = await query(`
      INSERT INTO tickets (client_id, title, description, status, priority, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5, NOW() - INTERVAL '3 days', NOW() - INTERVAL '3 days')
      RETURNING id
    `, [clientId, 'Cannot access project files', 'I am unable to download the latest design assets from the Website Redesign project. Receiving a 403 Forbidden error every time I click the download link.', 'open', 'high']);

    const t2 = await query(`
      INSERT INTO tickets (client_id, title, description, status, priority, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5, NOW() - INTERVAL '7 days', NOW() - INTERVAL '1 day')
      RETURNING id
    `, [clientId, 'Invoice amount discrepancy', 'Invoice INV-002 shows $1,800 but our signed contract specifies $1,650 for the Frontend Development phase. Please clarify the difference.', 'in_review', 'medium']);

    const t3 = await query(`
      INSERT INTO tickets (client_id, title, description, status, priority, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5, NOW() - INTERVAL '14 days', NOW() - INTERVAL '4 days')
      RETURNING id
    `, [clientId, 'Dashboard loading slowly', 'The main dashboard takes 5-6 seconds to load on first visit. Can performance be improved?', 'resolved', 'low']);

    // Replies on the in_review ticket
    await query(`
      INSERT INTO ticket_replies (ticket_id, author_id, body, created_at) VALUES
      ($1, $2, 'Thank you for flagging this, John. We are reviewing the billing records and will get back to you within 24 hours.', NOW() - INTERVAL '6 days'),
      ($1, $3, 'I also have the original signed contract if that helps. Happy to share it.', NOW() - INTERVAL '5 days' - INTERVAL '12 hours')
    `, [t2.rows[0].id, adminId, clientId]);

    // Replies on the resolved ticket
    await query(`
      INSERT INTO ticket_replies (ticket_id, author_id, body, created_at) VALUES
      ($1, $2, 'We have implemented server-side caching and moved static assets to a CDN. The dashboard should now load in under 1 second. Please confirm!', NOW() - INTERVAL '5 days'),
      ($1, $3, 'Confirmed — it is noticeably faster now. Thank you for the quick fix!', NOW() - INTERVAL '4 days' - INTERVAL '6 hours')
    `, [t3.rows[0].id, adminId, clientId]);

    console.log('✅ Seed: 3 tickets + 4 replies');
  } else {
    console.log('⏭️  Seed: Tickets already seeded — skipping');
  }

  // ── Seed invoices ─────────────────────────────────────────────────────────────
  const existingInvoices = await query(`SELECT id FROM invoices LIMIT 1`);
  if (existingInvoices.rows.length === 0) {
    const projects = await query(`SELECT id, name FROM projects WHERE client_id = $1`, [clientId]);
    const p = {};
    for (const row of projects.rows) p[row.name] = row.id;

    await query(`
      INSERT INTO invoices (client_id, project_id, invoice_no, description, amount_cents, status, due_date, paid_at, created_at, updated_at)
      VALUES
        ($1, $2, 'INV-001', 'Website Redesign – Discovery & Design Phase',   240000, 'paid',    '2026-07-15', NOW() - INTERVAL '30 days', NOW() - INTERVAL '50 days', NOW() - INTERVAL '30 days'),
        ($1, $2, 'INV-002', 'Website Redesign – Frontend Development Phase', 180000, 'paid',    '2026-07-30', NOW() - INTERVAL '15 days', NOW() - INTERVAL '35 days', NOW() - INTERVAL '15 days'),
        ($1, $3, 'INV-003', 'Mobile App MVP – Project Setup & Auth Screens',  95000, 'paid',    '2026-08-05', NOW() - INTERVAL '10 days', NOW() - INTERVAL '20 days', NOW() - INTERVAL '10 days'),
        ($1, $3, 'INV-004', 'Mobile App MVP – Dashboard & Data Layer',       320000, 'pending', '2026-09-01', NULL,                       NOW() - INTERVAL '5 days',  NOW() - INTERVAL '5 days')
    `, [clientId, p['Website Redesign'] ?? null, p['Mobile App MVP'] ?? null]);

    console.log('✅ Seed: 4 invoices');
  } else {
    console.log('⏭️  Seed: Invoices already seeded — skipping');
  }

  console.log('\n🎉 Phase 3 migration complete.');
  process.exit(0);
}

migrate().catch((err) => {
  console.error('❌ Migration failed:', err.message);
  process.exit(1);
});
