import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '@/core/api/client';
import LocationSelect, { type LocationValue } from '@/core/Components/LocationSelect';
import { STAFF_TYPE_LABELS } from '../types/personnel';
import '@/features/Configuration/Configuration.css';
import './Personnel.css';

const PersonnelFormPage: React.FC = () => {
  const navigate = useNavigate();
  const [saving, setSaving] = useState(false);
  const [refs, setRefs] = useState<any>({ departments: [], job_grades: [], contract_types: [] });
  const [refsError, setRefsError] = useState('');
  const [loadingRefs, setLoadingRefs] = useState(true);
  const [form, setForm] = useState({
    staff_type: 'teacher', first_name: '', last_name: '', email: '', password: 'password',
    phone: '', department: '', job_title: '', job_grade: '', workload_hours: '',
    hire_date: '', contract_type: '', bio: '',
  });
  const [location, setLocation] = useState<LocationValue>({
    province_id: '', city_id: '', commune_id: '', quartier: '', address: '', province: '', city: '',
  });

  useEffect(() => {
    let mounted = true;
    setLoadingRefs(true);
    setRefsError('');

    Promise.all([
      api.get('/api/config/personnel-ref', { params: { type: 'department' } }),
      api.get('/api/config/personnel-ref', { params: { type: 'job_grade' } }),
      api.get('/api/config/personnel-ref', { params: { type: 'contract_type' } }),
    ])
      .then(([d, g, c]) => {
        if (!mounted) return;
        setRefs({ departments: d.data, job_grades: g.data, contract_types: c.data });
      })
      .catch(() => {
        if (!mounted) return;
        setRefs({ departments: [], job_grades: [], contract_types: [] });
        setRefsError('Impossible de charger le référentiel RH. Vous pouvez saisir ces champs manuellement ou configurer le référentiel.');
      })
      .finally(() => {
        if (!mounted) return;
        setLoadingRefs(false);
      });

    return () => { mounted = false; };
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await api.post('/api/personnel', {
        ...form,
        workload_hours: form.workload_hours ? Number(form.workload_hours) : null,
        address: location.address || null,
        province_id: location.province_id ? Number(location.province_id) : null,
        city_id: location.city_id ? Number(location.city_id) : null,
        commune_id: location.commune_id ? Number(location.commune_id) : null,
        quartier: location.quartier || null,
        province: location.province || null,
        city: location.city || null,
      });
      const id = res.data?.data?.id ?? res.data?.id;
      navigate(id ? `/personnel/${id}` : '/personnel');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="personnel-page">
      <header><Link to="/personnel">← Personnel</Link><h1>Nouveau membre du personnel</h1></header>
      <form className="personnel-panel" onSubmit={submit}>
        <h2>Identité & compte</h2>
        <div className="config-form-grid">
          <div className="config-field"><label>Type *</label>
            <select value={form.staff_type} onChange={(e) => setForm({ ...form, staff_type: e.target.value })}>
              {Object.entries(STAFF_TYPE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
          </div>
          <div className="config-field"><label>Prénom *</label><input required value={form.first_name} onChange={(e) => setForm({ ...form, first_name: e.target.value })} /></div>
          <div className="config-field"><label>Nom *</label><input required value={form.last_name} onChange={(e) => setForm({ ...form, last_name: e.target.value })} /></div>
          <div className="config-field"><label>Email (compte) *</label><input type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></div>
          <div className="config-field"><label>Mot de passe *</label><input required minLength={8} value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} /></div>
          <div className="config-field"><label>Téléphone</label><input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></div>
        </div>
        <div className="config-field"><label>Adresse RDC</label><LocationSelect value={location} onChange={setLocation} /></div>

        <h2 style={{ marginTop: 24 }}>Professionnel</h2>
        {(!loadingRefs && (refs.departments.length === 0 || refs.job_grades.length === 0 || refs.contract_types.length === 0)) || refsError ? (
          <div style={{ marginBottom: 16, padding: 12, borderRadius: 8, background: '#fff3cd', border: '1px solid #ffeeba' }}>
            <p style={{ margin: 0, fontWeight: 600 }}>
              Référentiel RH indisponible (département/grade/contrat).
            </p>
            <p style={{ margin: '6px 0 10px 0', fontSize: 13 }}>
              {refsError || 'Saisissez les champs manuellement, puis complétez le référentiel pour les prochains enregistrements.'}
            </p>
            <Link to="/configuration/personnel-ref" style={{ color: '#664d03' }}>
              Aller à la configuration du référentiel RH
            </Link>
          </div>
        ) : null}
        <div className="config-form-grid">
          <div className="config-field"><label>Département</label>
            {refs.departments.length > 0 ? (
              <select value={form.department} onChange={(e) => setForm({ ...form, department: e.target.value })}>
                <option value="">—</option>
                {refs.departments.map((d: any) => <option key={d.id} value={d.label}>{d.label}</option>)}
              </select>
            ) : (
              <input
                value={form.department}
                onChange={(e) => setForm({ ...form, department: e.target.value })}
                placeholder="Département (libre)"
              />
            )}
          </div>
          <div className="config-field"><label>Fonction</label><input value={form.job_title} onChange={(e) => setForm({ ...form, job_title: e.target.value })} /></div>
          <div className="config-field"><label>Grade</label>
            {refs.job_grades.length > 0 ? (
              <select value={form.job_grade} onChange={(e) => setForm({ ...form, job_grade: e.target.value })}>
                <option value="">—</option>
                {refs.job_grades.map((g: any) => <option key={g.id} value={g.label}>{g.label}</option>)}
              </select>
            ) : (
              <input
                value={form.job_grade}
                onChange={(e) => setForm({ ...form, job_grade: e.target.value })}
                placeholder="Grade (libre)"
              />
            )}
          </div>
          <div className="config-field"><label>Charge (h/sem)</label><input type="number" value={form.workload_hours} onChange={(e) => setForm({ ...form, workload_hours: e.target.value })} /></div>
          <div className="config-field"><label>Date embauche</label><input type="date" value={form.hire_date} onChange={(e) => setForm({ ...form, hire_date: e.target.value })} /></div>
          <div className="config-field"><label>Contrat</label>
            {refs.contract_types.length > 0 ? (
              <select value={form.contract_type} onChange={(e) => setForm({ ...form, contract_type: e.target.value })}>
                <option value="">—</option>
                {refs.contract_types.map((c: any) => <option key={c.id} value={c.label}>{c.label}</option>)}
              </select>
            ) : (
              <input
                value={form.contract_type}
                onChange={(e) => setForm({ ...form, contract_type: e.target.value })}
                placeholder="Contrat (libre)"
              />
            )}
          </div>
        </div>
        <div className="config-field"><label>Bio</label><textarea rows={3} value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })} /></div>

        <button type="submit" className="btn btn-primary" disabled={saving} style={{ marginTop: 16 }}>
          {saving ? 'Création...' : 'Créer fiche + compte'}
        </button>
      </form>
    </div>
  );
};

export default PersonnelFormPage;
