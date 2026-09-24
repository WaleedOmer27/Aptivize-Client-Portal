/**
 * pages/admin/AdminCreateProject.jsx
 *
 * Admin-only form to create a new project and assign it to a client.
 * Calls:
 *   GET  /api/admin/users?role=client  → populate client dropdown
 *   POST /api/projects                 → create project
 */

import { useState, useEffect } from 'react';
import { useNavigate }         from 'react-router-dom';
import {
  FiFolder,
  FiUser,
  FiAlignLeft,
  FiCalendar,
  FiTrendingUp,
  FiCheckCircle,
  FiArrowLeft,
} from 'react-icons/fi';
import Card   from '../../components/Card';
import Input  from '../../components/Input';
import Button from '../../components/Button';
import { adminGetClients, adminCreateProject } from '../../services/api';
import { toast } from 'react-toastify';

// ─── Constants ────────────────────────────────────────────────────────────────
const STATUSES = ['Planning', 'In Progress', 'On Hold', 'Completed'];

const COLORS = [
  { value: 'purple', hex: '#7c3aed', label: 'Purple' },
  { value: 'blue',   hex: '#3b82f6', label: 'Blue'   },
  { value: 'green',  hex: '#10b981', label: 'Green'  },
  { value: 'amber',  hex: '#f59e0b', label: 'Amber'  },
  { value: 'cyan',   hex: '#06b6d4', label: 'Cyan'   },
  { value: 'red',    hex: '#ef4444', label: 'Red'    },
];

// ─── Inline field-level error ─────────────────────────────────────────────────
const FieldError = ({ message }) =>
  message ? (
    <p className="text-xs mt-1" style={{ color: '#ef4444' }}>{message}</p>
  ) : null;

// ─────────────────────────────────────────────────────────────────────────────

const AdminCreateProject = () => {
  const navigate = useNavigate();

  // ── Client list ──────────────────────────────────────────────────────────
  const [clients,        setClients]        = useState([]);
  const [clientsLoading, setClientsLoading] = useState(true);
  const [clientsError,   setClientsError]   = useState('');

  // ── Form state ───────────────────────────────────────────────────────────
  const [form, setForm] = useState({
    clientId:    '',
    name:        '',
    description: '',
    status:      'Planning',
    progress:    0,
    dueDate:     '',
    color:       'purple',
  });

  // ── Validation errors ────────────────────────────────────────────────────
  const [errors, setErrors]   = useState({});
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState('');

  // ── Fetch clients on mount ───────────────────────────────────────────────
  useEffect(() => {
    adminGetClients()
      .then(setClients)
      .catch(() => setClientsError('Could not load clients. Please refresh.'))
      .finally(() => setClientsLoading(false));
  }, []);

  // ── Handlers ─────────────────────────────────────────────────────────────
  const set = (field) => (e) => {
    setForm((f) => ({ ...f, [field]: e.target.value }));
    setErrors((prev) => ({ ...prev, [field]: '' }));
    setApiError('');
  };

  const validate = () => {
    const e = {};
    if (!form.clientId)      e.clientId = 'Please select a client.';
    if (!form.name.trim())   e.name     = 'Project name is required.';
    else if (form.name.trim().length > 200) e.name = 'Name must be ≤ 200 characters.';

    const p = Number(form.progress);
    if (isNaN(p) || p < 0 || p > 100) e.progress = 'Progress must be 0–100.';

    if (form.dueDate) {
      const d = new Date(form.dueDate);
      if (isNaN(d.getTime())) e.dueDate = 'Please enter a valid date.';
    }

    return e;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const fieldErrors = validate();
    if (Object.keys(fieldErrors).length > 0) {
      setErrors(fieldErrors);
      return;
    }

    setLoading(true);
    setApiError('');
    try {
      await adminCreateProject({
        clientId:    Number(form.clientId),
        name:        form.name.trim(),
        description: form.description.trim() || undefined,
        status:      form.status,
        progress:    Number(form.progress),
        dueDate:     form.dueDate || undefined,
        color:       form.color,
      });
      toast.success(`Project "${form.name.trim()}" created!`);
      navigate('/admin');
    } catch (err) {
      const msg = err?.response?.data?.message || 'Failed to create project. Please try again.';
      setApiError(msg);
    } finally {
      setLoading(false);
    }
  };

  // ─────────────────────────────────────────────────────────────────────────

  return (
    <div className="max-w-2xl mx-auto">
      {/* Back */}
      <button
        onClick={() => navigate('/admin')}
        className="flex items-center gap-2 text-sm mb-6 hover:underline"
        style={{ color: 'var(--color-text-muted)' }}
      >
        <FiArrowLeft size={14} /> Back to Dashboard
      </button>

      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-1" style={{ color: 'var(--color-text)' }}>
          Create Project
        </h1>
        <p style={{ color: 'var(--color-text-muted)', fontSize: '14px' }}>
          Assign a new project to a client account.
        </p>
      </div>

      <Card>
        {clientsError && (
          <div
            className="text-sm px-3 py-2 rounded-lg mb-5"
            style={{ background: 'rgba(239,68,68,0.1)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.3)' }}
          >
            {clientsError}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-5" noValidate>

          {/* ── Client dropdown ──────────────────────────────────────────── */}
          <div>
            <label
              className="block text-xs font-semibold mb-1.5"
              style={{ color: 'var(--color-text-muted)' }}
            >
              <span className="flex items-center gap-1.5">
                <FiUser size={12} /> Client *
              </span>
            </label>
            {clientsLoading ? (
              <div
                className="h-10 rounded-lg animate-pulse"
                style={{ background: 'var(--color-surface-2)' }}
              />
            ) : (
              <select
                value={form.clientId}
                onChange={set('clientId')}
                className="w-full px-3 py-2.5 rounded-lg text-sm outline-none transition-all"
                style={{
                  background:  'var(--color-bg)',
                  border:      `1px solid ${errors.clientId ? '#ef4444' : 'var(--color-border)'}`,
                  color:       form.clientId ? 'var(--color-text)' : 'var(--color-text-subtle)',
                }}
              >
                <option value="">Select a client…</option>
                {clients.map((c) => (
                  <option key={c.id} value={c.id}>{c.name} — {c.email}</option>
                ))}
              </select>
            )}
            <FieldError message={errors.clientId} />
            {!clientsLoading && clients.length === 0 && !clientsError && (
              <p className="text-xs mt-1" style={{ color: 'var(--color-text-subtle)' }}>
                No client accounts exist yet. Create a client user first.
              </p>
            )}
          </div>

          {/* ── Project Name ─────────────────────────────────────────────── */}
          <div>
            <Input
              label={<span className="flex items-center gap-1.5"><FiFolder size={12} /> Project Name *</span>}
              placeholder="e.g. Website Redesign Q4"
              value={form.name}
              onChange={set('name')}
              error={errors.name}
            />
            <FieldError message={errors.name} />
          </div>

          {/* ── Description ──────────────────────────────────────────────── */}
          <div>
            <label
              className="block text-xs font-semibold mb-1.5"
              style={{ color: 'var(--color-text-muted)' }}
            >
              <span className="flex items-center gap-1.5">
                <FiAlignLeft size={12} /> Description
              </span>
            </label>
            <textarea
              rows={3}
              placeholder="Brief description of the project scope…"
              value={form.description}
              onChange={set('description')}
              className="w-full rounded-lg px-3 py-2 text-sm resize-none outline-none transition-all"
              style={{
                background: 'var(--color-bg)',
                border:     '1px solid var(--color-border)',
                color:      'var(--color-text)',
              }}
            />
          </div>

          {/* ── Status + Progress ─────────────────────────────────────────── */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label
                className="block text-xs font-semibold mb-1.5"
                style={{ color: 'var(--color-text-muted)' }}
              >
                <span className="flex items-center gap-1.5">
                  <FiCheckCircle size={12} /> Status
                </span>
              </label>
              <select
                value={form.status}
                onChange={set('status')}
                className="w-full px-3 py-2.5 rounded-lg text-sm outline-none"
                style={{
                  background: 'var(--color-bg)',
                  border:     '1px solid var(--color-border)',
                  color:      'var(--color-text)',
                }}
              >
                {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>

            <div>
              <label
                className="block text-xs font-semibold mb-1.5"
                style={{ color: 'var(--color-text-muted)' }}
              >
                <span className="flex items-center gap-1.5">
                  <FiTrendingUp size={12} /> Progress (%)
                </span>
              </label>
              <input
                type="number"
                min="0"
                max="100"
                value={form.progress}
                onChange={set('progress')}
                className="w-full rounded-lg px-3 py-2.5 text-sm outline-none"
                style={{
                  background: 'var(--color-bg)',
                  border:     `1px solid ${errors.progress ? '#ef4444' : 'var(--color-border)'}`,
                  color:      'var(--color-text)',
                }}
              />
              <FieldError message={errors.progress} />
            </div>
          </div>

          {/* ── Due Date ─────────────────────────────────────────────────── */}
          <div>
            <label
              className="block text-xs font-semibold mb-1.5"
              style={{ color: 'var(--color-text-muted)' }}
            >
              <span className="flex items-center gap-1.5">
                <FiCalendar size={12} /> Due Date <span className="font-normal">(optional)</span>
              </span>
            </label>
            <input
              type="date"
              value={form.dueDate}
              onChange={set('dueDate')}
              className="w-full rounded-lg px-3 py-2.5 text-sm outline-none"
              style={{
                background: 'var(--color-bg)',
                border:     `1px solid ${errors.dueDate ? '#ef4444' : 'var(--color-border)'}`,
                color:      'var(--color-text)',
                colorScheme: 'dark',
              }}
            />
            <FieldError message={errors.dueDate} />
          </div>

          {/* ── Color ────────────────────────────────────────────────────── */}
          <div>
            <label
              className="block text-xs font-semibold mb-2"
              style={{ color: 'var(--color-text-muted)' }}
            >
              Project Colour
            </label>
            <div className="flex gap-2 flex-wrap">
              {COLORS.map(({ value, hex, label }) => (
                <button
                  key={value}
                  type="button"
                  title={label}
                  onClick={() => setForm((f) => ({ ...f, color: value }))}
                  className="w-8 h-8 rounded-full flex-shrink-0 transition-all"
                  style={{
                    background:  hex,
                    outline:     form.color === value ? `3px solid ${hex}` : '3px solid transparent',
                    outlineOffset: '2px',
                    transform:   form.color === value ? 'scale(1.15)' : 'scale(1)',
                  }}
                />
              ))}
            </div>
          </div>

          {/* ── API error ────────────────────────────────────────────────── */}
          {apiError && (
            <div
              className="text-sm px-3 py-2 rounded-lg"
              style={{ background: 'rgba(239,68,68,0.1)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.3)' }}
            >
              {apiError}
            </div>
          )}

          {/* ── Actions ──────────────────────────────────────────────────── */}
          <div className="flex gap-3 pt-1">
            <Button
              type="button"
              variant="ghost"
              onClick={() => navigate('/admin')}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading || clientsLoading}
              icon={<FiFolder size={14} />}
            >
              {loading ? 'Creating…' : 'Create Project'}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
};

export default AdminCreateProject;
