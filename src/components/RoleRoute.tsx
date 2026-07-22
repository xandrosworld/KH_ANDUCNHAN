import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { getRoleDashboardPath } from '../data/roles';

export default function RoleRoute({ roles }: { roles: readonly string[] }) {
  const { user, approvedRoles } = useAuth();
  const activeRole = user?.activeRole || approvedRoles[0]?.slug || '';

  if (!activeRole || !roles.includes(activeRole)) {
    return <Navigate to={getRoleDashboardPath(activeRole)} replace />;
  }

  return <Outlet />;
}
