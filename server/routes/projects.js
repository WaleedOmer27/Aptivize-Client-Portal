/**
 * routes/projects.js
 *
 * Maps HTTP method + URL → controller function.
 * Mounted in server.js as: app.use('/api/projects', projectRoutes)
 *
 * Full paths:
 *   GET    /api/projects       → list (role-filtered in controller)
 *   GET    /api/projects/:id   → project detail + milestones
 *   POST   /api/projects       → create (admin only)
 *   PATCH  /api/projects/:id   → update status/progress (admin only)
 */

import { Router } from 'express';
import { body }   from 'express-validator';
import { protect, authorize } from '../middleware/auth.js';
import validate from '../middleware/validate.js';
import {
  listProjects,
  getProject,
  createProject,
  patchProject,
} from '../controllers/projectController.js';

const router = Router();

const VALID_STATUSES = ['In Progress', 'Planning', 'On Hold', 'Completed'];
const VALID_COLORS   = ['purple', 'blue', 'green', 'amber', 'cyan', 'red'];

// All project routes require a valid JWT
router.use(protect);

// Clients, employees, and admins can all read projects
router.get('/', listProjects);
router.get('/:id', getProject);

// Only admins can create or modify projects
router.post(
  '/',
  authorize('admin'),
  validate([
    body('clientId')
      .notEmpty().withMessage('clientId is required.')
      .isInt({ min: 1 }).withMessage('clientId must be a positive integer.'),
    body('name')
      .trim()
      .notEmpty().withMessage('Project name is required.')
      .isLength({ max: 200 }).withMessage('Name must be ≤ 200 characters.'),
    body('description')
      .optional()
      .trim()
      .isLength({ max: 2000 }).withMessage('Description must be ≤ 2000 characters.'),
    body('status')
      .optional()
      .isIn(VALID_STATUSES).withMessage(`status must be one of: ${VALID_STATUSES.join(', ')}`),
    body('progress')
      .optional()
      .isInt({ min: 0, max: 100 }).withMessage('progress must be an integer between 0 and 100.'),
    body('color')
      .optional()
      .isIn(VALID_COLORS).withMessage(`color must be one of: ${VALID_COLORS.join(', ')}`),
    body('dueDate')
      .optional()
      .isISO8601().withMessage('dueDate must be a valid ISO 8601 date.'),
  ]),
  createProject,
);

router.patch(
  '/:id',
  authorize('admin'),
  validate([
    body('name')
      .optional()
      .trim()
      .notEmpty().withMessage('name cannot be blank.')
      .isLength({ max: 200 }).withMessage('Name must be ≤ 200 characters.'),
    body('description')
      .optional()
      .trim()
      .isLength({ max: 2000 }).withMessage('Description must be ≤ 2000 characters.'),
    body('status')
      .optional()
      .isIn(VALID_STATUSES).withMessage(`status must be one of: ${VALID_STATUSES.join(', ')}`),
    body('progress')
      .optional()
      .isInt({ min: 0, max: 100 }).withMessage('progress must be an integer between 0 and 100.'),
    body('dueDate')
      .optional()
      .isISO8601().withMessage('dueDate must be a valid ISO 8601 date.'),
  ]),
  patchProject,
);

export default router;
