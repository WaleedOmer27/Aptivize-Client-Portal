import { NavLink, useNavigate } from 'react-router-dom';
import aptivizeLogo from '../assets/aptivize_logo.jpeg';
import {
  FiGrid,
  FiFolder,
  FiMessageSquare,
  FiFileText,
  FiLifeBuoy,
  FiUser,
  FiLogOut,
  FiChevronLeft,
  FiChevronRight,
  FiShield,
} from 'react-icons/fi';
import { useState } from 'react';
import { useAuth } from '../context/AuthContext';


const navItems = [
  { to: '/dashboard', icon: FiGrid,         label: 'Dashboard' },
  { to: '/projects',  icon: FiFolder,        label: 'Projects' },
  { to: '/messages',  icon: FiMessageSquare, label: 'Messages' },
  { to: '/invoices',  icon: FiFileText,      label: 'Invoices' },
  { to: '/support',   icon: FiLifeBuoy,      label: 'Support' },
  { to: '/profile',   icon: FiUser,          label: 'Profile' },
];

const Sidebar = () => {
  const [collapsed, setCollapsed] = useState(false);
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <aside
      className="relative flex flex-col h-screen flex-shrink-0 transition-all duration-300"
      style={{
        width: collapsed ? '72px' : '220px',
        background: 'var(--color-sidebar-bg)',
        borderRight: '1px solid var(--color-sidebar-border)',
      }}
    >
      {/* Logo */}
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
          <span
            className="font-bold text-sm tracking-wide uppercase"
            style={{ color: 'var(--color-primary)' }}
          >
            Portal
          </span>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 py-4 px-2 flex flex-col gap-1 overflow-y-auto">
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `nav-item flex items-center gap-3 px-3 py-2.5 text-sm font-medium ${isActive ? 'active' : ''}`
            }
            title={collapsed ? label : undefined}
          >
            <Icon size={17} className="flex-shrink-0" />
            {!collapsed && <span>{label}</span>}
          </NavLink>
        ))}

        {/* Admin panel link — only shown to admins */}
        {user?.role === 'admin' && (
          <>
            <div
              className="mx-3 my-2"
              style={{ height: '1px', background: 'var(--color-sidebar-border)' }}
            />
            <NavLink
              to="/admin"
              className={({ isActive }) =>
                `nav-item flex items-center gap-3 px-3 py-2.5 text-sm font-medium ${isActive ? 'active' : ''}`
              }
              title={collapsed ? 'Admin Panel' : undefined}
            >
              <FiShield size={17} className="flex-shrink-0" style={{ color: '#ef4444' }} />
              {!collapsed && (
                <span className="flex items-center gap-2">
                  Admin Panel
                  <span
                    className="text-[9px] font-bold px-1.5 py-0.5 rounded"
                    style={{ background: 'rgba(239,68,68,0.15)', color: '#ef4444' }}
                  >
                    ADMIN
                  </span>
                </span>
              )}
            </NavLink>
          </>
        )}
      </nav>

      {/* User + Logout */}
      <div
        className="border-t px-2 py-3"
        style={{ borderColor: 'var(--color-sidebar-border)' }}
      >
        {/* User row */}
        <div className="flex items-center gap-3 px-3 py-2 mb-1">
          <div className="w-8 h-8 rounded-full bg-[var(--color-primary)] flex items-center justify-center flex-shrink-0">
            <span className="text-white text-xs font-bold">
              {user?.name?.[0] ?? 'U'}
            </span>
          </div>
          {!collapsed && (
            <div className="min-w-0">
              <p className="text-xs font-semibold truncate" style={{ color: 'var(--color-text)' }}>
                {user?.name ?? 'User'}
              </p>
              <p className="text-[11px] truncate" style={{ color: 'var(--color-text-subtle)' }}>
                {user?.role ?? 'Client'}
              </p>
            </div>
          )}
        </div>

        {/* Logout */}
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
          background: 'var(--color-surface)',
          border: '1px solid var(--color-border)',
          color: 'var(--color-text-muted)',
          boxShadow: 'var(--shadow-sm)',
        }}
        title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
      >
        {collapsed ? <FiChevronRight size={13} /> : <FiChevronLeft size={13} />}
      </button>
    </aside>
  );
};

export default Sidebar;
