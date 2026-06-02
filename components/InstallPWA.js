import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  Modal, Platform, ScrollView, Animated,
} from 'react-native';
import { C } from '../constants/theme';

/* ─────────────────────────────────────────────────────────────
   InstallPWA — Real native install for Android/Desktop Chrome
   + step-by-step guide for iOS / Firefox fallback
───────────────────────────────────────────────────────────── */

function useInstall() {
  const [ready,     setReady]     = useState(false);
  const [installed, setInstalled] = useState(false);

  useEffect(() => {
    if (Platform.OS !== 'web' || typeof window === 'undefined') return;

    // Already running as installed PWA
    if (window.matchMedia('(display-mode: standalone)').matches ||
        window.navigator.standalone === true) {
      setInstalled(true); return;
    }

    // Check if already captured BEFORE React loaded (injected in HTML <script>)
    if (window.__pwaPrompt) { setReady(true); return; }

    // Listen for future events
    const onInstallable = () => { if (window.__pwaPrompt) setReady(true); };
    const onInstalled   = () => { setInstalled(true); setReady(false); window.__pwaPrompt = null; };

    window.addEventListener('pwa-installable', onInstallable);
    window.addEventListener('pwa-installed',   onInstalled);
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault(); window.__pwaPrompt = e; setReady(true);
    });

    return () => {
      window.removeEventListener('pwa-installable', onInstallable);
      window.removeEventListener('pwa-installed',   onInstalled);
    };
  }, []);

  const trigger = async () => {
    const p = window.__pwaPrompt;
    if (!p) return false;
    p.prompt();
    const { outcome } = await p.userChoice;
    if (outcome === 'accepted') { setInstalled(true); window.__pwaPrompt = null; }
    setReady(false);
    return outcome === 'accepted';
  };

  return { ready, installed, trigger };
}

/* ── Auto-popup banner (slides up once when prompt is ready) ── */
export function InstallBanner() {
  const { ready, installed, trigger } = useInstall();
  const [visible, setVisible]         = useState(false);
  const slideY                        = useRef(new Animated.Value(140)).current;

  useEffect(() => {
    if (!ready || installed || Platform.OS !== 'web') return;
    try { if (localStorage.getItem('dt_banner_v2')) return; } catch {}

    const t = setTimeout(() => {
      try { localStorage.setItem('dt_banner_v2', '1'); } catch {}
      setVisible(true);
      Animated.spring(slideY, { toValue: 0, useNativeDriver: true, tension: 70, friction: 11 }).start();
    }, 1500);
    return () => clearTimeout(t);
  }, [ready, installed]);

  const dismiss = () => {
    Animated.timing(slideY, { toValue: 140, duration: 200, useNativeDriver: true }).start(() => setVisible(false));
  };

  if (!visible || installed || !ready || Platform.OS !== 'web') return null;

  return (
    <Animated.View style={[b.wrap, { transform: [{ translateY: slideY }] }]}>
      <View style={b.card}>
        <View style={b.logo}>
          <Text style={b.logoD}>D</Text><Text style={b.logoT}>T</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={b.title}>Install Dawood Trader</Text>
          <Text style={b.desc}>Home screen par add karein — faster &amp; offline</Text>
        </View>
        <TouchableOpacity style={b.later} onPress={dismiss}>
          <Text style={b.laterTxt}>Baad mein</Text>
        </TouchableOpacity>
        <TouchableOpacity style={b.btn} onPress={async () => { const ok = await trigger(); if (ok) dismiss(); }}>
          <Text style={b.btnTxt}>📲 Install</Text>
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
}

const b = StyleSheet.create({
  wrap: {
    position:  Platform.OS === 'web' ? 'fixed' : 'absolute',
    bottom: 16, left: 12, right: 12, zIndex: 9999,
  },
  card: {
    backgroundColor: '#0f172a', borderRadius: 18, padding: 14,
    flexDirection: 'row', alignItems: 'center', gap: 10,
    shadowColor: '#000', shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.4, shadowRadius: 24, elevation: 16,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)',
  },
  logo:   { width: 46, height: 46, borderRadius: 12, backgroundColor: C.primary, justifyContent: 'center', alignItems: 'center', flexDirection: 'row' },
  logoD:  { color: '#fff', fontSize: 18, fontWeight: '900', letterSpacing: -1 },
  logoT:  { color: 'rgba(255,255,255,0.7)', fontSize: 18, fontWeight: '900', letterSpacing: -1 },
  title:  { color: '#fff', fontSize: 13, fontWeight: '800', marginBottom: 1 },
  desc:   { color: 'rgba(255,255,255,0.5)', fontSize: 10, lineHeight: 14 },
  later:  { paddingHorizontal: 8, paddingVertical: 8 },
  laterTxt:{ color: 'rgba(255,255,255,0.4)', fontSize: 11, fontWeight: '600' },
  btn:    { backgroundColor: C.primary, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 8 },
  btnTxt: { color: '#fff', fontWeight: '800', fontSize: 12 },
});

/* ── Header button ─────────────────────────────────────────── */
export default function InstallPWA({ compact = false }) {
  const { ready, installed, trigger } = useInstall();
  const [showGuide, setShowGuide]     = useState(false);
  const [isIOS, setIsIOS]             = useState(false);

  useEffect(() => {
    if (Platform.OS !== 'web' || typeof navigator === 'undefined') return;
    setIsIOS(/iphone|ipad|ipod/i.test(navigator.userAgent));
  }, []);

  if (Platform.OS !== 'web') return null;
  if (installed) return (
    <View style={compact ? ip.cInstalled : ip.installed}>
      <Text style={compact ? ip.cInstalledTxt : ip.installedTxt}>✓ Installed</Text>
    </View>
  );

  const handlePress = async () => {
    if (ready && window.__pwaPrompt) { await trigger(); }
    else { setShowGuide(true); }
  };

  // ── Guide Modal ──
  const Guide = () => (
    <Modal visible={showGuide} transparent animationType="slide" onRequestClose={() => setShowGuide(false)}>
      <View style={ip.overlay}>
        <View style={ip.modal}>
          <View style={ip.mHead}>
            <View style={ip.mLogo}>
              <Text style={ip.mLogoD}>D</Text><Text style={ip.mLogoT}>T</Text>
            </View>
            <Text style={ip.mTitle}>Install Dawood Trader</Text>
            <TouchableOpacity onPress={() => setShowGuide(false)} style={ip.mClose}>
              <Text style={ip.mCloseTxt}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={{ padding: 20 }} showsVerticalScrollIndicator={false}>
            {isIOS ? (
              <>
                <Text style={ip.guideTitle}>📱 iPhone / iPad (Safari)</Text>
                {[
                  ['1','⬆️','Safari mein Share button tap karein (neeche)'],
                  ['2','➕','"Add to Home Screen" select karein'],
                  ['3','✅','Top right mein "Add" tap karein'],
                ].map(([n,ic,txt]) => (
                  <View key={n} style={ip.step}>
                    <View style={ip.sNum}><Text style={ip.sNumTxt}>{n}</Text></View>
                    <Text style={ip.sIco}>{ic}</Text>
                    <Text style={ip.sTxt}>{txt}</Text>
                  </View>
                ))}
              </>
            ) : (
              <>
                <Text style={ip.guideTitle}>🤖 Android Chrome</Text>
                {[
                  ['1','⋮', 'Chrome mein 3 dots menu tap karein'],
                  ['2','➕','"Add to Home screen" tap karein'],
                  ['3','✅','"Add" button press karein'],
                ].map(([n,ic,txt]) => (
                  <View key={n} style={ip.step}>
                    <View style={ip.sNum}><Text style={ip.sNumTxt}>{n}</Text></View>
                    <Text style={ip.sIco}>{ic}</Text>
                    <Text style={ip.sTxt}>{txt}</Text>
                  </View>
                ))}
                <Text style={[ip.guideTitle, { marginTop: 20 }]}>🖥️ Desktop (Chrome / Edge)</Text>
                {[
                  ['1','📍','Address bar mein ⊕ install icon dekhein'],
                  ['2','🖱️','"Install Dawood Trader" click karein'],
                  ['3','✅','Popup mein "Install" click karein'],
                ].map(([n,ic,txt]) => (
                  <View key={n} style={ip.step}>
                    <View style={ip.sNum}><Text style={ip.sNumTxt}>{n}</Text></View>
                    <Text style={ip.sIco}>{ic}</Text>
                    <Text style={ip.sTxt}>{txt}</Text>
                  </View>
                ))}
              </>
            )}

            <View style={ip.benefits}>
              <Text style={ip.benefitsTitle}>Install kyun karein?</Text>
              {['⚡ Faster — browser overhead nahi','📱 Home screen icon milega','📶 Offline bhi kaam karega','🚀 Native app jaisi feel'].map(b=>(
                <View key={b} style={ip.bRow}><Text style={ip.bTxt}>{b}</Text></View>
              ))}
            </View>
          </ScrollView>

          <TouchableOpacity style={ip.doneBtn} onPress={() => setShowGuide(false)}>
            <Text style={ip.doneTxt}>Theek hai!</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );

  if (compact) return (
    <>
      <TouchableOpacity style={[ip.cBtn, ready && ip.cBtnReady]} onPress={handlePress} activeOpacity={0.8}>
        <Text style={ip.cIco}>📲</Text>
        <Text style={ip.cTxt}>Install</Text>
        {ready && <View style={ip.cDot} />}
      </TouchableOpacity>
      <Guide />
    </>
  );

  return (
    <>
      <TouchableOpacity style={[ip.btn, ready && ip.btnReady]} onPress={handlePress} activeOpacity={0.8}>
        <Text style={ip.btnIco}>📲</Text>
        <Text style={ip.btnTxt}>Install App</Text>
        {ready && <View style={ip.dot} />}
      </TouchableOpacity>
      <Guide />
    </>
  );
}

const ip = StyleSheet.create({
  btn:     { flexDirection:'row', alignItems:'center', gap:6, backgroundColor:'rgba(37,99,235,0.1)', borderRadius:8, paddingHorizontal:12, paddingVertical:7, borderWidth:1, borderColor:'rgba(37,99,235,0.22)', position:'relative' },
  btnReady:{ backgroundColor:'rgba(37,99,235,0.18)', borderColor:C.primary },
  btnIco:  { fontSize:14 },
  btnTxt:  { color:'#3b82f6', fontSize:12, fontWeight:'700' },
  dot:     { position:'absolute', top:4, right:4, width:7, height:7, borderRadius:4, backgroundColor:'#22c55e' },

  installed:    { paddingHorizontal:10, paddingVertical:6, backgroundColor:'#f0fdf4', borderRadius:8, borderWidth:1, borderColor:'#bbf7d0' },
  installedTxt: { color:'#15803d', fontSize:11, fontWeight:'700' },

  cBtn:    { flexDirection:'row', alignItems:'center', gap:5, backgroundColor:'rgba(255,255,255,0.14)', borderRadius:8, paddingHorizontal:10, paddingVertical:6, borderWidth:1, borderColor:'rgba(255,255,255,0.22)', position:'relative' },
  cBtnReady:{ borderColor:'rgba(34,197,94,0.5)', backgroundColor:'rgba(34,197,94,0.12)' },
  cIco:    { fontSize:13 },
  cTxt:    { color:'#fff', fontSize:11, fontWeight:'700' },
  cDot:    { position:'absolute', top:3, right:3, width:6, height:6, borderRadius:3, backgroundColor:'#22c55e' },
  cInstalled:    { paddingHorizontal:8, paddingVertical:5, backgroundColor:'rgba(34,197,94,0.15)', borderRadius:7 },
  cInstalledTxt: { color:'#4ade80', fontSize:10, fontWeight:'700' },

  overlay: { flex:1, backgroundColor:'rgba(0,0,0,0.55)', justifyContent:'flex-end' },
  modal:   { backgroundColor:'#fff', borderTopLeftRadius:24, borderTopRightRadius:24, maxHeight:'88%', overflow:'hidden' },
  mHead:   { flexDirection:'row', alignItems:'center', gap:12, padding:20, borderBottomWidth:1, borderBottomColor:'#f1f5f9' },
  mLogo:   { width:40, height:40, borderRadius:10, backgroundColor:C.primary, justifyContent:'center', alignItems:'center', flexDirection:'row' },
  mLogoD:  { color:'#fff', fontSize:16, fontWeight:'900', letterSpacing:-1 },
  mLogoT:  { color:'rgba(255,255,255,0.65)', fontSize:16, fontWeight:'900', letterSpacing:-1 },
  mTitle:  { flex:1, fontSize:16, fontWeight:'800', color:'#0f172a' },
  mClose:  { padding:4 },
  mCloseTxt:{ fontSize:18, color:'#94a3b8' },

  guideTitle:{ fontSize:13, fontWeight:'800', color:'#0f172a', marginBottom:12 },
  step:    { flexDirection:'row', alignItems:'center', gap:10, marginBottom:12 },
  sNum:    { width:24, height:24, borderRadius:12, backgroundColor:C.primary, justifyContent:'center', alignItems:'center' },
  sNumTxt: { color:'#fff', fontSize:11, fontWeight:'800' },
  sIco:    { fontSize:20, width:28, textAlign:'center' },
  sTxt:    { flex:1, fontSize:13, color:'#334155', lineHeight:19 },

  benefits:     { backgroundColor:'#f8fafc', borderRadius:12, padding:14, marginTop:4 },
  benefitsTitle:{ fontSize:12, fontWeight:'700', color:'#0f172a', marginBottom:10 },
  bRow:    { flexDirection:'row', marginBottom:7 },
  bTxt:    { fontSize:12, color:'#475569', lineHeight:18 },

  doneBtn: { margin:16, marginTop:4, backgroundColor:C.primary, borderRadius:14, paddingVertical:15, alignItems:'center' },
  doneTxt: { color:'#fff', fontWeight:'800', fontSize:15 },
});
