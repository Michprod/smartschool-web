import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '@/core/api/client';
import '../Configuration.css';

const SchoolConfigPage: React.FC = () => {
  const [form, setForm] = useState({ schoolName: '', schoolCode: '', email: '', phone: '', address: '', city: '', province: '', currentYear: '2025-2026' });
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');

  useEffect(() => {
    api.get('/api/settings').then((res) => {
      const s = res.data?.settings || res.data || {};
      setForm({
        schoolName: s.schoolName || '',
        schoolCode: s.schoolCode || '',
        email: s.email || '',
        phone: s.phone || '',
        address: s.address || '',
        city: s.city || '',
        province: s.province || '',
        currentYear: s.currentYear || '2025-2026',
      });
    }).catch(() => {});
  }, []);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMsg('');
    try {
      await api.post('/api/settings', { settings: form });
      setMsg('Paramètres enregistrés.');
    } catch {
      setMsg('Erreur lors de la sauvegarde.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="config-page">
      <header><Link to="/configuration">← Configuration</Link><h1>École & année scolaire</h1></header>
      <form className="config-panel" onSubmit={save}>
        <div className="config-form-grid">
          <div className="config-field"><label>Nom établissement</label><input value={form.schoolName} onChange={(e) => setForm({ ...form, schoolName: e.target.value })} /></div>
          <div className="config-field"><label>Code école</label><input value={form.schoolCode} onChange={(e) => setForm({ ...form, schoolCode: e.target.value })} /></div>
          <div className="config-field"><label>Email</label><input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></div>
          <div className="config-field"><label>Téléphone</label><input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></div>
          <div className="config-field full"><label>Adresse</label><input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} /></div>
          <div className="config-field"><label>Ville</label><input value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} /></div>
          <div className="config-field"><label>Province</label><input value={form.province} onChange={(e) => setForm({ ...form, province: e.target.value })} /></div>
          <div className="config-field"><label>Année en cours</label><input value={form.currentYear} onChange={(e) => setForm({ ...form, currentYear: e.target.value })} /></div>
        </div>
        {msg && <p>{msg}</p>}
        <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Enregistrement...' : 'Enregistrer'}</button>
      </form>
    </div>
  );
};

export default SchoolConfigPage;
