import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import {
  FiGrid,
  FiUsers,
  FiBriefcase,
  FiBarChart2,
  FiLogOut,
  FiChevronLeft,
  FiChevronRight,
  FiUser,
  FiPlusCircle,
  FiBell,
  FiSun,
  FiMoon,
} from 'react-icons/fi';
import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useNotifications } from '../context/NotificationContext';
import aptivizeLogo from '../assets/aptivize_logo.jpeg';

const adminNavItems = [
  { to: '/admin',               icon: FiGrid,        label: 'Dashboard',      end: true },
  { to: '/admin/clients',       icon: FiUsers,       label: 'Clients'                   },
  { to: '/admin/employees',     icon: FiBriefcase,   label: 'Employees'                 },
  { to: '/admin/analytics',     icon: FiBarChart2,   label: 'Analytics'                 },
  { to: '/admin/projects/new',  icon: FiPlusCircle,  label: 'New Project'               },
];

const AdminLayout = () => {
  const [collapsed, setCollapsed] = useState(false);
  const { user, logout }          = useAuth();
  const { theme, toggleTheme }    = useTheme();
  const { unreadCount }           = useNotifications();
  const navigate                  = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const initials = (user?.name ?? 'A').split(' ').map((w) => w[0]).join('').toUpperCase().slice(0, 2);

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: 'var(--color-bg)' }}>
      {/* ── Admin Sidebar ─────────────────────────────────────────────────── */}
      <aside
        className="relative flex flex-col h-screen flex-shrink-0 transition-all duration-300"
        style={{
          width:       collapsed ? '72px' : '220px',
          background:  'var(--color-sidebar-bg)',
          borderRight: '1px solid var(--color-sidebar-border)',
        }}
      >
        {/* Logo + Admin badge */}
        <div
          className="flex items-center gap-3 px-4 py-5 border-b"
          style={{ borderColor: 'var(--color-sidebar-border)' }}
        >
          <img
            src={aptivizeLogo}
            alt="Aptivize"
            className="w-8 h-8 rounded-lg object-cover flex-shrink-0"
          />
          {!collapsed && (
            <div>
              <span
                className="font-bold text-sm tracking-wide uppercase block"
                style={{ color: 'var(--color-primary)' }}
              >
                Portal
              </span>
              <span
                className="text-[10px] font-semibold px-1.5 py-0.5 rounded"
                style={{ background: 'rgba(239,68,68,0.12)', color: '#ef4444' }}
              >
                ADMIN
              </span>
            </div>
          )}
        </div>

        {/* Nav */}
        <nav className="flex-1 py-4 px-2 flex flex-col gap-1 overflow-y-auto">
          {adminNavItems.map(({ to, icon: Icon, label, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                `nav-item flex items-center gap-3 px-3 py-2.5 text-sm font-medium ${isActive ? 'active' : ''}`
              }
              title={collapsed ? label : undefined}
            >
              <Icon size={17} className="flex-shrink-0" />
              {!collapsed && <span>{label}</span>}
            </NavLink>
          ))}
        </nav>

        {/* User + Logout */}
        <div
          className="border-t px-2 py-3"
          style={{ borderColor: 'var(--color-sidebar-border)' }}
        >
          <div className="flex items-center gap-3 px-3 py-2 mb-1">
            <div className="w-8 h-8 rounded-full bg-[var(--color-primary)] flex items-center justify-center flex-shrink-0">
              <span className="text-white text-xs font-bold">{initials}</span>
            </div>
            {!collapsed && (
              <div className="min-w-0">
                <p className="text-xs font-semibold truncate" style={{ color: 'var(--color-text)' }}>
                  {user?.name ?? 'Admin'}
                </p>
                <p className="text-[11px] truncate" style={{ color: '#ef4444' }}>
                  Administrator
                </p>
              </div>
            )}
          </div>
          <button
            onClick={handleLogout}
            className="nav-item w-full flex items-center gap-3 px-3 py-2.5 text-sm font-medium hover:text-red-500"
            title={collapsed ? 'Logout' : undefined}
          >
            <FiLogOut size={17} className="flex-shrink-0" />
            {!collapsed && <span>Logout</span>}
          </button>
        </div>

        {/* Collapse toggle */}
        <button
          onClick={() => setCollapsed((c) => !c)}
          className="absolute -right-3.5 top-[72px] w-7 h-7 rounded-full flex items-center justify-center text-xs transition-colors z-10"
          style={{
            background:  'var(--color-surface)',
            border:      '1px solid var(--color-border)',
            color:       'var(--color-text-muted)',
            boxShadow:   'var(--shadow-sm)',
          }}
        >
          {collapsed ? <FiChevronRight size={13} /> : <FiChevronLeft size={13} />}
        </button>
      </aside>

      {/* ── Main Content ──────────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top bar */}
        <header
          className="flex items-center justify-end gap-2 px-6 py-3 border-b flex-shrink-0"
          style={{ background: 'var(--color-topbar-bg)', borderColor: 'var(--color-border)' }}
        >
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

          {/* Notification bell (shows count, links to /admin — admin reads from portal) */}
          <button
            className="relative w-9 h-9 flex items-center justify-center rounded-lg nav-item"
            title="Notifications"
            onClick={() => navigate('/admin')}
          >
            <FiBell size={16} style={{ color: 'var(--color-text-muted)' }} />
            {unreadCount > 0 && (
              <span
                className="absolute top-1 right-1 min-w-[14px] h-[14px] rounded-full flex items-center justify-center text-white font-bold"
                style={{ background: '#ef4444', fontSize: '9px', lineHeight: 1, padding: '0 3px' }}
              >
                {unreadCount > 99 ? '99+' : unreadCount}
              </span>
            )}
          </button>
        </header>

        <main className="flex-1 overflow-y-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
