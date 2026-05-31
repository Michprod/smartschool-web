import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '@/core/api/client';
import '../Configuration.css';

const TYPES = [
  { value: 'department', label: 'Départements' },
  { value: 'job_grade', label: 'Grades' },
  { value: 'contract_type', label: 'Types de contrat' },
];

const PersonnelRefConfigPage: React.FC = () => {
  const [items, setItems] = useState<any[]>([]);
  const [form, setForm] = useState({ type: 'department', label: '' });

  const load = () => api.get('/api/config/personnel-ref').then((res) => setItems(res.data || []));

  useEffect(() => { load(); }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    await api.post('/api/config/personnel-ref', form);
    setForm({ ...form, label: '' });
    load();
  };

  const remove = async (id: number) => {
    await api.delete(`/api/config/personnel-ref/${id}`);
    load();
  };

  return (
    <div className="config-page">
      <header><Link to="/configuration">← Configuration</Link><h1>Référentiel RH</h1></header>
      <section className="config-panel">
        <table className="config-table">
          <thead><tr><th>Type</th><th>Libellé</th><th></th></tr></thead>
          <tbody>
            {items.map((i) => (
              <tr key={i.id}><td>{i.type}</td><td>{i.label}</td>
                <td><button type="button" className="btn btn-outline btn-sm" onClick={() => remove(i.id)}>Retirer</button></td></tr>
            ))}
          </tbody>
        </table>
        <form onSubmit={submit} className="config-form-grid" style={{ marginTop: 16 }}>
          <div className="config-field"><label>Type</label>
            <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
              {TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
          </div>
          <div className="config-field"><label>Libellé</label><input required value={form.label} onChange={(e) => setForm({ ...form, label: e.target.value })} /></div>
          <button type="submit" className="btn btn-primary">Ajouter</button>
        </form>
      </section>
    </div>
  );
};

export default PersonnelRefConfigPage;
