import api from '@/core/api/client';

/** Année scolaire courante (settings backend), accessible aux enseignants. */
export async function fetchSchoolYear(): Promise<string> {
  try {
    const res = await api.get('/api/grades/school-year');
    return res.data?.academic_year || '2025-2026';
  } catch {
    return '2025-2026';
  }
}
