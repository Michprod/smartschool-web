import React, { useCallback, useEffect, useMemo, useState } from 'react';
import api from '@/core/api/client';
import { useAuth } from '@/core/auth/AuthProvider';
import { fetchSchoolYear } from '@/core/utils/schoolYear';
import Pagination from '@/core/Components/Pagination';
import Skeleton from '@/core/Components/Skeleton';
import { downloadReportCardPdf } from '@/core/utils/reportCardPdf';
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
type ClassAssignment = {
  class: { id: number; name: string; display_name?: string };
  is_principal?: boolean;
  subjects?: Array<{ subject: { id: number; name: string } }>;
};

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
  report_card?: {
    decision?: string;
    decision_label?: string;
    is_published?: boolean;
  } | null;
};

const GradesPage: React.FC = () => {
  const { user } = useAuth();
  const [pageTab, setPageTab] = useState<PageTab>('sessions');
  const [loading, setLoading] = useState(true);
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('');
  const [selectedTerm, setSelectedTerm] = useState('T1');
  const [academicYear, setAcademicYear] = useState('2025-2026');
  const [rows, setRows] = useState<GradeRow[]>([]);
  const [classOptions, setClassOptions] = useState<Option[]>([]);
  const [subjectOptions, setSubjectOptions] = useState<Option[]>([]);
  const [classAssignments, setClassAssignments] = useState<ClassAssignment[]>([]);
  const [periodOptions, setPeriodOptions] = useState<Array<{ code: string; label: string }>>([]);
  const [assessmentTypes, setAssessmentTypes] = useState<Array<{ code: string; label: string }>>([]);
  const [sessions, setSessions] = useState<EvalSession[]>([]);
  const [classTermSessions, setClassTermSessions] = useState<EvalSession[]>([]);
  const [selectedSessionId, setSelectedSessionId] = useState<number | null>(null);
  const [sessionForm, setSessionForm] = useState({ title: '', type: 'interrogation', max_score: '10', date: new Date().toISOString().slice(0, 10) });
  const [bulletinRows, setBulletinRows] = useState<BulletinRow[]>([]);
  const [bulletinStats, setBulletinStats] = useState<{ average?: number; count?: number; min?: number; max?: number }>({});
  const [bulletinTerm, setBulletinTerm] = useState('T1');
  const [bulletinLoading, setBulletinLoading] = useState(false);
  const [finalizeLoading, setFinalizeLoading] = useState<'calculate' | 'generate' | 'publish' | null>(null);
  const [pdfDownloadingId, setPdfDownloadingId] = useState<number | null>(null);
  const [finalizeMessage, setFinalizeMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const isAdmin = user?.role === 'admin';
  const selectedAssignment = classAssignments.find((item) => String(item.class.id) === selectedClass);
  const canManageReportCards = isAdmin || !!selectedAssignment?.is_principal;

  useEffect(() => {
    const loadInitial = async () => {
      try {
        setLoading(true);
        const year = await fetchSchoolYear();
        setAcademicYear(year);
        const res = await api.get('/api/grades/my-classes', { params: { academic_year: year } });
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

  const loadClassTermSessions = useCallback(async () => {
    if (!selectedClass) return;
    const res = await api.get('/api/grades/evaluation-sessions', {
      params: { class_id: selectedClass, term: bulletinTerm, academic_year: academicYear, per_page: 200 },
    });
    const list = res.data?.data || res.data || [];
    setClassTermSessions(Array.isArray(list) ? list : []);
  }, [selectedClass, bulletinTerm, academicYear]);

  useEffect(() => {
    if (pageTab === 'sessions' || pageTab === 'saisie') loadSessions();
  }, [pageTab, selectedClass, selectedSubject, selectedTerm, academicYear]);

  useEffect(() => {
    if (pageTab === 'bulletin') loadClassTermSessions();
  }, [pageTab, loadClassTermSessions]);

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
    setRows(students.map((row: { student: { id: number; first_name?: string; last_name?: string; matricule?: string }; assessment?: { score?: number; comment?: string } }) => {
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

  const reloadBulletin = useCallback(async () => {
    if (!selectedClass) return;
    setBulletinLoading(true);
    setFinalizeMessage(null);
    try {
      const res = await api.get(`/api/grades/classes/${selectedClass}/bulletin`, {
        params: { term: bulletinTerm, academic_year: academicYear },
      });
      setBulletinRows(res.data?.students || []);
      setBulletinStats(res.data?.statistics || {});
    } finally {
      setBulletinLoading(false);
    }
  }, [selectedClass, bulletinTerm, academicYear]);

  useEffect(() => {
    if (pageTab === 'bulletin' && selectedClass) reloadBulletin();
  }, [pageTab, selectedClass, bulletinTerm, academicYear, reloadBulletin]);

  const unpublishedSessionsCount = useMemo(
    () => classTermSessions.filter((s) => !s.is_published).length,
    [classTermSessions]
  );

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
    setSessionForm({ title: '', type: 'interrogation', max_score: '10', date: new Date().toISOString().slice(0, 10) });
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

  const handleCalculateAverages = async () => {
    if (!selectedClass) return;
    setFinalizeLoading('calculate');
    setFinalizeMessage(null);
    try {
      await api.post(`/api/grades/classes/${selectedClass}/calculate`, {
        term: bulletinTerm,
        academic_year: academicYear,
      });
      setFinalizeMessage({ type: 'success', text: 'Moyennes calculées pour la classe.' });
      await reloadBulletin();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string; error?: string } } })?.response?.data?.message
        || (err as { response?: { data?: { error?: string } } })?.response?.data?.error;
      setFinalizeMessage({ type: 'error', text: msg || 'Calcul impossible.' });
    } finally {
      setFinalizeLoading(null);
    }
  };

  const handleGenerateReportCards = async () => {
    if (!selectedClass || !canManageReportCards) return;
    if (!window.confirm('Générer les bulletins pour tous les élèves ayant des moyennes ?')) return;
    setFinalizeLoading('generate');
    setFinalizeMessage(null);
    try {
      const res = await api.post(`/api/grades/classes/${selectedClass}/report-cards`, {
        term: bulletinTerm,
        academic_year: academicYear,
      });
      const count = res.data?.generated_count ?? 0;
      setFinalizeMessage({ type: 'success', text: `${count} bulletin(s) généré(s).` });
      await reloadBulletin();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error;
      setFinalizeMessage({ type: 'error', text: msg || 'Génération impossible.' });
    } finally {
      setFinalizeLoading(null);
    }
  };

  const handlePublishReportCards = async () => {
    if (!selectedClass || !canManageReportCards) return;
    if (!window.confirm('Publier les bulletins ? Ils seront visibles aux parents et sur les dossiers élèves.')) return;
    setFinalizeLoading('publish');
    setFinalizeMessage(null);
    try {
      const res = await api.post(`/api/grades/classes/${selectedClass}/report-cards/publish`, {
        term: bulletinTerm,
        academic_year: academicYear,
      });
      const count = res.data?.published_count ?? 0;
      setFinalizeMessage({ type: 'success', text: `${count} bulletin(s) publié(s).` });
      await reloadBulletin();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error;
      setFinalizeMessage({ type: 'error', text: msg || 'Publication impossible.' });
    } finally {
      setFinalizeLoading(null);
    }
  };

  const handleDownloadBulletinPdf = async (studentId: number) => {
    setPdfDownloadingId(studentId);
    try {
      await downloadReportCardPdf({
        studentId,
        term: bulletinTerm,
        academicYear,
      });
    } catch {
      alert('Impossible de télécharger le bulletin PDF.');
    } finally {
      setPdfDownloadingId(null);
    }
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
              {(assessmentTypes.length ? assessmentTypes : [{ code: 'interrogation', label: 'Interrogation' }, { code: 'devoir', label: 'Devoir' }, { code: 'examen', label: 'Examen' }]).map((t) => (
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

          <section className="bulletin-finalize-panel">
            <h3>Finaliser le trimestre</h3>
            <ol className="bulletin-steps">
              <li>
                Publier toutes les sessions d&apos;évaluation
                {unpublishedSessionsCount > 0 ? (
                  <span className="bulletin-warn">
                    {' '}— {unpublishedSessionsCount} session(s) non publiée(s).{' '}
                    <button type="button" className="link-btn" onClick={() => setPageTab('sessions')}>Voir sessions</button>
                  </span>
                ) : (
                  <span className="bulletin-ok"> — OK</span>
                )}
              </li>
              <li>Calculer les moyennes de la classe</li>
              <li>Générer les bulletins (titulaire ou admin)</li>
              <li>Publier les bulletins (visible parents / dossiers élèves)</li>
            </ol>
            <div className="bulletin-finalize-actions">
              <button
                type="button"
                className="btn btn-primary"
                disabled={finalizeLoading !== null}
                onClick={handleCalculateAverages}
              >
                {finalizeLoading === 'calculate' ? 'Calcul…' : 'Calculer les moyennes'}
              </button>
              <button
                type="button"
                className="btn btn-outline"
                disabled={!canManageReportCards || finalizeLoading !== null}
                title={!canManageReportCards ? 'Réservé au professeur titulaire ou à l\'administration' : undefined}
                onClick={handleGenerateReportCards}
              >
                {finalizeLoading === 'generate' ? 'Génération…' : 'Générer les bulletins'}
              </button>
              <button
                type="button"
                className="btn btn-outline"
                disabled={!canManageReportCards || finalizeLoading !== null}
                title={!canManageReportCards ? 'Réservé au professeur titulaire ou à l\'administration' : undefined}
                onClick={handlePublishReportCards}
              >
                {finalizeLoading === 'publish' ? 'Publication…' : 'Publier les bulletins'}
              </button>
            </div>
            {!canManageReportCards && (
              <p className="bulletin-hint">La génération et la publication des bulletins sont réservées au professeur titulaire ou à l&apos;administration.</p>
            )}
            {finalizeMessage && (
              <p className={finalizeMessage.type === 'success' ? 'bulletin-msg-success' : 'bulletin-msg-error'}>
                {finalizeMessage.text}
              </p>
            )}
          </section>

          {bulletinStats.count != null && bulletinStats.count > 0 && (
            <p className="bulletin-stats">
              Moyenne classe : <strong>{Number(bulletinStats.average).toFixed(2)}</strong>/20
              {' · '}{bulletinStats.count} élève(s) classé(s)
            </p>
          )}

          {bulletinLoading ? <Skeleton className="skel-h-24" /> : (
            <div className="grades-table-card">
              <table>
                <thead>
                  <tr>
                    <th>Rang</th>
                    <th>Élève</th>
                    <th className="center">Moyenne /20</th>
                    <th className="center">Position</th>
                    <th>Décision</th>
                    <th>Bulletin</th>
                    <th>PDF</th>
                  </tr>
                </thead>
                <tbody>
                  {bulletinRows.map((row) => (
                    <tr key={row.student.id}>
                      <td>{row.class_rank}</td>
                      <td>{row.student.last_name} {row.student.first_name}</td>
                      <td className="center">{Number(row.general_average).toFixed(2)}</td>
                      <td className="center">{row.rank_display || '—'}</td>
                      <td>{row.report_card?.decision_label || '—'}</td>
                      <td>
                        {!row.report_card ? '—' : row.report_card.is_published ? (
                          <span className="badge-published">Publié</span>
                        ) : (
                          <span className="badge-draft">Brouillon</span>
                        )}
                      </td>
                      <td>
                        {row.report_card ? (
                          <button
                            type="button"
                            className="btn btn-outline btn-sm btn-pdf"
                            disabled={pdfDownloadingId === row.student.id}
                            onClick={() => handleDownloadBulletinPdf(row.student.id)}
                          >
                            {pdfDownloadingId === row.student.id ? '…' : 'Télécharger'}
                          </button>
                        ) : (
                          '—'
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {!bulletinRows.length && (
                <p className="tab-empty">
                  Aucun résultat calculé. Publiez vos sessions puis cliquez sur « Calculer les moyennes ».
                </p>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default GradesPage;
