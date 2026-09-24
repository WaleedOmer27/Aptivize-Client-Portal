import { useState, useEffect } from 'react';
import aptivizeLogo from '../assets/aptivize_logo.jpeg';
import { useNavigate } from 'react-router-dom';
import { FiShield, FiMail, FiLock, FiEye, FiEyeOff } from 'react-icons/fi';
import { toast } from 'react-toastify';
import Input from '../components/Input';
import Button from '../components/Button';
import { useAuth } from '../context/AuthContext';

const REMEMBER_KEY = 'aptivize-remember-email';

const Login = () => {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({ email: '', password: '' });

  // ── Step 10: Read saved email on mount ──────────────────────────────────────
  useEffect(() => {
    const savedEmail = localStorage.getItem(REMEMBER_KEY);
    if (savedEmail) {
      setForm((f) => ({ ...f, email: savedEmail }));
      setRememberMe(true);
    }
  }, []);

  const [errors, setErrors] = useState({});

  const handleChange = (e) => {
    setError(''); // clear banner error when user starts typing
    setErrors((prev) => ({ ...prev, [e.target.name]: '' }));
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
  };

  const validate = () => {
    const e = {};
    if (!form.email.trim()) {
      e.email = 'Email is required.';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
      e.email = 'Please enter a valid email address.';
    }
    if (!form.password) {
      e.password = 'Password is required.';
    }
    return e;
  };

  // ── Real login — calls POST /api/auth/login ───────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();

    // Client-side validation first
    const fieldErrors = validate();
    if (Object.keys(fieldErrors).length > 0) {
      setErrors(fieldErrors);
      return;
    }

    setLoading(true);
    setError('');

    // Save or clear remembered email
    if (rememberMe) {
      localStorage.setItem(REMEMBER_KEY, form.email);
    } else {
      localStorage.removeItem(REMEMBER_KEY);
    }

    try {
      const user = await login(form.email, form.password);
      toast.success(`Welcome back, ${user.name}! 👋`);
      // Role-based redirect — admins go to /admin, everyone else to /dashboard
      const destination = user.role === 'admin' ? '/admin' : '/dashboard';
      navigate(destination);
    } catch (err) {
      // err.response.data.message comes from our Express controller
      const msg = err.response?.data?.message || 'Login failed. Please try again.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="surface rounded-2xl p-8 w-full"
      style={{ boxShadow: 'var(--shadow-lg)' }}
    >
      {/* Logo + Title */}
      <div className="flex flex-col items-center mb-6">
        <img
          src={aptivizeLogo}
          alt="Aptivize Logo"
          className="w-14 h-14 rounded-xl object-cover mb-4"
          style={{ boxShadow: 'var(--shadow-md)' }}
        />
        <h1 className="text-xl font-bold" style={{ color: 'var(--color-text)' }}>
          Client Portal
        </h1>
        <p
          className="text-xs tracking-widest uppercase mt-1"
          style={{ color: 'var(--color-text-subtle)' }}
        >
          Secure&nbsp;&nbsp;Access&nbsp;&nbsp;Console
        </p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div>
          <Input
            label="Email"
            id="email"
            name="email"
            type="email"
            placeholder="you@company.com"
            value={form.email}
            onChange={handleChange}
            icon={FiMail}
          />
          {errors.email && (
            <p className="text-xs mt-1" style={{ color: '#ef4444' }}>{errors.email}</p>
          )}
        </div>

        <div>
          {/* Password field — key="password" keeps the DOM node stable when
              type switches between "password" and "text", preventing browsers
              from detaching the value and triggering autofill resets. */}
          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="password"
              className="text-xs font-semibold tracking-widest uppercase"
              style={{ color: 'var(--color-text-muted)' }}
            >
              Password
            </label>
            <div className="relative flex items-center">
              <span className="absolute left-3 flex-shrink-0" style={{ color: 'var(--color-text-subtle)' }}>
                <FiLock size={15} />
              </span>
              <input
                key="password-input"
                id="password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                value={form.password}
                onChange={handleChange}
                autoComplete="current-password"
                className={`input-field w-full rounded-lg py-2.5 text-sm pl-9 pr-10 ${
                  errors.password
                    ? 'border-red-500 focus:border-red-500 focus:!shadow-[0_0_0_3px_rgba(239,68,68,0.15)]'
                    : ''
                }`}
              />
              <span className="absolute right-3 flex-shrink-0">
                <button
                  type="button"
                  onClick={() => setShowPassword((s) => !s)}
                  style={{ color: 'var(--color-text-subtle)' }}
                  className="hover:text-[var(--color-text)] transition-colors"
                >
                  {showPassword ? <FiEyeOff size={15} /> : <FiEye size={15} />}
                </button>
              </span>
            </div>
          </div>
          {errors.password && (
            <p className="text-xs mt-1" style={{ color: '#ef4444' }}>{errors.password}</p>
          )}
        </div>

        {/* ── Step 10: Remember Me ─────────────────────────────────────────── */}
        <label className="flex items-center gap-2 cursor-pointer select-none">
          <div className="relative">
            <input
              type="checkbox"
              className="sr-only peer"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
            />
            {/* Custom checkbox */}
            <div
              className="w-4 h-4 rounded border-2 flex items-center justify-center transition-colors peer-focus-visible:ring-2 peer-focus-visible:ring-[var(--color-primary)]"
              style={{
                borderColor: rememberMe ? 'var(--color-primary)' : 'var(--color-border)',
                background: rememberMe ? 'var(--color-primary)' : 'transparent',
              }}
            >
              {rememberMe && (
                <svg width="9" height="7" viewBox="0 0 9 7" fill="none">
                  <path d="M1 3.5L3.5 6L8 1" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              )}
            </div>
          </div>
          <span className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
            Remember Me
          </span>
        </label>

        {/* Server error message */}
        {error && (
          <p
            className="text-sm text-center rounded-lg px-3 py-2"
            style={{ color: 'var(--color-danger)', background: 'var(--color-danger-subtle, rgba(239,68,68,0.08))' }}
          >
            {error}
          </p>
        )}

        <Button type="submit" fullWidth loading={loading} size="lg" className="mt-1">
          {loading ? 'Signing in...' : 'Sign In'}
        </Button>
      </form>

      {/* Footer */}
      <div
        className="mt-6 pt-4 text-center text-[11px] tracking-wide"
        style={{
          borderTop: '1px solid var(--color-border)',
          color: 'var(--color-text-subtle)',
        }}
      >
        Aptivize Portal v1.0 &bull; Restricted Access
      </div>
    </div>
  );
};

export default Login;
