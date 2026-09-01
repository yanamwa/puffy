import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { API_BASE } from '../config.js';
import { getUserRole, withNormalizedRole } from '../utils/roles.js';

const AuthContext = createContext(null);

const sessionStorageKeys = [
  'puffy-token',
  'token',
  'authToken',
  'puffy-user',
  'user',
  'currentUser',
  'user_id',
  'user_email',
  'email',
  'user_role',
  'username',
  'year_level',
  'section_name',
  'admin',
  'admin_id',
  'admin_email',
  'admin_username',
  'school_name',
];

function readStoredUser() {
  try {
    const storedUser = JSON.parse(localStorage.getItem('puffy-user') || 'null');
    return storedUser ? withNormalizedRole(storedUser) : null;
  } catch {
    localStorage.removeItem('puffy-user');
    return null;
  }
}

function readStoredToken() {
  return (
    localStorage.getItem('puffy-token') ||
    localStorage.getItem('token') ||
    localStorage.getItem('authToken') ||
    ''
  );
}

function getSessionToken(data) {
  return data.token || data.accessToken || data.access_token || '';
}

function clearStoredSession() {
  sessionStorageKeys.forEach((key) => {
    localStorage.removeItem(key);
    sessionStorage.removeItem(key);
  });
}

function writeUserSession(sessionUser, token = readStoredToken()) {
  const normalizedUser = withNormalizedRole(sessionUser);

  if (token) {
    localStorage.setItem('puffy-token', token);
    localStorage.setItem('token', token);
    localStorage.setItem('authToken', token);
  }

  localStorage.setItem('puffy-user', JSON.stringify(normalizedUser));
  localStorage.setItem('user', JSON.stringify(normalizedUser));
  localStorage.setItem('currentUser', JSON.stringify(normalizedUser));
  localStorage.setItem(
    'user_id',
    String(normalizedUser.userId || normalizedUser.id || '')
  );
  localStorage.setItem('user_email', normalizedUser.email || '');
  localStorage.setItem('email', normalizedUser.email || '');
  localStorage.setItem('user_role', getUserRole(normalizedUser));
  localStorage.setItem(
    'username',
    normalizedUser.displayName ||
      normalizedUser.display_name ||
      normalizedUser.name ||
      ''
  );
  localStorage.setItem(
    'year_level',
    normalizedUser.yearLevel || normalizedUser.year_level || ''
  );
  localStorage.setItem(
    'section_name',
    normalizedUser.sectionName || normalizedUser.section_name || ''
  );

  return normalizedUser;
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(readStoredUser);

  const saveSession = (data) => {
    const sessionUser = withNormalizedRole(
      data.user || {
        email: data.email,
        name: data.username,
        role: data.role,
      }
    );
    const token = getSessionToken(data);

    clearStoredSession();
    const normalizedUser = writeUserSession(sessionUser, token);
    setUser(normalizedUser);

    return normalizedUser;
  };

  const updateUser = (nextUser) => {
    if (!nextUser) {
      return null;
    }

    const storedUser = readStoredUser() || {};
    const normalizedNextUser = withNormalizedRole(nextUser);
    const storedRole = getUserRole(storedUser);
    const nextRole = getUserRole(normalizedNextUser);
    const baseUser =
      storedRole && nextRole && storedRole !== nextRole ? {} : storedUser;
    const updatedUser = writeUserSession({ ...baseUser, ...normalizedNextUser });
    setUser(updatedUser);

    window.dispatchEvent(
      new CustomEvent('puffy-user-updated', { detail: updatedUser })
    );

    return updatedUser;
  };

  useEffect(() => {
    const token = readStoredToken();

    if (!token) {
      if (readStoredUser()) {
        clearStoredSession();
        setUser(null);
      }

      return undefined;
    }

    let isMounted = true;

    async function refreshCurrentUser() {
      try {
        const response = await fetch(`${API_BASE}/users/me`, {
          credentials: 'include',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const data = await response.json().catch(() => ({}));

        if (!isMounted) {
          return;
        }

        if (!response.ok || !data.success || !data.user) {
          clearStoredSession();
          setUser(null);
          return;
        }

        const normalizedUser = writeUserSession(data.user, token);
        setUser(normalizedUser);
      } catch (error) {
        console.warn('Unable to refresh current user session.', error);
      }
    }

    refreshCurrentUser();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    const handleUserUpdated = (event) => {
      if (event.detail) {
        setUser(withNormalizedRole(event.detail));
      }
    };

    window.addEventListener('puffy-user-updated', handleUserUpdated);

    return () => {
      window.removeEventListener('puffy-user-updated', handleUserUpdated);
    };
  }, []);

  const login = async (email, password) => {
    const response = await fetch(`${API_BASE}/login`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok || !data.success) {
      throw new Error(data.message || 'Invalid credentials.');
    }

    return saveSession(data);
  };

  const logout = () => {
    clearStoredSession();
    setUser(null);
  };

  const value = useMemo(
    () => ({ user, login, logout, saveSession, updateUser }),
    [user]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
