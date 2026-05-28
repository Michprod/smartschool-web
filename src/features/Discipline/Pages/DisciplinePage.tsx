import React, { useEffect, useState } from 'react';
import api from '@/core/api/client';
import { extractList } from '@/core/api/extractData';
import './DisciplinePage.css';

type DisciplineCase = {
  id: number;
  target_type: 'student' | 'staff_teaching' | 'staff_admin';
  category: 'conduct' | 'administrative' | 'professional';
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  status: 'open' | 'in_progress' | 'resolved' | 'dismissed';
  student?: { first_name: string; last_name: string };
  user?: { first_name: string; last_name: string };
  conduct_note?: string;
  created_at: string;
};

const DisciplinePage: React.FC = () => {
  const [cases, setCases] = useState<DisciplineCase[]>([]);
  const [targetType, setTargetType] = useState('student');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [severity, setSeverity] = useState<'low' | 'medium' | 'high' | 'critical'>('low');
  const [loading, setLoading] = useState(true);

  const loadCases = async () => {
    try {
      setLoading(true);
      const res = await api.get('/api/discipline/cases');
      setCases(extractList<DisciplineCase>(res));
    } catch (error) {
      console.error('Erreur discipline:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCases();
  }, []);

  const submitCase = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/api/discipline/cases', {
        target_type: targetType,
        category: targetType === 'student' ? 'conduct' : 'administrative',
        severity,
        title,
        description,
        status: 'open',
      });
      setTitle('');
      setDescription('');
      await loadCases();
    } catch (error) {
      console.error('Erreur création dossier disciplinaire:', error);
      alert('Impossible de créer le dossier disciplinaire.');
    }
  };

  return (
    <div className="discipline-page">
      <header className="discipline-header">
        <h1>Module disciplinaire</h1>
        <p>Conduite, sanctions et suivi du personnel et des élèves.</p>
      </header>

      <section className="discipline-form-card">
        <h3>Nouveau dossier disciplinaire</h3>
        <form onSubmit={submitCase}>
          <div className="discipline-grid">
            <label>
              Cible
              <select value={targetType} onChange={(e) => setTargetType(e.target.value)}>
                <option value="student">Élève</option>
                <option value="staff_teaching">Personnel enseignant</option>
                <option value="staff_admin">Personnel administratif</option>
              </select>
            </label>
            <label>
              Gravité
              <select value={severity} onChange={(e) => setSeverity(e.target.value as any)}>
                <option value="low">Faible</option>
                <option value="medium">Moyenne</option>
                <option value="high">Élevée</option>
                <option value="critical">Critique</option>
              </select>
            </label>
          </div>
          <label>
            Intitulé
            <input value={title} onChange={(e) => setTitle(e.target.value)} required />
          </label>
          <label>
            Détails conduite / sanction
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} />
          </label>
          <button type="submit" className="btn-primary">Enregistrer</button>
        </form>
      </section>

      <section className="discipline-list-card">
        <h3>Historique des dossiers</h3>
        {loading ? (
          <p>Chargement...</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Cible</th>
                <th>Type</th>
                <th>Gravité</th>
                <th>Titre</th>
                <th>Statut</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {cases.map((item) => (
                <tr key={item.id}>
                  <td>{item.target_type}</td>
                  <td>{item.category}</td>
                  <td>{item.severity}</td>
                  <td>{item.title}</td>
                  <td>{item.status}</td>
                  <td>{new Date(item.created_at).toLocaleDateString('fr-FR')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </div>
  );
};

export default DisciplinePage;
