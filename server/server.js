import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import dotenv from 'dotenv';

dotenv.config();

// ─── Sequelize bootstrap ───────────────────────────────────────────────────────
// Importing models/index.js registers every model + association with Sequelize
// before any request is handled.
import sequelize from './config/sequelize.js';
import './models/index.js';

// ─── Routes ───────────────────────────────────────────────────────────────────
import authRoutes      from './routes/auth.js';
import projectRoutes   from './routes/projects.js';
import dashboardRoutes from './routes/dashboard.js';
import messageRoutes   from './routes/messages.js';
import ticketRoutes    from './routes/tickets.js';
import invoiceRoutes   from './routes/invoices.js';
import adminRoutes     from './routes/admin.js';
import notificationRoutes from './routes/notifications.js';

// ─── Global error handler ──────────────────────────────────────────────────────
import errorHandler from './middleware/errorHandler.js';

const app  = express();
const PORT = process.env.PORT || 5000;

// ─── Middleware ────────────────────────────────────────────────────────────────
app.use(cors({ origin: process.env.CLIENT_URL || 'http://localhost:5173' }));
app.use(express.json());
app.use(morgan('dev'));

// ─── Route mounts ─────────────────────────────────────────────────────────────
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use('/api/auth',          authRoutes);
app.use('/api/users',         authRoutes);   // PATCH /api/users/me, /api/users/me/password
app.use('/api/projects',      projectRoutes);
app.use('/api/dashboard',     dashboardRoutes);
app.use('/api/messages',      messageRoutes);
app.use('/api/tickets',       ticketRoutes);
app.use('/api/invoices',      invoiceRoutes);
app.use('/api/admin',         adminRoutes);
app.use('/api/notifications', notificationRoutes);

// ─── Global Error Handler ─────────────────────────────────────────────────────
// Must be registered AFTER all routes — Express identifies error handlers
// by their 4-argument signature: (err, req, res, next)
app.use(errorHandler);

// ─── Start Server ─────────────────────────────────────────────────────────────
// Authenticate the Sequelize connection first, then start listening.
// sequelize.authenticate() sends a lightweight "SELECT 1" to verify connectivity.
// alter: false → Sequelize never modifies the existing schema.
async function start() {
  try {
    await sequelize.authenticate();
    console.log('✅ Connected to Neon PostgreSQL via Sequelize');

    app.listen(PORT, () => {
      console.log(`🚀 Server running on http://localhost:${PORT}`);
    });
  } catch (err) {
    console.error('❌ Unable to connect to the database:', err.message);
    process.exit(1);
  }
}

start();

export default app;
