/**
 * routes/dashboard.js
 *
 * Mounted in server.js as: app.use('/api/dashboard', dashboardRoutes)
 *
 * Full paths:
 *   GET /api/dashboard/stats    → stat card counts (projects, invoices, etc.)
 *   GET /api/dashboard/activity → recent activity feed
 */

import { Router } from 'express';
import { protect } from '../middleware/auth.js';
import { getStats, getActivity } from '../controllers/dashboardController.js';

const router = Router();

// All dashboard routes require a valid JWT
router.use(protect);

router.get('/stats', getStats);
router.get('/activity', getActivity);

export default router;
