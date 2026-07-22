
import { useState } from 'react';
import {
  Link,
  NavLink,
  Outlet,
  useNavigate,
} from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  FiBell,
  FiBookOpen,
  FiGrid,
  FiLogOut,
  FiPlusCircle,
  FiSearch,
  FiSettings,
  FiUser,
  FiUsers,
} from 'react-icons/fi';
import RoleNotificationMenu from '../../components/RoleNotificationMenu';
import HeaderProfileChip from '../../components/HeaderProfileChip';
import './ProfessorLayout.css';

const menuItems = [
  {
    label: 'Dashboard',
    path: '/professor/dashboard',
    icon: FiGrid,
  },
  {
    label: 'Course Management',
    path: '/professor/courses',
    icon: FiBookOpen,
  },
  {
    label: 'Student Monitoring',
    path: '/professor/students',
    icon: FiUsers,
  },
  {
    label: 'Notifications',
    path: '/professor/notifications',
    icon: FiBell,
  },
  {
    label: 'Profile',
    path: '/professor/profile',
    icon: FiUser,
  },
  {
    label: 'Settings',
    path: '/professor/settings',
    icon: FiSettings,
  },
];

export default function ProfessorLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    return (
      localStorage.getItem('professorSidebarCollapsed') === 'true'
    );
  });

  const avatarSrc =
    user?.profileImage ||
    user?.profile_image ||
    '/images/temporaryimg.png';

  const displayUsername =
    user?.username ||
    user?.name ||
    user?.fullName ||
    user?.full_name ||
    'professor';

  const toggleSidebar = () => {
    setSidebarCollapsed((currentValue) => {
      const newValue = !currentValue;

      localStorage.setItem(
        'professorSidebarCollapsed',
        String(newValue),
      );

      return newValue;
    });
  };

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  return (
    <div
      className={`professor-layout ${
        sidebarCollapsed
          ? 'professor-sidebar-collapsed'
          : ''
      }`}
    >
      <aside className="professor-sidebar">
        <div className="professor-brand">
          <button
            type="button"
            className="professor-logo-button"
            onClick={toggleSidebar}
            aria-label={
              sidebarCollapsed
                ? 'Expand professor sidebar'
                : 'Collapse professor sidebar'
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

          <span className="professor-brand-name">
            PuffyBrain
          </span>
        </div>

        <nav
          className="professor-menu"
          aria-label="Professor navigation"
        >
          {menuItems.map((item) => {
            const Icon = item.icon;

            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  `professor-link ${
                    isActive ? 'active' : ''
                  }`
                }
                title={
                  sidebarCollapsed
                    ? item.label
                    : undefined
                }
              >
                <Icon aria-hidden="true" />

                <span className="professor-nav-label">
                  {item.label}
                </span>
              </NavLink>
            );
          })}
        </nav>

        <button
          type="button"
          className="professor-logout"
          onClick={handleLogout}
          title={
            sidebarCollapsed
              ? 'Logout'
              : undefined
          }
        >
          <FiLogOut aria-hidden="true" />

          <span className="professor-logout-label">
            Logout
          </span>
        </button>
      </aside>

      <main className="professor-main">
        <header className="professor-header">
          <label className="professor-search">
            <input
              type="search"
              placeholder="Search..."
              aria-label="Search professor pages"
            />

            <span
              className="professor-search-icon"
              aria-hidden="true"
            >
              <FiSearch />
            </span>
          </label>

          <div className="professor-header-actions">
            <RoleNotificationMenu role="professor" />

            <Link
              className="professor-create-course"
              to="/professor/courses/new"
            >
              <FiPlusCircle aria-hidden="true" />
              <span>Create Course</span>
            </Link>

            <HeaderProfileChip
              username={displayUsername}
              accountLabel="Professor account"
              avatarSrc={avatarSrc}
              profilePath="/professor/profile"
              menuItems={[
                {
                  label: 'Profile',
                  path: '/professor/profile',
                  icon: 'user',
                },
                {
                  label: 'Settings',
                  path: '/professor/settings',
                  icon: 'settings',
                },
              ]}
              onLogout={handleLogout}
            />
          </div>
        </header>

        <div className="professor-content">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
