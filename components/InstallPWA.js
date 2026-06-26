import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { C } from '../constants/theme';

function useInstall() {
  const [ready,     setReady]     = useState(false);
  const [installed, setInstalled] = useState(false);
  const [isIOS,     setIsIOS]     = useState(false);

  useEffect(() => {
    if (Platform.OS !== 'web' || typeof window === 'undefined') return;

    // Already installed as PWA — hide button
    if (window.matchMedia?.('(display-mode: standalone)').matches ||
        window.navigator.standalone === true) {
      setInstalled(true);
      return;
    }

    const ua = navigator.userAgent || '';
    setIsIOS(/iphone|ipad|ipod/i.test(ua));

    // beforeinstallprompt already captured in index.html <script>
    if (window.__pwaPrompt) { setReady(true); return; }

    const onReady     = () => { if (window.__pwaPrompt) setReady(true); };
    const onInstalled = () => { setInstalled(true); setReady(false); window.__pwaPrompt = null; };

    window.addEventListener('pwa-installable',       onReady);
    window.addEventListener('pwa-installed',         onInstalled);
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      window.__pwaPrompt = e;
      setReady(true);
    });

    return () => {
      window.removeEventListener('pwa-installable', onReady);
      window.removeEventListener('pwa-installed',   onInstalled);
    };
  }, []);

  const install = async () => {
    const p = window.__pwaPrompt;
    if (!p) return;
    p.prompt();
    const { outcome } = await p.userChoice;
    if (outcome === 'accepted') {
      setInstalled(true);
      window.__pwaPrompt = null;
    }
    setReady(false);
  };

  return { ready, installed, isIOS, install };
}

/* ── Compact button for mobile header ── */
export default function InstallPWA({ compact = false }) {
  const { ready, installed, isIOS, install } = useInstall();
  const [iosHint, setIosHint] = useState(false);

  if (Platform.OS !== 'web') return null;
  if (installed) return null; // Already installed — hide

  // Chrome / Edge / Android — direct install in one click
  if (ready) {
    return compact ? (
      <TouchableOpacity style={s.cBtn} onPress={install} activeOpacity={0.8}>
        <Text style={s.cIco}>📲</Text>
        <Text style={s.cTxt}>Install</Text>
      </TouchableOpacity>
    ) : (
      <TouchableOpacity style={s.btn} onPress={install} activeOpacity={0.8}>
        <Text style={s.ico}>📲</Text>
        <Text style={s.txt}>Install App</Text>
      </TouchableOpacity>
    );
  }

  // iOS Safari — can't auto-install, show a simple 1-tap hint
  if (isIOS) {
    return (
      <View>
        <TouchableOpacity
          style={compact ? s.cBtn : s.btn}
          onPress={() => setIosHint(h => !h)}
          activeOpacity={0.8}
        >
          <Text style={compact ? s.cIco : s.ico}>📲</Text>
          <Text style={compact ? s.cTxt : s.txt}>Install</Text>
        </TouchableOpacity>
        {iosHint && (
          <View style={s.iosHint}>
            <Text style={s.iosHintTxt}>
              Safari mein {'⎙'} Share tap karein → "Add to Home Screen" select karein
            </Text>
          </View>
        )}
      </View>
    );
  }

  // Other browsers (Firefox etc.) — browser not supported, hide silently
  return null;
}

/* ── Slide-up banner (shows once automatically) ── */
export function InstallBanner() {
  const { ready, installed, install } = useInstall();
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (!ready || installed) return;
    try { if (localStorage.getItem('dt_banner_v4')) return; } catch {}
    const t = setTimeout(() => {
      try { localStorage.setItem('dt_banner_v4', '1'); } catch {}
      setShow(true);
    }, 2000);
    return () => clearTimeout(t);
  }, [ready, installed]);

  if (!show || installed || !ready || Platform.OS !== 'web') return null;

  return (
    <View style={s.banner}>
      <Text style={s.bannerTxt}>📲 Install Dawood Trader — home screen par add karein</Text>
      <TouchableOpacity style={s.bannerBtn} onPress={async () => { await install(); setShow(false); }}>
        <Text style={s.bannerBtnTxt}>Install</Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={() => setShow(false)} style={s.bannerClose}>
        <Text style={s.bannerCloseTxt}>✕</Text>
      </TouchableOpacity>
    </View>
  );
}

const s = StyleSheet.create({
  btn:  { flexDirection: 'row', alignItems: 'center', gap: 6,
          backgroundColor: 'rgba(37,99,235,0.1)', borderRadius: 8,
          paddingHorizontal: 12, paddingVertical: 7,
          borderWidth: 1, borderColor: 'rgba(37,99,235,0.25)' },
  ico:  { fontSize: 14 },
  txt:  { color: '#3b82f6', fontSize: 12, fontWeight: '700' },

  cBtn: { flexDirection: 'row', alignItems: 'center', gap: 5,
          backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 8,
          paddingHorizontal: 10, paddingVertical: 6,
          borderWidth: 1, borderColor: 'rgba(255,255,255,0.25)' },
  cIco: { fontSize: 13 },
  cTxt: { color: '#fff', fontSize: 11, fontWeight: '700' },

  iosHint: { position: 'absolute', top: 40, right: 0, zIndex: 999,
             backgroundColor: '#1e3a8a', borderRadius: 10, padding: 12,
             width: 220, shadowColor: '#000', shadowOpacity: 0.3,
             shadowOffset: { width: 0, height: 4 }, shadowRadius: 12 },
  iosHintTxt: { color: '#fff', fontSize: 12, lineHeight: 18 },

  banner: { position: Platform.OS === 'web' ? 'fixed' : 'absolute',
            bottom: 16, left: 12, right: 12, zIndex: 9999,
            backgroundColor: '#1e3a8a', borderRadius: 14, padding: 14,
            flexDirection: 'row', alignItems: 'center', gap: 10,
            shadowColor: '#000', shadowOpacity: 0.35,
            shadowOffset: { width: 0, height: 6 }, shadowRadius: 16 },
  bannerTxt:     { flex: 1, color: '#fff', fontSize: 12, fontWeight: '600' },
  bannerBtn:     { backgroundColor: '#3b82f6', borderRadius: 8,
                   paddingHorizontal: 14, paddingVertical: 7 },
  bannerBtnTxt:  { color: '#fff', fontWeight: '800', fontSize: 12 },
  bannerClose:   { padding: 4 },
  bannerCloseTxt:{ color: 'rgba(255,255,255,0.5)', fontSize: 16 },
});
