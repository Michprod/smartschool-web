import React, { useEffect, useState } from 'react';
import api from '@/core/api/client';
import { fetchSchoolYear } from '@/core/utils/schoolYear';
import Skeleton from '@/core/Components/Skeleton';
import './ConductPage.css';

type ConductRow = {
  student: { id: number; first_name: string; last_name: string; matricule?: string };
  conduct_score: number | null;
  appreciation: string | null;
};

const ConductPage: React.FC = () => {
  const [classes, setClasses] = useState<Array<{ id: number; name: string }>>([]);
  const [selectedClass, setSelectedClass] = useState('');
  const [term, setTerm] = useState('T1');
  const [academicYear, setAcademicYear] = useState('2025-2026');
  const [rows, setRows] = useState<ConductRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const load = async () => {
      const year = await fetchSchoolYear();
      setAcademicYear(year);
      const res = await api.get('/api/grades/my-classes', { params: { academic_year: year } });
      const list = (res.data || []).map((item: { class: { id: number; display_name?: string; name: string } }) => ({
        id: item.class.id,
        name: item.class.display_name || item.class.name,
      }));
      setClasses(list);
      if (list.length) setSelectedClass(String(list[0].id));
      setLoading(false);
    };
    load();
  }, []);

  useEffect(() => {
    if (!selectedClass) return;
    api.get(`/api/classes/${selectedClass}/conduct`, { params: { term, academic_year: academicYear } })
      .then((res) => setRows(res.data?.students || []));
  }, [selectedClass, term, academicYear]);

  const updateRow = (studentId: number, field: 'conduct_score' | 'appreciation', value: string) => {
    setRows((prev) => prev.map((r) =>
      r.student.id === studentId
        ? { ...r, [field]: field === 'conduct_score' ? (value === '' ? null : Number(value)) : value }
        : r
    ));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.post(`/api/classes/${selectedClass}/conduct/bulk`, {
        term,
        academic_year: academicYear,
        grades: rows.map((r) => ({
          student_id: r.student.id,
          conduct_score: r.conduct_score,
          appreciation: r.appreciation,
        })),
      });
      alert('Conduite enregistrée.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <Skeleton className="skel-h-24" />;

  if (classes.length === 0) {
    return (
      <div className="conduct-page">
        <header className="page-hero">
          <div>
            <h1>Conduite des élèves</h1>
            <p>Appréciation de conduite par période (titulaire de classe).</p>
          </div>
        </header>
        <p className="empty-msg">
          Aucune classe assignée pour l&apos;année {academicYear}. Contactez l&apos;administration (secrétariat ou direction).
        </p>
      </div>
    );
  }

  return (
    <div className="conduct-page">
      <header className="page-hero">
        <div>
          <h1>Conduite des élèves</h1>
          <p>Appréciation de conduite par période (titulaire de classe).</p>
        </div>
        <button type="button" className="btn btn-primary" onClick={handleSave} disabled={saving}>
          {saving ? 'Enregistrement…' : 'Enregistrer'}
        </button>
      </header>

      <div className="conduct-filters">
        <select value={selectedClass} onChange={(e) => setSelectedClass(e.target.value)}>
          {classes.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <select value={term} onChange={(e) => setTerm(e.target.value)}>
          <option value="T1">1er Trimestre</option>
          <option value="T2">2ème Trimestre</option>
          <option value="T3">3ème Trimestre</option>
          <option value="S1">1er Semestre</option>
          <option value="S2">2ème Semestre</option>
        </select>
      </div>

      <table className="data-table">
        <thead>
          <tr>
            <th>Élève</th>
            <th>Note /20</th>
            <th>Appréciation (bulletin)</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.student.id}>
              <td>{row.student.last_name} {row.student.first_name}</td>
              <td>
                <input
                  type="number"
                  min={0}
                  max={20}
                  value={row.conduct_score ?? ''}
                  onChange={(e) => updateRow(row.student.id, 'conduct_score', e.target.value)}
                />
              </td>
              <td>
                <input
                  type="text"
                  value={row.appreciation ?? ''}
                  onChange={(e) => updateRow(row.student.id, 'appreciation', e.target.value)}
                  placeholder="Appréciation pour le bulletin"
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {rows.length === 0 && <p className="empty-msg">Aucun élève dans cette classe.</p>}
    </div>
  );
};

export default ConductPage;
