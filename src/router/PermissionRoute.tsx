import { Navigate } from 'react-router-dom';
import { useAuth } from '@/core/auth/AuthProvider';
import { hasPermission } from '@/core/auth/types';

interface PermissionRouteProps {
  permission: string;
  children: React.ReactNode;
}

export default function PermissionRoute({ permission, children }: PermissionRouteProps) {
  const { user, loading } = useAuth();

  if (loading) {
    return null;
  }

  if (!user || !hasPermission(user.all_permissions, permission)) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}

