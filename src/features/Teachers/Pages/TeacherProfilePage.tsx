import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '@/core/api/client';
import Skeleton from '@/core/Components/Skeleton';
import './TeacherProfilePage.css';

type TeachingProfile = {
  user: {
    id: number;
    first_name: string;
    last_name: string;
    email: string;
    department?: string;
    job_title?: string;
    workload_hours?: number;
  };
  principal_class?: { id: number; display_name: string } | null;
  assignments: Array<{
    id: number;
    class_name: string;
    subject_name: string;
    coefficient: number;
    hours_per_week: number;
    is_active: boolean;
  }>;
  workload: {
    assigned_hours: number;
    contractual_hours: number | null;
    is_overloaded: boolean;
    course_count: number;
    class_count: number;
  };
};

const TeacherProfilePage: React.FC = () => {
  const [teachers, setTeachers] = useState<TeachingProfile[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [profile, setProfile] = useState<TeachingProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const res = await api.get('/api/teachers', { params: { per_page: 100 } });
        const list = res.data?.data || [];
        setTeachers(list);
        if (list.length) {
          setSelectedId(list[0].user.id);
        }
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  useEffect(() => {
    if (!selectedId) return;
    api.get(`/api/teachers/${selectedId}`).then((res) => setProfile(res.data));
  }, [selectedId]);

  if (loading) {
    return <Skeleton className="skel-h-24" />;
  }

  return (
    <div className="teacher-profile-page">
      <header className="page-hero">
        <div>
          <h1>Fiches enseignants</h1>
          <p>Charge horaire, affectations et classe titulaire.</p>
        </div>
        <Link to="/teachers/workload" className="btn btn-outline">Vue charge globale</Link>
      </header>

      <div className="tp-layout">
        <aside className="tp-list">
          {teachers.map((t) => (
            <button
              key={t.user.id}
              type="button"
              className={selectedId === t.user.id ? 'active' : ''}
              onClick={() => setSelectedId(t.user.id)}
            >
              {t.user.last_name} {t.user.first_name}
              {t.workload.is_overloaded && <span className="overload-badge">Surcharge</span>}
            </button>
          ))}
        </aside>

        {profile && (
          <section className="tp-detail">
            <h2>{profile.user.first_name} {profile.user.last_name}</h2>
            <p>{profile.user.email} · {profile.user.job_title || 'Enseignant'} · {profile.user.department || '—'}</p>

            <div className="tp-kpis">
              <div className={`kpi ${profile.workload.is_overloaded ? 'warn' : ''}`}>
                <strong>{profile.workload.assigned_hours}</strong>
                <span>/ {profile.workload.contractual_hours ?? '—'} h contractuelles</span>
              </div>
              <div className="kpi"><strong>{profile.workload.class_count}</strong><span>classes</span></div>
              <div className="kpi"><strong>{profile.workload.course_count}</strong><span>cours</span></div>
            </div>

            {profile.principal_class && (
              <p className="tp-homeroom">
                Titulaire : <Link to="/classes">{profile.principal_class.display_name}</Link>
              </p>
            )}

            <h3>Affectations</h3>
            <table className="data-table">
              <thead>
                <tr><th>Classe</th><th>Matière</th><th>Coef</th><th>h/sem</th><th>Actif</th></tr>
              </thead>
              <tbody>
                {profile.assignments.map((a) => (
                  <tr key={a.id}>
                    <td>{a.class_name}</td>
                    <td>{a.subject_name}</td>
                    <td>{a.coefficient}</td>
                    <td>{a.hours_per_week}</td>
                    <td>{a.is_active ? 'Oui' : 'Non'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        )}
      </div>
    </div>
  );
};

export default TeacherProfilePage;
