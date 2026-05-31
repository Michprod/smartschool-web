export interface RoleInfo {
  slug: string;
  name: string;
  description?: string;
}

export interface ProfileUser {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  phone: string | null;
  avatar: string | null;
  avatar_url: string | null;
  role: string;
  department: string | null;
  is_active: boolean;
  has_professional_profile?: boolean;
  workload_hours?: number | null;
  job_grade?: string | null;
  job_title?: string | null;
  bio: string | null;
  birth_date: string | null;
  address: string | null;
  city: string | null;
  province: string | null;
  province_id: number | null;
  city_id: number | null;
  commune_id: number | null;
  quartier: string | null;
  last_login: string | null;
  created_at: string | null;
  all_permissions: string[];
  role_info: RoleInfo | null;
}

export type ProfileTab =
  | 'overview'
  | 'personal'
  | 'professional'
  | 'teaching'
  | 'parent'
  | 'account'
  | 'security'
  | 'preferences';

export function computeProfileCompletion(user: ProfileUser): number {
  const fields = [
    user.first_name,
    user.last_name,
    user.email,
    user.phone,
    user.avatar_url,
    user.birth_date,
    user.address,
    user.province_id || user.province,
    user.city_id || user.city,
    user.bio,
  ];
  const filled = fields.filter((f) => f != null && String(f).trim() !== '').length;
  return Math.round((filled / fields.length) * 100);
}

export function getRoleLabel(role: string): string {
  const labels: Record<string, string> = {
    admin: 'Administrateur',
    director: 'Directeur',
    teacher: 'Enseignant',
    accountant: 'Comptable',
    secretary: 'Secrétaire',
    parent: 'Parent',
  };
  return labels[role] || role;
}

export function avatarDisplayUrl(user: Pick<ProfileUser, 'avatar' | 'avatar_url'>): string {
  if (user.avatar_url) return user.avatar_url;
  if (user.avatar?.startsWith('http')) return user.avatar;
  if (user.avatar) return `/storage/${user.avatar}`;
  return '';
}
