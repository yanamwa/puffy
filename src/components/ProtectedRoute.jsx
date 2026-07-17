import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

function getHomePath(role) {
  if (role === 'super_admin') return '/super-admin';
  if (role === 'admin') return '/admin';
  if (role === 'professor') return '/professor';
  return '/student';
}

function getStoredUser() {
  try {
    return JSON.parse(localStorage.getItem('puffy-user') || 'null');
  } catch {
    return null;
  }
}

function isTemporaryExpired(user) {
  const isTemporary =
    user?.isTemporary === true ||
    user?.is_temporary === 1 ||
    user?.is_temporary === true;
  const expiresAt = user?.temporaryExpiresAt || user?.temporary_expires_at;

  if (!isTemporary || !expiresAt) return false;

  const date = new Date(expiresAt);
  return !Number.isNaN(date.getTime()) && date <= new Date();
}

function clearStoredAuth() {
  localStorage.removeItem('puffy-token');
  localStorage.removeItem('puffy-user');
  localStorage.removeItem('user_email');
  localStorage.removeItem('user_role');
  localStorage.removeItem('username');
  localStorage.removeItem('year_level');
  localStorage.removeItem('section_name');
}

export default function ProtectedRoute() {
  const { user } = useAuth();
  const storedUser = getStoredUser();
  const currentUser = storedUser || user;
  const location = useLocation();
  const role = currentUser?.role;
  const pathname = location.pathname;

  if (!currentUser) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  if (isTemporaryExpired(currentUser)) {
    clearStoredAuth();
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  if (pathname.startsWith('/super-admin') && role !== 'super_admin') {
    return <Navigate to={getHomePath(role)} replace />;
  }

  if (pathname.startsWith('/admin') && role !== 'admin') {
    return <Navigate to={getHomePath(role)} replace />;
  }

  if (pathname.startsWith('/professor') && role !== 'professor') {
    return <Navigate to={getHomePath(role)} replace />;
  }

  if (pathname.startsWith('/student') && role !== 'student') {
    return <Navigate to={getHomePath(role)} replace />;
  }

  return <Outlet />;
}
