import { useState } from 'react';
import { FiUser, FiMail, FiEdit2, FiLock, FiCheck, FiAlertCircle } from 'react-icons/fi';
import Card from '../components/Card';
import Input from '../components/Input';
import Button from '../components/Button';
import { useAuth } from '../context/AuthContext';
import { updateProfile, changePassword } from '../services/api';

// ─── Inline alert helper ───────────────────────────────────────────────────────
const Alert = ({ type, message }) => {
  if (!message) return null;
  const isError = type === 'error';
  return (
    <div
      className="flex items-center gap-2 text-sm px-3 py-2 rounded-lg mt-3"
      style={{
        background: isError ? 'rgba(239,68,68,0.1)' : 'rgba(34,197,94,0.1)',
        color:      isError ? '#ef4444'              : '#22c55e',
        border:     `1px solid ${isError ? 'rgba(239,68,68,0.3)' : 'rgba(34,197,94,0.3)'}`,
      }}
    >
      {isError ? <FiAlertCircle size={14} /> : <FiCheck size={14} />}
      <span>{message}</span>
    </div>
  );
};

const ROLE_LABELS = { admin: 'Admin', employee: 'Employee', client: 'Client' };

// ─── Role badge colours ───────────────────────────────────────────────────────
const ROLE_COLORS = {
  admin:    { bg: 'rgba(239,68,68,0.12)',   color: '#ef4444' },
  employee: { bg: 'rgba(59,130,246,0.12)',  color: '#3b82f6' },
  client:   { bg: 'var(--color-primary-light)', color: 'var(--color-primary)' },
};

// ─────────────────────────────────────────────────────────────────────────────

const Profile = () => {
  const { user, updateUserState } = useAuth();

  // ── Profile form state ────────────────────────────────────────────────────
  const [profileForm, setProfileForm] = useState({
    name:  user?.name  ?? '',
    email: user?.email ?? '',
  });
  const [profileStatus, setProfileStatus] = useState({ type: '', message: '' });
  const [profileLoading, setProfileLoading] = useState(false);

  // ── Password form state ───────────────────────────────────────────────────
  const [pwForm, setPwForm] = useState({
    currentPassword: '',
    newPassword:     '',
    confirmPassword: '',
  });
  const [pwStatus, setPwStatus] = useState({ type: '', message: '' });
  const [pwLoading, setPwLoading] = useState(false);

  // ── Handlers ──────────────────────────────────────────────────────────────

  const [profileErrors, setProfileErrors] = useState({});
  const [pwErrors,      setPwErrors]      = useState({});

  const handleProfileChange = (e) => {
    setProfileErrors((prev) => ({ ...prev, [e.target.name]: '' }));
    setProfileForm((f) => ({ ...f, [e.target.name]: e.target.value }));
  };

  const handleProfileSubmit = async (e) => {
    e.preventDefault();

    // Client-side validation
    const fe = {};
    if (!profileForm.name.trim()) fe.name = 'Name is required.';
    else if (profileForm.name.trim().length < 2) fe.name = 'Name must be at least 2 characters.';
    if (!profileForm.email.trim()) fe.email = 'Email is required.';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(profileForm.email.trim())) fe.email = 'Please enter a valid email.';
    if (Object.keys(fe).length > 0) { setProfileErrors(fe); return; }

    setProfileLoading(true);
    setProfileStatus({ type: '', message: '' });
    try {
      const data = await updateProfile(profileForm);
      updateUserState(data.user);      // live-update sidebar name/avatar
      setProfileStatus({ type: 'success', message: 'Profile saved successfully.' });
    } catch (err) {
      setProfileStatus({
        type:    'error',
        message: err?.response?.data?.message ?? 'Failed to update profile.',
      });
    } finally {
      setProfileLoading(false);
    }
  };

  const handlePwChange = (e) => {
    setPwErrors((prev) => ({ ...prev, [e.target.name]: '' }));
    setPwForm((f) => ({ ...f, [e.target.name]: e.target.value }));
  };

  const handlePwSubmit = async (e) => {
    e.preventDefault();

    // Client-side validation
    const fe = {};
    if (!pwForm.currentPassword) fe.currentPassword = 'Current password is required.';
    if (!pwForm.newPassword) fe.newPassword = 'New password is required.';
    else if (pwForm.newPassword.length < 8) fe.newPassword = 'Password must be at least 8 characters.';
    if (!pwForm.confirmPassword) fe.confirmPassword = 'Please confirm your new password.';
    else if (pwForm.newPassword !== pwForm.confirmPassword) fe.confirmPassword = 'Passwords do not match.';
    if (Object.keys(fe).length > 0) { setPwErrors(fe); return; }

    setPwLoading(true);
    setPwStatus({ type: '', message: '' });
    try {
      await changePassword({
        currentPassword: pwForm.currentPassword,
        newPassword:     pwForm.newPassword,
      });
      setPwStatus({ type: 'success', message: 'Password updated successfully.' });
      setPwForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) {
      setPwStatus({
        type:    'error',
        message: err?.response?.data?.message ?? 'Failed to update password.',
      });
    } finally {
      setPwLoading(false);
    }
  };


  const roleColors = ROLE_COLORS[user?.role] ?? ROLE_COLORS.client;
  const initials   = (user?.name ?? 'U').split(' ').map((w) => w[0]).join('').toUpperCase().slice(0, 2);

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-1" style={{ color: 'var(--color-text)' }}>Profile</h1>
        <p style={{ color: 'var(--color-text-muted)', fontSize: '14px' }}>
          Manage your account information and security settings.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* ── Avatar card ──────────────────────────────────────────────────── */}
        <Card className="flex flex-col items-center text-center py-8">
          {/* Avatar circle with initials */}
          <div
            className="w-20 h-20 rounded-full flex items-center justify-center mb-4 text-white font-bold text-2xl"
            style={{ background: 'var(--color-primary)' }}
          >
            {initials}
          </div>
          <h2 className="font-bold text-base mb-0.5" style={{ color: 'var(--color-text)' }}>
            {user?.name ?? 'User'}
          </h2>
          <p className="text-sm mb-2" style={{ color: 'var(--color-text-muted)' }}>
            {user?.email ?? ''}
          </p>
          <span
            className="text-[11px] font-semibold px-2.5 py-1 rounded-full"
            style={{ background: roleColors.bg, color: roleColors.color }}
          >
            {ROLE_LABELS[user?.role] ?? 'Client'}
          </span>
        </Card>

        {/* ── Personal Information form ─────────────────────────────────────── */}
        <Card className="lg:col-span-2">
          <h3 className="font-semibold text-sm mb-4" style={{ color: 'var(--color-text)' }}>
            Personal Information
          </h3>
          <form onSubmit={handleProfileSubmit}>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-5">
              <div>
                <Input
                  label="Full Name"
                  icon={FiUser}
                  name="name"
                  value={profileForm.name}
                  onChange={handleProfileChange}
                  placeholder="Your full name"
                />
                {profileErrors.name && (
                  <p className="text-xs mt-1" style={{ color: '#ef4444' }}>{profileErrors.name}</p>
                )}
              </div>
              <div>
                <Input
                  label="Email"
                  icon={FiMail}
                  name="email"
                  type="email"
                  value={profileForm.email}
                  onChange={handleProfileChange}
                  placeholder="your@email.com"
                />
                {profileErrors.email && (
                  <p className="text-xs mt-1" style={{ color: '#ef4444' }}>{profileErrors.email}</p>
                )}
              </div>
            </div>
            <Alert type={profileStatus.type} message={profileStatus.message} />
            <div className="mt-4">
              <Button
                type="submit"
                icon={<FiEdit2 size={13} />}
                disabled={profileLoading}
              >
                {profileLoading ? 'Saving…' : 'Save Changes'}
              </Button>
            </div>
          </form>
        </Card>

        {/* ── Change Password form ──────────────────────────────────────────── */}
        <Card className="lg:col-span-3">
          <h3 className="font-semibold text-sm mb-4" style={{ color: 'var(--color-text)' }}>
            Change Password
          </h3>
          <form onSubmit={handlePwSubmit}>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-2">
              <div>
                <Input
                  label="Current Password"
                  icon={FiLock}
                  name="currentPassword"
                  type="password"
                  placeholder="••••••••"
                  value={pwForm.currentPassword}
                  onChange={handlePwChange}
                />
                {pwErrors.currentPassword && (
                  <p className="text-xs mt-1" style={{ color: '#ef4444' }}>{pwErrors.currentPassword}</p>
                )}
              </div>
              <div>
                <Input
                  label="New Password"
                  icon={FiLock}
                  name="newPassword"
                  type="password"
                  placeholder="••••••••"
                  value={pwForm.newPassword}
                  onChange={handlePwChange}
                />
                {pwErrors.newPassword && (
                  <p className="text-xs mt-1" style={{ color: '#ef4444' }}>{pwErrors.newPassword}</p>
                )}
              </div>
              <div>
                <Input
                  label="Confirm Password"
                  icon={FiLock}
                  name="confirmPassword"
                  type="password"
                  placeholder="••••••••"
                  value={pwForm.confirmPassword}
                  onChange={handlePwChange}
                />
                {pwErrors.confirmPassword && (
                  <p className="text-xs mt-1" style={{ color: '#ef4444' }}>{pwErrors.confirmPassword}</p>
                )}
              </div>
            </div>
            <Alert type={pwStatus.type} message={pwStatus.message} />
            <div className="mt-4">
              <Button
                type="submit"
                variant="secondary"
                icon={<FiLock size={13} />}
                disabled={pwLoading}
              >
                {pwLoading ? 'Updating…' : 'Update Password'}
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </div>
  );
};

export default Profile;
