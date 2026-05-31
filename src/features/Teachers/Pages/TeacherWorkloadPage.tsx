import React, { useEffect, useState } from 'react';
import api from '@/core/api/client';
import Skeleton from '@/core/Components/Skeleton';
import './TeacherWorkloadPage.css';

type WorkloadRow = {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  assigned_hours: number;
  contractual_hours: number | null;
  is_overloaded: boolean;
  course_count: number;
  class_count: number;
};

const TeacherWorkloadPage: React.FC = () => {
  const [rows, setRows] = useState<WorkloadRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/api/teachers/workload-summary')
      .then((res) => setRows(res.data?.teachers || []))
      .finally(() => setLoading(false));
  }, []);

  const exportCsv = () => {
    const header = 'Nom,Email,Heures assignées,Heures contractuelles,Surcharge,Cours,Classes\n';
    const body = rows.map((r) =>
      `"${r.last_name} ${r.first_name}",${r.email},${r.assigned_hours},${r.contractual_hours ?? ''},${r.is_overloaded ? 'Oui' : 'Non'},${r.course_count},${r.class_count}`
    ).join('\n');
    const blob = new Blob([header + body], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'charge-enseignants.csv';
    a.click();
  };

  if (loading) return <Skeleton className="skel-h-24" />;

  return (
    <div className="teacher-workload-page">
      <header className="page-hero">
        <div>
          <h1>Charge enseignants</h1>
          <p>Heures assignées vs charge contractuelle.</p>
        </div>
        <button type="button" className="btn btn-outline" onClick={exportCsv}>
          <span className="material-symbols-outlined">download</span>
          Export CSV
        </button>
      </header>

      <table className="data-table">
        <thead>
          <tr>
            <th>Enseignant</th>
            <th>Assignées</th>
            <th>Contractuelles</th>
            <th>Cours</th>
            <th>Classes</th>
            <th>Statut</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.id} className={r.is_overloaded ? 'row-overload' : ''}>
              <td>{r.last_name} {r.first_name}</td>
              <td>{r.assigned_hours} h</td>
              <td>{r.contractual_hours ?? '—'} h</td>
              <td>{r.course_count}</td>
              <td>{r.class_count}</td>
              <td>{r.is_overloaded ? <span className="badge error">Surcharge</span> : <span className="badge success">OK</span>}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default TeacherWorkloadPage;
