import { useEffect, useState } from 'react';
import {
  FiUsers,
  FiDollarSign,
  FiAlertCircle,
  FiFolder,
  FiTrendingUp,
  FiRefreshCw,
} from 'react-icons/fi';
import Card from '../../components/Card';
import Spinner from '../../components/Spinner';
import { adminGetAnalytics } from '../../services/api';

// ─── Stat Card ─────────────────────────────────────────────────────────────────
const StatCard = ({ icon: Icon, label, value, sub, color = 'var(--color-primary)', trend }) => (
  <Card>
    <div className="flex items-start justify-between mb-3">
      <div
        className="w-10 h-10 rounded-xl flex items-center justify-center"
        style={{ background: `${color}1a` }}
      >
        <Icon size={18} style={{ color }} />
      </div>
      {trend !== undefined && (
        <span
          className="text-xs font-semibold flex items-center gap-1"
          style={{ color: trend >= 0 ? '#22c55e' : '#ef4444' }}
        >
          <FiTrendingUp size={11} />
          {trend >= 0 ? '+' : ''}{trend}%
        </span>
      )}
    </div>
    <p className="text-2xl font-bold mb-0.5" style={{ color: 'var(--color-text)' }}>{value}</p>
    <p className="text-xs font-medium" style={{ color: 'var(--color-text-muted)' }}>{label}</p>
    {sub && <p className="text-xs mt-1" style={{ color: 'var(--color-text-subtle)' }}>{sub}</p>}
  </Card>
);

// ─── Helpers ───────────────────────────────────────────────────────────────────
const fmt = (cents) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(
    (cents ?? 0) / 100,
  );

// ─────────────────────────────────────────────────────────────────────────────

const AdminDashboard = () => {
  const [analytics, setAnalytics] = useState(null);
  const [loading,   setLoading]   = useState(true);
  const [error,     setError]     = useState('');

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await adminGetAnalytics();
      setAnalytics(data);
    } catch {
      setError('Failed to load analytics data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  if (loading) return <Spinner />;

  const r = analytics?.revenue  ?? {};
  const p = analytics?.projects ?? {};
  const t = analytics?.tickets  ?? {};
  const u = analytics?.users    ?? {};

  const openTickets = (t.by_status?.open ?? 0) + (t.by_status?.['in-progress'] ?? 0);
  const activeProjects = p.by_status?.Active ?? 0;

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold mb-1" style={{ color: 'var(--color-text)' }}>
            Admin Dashboard
          </h1>
          <p style={{ color: 'var(--color-text-muted)', fontSize: '14px' }}>
            Platform-wide overview and key metrics.
          </p>
        </div>
        <button
          onClick={load}
          className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors"
          style={{
            background: 'var(--color-surface)',
            border: '1px solid var(--color-border)',
            color: 'var(--color-text-muted)',
          }}
        >
          <FiRefreshCw size={14} />
          Refresh
        </button>
      </div>

      {error && (
        <div
          className="flex items-center gap-2 text-sm px-3 py-3 rounded-lg mb-6"
          style={{ background: 'rgba(239,68,68,0.1)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.3)' }}
        >
          <FiAlertCircle size={14} /> {error}
        </div>
      )}

      {/* KPI Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard
          icon={FiUsers}
          label="Total Active Users"
          value={u.total ?? 0}
          sub={`${u.by_role?.client ?? 0} clients · ${u.by_role?.employee ?? 0} employees`}
          color="#6366f1"
        />
        <StatCard
          icon={FiDollarSign}
          label="Total Revenue"
          value={fmt(r.total_cents)}
          sub={`${fmt(r.pending_cents)} pending`}
          color="#22c55e"
        />
        <StatCard
          icon={FiFolder}
          label="Active Projects"
          value={activeProjects}
          sub={`${p.total ?? 0} total projects`}
          color="#f59e0b"
        />
        <StatCard
          icon={FiAlertCircle}
          label="Open Tickets"
          value={openTickets}
          sub={`${t.total ?? 0} total tickets`}
          color="#ef4444"
        />
      </div>

      {/* Secondary stats row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Revenue breakdown */}
        <Card>
          <h3 className="font-semibold text-sm mb-4" style={{ color: 'var(--color-text)' }}>
            Revenue Breakdown
          </h3>
          <div className="space-y-3">
            {[
              { label: 'Paid',    value: r.paid_cents,    color: '#22c55e' },
              { label: 'Pending', value: r.pending_cents, color: '#f59e0b' },
            ].map(({ label, value, color }) => {
              const pct = r.total_cents ? Math.round((value / r.total_cents) * 100) : 0;
              return (
                <div key={label}>
                  <div className="flex justify-between text-xs mb-1" style={{ color: 'var(--color-text-muted)' }}>
                    <span>{label}</span>
                    <span className="font-semibold" style={{ color: 'var(--color-text)' }}>{fmt(value)} ({pct}%)</span>
                  </div>
                  <div className="h-2 rounded-full overflow-hidden" style={{ background: 'var(--color-border)' }}>
                    <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: color }} />
                  </div>
                </div>
              );
            })}
          </div>
        </Card>

        {/* Project status */}
        <Card>
          <h3 className="font-semibold text-sm mb-4" style={{ color: 'var(--color-text)' }}>Project Status</h3>
          <div className="space-y-2">
            {Object.entries(p.by_status ?? {}).map(([status, count]) => (
              <div key={status} className="flex items-center justify-between text-sm">
                <span style={{ color: 'var(--color-text-muted)' }}>{status}</span>
                <span className="font-semibold" style={{ color: 'var(--color-text)' }}>{count}</span>
              </div>
            ))}
            {Object.keys(p.by_status ?? {}).length === 0 && (
              <p className="text-xs" style={{ color: 'var(--color-text-subtle)' }}>No projects yet.</p>
            )}
          </div>
        </Card>

        {/* Ticket status */}
        <Card>
          <h3 className="font-semibold text-sm mb-4" style={{ color: 'var(--color-text)' }}>Ticket Status</h3>
          <div className="space-y-2">
            {Object.entries(t.by_status ?? {}).map(([status, count]) => (
              <div key={status} className="flex items-center justify-between text-sm">
                <span style={{ color: 'var(--color-text-muted)' }} className="capitalize">{status}</span>
                <span className="font-semibold" style={{ color: 'var(--color-text)' }}>{count}</span>
              </div>
            ))}
            {Object.keys(t.by_status ?? {}).length === 0 && (
              <p className="text-xs" style={{ color: 'var(--color-text-subtle)' }}>No tickets yet.</p>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
};

export default AdminDashboard;
