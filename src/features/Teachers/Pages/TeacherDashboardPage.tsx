import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '@/core/api/client';
import Skeleton from '@/core/Components/Skeleton';
import TimetableGrid from '../Components/TimetableGrid';
import './TeacherDashboardPage.css';

const TeacherDashboardPage: React.FC = () => {
  const [profile, setProfile] = useState<any>(null);
  const [timetable, setTimetable] = useState<any>(null);
  const [sessions, setSessions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [profRes, ttRes, sessRes] = await Promise.all([
          api.get('/api/me/teaching-profile'),
          api.get('/api/me/timetable'),
          api.get('/api/grades/evaluation-sessions', { params: { per_page: 5 } }),
        ]);
        setProfile(profRes.data);
        setTimetable(ttRes.data);
        setSessions(sessRes.data?.data || sessRes.data || []);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  if (loading) return <Skeleton className="skel-h-24" />;

  const wl = profile?.workload;

  return (
    <div className="teacher-dashboard">
      <header className="page-hero">
        <div>
          <h1>Portail enseignant</h1>
          <p>Bienvenue {profile?.user?.first_name} — vue d&apos;ensemble de votre activité.</p>
        </div>
      </header>

      <div className="td-kpis">
        <article className={`td-kpi ${wl?.is_overloaded ? 'warn' : ''}`}>
          <h3>Charge horaire</h3>
          <p>{wl?.assigned_hours ?? 0} / {wl?.contractual_hours ?? '—'} h</p>
        </article>
        <article className="td-kpi">
          <h3>Classes</h3>
          <p>{wl?.class_count ?? 0}</p>
        </article>
        <article className="td-kpi">
          <h3>Cours</h3>
          <p>{wl?.course_count ?? 0}</p>
        </article>
        {profile?.principal_class && (
          <article className="td-kpi">
            <h3>Classe titulaire</h3>
            <p>{profile.principal_class.display_name}</p>
          </article>
        )}
      </div>

      <div className="td-shortcuts">
        <Link to="/grades" className="btn btn-primary">Saisir des notes</Link>
        {profile?.principal_class && (
          <Link to="/conduct" className="btn btn-outline">Saisir la conduite</Link>
        )}
      </div>

      <section className="td-section">
        <h2>Emploi du temps</h2>
        <TimetableGrid slots={timetable?.slots || []} />
      </section>

      <section className="td-section">
        <h2>Prochaines sessions d&apos;évaluation</h2>
        {sessions.length === 0 ? (
          <p className="empty-msg">Aucune session récente.</p>
        ) : (
          <ul className="td-sessions">
            {sessions.slice(0, 5).map((s: any) => (
              <li key={s.id}>
                <strong>{s.title}</strong> — {s.type} · {s.date}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
};

export default TeacherDashboardPage;
