import React, { useEffect, useState } from 'react';
import api from '@/core/api/client';
import { extractList, mapTeacherOptions } from '@/core/api/extractData';
import Can from '@/core/Components/Can';
import ScheduleEditorModal, { type ScheduleData } from './ScheduleEditorModal';
import './ClassSubjectsPanel.css';

type TeacherOption = { id: number; first_name: string; last_name: string };
type SubjectOption = { id: number; name: string; code?: string };

type ClassSubjectRow = {
  id: number;
  subject_id: number;
  teacher_id: number;
  coefficient: number;
  hours_per_week: number;
  academic_year: string;
  is_active: boolean;
  schedule?: ScheduleData | null;
  subject?: { id: number; name: string; code?: string };
  teacher?: { id: number; first_name: string; last_name: string };
};

interface Props {
  classId: string;
  className: string;
  academicYear: string;
  onClose: () => void;
}

const ClassSubjectsPanel: React.FC<Props> = ({ classId, className, academicYear, onClose }) => {
  const [rows, setRows] = useState<ClassSubjectRow[]>([]);
  const [teachers, setTeachers] = useState<TeacherOption[]>([]);
  const [subjects, setSubjects] = useState<SubjectOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [scheduleRow, setScheduleRow] = useState<ClassSubjectRow | null>(null);
  const [form, setForm] = useState({
    subject_id: '',
    teacher_id: '',
    coefficient: '1',
    hours_per_week: '2',
    academic_year: academicYear,
  });

  const load = async () => {
    setLoading(true);
    try {
      const [subjectsRes, teachersRes, assignRes] = await Promise.all([
        api.get(`/api/classes/${classId}/available-subjects`),
        api.get('/api/teachers', { params: { per_page: 100, is_active: 1 } }),
        api.get(`/api/classes/${classId}/subjects`),
      ]);
      setSubjects(extractList<SubjectOption>(subjectsRes));
      setTeachers(mapTeacherOptions(teachersRes));
      setRows(extractList<ClassSubjectRow>(assignRes));
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [classId]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    await api.post(`/api/classes/${classId}/subjects`, {
      subject_id: Number(form.subject_id),
      teacher_id: Number(form.teacher_id),
      coefficient: Number(form.coefficient),
      hours_per_week: Number(form.hours_per_week),
      academic_year: form.academic_year,
    });
    setShowForm(false);
    await load();
  };

  const handleToggle = async (row: ClassSubjectRow) => {
    await api.put(`/api/class-subjects/${row.id}`, { is_active: !row.is_active });
    await load();
  };

  const handleDelete = async (row: ClassSubjectRow) => {
    if (!window.confirm('Retirer cette affectation ?')) return;
    await api.delete(`/api/class-subjects/${row.id}`);
    await load();
  };

  return (
    <div className="class-subjects-panel">
      <header className="csp-header">
        <div>
          <button type="button" className="view-back-btn" onClick={onClose}>
            <span className="material-symbols-outlined">arrow_back</span>
          </button>
          <h2>Matières & profs — {className}</h2>
        </div>
        <Can permission="classes:write">
          <button type="button" className="btn btn-primary" onClick={() => setShowForm(true)}>
            <span className="material-symbols-outlined">add</span>
            Affecter une matière
          </button>
        </Can>
      </header>

      {showForm && (
        <form className="csp-form" onSubmit={handleCreate}>
          <select required value={form.subject_id} onChange={(e) => setForm({ ...form, subject_id: e.target.value })}>
            <option value="">Matière</option>
            {subjects.map((s) => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
          <select required value={form.teacher_id} onChange={(e) => setForm({ ...form, teacher_id: e.target.value })}>
            <option value="">Enseignant</option>
            {teachers.map((t) => (
              <option key={t.id} value={t.id}>{t.first_name} {t.last_name}</option>
            ))}
          </select>
          <input type="number" min={1} max={20} value={form.coefficient} onChange={(e) => setForm({ ...form, coefficient: e.target.value })} placeholder="Coef" />
          <input type="number" min={1} max={40} value={form.hours_per_week} onChange={(e) => setForm({ ...form, hours_per_week: e.target.value })} placeholder="h/sem" />
          <input value={form.academic_year} onChange={(e) => setForm({ ...form, academic_year: e.target.value })} placeholder="Année" />
          <button type="submit" className="btn btn-primary">Enregistrer</button>
          <button type="button" className="btn btn-outline" onClick={() => setShowForm(false)}>Annuler</button>
        </form>
      )}

      {loading ? (
        <p>Chargement…</p>
      ) : (
        <table className="data-table">
          <thead>
            <tr>
              <th>Matière</th>
              <th>Professeur</th>
              <th>Coef</th>
              <th>h/sem</th>
              <th>Année</th>
              <th>Actif</th>
              <Can permission="classes:write"><th>Actions</th></Can>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id}>
                <td>{row.subject?.name || row.subject_id}</td>
                <td>{row.teacher ? `${row.teacher.first_name} ${row.teacher.last_name}` : '—'}</td>
                <td>{row.coefficient}</td>
                <td>{row.hours_per_week}</td>
                <td>{row.academic_year}</td>
                <td>{row.is_active ? 'Oui' : 'Non'}</td>
                <Can permission="classes:write">
                  <td className="actions-cell">
                    <button
                      type="button"
                      className="btn-icon"
                      onClick={() => setScheduleRow(row)}
                      title="Planifier"
                    >
                      <span className="material-symbols-outlined">schedule</span>
                    </button>
                    <button type="button" className="btn-icon" onClick={() => handleToggle(row)} title="Activer/Désactiver">
                      <span className="material-symbols-outlined">toggle_on</span>
                    </button>
                    <button type="button" className="btn-icon danger" onClick={() => handleDelete(row)} title="Retirer">
                      <span className="material-symbols-outlined">delete</span>
                    </button>
                  </td>
                </Can>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      {!loading && rows.length === 0 && <p className="empty-msg">Aucune affectation pour cette classe.</p>}

      {scheduleRow && (
        <ScheduleEditorModal
          assignmentId={scheduleRow.id}
          label={`${scheduleRow.subject?.name || 'Matière'} — ${className}`}
          initialSchedule={scheduleRow.schedule}
          onClose={() => setScheduleRow(null)}
          onSaved={load}
        />
      )}
    </div>
  );
};

export default ClassSubjectsPanel;
