import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiLifeBuoy, FiPlus, FiClock, FiX, FiChevronRight } from 'react-icons/fi';
import Card from '../components/Card';
import Button from '../components/Button';
import Input from '../components/Input';
import Spinner from '../components/Spinner';
import EmptyState from '../components/EmptyState';
import { useAuth } from '../context/AuthContext';

// ─── Status + priority style maps ─────────────────────────────────────────────
const statusStyles = {
  open:      { bg: 'rgba(239,68,68,0.12)',   color: '#ef4444', label: 'Open'      },
  in_review: { bg: 'rgba(245,158,11,0.12)',  color: '#f59e0b', label: 'In Review' },
  resolved:  { bg: 'rgba(16,185,129,0.12)',  color: '#10b981', label: 'Resolved'  },
  closed:    { bg: 'rgba(107,114,128,0.12)', color: '#6b7280', label: 'Closed'    },
};

const priorityStyles = {
  high:   { color: '#ef4444', label: 'High'   },
  medium: { color: '#f59e0b', label: 'Medium' },
  low:    { color: '#10b981', label: 'Low'    },
};

// ─── New Ticket Modal ─────────────────────────────────────────────────────────
const NewTicketModal = ({ onClose, onCreated }) => {
  const { api } = useAuth();
  const [title, setTitle]           = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority]     = useState('medium');
  const [loading, setLoading]       = useState(false);
  const [error, setError]           = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    // Client-side validation
    if (!title.trim()) { setError('Title is required.'); return; }
    if (title.trim().length < 3) { setError('Title must be at least 3 characters.'); return; }
    if (title.trim().length > 200) { setError('Title must be ≤ 200 characters.'); return; }
    if (description.length > 2000) { setError('Description must be ≤ 2000 characters.'); return; }

    setLoading(true);
    setError('');
    try {
      const res = await api.post('/tickets', { title: title.trim(), description: description.trim(), priority });
      onCreated(res.data.ticket);
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create ticket.');
    } finally {
      setLoading(false);
    }
  };


  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }}
      onClick={onClose}
    >
      <div
        className="rounded-2xl p-6 w-full max-w-lg"
        style={{ background: 'var(--color-surface)', boxShadow: 'var(--shadow-lg)' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-bold" style={{ color: 'var(--color-text)' }}>New Support Ticket</h2>
          <button onClick={onClose} style={{ color: 'var(--color-text-subtle)' }}><FiX size={18} /></button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--color-text-subtle)' }}>Title *</label>
            <Input
              placeholder="Brief description of the issue"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--color-text-subtle)' }}>Description</label>
            <textarea
              rows={4}
              placeholder="Provide as much detail as possible…"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full rounded-lg px-3 py-2 text-sm resize-none outline-none transition-all"
              style={{
                background: 'var(--color-surface-2)',
                border: '1px solid var(--color-border)',
                color: 'var(--color-text)',
              }}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--color-text-subtle)' }}>Priority</label>
            <div className="flex gap-2">
              {['low', 'medium', 'high'].map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setPriority(p)}
                  className="flex-1 py-1.5 rounded-lg text-xs font-semibold capitalize transition-all"
                  style={{
                    background: priority === p ? priorityStyles[p].color : 'var(--color-surface-2)',
                    color: priority === p ? '#fff' : priorityStyles[p].color,
                    border: `1px solid ${priorityStyles[p].color}`,
                  }}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>

          {error && <p className="text-sm" style={{ color: '#ef4444' }}>{error}</p>}

          <div className="flex gap-3 mt-1">
            <Button type="button" variant="ghost" className="flex-1" onClick={onClose}>Cancel</Button>
            <Button type="submit" className="flex-1" disabled={loading}>
              {loading ? 'Submitting…' : 'Submit Ticket'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ─── Support Page ─────────────────────────────────────────────────────────────
const Support = () => {
  const { api } = useAuth();
  const navigate = useNavigate();

  const [tickets, setTickets]     = useState([]);
  const [loading, setLoading]     = useState(true);
  const [error,   setError_list]  = useState('');
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    api
      .get('/tickets')
      .then((res) => setTickets(res.data.tickets ?? []))
      .catch(() => setError_list('Could not load tickets. Please try again.'))
      .finally(() => setLoading(false));
  }, [api]);

  const handleCreated = (ticket) => {
    setTickets((prev) => [ticket, ...prev]);
  };

  const formatDate = (iso) =>
    new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

  return (
    <div>
      {showModal && (
        <NewTicketModal onClose={() => setShowModal(false)} onCreated={handleCreated} />
      )}

      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold mb-1" style={{ color: 'var(--color-text)' }}>Support</h1>
          <p style={{ color: 'var(--color-text-muted)', fontSize: '14px' }}>Manage your support tickets.</p>
        </div>
        <Button icon={<FiPlus size={14} />} onClick={() => setShowModal(true)}>New Ticket</Button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-48"><Spinner /></div>
      ) : error ? (
        <div
          className="text-sm text-center rounded-xl px-4 py-10"
          style={{ color: '#ef4444', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)' }}
        >
          {error}
        </div>
      ) : tickets.length === 0 ? (
        <Card>
          <EmptyState
            icon={FiLifeBuoy}
            title="No support tickets yet"
            description="Have an issue? Open a ticket and our team will get back to you."
            action={<Button size="sm" icon={<FiPlus size={13} />} onClick={() => setShowModal(true)}>Open a Ticket</Button>}
          />
        </Card>
      ) : (
        <div className="flex flex-col gap-3">
          {tickets.map((t) => {
            const st = statusStyles[t.status] ?? statusStyles.open;
            const pt = priorityStyles[t.priority] ?? priorityStyles.medium;
            return (
              <Card
                key={t.id}
                hover
                className="flex items-center justify-between gap-4 cursor-pointer"
                onClick={() => navigate(`/support/${t.id}`)}
              >
                <div className="flex items-center gap-3">
                  <div
                    className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
                    style={{ background: 'var(--color-primary-light)' }}
                  >
                    <FiLifeBuoy size={16} style={{ color: 'var(--color-primary)' }} />
                  </div>
                  <div>
                    <p className="font-semibold text-sm" style={{ color: 'var(--color-text)' }}>{t.title}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-xs font-mono" style={{ color: 'var(--color-text-subtle)' }}>#{t.id}</span>
                      <span className="text-[10px]" style={{ color: 'var(--color-text-subtle)' }}>•</span>
                      <FiClock size={10} style={{ color: 'var(--color-text-subtle)' }} />
                      <span className="text-xs" style={{ color: 'var(--color-text-subtle)' }}>{formatDate(t.created_at)}</span>
                      {t.reply_count > 0 && (
                        <span className="text-xs" style={{ color: 'var(--color-text-subtle)' }}>
                          • {t.reply_count} {t.reply_count === 1 ? 'reply' : 'replies'}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 flex-shrink-0">
                  <span className="text-xs font-semibold hidden sm:block" style={{ color: pt.color }}>
                    {pt.label}
                  </span>
                  <span
                    className="text-[11px] font-semibold px-2.5 py-1 rounded-full"
                    style={{ background: st.bg, color: st.color }}
                  >
                    {st.label}
                  </span>
                  <FiChevronRight size={14} style={{ color: 'var(--color-text-subtle)' }} />
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Support;

