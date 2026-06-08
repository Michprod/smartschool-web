import { Navigate } from 'react-router-dom';
import { useAuth } from '@/core/auth/AuthProvider';
import { hasPermission } from '@/core/auth/types';
import Skeleton from '@/core/Components/Skeleton';

interface PermissionRouteProps {
  permission: string;
  children: React.ReactNode;
}

export default function PermissionRoute({ permission, children }: PermissionRouteProps) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="loading-screen">
        <Skeleton className="skel-h-10" />
        <Skeleton className="skel-h-24" />
      </div>
    );
  }

  if (!user || !hasPermission(user.all_permissions, permission)) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}

