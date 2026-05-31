export type StaffType = 'teacher' | 'secretary' | 'accountant' | 'director' | 'other';

export interface PersonnelRecord {
  id: number;
  user_id: number;
  staff_number: string;
  staff_type: StaffType;
  first_name: string;
  last_name: string;
  full_name?: string;
  phone: string | null;
  avatar_url: string | null;
  birth_date: string | null;
  address: string | null;
  city: string | null;
  province: string | null;
  province_id: number | null;
  city_id: number | null;
  commune_id: number | null;
  quartier: string | null;
  department: string | null;
  job_title: string | null;
  job_grade: string | null;
  workload_hours: number | null;
  hire_date: string | null;
  contract_type: string | null;
  employment_status: string;
  bio: string | null;
  notes: string | null;
  is_active: boolean;
  user?: {
    id: number;
    email: string;
    role: string;
    is_active: boolean;
    last_login: string | null;
  };
}

export const STAFF_TYPE_LABELS: Record<StaffType, string> = {
  teacher: 'Enseignant',
  secretary: 'Secrétaire',
  accountant: 'Comptable',
  director: 'Directeur',
  other: 'Autre',
};

export type PersonnelTab = 'identity' | 'professional' | 'teaching' | 'account' | 'notes';
