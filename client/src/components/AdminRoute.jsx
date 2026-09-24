import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Spinner from './Spinner';

/**
 * AdminRoute
 *
 * Guards admin-only routes. Three states:
 *  1. loading=true          → show spinner (session check in progress)
 *  2. not authenticated     → redirect to /login
 *  3. authenticated, not admin → redirect to /dashboard
 *  4. admin                 → render nested route via <Outlet />
 */
const AdminRoute = () => {
  const { user, isAuthenticated, loading } = useAuth();

  if (loading)          return <Spinner fullScreen />;
  if (!isAuthenticated) return <Navigate to="/login"    replace />;
  if (user?.role !== 'admin') return <Navigate to="/dashboard" replace />;

  return <Outlet />;
};

export default AdminRoute;
