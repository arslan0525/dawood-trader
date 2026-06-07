import React, { useState, useRef } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, ActivityIndicator, Alert,
  ScrollView, TextInput, useWindowDimensions,
} from 'react-native';
import { signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '../services/firebase';
import { useAuth, OWNER_EMAILS } from '../context/AuthContext';

const FEATURES = [
  { icon: '📦', text: 'Inventory & Stock Management' },
  { icon: '👥', text: 'Customer & Route Management' },
  { icon: '📋', text: 'Instant Billing & Orders' },
  { icon: '💰', text: 'Recovery Tracking System' },
  { icon: '💬', text: 'WhatsApp Bill Sharing' },
  { icon: '📊', text: 'Business Dashboard' },
];

export default function LoginScreen({ navigation }) {
  const [step,     setStep]     = useState('role');
  const [role,     setRole]     = useState(null);
  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading,  setLoading]  = useState(false);

  const { IS_DEMO, demoLogin, overrideRole } = useAuth();
  const { width } = useWindowDimensions();
  const isSplit   = width >= 860;

  const emailRef    = useRef(null);
  const passwordRef = useRef(null);

  const selectRole = (r) => {
    setRole(r);
    setStep('form');
    setTimeout(() => emailRef.current?.focus(), 400);
  };

  const handleLogin = async () => {
    if (!email.trim()) { Alert.alert('Error', 'Email likhein'); emailRef.current?.focus(); return; }
    if (!password)     { Alert.alert('Error', 'Password likhein'); passwordRef.current?.focus(); return; }
    if (IS_DEMO)       { demoLogin(email); return; }

    setLoading(true);
    try {
      const cred = await signInWithEmailAndPassword(auth, email.trim(), password);
      const u    = cred.user;

      if (role === 'owner') {
        if (OWNER_EMAILS.includes(u.email)) {
          overrideRole('owner');
        } else {
          try {
            const snap = await getDoc(doc(db, 'users', u.uid));
            const r    = snap.exists() ? snap.data().role : 'salesman';
            if (r !== 'owner') {
              await signOut(auth);
              Alert.alert('Access Denied', 'Aap Owner nahi hain. Salesman ke tor pe login karein.', [
                { text: 'OK', onPress: () => { setStep('role'); setEmail(''); setPassword(''); } },
              ]);
              return;
            }
            overrideRole('owner');
          } catch {
            overrideRole('owner'); // Firestore check fail — let AuthContext decide
          }
        }
      } else {
        overrideRole('salesman');
      }
    } catch (e) {
      const code = e?.code || '';
      if (code === 'auth/invalid-credential' || code === 'auth/wrong-password' || code === 'auth/user-not-found') {
        Alert.alert('Login Failed', 'Email ya password galat hai');
      } else if (code === 'auth/too-many-requests') {
        Alert.alert('Login Failed', 'Bahut zyada koshishein — kuch waqt ke baad dobara try karein');
      } else if (code === 'auth/network-request-failed') {
        Alert.alert('Login Failed', 'Internet connection check karein');
      } else {
        Alert.alert('Login Failed', 'Login nahi ho saka — dobara koshish karein');
      }
    } finally {
      setLoading(false);
    }
  };

  // ── Brand panel (desktop left) — static, no state ─────────
  const brandPanel = isSplit ? (
    <View style={s.brandPanel}>
      <View style={s.c1} /><View style={s.c2} /><View style={s.c3} />
      <View style={s.brandContent}>
        <View style={s.brandLogoRow}>
          <View style={s.brandIcon}><Text style={{ fontSize: 26 }}>🛒</Text></View>
          <View>
            <Text style={s.brandName}>Dawood Trader</Text>
            <Text style={s.brandSub}>Distribution Management</Text>
          </View>
        </View>
        <Text style={s.brandHeadline}>Professional Business Software for Pakistani Distributors</Text>
        {FEATURES.map(f => (
          <View key={f.text} style={s.featRow}>
            <View style={s.featIcon}><Text style={{ fontSize: 14 }}>{f.icon}</Text></View>
            <Text style={s.featTxt}>{f.text}</Text>
          </View>
        ))}
        <View style={s.brandFooter}>
          <Text style={s.brandFooterTxt}>🇵🇰  Made by Arslan Shahani</Text>
        </View>
      </View>
    </View>
  ) : null;

  // ── Mobile logo ────────────────────────────────────────────
  const mobileLogo = !isSplit ? (
    <View style={s.mobileLogoWrap}>
      <View style={s.mobileLogoBox}><Text style={{ fontSize: 34 }}>🛒</Text></View>
      <Text style={s.mobileAppName}>Dawood Trader</Text>
      <Text style={s.mobileAppSub}>Distribution Management System</Text>
    </View>
  ) : null;

  return (
    <View style={[s.root, isSplit && s.rootSplit]}>
      {brandPanel}

      <KeyboardAvoidingView
        style={s.formSide}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={0}
      >
        <ScrollView
          contentContainerStyle={s.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {mobileLogo}

          <View style={s.card}>

            {/* ── STEP 1: Role selection ── */}
            {step === 'role' && (
              <>
                <Text style={s.greeting}>Assalam o Alaikum! 👋</Text>
                <Text style={s.roleQ}>Aap kaun hain?</Text>
                <Text style={s.roleHint}>Apna role select karein</Text>

                <View style={s.roleRow}>
                  <TouchableOpacity style={s.roleCard} onPress={() => selectRole('owner')} activeOpacity={0.82}>
                    <View style={[s.roleEmoji, { backgroundColor: '#1a3a8f12' }]}>
                      <Text style={{ fontSize: 34 }}>👑</Text>
                    </View>
                    <Text style={s.roleLabel}>Owner</Text>
                    <Text style={s.roleDesc}>Full access — products, orders, reports</Text>
                    <View style={[s.roleBadge, { backgroundColor: '#1a3a8f' }]}>
                      <Text style={s.roleBadgeTxt}>Admin</Text>
                    </View>
                  </TouchableOpacity>

                  <TouchableOpacity style={s.roleCard} onPress={() => selectRole('salesman')} activeOpacity={0.82}>
                    <View style={[s.roleEmoji, { backgroundColor: '#15803d12' }]}>
                      <Text style={{ fontSize: 34 }}>🧑‍💼</Text>
                    </View>
                    <Text style={s.roleLabel}>Salesman</Text>
                    <Text style={s.roleDesc}>Orders, recovery aur payments</Text>
                    <View style={[s.roleBadge, { backgroundColor: '#15803d' }]}>
                      <Text style={s.roleBadgeTxt}>Sales</Text>
                    </View>
                  </TouchableOpacity>
                </View>

                <TouchableOpacity style={s.regRow} onPress={() => navigation.navigate('Signup')}>
                  <Text style={s.regTxt}>Naya account? <Text style={s.regLink}>Register karein</Text></Text>
                </TouchableOpacity>
              </>
            )}

            {/* ── STEP 2: Login form ── */}
            {step === 'form' && (
              <>
                <View style={s.formTop}>
                  <TouchableOpacity onPress={() => { setStep('role'); setEmail(''); setPassword(''); }} style={s.backBtn}>
                    <Text style={s.backTxt}>← Wapas</Text>
                  </TouchableOpacity>
                  <View style={[s.pill, role === 'owner' ? s.pillOwner : s.pillSales]}>
                    <Text style={s.pillTxt}>{role === 'owner' ? '👑 Owner' : '🧑‍💼 Salesman'}</Text>
                  </View>
                </View>

                <Text style={s.formTitle}>Login karein</Text>

                <Text style={s.label}>Email</Text>
                <View style={s.inputWrap}>
                  <Text style={s.inputIcon}>✉️</Text>
                  <TextInput
                    ref={emailRef}
                    style={s.input}
                    value={email}
                    onChangeText={setEmail}
                    placeholder="aapki@email.com"
                    placeholderTextColor="#b0b8c9"
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoCorrect={false}
                    returnKeyType="next"
                    onSubmitEditing={() => passwordRef.current?.focus()}
                    blurOnSubmit={false}
                    editable={!loading}
                  />
                </View>

                <Text style={s.label}>Password</Text>
                <View style={s.inputWrap}>
                  <Text style={s.inputIcon}>🔒</Text>
                  <TextInput
                    ref={passwordRef}
                    style={[s.input, { flex: 1 }]}
                    value={password}
                    onChangeText={setPassword}
                    placeholder="••••••••"
                    placeholderTextColor="#b0b8c9"
                    secureTextEntry={!showPass}
                    autoCapitalize="none"
                    autoCorrect={false}
                    returnKeyType="done"
                    onSubmitEditing={handleLogin}
                    editable={!loading}
                  />
                  <TouchableOpacity onPress={() => setShowPass(v => !v)} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }} style={{ padding: 6 }}>
                    <Text style={{ fontSize: 18 }}>{showPass ? '👁️' : '🙈'}</Text>
                  </TouchableOpacity>
                </View>

                <TouchableOpacity
                  style={[s.loginBtn, role === 'owner' ? s.btnOwner : s.btnSales, loading && s.btnDisabled]}
                  onPress={handleLogin}
                  disabled={loading}
                  activeOpacity={0.85}
                >
                  {loading
                    ? <><ActivityIndicator color="#fff" size="small" /><Text style={[s.loginBtnTxt, { marginLeft: 10 }]}>Please wait...</Text></>
                    : <Text style={s.loginBtnTxt}>{role === 'owner' ? '👑  Owner Login  →' : '🧑‍💼  Salesman Login  →'}</Text>
                  }
                </TouchableOpacity>
              </>
            )}

          </View>

          {!isSplit && (
            <Text style={s.footer}>🇵🇰  Made by Arslan Shahani</Text>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const s = StyleSheet.create({
  root:      { flex: 1, backgroundColor: '#f0f4ff' },
  rootSplit: { flexDirection: 'row' },

  /* Brand panel */
  brandPanel:   { width: '43%', backgroundColor: '#1a3a8f', overflow: 'hidden', position: 'relative', justifyContent: 'center' },
  c1: { position: 'absolute', width: 380, height: 380, borderRadius: 190, backgroundColor: 'rgba(255,255,255,0.05)', top: -100, right: -100 },
  c2: { position: 'absolute', width: 260, height: 260, borderRadius: 130, backgroundColor: 'rgba(255,255,255,0.04)', bottom: -50, left: -70 },
  c3: { position: 'absolute', width: 160, height: 160, borderRadius: 80,  backgroundColor: 'rgba(99,179,237,0.09)', top: '40%', right: -40 },
  brandContent:  { paddingHorizontal: 40, paddingVertical: 36 },
  brandLogoRow:  { flexDirection: 'row', alignItems: 'center', marginBottom: 24 },
  brandIcon:     { width: 50, height: 50, borderRadius: 14, backgroundColor: 'rgba(255,255,255,0.15)', justifyContent: 'center', alignItems: 'center', marginRight: 12, borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.25)' },
  brandName:     { color: '#fff', fontSize: 18, fontWeight: '800' },
  brandSub:      { color: 'rgba(255,255,255,0.5)', fontSize: 11, marginTop: 2 },
  brandHeadline: { color: '#fff', fontSize: 18, fontWeight: '700', lineHeight: 28, marginBottom: 20, opacity: 0.9 },
  featRow:       { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  featIcon:      { width: 34, height: 34, borderRadius: 9, backgroundColor: 'rgba(255,255,255,0.1)', justifyContent: 'center', alignItems: 'center', marginRight: 10 },
  featTxt:       { color: 'rgba(255,255,255,0.8)', fontSize: 12, fontWeight: '500' },
  brandFooter:   { marginTop: 28, paddingTop: 18, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.12)' },
  brandFooterTxt:{ color: 'rgba(255,255,255,0.4)', fontSize: 11 },

  /* Form side */
  formSide: { flex: 1 },
  scroll:   { flexGrow: 1, justifyContent: 'center', paddingHorizontal: 24, paddingVertical: 32 },

  /* Mobile logo */
  mobileLogoWrap: { alignItems: 'center', marginBottom: 24 },
  mobileLogoBox:  { width: 80, height: 80, borderRadius: 22, backgroundColor: '#1a3a8f', justifyContent: 'center', alignItems: 'center', marginBottom: 10, shadowColor: '#1a3a8f', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.3, shadowRadius: 14, elevation: 8 },
  mobileAppName:  { fontSize: 20, fontWeight: '800', color: '#1a1a2e' },
  mobileAppSub:   { fontSize: 11, color: '#7a8599', marginTop: 3 },

  /* Card */
  card: {
    backgroundColor: '#fff', borderRadius: 20, padding: 24,
    shadowColor: '#1a3a8f', shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08, shadowRadius: 20, elevation: 6,
    maxWidth: 440, alignSelf: 'center', width: '100%',
  },

  /* Role step */
  greeting: { fontSize: 20, fontWeight: '800', color: '#1a1a2e', marginBottom: 4 },
  roleQ:    { fontSize: 15, fontWeight: '700', color: '#3d4757', marginBottom: 4 },
  roleHint: { fontSize: 12, color: '#9aa3b5', marginBottom: 20 },
  roleRow:  { flexDirection: 'row', gap: 12, marginBottom: 18 },
  roleCard: { flex: 1, borderWidth: 1.5, borderColor: '#e2e8f0', borderRadius: 16, padding: 14, alignItems: 'center', backgroundColor: '#f8faff' },
  roleEmoji:{ width: 64, height: 64, borderRadius: 18, justifyContent: 'center', alignItems: 'center', marginBottom: 10 },
  roleLabel:{ fontSize: 14, fontWeight: '800', color: '#1a1a2e', marginBottom: 5 },
  roleDesc: { fontSize: 10, color: '#7a8599', textAlign: 'center', lineHeight: 14, marginBottom: 10 },
  roleBadge:{ paddingHorizontal: 10, paddingVertical: 3, borderRadius: 20 },
  roleBadgeTxt: { color: '#fff', fontSize: 9, fontWeight: '700' },
  regRow:   { alignItems: 'center', marginTop: 6 },
  regTxt:   { fontSize: 13, color: '#7a8599' },
  regLink:  { color: '#1a3a8f', fontWeight: '700' },

  /* Form step */
  formTop:   { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  backBtn:   { paddingVertical: 4 },
  backTxt:   { fontSize: 13, color: '#7a8599', fontWeight: '600' },
  pill:      { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  pillOwner: { backgroundColor: '#1a3a8f' },
  pillSales: { backgroundColor: '#15803d' },
  pillTxt:   { color: '#fff', fontSize: 11, fontWeight: '700' },
  formTitle: { fontSize: 22, fontWeight: '800', color: '#1a1a2e', marginBottom: 18 },
  label:     { fontSize: 12, fontWeight: '600', color: '#3d4757', marginBottom: 6 },
  inputWrap: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#f8faff', borderRadius: 12,
    borderWidth: 1.5, borderColor: '#dce3f0',
    paddingHorizontal: 12, marginBottom: 14,
  },
  inputIcon: { fontSize: 15, marginRight: 8 },
  input:     {
    flex: 1, paddingVertical: 13, fontSize: 15, color: '#1a1a2e',
    ...(Platform.OS === 'web' ? { outlineStyle: 'none' } : {}),
  },
  loginBtn:    { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', borderRadius: 13, paddingVertical: 15, marginTop: 6, shadowOffset: { width: 0, height: 5 }, shadowOpacity: 0.3, shadowRadius: 12, elevation: 6 },
  btnOwner:    { backgroundColor: '#1a3a8f', shadowColor: '#1a3a8f' },
  btnSales:    { backgroundColor: '#15803d', shadowColor: '#15803d' },
  btnDisabled: { opacity: 0.65 },
  loginBtnTxt: { color: '#fff', fontSize: 15, fontWeight: '800' },

  footer: { textAlign: 'center', color: '#9aa3b5', fontSize: 11, marginTop: 20 },
});
