import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FiArrowLeft, FiLifeBuoy, FiSend, FiClock, FiUser } from 'react-icons/fi';
import Card from '../components/Card';
import Button from '../components/Button';
import Spinner from '../components/Spinner';
import { useAuth } from '../context/AuthContext';

// ─── Style maps ───────────────────────────────────────────────────────────────
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

function timeLabel(isoString) {
  return new Date(isoString).toLocaleString('en-US', {
    month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
  });
}

function initials(name = '') {
  return name.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase();
}

const TicketDetail = () => {
  const { id }   = useParams();
  const navigate = useNavigate();
  const { api, user } = useAuth();

  const [ticket, setTicket]   = useState(null);
  const [loading, setLoading] = useState(true);
  const [replyBody, setReplyBody] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError]     = useState('');

  const repliesEndRef = useRef(null);

  // ── Fetch ticket + replies ──────────────────────────────────────────────────
  useEffect(() => {
    api
      .get(`/tickets/${id}`)
      .then((res) => setTicket(res.data.ticket))
      .catch((err) => {
        console.error('Failed to load ticket:', err);
        navigate('/support');
      })
      .finally(() => setLoading(false));
  }, [id, api, navigate]);

  // ── Auto-scroll to latest reply ─────────────────────────────────────────────
  useEffect(() => {
    repliesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [ticket?.replies]);

  // ── Submit reply ─────────────────────────────────────────────────────────────
  const handleReply = async (e) => {
    e.preventDefault();
    if (!replyBody.trim()) return;

    setSending(true);
    setError('');
    try {
      const res = await api.post(`/tickets/${id}/replies`, { body: replyBody.trim() });
      setTicket((prev) => ({
        ...prev,
        replies: [...(prev.replies ?? []), res.data.reply],
      }));
      setReplyBody('');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to send reply.');
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Spinner />
      </div>
    );
  }

  if (!ticket) return null;

  const st = statusStyles[ticket.status] ?? statusStyles.open;
  const pt = priorityStyles[ticket.priority] ?? priorityStyles.medium;
  const isResolved = ticket.status === 'resolved' || ticket.status === 'closed';

  return (
    <div>
      {/* ── Back + Header ──────────────────────────────────────────────────── */}
      <button
        onClick={() => navigate('/support')}
        className="flex items-center gap-2 mb-5 text-sm transition-opacity hover:opacity-70"
        style={{ color: 'var(--color-text-muted)' }}
      >
        <FiArrowLeft size={14} />
        Back to Support
      </button>

      <div className="flex items-start justify-between mb-6 gap-4">
        <div className="flex items-center gap-3 min-w-0">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background: 'var(--color-primary-light)' }}
          >
            <FiLifeBuoy size={18} style={{ color: 'var(--color-primary)' }} />
          </div>
          <div className="min-w-0">
            <h1 className="text-xl font-bold truncate" style={{ color: 'var(--color-text)' }}>{ticket.title}</h1>
            <div className="flex items-center gap-2 mt-0.5 flex-wrap">
              <span className="text-xs font-mono" style={{ color: 'var(--color-text-subtle)' }}>Ticket #{ticket.id}</span>
              <span className="text-[10px]" style={{ color: 'var(--color-text-subtle)' }}>•</span>
              <FiClock size={10} style={{ color: 'var(--color-text-subtle)' }} />
              <span className="text-xs" style={{ color: 'var(--color-text-subtle)' }}>{timeLabel(ticket.created_at)}</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <span className="text-xs font-semibold hidden sm:block" style={{ color: pt.color }}>{pt.label}</span>
          <span
            className="text-[11px] font-semibold px-2.5 py-1 rounded-full"
            style={{ background: st.bg, color: st.color }}
          >
            {st.label}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* ── Main: description + replies ─────────────────────────────────── */}
        <div className="lg:col-span-2 flex flex-col gap-4">

          {/* Description card */}
          {ticket.description && (
            <Card>
              <p className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: 'var(--color-text-subtle)' }}>
                Description
              </p>
              <p className="text-sm leading-relaxed" style={{ color: 'var(--color-text)' }}>
                {ticket.description}
              </p>
            </Card>
          )}

          {/* Replies thread */}
          <Card className="flex flex-col gap-4">
            <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: 'var(--color-text-subtle)' }}>
              Conversation ({ticket.replies?.length ?? 0})
            </p>

            {ticket.replies?.length === 0 ? (
              <p className="text-sm text-center py-4" style={{ color: 'var(--color-text-muted)' }}>
                No replies yet. Our team will respond shortly.
              </p>
            ) : (
              <div className="flex flex-col gap-4">
                {ticket.replies.map((r) => {
                  const isMe = r.author_id === user.id;
                  const isAdmin = r.author_role === 'admin' || r.author_role === 'employee';
                  return (
                    <div key={r.id} className={`flex gap-3 ${isMe ? 'flex-row-reverse' : ''}`}>
                      <div
                        className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                        style={{ background: isAdmin ? 'var(--color-primary)' : 'var(--color-accent-green)' }}
                      >
                        {initials(r.author_name)}
                      </div>
                      <div className={`flex-1 max-w-md ${isMe ? 'items-end' : 'items-start'} flex flex-col`}>
                        <div className="flex items-baseline gap-2 mb-1">
                          <span className="text-xs font-semibold" style={{ color: 'var(--color-text)' }}>{r.author_name}</span>
                          {isAdmin && (
                            <span
                              className="text-[9px] font-bold px-1.5 py-0.5 rounded-full"
                              style={{ background: 'var(--color-primary-light)', color: 'var(--color-primary)' }}
                            >
                              TEAM
                            </span>
                          )}
                          <span className="text-[10px]" style={{ color: 'var(--color-text-subtle)' }}>{timeLabel(r.created_at)}</span>
                        </div>
                        <div
                          className="rounded-xl px-4 py-3 text-sm"
                          style={{
                            background: isAdmin ? 'var(--color-primary-light)' : 'var(--color-surface-2)',
                            color: 'var(--color-text)',
                            borderRadius: isMe ? '12px 12px 4px 12px' : '12px 12px 12px 4px',
                          }}
                        >
                          {r.body}
                        </div>
                      </div>
                    </div>
                  );
                })}
                <div ref={repliesEndRef} />
              </div>
            )}

            {/* Reply form — hidden if ticket is closed/resolved */}
            {!isResolved && (
              <form onSubmit={handleReply} className="border-t pt-4 flex gap-3" style={{ borderColor: 'var(--color-border)' }}>
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                  style={{ background: 'var(--color-accent-green)' }}
                >
                  {initials(user.name)}
                </div>
                <div className="flex-1">
                  <textarea
                    rows={3}
                    placeholder="Write a reply…"
                    value={replyBody}
                    onChange={(e) => setReplyBody(e.target.value)}
                    className="w-full rounded-lg px-3 py-2 text-sm resize-none outline-none transition-all mb-2"
                    style={{
                      background: 'var(--color-surface-2)',
                      border: '1px solid var(--color-border)',
                      color: 'var(--color-text)',
                    }}
                  />
                  {error && <p className="text-xs mb-2" style={{ color: '#ef4444' }}>{error}</p>}
                  <Button type="submit" size="sm" icon={<FiSend size={12} />} disabled={sending || !replyBody.trim()}>
                    {sending ? 'Sending…' : 'Send Reply'}
                  </Button>
                </div>
              </form>
            )}

            {isResolved && (
              <div
                className="border-t pt-4 text-sm text-center"
                style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-muted)' }}
              >
                This ticket is {st.label.toLowerCase()}. No further replies are accepted.
              </div>
            )}
          </Card>
        </div>

        {/* ── Sidebar: ticket info ─────────────────────────────────────────── */}
        <div className="flex flex-col gap-4">
          <Card>
            <p className="text-xs font-semibold uppercase tracking-widest mb-4" style={{ color: 'var(--color-text-subtle)' }}>
              Ticket Info
            </p>
            <dl className="flex flex-col gap-3">
              {[
                { label: 'Status',   value: <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full" style={{ background: st.bg, color: st.color }}>{st.label}</span> },
                { label: 'Priority', value: <span className="text-sm font-semibold capitalize" style={{ color: pt.color }}>{pt.label}</span> },
                { label: 'Opened',   value: timeLabel(ticket.created_at) },
                { label: 'Updated',  value: timeLabel(ticket.updated_at) },
                { label: 'Replies',  value: `${ticket.replies?.length ?? 0}` },
              ].map(({ label, value }) => (
                <div key={label}>
                  <dt className="text-[11px] uppercase tracking-wider mb-0.5" style={{ color: 'var(--color-text-subtle)' }}>{label}</dt>
                  <dd className="text-sm" style={{ color: 'var(--color-text)' }}>{value}</dd>
                </div>
              ))}
            </dl>
          </Card>

          <Card>
            <p className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: 'var(--color-text-subtle)' }}>
              Submitted By
            </p>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-[var(--color-primary)] flex items-center justify-center text-white text-xs font-bold">
                {initials(ticket.client_name)}
              </div>
              <div>
                <p className="text-sm font-semibold" style={{ color: 'var(--color-text)' }}>{ticket.client_name}</p>
                <p className="text-xs" style={{ color: 'var(--color-text-subtle)' }}>Client</p>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default TicketDetail;
