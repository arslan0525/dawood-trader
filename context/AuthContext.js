import React, { createContext, useContext, useState, useEffect } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth, IS_DEMO } from '../services/firebase';
import { DEMO_USER, DEMO_ADMIN } from '../services/demoData';

const AuthContext = createContext();

export const ADMIN_EMAIL = 'admin@dawoodtrader.com';

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (IS_DEMO) {
      setLoading(false);
      return;
    }
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  const demoLogin = (email) => {
    if (email.trim().toLowerCase() === ADMIN_EMAIL) {
      setUser(DEMO_ADMIN);
    } else {
      setUser(DEMO_USER);
    }
  };

  const demoLogout = () => setUser(null);

  const isAdmin = user?.email === ADMIN_EMAIL;

  return (
    <AuthContext.Provider value={{ user, loading, isAdmin, IS_DEMO, demoLogin, demoLogout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
