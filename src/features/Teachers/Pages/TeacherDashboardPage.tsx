import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '@/core/api/client';
import { extractList } from '@/core/api/extractData';
import { fetchSchoolYear } from '@/core/utils/schoolYear';
import Skeleton from '@/core/Components/Skeleton';
import TimetableGrid, { type TimetableSlot } from '../Components/TimetableGrid';
import './TeacherDashboardPage.css';

type Assignment = {
  id: number;
  class_name?: string;
  subject_name?: string;
  subject_code?: string;
  hours_per_week?: number;
  academic_year?: string;
  is_active?: boolean;
};

const TeacherDashboardPage: React.FC = () => {
  const [profile, setProfile] = useState<{
    user?: { first_name?: string };
    principal_class?: { display_name?: string; academic_year?: string };
    assignments?: Assignment[];
    workload?: { assigned_hours?: number; contractual_hours?: number; class_count?: number; course_count?: number; is_overloaded?: boolean };
  } | null>(null);
  const [timetable, setTimetable] = useState<{ slots?: TimetableSlot[] } | null>(null);
  const [sessions, setSessions] = useState<Array<{ id: number; title: string; type: string; date: string }>>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [academicYear, setAcademicYear] = useState('2025-2026');

  const loadData = async (year: string) => {
    setLoading(true);
    setLoadError(null);
    try {
      const [profRes, ttRes] = await Promise.all([
        api.get('/api/me/teaching-profile', { params: { academic_year: year } }),
        api.get('/api/me/timetable', { params: { academic_year: year } }),
      ]);
      setProfile(profRes.data);
      setTimetable(ttRes.data);
    } catch {
      setLoadError('Impossible de charger votre profil enseignant.');
      setProfile(null);
      setTimetable(null);
    } finally {
      setLoading(false);
    }

    try {
      const sessRes = await api.get('/api/grades/evaluation-sessions', {
        params: { per_page: 5, academic_year: year },
      });
      setSessions(sessRes.data?.data || sessRes.data || []);
    } catch {
      setSessions([]);
    }
  };

  useEffect(() => {
    fetchSchoolYear().then((year) => {
      setAcademicYear(year);
      loadData(year);
    });
  }, []);

  if (loading) return <Skeleton className="skel-h-24" />;

  const wl = profile?.workload;
  const activeAssignments = (profile?.assignments ?? []).filter((a) => a.is_active !== false);
  const hasActivity =
    (wl?.class_count ?? 0) > 0 || activeAssignments.length > 0 || !!profile?.principal_class;

  return (
    <div className="teacher-dashboard">
      <header className="page-hero">
        <div>
          <h1>Portail enseignant</h1>
          <p>Bienvenue {profile?.user?.first_name} — vue d&apos;ensemble de votre activité.</p>
        </div>
        <div className="config-field" style={{ minWidth: 140 }}>
          <label htmlFor="td-year">Année</label>
          <input
            id="td-year"
            value={academicYear}
            onChange={(e) => setAcademicYear(e.target.value)}
            onBlur={() => loadData(academicYear)}
          />
        </div>
      </header>

      {loadError && (
        <div className="td-empty-banner">
          <p>{loadError}</p>
        </div>
      )}

      {!loadError && !hasActivity && (
        <div className="td-empty-banner">
          <p>
            Aucune classe ou matière ne vous est assignée pour l&apos;année scolaire{' '}
            <strong>{academicYear}</strong>.
          </p>
          <p>Contactez l&apos;administration (secrétariat ou direction).</p>
        </div>
      )}

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
        <Link to="/classes" className="btn btn-outline">Mes classes</Link>
      </div>

      <section className="td-section">
        <h2>Mes affectations</h2>
        {activeAssignments.length === 0 ? (
          <p className="empty-msg">Aucune matière assignée pour cette année.</p>
        ) : (
          <ul className="td-assignments">
            {activeAssignments.map((a) => (
              <li key={a.id}>
                <strong>{a.subject_name}</strong> — {a.class_name}
                {a.hours_per_week != null ? ` · ${a.hours_per_week} h/sem` : ''}
              </li>
            ))}
          </ul>
        )}
      </section>

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
            {sessions.slice(0, 5).map((s) => (
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
