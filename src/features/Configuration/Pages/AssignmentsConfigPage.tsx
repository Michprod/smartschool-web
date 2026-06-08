import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '@/core/api/client';
import { extractList, mapTeacherOptions, type TeacherOption } from '@/core/api/extractData';
import Can from '@/core/Components/Can';
import ScheduleEditorModal, { type ScheduleData } from '@/features/Classes/Components/ScheduleEditorModal';
import { fetchSchoolYear } from '@/core/utils/schoolYear';
import '../Configuration.css';

type AssignmentRow = {
  id: number;
  class_id: number;
  subject_id: number;
  teacher_id: number;
  coefficient: number;
  hours_per_week: number;
  academic_year: string;
  is_active: boolean;
  schedule?: ScheduleData | null;
  subject?: { id: number; name: string; code?: string };
  teacher?: { id: number; first_name: string; last_name: string };
  school_class?: { id: number; display_name: string };
};

type ClassOption = { id: number; display_name: string; academic_year?: string };
type SubjectOption = { id: number; name: string; code?: string };

const AssignmentsConfigPage: React.FC = () => {
  const [rows, setRows] = useState<AssignmentRow[]>([]);
  const [teachers, setTeachers] = useState<TeacherOption[]>([]);
  const [classes, setClasses] = useState<ClassOption[]>([]);
  const [formSubjects, setFormSubjects] = useState<SubjectOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [refsError, setRefsError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [filterYear, setFilterYear] = useState('2025-2026');
  const [filterTeacher, setFilterTeacher] = useState('');
  const [filterClass, setFilterClass] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [scheduleRow, setScheduleRow] = useState<AssignmentRow | null>(null);
  const [form, setForm] = useState({
    class_id: '',
    subject_id: '',
    teacher_id: '',
    coefficient: '3',
    hours_per_week: '4',
    academic_year: '2025-2026',
  });

  const loadRefs = useCallback(async () => {
    setRefsError(null);
    try {
      const [teachersRes, classesRes] = await Promise.all([
        api.get('/api/teachers', { params: { per_page: 100, is_active: 1 } }),
        api.get('/api/classes', { params: { per_page: 200 } }),
      ]);
      setTeachers(mapTeacherOptions(teachersRes));
      setClasses(
        extractList<{ id: number; display_name?: string; name?: string; academic_year?: string }>(classesRes).map((c) => ({
          id: c.id,
          display_name: c.display_name || c.name || String(c.id),
          academic_year: c.academic_year,
        }))
      );
    } catch {
      setRefsError('Impossible de charger les classes ou les enseignants. Vérifiez votre connexion et relancez le seed bootstrap.');
      setTeachers([]);
      setClasses([]);
    }
  }, []);

  const loadFormSubjects = useCallback(async (classId: string) => {
    if (!classId) {
      setFormSubjects([]);
      return;
    }
    try {
      const res = await api.get(`/api/classes/${classId}/available-subjects`);
      setFormSubjects(extractList<SubjectOption>(res));
    } catch {
      setFormSubjects([]);
    }
  }, []);

  const loadAssignments = async () => {
    setLoading(true);
    try {
      const params: Record<string, string | number> = { per_page: 200, academic_year: filterYear };
      if (filterTeacher) params.teacher_id = filterTeacher;
      if (filterClass) params.class_id = filterClass;
      const res = await api.get('/api/class-subjects', { params });
      setRows(extractList<AssignmentRow>(res));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSchoolYear().then((year) => {
      setFilterYear(year);
      setForm((f) => ({ ...f, academic_year: year }));
    });
    loadRefs();
  }, [loadRefs]);

  useEffect(() => {
    if (filterYear) loadAssignments();
  }, [filterYear, filterTeacher, filterClass]);

  useEffect(() => {
    loadFormSubjects(form.class_id);
    setForm((f) => ({ ...f, subject_id: '' }));
  }, [form.class_id, loadFormSubjects]);

  const classesForYear = useMemo(
    () => classes.filter((c) => !c.academic_year || c.academic_year === filterYear),
    [classes, filterYear]
  );

  const filteredCount = useMemo(() => rows.length, [rows]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    try {
      await api.post(`/api/classes/${form.class_id}/subjects`, {
        subject_id: Number(form.subject_id),
        teacher_id: Number(form.teacher_id),
        coefficient: Number(form.coefficient),
        hours_per_week: Number(form.hours_per_week),
        academic_year: form.academic_year,
      });
      setShowForm(false);
      await loadAssignments();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setFormError(msg || 'Enregistrement impossible.');
    }
  };

  const handleToggle = async (row: AssignmentRow) => {
    await api.put(`/api/class-subjects/${row.id}`, { is_active: !row.is_active });
    await loadAssignments();
  };

  const handleDelete = async (row: AssignmentRow) => {
    if (!window.confirm('Retirer cette affectation ?')) return;
    await api.delete(`/api/class-subjects/${row.id}`);
    await loadAssignments();
  };

  return (
    <div className="config-page">
      <header className="page-hero" style={{ marginBottom: '1rem' }}>
        <div>
          <Link to="/configuration">← Configuration</Link>
          <h1>Affectations enseignants</h1>
          <p>Professeur ↔ classe ↔ matière pour l&apos;année scolaire.</p>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          <Link to="/classes" className="btn btn-outline">Gérer classe par classe</Link>
          <Can permission="classes:write">
            <button type="button" className="btn btn-primary" onClick={() => setShowForm((v) => !v)}>
              {showForm ? 'Fermer' : 'Nouvelle affectation'}
            </button>
          </Can>
        </div>
      </header>

      {refsError && (
        <p className="empty-msg" style={{ color: '#b91c1c', marginBottom: '1rem' }}>{refsError}</p>
      )}

      <div className="config-panel" style={{ marginBottom: '1rem', display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
        <div className="config-field">
          <label>Année</label>
          <input value={filterYear} onChange={(e) => setFilterYear(e.target.value)} />
        </div>
        <div className="config-field">
          <label>Professeur</label>
          <select value={filterTeacher} onChange={(e) => setFilterTeacher(e.target.value)}>
            <option value="">Tous</option>
            {teachers.map((t) => (
              <option key={t.id} value={t.id}>{t.last_name} {t.first_name}</option>
            ))}
          </select>
        </div>
        <div className="config-field">
          <label>Classe</label>
          <select value={filterClass} onChange={(e) => setFilterClass(e.target.value)}>
            <option value="">Toutes</option>
            {classesForYear.map((c) => (
              <option key={c.id} value={c.id}>{c.display_name}</option>
            ))}
          </select>
        </div>
      </div>

      {showForm && (
        <form className="config-panel config-form-grid" onSubmit={handleCreate} style={{ marginBottom: '1rem' }}>
          {formError && <p style={{ gridColumn: '1 / -1', color: '#b91c1c', margin: 0 }}>{formError}</p>}
          <div className="config-field">
            <label>Classe</label>
            <select
              required
              value={form.class_id}
              onChange={(e) => setForm({ ...form, class_id: e.target.value, subject_id: '' })}
            >
              <option value="">—</option>
              {classesForYear.map((c) => (
                <option key={c.id} value={c.id}>{c.display_name}</option>
              ))}
            </select>
          </div>
          <div className="config-field">
            <label>Matière</label>
            <select
              required
              value={form.subject_id}
              disabled={!form.class_id}
              onChange={(e) => setForm({ ...form, subject_id: e.target.value })}
            >
              <option value="">{form.class_id ? '—' : 'Choisir une classe d\'abord'}</option>
              {formSubjects.map((s) => (
                <option key={s.id} value={s.id}>{s.name}{s.code ? ` (${s.code})` : ''}</option>
              ))}
            </select>
            {form.class_id && formSubjects.length === 0 && (
              <small style={{ color: '#64748b' }}>Aucune matière pour ce cycle / option.</small>
            )}
          </div>
          <div className="config-field">
            <label>Professeur</label>
            <select required value={form.teacher_id} onChange={(e) => setForm({ ...form, teacher_id: e.target.value })}>
              <option value="">—</option>
              {teachers.map((t) => (
                <option key={t.id} value={t.id}>{t.last_name} {t.first_name}</option>
              ))}
            </select>
          </div>
          <div className="config-field">
            <label>Année</label>
            <input required value={form.academic_year} onChange={(e) => setForm({ ...form, academic_year: e.target.value })} />
          </div>
          <div className="config-field">
            <label>Coef.</label>
            <input type="number" min={1} value={form.coefficient} onChange={(e) => setForm({ ...form, coefficient: e.target.value })} />
          </div>
          <div className="config-field">
            <label>h/sem</label>
            <input type="number" min={1} value={form.hours_per_week} onChange={(e) => setForm({ ...form, hours_per_week: e.target.value })} />
          </div>
          <button type="submit" className="btn btn-primary">Enregistrer</button>
        </form>
      )}

      <section className="config-panel">
        {loading ? (
          <p>Chargement…</p>
        ) : (
          <>
            <p style={{ marginTop: 0, color: '#64748b' }}>{filteredCount} affectation(s)</p>
            <table className="config-table">
              <thead>
                <tr>
                  <th>Professeur</th>
                  <th>Classe</th>
                  <th>Matière</th>
                  <th>Année</th>
                  <th>h/sem</th>
                  <th>Actif</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.id}>
                    <td>{row.teacher ? `${row.teacher.last_name} ${row.teacher.first_name}` : row.teacher_id}</td>
                    <td>{row.school_class?.display_name || row.class_id}</td>
                    <td>{row.subject?.name || row.subject_id}</td>
                    <td>{row.academic_year}</td>
                    <td>{row.hours_per_week}</td>
                    <td>{row.is_active ? 'Oui' : 'Non'}</td>
                    <td>
                      <Can permission="classes:write">
                        <button type="button" className="btn btn-outline btn-sm" onClick={() => setScheduleRow(row)}>
                          Planifier
                        </button>
                        <button type="button" className="btn btn-outline btn-sm" onClick={() => handleToggle(row)}>
                          {row.is_active ? 'Désactiver' : 'Activer'}
                        </button>
                        <button type="button" className="btn btn-outline btn-sm" onClick={() => handleDelete(row)} style={{ marginLeft: 4 }}>
                          Retirer
                        </button>
                      </Can>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {rows.length === 0 && (
              <p className="empty-msg">
                Aucune affectation pour ces filtres. Utilisez « Nouvelle affectation » ou relancez{' '}
                <code>php artisan migrate:fresh --seed --seeder=ProductionBootstrapSeeder</code>.
              </p>
            )}
          </>
        )}
      </section>

      {scheduleRow && (
        <ScheduleEditorModal
          assignmentId={scheduleRow.id}
          label={`${scheduleRow.subject?.name || 'Matière'} — ${scheduleRow.school_class?.display_name || scheduleRow.class_id}`}
          initialSchedule={scheduleRow.schedule}
          onClose={() => setScheduleRow(null)}
          onSaved={loadAssignments}
        />
      )}
    </div>
  );
};

export default AssignmentsConfigPage;
