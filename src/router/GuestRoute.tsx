import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../core/auth/AuthProvider';
import Skeleton from '@/core/Components/Skeleton';

export default function GuestRoute() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="loading-screen" style={{ width: '100%', padding: 16, gap: 12 }}>
        <Skeleton className="skel-h-10" />
        <Skeleton className="skel-h-24" />
      </div>
    );
  }

  if (user) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
}



