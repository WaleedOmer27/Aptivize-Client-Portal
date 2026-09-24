/**
 * components/Navbar.jsx
 *
 * Top navigation bar used in MainLayout (client / employee views).
 * Features:
 *   - Search input (cosmetic/placeholder, ⌘K shortcut)
 *   - Dark/light theme toggle
 *   - Notification bell with real unread badge + dropdown panel
 */

import { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiSearch, FiBell, FiSun, FiMoon, FiCheck, FiCheckCircle, FiAlertCircle, FiMessageSquare, FiFolder, FiFileText } from 'react-icons/fi';
import { useTheme } from '../context/ThemeContext';
import { useNotifications } from '../context/NotificationContext';

// ─── Icon map by notification type ───────────────────────────────────────────
const TYPE_ICON = {
  ticket_reply:   FiAlertCircle,
  ticket_status:  FiCheckCircle,
  message:        FiMessageSquare,
  project_update: FiFolder,
  invoice_paid:   FiFileText,
  invoice_new:    FiFileText,
};

const TYPE_COLOR = {
  ticket_reply:   '#f59e0b',
  ticket_status:  '#22c55e',
  message:        '#6366f1',
  project_update: '#3b82f6',
  invoice_paid:   '#22c55e',
  invoice_new:    '#f59e0b',
};

function relTime(iso) {
  const d    = new Date(iso);
  const diff = (Date.now() - d) / 1000;
  if (diff < 60)       return 'Just now';
  if (diff < 3600)     return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400)    return `${Math.floor(diff / 3600)}h ago`;
  return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
}

// ─── Notification dropdown ────────────────────────────────────────────────────
const NotificationDropdown = ({ onClose }) => {
  const { notifications, loadingList, fetchAll, markOne, markAll, unreadCount } = useNotifications();
  const navigate = useNavigate();

  useEffect(() => {
    fetchAll();
  }, []); // eslint-disable-line

  const handleItemClick = async (n) => {
    if (!n.is_read) await markOne(n.id);
    onClose();
    if (n.link) navigate(n.link);
  };

  return (
    <div
      className="absolute right-0 top-full mt-2 rounded-xl overflow-hidden z-50"
      style={{
        width: '360px',
        background: 'var(--color-surface)',
        border: '1px solid var(--color-border)',
        boxShadow: 'var(--shadow-lg)',
      }}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between px-4 py-3 border-b"
        style={{ borderColor: 'var(--color-border)' }}
      >
        <div className="flex items-center gap-2">
          <FiBell size={15} style={{ color: 'var(--color-primary)' }} />
          <span className="font-semibold text-sm" style={{ color: 'var(--color-text)' }}>
            Notifications
          </span>
          {unreadCount > 0 && (
            <span
              className="text-[10px] font-bold px-1.5 py-0.5 rounded-full"
              style={{ background: 'var(--color-primary)', color: '#fff' }}
            >
              {unreadCount}
            </span>
          )}
        </div>
        {unreadCount > 0 && (
          <button
            onClick={markAll}
            className="flex items-center gap-1 text-xs font-medium hover:underline"
            style={{ color: 'var(--color-primary)' }}
          >
            <FiCheck size={11} />
            Mark all read
          </button>
        )}
      </div>

      {/* List */}
      <div className="overflow-y-auto" style={{ maxHeight: '380px' }}>
        {loadingList ? (
          <div className="flex items-center justify-center py-8">
            <div
              className="w-5 h-5 rounded-full border-2 border-t-transparent animate-spin"
              style={{ borderColor: 'var(--color-primary)' }}
            />
          </div>
        ) : notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 gap-2">
            <FiBell size={28} style={{ color: 'var(--color-text-subtle)' }} />
            <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
              You're all caught up!
            </p>
          </div>
        ) : (
          notifications.map((n) => {
            const Icon  = TYPE_ICON[n.type]  ?? FiBell;
            const color = TYPE_COLOR[n.type] ?? 'var(--color-primary)';
            return (
              <button
                key={n.id}
                onClick={() => handleItemClick(n)}
                className="w-full flex items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-[var(--color-surface-2)]"
                style={{
                  borderBottom: '1px solid var(--color-border)',
                  background: n.is_read ? 'transparent' : 'rgba(124,58,237,0.04)',
                }}
              >
                {/* Icon bubble */}
                <div
                  className="w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center mt-0.5"
                  style={{ background: `${color}1a` }}
                >
                  <Icon size={14} style={{ color }} />
                </div>

                {/* Text */}
                <div className="flex-1 min-w-0">
                  <p
                    className={`text-sm leading-snug ${n.is_read ? '' : 'font-semibold'}`}
                    style={{ color: 'var(--color-text)' }}
                  >
                    {n.title}
                  </p>
                  {n.body && (
                    <p
                      className="text-xs mt-0.5 line-clamp-2"
                      style={{ color: 'var(--color-text-muted)' }}
                    >
                      {n.body}
                    </p>
                  )}
                  <p className="text-[10px] mt-1" style={{ color: 'var(--color-text-subtle)' }}>
                    {relTime(n.created_at)}
                  </p>
                </div>

                {/* Unread dot */}
                {!n.is_read && (
                  <div
                    className="w-2 h-2 rounded-full mt-1.5 flex-shrink-0"
                    style={{ background: 'var(--color-primary)' }}
                  />
                )}
              </button>
            );
          })
        )}
      </div>

      {/* Footer */}
      {notifications.length > 0 && (
        <div
          className="px-4 py-2 border-t text-center"
          style={{ borderColor: 'var(--color-border)' }}
        >
          <p className="text-xs" style={{ color: 'var(--color-text-subtle)' }}>
            Showing last {notifications.length} notifications
          </p>
        </div>
      )}
    </div>
  );
};

// ─── Main Navbar ──────────────────────────────────────────────────────────────
const Navbar = () => {
  const { theme, toggleTheme } = useTheme();
  const { unreadCount }        = useNotifications();

  const [open, setOpen] = useState(false);
  const dropdownRef     = useRef(null);

  // Close dropdown on outside click
  const handleOutside = useCallback((e) => {
    if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
      setOpen(false);
    }
  }, []);

  useEffect(() => {
    if (open) {
      document.addEventListener('mousedown', handleOutside);
    } else {
      document.removeEventListener('mousedown', handleOutside);
    }
    return () => document.removeEventListener('mousedown', handleOutside);
  }, [open, handleOutside]);

  return (
    <header
      className="flex items-center justify-between px-6 py-3 border-b sticky top-0 z-20"
      style={{
        background:   'var(--color-topbar-bg)',
        borderColor:  'var(--color-border)',
      }}
    >
      {/* Left — Search */}
      <div className="relative flex items-center">
        <FiSearch
          size={14}
          className="absolute left-3"
          style={{ color: 'var(--color-text-subtle)' }}
        />
        <input
          type="text"
          placeholder="Search portal..."
          className="input-field pl-9 pr-4 py-2 text-sm rounded-lg w-56"
          style={{ fontSize: '13px' }}
        />
        <kbd
          className="absolute right-3 text-[10px] px-1.5 py-0.5 rounded font-mono"
          style={{
            background: 'var(--color-surface-2)',
            color:      'var(--color-text-subtle)',
            border:     '1px solid var(--color-border)',
          }}
        >
          ⌘K
        </kbd>
      </div>

      {/* Right — actions */}
      <div className="flex items-center gap-1.5">
        {/* Theme toggle */}
        <button
          onClick={toggleTheme}
          className="w-9 h-9 flex items-center justify-center rounded-lg nav-item"
          title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
        >
          {theme === 'dark' ? (
            <FiSun  size={16} style={{ color: 'var(--color-text-muted)' }} />
          ) : (
            <FiMoon size={16} style={{ color: 'var(--color-text-muted)' }} />
          )}
        </button>

        {/* Notifications */}
        <div className="relative" ref={dropdownRef}>
          <button
            id="notification-bell"
            onClick={() => setOpen((o) => !o)}
            className="relative w-9 h-9 flex items-center justify-center rounded-lg nav-item"
            title="Notifications"
          >
            <FiBell size={16} style={{ color: 'var(--color-text-muted)' }} />
            {unreadCount > 0 && (
              <span
                className="absolute top-1 right-1 min-w-[14px] h-[14px] rounded-full flex items-center justify-center text-white font-bold"
                style={{
                  background: 'var(--color-primary)',
                  fontSize:   '9px',
                  lineHeight: 1,
                  padding:    '0 3px',
                }}
              >
                {unreadCount > 99 ? '99+' : unreadCount}
              </span>
            )}
          </button>

          {open && <NotificationDropdown onClose={() => setOpen(false)} />}
        </div>
      </div>
    </header>
  );
};

export default Navbar;
