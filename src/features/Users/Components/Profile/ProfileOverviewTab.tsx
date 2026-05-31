import React from 'react';
import { ProfileUser, computeProfileCompletion, getRoleLabel } from '../../types/profile';

interface Props {
  user: ProfileUser;
}

const ProfileOverviewTab: React.FC<Props> = ({ user }) => {
  const completion = computeProfileCompletion(user);
  const lastLogin = user.last_login
    ? new Date(user.last_login).toLocaleString('fr-FR')
    : 'Jamais enregistrée';

  const addressParts = [
    user.address,
    user.quartier,
    user.city,
    user.province,
  ].filter(Boolean);

  return (
    <div className="profile-section-new">
      <div className="section-title"><h2>Vue d&apos;ensemble</h2></div>

      <div className="profile-kpi-grid">
        <article className="profile-kpi-card">
          <small>Complétion profil</small>
          <strong>{completion}%</strong>
          <div className="completion-bar"><span style={{ width: `${completion}%` }} /></div>
        </article>
        <article className="profile-kpi-card">
          <small>Rôle</small>
          <strong>{getRoleLabel(user.role)}</strong>
          <span>{user.role_info?.description || '—'}</span>
        </article>
        <article className="profile-kpi-card">
          <small>Dernière connexion</small>
          <strong className="kpi-sm">{lastLogin}</strong>
        </article>
        {user.role === 'teacher' && user.workload_hours != null && (
          <article className="profile-kpi-card">
            <small>Charge contractuelle</small>
            <strong>{user.workload_hours} h / sem</strong>
          </article>
        )}
      </div>

      <div className="profile-info-cards">
        <div className="info-card">
          <h3>Contact</h3>
          <p><strong>Email :</strong> {user.email}</p>
          <p><strong>Téléphone :</strong> {user.phone || '—'}</p>
        </div>
        <div className="info-card">
          <h3>Adresse</h3>
          <p>{addressParts.length ? addressParts.join(', ') : 'Non renseignée'}</p>
        </div>
        <div className="info-card">
          <h3>Identité</h3>
          <p><strong>Naissance :</strong> {user.birth_date ? new Date(user.birth_date).toLocaleDateString('fr-FR') : '—'}</p>
          <p><strong>Membre depuis :</strong> {user.created_at ? new Date(user.created_at).toLocaleDateString('fr-FR') : '—'}</p>
        </div>
        {user.bio && (
          <div className="info-card full">
            <h3>Biographie</h3>
            <p>{user.bio}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProfileOverviewTab;
