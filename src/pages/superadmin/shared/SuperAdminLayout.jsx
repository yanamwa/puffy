import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { API_BASE } from '../../../config.js';
import { useAuth } from '../../../context/AuthContext';

import SuperAdminSidebar
  from '../../../components/superadmin/SuperAdminSidebar';

import SuperAdminHeader
  from '../../../components/superadmin/SuperAdminHeader';

import '../../admin/shared/AdminLayout.css';
import './SuperAdminLayout.css';

const DEFAULT_PROFILE_IMAGE = '/images/temporaryimg.png';

function resolveProfileImage(imagePath) {
  if (!imagePath) return DEFAULT_PROFILE_IMAGE;

  if (
    imagePath.startsWith('http://') ||
    imagePath.startsWith('https://') ||
    imagePath.startsWith('blob:') ||
    imagePath.startsWith('data:') ||
    imagePath.startsWith('/images/')
  ) {
    return imagePath;
  }

  let fixedPath = imagePath;

  if (fixedPath.startsWith('/api/uploads/profile-images/')) {
    fixedPath = fixedPath.replace(
      '/api/uploads/profile-images/',
      '/uploads/profile-images/',
    );
  }

  if (!fixedPath.startsWith('/')) {
    fixedPath = `/${fixedPath}`;
  }

  const serverOrigin = API_BASE.replace(/\/api\/?$/, '');

  return `${serverOrigin}${fixedPath}`;
}

export default function SuperAdminLayout({ children }) {
  const {
    user,
    logout,
  } = useAuth();

  const navigate = useNavigate();

  const [
    sidebarCollapsed,
    setSidebarCollapsed,
  ] = useState(() => {
    return (
      localStorage.getItem(
        'superAdminSidebarCollapsed',
      ) === 'true'
    );
  });

  const avatarSrc = resolveProfileImage(
    user?.profileImage ||
    user?.profile_image ||
    user?.avatar ||
    '',
  );

  const displayUsername =
    String(
      user?.displayName ||
      user?.display_name ||
      user?.name ||
      user?.fullName ||
      user?.full_name ||
      user?.username ||
      'Super Admin',
    ).replace(/^@+/, '');

  const toggleSidebar = () => {
    setSidebarCollapsed((currentValue) => {
      const newValue = !currentValue;

      localStorage.setItem(
        'superAdminSidebarCollapsed',
        String(newValue),
      );

      return newValue;
    });
  };

  const handleLogout = () => {
    logout();

    navigate('/login', {
      replace: true,
    });
  };

  return (
    <div
      className={`admin-layout superadmin-layout ${
        sidebarCollapsed
          ? 'superadmin-sidebar-collapsed'
          : ''
      }`}
    >
      <SuperAdminSidebar
        sidebarCollapsed={sidebarCollapsed}
        toggleSidebar={toggleSidebar}
        onLogout={handleLogout}
      />

      <main className="admin-main">
        <SuperAdminHeader
          displayUsername={displayUsername}
          avatarSrc={avatarSrc}
          onLogout={handleLogout}
        />

        <div className="admin-content">
          {children}
        </div>
      </main>
    </div>
  );
}