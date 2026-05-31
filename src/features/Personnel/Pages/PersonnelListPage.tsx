import React, { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import api from '@/core/api/client';
import { extractList } from '@/core/api/extractData';
import { PersonnelRecord, STAFF_TYPE_LABELS } from '../types/personnel';
import './Personnel.css';

const PersonnelListPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const [list, setList] = useState<PersonnelRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [staffType, setStaffType] = useState(searchParams.get('type') || '');

  useEffect(() => {
    setLoading(true);
    api.get('/api/personnel', { params: { search: search || undefined, staff_type: staffType || undefined, per_page: 100 } })
      .then((res) => setList(extractList(res.data)))
      .finally(() => setLoading(false));
  }, [search, staffType]);

  return (
    <div className="personnel-page">
      <header className="page-hero" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h1>Personnel</h1>
          <p>Gestion RH — enseignants, secrétaires, comptables…</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <Link to="/personnel/workload" className="btn btn-outline">Charge globale</Link>
          <Link to="/personnel/new" className="btn btn-primary">+ Nouveau</Link>
        </div>
      </header>

      <div className="personnel-filters">
        <input placeholder="Rechercher..." value={search} onChange={(e) => setSearch(e.target.value)} />
        <select value={staffType} onChange={(e) => setStaffType(e.target.value)}>
          <option value="">Tous les types</option>
          {Object.entries(STAFF_TYPE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
      </div>

      <div className="personnel-table">
        {loading ? <p style={{ padding: 24 }}>Chargement...</p> : (
          <table>
            <thead><tr><th>Matricule</th><th>Nom</th><th>Type</th><th>Département</th><th>Email</th><th>Statut</th><th></th></tr></thead>
            <tbody>
              {list.map((p) => (
                <tr key={p.id}>
                  <td>{p.staff_number}</td>
                  <td>{p.first_name} {p.last_name}</td>
                  <td><span className="staff-badge">{STAFF_TYPE_LABELS[p.staff_type]}</span></td>
                  <td>{p.department || '—'}</td>
                  <td>{p.user?.email || '—'}</td>
                  <td>{p.is_active ? 'Actif' : 'Inactif'}</td>
                  <td><Link to={`/personnel/${p.id}`}>Voir →</Link></td>
                </tr>
              ))}
              {list.length === 0 && <tr><td colSpan={7} style={{ textAlign: 'center', padding: 24 }}>Aucun personnel</td></tr>}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default PersonnelListPage;
