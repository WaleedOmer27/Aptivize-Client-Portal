import { useEffect, useState } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';
import {
  FiDollarSign,
  FiFolder,
  FiAlertCircle,
  FiUsers,
  FiRefreshCw,
} from 'react-icons/fi';
import Card from '../../components/Card';
import Spinner from '../../components/Spinner';
import { adminGetAnalytics } from '../../services/api';

// ─── Helpers ───────────────────────────────────────────────────────────────────
const fmtDollars = (cents) =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format((cents ?? 0) / 100);

const fmtK = (cents) => {
  const val = cents / 100;
  return val >= 1000 ? `$${(val / 1000).toFixed(1)}k` : `$${val.toFixed(0)}`;
};

// ─── Chart tooltip ─────────────────────────────────────────────────────────────
const CustomTooltip = ({ active, payload, label, isCents = true }) => {
  if (!active || !payload?.length) return null;
  return (
    <div
      className="text-xs px-3 py-2 rounded-xl"
      style={{
        background: 'var(--color-surface)',
        border: '1px solid var(--color-border)',
        boxShadow: 'var(--shadow-md)',
        color: 'var(--color-text)',
      }}
    >
      <p className="font-semibold mb-1">{label}</p>
      {payload.map((p) => (
        <p key={p.name} style={{ color: p.color }}>
          {p.name}: {isCents ? fmtDollars(p.value) : p.value}
        </p>
      ))}
    </div>
  );
};

// ─── KPI Card ─────────────────────────────────────────────────────────────────
const KpiCard = ({ icon: Icon, label, value, color }) => (
  <Card>
    <div className="flex items-center gap-3 mb-2">
      <div
        className="w-9 h-9 rounded-xl flex items-center justify-center"
        style={{ background: `${color}1a` }}
      >
        <Icon size={16} style={{ color }} />
      </div>
      <span className="text-xs font-medium" style={{ color: 'var(--color-text-muted)' }}>{label}</span>
    </div>
    <p className="text-xl font-bold" style={{ color: 'var(--color-text)' }}>{value}</p>
  </Card>
);

// ─── Pie colours ──────────────────────────────────────────────────────────────
const PIE_COLORS = ['#6366f1', '#22c55e', '#f59e0b', '#ef4444', '#3b82f6', '#a855f7'];

// ─────────────────────────────────────────────────────────────────────────────

const AdminAnalytics = () => {
  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState('');

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const d = await adminGetAnalytics();
      setData(d);
    } catch {
      setError('Failed to load analytics data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  if (loading) return <Spinner />;

  const r = data?.revenue  ?? {};
  const p = data?.projects ?? {};
  const t = data?.tickets  ?? {};
  const u = data?.users    ?? {};

  // ── Chart datasets ────────────────────────────────────────────────────────

  // Revenue bar chart (monthly)
  const revenueBarData = (r.monthly ?? []).map((m) => ({
    month:       m.month,
    'Paid':      parseInt(m.paid_cents  ?? 0),
    'Total':     parseInt(m.total_cents ?? 0),
  }));

  // Project donut
  const projectPieData = Object.entries(p.by_status ?? {}).map(([name, value]) => ({ name, value }));

  // Ticket donut
  const ticketPieData = Object.entries(t.by_status ?? {}).map(([name, value]) => ({
    name: name.charAt(0).toUpperCase() + name.slice(1),
    value,
  }));

  // User role donut
  const userPieData = Object.entries(u.by_role ?? {}).map(([name, value]) => ({
    name: name.charAt(0).toUpperCase() + name.slice(1),
    value,
  }));

  const avgInvoice = r.total_cents && u.by_role?.client
    ? Math.round(r.total_cents / u.by_role.client)
    : 0;

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold mb-1" style={{ color: 'var(--color-text)' }}>Analytics</h1>
          <p style={{ color: 'var(--color-text-muted)', fontSize: '14px' }}>
            Platform revenue, project, and ticket insights.
          </p>
        </div>
        <button
          onClick={load}
          className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium"
          style={{
            background: 'var(--color-surface)',
            border: '1px solid var(--color-border)',
            color: 'var(--color-text-muted)',
          }}
        >
          <FiRefreshCw size={14} /> Refresh
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

      {/* KPI Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <KpiCard icon={FiDollarSign} label="Total Revenue"    value={fmtDollars(r.total_cents)}   color="#22c55e" />
        <KpiCard icon={FiDollarSign} label="Paid Revenue"     value={fmtDollars(r.paid_cents)}    color="#6366f1" />
        <KpiCard icon={FiDollarSign} label="Pending Revenue"  value={fmtDollars(r.pending_cents)} color="#f59e0b" />
        <KpiCard icon={FiUsers}      label="Avg Revenue / Client" value={fmtDollars(avgInvoice)}  color="#3b82f6" />
      </div>

      {/* Revenue Bar Chart */}
      <Card className="mb-4">
        <h3 className="font-semibold text-sm mb-5" style={{ color: 'var(--color-text)' }}>
          Monthly Revenue (Last 6 Months)
        </h3>
        {revenueBarData.length === 0 ? (
          <p className="text-xs py-8 text-center" style={{ color: 'var(--color-text-muted)' }}>
            No revenue data for the last 6 months.
          </p>
        ) : (
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={revenueBarData} barCategoryGap="30%">
              <XAxis
                dataKey="month"
                tick={{ fontSize: 11, fill: 'var(--color-text-muted)' }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tickFormatter={fmtK}
                tick={{ fontSize: 11, fill: 'var(--color-text-muted)' }}
                axisLine={false}
                tickLine={false}
                width={55}
              />
              <Tooltip content={<CustomTooltip isCents />} />
              <Bar dataKey="Total"  fill="rgba(99,102,241,0.25)" radius={[4, 4, 0, 0]} />
              <Bar dataKey="Paid"   fill="#6366f1"               radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </Card>

      {/* Donut Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Projects */}
        <Card>
          <h3 className="font-semibold text-sm mb-4" style={{ color: 'var(--color-text)' }}>
            Projects by Status
          </h3>
          {projectPieData.length === 0 ? (
            <p className="text-xs py-8 text-center" style={{ color: 'var(--color-text-muted)' }}>No projects.</p>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie
                  data={projectPieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={85}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {projectPieData.map((_, i) => (
                    <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip isCents={false} />} />
                <Legend
                  iconSize={8}
                  iconType="circle"
                  wrapperStyle={{ fontSize: '11px', color: 'var(--color-text-muted)' }}
                />
              </PieChart>
            </ResponsiveContainer>
          )}
        </Card>

        {/* Tickets */}
        <Card>
          <h3 className="font-semibold text-sm mb-4" style={{ color: 'var(--color-text)' }}>
            Tickets by Status
          </h3>
          {ticketPieData.length === 0 ? (
            <p className="text-xs py-8 text-center" style={{ color: 'var(--color-text-muted)' }}>No tickets.</p>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie
                  data={ticketPieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={85}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {ticketPieData.map((_, i) => (
                    <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip isCents={false} />} />
                <Legend
                  iconSize={8}
                  iconType="circle"
                  wrapperStyle={{ fontSize: '11px', color: 'var(--color-text-muted)' }}
                />
              </PieChart>
            </ResponsiveContainer>
          )}
        </Card>

        {/* Users by Role */}
        <Card>
          <h3 className="font-semibold text-sm mb-4" style={{ color: 'var(--color-text)' }}>
            Active Users by Role
          </h3>
          {userPieData.length === 0 ? (
            <p className="text-xs py-8 text-center" style={{ color: 'var(--color-text-muted)' }}>No users.</p>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie
                  data={userPieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={85}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {userPieData.map((_, i) => (
                    <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip isCents={false} />} />
                <Legend
                  iconSize={8}
                  iconType="circle"
                  wrapperStyle={{ fontSize: '11px', color: 'var(--color-text-muted)' }}
                />
              </PieChart>
            </ResponsiveContainer>
          )}
        </Card>
      </div>
    </div>
  );
};

export default AdminAnalytics;
