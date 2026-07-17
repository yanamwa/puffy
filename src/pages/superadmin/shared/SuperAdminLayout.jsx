import { NavLink, useNavigate } from 'react-router-dom';
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
  FiSidebar,
  FiUsers,
} from 'react-icons/fi';
import RoleNotificationMenu from '../../../components/RoleNotificationMenu';
import HeaderProfileChip from '../../../components/HeaderProfileChip';
import '../../admin/shared/AdminLayout.css';

export default function SuperAdminLayout({ children }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const avatarSrc =
    user?.profileImage ||
    user?.profile_image ||
    '/images/temporaryimg.png';

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const mainMenuItems = [
    { label: 'Dashboard', path: '/super-admin/dashboard', icon: FiGrid },
    { label: 'User Management', path: '/super-admin/users', icon: FiUsers },
    { label: 'Course Management', path: '/super-admin/courses', icon: FiBook },
    { label: 'System Analytics', path: '/super-admin/analytics', icon: FiActivity },
    { label: 'Announcements', path: '/super-admin/announcements', icon: FiBell },
    { label: 'Audit Logs', path: '/super-admin/audit-logs', icon: FiShield },
    { label: 'Backup and Restore', path: '/super-admin/backup', icon: FiDownload },
  ];

  const otherMenuItems = [
    { label: 'System Settings', path: '/super-admin/settings', icon: FiSettings },
    { label: 'Security and Permissions', path: '/super-admin/security', icon: FiShield },
  ];

  return (
    <div className="admin-layout">
      <aside className="admin-sidebar">
        <button className="sidebar-toggle" type="button" aria-label="Toggle sidebar">
          <FiSidebar />
        </button>

        <div className="sidebar-brand">
          <img src="/images/logo_solo.png" alt="PuffyBrain" />
          <h2>PuffyBrain</h2>
        </div>

        <nav className="sidebar-menu">
          <div className="menu-section">
            <p className="menu-section-title">System</p>
            {mainMenuItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  className={({ isActive }) =>
                    `sidebar-link ${isActive ? 'active' : ''}`
                  }
                >
                  <Icon className="sidebar-icon" />
                  <span>{item.label}</span>
                </NavLink>
              );
            })}
          </div>

          <div className="menu-section">
            <p className="menu-section-title">Control</p>
            {otherMenuItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  className={({ isActive }) =>
                    `sidebar-link ${isActive ? 'active' : ''}`
                  }
                >
                  <Icon className="sidebar-icon" />
                  <span>{item.label}</span>
                </NavLink>
              );
            })}
          </div>
        </nav>

        <div className="sidebar-footer">
          <button onClick={handleLogout} className="logout-btn">
            <FiLogOut />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      <main className="admin-main">
        <header className="admin-header">
          <div className="admin-header-search">
            <FiSearch className="search-icon" />
            <input type="text" placeholder="Search system records..." />
          </div>
          <div className="admin-header-actions">
            <RoleNotificationMenu role="superAdmin" />
            <HeaderProfileChip
              username="superadmin"
              accountLabel="Super admin account"
              avatarSrc={avatarSrc}
              profilePath="/super-admin/profile"
              menuItems={[
                { label: 'Profile', path: '/super-admin/profile', icon: 'user' },
                { label: 'Settings', path: '/super-admin/settings', icon: 'settings' },
              ]}
              onLogout={handleLogout}
            />
          </div>
        </header>
        <div className="admin-content">{children}</div>
      </main>
    </div>
  );
}
