import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '@/core/auth/AuthProvider';
import { hasPermission } from '@/core/auth/types';
import { preloadRoute } from '@/router/routePreloads';
import './Sidebar.css';

interface SidebarProps {
  isOpen: boolean;
  toggleSidebar: () => void;
}

interface MenuItem {
  id: string;
  label: string;
  icon: string;
  permission?: string;
}

const menuItems: MenuItem[] = [
  { id: 'dashboard', label: 'Dashboard', icon: 'dashboard' },
  { id: 'teacher', label: 'Portail enseignant', icon: 'co_present', permission: 'grades:read' },
  { id: 'students', label: 'Élèves', icon: 'group', permission: 'students:read' },
  { id: 'classes', label: 'Classes', icon: 'class', permission: 'classes:read' },
  { id: 'grades', label: 'Notes', icon: 'school', permission: 'grades:read' },
  { id: 'conduct', label: 'Conduite', icon: 'psychology', permission: 'conduct:write' },
  { id: 'teachers', label: 'Enseignants', icon: 'badge', permission: 'teachers:read' },
  { id: 'finance', label: 'Finance', icon: 'payments', permission: 'finance:read' },
  { id: 'admissions', label: 'Admissions', icon: 'person_add', permission: 'admissions:read' },
  { id: 'events', label: 'Calendrier', icon: 'calendar_today', permission: 'events:read' },
  { id: 'communication', label: 'Communication', icon: 'campaign', permission: 'communication:read' },
  { id: 'discipline', label: 'Discipline', icon: 'gavel', permission: 'discipline:read' },
  { id: 'inventory', label: 'Inventaire', icon: 'inventory_2', permission: 'inventory:read' },
  { id: 'users', label: 'Utilisateurs', icon: 'manage_accounts', permission: 'users:read' },
  { id: 'reports', label: 'Rapports', icon: 'assessment', permission: 'reports:read' },
  { id: 'profile', label: 'Mon profil', icon: 'person' },
  { id: 'settings', label: 'Paramètres', icon: 'settings', permission: 'settings:read' },
];

const Sidebar: React.FC<SidebarProps> = ({ isOpen, toggleSidebar }) => {
  const location = useLocation();
  const { user } = useAuth();
  const activePage = location.pathname.split('/')[1] || 'dashboard';

  const filteredMenuItems = menuItems.filter(
    (item) => !item.permission || hasPermission(user?.all_permissions, item.permission)
  );

  const itemPath = (id: string) => (id === 'dashboard' ? '/' : `/${id}`);

  return (
    <aside className={`sidebar ${isOpen ? 'open' : 'closed'}`}>
      <div className="sidebar-header">
        <div className="logo">
          <span className="logo-icon material-symbols-outlined">school</span>
          {isOpen ? (
            <div className="logo-copy">
              <strong>SmartSchool RDC</strong>
              <small>Administration ERP</small>
            </div>
          ) : null}
        </div>
      </div>

      <nav className="sidebar-nav">
        <ul className="nav-list">
          {filteredMenuItems.map((item) => (
            <li key={item.id} className="nav-item">
              <Link
                to={itemPath(item.id)}
                className={`nav-link ${
                  activePage === item.id || (item.id === 'dashboard' && location.pathname === '/') ? 'active' : ''
                }`}
                title={!isOpen ? item.label : undefined}
                onMouseEnter={() => preloadRoute(itemPath(item.id))}
                onFocus={() => preloadRoute(itemPath(item.id))}
                onClick={() => {
                  if (window.innerWidth <= 1080) toggleSidebar();
                }}
              >
                <span className="nav-icon material-symbols-outlined">{item.icon}</span>
                {isOpen ? <span className="nav-label">{item.label}</span> : null}
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      <div className="sidebar-footer">
        <div className="user-info">
          <div className="user-avatar">{(user?.first_name?.[0] || 'A').toUpperCase()}</div>
          {isOpen ? (
            <div className="user-details">
              <p className="user-role">{user?.email || 'Utilisateur'}</p>
              <p className="user-status">Connecté</p>
            </div>
          ) : null}
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
