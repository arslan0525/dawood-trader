import React, { useState, useRef } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, ActivityIndicator, Alert,
  ScrollView, TextInput, useWindowDimensions,
} from 'react-native';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '../services/firebase';
import { useAuth, ADMIN_EMAIL } from '../context/AuthContext';
import { C } from '../constants/theme';

const FEATURES = [
  { icon: '📦', text: 'Inventory & Stock Management' },
  { icon: '👥', text: 'Customer & Route Management' },
  { icon: '📋', text: 'Instant Billing & Orders' },
  { icon: '💰', text: 'Recovery Tracking System' },
  { icon: '💬', text: 'WhatsApp Bill Sharing' },
  { icon: '📊', text: 'Business Dashboard' },
];

const STATS = [
  { value: '20+', label: 'Products' },
  { value: '7',   label: 'Routes'   },
  { value: '100%', label: 'Digital' },
];

export default function LoginScreen({ navigation }) {
  const [step,     setStep]     = useState('role');   // 'role' | 'form'
  const [role,     setRole]     = useState(null);     // 'owner' | 'salesman'
  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading,  setLoading]  = useState(false);

  const { IS_DEMO, demoLogin, overrideRole } = useAuth();
  const { width, height }      = useWindowDimensions();
  const isSplit                = width >= 860;
  const isMobile               = width < 480;

  const emailRef    = useRef(null);
  const passwordRef = useRef(null);

  const selectRole = (r) => {
    setRole(r);
    setStep('form');
    setTimeout(() => emailRef.current?.focus(), 300);
  };

  const handleLogin = async () => {
    if (!email.trim()) { Alert.alert('Error', 'Email likhein'); emailRef.current?.focus(); return; }
    if (!password)     { Alert.alert('Error', 'Password likhein'); passwordRef.current?.focus(); return; }
    if (IS_DEMO)       { demoLogin(email); return; }

    setLoading(true);
    try {
      const cred = await signInWithEmailAndPassword(auth, email.trim(), password);
      const u = cred.user;

      // Verify + apply role
      if (role === 'owner') {
        const isLegacyAdmin = u.email === ADMIN_EMAIL;
        if (isLegacyAdmin) {
          overrideRole('owner');
        } else {
          const snap = await getDoc(doc(db, 'users', u.uid));
          const firestoreRole = snap.exists() ? snap.data().role : 'salesman';
          if (firestoreRole !== 'owner') {
            await auth.signOut();
            Alert.alert(
              'Access Denied',
              'Aap Owner nahi hain. Salesman ke tor pe login karein.',
              [{ text: 'OK', onPress: () => setStep('role') }]
            );
            return;
          }
          overrideRole('owner');
        }
      } else {
        overrideRole('salesman');
      }
      // AuthContext onAuthStateChanged will navigate to main app
    } catch (e) {
      if (e.code === 'auth/user-not-found' || e.code === 'auth/wrong-password' || e.code === 'auth/invalid-credential') {
        Alert.alert('Login Failed', 'Email ya password galat hai');
      } else {
        Alert.alert('Login Failed', 'Dobara koshish karein');
      }
    } finally {
      setLoading(false);
    }
  };

  /* ── Left brand panel ─────────────────────────────────── */
  const BrandPanel = () => (
    <View style={s.brandPanel}>
      <View style={s.circle1} /><View style={s.circle2} />
      <View style={s.circle3} /><View style={s.circle4} />
      <View style={s.brandContent}>
        <View style={s.brandLogoRow}>
          <View style={s.brandIconWrap}><Text style={{ fontSize: 26 }}>🛒</Text></View>
          <View>
            <Text style={s.brandName}>Dawood Trader</Text>
            <Text style={s.brandSub}>Distribution Management</Text>
          </View>
        </View>
        <Text style={s.brandHeadline}>Professional Business Software for Pakistani Distributors</Text>
        <View style={s.statsRow}>
          {STATS.map(st => (
            <View key={st.label} style={s.statItem}>
              <Text style={s.statValue}>{st.value}</Text>
              <Text style={s.statLabel}>{st.label}</Text>
            </View>
          ))}
        </View>
        <View style={s.featureList}>
          {FEATURES.map(f => (
            <View key={f.text} style={s.featureRow}>
              <View style={s.featureIcon}><Text style={{ fontSize: 15 }}>{f.icon}</Text></View>
              <Text style={s.featureText}>{f.text}</Text>
            </View>
          ))}
        </View>
        <View style={s.brandFooter}>
          <Text style={s.brandFooterTxt}>🇵🇰  Made by Arslan Shahani</Text>
        </View>
      </View>
    </View>
  );

  /* ── Role selection step ──────────────────────────────── */
  const RoleStep = () => (
    <View style={s.roleStepWrap}>
      {!isSplit && (
        <View style={s.mobileLogoWrap}>
          <View style={s.mobileLogoBg}>
            <Text style={{ fontSize: 36 }}>🛒</Text>
          </View>
          <Text style={s.mobileAppName}>Dawood Trader</Text>
          <Text style={s.mobileAppSub}>Distribution Management System</Text>
        </View>
      )}

      <View style={s.card}>
        <Text style={s.roleHeading}>Assalam o Alaikum! 👋</Text>
        <Text style={s.roleSubHeading}>Aap kaun hain?</Text>
        <Text style={s.roleDesc}>Apna role select karein</Text>

        <View style={s.roleCardsRow}>
          <TouchableOpacity
            style={s.roleCard}
            onPress={() => selectRole('owner')}
            activeOpacity={0.82}
          >
            <View style={[s.roleCardIcon, { backgroundColor: '#1a3a8f15' }]}>
              <Text style={{ fontSize: 36 }}>👑</Text>
            </View>
            <Text style={s.roleCardLabel}>Owner</Text>
            <Text style={s.roleCardDesc}>Full access — products, orders, reports, customers</Text>
            <View style={[s.roleCardBadge, { backgroundColor: '#1a3a8f' }]}>
              <Text style={s.roleCardBadgeTxt}>Admin</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={s.roleCard}
            onPress={() => selectRole('salesman')}
            activeOpacity={0.82}
          >
            <View style={[s.roleCardIcon, { backgroundColor: '#15803d15' }]}>
              <Text style={{ fontSize: 36 }}>🧑‍💼</Text>
            </View>
            <Text style={s.roleCardLabel}>Salesman</Text>
            <Text style={s.roleCardDesc}>Orders, recovery aur payments karna</Text>
            <View style={[s.roleCardBadge, { backgroundColor: '#15803d' }]}>
              <Text style={s.roleCardBadgeTxt}>Sales</Text>
            </View>
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={s.registerRow} onPress={() => navigation.navigate('Signup')}>
          <Text style={s.registerTxt}>Naya account? <Text style={s.registerLink}>Register karein</Text></Text>
        </TouchableOpacity>
      </View>

      {!isSplit && <Text style={s.mobileFooter}>🇵🇰  Made by Arslan Shahani</Text>}
    </View>
  );

  /* ── Login form step ──────────────────────────────────── */
  const FormStep = () => (
    <View style={s.formStepWrap}>
      {!isSplit && (
        <View style={s.mobileLogoWrap}>
          <View style={s.mobileLogoBg}>
            <Text style={{ fontSize: 36 }}>🛒</Text>
          </View>
          <Text style={s.mobileAppName}>Dawood Trader</Text>
          <Text style={s.mobileAppSub}>Distribution Management System</Text>
        </View>
      )}

      <View style={s.card}>
        {/* Back + role badge */}
        <View style={s.formTopRow}>
          <TouchableOpacity style={s.backBtn} onPress={() => setStep('role')} activeOpacity={0.7}>
            <Text style={s.backBtnTxt}>← Wapas</Text>
          </TouchableOpacity>
          <View style={[s.rolePill, role === 'owner' ? s.rolePillOwner : s.rolePillSales]}>
            <Text style={s.rolePillTxt}>{role === 'owner' ? '👑 Owner' : '🧑‍💼 Salesman'}</Text>
          </View>
        </View>

        <Text style={s.welcomeTxt}>Welcome back 👋</Text>
        <Text style={s.headingTxt}>Login karein</Text>

        {/* Email */}
        <View style={s.fieldWrap}>
          <Text style={s.fieldLabel}>Email Address</Text>
          <View style={s.inputBox}>
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
              returnKeyType="next"
              onSubmitEditing={() => passwordRef.current?.focus()}
              blurOnSubmit={false}
            />
          </View>
        </View>

        {/* Password */}
        <View style={s.fieldWrap}>
          <Text style={s.fieldLabel}>Password</Text>
          <View style={s.inputBox}>
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
              returnKeyType="done"
              onSubmitEditing={handleLogin}
            />
            <TouchableOpacity onPress={() => setShowPass(v => !v)} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }} style={{ padding: 4 }}>
              <Text style={{ fontSize: 18 }}>{showPass ? '👁️' : '🙈'}</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Login button */}
        <TouchableOpacity
          style={[s.loginBtn, role === 'owner' ? s.loginBtnOwner : s.loginBtnSales, loading && { opacity: 0.75 }]}
          onPress={handleLogin}
          disabled={loading}
          activeOpacity={0.88}
        >
          {loading
            ? <><ActivityIndicator color="#fff" size="small" /><Text style={[s.loginBtnTxt, { marginLeft: 10 }]}>Please wait...</Text></>
            : <Text style={s.loginBtnTxt}>{role === 'owner' ? '👑 Owner Login →' : '🧑‍💼 Salesman Login →'}</Text>
          }
        </TouchableOpacity>
      </View>

      {!isSplit && <Text style={s.mobileFooter}>🇵🇰  Made by Arslan Shahani</Text>}
    </View>
  );

  /* ── Form panel wrapper ───────────────────────────────── */
  const FormPanel = () => (
    <KeyboardAvoidingView style={s.formPanel} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView
        contentContainerStyle={[s.formScroll, { minHeight: isSplit ? undefined : height }]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={[s.formInner, isMobile && { padding: 20 }]}>
          {step === 'role' ? <RoleStep /> : <FormStep />}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );

  if (isSplit) {
    return (
      <View style={s.splitRoot}>
        <BrandPanel />
        <FormPanel />
      </View>
    );
  }

  return <View style={s.mobileRoot}><FormPanel /></View>;
}

const s = StyleSheet.create({
  splitRoot: { flex: 1, flexDirection: 'row', backgroundColor: '#f0f4ff' },
  mobileRoot: { flex: 1, backgroundColor: '#f0f4ff' },

  /* Brand panel */
  brandPanel:    { width: '43%', backgroundColor: '#1a3a8f', justifyContent: 'center', overflow: 'hidden', position: 'relative' },
  circle1: { position: 'absolute', width: 400, height: 400, borderRadius: 200, backgroundColor: 'rgba(255,255,255,0.05)', top: -120, right: -120 },
  circle2: { position: 'absolute', width: 280, height: 280, borderRadius: 140, backgroundColor: 'rgba(255,255,255,0.04)', bottom: -60, left: -80 },
  circle3: { position: 'absolute', width: 180, height: 180, borderRadius: 90,  backgroundColor: 'rgba(99,179,237,0.1)', top: '38%', right: -50 },
  circle4: { position: 'absolute', width: 100, height: 100, borderRadius: 50,  backgroundColor: 'rgba(255,255,255,0.06)', bottom: '25%', right: 40 },
  brandContent:  { paddingHorizontal: 44, paddingVertical: 40 },
  brandLogoRow:  { flexDirection: 'row', alignItems: 'center', marginBottom: 28 },
  brandIconWrap: { width: 52, height: 52, borderRadius: 14, backgroundColor: 'rgba(255,255,255,0.15)', justifyContent: 'center', alignItems: 'center', marginRight: 12, borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.25)' },
  brandName:     { color: '#fff', fontSize: 20, fontWeight: '800' },
  brandSub:      { color: 'rgba(255,255,255,0.5)', fontSize: 11, marginTop: 2 },
  brandHeadline: { color: '#fff', fontSize: 20, fontWeight: '700', lineHeight: 30, marginBottom: 24, opacity: 0.92 },
  statsRow:  { flexDirection: 'row', gap: 16, marginBottom: 28 },
  statItem:  { alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 12, paddingVertical: 10, paddingHorizontal: 14, borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)' },
  statValue: { color: '#fff', fontSize: 20, fontWeight: '800' },
  statLabel: { color: 'rgba(255,255,255,0.6)', fontSize: 10, marginTop: 2, fontWeight: '600' },
  featureList: { gap: 10, marginBottom: 28 },
  featureRow:  { flexDirection: 'row', alignItems: 'center' },
  featureIcon: { width: 36, height: 36, borderRadius: 10, backgroundColor: 'rgba(255,255,255,0.1)', justifyContent: 'center', alignItems: 'center', marginRight: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)' },
  featureText: { color: 'rgba(255,255,255,0.82)', fontSize: 13, fontWeight: '500' },
  brandFooter:    { paddingTop: 20, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.12)' },
  brandFooterTxt: { color: 'rgba(255,255,255,0.45)', fontSize: 12, fontWeight: '500' },

  /* Form panel */
  formPanel:  { flex: 1, backgroundColor: '#f0f4ff' },
  formScroll: { flexGrow: 1, justifyContent: 'center' },
  formInner:  { padding: 32, maxWidth: 480, alignSelf: 'center', width: '100%' },

  /* Mobile logo */
  mobileLogoWrap: { alignItems: 'center', paddingTop: 40, paddingBottom: 20 },
  mobileLogoBg:   { width: 90, height: 90, borderRadius: 24, backgroundColor: '#1a3a8f', justifyContent: 'center', alignItems: 'center', marginBottom: 12, shadowColor: '#1a3a8f', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.35, shadowRadius: 16, elevation: 10 },
  mobileAppName:  { fontSize: 22, fontWeight: '800', color: '#1a1a2e', marginBottom: 4 },
  mobileAppSub:   { fontSize: 11, color: '#7a8599', textAlign: 'center' },
  mobileFooter:   { textAlign: 'center', color: '#9aa3b5', fontSize: 11, marginTop: 20, paddingBottom: 16 },

  /* Card */
  card: {
    backgroundColor: '#fff', borderRadius: 24, padding: 28,
    shadowColor: '#1a3a8f', shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.09, shadowRadius: 24, elevation: 8,
    borderWidth: 1, borderColor: 'rgba(26,58,143,0.07)',
  },

  /* Role step */
  roleStepWrap:  {},
  formStepWrap:  {},
  roleHeading:   { fontSize: 22, fontWeight: '800', color: '#1a1a2e', marginBottom: 4 },
  roleSubHeading:{ fontSize: 16, fontWeight: '700', color: '#3d4757', marginBottom: 4 },
  roleDesc:      { fontSize: 13, color: '#9aa3b5', marginBottom: 22 },

  roleCardsRow: { flexDirection: 'row', gap: 12, marginBottom: 20 },
  roleCard: {
    flex: 1, borderWidth: 2, borderColor: '#e8edf5', borderRadius: 18,
    padding: 18, alignItems: 'center', backgroundColor: '#f8faff',
  },
  roleCardIcon:  { width: 72, height: 72, borderRadius: 20, justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
  roleCardLabel: { fontSize: 16, fontWeight: '800', color: '#1a1a2e', marginBottom: 6 },
  roleCardDesc:  { fontSize: 11, color: '#7a8599', textAlign: 'center', lineHeight: 15, marginBottom: 12 },
  roleCardBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  roleCardBadgeTxt: { color: '#fff', fontSize: 10, fontWeight: '700' },

  registerRow: { alignItems: 'center', marginTop: 4 },
  registerTxt: { fontSize: 13, color: '#7a8599' },
  registerLink:{ color: '#1a3a8f', fontWeight: '700' },

  /* Form step */
  formTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  backBtn:    { paddingVertical: 6, paddingHorizontal: 2 },
  backBtnTxt: { fontSize: 13, color: '#7a8599', fontWeight: '600' },
  rolePill:   { paddingHorizontal: 12, paddingVertical: 5, borderRadius: 20 },
  rolePillOwner: { backgroundColor: '#1a3a8f' },
  rolePillSales: { backgroundColor: '#15803d' },
  rolePillTxt:   { color: '#fff', fontSize: 12, fontWeight: '700' },

  welcomeTxt: { fontSize: 14, color: '#7a8599', marginBottom: 4 },
  headingTxt: { fontSize: 24, fontWeight: '800', color: '#1a1a2e', marginBottom: 20 },

  fieldWrap:  { marginBottom: 16 },
  fieldLabel: { fontSize: 13, fontWeight: '600', color: '#3d4757', marginBottom: 8 },
  inputBox:   { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f8faff', borderRadius: 12, borderWidth: 1.5, borderColor: '#dce3f0', paddingHorizontal: 14, paddingVertical: Platform.OS === 'web' ? 4 : 0 },
  inputIcon:  { fontSize: 16, marginRight: 10 },
  input:      { flex: 1, paddingVertical: 13, fontSize: 15, color: '#1a1a2e', ...(Platform.OS === 'web' ? { outlineStyle: 'none' } : {}) },

  loginBtn:       { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', borderRadius: 14, paddingVertical: 16, marginTop: 8, shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.35, shadowRadius: 14, elevation: 8 },
  loginBtnOwner:  { backgroundColor: '#1a3a8f', shadowColor: '#1a3a8f' },
  loginBtnSales:  { backgroundColor: '#15803d', shadowColor: '#15803d' },
  loginBtnTxt:    { color: '#fff', fontSize: 15, fontWeight: '800', letterSpacing: 0.3 },
});
