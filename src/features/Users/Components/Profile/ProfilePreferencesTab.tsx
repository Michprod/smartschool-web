import React, { useEffect, useState } from 'react';

const PREFS_KEY = 'ss_preferences';

export interface UiPreferences {
  theme: 'light' | 'dark';
  emailNotifications: boolean;
  pushNotifications: boolean;
}

const DEFAULT_PREFS: UiPreferences = {
  theme: 'light',
  emailNotifications: true,
  pushNotifications: false,
};

export function loadPreferences(): UiPreferences {
  try {
    const raw = localStorage.getItem(PREFS_KEY);
    if (raw) return { ...DEFAULT_PREFS, ...JSON.parse(raw) };
  } catch { /* ignore */ }
  return DEFAULT_PREFS;
}

export function savePreferences(prefs: UiPreferences): void {
  localStorage.setItem(PREFS_KEY, JSON.stringify(prefs));
  applyTheme(prefs.theme);
}

export function applyTheme(theme: 'light' | 'dark'): void {
  document.documentElement.setAttribute('data-theme', theme);
}

interface Props {
  onSuccess: (msg: string) => void;
}

const ProfilePreferencesTab: React.FC<Props> = ({ onSuccess }) => {
  const [prefs, setPrefs] = useState<UiPreferences>(loadPreferences);

  useEffect(() => {
    applyTheme(prefs.theme);
  }, [prefs.theme]);

  const update = (partial: Partial<UiPreferences>) => {
    const next = { ...prefs, ...partial };
    setPrefs(next);
    savePreferences(next);
    onSuccess('Préférences enregistrées');
  };

  return (
    <div className="profile-section-new">
      <div className="section-title"><h2>Préférences</h2></div>

      <div className="prefs-section">
        <h3>Apparence</h3>
        <div className="form-field">
          <label>Thème</label>
          <div className="theme-toggle">
            <button
              type="button"
              className={`theme-btn ${prefs.theme === 'light' ? 'active' : ''}`}
              onClick={() => update({ theme: 'light' })}
            >
              Clair
            </button>
            <button
              type="button"
              className={`theme-btn ${prefs.theme === 'dark' ? 'active' : ''}`}
              onClick={() => update({ theme: 'dark' })}
            >
              Sombre
            </button>
          </div>
        </div>
      </div>

      <div className="prefs-section">
        <h3>Notifications (interface)</h3>
        <label className="pref-checkbox">
          <input
            type="checkbox"
            checked={prefs.emailNotifications}
            onChange={(e) => update({ emailNotifications: e.target.checked })}
          />
          Recevoir les rappels par email (affichage UI)
        </label>
        <label className="pref-checkbox">
          <input
            type="checkbox"
            checked={prefs.pushNotifications}
            onChange={(e) => update({ pushNotifications: e.target.checked })}
          />
          Activer les notifications push (affichage UI)
        </label>
        <p className="pref-note">Ces préférences sont stockées localement sur cet appareil.</p>
      </div>

      <div className="prefs-section">
        <h3>Langue</h3>
        <p className="pref-note">Français (unique pour le moment)</p>
      </div>
    </div>
  );
};

export default ProfilePreferencesTab;
