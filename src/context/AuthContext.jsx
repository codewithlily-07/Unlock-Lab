import React, { createContext, useContext, useState, useEffect } from 'react';
import { api, isSupabaseConfigured, supabase } from '../lib/supabase';
import { DEMO_PERSONAS } from '../lib/constants';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  // Default to Priya Patel (Student 1) so judges land on a fully functional, trained persona immediately
  const [currentUser, setCurrentUser] = useState(DEMO_PERSONAS[4]);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProfile(currentUser.id);
  }, [currentUser.id]);

  async function loadProfile(userId) {
    setLoading(true);
    try {
      const p = await api.getProfile(userId);
      setProfile(p || currentUser);
    } catch (e) {
      setProfile(currentUser);
    } finally {
      setLoading(false);
    }
  }

  // Switch demo persona instantly (for hackathon judges)
  function switchPersona(personaId) {
    const persona = DEMO_PERSONAS.find((p) => p.id === personaId);
    if (persona) {
      setCurrentUser(persona);
      loadProfile(persona.id);
    }
  }

  async function login(email, password) {
    const profiles = await api.getProfiles();
    const matched = profiles.find((p) => p.email.toLowerCase() === email.toLowerCase());
    if (matched) {
      setCurrentUser(matched);
      await loadProfile(matched.id);
      return { success: true };
    }
    return { success: false, error: 'Invalid demo credentials. Use Demo@12345 or select a 1-click persona.' };
  }

  async function register(userData) {
    const newProfile = {
      id: `usr-${Date.now()}`,
      full_name: userData.fullName,
      email: userData.email,
      role: userData.role || 'user',
      organization: userData.organization || 'Apex Institute of Technology',
      department: userData.department || 'ECE',
      year_or_designation: userData.yearOrDesignation || 'Student',
      phone: userData.phone || '',
      is_verified: userData.role === 'admin' ? true : false,
      is_suspended: false,
      created_at: new Date().toISOString(),
    };
    setCurrentUser(newProfile);
    setProfile(newProfile);
    return { success: true };
  }

  function logout() {
    // Default back to first student
    setCurrentUser(DEMO_PERSONAS[4]);
  }

  const value = {
    currentUser,
    profile,
    loading,
    switchPersona,
    login,
    register,
    logout,
    refreshUser: () => loadProfile(currentUser.id),
    isOwner: profile?.role === 'owner' || profile?.role === 'admin',
    isManager: profile?.role === 'manager' || profile?.role === 'owner' || profile?.role === 'admin',
    isAdmin: profile?.role === 'admin',
    isVerified: Boolean(profile?.is_verified),
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
}

