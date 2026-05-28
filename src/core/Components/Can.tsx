import React from 'react';
import { useAuth } from '@/core/auth/AuthProvider';
import { hasPermission } from '@/core/auth/types';

interface CanProps {
  permission?: string;
  permissions?: string[];
  role?: string;
  roles?: string[];
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

const Can: React.FC<CanProps> = ({
  permission,
  permissions,
  role,
  roles,
  children,
  fallback = null,
}) => {
  const { user } = useAuth();

  if (!user) return <>{fallback}</>;

  const userPermissions = user.all_permissions || [];
  const userRole = user.role;

  let hasAccess = false;

  if (userRole === 'admin' || userPermissions.includes('*')) {
    hasAccess = true;
  } else {
    if (role && userRole === role) hasAccess = true;
    if (roles && roles.includes(userRole)) hasAccess = true;

    if (permission && hasPermission(userPermissions, permission)) {
      hasAccess = true;
    }

    if (permissions) {
      hasAccess = permissions.some((p) => hasPermission(userPermissions, p));
    }
  }

  return hasAccess ? <>{children}</> : <>{fallback}</>;
};

export default Can;



