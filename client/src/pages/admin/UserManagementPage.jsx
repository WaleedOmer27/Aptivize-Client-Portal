import { useEffect, useState, useCallback } from 'react';
import {
  FiPlus,
  FiEdit2,
  FiTrash2,
  FiSearch,
  FiX,
  FiCheck,
  FiAlertCircle,
  FiChevronLeft,
  FiChevronRight,
  FiUser,
  FiMail,
  FiLock,
  FiShield,
} from 'react-icons/fi';
import Card from '../../components/Card';
import Input from '../../components/Input';
import Button from '../../components/Button';
import Spinner from '../../components/Spinner';
import { adminGetUsers, adminCreateUser, adminEditUser, adminDeleteUser } from '../../services/api';

// ─── Inline Alert ──────────────────────────────────────────────────────────────
const Alert = ({ type, message }) => {
  if (!message) return null;
  const isErr = type === 'error';
  return (
    <div
      className="flex items-center gap-2 text-sm px-3 py-2 rounded-lg mb-4"
      style={{
        background: isErr ? 'rgba(239,68,68,0.1)'  : 'rgba(34,197,94,0.1)',
        color:      isErr ? '#ef4444'               : '#22c55e',
        border:     `1px solid ${isErr ? 'rgba(239,68,68,0.3)' : 'rgba(34,197,94,0.3)'}`,
      }}
    >
      {isErr ? <FiAlertCircle size={14} /> : <FiCheck size={14} />}
      <span>{message}</span>
    </div>
  );
};

// ─── Modal Shell ───────────────────────────────────────────────────────────────
const Modal = ({ title, onClose, children }) => (
  <div
    className="fixed inset-0 z-50 flex items-center justify-center p-4"
    style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}
    onClick={(e) => e.target === e.currentTarget && onClose()}
  >
    <div
      className="w-full max-w-md rounded-2xl p-6 relative"
      style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', boxShadow: 'var(--shadow-lg)' }}
    >
      <div className="flex items-center justify-between mb-5">
        <h2 className="font-bold text-base" style={{ color: 'var(--color-text)' }}>{title}</h2>
        <button
          onClick={onClose}
          className="w-7 h-7 rounded-full flex items-center justify-center transition-colors"
          style={{ background: 'var(--color-border)', color: 'var(--color-text-muted)' }}
        >
          <FiX size={14} />
        </button>
      </div>
      {children}
    </div>
  </div>
);

// ─── Role badge ────────────────────────────────────────────────────────────────
const RoleBadge = ({ role }) => {
  const cfg = {
    admin:    { bg: 'rgba(239,68,68,0.12)',   color: '#ef4444',  label: 'Admin'    },
    employee: { bg: 'rgba(59,130,246,0.12)',  color: '#3b82f6',  label: 'Employee' },
    client:   { bg: 'rgba(99,102,241,0.12)', color: '#6366f1',  label: 'Client'   },
  }[role] ?? { bg: 'var(--color-border)', color: 'var(--color-text-muted)', label: role };

  return (
    <span
      className="text-[11px] font-semibold px-2 py-0.5 rounded-full capitalize"
      style={{ background: cfg.bg, color: cfg.color }}
    >
      {cfg.label}
    </span>
  );
};

// ─── Status badge ──────────────────────────────────────────────────────────────
const StatusBadge = ({ active }) => (
  <span
    className="text-[11px] font-semibold px-2 py-0.5 rounded-full"
    style={{
      background: active ? 'rgba(34,197,94,0.12)' : 'rgba(239,68,68,0.12)',
      color:      active ? '#22c55e'               : '#ef4444',
    }}
  >
    {active ? 'Active' : 'Inactive'}
  </span>
);

// ─────────────────────────────────────────────────────────────────────────────

/**
 * UserManagementPage
 *
 * Reusable page used by both AdminClients and AdminEmployees.
 * @param {{ role: 'client'|'employee'|'admin', title: string, allowRoleSelect: boolean }} props
 */
const UserManagementPage = ({ role, title, allowRoleSelect = false }) => {
  // ── List state ────────────────────────────────────────────────────────────
  const [users,      setUsers]      = useState([]);
  const [total,      setTotal]      = useState(0);
  const [page,       setPage]       = useState(1);
  const [search,     setSearch]     = useState('');
  const [loading,    setLoading]    = useState(true);
  const [listError,  setListError]  = useState('');
  const LIMIT = 10;

  // ── Modal state ───────────────────────────────────────────────────────────
  const [createOpen, setCreateOpen] = useState(false);
  const [editTarget, setEditTarget] = useState(null);   // user object
  const [deleteTarget, setDeleteTarget] = useState(null); // user object

  // ── Form state ────────────────────────────────────────────────────────────
  const BLANK_CREATE = { name: '', email: '', password: '', role };
  const [createForm,  setCreateForm]  = useState(BLANK_CREATE);
  const [editForm,    setEditForm]    = useState({ name: '', email: '', role });
  const [formError,   setFormError]   = useState('');
  const [formSuccess, setFormSuccess] = useState('');
  const [formLoading, setFormLoading] = useState(false);

  // ── Fetch ─────────────────────────────────────────────────────────────────
  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setListError('');
    try {
      const data = await adminGetUsers({ page, limit: LIMIT, role });
      setUsers(data.users);
      setTotal(data.pagination.total);
    } catch {
      setListError('Failed to load users.');
    } finally {
      setLoading(false);
    }
  }, [page, role]);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  // ── Filtered list (client-side search on loaded page) ────────────────────
  const filtered = users.filter(
    (u) =>
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase()),
  );

  const totalPages = Math.ceil(total / LIMIT);

  // ── Validate ──────────────────────────────────────────────────────────────
  const validateUserForm = (f, requirePassword = false) => {
    const e = {};
    if (!f.name?.trim()) e.name = 'Name is required.';
    else if (f.name.trim().length < 2) e.name = 'Name must be at least 2 characters.';
    if (!f.email?.trim()) e.email = 'Email is required.';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(f.email.trim())) e.email = 'Please enter a valid email.';
    if (requirePassword) {
      if (!f.password) e.password = 'Password is required.';
      else if (f.password.length < 8) e.password = 'Password must be at least 8 characters.';
    }
    return e;
  };

  // ── Create ────────────────────────────────────────────────────────────────
  const handleCreate = async (e) => {
    e.preventDefault();
    setFormError('');
    setFormSuccess('');

    const fieldErrors = validateUserForm(createForm, true);
    if (Object.keys(fieldErrors).length > 0) {
      setFormError(Object.values(fieldErrors)[0]); // show first error
      return;
    }

    setFormLoading(true);
    try {
      await adminCreateUser(createForm);
      setFormSuccess('User created successfully.');
      setCreateForm(BLANK_CREATE);
      fetchUsers();
      setTimeout(() => { setCreateOpen(false); setFormSuccess(''); }, 1200);
    } catch (err) {
      setFormError(err?.response?.data?.message ?? 'Failed to create user.');
    } finally {
      setFormLoading(false);
    }
  };

  // ── Edit ──────────────────────────────────────────────────────────────────
  const openEdit = (user) => {
    setEditTarget(user);
    setEditForm({ name: user.name, email: user.email, role: user.role });
    setFormError('');
    setFormSuccess('');
  };

  const handleEdit = async (e) => {
    e.preventDefault();
    setFormError('');
    setFormSuccess('');

    const fieldErrors = validateUserForm(editForm, false);
    if (Object.keys(fieldErrors).length > 0) {
      setFormError(Object.values(fieldErrors)[0]);
      return;
    }

    setFormLoading(true);
    try {
      await adminEditUser(editTarget.id, editForm);
      setFormSuccess('User updated.');
      fetchUsers();
      setTimeout(() => { setEditTarget(null); setFormSuccess(''); }, 1000);
    } catch (err) {
      setFormError(err?.response?.data?.message ?? 'Failed to update user.');
    } finally {
      setFormLoading(false);
    }
  };


  // ── Delete ────────────────────────────────────────────────────────────────
  const handleDelete = async () => {
    setFormLoading(true);
    try {
      await adminDeleteUser(deleteTarget.id);
      setDeleteTarget(null);
      fetchUsers();
    } catch (err) {
      setFormError(err?.response?.data?.message ?? 'Failed to deactivate user.');
    } finally {
      setFormLoading(false);
    }
  };

  // ─────────────────────────────────────────────────────────────────────────

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold mb-1" style={{ color: 'var(--color-text)' }}>{title}</h1>
          <p style={{ color: 'var(--color-text-muted)', fontSize: '14px' }}>
            {total} {title.toLowerCase()} total
          </p>
        </div>
        <Button icon={<FiPlus size={14} />} onClick={() => { setCreateOpen(true); setFormError(''); setFormSuccess(''); }}>
          Add {title.replace('Admin ', '').slice(0, -1)}
        </Button>
      </div>

      {/* Search */}
      <div className="mb-4 max-w-xs">
        <Input
          icon={FiSearch}
          placeholder={`Search ${title.toLowerCase()}…`}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Table */}
      <Card>
        {loading ? (
          <div className="py-12 flex justify-center"><Spinner /></div>
        ) : listError ? (
          <Alert type="error" message={listError} />
        ) : filtered.length === 0 ? (
          <div className="py-12 text-center text-sm" style={{ color: 'var(--color-text-muted)' }}>
            No users found.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr style={{ borderBottom: '1px solid var(--color-border)' }}>
                  {['Name', 'Email', 'Role', 'Status', 'Joined', 'Actions'].map((h) => (
                    <th
                      key={h}
                      className="text-left py-3 px-4 font-semibold text-xs uppercase tracking-wide"
                      style={{ color: 'var(--color-text-muted)' }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((u) => (
                  <tr
                    key={u.id}
                    className="transition-colors"
                    style={{ borderBottom: '1px solid var(--color-border)' }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--color-bg)')}
                    onMouseLeave={(e) => (e.currentTarget.style.background = '')}
                  >
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <div
                          className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                          style={{ background: 'var(--color-primary)' }}
                        >
                          {u.name.slice(0, 2).toUpperCase()}
                        </div>
                        <span className="font-medium" style={{ color: 'var(--color-text)' }}>{u.name}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4" style={{ color: 'var(--color-text-muted)' }}>{u.email}</td>
                    <td className="py-3 px-4"><RoleBadge role={u.role} /></td>
                    <td className="py-3 px-4"><StatusBadge active={u.is_active} /></td>
                    <td className="py-3 px-4 text-xs" style={{ color: 'var(--color-text-muted)' }}>
                      {new Date(u.created_at).toLocaleDateString()}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => openEdit(u)}
                          className="p-1.5 rounded-lg transition-colors"
                          style={{ background: 'var(--color-border)', color: 'var(--color-text-muted)' }}
                          title="Edit"
                        >
                          <FiEdit2 size={13} />
                        </button>
                        {u.is_active && (
                          <button
                            onClick={() => { setDeleteTarget(u); setFormError(''); }}
                            className="p-1.5 rounded-lg transition-colors"
                            style={{ background: 'rgba(239,68,68,0.1)', color: '#ef4444' }}
                            title="Deactivate"
                          >
                            <FiTrash2 size={13} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {!loading && totalPages > 1 && (
          <div className="flex items-center justify-between pt-4 mt-2 border-t" style={{ borderColor: 'var(--color-border)' }}>
            <span className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
              Page {page} of {totalPages}
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="p-1.5 rounded-lg disabled:opacity-40"
                style={{ background: 'var(--color-border)', color: 'var(--color-text-muted)' }}
              >
                <FiChevronLeft size={14} />
              </button>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="p-1.5 rounded-lg disabled:opacity-40"
                style={{ background: 'var(--color-border)', color: 'var(--color-text-muted)' }}
              >
                <FiChevronRight size={14} />
              </button>
            </div>
          </div>
        )}
      </Card>

      {/* ── Create Modal ───────────────────────────────────────────────────── */}
      {createOpen && (
        <Modal title={`Add New ${title.replace('Admin ', '').slice(0, -1)}`} onClose={() => setCreateOpen(false)}>
          <form onSubmit={handleCreate}>
            <div className="space-y-3 mb-4">
              <Input
                label="Full Name" icon={FiUser} required
                value={createForm.name}
                onChange={(e) => setCreateForm((f) => ({ ...f, name: e.target.value }))}
                placeholder="Jane Smith"
              />
              <Input
                label="Email" icon={FiMail} type="email" required
                value={createForm.email}
                onChange={(e) => setCreateForm((f) => ({ ...f, email: e.target.value }))}
                placeholder="jane@example.com"
              />
              <Input
                label="Password" icon={FiLock} type="password" required
                value={createForm.password}
                onChange={(e) => setCreateForm((f) => ({ ...f, password: e.target.value }))}
                placeholder="Min 8 characters"
              />
              {allowRoleSelect && (
                <div>
                  <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--color-text-muted)' }}>
                    Role
                  </label>
                  <select
                    className="w-full px-3 py-2 rounded-lg text-sm"
                    style={{
                      background: 'var(--color-bg)',
                      border: '1px solid var(--color-border)',
                      color: 'var(--color-text)',
                    }}
                    value={createForm.role}
                    onChange={(e) => setCreateForm((f) => ({ ...f, role: e.target.value }))}
                  >
                    <option value="employee">Employee</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
              )}
            </div>
            <Alert type="error"   message={formError}   />
            <Alert type="success" message={formSuccess} />
            <div className="flex gap-3 justify-end">
              <Button variant="secondary" type="button" onClick={() => setCreateOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={formLoading}>
                {formLoading ? 'Creating…' : 'Create User'}
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* ── Edit Modal ────────────────────────────────────────────────────── */}
      {editTarget && (
        <Modal title="Edit User" onClose={() => setEditTarget(null)}>
          <form onSubmit={handleEdit}>
            <div className="space-y-3 mb-4">
              <Input
                label="Full Name" icon={FiUser}
                value={editForm.name}
                onChange={(e) => setEditForm((f) => ({ ...f, name: e.target.value }))}
              />
              <Input
                label="Email" icon={FiMail} type="email"
                value={editForm.email}
                onChange={(e) => setEditForm((f) => ({ ...f, email: e.target.value }))}
              />
              {allowRoleSelect && (
                <div>
                  <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--color-text-muted)' }}>
                    Role
                  </label>
                  <select
                    className="w-full px-3 py-2 rounded-lg text-sm"
                    style={{
                      background: 'var(--color-bg)',
                      border: '1px solid var(--color-border)',
                      color: 'var(--color-text)',
                    }}
                    value={editForm.role}
                    onChange={(e) => setEditForm((f) => ({ ...f, role: e.target.value }))}
                  >
                    <option value="employee">Employee</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
              )}
            </div>
            <Alert type="error"   message={formError}   />
            <Alert type="success" message={formSuccess} />
            <div className="flex gap-3 justify-end">
              <Button variant="secondary" type="button" onClick={() => setEditTarget(null)}>Cancel</Button>
              <Button type="submit" disabled={formLoading}>
                {formLoading ? 'Saving…' : 'Save Changes'}
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* ── Delete Confirmation ───────────────────────────────────────────── */}
      {deleteTarget && (
        <Modal title="Deactivate User" onClose={() => setDeleteTarget(null)}>
          <p className="text-sm mb-5" style={{ color: 'var(--color-text-muted)' }}>
            Are you sure you want to deactivate{' '}
            <strong style={{ color: 'var(--color-text)' }}>{deleteTarget.name}</strong>? They will
            no longer be able to log in. This action can be reversed from the database.
          </p>
          <Alert type="error" message={formError} />
          <div className="flex gap-3 justify-end">
            <Button variant="secondary" onClick={() => setDeleteTarget(null)}>Cancel</Button>
            <button
              onClick={handleDelete}
              disabled={formLoading}
              className="px-4 py-2 rounded-xl text-sm font-semibold transition-all"
              style={{ background: '#ef4444', color: '#fff' }}
            >
              {formLoading ? 'Deactivating…' : 'Deactivate'}
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default UserManagementPage;
