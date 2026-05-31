import React, { useEffect, useState } from 'react';
import api from '@/core/api/client';
import Skeleton from '@/core/Components/Skeleton';
import TimetableGrid from '@/features/Teachers/Components/TimetableGrid';
import '@/features/Teachers/Components/TimetableGrid.css';

interface TeachingProfile {
  workload?: {
    assigned_hours?: number;
    contractual_hours?: number;
    class_count?: number;
    course_count?: number;
    is_overloaded?: boolean;
  };
  principal_class?: { display_name: string };
  assignments?: Array<{
    id: number;
    class_name: string;
    subject_name: string;
    coefficient: number;
    hours_per_week: number;
    is_active: boolean;
  }>;
}

const ProfileTeachingTab: React.FC = () => {
  const [profile, setProfile] = useState<TeachingProfile | null>(null);
  const [slots, setSlots] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [profRes, ttRes] = await Promise.all([
          api.get('/api/me/teaching-profile'),
          api.get('/api/me/timetable'),
        ]);
        setProfile(profRes.data);
        setSlots(ttRes.data?.slots || []);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  if (loading) return <Skeleton className="skel-h-24" />;

  const wl = profile?.workload;

  return (
    <div className="profile-section-new">
      <div className="section-title"><h2>Profil pédagogique</h2></div>

      <div className="profile-kpi-grid">
        <article className={`profile-kpi-card ${wl?.is_overloaded ? 'warn' : ''}`}>
          <small>Charge horaire</small>
          <strong>{wl?.assigned_hours ?? 0} / {wl?.contractual_hours ?? '—'} h</strong>
          {wl?.is_overloaded && <span className="overload-badge">Surcharge détectée</span>}
        </article>
        <article className="profile-kpi-card">
          <small>Classes</small>
          <strong>{wl?.class_count ?? 0}</strong>
        </article>
        <article className="profile-kpi-card">
          <small>Cours</small>
          <strong>{wl?.course_count ?? 0}</strong>
        </article>
        {profile?.principal_class && (
          <article className="profile-kpi-card">
            <small>Classe titulaire</small>
            <strong className="kpi-sm">{profile.principal_class.display_name}</strong>
          </article>
        )}
      </div>

      <h3 className="subsection-title">Affectations</h3>
      <table className="profile-data-table">
        <thead>
          <tr><th>Classe</th><th>Matière</th><th>Coef.</th><th>h/sem</th></tr>
        </thead>
        <tbody>
          {(profile?.assignments || []).filter((a) => a.is_active).map((a) => (
            <tr key={a.id}>
              <td>{a.class_name}</td>
              <td>{a.subject_name}</td>
              <td>{a.coefficient}</td>
              <td>{a.hours_per_week}</td>
            </tr>
          ))}
          {(profile?.assignments || []).filter((a) => a.is_active).length === 0 && (
            <tr><td colSpan={4} className="empty-cell">Aucune affectation active</td></tr>
          )}
        </tbody>
      </table>

      <h3 className="subsection-title">Emploi du temps</h3>
      <TimetableGrid slots={slots} />
    </div>
  );
};

export default ProfileTeachingTab;
