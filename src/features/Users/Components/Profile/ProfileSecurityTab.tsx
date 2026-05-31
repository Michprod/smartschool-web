import React, { useState } from 'react';
import api from '@/core/api/client';

interface Props {
  onSuccess: (msg: string) => void;
  onError: (msg: string) => void;
}

const ProfileSecurityTab: React.FC<Props> = ({ onSuccess, onError }) => {
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    current_password: '',
    password: '',
    password_confirmation: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    if (form.password !== form.password_confirmation) {
      onError('Les mots de passe ne correspondent pas');
      return;
    }

    try {
      setSaving(true);
      await api.put('/api/me/password', form);
      onSuccess('Mot de passe modifié avec succès !');
      setForm({ current_password: '', password: '', password_confirmation: '' });
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { errors?: Record<string, string[]>; message?: string } } };
      if (axiosErr.response?.data?.errors) {
        const mapped: Record<string, string> = {};
        Object.entries(axiosErr.response.data.errors).forEach(([k, v]) => {
          mapped[k] = v[0];
        });
        setErrors(mapped);
      }
      onError(axiosErr.response?.data?.message || 'Erreur lors du changement du mot de passe');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="profile-section-new">
      <div className="section-title"><h2>Sécurité du compte</h2></div>

      <form onSubmit={handleSubmit} className="password-form-new">
        <h3>Changer le mot de passe</h3>

        <div className="form-field">
          <label>Mot de passe actuel *</label>
          <input
            type="password"
            value={form.current_password}
            required
            onChange={(e) => setForm({ ...form, current_password: e.target.value })}
          />
          {errors.current_password && <span className="field-error">{errors.current_password}</span>}
        </div>

        <div className="form-field">
          <label>Nouveau mot de passe *</label>
          <input
            type="password"
            value={form.password}
            minLength={8}
            required
            onChange={(e) => setForm({ ...form, password: e.target.value })}
          />
          <small>Minimum 8 caractères</small>
          {errors.password && <span className="field-error">{errors.password}</span>}
        </div>

        <div className="form-field">
          <label>Confirmer le mot de passe *</label>
          <input
            type="password"
            value={form.password_confirmation}
            required
            onChange={(e) => setForm({ ...form, password_confirmation: e.target.value })}
          />
        </div>

        <button type="submit" className="btn-save" disabled={saving}>
          {saving ? 'Modification...' : 'Changer le mot de passe'}
        </button>
      </form>
    </div>
  );
};

export default ProfileSecurityTab;
