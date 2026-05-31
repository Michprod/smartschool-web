import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '@/core/api/client';
import Skeleton from '@/core/Components/Skeleton';

interface Child {
  id: number;
  first_name: string;
  last_name: string;
  matricule: string;
  class: string | null;
  class_id: number | null;
  bulletin_blocked: boolean;
}

const ProfileParentTab: React.FC = () => {
  const [children, setChildren] = useState<Child[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api.get('/api/parent/children')
      .then((res) => setChildren(res.data?.children || []))
      .catch(() => setError('Impossible de charger la liste des enfants.'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Skeleton className="skel-h-24" />;

  if (error) {
    return (
      <div className="profile-section-new">
        <div className="section-title"><h2>Mes enfants</h2></div>
        <p className="empty-hint">{error}</p>
      </div>
    );
  }

  return (
    <div className="profile-section-new">
      <div className="section-title"><h2>Mes enfants</h2></div>

      {children.length === 0 ? (
        <p className="empty-hint">Aucun enfant rattaché à votre compte.</p>
      ) : (
        <div className="children-grid">
          {children.map((child) => (
            <article key={child.id} className="child-card">
              <h3>{child.first_name} {child.last_name}</h3>
              <p><strong>Matricule :</strong> {child.matricule || '—'}</p>
              <p><strong>Classe :</strong> {child.class || '—'}</p>
              {child.bulletin_blocked && (
                <span className="blocked-badge">Bulletin bloqué (impayés)</span>
              )}
              <Link to={`/students/${child.id}`} className="child-link">
                Voir le dossier →
              </Link>
            </article>
          ))}
        </div>
      )}
    </div>
  );
};

export default ProfileParentTab;
