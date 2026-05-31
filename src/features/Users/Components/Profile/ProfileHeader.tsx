import React from 'react';
import { ProfileUser, avatarDisplayUrl, getRoleLabel } from '../../types/profile';

interface Props {
  user: ProfileUser;
}

const ProfileHeader: React.FC<Props> = ({ user }) => {
  const avatar = avatarDisplayUrl(user);

  return (
    <div className="profile-header-new">
      <div className="profile-banner" />
      <div className="profile-info-section">
        <div className="profile-avatar-wrapper">
          {avatar ? (
            <img src={avatar} alt="Profile" />
          ) : (
            <div className="avatar-placeholder-new">
              {user.first_name?.charAt(0) || ''}{user.last_name?.charAt(0) || ''}
            </div>
          )}
        </div>
        <div className="profile-details">
          <h1>{user.first_name} {user.last_name}</h1>
          <p className="role-badge">{getRoleLabel(user.role)}</p>
          {user.department && <p className="dept-text">{user.department}</p>}
          <p className="email-text">{user.email}</p>
          <span className={`status-chip ${user.is_active ? 'active' : 'inactive'}`}>
            {user.is_active ? 'Compte actif' : 'Compte inactif'}
          </span>
        </div>
      </div>
    </div>
  );
};

export default ProfileHeader;
