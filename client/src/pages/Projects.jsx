import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiFolder, FiClock, FiArrowRight, FiInbox } from 'react-icons/fi';
import Card from '../components/Card';
import { useAuth } from '../context/AuthContext';

// ─── Style maps (same as before — driven by the `color` field from DB) ────────
const statusStyles = {
  'In Progress': { bg: 'rgba(124,58,237,0.12)', color: 'var(--color-primary)' },
  'Completed':   { bg: 'rgba(16,185,129,0.12)',  color: '#10b981' },
  'On Hold':     { bg: 'rgba(245,158,11,0.12)',   color: '#f59e0b' },
  'Planning':    { bg: 'rgba(100,116,139,0.12)',  color: '#64748b' },
};

const progressColors = {
  purple: 'var(--color-primary)',
  blue:   '#3b82f6',
  green:  '#10b981',
  amber:  '#f59e0b',
  cyan:   '#06b6d4',
  red:    '#ef4444',
};

// ─── Skeleton card ────────────────────────────────────────────────────────────
const SkeletonCard = () => (
  <Card>
    <div className="flex items-start justify-between mb-4">
      <div
        className="w-9 h-9 rounded-lg animate-pulse"
        style={{ background: 'var(--color-surface-2)' }}
      />
      <div
        className="w-20 h-5 rounded-full animate-pulse"
        style={{ background: 'var(--color-surface-2)' }}
      />
    </div>
    <div
      className="h-4 rounded animate-pulse mb-4"
      style={{ background: 'var(--color-surface-2)', width: '70%' }}
    />
    <div
      className="h-2 rounded-full animate-pulse mb-4"
      style={{ background: 'var(--color-surface-2)' }}
    />
    <div
      className="h-3 rounded animate-pulse"
      style={{ background: 'var(--color-surface-2)', width: '45%' }}
    />
  </Card>
);

// ─── Format due date ──────────────────────────────────────────────────────────
function formatDate(dateStr) {
  if (!dateStr) return 'No due date';
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day:   'numeric',
    year:  'numeric',
  });
}

// ─────────────────────────────────────────────────────────────────────────────

const Projects = () => {
  const { api } = useAuth();
  const navigate = useNavigate();

  const [projects, setProjects] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState('');

  // ── Fetch projects from API ─────────────────────────────────────────────────
  useEffect(() => {
    api
      .get('/projects')
      .then((res) => setProjects(res.data.projects))
      .catch((err) => {
        console.error('Failed to load projects:', err);
        setError('Could not load projects. Please try again.');
      })
      .finally(() => setLoading(false));
  }, [api]);

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-1" style={{ color: 'var(--color-text)' }}>
          Projects
        </h1>
        <p style={{ color: 'var(--color-text-muted)', fontSize: '14px' }}>
          Track progress across all your active projects.
        </p>
      </div>

      {/* ── Loading skeletons ───────────────────────────────────────────────── */}
      {loading && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => <SkeletonCard key={i} />)}
        </div>
      )}

      {/* ── Error state ─────────────────────────────────────────────────────── */}
      {!loading && error && (
        <div
          className="text-sm text-center rounded-xl px-4 py-6"
          style={{ color: 'var(--color-danger)', background: 'rgba(239,68,68,0.08)' }}
        >
          {error}
        </div>
      )}

      {/* ── Empty state ─────────────────────────────────────────────────────── */}
      {!loading && !error && projects.length === 0 && (
        <Card className="flex flex-col items-center justify-center py-16 text-center">
          <FiInbox size={40} style={{ color: 'var(--color-text-subtle)' }} className="mb-3" />
          <p className="font-semibold mb-1" style={{ color: 'var(--color-text)' }}>
            No projects yet
          </p>
          <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
            Your projects will appear here once created by your account manager.
          </p>
        </Card>
      )}

      {/* ── Project Grid ────────────────────────────────────────────────────── */}
      {!loading && !error && projects.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {projects.map((p) => {
            const st  = statusStyles[p.status] ?? statusStyles['Planning'];
            const col = progressColors[p.color] ?? progressColors.purple;

            return (
              <Card
                key={p.id}
                hover
                style={{ cursor: 'pointer' }}
                onClick={() => navigate(`/projects/${p.id}`)}
              >
                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                  <div
                    className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
                    style={{ background: `var(--color-accent-${p.color}, var(--color-surface-2))` }}
                  >
                    <FiFolder size={16} style={{ color: col }} />
                  </div>
                  <span
                    className="text-[11px] font-semibold px-2.5 py-1 rounded-full"
                    style={{ background: st.bg, color: st.color }}
                  >
                    {p.status}
                  </span>
                </div>

                <h3 className="font-semibold text-sm mb-1" style={{ color: 'var(--color-text)' }}>
                  {p.name}
                </h3>
                {p.description && (
                  <p
                    className="text-xs mb-3 line-clamp-2"
                    style={{ color: 'var(--color-text-muted)' }}
                  >
                    {p.description}
                  </p>
                )}

                {/* Progress bar */}
                <div className="mb-3">
                  <div
                    className="flex justify-between text-xs mb-1.5"
                    style={{ color: 'var(--color-text-muted)' }}
                  >
                    <span>Progress</span>
                    <span className="font-semibold">{p.progress}%</span>
                  </div>
                  <div
                    className="w-full h-1.5 rounded-full overflow-hidden"
                    style={{ background: 'var(--color-surface-2)' }}
                  >
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{ width: `${p.progress}%`, background: col }}
                    />
                  </div>
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between">
                  <div
                    className="flex items-center gap-1.5 text-xs"
                    style={{ color: 'var(--color-text-subtle)' }}
                  >
                    <FiClock size={12} />
                    <span>Due {formatDate(p.due_date)}</span>
                  </div>
                  <span
                    className="text-xs flex items-center gap-1"
                    style={{ color: 'var(--color-primary)' }}
                  >
                    Details <FiArrowRight size={11} />
                  </span>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Projects;
