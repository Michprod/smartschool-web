import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '@/core/api/client';
import '../Configuration.css';

const GeoConfigPage: React.FC = () => {
  const [provinces, setProvinces] = useState<any[]>([]);
  const [newProvince, setNewProvince] = useState('');

  const load = () => api.get('/api/locations/provinces').then((res) => setProvinces(res.data || []));

  useEffect(() => { load(); }, []);

  const addProvince = async (e: React.FormEvent) => {
    e.preventDefault();
    await api.post('/api/locations/provinces', { name: newProvince });
    setNewProvince('');
    load();
  };

  return (
    <div className="config-page">
      <header><Link to="/configuration">← Configuration</Link><h1>Géographie RDC</h1></header>
      <section className="config-panel">
        <p style={{ color: '#666', marginBottom: 16 }}>Provinces enregistrées. Les villes et communes se gèrent via les seeders ou extensions futures.</p>
        <table className="config-table">
          <thead><tr><th>ID</th><th>Province</th><th>Code</th></tr></thead>
          <tbody>{provinces.map((p) => <tr key={p.id}><td>{p.id}</td><td>{p.name}</td><td>{p.code || '—'}</td></tr>)}</tbody>
        </table>
        <form onSubmit={addProvince} className="config-form-grid" style={{ marginTop: 16 }}>
          <div className="config-field"><label>Nouvelle province</label><input required value={newProvince} onChange={(e) => setNewProvince(e.target.value)} /></div>
          <button type="submit" className="btn btn-primary">Ajouter</button>
        </form>
      </section>
    </div>
  );
};

export default GeoConfigPage;
