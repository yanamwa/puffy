import { createContext, useContext, useMemo, useState } from 'react';
import { API_BASE } from '../config.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem('puffy-user');
    return savedUser ? JSON.parse(savedUser) : null;
  });

  const saveSession = (data) => {
    const sessionUser = data.user || {};

    localStorage.setItem('puffy-token', data.token || '');
    localStorage.setItem('puffy-user', JSON.stringify(sessionUser));
    localStorage.setItem('user_email', sessionUser.email || data.email || '');
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
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || 'Invalid credentials.');
    }

    return saveSession(data);
  };

  const logout = () => {
    localStorage.removeItem('puffy-token');
    localStorage.removeItem('puffy-user');
    localStorage.removeItem('user_email');
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
