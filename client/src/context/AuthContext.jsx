import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import axios from 'axios';

const AuthContext = createContext(null);

// ─── Axios base config ────────────────────────────────────────────────────────
// All requests go to /api (proxied to localhost:5000 by Vite)
const api = axios.create({ baseURL: '/api' });

// Attach the JWT token to every outgoing request automatically.
// This interceptor runs before each request — if a token is in localStorage,
// it's added as the Authorization header so protected routes work.
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('aptivize-token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export { api }; // Export so other parts of the app can use the same axios instance

// ─────────────────────────────────────────────────────────────────────────────

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true); // true on first mount while we check session

  // ── Restore session on app boot ───────────────────────────────────────────
  // When the page loads, if there's a token in localStorage we call GET /api/auth/me
  // to verify it's still valid and get fresh user data.
  // If the token is expired or invalid, the server returns 401 → we clear it.
  useEffect(() => {
    // One-time cleanup: remove stale key from pre-Day-3 auth scheme
    localStorage.removeItem('aptivize-user');

    const token = localStorage.getItem('aptivize-token');
    if (!token) {
      setLoading(false);
      return;
    }

    api
      .get('/auth/me')
      .then((res) => setUser(res.data.user))
      .catch(() => {
        // Token invalid or expired — clean up
        localStorage.removeItem('aptivize-token');
        setUser(null);
      })
      .finally(() => setLoading(false));
  }, []);

  // ── login() — called from Login.jsx on form submit ────────────────────────
  // Returns the user object on success, throws on failure so the caller
  // can catch and display the error message from the server.
  const login = useCallback(async (email, password) => {
    const res = await api.post('/auth/login', { email, password });
    const { token, user: loggedInUser } = res.data;

    // Persist the token so it survives page refreshes
    localStorage.setItem('aptivize-token', token);
    setUser(loggedInUser);

    return loggedInUser;
  }, []);

  // ── logout() ─────────────────────────────────────────────────────────────
  const logout = useCallback(async () => {
    try {
      await api.post('/auth/logout');
    } catch {
      // Even if the server call fails, we still clear locally
    }
    localStorage.removeItem('aptivize-token');
    setUser(null);
  }, []);

  // ── updateUser() — merge partial data into user state ─────────────────────
  // Called by Profile.jsx after a successful PATCH /api/users/me so the
  // sidebar name and avatar update without a full page reload.
  const updateUserState = useCallback((partial) => {
    setUser((prev) => (prev ? { ...prev, ...partial } : prev));
  }, []);

  const isAuthenticated = !!user;

  return (
    <AuthContext.Provider value={{ user, isAuthenticated, loading, login, logout, updateUserState, api }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
};
