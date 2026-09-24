/**
 * services/api.js
 *
 * Typed API helper functions for making HTTP requests.
 * All helpers use the shared `api` axios instance from AuthContext,
 * which automatically attaches the JWT Authorization header.
 *
 * Import the `api` instance here so pages don't need to pull it from context.
 */

import { api } from '../context/AuthContext';

// ─── Profile ──────────────────────────────────────────────────────────────────

/** PATCH /api/users/me — update name and/or email */
export const updateProfile = ({ name, email }) =>
  api.patch('/users/me', { name, email }).then((r) => r.data);

/** PATCH /api/users/me/password — change password */
export const changePassword = ({ currentPassword, newPassword }) =>
  api.patch('/users/me/password', { currentPassword, newPassword }).then((r) => r.data);

// ─── Admin — User Management ──────────────────────────────────────────────────

/**
 * GET /api/admin/users
 * @param {{ page?: number, limit?: number, role?: string }} params
 */
export const adminGetUsers = (params = {}) =>
  api.get('/admin/users', { params }).then((r) => r.data);

/** POST /api/admin/users */
export const adminCreateUser = ({ name, email, password, role }) =>
  api.post('/admin/users', { name, email, password, role }).then((r) => r.data);

/** PATCH /api/admin/users/:id */
export const adminEditUser = (id, { name, email, role }) =>
  api.patch(`/admin/users/${id}`, { name, email, role }).then((r) => r.data);

/** DELETE /api/admin/users/:id (soft delete) */
export const adminDeleteUser = (id) =>
  api.delete(`/admin/users/${id}`).then((r) => r.data);

// ─── Admin — Analytics ────────────────────────────────────────────────────────

/** GET /api/admin/analytics */
export const adminGetAnalytics = () =>
  api.get('/admin/analytics').then((r) => r.data);

// ─── Admin — Projects ─────────────────────────────────────────────────────────

/**
 * GET /api/admin/users?role=client&limit=200
 * Fetches all client accounts for the Create Project dropdown.
 */
export const adminGetClients = () =>
  api.get('/admin/users', { params: { role: 'client', limit: 200 } }).then((r) => r.data.users);

/**
 * POST /api/projects — create a new project (admin only)
 * @param {{ clientId, name, description?, status?, progress?, dueDate?, color? }} data
 */
export const adminCreateProject = (data) =>
  api.post('/projects', data).then((r) => r.data);

// ─── Notifications ────────────────────────────────────────────────────────────

/** GET /api/notifications — last 30 notifications + unread count */
export const getNotifications = () =>
  api.get('/notifications').then((r) => r.data);

/** GET /api/notifications/unread-count — badge count only */
export const getNotificationUnreadCount = () =>
  api.get('/notifications/unread-count').then((r) => r.data.count);

/** PATCH /api/notifications/:id/read — mark one as read */
export const markNotificationRead = (id) =>
  api.patch(`/notifications/${id}/read`).then((r) => r.data);

/** PATCH /api/notifications/read-all — mark all as read */
export const markAllNotificationsRead = () =>
  api.patch('/notifications/read-all').then((r) => r.data);
