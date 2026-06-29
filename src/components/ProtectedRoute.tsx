import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

/**
 * ProtectedRoute: wraps routes that require authentication.
 * - Loading → spinner
 * - Not authenticated → redirect to /
 * - Authenticated but no approved roles → redirect to /pending-approval
 * - Otherwise → render child routes
 */
const ProtectedRoute = () => {
  const { isAuthenticated, isLoading, approvedRoles } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  if (approvedRoles.length === 0) {
    return <Navigate to="/pending-approval" replace />;
  }

  return <Outlet />;
};

export default ProtectedRoute;
