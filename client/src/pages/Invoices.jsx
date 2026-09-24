import { useState, useEffect } from 'react';
import { FiFileText, FiDownload, FiCreditCard, FiTrendingUp, FiClock, FiCheckCircle } from 'react-icons/fi';
import Card from '../components/Card';
import Button from '../components/Button';
import Spinner from '../components/Spinner';
import EmptyState from '../components/EmptyState';
import { useAuth } from '../context/AuthContext';

// ─── Status style map ─────────────────────────────────────────────────────────
const statusStyles = {
  paid:    { bg: 'rgba(16,185,129,0.12)',  color: '#10b981', label: 'Paid'    },
  pending: { bg: 'rgba(245,158,11,0.12)', color: '#f59e0b', label: 'Pending' },
  overdue: { bg: 'rgba(239,68,68,0.12)',  color: '#ef4444', label: 'Overdue' },
};

// ─── Pay Confirm Modal ────────────────────────────────────────────────────────
const ConfirmPayModal = ({ invoice, onClose, onPaid }) => {
  const { api } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');

  const handlePay = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.patch(`/invoices/${invoice.id}/pay`);
      onPaid(res.data.invoice);
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || 'Payment failed. Please try again.');
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
        className="rounded-2xl p-6 w-full max-w-md"
        style={{ background: 'var(--color-surface)', boxShadow: 'var(--shadow-lg)' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-center w-12 h-12 rounded-full mb-4 mx-auto" style={{ background: 'var(--color-primary-light)' }}>
          <FiCreditCard size={22} style={{ color: 'var(--color-primary)' }} />
        </div>
        <h2 className="text-lg font-bold text-center mb-1" style={{ color: 'var(--color-text)' }}>Confirm Payment</h2>
        <p className="text-sm text-center mb-5" style={{ color: 'var(--color-text-muted)' }}>
          Pay <strong>{invoice.invoice_no}</strong> for <strong>{invoice.amount}</strong>?
        </p>
        {error && <p className="text-sm text-center mb-3" style={{ color: '#ef4444' }}>{error}</p>}
        <div className="flex gap-3">
          <Button variant="ghost" className="flex-1" onClick={onClose}>Cancel</Button>
          <Button className="flex-1" onClick={handlePay} disabled={loading}>
            {loading ? 'Processing…' : `Pay ${invoice.amount}`}
          </Button>
        </div>
      </div>
    </div>
  );
};

// ─── Invoices Page ────────────────────────────────────────────────────────────
const Invoices = () => {
  const { api } = useAuth();

  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [error,   setError]     = useState('');
  const [payTarget, setPayTarget] = useState(null); // invoice to pay

  useEffect(() => {
    api
      .get('/invoices')
      .then((res) => setInvoices(res.data.invoices ?? []))
      .catch(() => setError('Could not load invoices. Please try again.'))
      .finally(() => setLoading(false));
  }, [api]);

  const handlePaid = (updatedInvoice) => {
    setInvoices((prev) =>
      prev.map((inv) => (inv.id === updatedInvoice.id ? { ...inv, ...updatedInvoice } : inv))
    );
  };

  const formatDate = (iso) => {
    if (!iso) return '—';
    return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  // ── Summary stats ─────────────────────────────────────────────────────────
  const totalPaid    = invoices.filter((i) => i.status === 'paid').reduce((s, i) => s + i.amount_cents, 0);
  const totalPending = invoices.filter((i) => i.status === 'pending').reduce((s, i) => s + i.amount_cents, 0);
  const pendingCount = invoices.filter((i) => i.status === 'pending').length;

  const formatCents = (cents) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(cents / 100);

  return (
    <div>
      {payTarget && (
        <ConfirmPayModal
          invoice={payTarget}
          onClose={() => setPayTarget(null)}
          onPaid={handlePaid}
        />
      )}

      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-1" style={{ color: 'var(--color-text)' }}>Invoices</h1>
        <p style={{ color: 'var(--color-text-muted)', fontSize: '14px' }}>Manage and pay your invoices.</p>
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
      ) : (
        <>
          {/* ── Summary bar ─────────────────────────────────────────────────── */}
          {invoices.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
              <Card className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(16,185,129,0.15)' }}>
                  <FiCheckCircle size={16} style={{ color: '#10b981' }} />
                </div>
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-widest" style={{ color: 'var(--color-text-subtle)' }}>Total Paid</p>
                  <p className="text-lg font-bold" style={{ color: '#10b981' }}>{formatCents(totalPaid)}</p>
                </div>
              </Card>
              <Card className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(245,158,11,0.15)' }}>
                  <FiClock size={16} style={{ color: '#f59e0b' }} />
                </div>
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-widest" style={{ color: 'var(--color-text-subtle)' }}>Pending</p>
                  <p className="text-lg font-bold" style={{ color: '#f59e0b' }}>{formatCents(totalPending)}</p>
                </div>
              </Card>
              <Card className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: 'var(--color-primary-light)' }}>
                  <FiTrendingUp size={16} style={{ color: 'var(--color-primary)' }} />
                </div>
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-widest" style={{ color: 'var(--color-text-subtle)' }}>Total Invoices</p>
                  <p className="text-lg font-bold" style={{ color: 'var(--color-text)' }}>{invoices.length}</p>
                </div>
              </Card>
            </div>
          )}

          {/* ── Invoice table ────────────────────────────────────────────────── */}
          <Card>
            {/* Table header */}
            <div
              className="grid gap-4 px-2 pb-3 mb-1 text-[11px] font-semibold uppercase tracking-widest"
              style={{
                gridTemplateColumns: '1fr 2fr 1fr 1fr auto',
                color: 'var(--color-text-subtle)',
                borderBottom: '1px solid var(--color-border)',
              }}
            >
              <span>Invoice</span>
              <span>Description</span>
              <span>Amount</span>
              <span>Status</span>
              <span></span>
            </div>

            {invoices.length === 0 ? (
              <EmptyState
                icon={FiFileText}
                title="No invoices yet"
                description="Your invoices will appear here once your account manager creates them."
                compact
              />
            ) : (
              invoices.map((inv) => {
                const st = statusStyles[inv.status] ?? statusStyles.pending;
                return (
                  <div
                    key={inv.id}
                    className="grid gap-4 px-2 py-3.5 items-center text-sm rounded-lg transition-colors hover:bg-[var(--color-surface-2)]"
                    style={{
                      gridTemplateColumns: '1fr 2fr 1fr 1fr auto',
                      borderBottom: '1px solid var(--color-border)',
                    }}
                  >
                    {/* Invoice number */}
                    <div className="flex items-center gap-2">
                      <FiFileText size={14} style={{ color: 'var(--color-primary)' }} />
                      <span className="font-medium" style={{ color: 'var(--color-text)' }}>{inv.invoice_no}</span>
                    </div>

                    {/* Description + project + date */}
                    <div className="min-w-0">
                      <p className="truncate" style={{ color: 'var(--color-text)' }}>
                        {inv.description ?? inv.project_name ?? '—'}
                      </p>
                      <p className="text-xs truncate" style={{ color: 'var(--color-text-subtle)' }}>
                        {inv.project_name && inv.description ? inv.project_name : ''}
                        {' '}Due {formatDate(inv.due_date)}
                      </p>
                    </div>

                    {/* Amount */}
                    <span className="font-semibold" style={{ color: 'var(--color-text)' }}>{inv.amount}</span>

                    {/* Status badge */}
                    <span
                      className="text-[11px] font-semibold px-2.5 py-1 rounded-full w-fit"
                      style={{ background: st.bg, color: st.color }}
                    >
                      {st.label}
                    </span>

                    {/* Action */}
                    <div>
                      {inv.status === 'pending' ? (
                        <Button size="sm" icon={<FiCreditCard size={12} />} onClick={() => setPayTarget(inv)}>
                          Pay
                        </Button>
                      ) : (
                        <Button size="sm" variant="ghost" icon={<FiDownload size={12} />}>PDF</Button>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </Card>
        </>
      )}
    </div>
  );
};

export default Invoices;

