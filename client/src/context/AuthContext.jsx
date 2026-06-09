import { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();

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
      localStorage.setItem('vntg_user', JSON.stringify(user));
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

  const logout = () => {
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
