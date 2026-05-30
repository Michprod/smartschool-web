import { Suspense } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '@/core/auth/AuthProvider';
import DashboardLayout from '@/core/Layouts/DashboardLayout';
import PageContentFallback from '@/core/Components/PageContentFallback';
import Skeleton from '@/core/Components/Skeleton';

export default function ProtectedRoute() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="loading-screen loading-screen--full">
        <Skeleton className="skel-h-10" />
        <Skeleton className="skel-h-24" />
        <Skeleton className="skel-h-24" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return (
    <DashboardLayout>
      <Suspense fallback={<PageContentFallback />}>
        <Outlet />
      </Suspense>
    </DashboardLayout>
  );
}

