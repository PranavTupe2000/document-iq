import React, { createContext, useContext, useState, useEffect } from 'react';
import { getMyProfileApi } from '../services/api';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [token,   setToken]   = useState(() => localStorage.getItem('diq-token'));
  const [user,    setUser]    = useState(null);
  const [loading, setLoading] = useState(true);

  // On mount or token change, fetch profile
  useEffect(() => {
    if (!token) {
      setUser(null);
      setLoading(false);
      return;
    }
    getMyProfileApi()
      .then(r => setUser(r.data))
      .catch(() => {
        // Token invalid — clear it
        localStorage.removeItem('diq-token');
        setToken(null);
        setUser(null);
      })
      .finally(() => setLoading(false));
  }, [token]);

  const login = (accessToken) => {
    localStorage.setItem('diq-token', accessToken);
    setToken(accessToken);
  };

  const logout = () => {
    localStorage.removeItem('diq-token');
    setToken(null);
    setUser(null);
  };

  const isAuthenticated = !!token && !!user;
  const isAdmin         = user?.role === 'ORG_ADMIN';

  return (
    <AuthContext.Provider value={{
      token, user, setUser,
      login, logout,
      isAuthenticated, isAdmin,
      loading
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}