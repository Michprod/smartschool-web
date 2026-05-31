import React from 'react';
import { ProfileUser, getRoleLabel } from '../../types/profile';

interface Props {
  user: ProfileUser;
}

const ProfileAccountTab: React.FC<Props> = ({ user }) => {
  const permissions = user.all_permissions || [];

  return (
    <div className="profile-section-new">
      <div className="section-title"><h2>Compte et permissions</h2></div>

      <div className="profile-kpi-grid">
        <article className="profile-kpi-card">
          <small>Rôle</small>
          <strong>{getRoleLabel(user.role)}</strong>
          <span>{user.role_info?.name || user.role}</span>
        </article>
        <article className="profile-kpi-card">
          <small>Statut</small>
          <strong>{user.is_active ? 'Actif' : 'Inactif'}</strong>
        </article>
        <article className="profile-kpi-card">
          <small>Membre depuis</small>
          <strong className="kpi-sm">
            {user.created_at ? new Date(user.created_at).toLocaleDateString('fr-FR') : '—'}
          </strong>
        </article>
        <article className="profile-kpi-card">
          <small>Dernière connexion</small>
          <strong className="kpi-sm">
            {user.last_login ? new Date(user.last_login).toLocaleString('fr-FR') : '—'}
          </strong>
        </article>
      </div>

      {user.role_info?.description && (
        <div className="info-card full">
          <h3>Description du rôle</h3>
          <p>{user.role_info.description}</p>
        </div>
      )}

      <h3 className="subsection-title">Permissions ({permissions.length})</h3>
      {permissions.length === 0 ? (
        <p className="empty-hint">Aucune permission explicite.</p>
      ) : (
        <ul className="permissions-list">
          {permissions.map((p) => (
            <li key={p}><code>{p}</code></li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default ProfileAccountTab;
