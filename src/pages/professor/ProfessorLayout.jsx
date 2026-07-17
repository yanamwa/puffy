import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  FiBell,
  FiBookOpen,
  FiGrid,
  FiLogOut,
  FiSearch,
  FiSettings,
  FiSidebar,
  FiUser,
  FiUsers,
} from 'react-icons/fi';
import RoleNotificationMenu from '../../components/RoleNotificationMenu';
import HeaderProfileChip from '../../components/HeaderProfileChip';
import './ProfessorLayout.css';

const menuItems = [
  { label: 'Dashboard', path: '/professor/dashboard', icon: FiGrid },
  { label: 'Course Management', path: '/professor/courses', icon: FiBookOpen },
  { label: 'Student Monitoring', path: '/professor/students', icon: FiUsers },
  { label: 'Notifications', path: '/professor/notifications', icon: FiBell },
];

const otherItems = [
  { label: 'Profile', path: '/professor/profile', icon: FiUser },
  { label: 'Change Password', path: '/professor/change-password', icon: FiSettings },
];

export default function ProfessorLayout() {
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

  return (
    <div className="professor-layout">
      <aside className="professor-sidebar">
        <button className="professor-collapse" type="button" aria-label="Toggle sidebar">
          <FiSidebar />
        </button>

        <div className="professor-brand">
          <img src="/images/logo_solo.png" alt="PuffyBrain" />
          <h2>PuffyBrain</h2>
        </div>

        <nav className="professor-menu" aria-label="Professor sidebar">
          <div className="professor-menu-section">
            <p>Menu</p>
            {menuItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  className={({ isActive }) =>
                    `professor-link ${isActive ? 'active' : ''}`
                  }
                >
                  <Icon />
                  <span>{item.label}</span>
                </NavLink>
              );
            })}
          </div>

          <div className="professor-menu-section professor-others">
            <p>Others</p>
            {otherItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  className={({ isActive }) =>
                    `professor-link ${isActive ? 'active' : ''}`
                  }
                >
                  <Icon />
                  <span>{item.label}</span>
                </NavLink>
              );
            })}
          </div>
        </nav>

        <button className="professor-logout" type="button" onClick={handleLogout}>
          <FiLogOut />
          <span>Logout</span>
        </button>
      </aside>

      <main className="professor-main">
        <header className="professor-header">
          <label className="professor-search">
            <FiSearch />
            <input type="search" placeholder="Search..." />
          </label>

          <div className="professor-user">
            <RoleNotificationMenu role="professor" />
            <HeaderProfileChip
              username="professor"
              accountLabel="Professor account"
              avatarSrc={avatarSrc}
              profilePath="/professor/profile"
              menuItems={[
                { label: 'Profile', path: '/professor/profile', icon: 'user' },
                { label: 'Settings', path: '/professor/change-password', icon: 'settings' },
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
