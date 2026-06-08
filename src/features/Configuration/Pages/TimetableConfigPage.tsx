import React, { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '@/core/api/client';
import { extractList } from '@/core/api/extractData';
import { fetchSchoolYear } from '@/core/utils/schoolYear';
import TimetableGrid, { type TimetableSlot } from '@/features/Teachers/Components/TimetableGrid';
import '../Configuration.css';

type ClassOption = { id: number; display_name: string; academic_year?: string };

type Conflict = {
  type: string;
  day: string;
  start: string;
  end: string;
  details?: Array<{ class_name?: string; subject_name?: string; teacher_name?: string }>;
};

const CONFLICT_LABELS: Record<string, string> = {
  teacher_overlap: 'Professeur en double',
  room_overlap: 'Salle en double',
  class_overlap: 'Classe en double',
};

const TimetableConfigPage: React.FC = () => {
  const [academicYear, setAcademicYear] = useState('2025-2026');
  const [classes, setClasses] = useState<ClassOption[]>([]);
  const [selectedClass, setSelectedClass] = useState('');
  const [slots, setSlots] = useState<TimetableSlot[]>([]);
  const [conflicts, setConflicts] = useState<Conflict[]>([]);
  const [loading, setLoading] = useState(true);

  const loadRefs = useCallback(async () => {
    const classesRes = await api.get('/api/classes', { params: { per_page: 200 } });
    setClasses(
      extractList<{ id: number; display_name?: string; name?: string; academic_year?: string }>(classesRes).map((c) => ({
        id: c.id,
        display_name: c.display_name || c.name || String(c.id),
        academic_year: c.academic_year,
      }))
    );
  }, []);

  const loadTimetable = useCallback(async (classId: string, year: string) => {
    if (!classId) {
      setSlots([]);
      return;
    }
    const res = await api.get(`/api/classes/${classId}/timetable`, { params: { academic_year: year } });
    setSlots(res.data?.slots || []);
  }, []);

  const loadConflicts = useCallback(async (year: string) => {
    const res = await api.get('/api/timetable/conflicts', { params: { academic_year: year } });
    setConflicts(res.data?.conflicts || []);
  }, []);

  useEffect(() => {
    fetchSchoolYear().then((year) => {
      setAcademicYear(year);
      setLoading(true);
      Promise.all([loadRefs(), loadConflicts(year)]).finally(() => setLoading(false));
    });
  }, [loadRefs, loadConflicts]);

  useEffect(() => {
    if (selectedClass && academicYear) {
      loadTimetable(selectedClass, academicYear);
    }
  }, [selectedClass, academicYear, loadTimetable]);

  const classesForYear = classes.filter((c) => !c.academic_year || c.academic_year === academicYear);

  const refreshAll = () => {
    loadConflicts(academicYear);
    if (selectedClass) loadTimetable(selectedClass, academicYear);
  };

  return (
    <div className="config-page">
      <header className="page-hero" style={{ marginBottom: '1rem' }}>
        <div>
          <Link to="/configuration">← Configuration</Link>
          <h1>Emploi du temps</h1>
          <p>Vue par classe et détection des conflits (professeur, salle, classe).</p>
        </div>
        <Link to="/configuration/affectations" className="btn btn-outline">
          Gérer les affectations
        </Link>
      </header>

      <div className="config-panel" style={{ marginBottom: '1rem', display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
        <div className="config-field">
          <label>Année</label>
          <input
            value={academicYear}
            onChange={(e) => setAcademicYear(e.target.value)}
            onBlur={refreshAll}
          />
        </div>
        <div className="config-field">
          <label>Classe</label>
          <select value={selectedClass} onChange={(e) => setSelectedClass(e.target.value)}>
            <option value="">— Choisir une classe —</option>
            {classesForYear.map((c) => (
              <option key={c.id} value={c.id}>{c.display_name}</option>
            ))}
          </select>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: '1rem', alignItems: 'start' }}>
        <section className="config-panel">
          <h2 style={{ marginTop: 0 }}>Grille horaire</h2>
          {loading ? (
            <p>Chargement…</p>
          ) : !selectedClass ? (
            <p className="empty-msg">Sélectionnez une classe pour afficher son emploi du temps.</p>
          ) : (
            <TimetableGrid slots={slots} />
          )}
        </section>

        <aside className="config-panel">
          <h2 style={{ marginTop: 0 }}>Conflits détectés</h2>
          {conflicts.length === 0 ? (
            <p className="empty-msg" style={{ color: '#16a34a' }}>Aucun conflit pour cette année.</p>
          ) : (
            <ul style={{ margin: 0, paddingLeft: '1.25rem', fontSize: '0.875rem' }}>
              {conflicts.map((c, i) => (
                <li key={i} style={{ marginBottom: '0.75rem' }}>
                  <strong>{CONFLICT_LABELS[c.type] || c.type}</strong>
                  <br />
                  {c.day} {c.start}–{c.end}
                  {c.details?.map((d, j) => (
                    <span key={j}>
                      <br />
                      · {d.subject_name} — {d.class_name}
                      {d.teacher_name ? ` (${d.teacher_name})` : ''}
                    </span>
                  ))}
                </li>
              ))}
            </ul>
          )}
        </aside>
      </div>
    </div>
  );
};

export default TimetableConfigPage;
