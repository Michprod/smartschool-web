import React, { useEffect, useMemo, useState } from 'react';
import api from '@/core/api/client';
import Pagination from '@/core/Components/Pagination';
import Skeleton from '@/core/Components/Skeleton';
import './GradesPage.css';

type GradeRow = {
  studentId: number;
  initials: string;
  fullName: string;
  matricule: string;
  score: number | null;
  comment: string;
};

type Option = { id: string; label: string };
type ClassAssignment = { class: { id: number; name: string; display_name?: string }; subjects?: Array<{ subject: { id: number; name: string } }> };

type EvalSession = {
  id: number;
  title: string;
  type: string;
  term: string;
  date: string;
  max_score: number;
  is_published: boolean;
};

type PageTab = 'sessions' | 'saisie' | 'bulletin';

type BulletinRow = {
  student: { id: number; first_name: string; last_name: string; matricule?: string };
  general_average: number;
  rank_display: string | null;
  class_rank: number;
};

const currentYear = () => `${new Date().getFullYear()}-${new Date().getFullYear() + 1}`;

const GradesPage: React.FC = () => {
  const [pageTab, setPageTab] = useState<PageTab>('sessions');
  const [loading, setLoading] = useState(true);
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('');
  const [selectedTerm, setSelectedTerm] = useState('T1');
  const [academicYear] = useState(currentYear());
  const [rows, setRows] = useState<GradeRow[]>([]);
  const [classOptions, setClassOptions] = useState<Option[]>([]);
  const [subjectOptions, setSubjectOptions] = useState<Option[]>([]);
  const [classAssignments, setClassAssignments] = useState<ClassAssignment[]>([]);
  const [periodOptions, setPeriodOptions] = useState<Array<{ code: string; label: string }>>([]);
  const [assessmentTypes, setAssessmentTypes] = useState<Array<{ code: string; label: string }>>([]);
  const [sessions, setSessions] = useState<EvalSession[]>([]);
  const [selectedSessionId, setSelectedSessionId] = useState<number | null>(null);
  const [sessionForm, setSessionForm] = useState({ title: '', type: 'interro', max_score: '10', date: new Date().toISOString().slice(0, 10) });
  const [bulletinRows, setBulletinRows] = useState<BulletinRow[]>([]);
  const [bulletinStats, setBulletinStats] = useState<{ average?: number; count?: number }>({});
  const [bulletinTerm, setBulletinTerm] = useState('T1');
  const [bulletinLoading, setBulletinLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    const loadInitial = async () => {
      try {
        setLoading(true);
        const res = await api.get('/api/grades/my-classes');
        const assignments: ClassAssignment[] = Array.isArray(res.data) ? res.data : res.data?.data || [];
        const classes = assignments.map((item) => ({
          id: String(item.class.id),
          label: item.class.display_name || item.class.name,
        }));
        setClassAssignments(assignments);
        setClassOptions(classes);
        if (classes.length > 0) setSelectedClass(classes[0].id);
      } finally {
        setLoading(false);
      }
    };
    loadInitial();
  }, []);

  useEffect(() => {
    const assignment = classAssignments.find((item) => String(item.class.id) === selectedClass);
    if (assignment?.subjects?.length) {
      const options = assignment.subjects.map((item) => ({ id: String(item.subject.id), label: item.subject.name }));
      setSubjectOptions(options);
      if (options.length) setSelectedSubject(options[0].id);
    }
  }, [selectedClass, classAssignments]);

  useEffect(() => {
    if (!selectedClass) return;
    api.get('/api/grades/catalog', { params: { class_id: selectedClass } }).then((res) => {
      const periods = res.data?.periods || [];
      setPeriodOptions(periods);
      setAssessmentTypes(res.data?.assessment_types || []);
      if (periods.length) {
        setSelectedTerm(periods[0].code);
        setBulletinTerm(periods[0].code);
      }
    });
  }, [selectedClass]);

  const loadSessions = async () => {
    if (!selectedClass || !selectedSubject) return;
    const res = await api.get('/api/grades/evaluation-sessions', {
      params: { class_id: selectedClass, subject_id: selectedSubject, term: selectedTerm, academic_year: academicYear },
    });
    const list = res.data?.data || res.data || [];
    setSessions(Array.isArray(list) ? list : []);
  };

  useEffect(() => {
    if (pageTab === 'sessions' || pageTab === 'saisie') loadSessions();
  }, [pageTab, selectedClass, selectedSubject, selectedTerm, academicYear]);

  const loadGrid = async (sessionId: number) => {
    const res = await api.get('/api/grades/grid', {
      params: {
        class_id: selectedClass,
        subject_id: selectedSubject,
        term: selectedTerm,
        academic_year: academicYear,
        evaluation_session_id: sessionId,
      },
    });
    const students = res.data?.students || [];
    setRows(students.map((row: any) => {
      const s = row.student;
      return {
        studentId: s.id,
        initials: `${s.first_name?.[0] || ''}${s.last_name?.[0] || ''}`.toUpperCase(),
        fullName: `${s.first_name} ${s.last_name}`,
        matricule: s.matricule || String(s.id),
        score: row.assessment?.score != null ? Number(row.assessment.score) : null,
        comment: row.assessment?.comment || '',
      };
    }));
  };

  useEffect(() => {
    if (pageTab === 'saisie' && selectedSessionId) loadGrid(selectedSessionId);
  }, [pageTab, selectedSessionId, selectedClass, selectedSubject, selectedTerm]);

  useEffect(() => {
    if (pageTab !== 'bulletin' || !selectedClass) return;
    setBulletinLoading(true);
    api.get(`/api/grades/classes/${selectedClass}/bulletin`, { params: { term: bulletinTerm, academic_year: academicYear } })
      .then((res) => {
        setBulletinRows(res.data?.students || []);
        setBulletinStats(res.data?.statistics || {});
      })
      .finally(() => setBulletinLoading(false));
  }, [pageTab, selectedClass, bulletinTerm, academicYear]);

  const handleCreateSession = async () => {
    const res = await api.post('/api/grades/evaluation-sessions', {
      class_id: Number(selectedClass),
      subject_id: Number(selectedSubject),
      type: sessionForm.type,
      term: selectedTerm,
      academic_year: academicYear,
      title: sessionForm.title,
      date: sessionForm.date,
      max_score: Number(sessionForm.max_score),
    });
    setSessionForm({ title: '', type: 'interro', max_score: '10', date: new Date().toISOString().slice(0, 10) });
    await loadSessions();
    if (res.data?.id) {
      setSelectedSessionId(res.data.id);
      setPageTab('saisie');
    }
  };

  const handleSaveGrades = async () => {
    if (!selectedSessionId) return;
    await api.post(`/api/grades/evaluation-sessions/${selectedSessionId}/grades`, {
      grades: rows.filter((r) => r.score !== null).map((r) => ({
        student_id: r.studentId,
        score: r.score,
        comment: r.comment || null,
      })),
    });
    alert('Notes enregistrées.');
    await loadGrid(selectedSessionId);
  };

  const handlePublishSession = async () => {
    if (!selectedSessionId) return;
    await api.post(`/api/grades/evaluation-sessions/${selectedSessionId}/publish`);
    await loadSessions();
    alert('Session publiée.');
  };

  const selectedSession = sessions.find((s) => s.id === selectedSessionId);
  const paginatedRows = rows.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
  const completionRate = useMemo(() => {
    if (!rows.length) return 0;
    return (rows.filter((r) => r.score !== null).length / rows.length) * 100;
  }, [rows]);

  if (loading) {
    return (
      <div className="grades-mock-page">
        <Skeleton className="skel-h-10" />
        <Skeleton className="skel-h-24" />
      </div>
    );
  }

  return (
    <div className="grades-mock-page">
      <div className="grades-header">
        <div>
          <h1>Notes & bulletins</h1>
          <p>Sessions d&apos;évaluation, saisie par type et bulletins.</p>
        </div>
      </div>

      <div className="grades-page-tabs">
        <button type="button" className={pageTab === 'sessions' ? 'active' : ''} onClick={() => setPageTab('sessions')}>Sessions</button>
        <button type="button" className={pageTab === 'saisie' ? 'active' : ''} onClick={() => setPageTab('saisie')}>Saisie</button>
        <button type="button" className={pageTab === 'bulletin' ? 'active' : ''} onClick={() => setPageTab('bulletin')}>Bulletin</button>
      </div>

      <div className="grades-filters-card">
        <div className="filter-item">
          <label>Classe</label>
          <select value={selectedClass} onChange={(e) => setSelectedClass(e.target.value)}>
            {classOptions.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}
          </select>
        </div>
        <div className="filter-item">
          <label>Matière</label>
          <select value={selectedSubject} onChange={(e) => setSelectedSubject(e.target.value)}>
            {subjectOptions.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
          </select>
        </div>
        <div className="filter-item">
          <label>Période</label>
          <select value={selectedTerm} onChange={(e) => setSelectedTerm(e.target.value)}>
            {(periodOptions.length ? periodOptions : [{ code: 'T1', label: 'T1' }]).map((p) => (
              <option key={p.code} value={p.code}>{p.label}</option>
            ))}
          </select>
        </div>
      </div>

      {pageTab === 'sessions' && (
        <>
          <div className="session-create-form">
            <input placeholder="Titre (ex: Interro ch.3)" value={sessionForm.title} onChange={(e) => setSessionForm({ ...sessionForm, title: e.target.value })} />
            <select value={sessionForm.type} onChange={(e) => setSessionForm({ ...sessionForm, type: e.target.value })}>
              {(assessmentTypes.length ? assessmentTypes : [{ code: 'interro', label: 'Interro' }, { code: 'devoir', label: 'Devoir' }, { code: 'examen', label: 'Examen' }]).map((t) => (
                <option key={t.code} value={t.code}>{t.label}</option>
              ))}
            </select>
            <input type="number" min={1} placeholder="Barème" value={sessionForm.max_score} onChange={(e) => setSessionForm({ ...sessionForm, max_score: e.target.value })} />
            <input type="date" value={sessionForm.date} onChange={(e) => setSessionForm({ ...sessionForm, date: e.target.value })} />
            <button type="button" className="btn btn-primary" onClick={handleCreateSession} disabled={!sessionForm.title}>Créer session</button>
          </div>
          <div className="grades-table-card">
            <table>
              <thead><tr><th>Titre</th><th>Type</th><th>Date</th><th>Barème</th><th>Publié</th><th></th></tr></thead>
              <tbody>
                {sessions.map((s) => (
                  <tr key={s.id}>
                    <td>{s.title}</td>
                    <td>{s.type}</td>
                    <td>{s.date}</td>
                    <td>{s.max_score}</td>
                    <td>{s.is_published ? 'Oui' : 'Non'}</td>
                    <td>
                      <button type="button" className="btn btn-outline btn-sm" onClick={() => { setSelectedSessionId(s.id); setPageTab('saisie'); }}>Saisir</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {sessions.length === 0 && <p className="tab-empty">Aucune session pour cette sélection.</p>}
          </div>
        </>
      )}

      {pageTab === 'saisie' && (
        <>
          <div className="filter-item" style={{ marginBottom: '1rem' }}>
            <label>Session</label>
            <select value={selectedSessionId ?? ''} onChange={(e) => setSelectedSessionId(Number(e.target.value))}>
              <option value="">Choisir une session</option>
              {sessions.map((s) => <option key={s.id} value={s.id}>{s.title} ({s.type})</option>)}
            </select>
          </div>
          {selectedSession && (
            <div className="grades-header-actions" style={{ marginBottom: '1rem' }}>
              <button type="button" className="btn btn-primary" onClick={handleSaveGrades}>Enregistrer</button>
              <button type="button" className="btn btn-outline" onClick={handlePublishSession}>Publier session</button>
            </div>
          )}
          {selectedSessionId ? (
            <div className="grades-table-card">
              <table>
                <thead>
                  <tr><th>Élève</th><th className="center">Note / {selectedSession?.max_score ?? '—'}</th><th>Commentaire</th></tr>
                </thead>
                <tbody>
                  {paginatedRows.map((row) => (
                    <tr key={row.studentId}>
                      <td>{row.fullName} <small>{row.matricule}</small></td>
                      <td className="center">
                        <input type="number" min={0} max={selectedSession?.max_score} value={row.score ?? ''}
                          onChange={(e) => setRows((prev) => prev.map((r) => r.studentId === row.studentId ? { ...r, score: e.target.value === '' ? null : Number(e.target.value) } : r))} />
                      </td>
                      <td>
                        <input value={row.comment} onChange={(e) => setRows((prev) => prev.map((r) => r.studentId === row.studentId ? { ...r, comment: e.target.value } : r))} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <Pagination currentPage={currentPage} totalItems={rows.length} itemsPerPage={itemsPerPage} onPageChange={setCurrentPage} />
              <div className="grades-summary">
                <div className="summary-card primary"><h3>Taux de saisie</h3><p>{Math.round(completionRate)}%</p></div>
              </div>
            </div>
          ) : (
            <p className="tab-empty">Sélectionnez une session pour saisir les notes.</p>
          )}
        </>
      )}

      {pageTab === 'bulletin' && (
        <>
          <div className="filter-item" style={{ marginBottom: '1rem' }}>
            <label>Période bulletin</label>
            <select value={bulletinTerm} onChange={(e) => setBulletinTerm(e.target.value)}>
              {(periodOptions.length ? periodOptions : [{ code: 'T1', label: 'T1' }]).map((p) => (
                <option key={p.code} value={p.code}>{p.label}</option>
              ))}
            </select>
          </div>
          {bulletinLoading ? <Skeleton className="skel-h-24" /> : (
            <div className="grades-table-card">
              <table>
                <thead><tr><th>Rang</th><th>Élève</th><th className="center">Moyenne /20</th><th className="center">Position</th></tr></thead>
                <tbody>
                  {bulletinRows.map((row) => (
                    <tr key={row.student.id}>
                      <td>{row.class_rank}</td>
                      <td>{row.student.last_name} {row.student.first_name}</td>
                      <td className="center">{Number(row.general_average).toFixed(2)}</td>
                      <td className="center">{row.rank_display || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {!bulletinRows.length && <p className="tab-empty">Aucun résultat calculé.</p>}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default GradesPage;
