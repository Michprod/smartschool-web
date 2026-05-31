import React, { useEffect, useState } from 'react';
import PhotoUpload from '../PhotoUpload';
import LocationSelect, { type LocationValue } from '@/core/Components/LocationSelect';
import { ProfileUser } from '../../types/profile';

interface Props {
  user: ProfileUser;
  onSave: (payload: Record<string, unknown>) => Promise<void>;
  saving: boolean;
}

const ProfilePersonalTab: React.FC<Props> = ({ user, onSave, saving }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [form, setForm] = useState({ ...user });
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [location, setLocation] = useState<LocationValue>({
    province_id: user.province_id ? String(user.province_id) : '',
    city_id: user.city_id ? String(user.city_id) : '',
    commune_id: user.commune_id ? String(user.commune_id) : '',
    quartier: user.quartier || '',
    address: user.address || '',
    province: user.province || '',
    city: user.city || '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    setForm({ ...user });
    setLocation({
      province_id: user.province_id ? String(user.province_id) : '',
      city_id: user.city_id ? String(user.city_id) : '',
      commune_id: user.commune_id ? String(user.commune_id) : '',
      quartier: user.quartier || '',
      address: user.address || '',
      province: user.province || '',
      city: user.city || '',
    });
  }, [user]);

  const resetForm = () => {
    setForm({ ...user });
    setLocation({
      province_id: user.province_id ? String(user.province_id) : '',
      city_id: user.city_id ? String(user.city_id) : '',
      commune_id: user.commune_id ? String(user.commune_id) : '',
      quartier: user.quartier || '',
      address: user.address || '',
      province: user.province || '',
      city: user.city || '',
    });
    setPhotoFile(null);
    setErrors({});
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    try {
      const payload: Record<string, unknown> = {
        first_name: form.first_name,
        last_name: form.last_name,
        email: form.email,
        phone: form.phone || null,
        birth_date: form.birth_date || null,
        bio: form.bio || null,
        address: location.address || null,
        province_id: location.province_id ? Number(location.province_id) : null,
        city_id: location.city_id ? Number(location.city_id) : null,
        commune_id: location.commune_id ? Number(location.commune_id) : null,
        quartier: location.quartier || null,
        province: location.province || null,
        city: location.city || null,
      };

      if (photoFile) {
        const base64 = await new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.readAsDataURL(photoFile);
        });
        payload.avatar = base64;
      }

      await onSave(payload);
      setIsEditing(false);
      setPhotoFile(null);
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { errors?: Record<string, string[]>; message?: string } } };
      if (axiosErr.response?.data?.errors) {
        const mapped: Record<string, string> = {};
        Object.entries(axiosErr.response.data.errors).forEach(([k, v]) => {
          mapped[k] = v[0];
        });
        setErrors(mapped);
      }
    }
  };

  const avatarPreview = form.avatar_url || (form.avatar?.startsWith('http') ? form.avatar : form.avatar ? `/storage/${form.avatar}` : '');

  return (
    <div className="profile-section-new">
      <div className="section-title">
        <h2>Informations personnelles</h2>
        {!isEditing && (
          <button type="button" className="btn-edit" onClick={() => setIsEditing(true)}>Modifier</button>
        )}
      </div>

      <form onSubmit={handleSubmit} className="profile-form">
        <div className="photo-section">
          <PhotoUpload
            currentPhoto={avatarPreview || undefined}
            onPhotoChange={(file, preview) => {
              setPhotoFile(file);
              setForm((p) => ({ ...p, avatar_url: preview }));
            }}
            onPhotoRemove={() => {
              setPhotoFile(null);
              setForm((p) => ({ ...p, avatar_url: null, avatar: null }));
            }}
            label="Photo de profil"
            shape="circle"
            disabled={!isEditing}
          />
        </div>

        <div className="form-grid">
          <div className="form-field">
            <label>Prénom *</label>
            <input type="text" value={form.first_name} disabled={!isEditing} required
              onChange={(e) => setForm({ ...form, first_name: e.target.value })} />
            {errors.first_name && <span className="field-error">{errors.first_name}</span>}
          </div>
          <div className="form-field">
            <label>Nom *</label>
            <input type="text" value={form.last_name} disabled={!isEditing} required
              onChange={(e) => setForm({ ...form, last_name: e.target.value })} />
          </div>
        </div>

        <div className="form-grid">
          <div className="form-field">
            <label>Email *</label>
            <input type="email" value={form.email} disabled={!isEditing} required
              onChange={(e) => setForm({ ...form, email: e.target.value })} />
            {errors.email && <span className="field-error">{errors.email}</span>}
          </div>
          <div className="form-field">
            <label>Téléphone</label>
            <input type="tel" value={form.phone || ''} disabled={!isEditing}
              onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="+243 XX XXX XXXX" />
          </div>
        </div>

        <div className="form-field">
          <label>Date de naissance</label>
          <input type="date" value={form.birth_date || ''} disabled={!isEditing}
            onChange={(e) => setForm({ ...form, birth_date: e.target.value })} />
        </div>

        <div className="form-field">
          <label>Adresse (RDC)</label>
          <LocationSelect value={location} onChange={setLocation} disabled={!isEditing} />
        </div>

        <div className="form-field">
          <label>Biographie</label>
          <textarea value={form.bio || ''} disabled={!isEditing} rows={4}
            onChange={(e) => setForm({ ...form, bio: e.target.value })} placeholder="Parlez-nous de vous..." />
        </div>

        {isEditing && (
          <div className="form-actions-new">
            <button type="button" className="btn-cancel" disabled={saving} onClick={() => { setIsEditing(false); resetForm(); }}>
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

export default ProfilePersonalTab;
