import {
  useState,
} from 'react';

import {
  NavLink,
  useNavigate,
} from 'react-router-dom';

import { API_BASE } from '../../../config.js';
import { useAuth } from '../../../context/AuthContext';

import {
  FiActivity,
  FiBell,
  FiBook,
  FiDownload,
  FiGrid,
  FiLogOut,
  FiSearch,
  FiSettings,
  FiShield,
  FiSun,
  FiUsers,
} from 'react-icons/fi';

import RoleNotificationMenu
  from '../../../components/RoleNotificationMenu';

import HeaderProfileChip
  from '../../../components/HeaderProfileChip';

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


  /* =====================================================
     SIDEBAR STATE
  ===================================================== */

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


  /* =====================================================
     USER
  ===================================================== */

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


  /* =====================================================
     SIDEBAR TOGGLE
  ===================================================== */

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


  /* =====================================================
     LOGOUT
  ===================================================== */

  const handleLogout = () => {
    logout();

    navigate('/login', {
      replace: true,
    });
  };


  /* =====================================================
     MENU
  ===================================================== */

  const mainMenuItems = [
    {
      label: 'Dashboard',
      path: '/super-admin/dashboard',
      icon: FiGrid,
    },
    {
      label: 'User Management',
      path: '/super-admin/users',
      icon: FiUsers,
    },
    {
      label: 'Course Management',
      path: '/super-admin/courses',
      icon: FiBook,
    },
    {
      label: 'Modes Management',
      path: '/super-admin/mode',
      icon: FiSun,
    },
    {
      label: 'System Analytics',
      path: '/super-admin/analytics',
      icon: FiActivity,
    },
    {
      label: 'Announcements & Notifications',
      path: '/super-admin/announcements',
      icon: FiBell,
    },
    {
      label: 'Audit Logs',
      path: '/super-admin/audit-logs',
      icon: FiShield,
    },
    {
      label: 'Backup and Restore',
      path: '/super-admin/backup',
      icon: FiDownload,
    },
  ];


  const otherMenuItems = [
    {
      label: 'System Settings',
      path: '/super-admin/settings',
      icon: FiSettings,
    },
    {
      label: 'Security and Permissions',
      path: '/super-admin/security',
      icon: FiShield,
    },
  ];


  /* =====================================================
     SIDEBAR LINK
  ===================================================== */

  const renderMenuItem = (item) => {
    const Icon = item.icon;

    return (
      <NavLink
        key={item.path}
        to={item.path}
        className={({ isActive }) =>
          `sidebar-link ${
            isActive ? 'active' : ''
          }`
        }
        title={
          sidebarCollapsed
            ? item.label
            : undefined
        }
      >
        <Icon
          className="sidebar-icon"
          aria-hidden="true"
        />

        <span className="sidebar-nav-label">
          {item.label}
        </span>
      </NavLink>
    );
  };


  /* =====================================================
     PAGE
  ===================================================== */

  return (
    <div
      className={`admin-layout superadmin-layout ${
        sidebarCollapsed
          ? 'superadmin-sidebar-collapsed'
          : ''
      }`}
    >

      {/* ================================================
          SIDEBAR
      ================================================= */}

      <aside className="admin-sidebar">

        <div className="sidebar-brand">

          <button
            type="button"
            className="superadmin-logo-button"
            onClick={toggleSidebar}
            aria-label={
              sidebarCollapsed
                ? 'Expand Super Admin sidebar'
                : 'Collapse Super Admin sidebar'
            }
            aria-expanded={!sidebarCollapsed}
            title={
              sidebarCollapsed
                ? 'Expand sidebar'
                : 'Collapse sidebar'
            }
          >
            <img
              src="/images/logo_solo.png"
              alt="PuffyBrain logo"
            />
          </button>

          <span className="superadmin-brand-name">
            PuffyBrain
          </span>

        </div>


        <nav
          className="sidebar-menu"
          aria-label="Super Admin navigation"
        >

          <div className="menu-section">

            {mainMenuItems.map(
              renderMenuItem,
            )}

          </div>


          <div className="menu-section">

            {otherMenuItems.map(
              renderMenuItem,
            )}

          </div>

        </nav>


        <div className="sidebar-footer">

          <button
            type="button"
            onClick={handleLogout}
            className="logout-btn"
            title={
              sidebarCollapsed
                ? 'Logout'
                : undefined
            }
          >
            <FiLogOut aria-hidden="true" />

            <span className="sidebar-logout-label">
              Logout
            </span>
          </button>

        </div>

      </aside>


      {/* ================================================
          MAIN
      ================================================= */}

      <main className="admin-main">

        <header className="admin-header">

          <div className="admin-header-search">

            <FiSearch className="search-icon" />

            <input
              type="search"
              placeholder="Search system records..."
              aria-label="Search system records"
            />

          </div>


          <div className="admin-header-actions">

            <RoleNotificationMenu
              role="superAdmin"
            />


            <HeaderProfileChip
              username={displayUsername}
              accountLabel="Super admin account"
              avatarSrc={avatarSrc}
              profilePath="/super-admin/profile"
              menuItems={[
                {
                  label: 'Profile',
                  path: '/super-admin/profile',
                  icon: 'user',
                },
                {
                  label: 'Settings',
                  path: '/super-admin/settings',
                  icon: 'settings',
                },
              ]}
              onLogout={handleLogout}
            />

          </div>

        </header>


        <div className="admin-content">
          {children}
        </div>

      </main>

    </div>
  );
}
