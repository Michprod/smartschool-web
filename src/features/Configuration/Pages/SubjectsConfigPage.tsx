import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '@/core/api/client';
import '../Configuration.css';

const SubjectsConfigPage: React.FC = () => {
  const [subjects, setSubjects] = useState<any[]>([]);
  const [form, setForm] = useState({ code: '', name: '', type: 'core' });

  const load = () => api.get('/api/subjects').then((res) => setSubjects(res.data?.data || res.data || []));

  useEffect(() => { load(); }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    await api.post('/api/subjects', form);
    setForm({ code: '', name: '', type: 'core' });
    load();
  };

  const remove = async (id: number) => {
    if (!confirm('Supprimer cette matière ?')) return;
    await api.delete(`/api/subjects/${id}`);
    load();
  };

  return (
    <div className="config-page">
      <header><Link to="/configuration">← Configuration</Link><h1>Matières</h1></header>
      <section className="config-panel">
        <table className="config-table">
          <thead><tr><th>Code</th><th>Nom</th><th>Type</th><th></th></tr></thead>
          <tbody>
            {subjects.map((s) => (
              <tr key={s.id}><td>{s.code}</td><td>{s.name}</td><td>{s.type}</td>
                <td><button type="button" className="btn btn-outline btn-sm" onClick={() => remove(s.id)}>Suppr.</button></td></tr>
            ))}
          </tbody>
        </table>
        <form onSubmit={submit} className="config-form-grid" style={{ marginTop: 16 }}>
          <div className="config-field"><label>Code</label><input required value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} /></div>
          <div className="config-field"><label>Nom</label><input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
          <div className="config-field"><label>Type</label>
            <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
              <option value="core">Tronc commun</option><option value="option">Option</option>
            </select>
          </div>
          <button type="submit" className="btn btn-primary">Ajouter</button>
        </form>
      </section>
    </div>
  );
};

export default SubjectsConfigPage;
