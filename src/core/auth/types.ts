export interface AuthUser {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  role: string;
  phone?: string;
  avatar?: string;
  avatar_url?: string;
  department?: string;
  job_title?: string;
  is_active: boolean;
  all_permissions: string[];
}

export function hasPermission(userPermissions: string[] | undefined, required: string): boolean {
  if (!userPermissions?.length) return false;
  if (userPermissions.includes('*')) return true;
  if (userPermissions.includes(required)) return true;
  const [resource] = required.split(':');
  return userPermissions.includes(`${resource}:*`);
}
