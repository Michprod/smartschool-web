import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useAuth } from '@/core/auth/AuthProvider';
import api from '@/core/api/client';
import ProfileHeader from '../Components/Profile/ProfileHeader';
import ProfileOverviewTab from '../Components/Profile/ProfileOverviewTab';
import ProfilePersonalTab from '../Components/Profile/ProfilePersonalTab';
import ProfileProfessionalTab from '../Components/Profile/ProfileProfessionalTab';
import ProfileTeachingTab from '../Components/Profile/ProfileTeachingTab';
import ProfileParentTab from '../Components/Profile/ProfileParentTab';
import ProfileAccountTab from '../Components/Profile/ProfileAccountTab';
import ProfileSecurityTab from '../Components/Profile/ProfileSecurityTab';
import ProfilePreferencesTab from '../Components/Profile/ProfilePreferencesTab';
import { ProfileTab, ProfileUser } from '../types/profile';
import './ProfilePage.css';

const PRO_ROLES = ['teacher', 'director', 'secretary', 'accountant'];

const TAB_LABELS: Record<ProfileTab, string> = {
  overview: "Vue d'ensemble",
  personal: 'Informations',
  professional: 'Professionnel',
  teaching: 'Pédagogique',
  parent: 'Mes enfants',
  account: 'Compte',
  security: 'Sécurité',
  preferences: 'Préférences',
};

function normalizeUser(raw: Record<string, unknown>): ProfileUser {
  return {
    id: raw.id as number,
    first_name: (raw.first_name as string) || '',
    last_name: (raw.last_name as string) || '',
    email: (raw.email as string) || '',
    phone: (raw.phone as string | null) ?? null,
    avatar: (raw.avatar as string | null) ?? null,
    avatar_url: (raw.avatar_url as string | null) ?? null,
    role: (raw.role as string) || '',
    department: (raw.department as string | null) ?? null,
    is_active: Boolean(raw.is_active),
    has_professional_profile: raw.has_professional_profile as boolean | undefined,
    workload_hours: raw.workload_hours as number | null | undefined,
    job_grade: raw.job_grade as string | null | undefined,
    job_title: raw.job_title as string | null | undefined,
    bio: (raw.bio as string | null) ?? null,
    birth_date: (raw.birth_date as string | null) ?? null,
    address: (raw.address as string | null) ?? null,
    city: (raw.city as string | null) ?? null,
    province: (raw.province as string | null) ?? null,
    province_id: (raw.province_id as number | null) ?? null,
    city_id: (raw.city_id as number | null) ?? null,
    commune_id: (raw.commune_id as number | null) ?? null,
    quartier: (raw.quartier as string | null) ?? null,
    last_login: (raw.last_login as string | null) ?? null,
    created_at: (raw.created_at as string | null) ?? null,
    all_permissions: (raw.all_permissions as string[]) || [],
    role_info: raw.role_info as ProfileUser['role_info'],
  };
}

const ProfilePage: React.FC = () => {
  const { refreshUser } = useAuth();
  const [activeTab, setActiveTab] = useState<ProfileTab>('overview');
  const [user, setUser] = useState<ProfileUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const visibleTabs = useMemo((): ProfileTab[] => {
    if (!user) return ['overview', 'personal', 'account', 'security', 'preferences'];
    const tabs: ProfileTab[] = ['overview', 'personal'];
    if (PRO_ROLES.includes(user.role) || user.has_professional_profile) {
      tabs.push('professional');
    }
    if (user.role === 'teacher') tabs.push('teaching');
    if (user.role === 'parent') tabs.push('parent');
    tabs.push('account', 'security', 'preferences');
    return tabs;
  }, [user]);

  const showMessage = useCallback((type: 'success' | 'error', text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 4000);
  }, []);

  const loadProfile = useCallback(async () => {
    try {
      setLoading(true);
      const response = await api.get('/api/user');
      const raw = response.data?.data ?? response.data;
      setUser(normalizeUser(raw));
    } catch {
      showMessage('error', 'Erreur lors du chargement du profil');
    } finally {
      setLoading(false);
    }
  }, [showMessage]);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  useEffect(() => {
    if (!visibleTabs.includes(activeTab)) {
      setActiveTab('overview');
    }
  }, [visibleTabs, activeTab]);

  const handleSave = async (payload: Record<string, unknown>) => {
    if (!user) return;
    try {
      setSaving(true);
      await api.put(`/api/users/${user.id}`, payload);
      await refreshUser();
      await loadProfile();
      showMessage('success', 'Profil mis à jour avec succès !');
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { message?: string } } };
      showMessage('error', axiosErr.response?.data?.message || 'Erreur lors de la sauvegarde');
      throw err;
    } finally {
      setSaving(false);
    }
  };

  if (loading || !user) {
    return (
      <div className="profile-loading">
        <div className="spinner" />
        <p>Chargement du profil...</p>
      </div>
    );
  }

  return (
    <div className="profile-page-new">
      {message && (
        <div className={`profile-message ${message.type}`}>
          <span className="message-icon">{message.type === 'success' ? '✓' : '✕'}</span>
          {message.text}
        </div>
      )}

      <ProfileHeader user={user} />

      <div className="profile-tabs-new">
        {visibleTabs.map((tab) => (
          <button
            key={tab}
            type="button"
            className={`tab-btn ${activeTab === tab ? 'active' : ''}`}
            onClick={() => setActiveTab(tab)}
          >
            {TAB_LABELS[tab]}
          </button>
        ))}
      </div>

      <div className="profile-content-new">
        {activeTab === 'overview' && <ProfileOverviewTab user={user} />}
        {activeTab === 'personal' && (
          <ProfilePersonalTab user={user} onSave={handleSave} saving={saving} />
        )}
        {activeTab === 'professional' && (
          <ProfileProfessionalTab user={user} onSave={handleSave} saving={saving} />
        )}
        {activeTab === 'teaching' && <ProfileTeachingTab />}
        {activeTab === 'parent' && <ProfileParentTab />}
        {activeTab === 'account' && <ProfileAccountTab user={user} />}
        {activeTab === 'security' && (
          <ProfileSecurityTab onSuccess={(t) => showMessage('success', t)} onError={(t) => showMessage('error', t)} />
        )}
        {activeTab === 'preferences' && (
          <ProfilePreferencesTab onSuccess={(t) => showMessage('success', t)} />
        )}
      </div>
    </div>
  );
};

export default ProfilePage;
