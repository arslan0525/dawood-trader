import React, { createContext, useContext, useState, useEffect } from 'react';
import { Platform } from 'react-native';
import {
  onAuthStateChanged, updateProfile, updatePassword,
  EmailAuthProvider, reauthenticateWithCredential,
  sendSignInLinkToEmail, isSignInWithEmailLink, signInWithEmailLink,
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db, IS_DEMO } from '../services/firebase';
import { DEMO_USER, DEMO_ADMIN } from '../services/demoData';

const AuthContext = createContext();
export const ADMIN_EMAIL = 'admin@dawoodtrader.com';

const SESS_KEY       = 'dt_demo_v1';
const ML_EMAIL_KEY   = 'dt_ml_email';
const AVATAR_KEY     = 'dt_avatar_v1';

function loadSession() {
  try { return typeof localStorage !== 'undefined' ? JSON.parse(localStorage.getItem(SESS_KEY) || 'null') : null; } catch { return null; }
}
function saveSession(u) {
  try { if (typeof localStorage !== 'undefined') { u ? localStorage.setItem(SESS_KEY, JSON.stringify(u)) : localStorage.removeItem(SESS_KEY); } } catch {}
}
function loadAvatar() {
  try { return typeof localStorage !== 'undefined' ? localStorage.getItem(AVATAR_KEY) || null : null; } catch { return null; }
}
function saveAvatar(url) {
  try { if (typeof localStorage !== 'undefined') { url ? localStorage.setItem(AVATAR_KEY, url) : localStorage.removeItem(AVATAR_KEY); } } catch {}
}

const PROD_URL = 'https://dawood-trader-kappa.vercel.app';

const MAGIC_LINK_SETTINGS = {
  url: (typeof window !== 'undefined' ? window.location.origin : PROD_URL) + '/',
  handleCodeInApp: true,
};

export function AuthProvider({ children }) {
  const [user,        setUser]       = useState(null);
  const [userRole,    setUserRole]   = useState(null); // 'owner' | 'salesman'
  const [loading,     setLoading]    = useState(true);
  const [magicSent,   setMagicSent]  = useState(false);
  const [avatar,      setAvatarState]= useState(loadAvatar);

  // Fetch role from Firestore users/{uid}
  const fetchRole = async (uid, email) => {
    // Legacy admin email always gets owner role
    if (email === ADMIN_EMAIL) { setUserRole('owner'); return; }
    try {
      const snap = await getDoc(doc(db, 'users', uid));
      if (snap.exists()) {
        setUserRole(snap.data().role || 'salesman');
      } else {
        setUserRole('salesman');
      }
    } catch {
      setUserRole('salesman');
    }
  };

  useEffect(() => {
    if (IS_DEMO) {
      const saved = loadSession();
      if (saved) {
        setUser(saved);
        setUserRole(saved.email === ADMIN_EMAIL ? 'owner' : 'salesman');
      }
      setLoading(false);
      return;
    }

    // Handle magic link completion on web
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      const href = window.location.href;
      if (isSignInWithEmailLink(auth, href)) {
        const savedEmail = localStorage.getItem(ML_EMAIL_KEY) || '';
        if (savedEmail) {
          signInWithEmailLink(auth, savedEmail, href)
            .then(() => {
              localStorage.removeItem(ML_EMAIL_KEY);
              window.history.replaceState({}, '', '/');
            })
            .catch(console.error);
        }
      }
    }

    const unsubscribe = onAuthStateChanged(auth, async (u) => {
      setUser(u);
      if (u) {
        await fetchRole(u.uid, u.email);
      } else {
        setUserRole(null);
      }
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  // ── Demo login ────────────────────────────────────────────
  const demoLogin = (email) => {
    const u = email.trim().toLowerCase() === ADMIN_EMAIL ? DEMO_ADMIN : DEMO_USER;
    setUser(u);
    setUserRole(u.email === ADMIN_EMAIL ? 'owner' : 'salesman');
    saveSession(u);
  };
  const demoLogout = () => { setUser(null); setUserRole(null); saveSession(null); };

  // ── Magic Link (email link auth) ──────────────────────────
  const sendMagicLink = async (email) => {
    if (!email?.trim()) throw new Error('Email likhein');
    if (IS_DEMO) {
      demoLogin(email);
      return;
    }
    await sendSignInLinkToEmail(auth, email.trim(), MAGIC_LINK_SETTINGS);
    try { localStorage.setItem(ML_EMAIL_KEY, email.trim()); } catch {}
    setMagicSent(true);
  };
  const resetMagicSent = () => setMagicSent(false);

  // Save user role to Firestore (called from SignupScreen)
  const saveUserRole = async (uid, role, displayName, email) => {
    await setDoc(doc(db, 'users', uid), {
      role,
      displayName: displayName || '',
      email: email || '',
      createdAt: Date.now(),
    });
    setUserRole(role);
  };

  // ── Profile updates ───────────────────────────────────────
  const updateDisplayName = async (newName) => {
    if (!newName.trim()) throw new Error('Name empty hai');
    if (IS_DEMO) {
      const updated = { ...user, displayName: newName.trim() };
      setUser(updated); saveSession(updated); return;
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

  const updateAvatar = (url) => {
    setAvatarState(url);
    saveAvatar(url);
    if (!IS_DEMO && auth.currentUser) {
      updateProfile(auth.currentUser, { photoURL: url }).catch(() => {});
    }
    if (IS_DEMO) {
      const updated = { ...user, photoURL: url };
      setUser(updated); saveSession(updated);
    }
  };

  const isAdmin  = userRole === 'owner' || user?.email === ADMIN_EMAIL;
  const avatarUrl = avatar || user?.photoURL || null;

  return (
    <AuthContext.Provider value={{
      user, loading, isAdmin, userRole, IS_DEMO,
      magicSent, sendMagicLink, resetMagicSent,
      demoLogin, demoLogout,
      updateDisplayName, changePassword, updateAvatar,
      saveUserRole,
      avatarUrl,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
