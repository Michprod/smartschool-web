import React, { useEffect, useMemo, useState } from 'react';
import api from '@/core/api/client';
import Pagination from '@/core/Components/Pagination';
import Skeleton from '@/core/Components/Skeleton';
import './GradesPage.css';

type GradeRow = {
  id: number;
  initials: string;
  fullName: string;
  matricule: string;
  interro: number | null;
  devoir: number | null;
  examen: number | null;
};

type Option = { id: string; label: string };
type ClassAssignment = { class: { id: number; name: string }; subjects?: Array<{ subject: { id: number; name: string } }> };

const periods = ['1er Trimestre', '2eme Trimestre', '3eme Trimestre'];

type PageTab = 'saisie' | 'bulletin';

type BulletinRow = {
  student: { id: number; first_name: string; last_name: string; matricule?: string };
  general_average: number;
  rank_display: string | null;
  class_rank: number;
};

const getTotal = (row: GradeRow) => (row.interro ?? 0) + (row.devoir ?? 0) + (row.examen ?? 0);

const GradesPage: React.FC = () => {
  const [pageTab, setPageTab] = useState<PageTab>('saisie');
  const [loading, setLoading] = useState(true);
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('');
  const [selectedPeriod, setSelectedPeriod] = useState(periods[0]);
  const [rows, setRows] = useState<GradeRow[]>([]);
  const [classOptions, setClassOptions] = useState<Option[]>([]);
  const [subjectOptions, setSubjectOptions] = useState<Option[]>([]);
  const [classAssignments, setClassAssignments] = useState<ClassAssignment[]>([]);
  const [bulletinRows, setBulletinRows] = useState<BulletinRow[]>([]);
  const [bulletinStats, setBulletinStats] = useState<{ average?: number; count?: number }>({});
  const [bulletinTerm, setBulletinTerm] = useState('T1');
  const [bulletinLoading, setBulletinLoading] = useState(false);
  const [periodOptions, setPeriodOptions] = useState<Array<{ code: string; label: string }>>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    const loadInitial = async () => {
      try {
        setLoading(true);
        const [myClassesRes, subjectsRes] = await Promise.all([
          api.get('/api/grades/my-classes'),
          api.get('/api/subjects'),
        ]);

        const assignments: ClassAssignment[] = Array.isArray(myClassesRes.data)
          ? myClassesRes.data
          : myClassesRes.data?.data || [];
        const classes = assignments.map((item) => ({
          id: String(item.class.id),
          label: item.class.name,
        }));

        const fallbackSubjects: Option[] = (Array.isArray(subjectsRes.data) ? subjectsRes.data : subjectsRes.data?.data || []).map(
          (s: any) => ({ id: String(s.id), label: s.name })
        );

        setClassAssignments(assignments);
        setClassOptions(classes);
        setSubjectOptions(fallbackSubjects);
        if (classes.length > 0) {
          setSelectedClass(classes[0].id);
        }
      } catch (error) {
        console.error('Erreur chargement des notes:', error);
      } finally {
        setLoading(false);
      }
    };

    loadInitial();
  }, []);

  useEffect(() => {
    const loadStudents = async () => {
      if (!selectedClass) {
        setRows([]);
        return;
      }
      try {
        const response = await api.get(`/api/grades/classes/${selectedClass}/students`);
        const students = response.data?.students || response.data?.data || response.data || [];
        const mapped: GradeRow[] = students.map((student: any) => {
          const firstName = student.first_name || '';
          const lastName = student.last_name || '';
          return {
            id: Number(student.id),
            initials: `${firstName[0] ?? ''}${lastName[0] ?? ''}`.toUpperCase(),
            fullName: `${firstName} ${lastName}`.trim(),
            matricule: student.matricule || student.student_number || `${student.id}`,
            interro: null,
            devoir: null,
            examen: null,
          };
        });
        setRows(mapped);

        const assignment = classAssignments.find((item) => String(item.class.id) === selectedClass);
        if (assignment?.subjects?.length) {
          const options = assignment.subjects.map((item) => ({
            id: String(item.subject.id),
            label: item.subject.name,
          }));
          setSubjectOptions(options);
          if (options.length > 0) {
            setSelectedSubject(options[0].id);
          }
        }
      } catch (error) {
        console.error('Erreur chargement eleves classe:', error);
      }
    };

    loadStudents();
  }, [selectedClass, classAssignments]);

  useEffect(() => {
    const loadCatalog = async () => {
      if (!selectedClass) return;
      try {
        const res = await api.get('/api/grades/catalog', { params: { class_id: selectedClass } });
        const list = res.data?.periods || [];
        setPeriodOptions(list);
        if (list.length) setBulletinTerm(list[0].code);
      } catch {
        setPeriodOptions([
          { code: 'T1', label: '1er Trimestre' },
          { code: 'T2', label: '2ème Trimestre' },
          { code: 'T3', label: '3ème Trimestre' },
        ]);
      }
    };
    loadCatalog();
  }, [selectedClass]);

  useEffect(() => {
    const loadBulletin = async () => {
      if (pageTab !== 'bulletin' || !selectedClass) {
        return;
      }
      try {
        setBulletinLoading(true);
        const academicYear = `${new Date().getFullYear()}-${new Date().getFullYear() + 1}`;
        const res = await api.get(`/api/grades/classes/${selectedClass}/bulletin`, {
          params: { term: bulletinTerm, academic_year: academicYear },
        });
        setBulletinRows(res.data?.students || []);
        setBulletinStats(res.data?.statistics || {});
      } catch (error) {
        console.error('Erreur bulletin classe:', error);
        setBulletinRows([]);
      } finally {
        setBulletinLoading(false);
      }
    };
    loadBulletin();
  }, [pageTab, selectedClass, bulletinTerm]);

  useEffect(() => {
    setCurrentPage(1);
  }, [selectedClass, selectedSubject, selectedPeriod, rows.length]);

  const { average, completionRate, remainingStudents } = useMemo(() => {
    const totals = rows.map((row) => getTotal(row));
    const averageValue = totals.length > 0 ? totals.reduce((a, b) => a + b, 0) / totals.length : 0;
    const completed = rows.filter(
      (row) => row.interro !== null && row.devoir !== null && row.examen !== null
    ).length;
    const completion = rows.length > 0 ? (completed / rows.length) * 100 : 0;
    const remaining = rows.length - completed;

    return {
      average: averageValue,
      completionRate: completion,
      remainingStudents: remaining,
    };
  }, [rows]);

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const paginatedRows = rows.slice(indexOfFirstItem, indexOfLastItem);

  const updateScore = (id: number, field: 'interro' | 'devoir' | 'examen', value: string) => {
    const nextValue = value === '' ? null : Number(value);
    setRows((prev) =>
      prev.map((row) =>
        row.id === id
          ? {
              ...row,
              [field]: nextValue,
            }
          : row
      )
    );
  };

  const handleSaveAll = async () => {
    if (!selectedClass || !selectedSubject) {
      alert('Veuillez selectionner une classe et une matiere.');
      return;
    }

    try {
      const payload = {
        class_id: selectedClass,
        subject_id: selectedSubject,
        term: selectedPeriod.includes('1') ? 'T1' : selectedPeriod.includes('2') ? 'T2' : 'T3',
        academic_year: `${new Date().getFullYear()}-${new Date().getFullYear() + 1}`,
        type: 'devoir',
        max_score: 80,
        coefficient: 1,
        title: `Saisie en masse ${selectedPeriod}`,
        date: new Date().toISOString().slice(0, 10),
        grades: rows
          .filter((row) => row.interro !== null || row.devoir !== null || row.examen !== null)
          .map((row) => ({
            student_id: row.id,
            score: getTotal(row),
            comment: `Interro:${row.interro ?? 0}/10, Devoir:${row.devoir ?? 0}/20, Examen:${row.examen ?? 0}/50`,
          })),
      };
      await api.post('/api/grades/bulk', payload);
      alert('Notes enregistrees avec succes.');
    } catch (error) {
      console.error('Erreur sauvegarde notes:', error);
      alert("Erreur lors de l'enregistrement des notes.");
    }
  };

  if (loading) {
    return (
      <div className="grades-mock-page">
        <Skeleton className="skel-h-10" />
        <Skeleton className="skel-h-24" />
        <Skeleton className="skel-h-24" />
      </div>
    );
  }

  return (
    <div className="grades-mock-page">
      <div className="grades-breadcrumb">
        <span>Notes</span>
        <span className="material-symbols-outlined">chevron_right</span>
        <span>Gestion des Notes</span>
        <span className="material-symbols-outlined">chevron_right</span>
        <span className="active">Saisie en masse</span>
      </div>

      <div className="grades-header">
        <div>
          <h1>Notes & bulletins</h1>
          <p>Saisie des évaluations et consultation du classement par période.</p>
        </div>
        <div className="grades-header-actions">
          {pageTab === 'saisie' && (
            <>
              <button className="btn btn-outline">
                <span className="material-symbols-outlined">upload_file</span>
                Importer Excel
              </button>
              <button className="btn btn-primary" onClick={handleSaveAll}>
                <span className="material-symbols-outlined">save</span>
                Enregistrer tout
              </button>
            </>
          )}
        </div>
      </div>

      <div className="grades-page-tabs">
        <button type="button" className={pageTab === 'saisie' ? 'active' : ''} onClick={() => setPageTab('saisie')}>
          Saisie des notes
        </button>
        <button type="button" className={pageTab === 'bulletin' ? 'active' : ''} onClick={() => setPageTab('bulletin')}>
          Bulletin de classe
        </button>
      </div>

      {pageTab === 'bulletin' ? (
        <>
          <div className="grades-filters-card">
            <div className="filter-item">
              <label>Classe</label>
              <select value={selectedClass} onChange={(e) => setSelectedClass(e.target.value)}>
                {classOptions.map((value) => (
                  <option key={value.id} value={value.id}>{value.label}</option>
                ))}
              </select>
            </div>
            <div className="filter-item">
              <label>Période</label>
              <select value={bulletinTerm} onChange={(e) => setBulletinTerm(e.target.value)}>
                {(periodOptions.length ? periodOptions : [{ code: 'T1', label: 'T1' }]).map((p) => (
                  <option key={p.code} value={p.code}>{p.label}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="grades-table-card">
            {bulletinLoading ? (
              <Skeleton className="skel-h-24" />
            ) : (
              <div className="grades-table-scroll">
                <table>
                  <thead>
                    <tr>
                      <th>Rang</th>
                      <th>Élève</th>
                      <th className="center">Moyenne /20</th>
                      <th className="center">Position</th>
                    </tr>
                  </thead>
                  <tbody>
                    {bulletinRows.map((row) => (
                      <tr key={row.student.id}>
                        <td>{row.class_rank}</td>
                        <td>
                          {row.student.last_name} {row.student.first_name}
                          <small> — {row.student.matricule || row.student.id}</small>
                        </td>
                        <td className="center">{Number(row.general_average).toFixed(2)}</td>
                        <td className="center">{row.rank_display || '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {!bulletinRows.length && <p className="tab-empty">Aucun résultat calculé pour cette période.</p>}
              </div>
            )}
          </div>
          <div className="grades-summary">
            <div className="summary-card success">
              <h3>Moyenne de classe</h3>
              <p>{bulletinStats.average != null ? `${bulletinStats.average} / 20` : '—'}</p>
            </div>
            <div className="summary-card primary">
              <h3>Élèves classés</h3>
              <p>{bulletinStats.count ?? 0}</p>
            </div>
          </div>
        </>
      ) : (
        <>
      <div className="grades-filters-card">
        <div className="filter-item">
          <label>Classe</label>
          <select value={selectedClass} onChange={(e) => setSelectedClass(e.target.value)}>
            {classOptions.map((value) => (
              <option key={value.id} value={value.id}>
                {value.label}
              </option>
            ))}
          </select>
        </div>
        <div className="filter-item">
          <label>Matiere</label>
          <select value={selectedSubject} onChange={(e) => setSelectedSubject(e.target.value)}>
            {subjectOptions.map((value) => (
              <option key={value.id} value={value.id}>
                {value.label}
              </option>
            ))}
          </select>
        </div>
        <div className="filter-item">
          <label>Periode</label>
          <select value={selectedPeriod} onChange={(e) => setSelectedPeriod(e.target.value)}>
            {periods.map((value) => (
              <option key={value} value={value}>
                {value}
              </option>
            ))}
          </select>
        </div>
        <button className="btn btn-secondary full-btn">
          <span className="material-symbols-outlined">filter_list</span>
          Appliquer les filtres
        </button>
      </div>

      <div className="grades-table-card">
        <div className="grades-table-scroll">
          <table>
            <thead>
              <tr>
                <th>Élève</th>
                <th className="center">Interro (10)</th>
                <th className="center">Devoir (20)</th>
                <th className="center">Examen (50)</th>
                <th className="center">Total (80)</th>
                <th className="center">Statut</th>
              </tr>
            </thead>
            <tbody>
              {paginatedRows.map((row) => {
                const total = getTotal(row);
                const isComplete = row.interro !== null && row.devoir !== null && row.examen !== null;
                const status = !isComplete ? 'Non saisi' : total >= 40 ? 'Reussi' : 'Echec';

                return (
                  <tr key={row.id}>
                    <td>
                      <div className="student-cell">
                        <div className="avatar">{row.initials}</div>
                        <div>
                          <p>{row.fullName}</p>
                          <small>MAT: {row.matricule}</small>
                        </div>
                      </div>
                    </td>
                    <td className="center">
                      <input
                        type="number"
                        min={0}
                        max={10}
                        value={row.interro ?? ''}
                        onChange={(e) => updateScore(row.id, 'interro', e.target.value)}
                      />
                    </td>
                    <td className="center">
                      <input
                        type="number"
                        min={0}
                        max={20}
                        value={row.devoir ?? ''}
                        onChange={(e) => updateScore(row.id, 'devoir', e.target.value)}
                      />
                    </td>
                    <td className="center">
                      <input
                        type="number"
                        min={0}
                        max={50}
                        value={row.examen ?? ''}
                        onChange={(e) => updateScore(row.id, 'examen', e.target.value)}
                      />
                    </td>
                    <td className={`center total ${status === 'Echec' ? 'danger' : status === 'Reussi' ? 'ok' : ''}`}>
                      {total}
                    </td>
                    <td className="center">
                      <span
                        className={`badge ${
                          status === 'Reussi' ? 'success' : status === 'Echec' ? 'error' : 'neutral'
                        }`}
                      >
                        {status}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <Pagination
          currentPage={currentPage}
          totalItems={rows.length}
          itemsPerPage={itemsPerPage}
          onPageChange={setCurrentPage}
        />
      </div>

      <div className="grades-summary">
        <div className="summary-card success">
          <div className="summary-top">
            <span className="material-symbols-outlined">trending_up</span>
            <small>AUTO-CALCUL</small>
          </div>
          <h3>Moyenne de classe</h3>
          <p>{average.toFixed(1)} / 80</p>
        </div>
        <div className="summary-card primary">
          <div className="summary-top">
            <span className="material-symbols-outlined">check_circle</span>
            <small>STATUT</small>
          </div>
          <h3>Taux de saisie</h3>
          <p>{Math.round(completionRate)}%</p>
        </div>
        <div className="summary-card neutral">
          <div className="summary-top">
            <span className="material-symbols-outlined">group</span>
          </div>
          <h3>Eleves restants</h3>
          <p>{remainingStudents} eleve(s)</p>
        </div>
      </div>
        </>
      )}
    </div>
  );
};

export default GradesPage;




