/**
 * context/NotificationContext.jsx
 *
 * Provides real-time-like notification awareness to the entire app.
 * Polls GET /api/notifications/unread-count every 30 seconds while logged in.
 * Exposes:
 *   unreadCount   — integer, used for the bell badge
 *   notifications — array of recent notifications (loaded on dropdown open)
 *   fetchUnread() — manually re-poll the count (called after mark-read)
 *   fetchAll()    — load the full notification list
 *   markOne(id)   — PATCH /api/notifications/:id/read
 *   markAll()     — PATCH /api/notifications/read-all
 */

import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { api } from './AuthContext';
import { useAuth } from './AuthContext';

const NotificationContext = createContext(null);

const POLL_INTERVAL_MS = 30_000; // 30 seconds

export const NotificationProvider = ({ children }) => {
  const { isAuthenticated } = useAuth();

  const [unreadCount,    setUnreadCount]    = useState(0);
  const [notifications,  setNotifications]  = useState([]);
  const [loadingList,    setLoadingList]    = useState(false);

  const intervalRef = useRef(null);

  // ── Fetch just the count (cheap, used for badge) ─────────────────────────
  const fetchUnread = useCallback(async () => {
    if (!isAuthenticated) return;
    try {
      const res = await api.get('/notifications/unread-count');
      setUnreadCount(res.data.count ?? 0);
    } catch {
      // Silently ignore — badge just won't update
    }
  }, [isAuthenticated]);

  // ── Fetch full list (used when dropdown is opened) ────────────────────────
  const fetchAll = useCallback(async () => {
    if (!isAuthenticated) return;
    setLoadingList(true);
    try {
      const res = await api.get('/notifications');
      setNotifications(res.data.notifications ?? []);
      setUnreadCount(res.data.unread ?? 0);
    } catch {
      // Silently ignore
    } finally {
      setLoadingList(false);
    }
  }, [isAuthenticated]);

  // ── Mark a single notification as read ────────────────────────────────────
  const markOne = useCallback(async (id) => {
    try {
      await api.patch(`/notifications/${id}/read`);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, is_read: true } : n)),
      );
      setUnreadCount((c) => Math.max(0, c - 1));
    } catch {
      // ignore
    }
  }, []);

  // ── Mark all as read ──────────────────────────────────────────────────────
  const markAll = useCallback(async () => {
    try {
      await api.patch('/notifications/read-all');
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
      setUnreadCount(0);
    } catch {
      // ignore
    }
  }, []);

  // ── Polling: start when authenticated, stop when logged out ───────────────
  useEffect(() => {
    if (!isAuthenticated) {
      clearInterval(intervalRef.current);
      setUnreadCount(0);
      setNotifications([]);
      return;
    }

    // Immediate first fetch
    fetchUnread();

    // Then poll every 30 s
    intervalRef.current = setInterval(fetchUnread, POLL_INTERVAL_MS);

    return () => clearInterval(intervalRef.current);
  }, [isAuthenticated, fetchUnread]);

  return (
    <NotificationContext.Provider
      value={{ unreadCount, notifications, loadingList, fetchUnread, fetchAll, markOne, markAll }}
    >
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => {
  const ctx = useContext(NotificationContext);
  if (!ctx) throw new Error('useNotifications must be used inside NotificationProvider');
  return ctx;
};
