import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { API_BASE } from '../config.js';

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
    return JSON.parse(localStorage.getItem('puffy-user') || 'null');
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
  if (token) {
    localStorage.setItem('puffy-token', token);
    localStorage.setItem('token', token);
    localStorage.setItem('authToken', token);
  }

  localStorage.setItem('puffy-user', JSON.stringify(sessionUser));
  localStorage.setItem('user', JSON.stringify(sessionUser));
  localStorage.setItem('currentUser', JSON.stringify(sessionUser));
  localStorage.setItem(
    'user_id',
    String(sessionUser.userId || sessionUser.id || '')
  );
  localStorage.setItem('user_email', sessionUser.email || '');
  localStorage.setItem('email', sessionUser.email || '');
  localStorage.setItem('user_role', sessionUser.role || '');
  localStorage.setItem(
    'username',
    sessionUser.displayName ||
      sessionUser.display_name ||
      sessionUser.name ||
      ''
  );
  localStorage.setItem(
    'year_level',
    sessionUser.yearLevel || sessionUser.year_level || ''
  );
  localStorage.setItem(
    'section_name',
    sessionUser.sectionName || sessionUser.section_name || ''
  );
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(readStoredUser);

  const saveSession = (data) => {
    const sessionUser = data.user || {};
    const token = getSessionToken(data);

    clearStoredSession();
    writeUserSession(sessionUser, token);
    setUser(sessionUser);

    return sessionUser;
  };

  const updateUser = (nextUser) => {
    if (!nextUser) {
      return null;
    }

    const storedUser = readStoredUser() || {};
    const storedRole = storedUser.role || storedUser.userRole || storedUser.user_role;
    const nextRole = nextUser.role || nextUser.userRole || nextUser.user_role;
    const baseUser =
      storedRole && nextRole && storedRole !== nextRole ? {} : storedUser;
    const updatedUser = { ...baseUser, ...nextUser };
    writeUserSession(updatedUser);
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

        writeUserSession(data.user, token);
        setUser(data.user);
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
        setUser(event.detail);
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
