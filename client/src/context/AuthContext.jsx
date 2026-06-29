// IMPORTACIONES
import { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

const sanitizeUser = (u) => {
  if (!u) return null;
  return {
    id: u.id,
    name: u.name,
    email: u.email,
    role: u.role,
    points: u.points,
    dni: u.dni,
    address: u.address,
    city: u.city,
    province: u.province,
    zip_code: u.zip_code,
    phone: u.phone
  };
};

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const stored = localStorage.getItem('vntg_user');
      return stored && stored !== 'undefined' ? JSON.parse(stored) : null;
    } catch { return null; }
  });
  const [token, setToken] = useState(() => localStorage.getItem('vntg_token'));

  useEffect(() => {
    if (user) {
      localStorage.setItem('vntg_user', JSON.stringify(sanitizeUser(user)));
    } else {
      localStorage.removeItem('vntg_user');
    }
  }, [user]);

  useEffect(() => {
    if (token) {
      localStorage.setItem('vntg_token', token);
    } else {
      localStorage.removeItem('vntg_token');
    }
  }, [token]);

  const login = (userData, jwtToken) => {
    setUser(userData);
    setToken(jwtToken);
  };

  const logout = async () => {
    try {
      await fetch(`${API_URL}/api/auth/logout`, {
        method: 'POST',
        credentials: 'include',
      });
    } catch { /* ignore */ }
    setUser(null);
    setToken(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
