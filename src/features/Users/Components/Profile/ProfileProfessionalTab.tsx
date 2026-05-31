import React, { useState } from 'react';
import { ProfileUser } from '../../types/profile';

interface Props {
  user: ProfileUser;
  onSave: (payload: Record<string, unknown>) => Promise<void>;
  saving: boolean;
}

const PRO_ROLES = ['teacher', 'director', 'secretary', 'accountant'];

const ProfileProfessionalTab: React.FC<Props> = ({ user, onSave, saving }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [bio, setBio] = useState(user.bio || '');

  if (!PRO_ROLES.includes(user.role) && !user.has_professional_profile) {
    return (
      <div className="profile-section-new">
        <div className="section-title"><h2>Profil professionnel</h2></div>
        <p className="empty-hint">Aucune fiche professionnelle pour votre rôle.</p>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSave({ bio: bio || null });
    setIsEditing(false);
  };

  return (
    <div className="profile-section-new">
      <div className="section-title">
        <h2>Profil professionnel</h2>
        {!isEditing && (
          <button type="button" className="btn-edit" onClick={() => setIsEditing(true)}>Modifier la bio</button>
        )}
      </div>

      <div className="profile-kpi-grid">
        <article className="profile-kpi-card">
          <small>Département</small>
          <strong>{user.department || '—'}</strong>
        </article>
        <article className="profile-kpi-card">
          <small>Fonction</small>
          <strong>{user.job_title || '—'}</strong>
        </article>
        <article className="profile-kpi-card">
          <small>Grade</small>
          <strong>{user.job_grade || '—'}</strong>
        </article>
        {user.workload_hours != null && (
          <article className="profile-kpi-card">
            <small>Charge contractuelle</small>
            <strong>{user.workload_hours} h / sem</strong>
          </article>
        )}
      </div>

      <form onSubmit={handleSubmit} className="profile-form">
        <div className="form-field">
          <label>Biographie professionnelle</label>
          <textarea
            value={bio}
            disabled={!isEditing}
            rows={5}
            onChange={(e) => setBio(e.target.value)}
            placeholder="Votre parcours, spécialités..."
          />
        </div>
        {isEditing && (
          <div className="form-actions-new">
            <button type="button" className="btn-cancel" disabled={saving}
              onClick={() => { setIsEditing(false); setBio(user.bio || ''); }}>
              Annuler
            </button>
            <button type="submit" className="btn-save" disabled={saving}>
              {saving ? 'Enregistrement...' : 'Enregistrer'}
            </button>
          </div>
        )}
      </form>
    </div>
  );
};

export default ProfileProfessionalTab;
