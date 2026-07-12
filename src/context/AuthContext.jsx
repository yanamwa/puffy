import { createContext, useContext, useMemo, useState } from 'react';
import { API_BASE } from '../config.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem('puffy-user');
    return savedUser ? JSON.parse(savedUser) : null;
  });

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

    localStorage.setItem('puffy-token', data.token);
    localStorage.setItem('puffy-user', JSON.stringify(data.user));
    localStorage.setItem('user_email', data.user?.email || data.email || '');
    localStorage.setItem('user_role', data.user?.role || '');
    localStorage.setItem(
      'username',
      data.user?.displayName || data.user?.display_name || data.user?.name || ''
    );
    localStorage.setItem('year_level', data.user?.yearLevel || data.user?.year_level || '');
    localStorage.setItem(
      'section_name',
      data.user?.sectionName || data.user?.section_name || ''
    );
    setUser(data.user);
    return data.user;
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

  const value = useMemo(() => ({ user, login, logout }), [user]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
