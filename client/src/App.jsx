import { createBrowserRouter, createRoutesFromElements, Route, RouterProvider, Navigate } from 'react-router-dom';
import { lazy, Suspense } from 'react';
import { useAuth } from './context/AuthContext';
import Spinner from './components/Spinner';

// Layouts
import MainLayout  from './layouts/MainLayout';
import AuthLayout  from './layouts/AuthLayout';
import AdminLayout from './layouts/AdminLayout';

// Guards
import ProtectedRoute from './components/ProtectedRoute';
import AdminRoute     from './components/AdminRoute';

// ─── Lazy-loaded pages ───────────────────────────────────────────────────────
// Pages are code-split so each chunk is only downloaded when first visited.
// The heaviest chunk (Recharts in AdminAnalytics, ~300 kB) loads only on demand.

// Auth
const Login = lazy(() => import('./pages/Login'));

// App (client / employee)
const Dashboard    = lazy(() => import('./pages/Dashboard'));
const Projects     = lazy(() => import('./pages/Projects'));
const ProjectDetail = lazy(() => import('./pages/ProjectDetail'));
const Messages     = lazy(() => import('./pages/Messages'));
const Invoices     = lazy(() => import('./pages/Invoices'));
const Support      = lazy(() => import('./pages/Support'));
const TicketDetail = lazy(() => import('./pages/TicketDetail'));
const Profile      = lazy(() => import('./pages/Profile'));

// Admin
const AdminDashboard     = lazy(() => import('./pages/admin/AdminDashboard'));
const AdminClients       = lazy(() => import('./pages/admin/AdminClients'));
const AdminEmployees     = lazy(() => import('./pages/admin/AdminEmployees'));
const AdminAnalytics     = lazy(() => import('./pages/admin/AdminAnalytics'));
const AdminCreateProject = lazy(() => import('./pages/admin/AdminCreateProject'));

// Utility
const NotFound = lazy(() => import('./pages/NotFound'));

// ─── Fallback spinner shown while a chunk is loading ─────────────────────────
const PageLoader = () => (
  <div className="flex items-center justify-center h-full min-h-[300px]">
    <Spinner />
  </div>
);

// ─── Role-based root redirect ─────────────────────────────────────────────────
// Admins land on /admin; everyone else lands on /dashboard.
const RootRedirect = () => {
  const { user } = useAuth();
  return <Navigate to={user?.role === 'admin' ? '/admin' : '/dashboard'} replace />;
};

// ─── Router ───────────────────────────────────────────────────────────────────
const router = createBrowserRouter(
  createRoutesFromElements(
    <>
      {/* Public — Auth pages (no guard) */}
      <Route element={<AuthLayout />}>
        <Route path="/login" element={<Suspense fallback={<PageLoader />}><Login /></Suspense>} />
      </Route>

      {/* ── Client / Employee Protected Routes ───────────────────────────────
           ProtectedRoute checks isAuthenticated from AuthContext.
           If false → <Navigate to="/login" />
           If true  → renders the nested page via <Outlet />
      ──────────────────────────────────────────────────────────────────── */}
      <Route element={<ProtectedRoute />}>
        <Route element={<MainLayout />}>
          <Route index element={<RootRedirect />} />
          <Route path="/dashboard"      element={<Suspense fallback={<PageLoader />}><Dashboard /></Suspense>} />
          <Route path="/projects"       element={<Suspense fallback={<PageLoader />}><Projects /></Suspense>} />
          <Route path="/projects/:id"   element={<Suspense fallback={<PageLoader />}><ProjectDetail /></Suspense>} />
          <Route path="/messages"       element={<Suspense fallback={<PageLoader />}><Messages /></Suspense>} />
          <Route path="/invoices"       element={<Suspense fallback={<PageLoader />}><Invoices /></Suspense>} />
          <Route path="/support"        element={<Suspense fallback={<PageLoader />}><Support /></Suspense>} />
          <Route path="/support/:id"    element={<Suspense fallback={<PageLoader />}><TicketDetail /></Suspense>} />
          <Route path="/profile"        element={<Suspense fallback={<PageLoader />}><Profile /></Suspense>} />
        </Route>
      </Route>

      {/* ── Admin Routes ──────────────────────────────────────────────────────
           AdminRoute checks isAuthenticated AND role === 'admin'.
           Non-admins are redirected to /dashboard.
      ──────────────────────────────────────────────────────────────────── */}
      <Route element={<AdminRoute />}>
        <Route element={<AdminLayout />}>
          <Route path="/admin"                   element={<Suspense fallback={<PageLoader />}><AdminDashboard /></Suspense>} />
          <Route path="/admin/clients"           element={<Suspense fallback={<PageLoader />}><AdminClients /></Suspense>} />
          <Route path="/admin/employees"         element={<Suspense fallback={<PageLoader />}><AdminEmployees /></Suspense>} />
          <Route path="/admin/analytics"         element={<Suspense fallback={<PageLoader />}><AdminAnalytics /></Suspense>} />
          <Route path="/admin/projects/new"      element={<Suspense fallback={<PageLoader />}><AdminCreateProject /></Suspense>} />
        </Route>
      </Route>

      {/* 404 */}
      <Route path="*" element={<Suspense fallback={<PageLoader />}><NotFound /></Suspense>} />
    </>
  )
);

const App = () => <RouterProvider router={router} />;

export default App;
