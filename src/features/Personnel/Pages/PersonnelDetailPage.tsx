import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import api from '@/core/api/client';
import LocationSelect, { type LocationValue } from '@/core/Components/LocationSelect';
import TimetableGrid from '@/features/Teachers/Components/TimetableGrid';
import '@/features/Teachers/Components/TimetableGrid.css';
import { PersonnelRecord, PersonnelTab, STAFF_TYPE_LABELS } from '../types/personnel';
import '@/features/Configuration/Configuration.css';
import './Personnel.css';

const PersonnelDetailPage: React.FC = () => {
  const { id } = useParams();
  const [personnel, setPersonnel] = useState<PersonnelRecord | null>(null);
  const [tab, setTab] = useState<PersonnelTab>('identity');
  const [teaching, setTeaching] = useState<any>(null);
  const [timetable, setTimetable] = useState<any[]>([]);
  const [saving, setSaving] = useState(false);
  const [location, setLocation] = useState<LocationValue>({ province_id: '', city_id: '', commune_id: '', quartier: '', address: '', province: '', city: '' });
  const [notes, setNotes] = useState('');

  const load = () => api.get(`/api/personnel/${id}`).then((res) => {
    const p = res.data?.data ?? res.data;
    setPersonnel(p);
    setNotes(p.notes || '');
    setLocation({
      province_id: p.province_id ? String(p.province_id) : '',
      city_id: p.city_id ? String(p.city_id) : '',
      commune_id: p.commune_id ? String(p.commune_id) : '',
      quartier: p.quartier || '',
      address: p.address || '',
      province: p.province || '',
      city: p.city || '',
    });
  });

  useEffect(() => { load(); }, [id]);

  useEffect(() => {
    if (!personnel || personnel.staff_type !== 'teacher' || tab !== 'teaching') return;
    Promise.all([
      api.get(`/api/personnel/${id}/teaching-profile`),
      api.get(`/api/personnel/${id}/timetable`),
    ]).then(([tp, tt]) => {
      setTeaching(tp.data);
      setTimetable(tt.data?.slots || []);
    });
  }, [personnel, tab, id]);

  const save = async (payload: Record<string, unknown>) => {
    setSaving(true);
    try {
      await api.put(`/api/personnel/${id}`, payload);
      await load();
    } finally {
      setSaving(false);
    }
  };

  if (!personnel) return <p style={{ padding: 24 }}>Chargement...</p>;

  const tabs: PersonnelTab[] = ['identity', 'professional', ...(personnel.staff_type === 'teacher' ? ['teaching' as PersonnelTab] : []), 'account', 'notes'];

  return (
    <div className="personnel-page personnel-detail">
      <Link to="/personnel">← Personnel</Link>

      <div className="personnel-header-card">
        <div>
          <h1>{personnel.first_name} {personnel.last_name}</h1>
          <p>{personnel.staff_number} · <span className="staff-badge">{STAFF_TYPE_LABELS[personnel.staff_type]}</span></p>
          <p>{personnel.user?.email}</p>
        </div>
      </div>

      <div className="personnel-tabs">
        {tabs.map((t) => (
          <button key={t} type="button" className={tab === t ? 'active' : ''} onClick={() => setTab(t)}>
            {{ identity: 'Identité', professional: 'Professionnel', teaching: 'Pédagogique', account: 'Compte', notes: 'Notes RH' }[t]}
          </button>
        ))}
      </div>

      {tab === 'identity' && (
        <div className="personnel-panel">
          <div className="config-form-grid">
            <div className="config-field"><label>Prénom</label><input defaultValue={personnel.first_name} id="fn" /></div>
            <div className="config-field"><label>Nom</label><input defaultValue={personnel.last_name} id="ln" /></div>
            <div className="config-field"><label>Téléphone</label><input defaultValue={personnel.phone || ''} id="ph" /></div>
            <div className="config-field"><label>Naissance</label><input type="date" defaultValue={personnel.birth_date || ''} id="bd" /></div>
          </div>
          <div className="config-field"><label>Adresse</label><LocationSelect value={location} onChange={setLocation} /></div>
          <button type="button" className="btn btn-primary" disabled={saving} onClick={() => {
            const fn = (document.getElementById('fn') as HTMLInputElement).value;
            const ln = (document.getElementById('ln') as HTMLInputElement).value;
            const ph = (document.getElementById('ph') as HTMLInputElement).value;
            const bd = (document.getElementById('bd') as HTMLInputElement).value;
            save({ first_name: fn, last_name: ln, phone: ph, birth_date: bd || null, address: location.address, province_id: location.province_id ? Number(location.province_id) : null, city_id: location.city_id ? Number(location.city_id) : null, commune_id: location.commune_id ? Number(location.commune_id) : null, quartier: location.quartier, province: location.province, city: location.city });
          }}>{saving ? '...' : 'Enregistrer'}</button>
        </div>
      )}

      {tab === 'professional' && (
        <div className="personnel-panel">
          <div className="config-form-grid">
            <div className="config-field"><label>Département</label><input defaultValue={personnel.department || ''} id="dept" /></div>
            <div className="config-field"><label>Fonction</label><input defaultValue={personnel.job_title || ''} id="jt" /></div>
            <div className="config-field"><label>Grade</label><input defaultValue={personnel.job_grade || ''} id="jg" /></div>
            <div className="config-field"><label>Charge h/sem</label><input type="number" defaultValue={personnel.workload_hours ?? ''} id="wl" /></div>
            <div className="config-field"><label>Embauche</label><input type="date" defaultValue={personnel.hire_date || ''} id="hd" /></div>
            <div className="config-field"><label>Contrat</label><input defaultValue={personnel.contract_type || ''} id="ct" /></div>
          </div>
          <div className="config-field"><label>Bio</label><textarea rows={4} defaultValue={personnel.bio || ''} id="bio" /></div>
          <button type="button" className="btn btn-primary" disabled={saving} onClick={() => save({
            department: (document.getElementById('dept') as HTMLInputElement).value,
            job_title: (document.getElementById('jt') as HTMLInputElement).value,
            job_grade: (document.getElementById('jg') as HTMLInputElement).value,
            workload_hours: Number((document.getElementById('wl') as HTMLInputElement).value) || null,
            hire_date: (document.getElementById('hd') as HTMLInputElement).value || null,
            contract_type: (document.getElementById('ct') as HTMLInputElement).value,
            bio: (document.getElementById('bio') as HTMLTextAreaElement).value,
          })}>{saving ? '...' : 'Enregistrer'}</button>
        </div>
      )}

      {tab === 'teaching' && teaching && (
        <div className="personnel-panel">
          <div className="personnel-kpis">
            <div className={`personnel-kpi ${teaching.workload?.is_overloaded ? 'warn' : ''}`}>
              <small>Charge</small><strong>{teaching.workload?.assigned_hours}/{teaching.workload?.contractual_hours ?? '—'} h</strong>
            </div>
            <div className="personnel-kpi"><small>Classes</small><strong>{teaching.workload?.class_count}</strong></div>
            {teaching.principal_class && <div className="personnel-kpi"><small>Titulaire</small><strong>{teaching.principal_class.display_name}</strong></div>}
          </div>
          <h3>Affectations</h3>
          <table className="config-table"><thead><tr><th>Classe</th><th>Matière</th><th>Coef</th><th>h/sem</th></tr></thead>
            <tbody>{(teaching.assignments || []).filter((a: any) => a.is_active).map((a: any) => (
              <tr key={a.id}><td>{a.class_name}</td><td>{a.subject_name}</td><td>{a.coefficient}</td><td>{a.hours_per_week}</td></tr>
            ))}</tbody>
          </table>
          <h3 style={{ marginTop: 20 }}>Emploi du temps</h3>
          <TimetableGrid slots={timetable} />
        </div>
      )}

      {tab === 'account' && (
        <div className="personnel-panel">
          <p><strong>Email :</strong> {personnel.user?.email}</p>
          <p><strong>Rôle :</strong> {personnel.user?.role}</p>
          <p><strong>Statut compte :</strong> {personnel.user?.is_active ? 'Actif' : 'Inactif'}</p>
          <p><strong>Dernière connexion :</strong> {personnel.user?.last_login ? new Date(personnel.user.last_login).toLocaleString('fr-FR') : '—'}</p>
        </div>
      )}

      {tab === 'notes' && (
        <div className="personnel-panel">
          <textarea rows={6} value={notes} onChange={(e) => setNotes(e.target.value)} style={{ width: '100%' }} />
          <button type="button" className="btn btn-primary" style={{ marginTop: 12 }} disabled={saving} onClick={() => save({ notes })}>Enregistrer notes</button>
        </div>
      )}
    </div>
  );
};

export default PersonnelDetailPage;
