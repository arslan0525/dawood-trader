import React, { useState, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, Modal,
  Platform, ScrollView,
} from 'react-native';
import { C } from '../constants/theme';

export default function InstallPWA({ compact = false }) {
  const [prompt,       setPrompt]       = useState(null);
  const [installed,    setInstalled]    = useState(false);
  const [showModal,    setShowModal]    = useState(false);
  const [isIOS,        setIsIOS]        = useState(false);
  const [isAndroid,    setIsAndroid]    = useState(false);
  const [isDesktop,    setIsDesktop]    = useState(false);
  const [alreadyOpen,  setAlreadyOpen]  = useState(false);

  useEffect(() => {
    if (Platform.OS !== 'web' || typeof window === 'undefined') return;

    // Detect platform
    const ua = navigator.userAgent || '';
    const isIos     = /iphone|ipad|ipod/i.test(ua);
    const isAndrd   = /android/i.test(ua);
    const isDsk     = !isIos && !isAndrd;
    setIsIOS(isIos);
    setIsAndroid(isAndrd);
    setIsDesktop(isDsk);

    // Already running as installed PWA
    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      window.navigator.standalone === true;
    if (isStandalone) { setInstalled(true); return; }

    // Capture install prompt (Android & desktop Chrome/Edge)
    const handlePrompt = (e) => { e.preventDefault(); setPrompt(e); };
    window.addEventListener('beforeinstallprompt', handlePrompt);
    window.addEventListener('appinstalled', () => setInstalled(true));

    return () => {
      window.removeEventListener('beforeinstallprompt', handlePrompt);
    };
  }, []);

  // Don't show on native
  if (Platform.OS !== 'web') return null;
  // Don't show if already installed as PWA
  if (installed) return null;

  const triggerInstall = async () => {
    if (prompt) {
      // Native install prompt available (Android / desktop Chrome)
      prompt.prompt();
      const { outcome } = await prompt.userChoice;
      if (outcome === 'accepted') setInstalled(true);
      setPrompt(null);
    } else {
      // Show manual instructions (iOS, Firefox, etc.)
      setShowModal(true);
    }
  };

  const InstructionsModal = () => (
    <Modal visible={showModal} transparent animationType="fade" onRequestClose={() => setShowModal(false)}>
      <TouchableOpacity
        style={ip.overlay}
        activeOpacity={1}
        onPress={() => setShowModal(false)}
      >
        <TouchableOpacity activeOpacity={1} style={ip.modalCard} onPress={() => {}}>
          <View style={ip.modalHeader}>
            <Text style={ip.modalTitle}>📲 Install Dawood Trader</Text>
            <TouchableOpacity onPress={() => setShowModal(false)} style={ip.closeBtn}>
              <Text style={ip.closeTxt}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView>
            {isIOS && (
              <View style={ip.section}>
                <Text style={ip.sectionTitle}>iPhone / iPad (Safari)</Text>
                {[
                  { step: '1', icon: '⬆️', text: 'Tap the Share button at the bottom of Safari' },
                  { step: '2', icon: '➕', text: 'Scroll down and tap "Add to Home Screen"'       },
                  { step: '3', icon: '✅', text: 'Tap "Add" in the top right corner'              },
                ].map(s => (
                  <View key={s.step} style={ip.step}>
                    <View style={ip.stepNum}><Text style={ip.stepNumTxt}>{s.step}</Text></View>
                    <Text style={ip.stepIcon}>{s.icon}</Text>
                    <Text style={ip.stepTxt}>{s.text}</Text>
                  </View>
                ))}
              </View>
            )}

            {isAndroid && (
              <View style={ip.section}>
                <Text style={ip.sectionTitle}>Android (Chrome)</Text>
                {[
                  { step: '1', icon: '⋮',  text: 'Tap the menu (3 dots) in Chrome'   },
                  { step: '2', icon: '➕', text: 'Tap "Add to Home screen"'           },
                  { step: '3', icon: '✅', text: 'Tap "Add" to confirm installation'  },
                ].map(s => (
                  <View key={s.step} style={ip.step}>
                    <View style={ip.stepNum}><Text style={ip.stepNumTxt}>{s.step}</Text></View>
                    <Text style={ip.stepIcon}>{s.icon}</Text>
                    <Text style={ip.stepTxt}>{s.text}</Text>
                  </View>
                ))}
              </View>
            )}

            {isDesktop && (
              <View style={ip.section}>
                <Text style={ip.sectionTitle}>Desktop (Chrome / Edge)</Text>
                {[
                  { step: '1', icon: '📍', text: 'Look for the install icon (⊕) in the address bar'    },
                  { step: '2', icon: '🖱️', text: 'Click "Install Dawood Trader"'                        },
                  { step: '3', icon: '✅', text: 'Click "Install" in the popup'                          },
                ].map(s => (
                  <View key={s.step} style={ip.step}>
                    <View style={ip.stepNum}><Text style={ip.stepNumTxt}>{s.step}</Text></View>
                    <Text style={ip.stepIcon}>{s.icon}</Text>
                    <Text style={ip.stepTxt}>{s.text}</Text>
                  </View>
                ))}
                <View style={ip.note}>
                  <Text style={ip.noteTxt}>
                    💡 Note: Firefox does not support PWA installation.
                    Use Chrome or Edge for the best experience.
                  </Text>
                </View>
              </View>
            )}

            <View style={ip.benefits}>
              <Text style={ip.benefitsTitle}>Why install?</Text>
              {[
                '⚡ Faster startup — no browser overhead',
                '📱 Native app feel on home screen',
                '🔔 Works offline for viewing data',
                '🚀 No need to open browser every time',
              ].map(b => <Text key={b} style={ip.benefitTxt}>{b}</Text>)}
            </View>
          </ScrollView>

          <TouchableOpacity style={ip.doneBtn} onPress={() => setShowModal(false)}>
            <Text style={ip.doneTxt}>Got it!</Text>
          </TouchableOpacity>
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );

  if (compact) {
    return (
      <>
        <TouchableOpacity style={ip.compactBtn} onPress={triggerInstall} activeOpacity={0.8}>
          <Text style={ip.compactIcon}>📲</Text>
          <Text style={ip.compactTxt}>Install</Text>
        </TouchableOpacity>
        <InstructionsModal />
      </>
    );
  }

  return (
    <>
      <TouchableOpacity style={ip.btn} onPress={triggerInstall} activeOpacity={0.8}>
        <Text style={ip.btnIcon}>📲</Text>
        <Text style={ip.btnTxt}>Install App</Text>
        {prompt && <View style={ip.readyDot} />}
      </TouchableOpacity>
      <InstructionsModal />
    </>
  );
}

const ip = StyleSheet.create({
  /* Main button */
  btn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: 'rgba(37,99,235,0.12)',
    borderRadius: 8, paddingHorizontal: 12, paddingVertical: 7,
    borderWidth: 1, borderColor: 'rgba(37,99,235,0.3)',
    position: 'relative',
  },
  btnIcon: { fontSize: 15 },
  btnTxt:  { color: '#93c5fd', fontSize: 12, fontWeight: '700' },
  readyDot:{ position: 'absolute', top: 4, right: 4, width: 7, height: 7, borderRadius: 4, backgroundColor: '#22c55e' },

  /* Compact (for mobile header) */
  compactBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.25)',
  },
  compactIcon:{ fontSize: 14 },
  compactTxt: { color: '#fff', fontSize: 11, fontWeight: '700' },

  /* Modal */
  overlay:   { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  modalCard: {
    backgroundColor: '#fff', borderRadius: 20, width: '100%', maxWidth: 420,
    maxHeight: '85%', overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    padding: 20, borderBottomWidth: 1, borderBottomColor: '#f1f5f9',
  },
  modalTitle: { fontSize: 17, fontWeight: '800', color: '#0f172a' },
  closeBtn:   { padding: 4 },
  closeTxt:   { fontSize: 16, color: '#94a3b8', fontWeight: '700' },

  section:      { padding: 16, borderBottomWidth: 1, borderBottomColor: '#f8fafc' },
  sectionTitle: { fontSize: 13, fontWeight: '800', color: '#0f172a', marginBottom: 14 },
  step: { flexDirection: 'row', alignItems: 'center', marginBottom: 12, gap: 10 },
  stepNum:    { width: 24, height: 24, borderRadius: 12, backgroundColor: C.primary, justifyContent: 'center', alignItems: 'center' },
  stepNumTxt: { color: '#fff', fontSize: 11, fontWeight: '800' },
  stepIcon:   { fontSize: 18, width: 28, textAlign: 'center' },
  stepTxt:    { flex: 1, fontSize: 13, color: '#334155', lineHeight: 19 },
  note:       { backgroundColor: '#fef9c3', borderRadius: 8, padding: 10, marginTop: 8 },
  noteTxt:    { fontSize: 11, color: '#92400e', lineHeight: 17 },

  benefits:      { padding: 16 },
  benefitsTitle: { fontSize: 13, fontWeight: '700', color: '#0f172a', marginBottom: 10 },
  benefitTxt:    { fontSize: 12, color: '#475569', marginBottom: 6, lineHeight: 18 },

  doneBtn: { margin: 16, marginTop: 4, backgroundColor: C.primary, borderRadius: 12, paddingVertical: 14, alignItems: 'center' },
  doneTxt: { color: '#fff', fontWeight: '800', fontSize: 15 },
});
