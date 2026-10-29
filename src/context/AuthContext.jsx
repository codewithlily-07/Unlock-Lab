import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../lib/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUser();
  }, []);

  async function loadUser() {
    setLoading(true);
    try {
      const res = await api.getCurrentUser();
      if (res?.user) {
        setCurrentUser(res.user);
      } else {
        setCurrentUser(null);
      }
    } catch (e) {
      setCurrentUser(null);
    } finally {
      setLoading(false);
    }
  }

  async function login(email, password) {
    try {
      const res = await api.login(email, password);
      if (res?.user) {
        setCurrentUser(res.user);
        return { success: true };
      }
      return { success: false, error: 'Login failed' };
    } catch (err) {
      return { success: false, error: err.message || 'Invalid credentials' };
    }
  }

  async function register(userData) {
    try {
      const res = await api.register(userData);
      if (res?.user) {
        setCurrentUser(res.user);
        return { success: true };
      }
      return { success: false, error: 'Registration failed' };
    } catch (err) {
      return { success: false, error: err.message || 'Registration failed' };
    }
  }

  async function logout() {
    try {
      await api.logout();
    } finally {
      setCurrentUser(null);
    }
  }

  const value = {
    currentUser,
    profile: currentUser,
    loading,
    isAuthenticated: Boolean(currentUser),
    isAdmin: currentUser?.role === 'admin',
    isManager: currentUser?.role === 'admin',
    isOwner: currentUser?.role === 'admin',
    isVerified: Boolean(currentUser?.is_active),
    login,
    register,
    logout,
    refreshUser: loadUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
}
