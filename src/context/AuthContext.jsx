import { createContext, useContext, useMemo, useState } from 'react';
import { API_BASE } from '../config.js';

const AuthContext = createContext(null);

function readStoredUser() {
  try {
    return JSON.parse(localStorage.getItem('puffy-user') || 'null');
  } catch {
    localStorage.removeItem('puffy-user');
    return null;
  }
}

function getSessionToken(data) {
  return data.token || data.accessToken || data.access_token || '';
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(readStoredUser);

  const saveSession = (data) => {
    const sessionUser = data.user || {};
    const token = getSessionToken(data);

    localStorage.setItem('puffy-token', token);
    localStorage.setItem('token', token);
    localStorage.setItem('authToken', token);
    localStorage.setItem('puffy-user', JSON.stringify(sessionUser));
    localStorage.setItem('user', JSON.stringify(sessionUser));
    localStorage.setItem('currentUser', JSON.stringify(sessionUser));
    localStorage.setItem(
      'user_id',
      String(sessionUser.userId || sessionUser.id || '')
    );
    localStorage.setItem('user_email', sessionUser.email || data.email || '');
    localStorage.setItem('email', sessionUser.email || data.email || '');
    localStorage.setItem('user_role', sessionUser.role || '');
    localStorage.setItem(
      'username',
      sessionUser.displayName ||
        sessionUser.display_name ||
        sessionUser.name ||
        data.username ||
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
    setUser(sessionUser);

    return sessionUser;
  };

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
    localStorage.removeItem('puffy-token');
    localStorage.removeItem('token');
    localStorage.removeItem('authToken');
    localStorage.removeItem('puffy-user');
    localStorage.removeItem('user');
    localStorage.removeItem('currentUser');
    localStorage.removeItem('user_id');
    localStorage.removeItem('user_email');
    localStorage.removeItem('email');
    localStorage.removeItem('user_role');
    localStorage.removeItem('username');
    localStorage.removeItem('year_level');
    localStorage.removeItem('section_name');
    setUser(null);
  };

  const value = useMemo(
    () => ({ user, login, logout, saveSession }),
    [user]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
