import { NavLink } from 'react-router-dom';

import {
  FiActivity,
  FiBell,
  FiBook,
  FiDownload,
  FiGrid,
  FiLogOut,
  FiSettings,
  FiShield,
  FiSun,
  FiUsers,
} from 'react-icons/fi';

import './SuperAdminSidebar.css';

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
    path: '/super-admin/modes',
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

export default function SuperAdminSidebar({
  sidebarCollapsed,
  toggleSidebar,
  onLogout,
}) {
  const renderMenuItem = (item) => {
    const Icon = item.icon;

    return (
      <NavLink
        key={item.path}
        to={item.path}
        className={({ isActive }) =>
          `sidebar-link ${isActive ? 'active' : ''}`
        }
        title={sidebarCollapsed ? item.label : undefined}
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

  return (
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
          {mainMenuItems.map(renderMenuItem)}
        </div>

        <div className="menu-section">
          {otherMenuItems.map(renderMenuItem)}
        </div>
      </nav>

      <div className="sidebar-footer">
        <button
          type="button"
          onClick={onLogout}
          className="logout-btn"
          title={sidebarCollapsed ? 'Logout' : undefined}
        >
          <FiLogOut aria-hidden="true" />

          <span className="sidebar-logout-label">
            Logout
          </span>
        </button>
      </div>
    </aside>
  );
}