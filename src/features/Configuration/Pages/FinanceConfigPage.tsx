import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '@/core/api/client';
import '../Configuration.css';

const FinanceConfigPage: React.FC = () => {
  const [config, setConfig] = useState<any>({ fee_types: [], installment_types: [], fee_rates: [] });
  const [rateForm, setRateForm] = useState({ fee_type_id: '', academic_year: '2025-2026', currency: 'CDF', amount: '', grade_level_id: '' });
  const [feeForm, setFeeForm] = useState({ code: '', label: '' });

  const load = () => api.get('/api/finance/config').then((res) => setConfig(res.data));

  useEffect(() => { load(); }, []);

  const addFeeType = async (e: React.FormEvent) => {
    e.preventDefault();
    await api.post('/api/finance/config/fee-types', feeForm);
    setFeeForm({ code: '', label: '' });
    load();
  };

  const addRate = async (e: React.FormEvent) => {
    e.preventDefault();
    await api.post('/api/finance/config/fee-rates', { ...rateForm, amount: Number(rateForm.amount), grade_level_id: rateForm.grade_level_id || null });
    setRateForm({ ...rateForm, amount: '' });
    load();
  };

  return (
    <div className="config-page">
      <header><Link to="/configuration">← Configuration</Link><h1>Finance & barèmes</h1></header>

      <section className="config-panel">
        <h2>Types de frais</h2>
        <table className="config-table"><thead><tr><th>Code</th><th>Libellé</th></tr></thead>
          <tbody>{config.fee_types.map((f: any) => <tr key={f.id}><td>{f.code}</td><td>{f.label}</td></tr>)}</tbody>
        </table>
        <form onSubmit={addFeeType} className="config-form-grid" style={{ marginTop: 16 }}>
          <div className="config-field"><label>Code</label><input value={feeForm.code} required onChange={(e) => setFeeForm({ ...feeForm, code: e.target.value })} /></div>
          <div className="config-field"><label>Libellé</label><input value={feeForm.label} required onChange={(e) => setFeeForm({ ...feeForm, label: e.target.value })} /></div>
          <button type="submit" className="btn btn-primary">Ajouter</button>
        </form>
      </section>

      <section className="config-panel">
        <h2>Barèmes (fee_rates)</h2>
        <table className="config-table">
          <thead><tr><th>Type</th><th>Année</th><th>Montant</th><th>Devise</th></tr></thead>
          <tbody>
            {config.fee_rates.map((r: any) => (
              <tr key={r.id}><td>{r.fee_type?.label}</td><td>{r.academic_year}</td><td>{r.amount}</td><td>{r.currency}</td></tr>
            ))}
          </tbody>
        </table>
        <form onSubmit={addRate} className="config-form-grid" style={{ marginTop: 16 }}>
          <div className="config-field"><label>Type de frais</label>
            <select value={rateForm.fee_type_id} required onChange={(e) => setRateForm({ ...rateForm, fee_type_id: e.target.value })}>
              <option value="">—</option>
              {config.fee_types.map((f: any) => <option key={f.id} value={f.id}>{f.label}</option>)}
            </select>
          </div>
          <div className="config-field"><label>Année</label><input value={rateForm.academic_year} onChange={(e) => setRateForm({ ...rateForm, academic_year: e.target.value })} /></div>
          <div className="config-field"><label>Montant</label><input type="number" required value={rateForm.amount} onChange={(e) => setRateForm({ ...rateForm, amount: e.target.value })} /></div>
          <div className="config-field"><label>Devise</label>
            <select value={rateForm.currency} onChange={(e) => setRateForm({ ...rateForm, currency: e.target.value })}>
              <option value="CDF">CDF</option><option value="USD">USD</option>
            </select>
          </div>
          <button type="submit" className="btn btn-primary">Ajouter barème</button>
        </form>
      </section>
    </div>
  );
};

export default FinanceConfigPage;
