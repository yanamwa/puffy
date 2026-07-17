import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import {
  FiGrid,
  FiUsers,
  FiBook,
  FiSun,
  FiBell,
  FiActivity,
  FiSearch,
  FiSidebar,
  FiLogOut,
} from 'react-icons/fi';
import RoleNotificationMenu from '../../../components/RoleNotificationMenu';
import HeaderProfileChip from '../../../components/HeaderProfileChip';
import './AdminLayout.css';

export default function AdminLayout({ children }) {
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
    { label: 'Dashboard', path: '/admin/dashboard', icon: FiGrid },
    { label: 'User Management', path: '/admin/users', icon: FiUsers },
    { label: 'Course Management', path: '/admin/courses', icon: FiBook },
    { label: 'Modes Management', path: '/admin/mode', icon: FiSun },
    { label: 'Notification Management', path: '/admin/notification', icon: FiBell },
    { label: 'Reports & Statistics', path: '/admin/reports', icon: FiActivity },
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
            <p className="menu-section-title">Menu</p>
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
            <input type="text" placeholder="Search..." />
          </div>
          <div className="admin-header-actions">
            <RoleNotificationMenu role="admin" />
            <HeaderProfileChip
              username="admin"
              accountLabel="Admin account"
              avatarSrc={avatarSrc}
              profilePath="/admin/profile"
              menuItems={[
                { label: 'Profile', path: '/admin/profile', icon: 'user' },
                { label: 'Settings', path: '/admin/settings', icon: 'settings' },
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
