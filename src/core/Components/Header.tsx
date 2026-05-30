import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/core/auth/AuthProvider';
import './Header.css';

interface HeaderProps {
  toggleSidebar: () => void;
}

const Header: React.FC<HeaderProps> = ({ toggleSidebar }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [searchValue, setSearchValue] = useState('');
  const [notifications] = useState(3);

  const formatUserName = () => {
    if (!user) return 'Utilisateur';
    return `${user.first_name || ''} ${user.last_name || ''}`.trim() || user.email;
  };

  const getRoleLabel = (role: string) => {
    const roleLabels: Record<string, string> = {
      admin: 'Administrateur',
      director: 'Directeur',
      teacher: 'Enseignant',
      accountant: 'Comptable',
      secretary: 'Secretaire',
      parent: 'Parent',
      student: 'Élève',
    };
    return roleLabels[role] || role;
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <header className="header">
      <div className="header-left">
        <button className="sidebar-toggle" onClick={toggleSidebar} aria-label="Toggle sidebar" type="button">
          <span className="material-symbols-outlined">menu</span>
        </button>
        <div className="header-search">
          <span className="material-symbols-outlined">search</span>
          <input
            type="search"
            value={searchValue}
            onChange={(event) => setSearchValue(event.target.value)}
            placeholder="Rechercher un eleve, classe ou matricule..."
          />
        </div>
      </div>

      <div className="header-right">
        <button className="notification-btn" type="button">
          <span className="material-symbols-outlined">notifications</span>
          {notifications > 0 ? <span className="notification-badge">{notifications}</span> : null}
        </button>

        <div className="user-menu-container">
          <button className="user-menu-btn" type="button" onClick={() => setShowUserMenu(!showUserMenu)}>
            <div className="user-avatar">{formatUserName().charAt(0).toUpperCase()}</div>
            <div className="user-info">
              <span className="user-name">{formatUserName()}</span>
              <span className="user-role">{getRoleLabel(user?.role || 'admin')}</span>
            </div>
            <span className="material-symbols-outlined dropdown-arrow">expand_more</span>
          </button>

          {showUserMenu && (
            <div className="user-dropdown">
              <div className="dropdown-header">
                <div className="user-avatar large">{formatUserName().charAt(0).toUpperCase()}</div>
                <div>
                  <p className="user-name-large">{formatUserName()}</p>
                  <p className="user-email">{user?.email}</p>
                  <p className="user-role-large">{getRoleLabel(user?.role || 'admin')}</p>
                </div>
              </div>
              <div className="dropdown-menu">
                <Link to="/profile" className="dropdown-item">
                  <span className="material-symbols-outlined item-icon">person</span>
                  Profil
                </Link>
                <Link to="/settings" className="dropdown-item">
                  <span className="material-symbols-outlined item-icon">settings</span>
                  Parametres
                </Link>
                <button type="button" className="dropdown-item logout" onClick={handleLogout}>
                  <span className="material-symbols-outlined item-icon">logout</span>
                  Deconnexion
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;




