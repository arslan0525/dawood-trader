import React, { createContext, useContext, useState, useEffect } from 'react';
import { onAuthStateChanged, updateProfile, updatePassword, EmailAuthProvider, reauthenticateWithCredential } from 'firebase/auth';
import { auth, IS_DEMO } from '../services/firebase';
import { DEMO_USER, DEMO_ADMIN } from '../services/demoData';

const AuthContext = createContext();
export const ADMIN_EMAIL = 'admin@dawoodtrader.com';

// ── Demo session persistence via localStorage ──────────────
// Keeps user logged in across page refreshes in demo mode.
const SESS_KEY = 'dt_demo_v1';

function loadPersistedSession() {
  try {
    if (typeof localStorage !== 'undefined') {
      const raw = localStorage.getItem(SESS_KEY);
      return raw ? JSON.parse(raw) : null;
    }
  } catch {}
  return null;
}

function persistSession(user) {
  try {
    if (typeof localStorage !== 'undefined') {
      if (user) localStorage.setItem(SESS_KEY, JSON.stringify(user));
      else localStorage.removeItem(SESS_KEY);
    }
  } catch {}
}

export function AuthProvider({ children }) {
  const [user, setUser]       = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (IS_DEMO) {
      // Restore saved demo session so refresh doesn't log out the user
      const saved = loadPersistedSession();
      if (saved) setUser(saved);
      setLoading(false);
      return;
    }
    // Firebase handles its own persistence via browserLocalPersistence
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  const demoLogin = (email) => {
    const u = email.trim().toLowerCase() === ADMIN_EMAIL ? DEMO_ADMIN : DEMO_USER;
    setUser(u);
    persistSession(u);
  };

  const demoLogout = () => {
    setUser(null);
    persistSession(null);
  };

  const updateDisplayName = async (newName) => {
    if (!newName.trim()) throw new Error('Name empty hai');
    if (IS_DEMO) {
      const updated = { ...user, displayName: newName.trim() };
      setUser(updated);
      persistSession(updated);
      return;
    }
    await updateProfile(auth.currentUser, { displayName: newName.trim() });
    setUser(prev => ({ ...prev, displayName: newName.trim() }));
  };

  const changePassword = async (currentPassword, newPassword) => {
    if (IS_DEMO) throw new Error('Demo mode mein password change nahi hota');
    const credential = EmailAuthProvider.credential(auth.currentUser.email, currentPassword);
    await reauthenticateWithCredential(auth.currentUser, credential);
    await updatePassword(auth.currentUser, newPassword);
  };

  const isAdmin = user?.email === ADMIN_EMAIL;

  return (
    <AuthContext.Provider value={{ user, loading, isAdmin, IS_DEMO, demoLogin, demoLogout, updateDisplayName, changePassword }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
