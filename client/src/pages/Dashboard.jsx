import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FiFolder,
  FiFileText,
  FiMessageSquare,
  FiLifeBuoy,
  FiClock,
  FiActivity,
  FiArrowRight,
  FiCheckCircle,
} from 'react-icons/fi';
import Card from '../components/Card';
import Spinner from '../components/Spinner';
import { useAuth } from '../context/AuthContext';

// ─── Skeleton placeholder ─────────────────────────────────────────────────────
const SkeletonBlock = ({ h = '20px', w = '100%', className = '' }) => (
  <div
    className={`rounded animate-pulse ${className}`}
    style={{ height: h, width: w, background: 'var(--color-surface-2)' }}
  />
);

// ─── Stat card config (labels + icons — values come from API) ─────────────────
const STAT_CONFIG = [
  { key: 'activeProjects',    label: 'Active Projects',    icon: FiFolder,        accent: 'purple' },
  { key: 'pendingInvoices',   label: 'Pending Invoices',   icon: FiFileText,      accent: 'amber'  },
  { key: 'unreadMessages',    label: 'Unread Messages',    icon: FiMessageSquare, accent: 'blue'   },
  { key: 'openTickets',       label: 'Open Tickets',       icon: FiLifeBuoy,      accent: 'red'    },
  { key: 'completedProjects', label: 'Completed Projects', icon: FiCheckCircle,   accent: 'green'  },
  { key: 'avgResponseTime',   label: 'Avg. Response Time', icon: FiClock,         accent: 'cyan'   },
];

const Dashboard = () => {
  const { user, api } = useAuth();
  const navigate = useNavigate();

  const [stats, setStats]       = useState(null);
  const [activity, setActivity] = useState(null);
  const [statsLoading, setStatsLoading]       = useState(true);
  const [activityLoading, setActivityLoading] = useState(true);
  const [statsError, setStatsError]           = useState('');
  const [activityError, setActivityError]     = useState('');

  // ── Fetch live stats ────────────────────────────────────────────────────────
  useEffect(() => {
    api
      .get('/dashboard/stats')
      .then((res) => setStats(res.data.stats))
      .catch(() => setStatsError('Could not load stats.'))
      .finally(() => setStatsLoading(false));
  }, [api]);

  // ── Fetch live activity feed ────────────────────────────────────────────────
  useEffect(() => {
    api
      .get('/dashboard/activity')
      .then((res) => setActivity(res.data.activity))
      .catch(() => setActivityError('Could not load activity feed.'))
      .finally(() => setActivityLoading(false));
  }, [api]);


  return (
    <div>
      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-1" style={{ color: 'var(--color-text)' }}>
          Welcome back, {user?.name ?? 'there'} 👋
        </h1>
        <p style={{ color: 'var(--color-text-muted)', fontSize: '14px' }}>
          Here's what's happening with your projects today.
        </p>
      </div>

      {/* ── Stat Cards ─────────────────────────────────────────────────────── */}
      {statsError ? (
        <div
          className="text-sm px-3 py-2 rounded-lg mb-6"
          style={{ background: 'rgba(239,68,68,0.08)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.2)' }}
        >
          {statsError}
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mb-6">
          {STAT_CONFIG.map((s) =>
            statsLoading ? (
              <Card key={s.key}>
                <SkeletonBlock h="14px" w="60%" className="mb-3" />
                <SkeletonBlock h="28px" w="40%" />
              </Card>
            ) : (
              <Card.Stat
                key={s.key}
                label={s.label}
                value={stats?.[s.key] ?? 0}
                icon={s.icon}
                accent={s.accent}
              />
            )
          )}
        </div>
      )}

      {/* ── Bottom Row ─────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

        {/* Recent Activity */}
        <Card className="lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <FiActivity size={16} style={{ color: 'var(--color-primary)' }} />
              <h2 className="font-semibold text-sm" style={{ color: 'var(--color-text)' }}>
                Recent Activity
              </h2>
            </div>
            <button
              className="text-xs font-medium flex items-center gap-1 hover:underline"
              style={{ color: 'var(--color-primary)' }}
              onClick={() => navigate('/projects')}
            >
              View Projects <FiArrowRight size={12} />
            </button>
          </div>

          {activityLoading ? (
            <div className="flex flex-col gap-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex gap-3">
                  <SkeletonBlock h="28px" w="28px" className="rounded-full flex-shrink-0" />
                  <div className="flex-1">
                    <SkeletonBlock h="13px" w="80%" className="mb-2" />
                    <SkeletonBlock h="11px" w="40%" />
                  </div>
                </div>
              ))}
            </div>
          ) : activityError ? (
            <p className="text-sm text-center py-6" style={{ color: '#ef4444' }}>{activityError}</p>
          ) : activity && activity.length > 0 ? (
            <ul className="flex flex-col gap-3">
              {activity.map((item) => (
                <li
                  key={item.id}
                  className="flex items-start gap-3 pb-3"
                  style={{ borderBottom: '1px solid var(--color-border)' }}
                >
                  <div
                    className="w-7 h-7 rounded-full flex-shrink-0 flex items-center justify-center mt-0.5"
                    style={{ background: 'var(--color-primary-light)' }}
                  >
                    <FiActivity size={12} style={{ color: 'var(--color-primary)' }} />
                  </div>
                  <div>
                    <p className="text-sm" style={{ color: 'var(--color-text)' }}>
                      {item.text}
                    </p>
                    <p className="text-xs mt-0.5" style={{ color: 'var(--color-text-subtle)' }}>
                      {item.time}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-center py-6" style={{ color: 'var(--color-text-muted)' }}>
              No recent activity yet.
            </p>
          )}
        </Card>

        {/* Quick Actions */}
        <Card>
          <h2 className="font-semibold text-sm mb-4" style={{ color: 'var(--color-text)' }}>
            Quick Actions
          </h2>
          <div className="flex flex-col gap-2">
            {[
              { label: 'View Projects',  icon: FiFolder,        path: '/projects'  },
              { label: 'Pay Invoice',    icon: FiFileText,      path: '/invoices'  },
              { label: 'Send Message',   icon: FiMessageSquare, path: '/messages'  },
              { label: 'Open a Ticket',  icon: FiLifeBuoy,      path: '/support'   },
            ].map(({ label, icon: Icon, path }) => (
              <button
                key={label}
                className="nav-item flex items-center gap-3 px-3 py-2.5 text-sm w-full text-left"
                onClick={() => navigate(path)}
              >
                <Icon size={15} style={{ color: 'var(--color-primary)' }} />
                <span style={{ color: 'var(--color-text)' }}>{label}</span>
              </button>
            ))}
          </div>
        </Card>

      </div>
    </div>
  );
};

export default Dashboard;
