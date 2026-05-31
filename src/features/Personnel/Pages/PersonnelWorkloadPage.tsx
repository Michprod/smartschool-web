import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '@/core/api/client';
import './Personnel.css';

const PersonnelWorkloadPage: React.FC = () => {
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    api.get('/api/personnel/workload-summary').then((res) => setData(res.data));
  }, []);

  return (
    <div className="personnel-page">
      <header><Link to="/personnel">← Personnel</Link><h1>Charge horaire globale</h1></header>
      <div className="personnel-table">
        <table>
          <thead><tr><th>Enseignant</th><th>Assigné</th><th>Contractuel</th><th>Surcharge</th></tr></thead>
          <tbody>
            {(data?.teachers || []).map((t: any) => (
              <tr key={t.user_id || t.id}>
                <td>{t.name || `${t.first_name} ${t.last_name}`}</td>
                <td>{t.assigned_hours ?? t.assigned ?? '—'}</td>
                <td>{t.contractual_hours ?? t.contractual ?? '—'}</td>
                <td>{t.is_overloaded ? 'Oui' : 'Non'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default PersonnelWorkloadPage;
