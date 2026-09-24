import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  FiFolder,
  FiClock,
  FiArrowLeft,
  FiCheckCircle,
  FiCircle,
  FiCalendar,
  FiUser,
} from 'react-icons/fi';
import Card from '../components/Card';
import { useAuth } from '../context/AuthContext';

// ─── Style maps ───────────────────────────────────────────────────────────────
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

function formatDate(dateStr) {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'long',
    day:   'numeric',
    year:  'numeric',
  });
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────
const SkeletonBlock = ({ h = '16px', w = '100%', className = '' }) => (
  <div
    className={`rounded animate-pulse ${className}`}
    style={{ height: h, width: w, background: 'var(--color-surface-2)' }}
  />
);

// ─────────────────────────────────────────────────────────────────────────────

const ProjectDetail = () => {
  const { id }    = useParams();
  const navigate  = useNavigate();
  const { api }   = useAuth();

  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState('');

  useEffect(() => {
    api
      .get(`/projects/${id}`)
      .then((res) => setProject(res.data.project))
      .catch((err) => {
        const msg = err.response?.data?.message || 'Failed to load project.';
        setError(msg);
      })
      .finally(() => setLoading(false));
  }, [api, id]);

  // ── Loading skeleton ────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div>
        <button
          className="flex items-center gap-2 text-sm mb-6 hover:underline"
          style={{ color: 'var(--color-text-muted)' }}
          onClick={() => navigate('/projects')}
        >
          <FiArrowLeft size={14} /> Back to Projects
        </button>
        <Card className="mb-4">
          <SkeletonBlock h="28px" w="50%" className="mb-3" />
          <SkeletonBlock h="14px" w="80%" className="mb-6" />
          <SkeletonBlock h="10px" w="100%" className="mb-2" />
          <SkeletonBlock h="6px"  w="100%" className="rounded-full" />
        </Card>
        <Card>
          <SkeletonBlock h="18px" w="30%" className="mb-4" />
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="flex gap-3 mb-4">
              <SkeletonBlock h="20px" w="20px" className="rounded-full flex-shrink-0" />
              <SkeletonBlock h="16px" w="60%" />
            </div>
          ))}
        </Card>
      </div>
    );
  }

  // ── Error state ─────────────────────────────────────────────────────────────
  if (error) {
    return (
      <div>
        <button
          className="flex items-center gap-2 text-sm mb-6 hover:underline"
          style={{ color: 'var(--color-text-muted)' }}
          onClick={() => navigate('/projects')}
        >
          <FiArrowLeft size={14} /> Back to Projects
        </button>
        <div
          className="text-sm text-center rounded-xl px-4 py-10"
          style={{ color: 'var(--color-danger)', background: 'rgba(239,68,68,0.08)' }}
        >
          {error}
        </div>
      </div>
    );
  }

  // ── Main render ─────────────────────────────────────────────────────────────
  const st  = statusStyles[project.status] ?? statusStyles['Planning'];
  const col = progressColors[project.color] ?? progressColors.purple;

  const milestonesTotal    = project.milestones?.length ?? 0;
  const milestonesComplete = project.milestones?.filter((m) => m.is_complete).length ?? 0;

  return (
    <div>
      {/* Back button */}
      <button
        className="flex items-center gap-2 text-sm mb-6 hover:underline"
        style={{ color: 'var(--color-text-muted)' }}
        onClick={() => navigate('/projects')}
      >
        <FiArrowLeft size={14} /> Back to Projects
      </button>

      {/* ── Project Overview Card ───────────────────────────────────────────── */}
      <Card className="mb-4">
        {/* Title row */}
        <div className="flex items-start justify-between gap-4 mb-4">
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: `var(--color-accent-${project.color}, var(--color-surface-2))` }}
            >
              <FiFolder size={18} style={{ color: col }} />
            </div>
            <div>
              <h1 className="text-xl font-bold" style={{ color: 'var(--color-text)' }}>
                {project.name}
              </h1>
              {project.client_name && (
                <p className="text-xs flex items-center gap-1 mt-0.5" style={{ color: 'var(--color-text-subtle)' }}>
                  <FiUser size={11} /> {project.client_name}
                </p>
              )}
            </div>
          </div>
          <span
            className="text-[11px] font-semibold px-2.5 py-1 rounded-full flex-shrink-0"
            style={{ background: st.bg, color: st.color }}
          >
            {project.status}
          </span>
        </div>

        {/* Description */}
        {project.description && (
          <p className="text-sm mb-5" style={{ color: 'var(--color-text-muted)' }}>
            {project.description}
          </p>
        )}

        {/* Meta row */}
        <div className="flex flex-wrap gap-4 mb-5 text-xs" style={{ color: 'var(--color-text-subtle)' }}>
          <span className="flex items-center gap-1.5">
            <FiCalendar size={12} />
            Due {formatDate(project.due_date)}
          </span>
          <span className="flex items-center gap-1.5">
            <FiCheckCircle size={12} />
            {milestonesComplete} / {milestonesTotal} milestones
          </span>
          <span className="flex items-center gap-1.5">
            <FiClock size={12} />
            Created {formatDate(project.created_at)}
          </span>
        </div>

        {/* Overall progress */}
        <div>
          <div
            className="flex justify-between text-xs mb-1.5"
            style={{ color: 'var(--color-text-muted)' }}
          >
            <span>Overall Progress</span>
            <span className="font-bold">{project.progress}%</span>
          </div>
          <div
            className="w-full h-2 rounded-full overflow-hidden"
            style={{ background: 'var(--color-surface-2)' }}
          >
            <div
              className="h-full rounded-full transition-all duration-700"
              style={{ width: `${project.progress}%`, background: col }}
            />
          </div>
        </div>
      </Card>

      {/* ── Milestones Card ─────────────────────────────────────────────────── */}
      {project.milestones && project.milestones.length > 0 && (
        <Card>
          <div className="flex items-center gap-2 mb-4">
            <FiCheckCircle size={15} style={{ color: 'var(--color-primary)' }} />
            <h2 className="font-semibold text-sm" style={{ color: 'var(--color-text)' }}>
              Milestones
            </h2>
            <span
              className="text-[10px] font-semibold px-2 py-0.5 rounded-full ml-auto"
              style={{ background: 'var(--color-surface-2)', color: 'var(--color-text-muted)' }}
            >
              {milestonesComplete} / {milestonesTotal}
            </span>
          </div>

          <ul className="flex flex-col gap-0">
            {project.milestones.map((m, index) => (
              <li
                key={m.id}
                className="flex items-center gap-3 py-3"
                style={{
                  borderBottom:
                    index < project.milestones.length - 1
                      ? '1px solid var(--color-border)'
                      : 'none',
                }}
              >
                {/* Complete/Pending icon */}
                {m.is_complete ? (
                  <FiCheckCircle
                    size={17}
                    className="flex-shrink-0"
                    style={{ color: '#10b981' }}
                  />
                ) : (
                  <FiCircle
                    size={17}
                    className="flex-shrink-0"
                    style={{ color: 'var(--color-text-subtle)' }}
                  />
                )}

                {/* Milestone info */}
                <div className="flex-1 min-w-0">
                  <p
                    className="text-sm"
                    style={{
                      color: m.is_complete
                        ? 'var(--color-text-muted)'
                        : 'var(--color-text)',
                      textDecoration: m.is_complete ? 'line-through' : 'none',
                    }}
                  >
                    {m.title}
                  </p>
                </div>

                {/* Due date */}
                {m.due_date && (
                  <span
                    className="text-xs flex-shrink-0"
                    style={{ color: 'var(--color-text-subtle)' }}
                  >
                    {new Date(m.due_date).toLocaleDateString('en-US', {
                      month: 'short',
                      day:   'numeric',
                    })}
                  </span>
                )}
              </li>
            ))}
          </ul>
        </Card>
      )}
    </div>
  );
};

export default ProjectDetail;
