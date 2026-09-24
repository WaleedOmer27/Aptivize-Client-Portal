import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Spinner from './Spinner';

/**
 * ProtectedRoute
 *
 * Guards all authenticated routes. Three possible states:
 *
 *  1. loading = true  → AuthContext is verifying the stored JWT via GET /api/auth/me.
 *                        Show a spinner — do NOT redirect yet, the user may be valid.
 *
 *  2. isAuthenticated = false → No valid session. Redirect to /login.
 *
 *  3. isAuthenticated = true  → Render the nested route via <Outlet />.
 */
const ProtectedRoute = () => {
  const { isAuthenticated, loading } = useAuth();

  // Still checking session — don't flash a redirect before we know
  if (loading) {
    return <Spinner fullScreen />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
};

export default ProtectedRoute;
