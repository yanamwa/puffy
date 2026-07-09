import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Layout() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const isStudentDashboard = location.pathname.startsWith('/student');
  const isAdminArea = location.pathname.startsWith('/admin');
  const isProfessorArea = location.pathname.startsWith('/professor');

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  if (isStudentDashboard || isAdminArea || isProfessorArea) {
    return <Outlet />;
  }

  return (
    <div className="app-shell">
      <header className="topbar">
        <Link to="/" className="brand">PuffyBrain</Link>
        <nav className="topnav">
          {user ? (
            <>
              <span className="user-pill">{user.name} ({user.role})</span>
              <button onClick={handleLogout}>Logout</button>
            </>
          ) : (
            <NavLink to="/login">Login</NavLink>
          )}
        </nav>
      </header>

      <main className="page-content">
        <Outlet />
      </main>
    </div>
  );
}
