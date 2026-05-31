import React, { useEffect, useMemo, useState } from 'react';
import api from '@/core/api/client';
import { extractList } from '@/core/api/extractData';
import Can from '@/core/Components/Can';
import Skeleton from '@/core/Components/Skeleton';
import Pagination from '@/core/Components/Pagination';
import ClassForm from '../Components/ClassForm';
import ClassSubjectsPanel from '../Components/ClassSubjectsPanel';
import type { ClassFormData, EducationCycle, SchoolClassItem } from '../types';
import './ClassManagement.css';

const mapClass = (c: Record<string, unknown>): SchoolClassItem => ({
  id: String(c.id),
  name: String(c.name || c.display_name || ''),
  display_name: String(c.display_name || c.name || ''),
  level: String(c.level || ''),
  section: String(c.section || 'A'),
  academic_year: String(c.academic_year || ''),
  capacity: Number(c.capacity || 0),
  teacher_id: c.teacher_id as number | null,
  grade_level_id: Number(c.grade_level_id),
  study_option_id: c.study_option_id as number | null,
  students_count: Number(c.students_count || 0),
  grade_level: c.grade_level as SchoolClassItem['grade_level'],
  study_option: c.study_option as SchoolClassItem['study_option'],
  teacher: c.teacher as SchoolClassItem['teacher'],
});

const ClassManagement: React.FC = () => {
  const [classes, setClasses] = useState<SchoolClassItem[]>([]);
  const [cycles, setCycles] = useState<EducationCycle[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterCycle, setFilterCycle] = useState('all');
  const [filterYear, setFilterYear] = useState('all');
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<ClassFormData | undefined>();
  const [subjectsClass, setSubjectsClass] = useState<SchoolClassItem | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const loadData = async () => {
    setLoading(true);
    try {
      const [classesRes, catalogRes] = await Promise.all([
        api.get('/api/classes', { params: { per_page: 200 } }),
        api.get('/api/classes/catalog'),
      ]);
      setClasses(extractList<Record<string, unknown>>(classesRes).map(mapClass));
      setCycles(catalogRes.data?.cycles || []);
    } catch (e) {
      console.error('Erreur chargement classes:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [search, filterCycle, filterYear]);

  const years = useMemo(() => {
    const set = new Set(classes.map((c) => c.academic_year).filter(Boolean));
    return Array.from(set).sort();
  }, [classes]);

  const filtered = useMemo(() => classes.filter((c) => {
    const matchSearch = c.display_name.toLowerCase().includes(search.toLowerCase());
    const matchCycle = filterCycle === 'all' || c.grade_level?.education_cycle?.code === filterCycle;
    const matchYear = filterYear === 'all' || c.academic_year === filterYear;
    return matchSearch && matchCycle && matchYear;
  }), [classes, search, filterCycle, filterYear]);

  const paginated = filtered.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const handleSubmit = async (data: ClassFormData) => {
    const payload = {
      grade_level_id: Number(data.grade_level_id),
      study_option_id: data.study_option_id ? Number(data.study_option_id) : null,
      section: data.section,
      academic_year: data.academic_year,
      capacity: data.capacity,
      teacher_id: data.teacher_id ? Number(data.teacher_id) : null,
    };

    if (editing?.id) {
      await api.put(`/api/classes/${editing.id}`, payload);
    } else {
      await api.post('/api/classes', payload);
    }

    setShowForm(false);
    setEditing(undefined);
    await loadData();
  };

  const handleEdit = (item: SchoolClassItem) => {
    setEditing({
      id: item.id,
      grade_level_id: String(item.grade_level_id),
      study_option_id: item.study_option_id ? String(item.study_option_id) : '',
      section: item.section,
      academic_year: item.academic_year,
      capacity: item.capacity,
      teacher_id: item.teacher_id ? String(item.teacher_id) : '',
    });
    setShowForm(true);
  };

  const handleDelete = async (item: SchoolClassItem) => {
    if (!window.confirm(`Supprimer la classe ${item.display_name} ?`)) return;
    try {
      await api.delete(`/api/classes/${item.id}`);
      await loadData();
    } catch (e: unknown) {
      const err = e as { response?: { data?: { message?: string } } };
      alert(err.response?.data?.message || 'Suppression impossible.');
    }
  };

  if (subjectsClass) {
    return (
      <div className="class-management class-full-page">
        <ClassSubjectsPanel
          classId={subjectsClass.id}
          className={subjectsClass.display_name}
          academicYear={subjectsClass.academic_year}
          onClose={() => setSubjectsClass(null)}
        />
      </div>
    );
  }

  if (showForm) {
    return (
      <div className="class-management class-full-page">
        <header className="page-hero">
          <button type="button" className="view-back-btn" onClick={() => { setShowForm(false); setEditing(undefined); }}>
            <span className="material-symbols-outlined">arrow_back</span>
            Retour
          </button>
          <h1>{editing ? 'Modifier la classe' : 'Nouvelle classe'}</h1>
        </header>
        <div className="form-panel">
          <ClassForm
            initialData={editing}
            onSubmit={handleSubmit}
            onCancel={() => { setShowForm(false); setEditing(undefined); }}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="class-management">
      <header className="page-hero">
        <div>
          <h1>Gestion des classes</h1>
          <p>Salles et groupes selon le système scolaire RDC (cycles, niveaux, options Humanités)</p>
        </div>
        <Can permission="classes:write">
          <button type="button" className="btn btn-primary" onClick={() => { setEditing(undefined); setShowForm(true); }}>
            <span className="material-symbols-outlined">add</span>
            Nouvelle classe
          </button>
        </Can>
      </header>

      <div className="filters-bar">
        <input
          type="search"
          placeholder="Rechercher une classe..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select value={filterCycle} onChange={(e) => setFilterCycle(e.target.value)}>
          <option value="all">Tous les cycles</option>
          {cycles.map((c) => (
            <option key={c.code} value={c.code}>{c.name}</option>
          ))}
        </select>
        <select value={filterYear} onChange={(e) => setFilterYear(e.target.value)}>
          <option value="all">Toutes les années</option>
          {years.map((y) => (
            <option key={y} value={y}>{y}</option>
          ))}
        </select>
      </div>

      {loading ? (
        <div className="skeleton-stack">
          <Skeleton className="skel-h-10" />
          <Skeleton className="skel-h-24" />
          <Skeleton className="skel-h-24" />
        </div>
      ) : (
        <>
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Classe</th>
                  <th>Cycle</th>
                  <th>Année</th>
                  <th>Effectif</th>
                  <th>Capacité</th>
                  <th>Titulaire</th>
                  <th className="actions-cell">Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginated.map((c) => (
                  <tr key={c.id}>
                    <td><strong>{c.display_name}</strong></td>
                    <td>{c.grade_level?.education_cycle?.name || c.level}</td>
                    <td>{c.academic_year}</td>
                    <td>{c.students_count ?? 0}</td>
                    <td>{c.capacity}</td>
                    <td>{c.teacher ? `${c.teacher.first_name} ${c.teacher.last_name}` : '—'}</td>
                    <td className="actions-cell">
                      <button type="button" className="btn-icon" onClick={() => setSubjectsClass(c)} title="Matières & profs">
                        <span className="material-symbols-outlined">menu_book</span>
                      </button>
                      <Can permission="classes:write">
                        <button type="button" className="btn-icon" onClick={() => handleEdit(c)} title="Modifier">
                          <span className="material-symbols-outlined">edit</span>
                        </button>
                        <button type="button" className="btn-icon danger" onClick={() => handleDelete(c)} title="Supprimer">
                          <span className="material-symbols-outlined">delete</span>
                        </button>
                      </Can>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {paginated.length === 0 && (
              <p className="empty-msg">Aucune classe. Créez une salle pour commencer.</p>
            )}
          </div>
          <Pagination
            currentPage={currentPage}
            totalItems={filtered.length}
            itemsPerPage={itemsPerPage}
            onPageChange={setCurrentPage}
          />
        </>
      )}
    </div>
  );
};

export default ClassManagement;
