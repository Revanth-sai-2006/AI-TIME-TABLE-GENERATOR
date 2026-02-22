import { useState, useEffect, useCallback } from 'react';
import { AuthContext } from './authContextObject';
import api from '../services/api';
import toast from 'react-hot-toast';
import { queryClient } from '../main';

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(() => localStorage.getItem('tt_token'));
  const [loading, setLoading] = useState(true);

  // Set auth header on token change
  useEffect(() => {
    if (token) {
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      localStorage.setItem('tt_token', token);
    } else {
      delete api.defaults.headers.common['Authorization'];
      localStorage.removeItem('tt_token');
    }
  }, [token]);

  // Fetch current user on mount
  useEffect(() => {
    const initAuth = async () => {
      if (!token) { setLoading(false); return; }
      try {
        const res = await api.get('/auth/me');
        setUser(res.data.user);
      } catch {
        setToken(null);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };
    initAuth();
  }, []);

  const login = useCallback(async (email, password) => {
    const res = await api.post('/auth/login', { email, password });
    const { token: newToken, user: userData } = res.data;
    setToken(newToken);
    setUser(userData);
    api.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;
    localStorage.setItem('tt_token', newToken);
    return userData;
  }, []);

  const register = useCallback(async (data) => {
    const res = await api.post('/auth/register', data);
    const { token: newToken, user: userData } = res.data;
    setToken(newToken);
    setUser(userData);
    api.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;
    localStorage.setItem('tt_token', newToken);
    return userData;
  }, []);

  const logout = useCallback(() => {
    setToken(null);
    setUser(null);
    queryClient.clear(); // wipe all cached data so next user starts fresh
    toast.success('Logged out successfully');
  }, []);

  const updateUser = useCallback((updates) => {
    setUser((prev) => ({ ...prev, ...updates }));
  }, []);

  return (
    <AuthContext.Provider value={{ user, token, loading, login, register, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
}
