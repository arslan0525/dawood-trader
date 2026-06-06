import React, { useState, useRef } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, ActivityIndicator, Alert,
  ScrollView, TextInput, useWindowDimensions,
} from 'react-native';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../services/firebase';
import { useAuth } from '../context/AuthContext';
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
  { value: '7', label: 'Routes' },
  { value: '100%', label: 'Digital' },
];

export default function LoginScreen({ navigation }) {
  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading,  setLoading]  = useState(false);

  const { IS_DEMO, demoLogin } = useAuth();
  const { width, height }      = useWindowDimensions();
  const isSplit                = width >= 860;
  const isMobile               = width < 480;

  const emailRef    = useRef(null);
  const passwordRef = useRef(null);

  const handleLogin = async () => {
    if (!email.trim()) { Alert.alert('Error', 'Email likhein'); emailRef.current?.focus(); return; }
    if (!password)     { Alert.alert('Error', 'Password likhein'); passwordRef.current?.focus(); return; }
    if (IS_DEMO)       { demoLogin(email); return; }
    setLoading(true);
    try { await signInWithEmailAndPassword(auth, email.trim(), password); }
    catch { Alert.alert('Login Failed', 'Email ya password galat hai'); }
    finally { setLoading(false); }
  };

  /* ── Left brand panel ─────────────────────────────────── */
  const BrandPanel = () => (
    <View style={s.brandPanel}>
      {/* Decorative circles */}
      <View style={s.circle1} />
      <View style={s.circle2} />
      <View style={s.circle3} />
      <View style={s.circle4} />

      <View style={s.brandContent}>
        {/* Logo row */}
        <View style={s.brandLogoRow}>
          <View style={s.brandIconWrap}>
            <Text style={{ fontSize: 26 }}>🛒</Text>
          </View>
          <View>
            <Text style={s.brandName}>Dawood Trader</Text>
            <Text style={s.brandSub}>Distribution Management</Text>
          </View>
        </View>

        {/* Headline */}
        <Text style={s.brandHeadline}>
          Professional Business Software for Pakistani Distributors
        </Text>

        {/* Stats row */}
        <View style={s.statsRow}>
          {STATS.map(st => (
            <View key={st.label} style={s.statItem}>
              <Text style={s.statValue}>{st.value}</Text>
              <Text style={s.statLabel}>{st.label}</Text>
            </View>
          ))}
        </View>

        {/* Feature list */}
        <View style={s.featureList}>
          {FEATURES.map(f => (
            <View key={f.text} style={s.featureRow}>
              <View style={s.featureIcon}>
                <Text style={{ fontSize: 15 }}>{f.icon}</Text>
              </View>
              <Text style={s.featureText}>{f.text}</Text>
            </View>
          ))}
        </View>

        {/* Footer */}
        <View style={s.brandFooter}>
          <Text style={s.brandFooterTxt}>🇵🇰  Made by Arslan Shahani</Text>
        </View>
      </View>
    </View>
  );

  /* ── Form panel ───────────────────────────────────────── */
  const FormPanel = () => (
    <KeyboardAvoidingView
      style={s.formPanel}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={[s.formScroll, { minHeight: isSplit ? undefined : height }]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={[s.formInner, isMobile && { padding: 24 }]}>

          {/* Mobile logo (hidden on split) */}
          {!isSplit && (
            <View style={s.mobileLogoWrap}>
              <View style={s.mobileLogoBg}>
                <View style={s.mobileLogoBox}>
                  <Text style={{ fontSize: 36 }}>🛒</Text>
                </View>
              </View>
              <Text style={s.mobileAppName}>Dawood Trader</Text>
              <Text style={s.mobileAppSub}>Distribution Management System</Text>
            </View>
          )}

          {/* Card */}
          <View style={[s.card, isSplit && { paddingTop: 40, paddingBottom: 40 }]}>
            <Text style={s.welcomeTxt}>Welcome back 👋</Text>
            <Text style={s.headingTxt}>Login karein</Text>
            <Text style={s.headingSub}>Apna account access karein</Text>

            {/* Email field */}
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

            {/* Password field */}
            <View style={s.fieldWrap}>
              <View style={s.fieldLabelRow}>
                <Text style={s.fieldLabel}>Password</Text>
                <TouchableOpacity onPress={() => Alert.alert('Password Reset', 'Admin se rabta karein ya naya account banayein.')}>
                  <Text style={s.forgotTxt}>Bhool gaye?</Text>
                </TouchableOpacity>
              </View>
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
                <TouchableOpacity
                  onPress={() => setShowPass(v => !v)}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  style={{ padding: 4 }}
                >
                  <Text style={{ fontSize: 18 }}>{showPass ? '👁️' : '🙈'}</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Login button */}
            <TouchableOpacity
              style={[s.loginBtn, loading && s.loginBtnLoading]}
              onPress={handleLogin}
              disabled={loading}
              activeOpacity={0.88}
            >
              {loading ? (
                <><ActivityIndicator color="#fff" size="small" /><Text style={[s.loginBtnTxt, { marginLeft: 10 }]}>Logging in...</Text></>
              ) : (
                <Text style={s.loginBtnTxt}>Login karein  →</Text>
              )}
            </TouchableOpacity>

            {/* Divider */}
            <View style={s.divider}>
              <View style={s.dividerLine} />
              <Text style={s.dividerTxt}>ya</Text>
              <View style={s.dividerLine} />
            </View>

            {/* Register */}
            <TouchableOpacity
              style={s.registerBtn}
              onPress={() => navigation.navigate('Signup')}
              activeOpacity={0.85}
            >
              <Text style={s.registerBtnTxt}>Naya account banayein</Text>
            </TouchableOpacity>
          </View>

          {/* Mobile footer */}
          {!isSplit && (
            <Text style={s.mobileFooter}>🇵🇰  Made by Arslan Shahani</Text>
          )}
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

  return (
    <View style={s.mobileRoot}>
      <FormPanel />
    </View>
  );
}

const s = StyleSheet.create({
  /* ── Split layout ── */
  splitRoot: { flex: 1, flexDirection: 'row', backgroundColor: '#f0f4ff' },

  /* ── Brand panel ── */
  brandPanel: {
    width: '43%',
    backgroundColor: '#1a3a8f',
    justifyContent: 'center',
    overflow: 'hidden',
    position: 'relative',
  },
  circle1: { position: 'absolute', width: 400, height: 400, borderRadius: 200, backgroundColor: 'rgba(255,255,255,0.05)', top: -120, right: -120 },
  circle2: { position: 'absolute', width: 280, height: 280, borderRadius: 140, backgroundColor: 'rgba(255,255,255,0.04)', bottom: -60, left: -80 },
  circle3: { position: 'absolute', width: 180, height: 180, borderRadius: 90,  backgroundColor: 'rgba(99,179,237,0.1)', top: '38%', right: -50 },
  circle4: { position: 'absolute', width: 100, height: 100, borderRadius: 50,  backgroundColor: 'rgba(255,255,255,0.06)', bottom: '25%', right: 40 },

  brandContent:  { paddingHorizontal: 44, paddingVertical: 40 },
  brandLogoRow:  { flexDirection: 'row', alignItems: 'center', marginBottom: 28 },
  brandIconWrap: {
    width: 52, height: 52, borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center', alignItems: 'center',
    marginRight: 12, borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.25)',
  },
  brandName:     { color: '#fff', fontSize: 20, fontWeight: '800' },
  brandSub:      { color: 'rgba(255,255,255,0.5)', fontSize: 11, marginTop: 2 },
  brandHeadline: { color: '#fff', fontSize: 20, fontWeight: '700', lineHeight: 30, marginBottom: 24, opacity: 0.92 },

  statsRow:  { flexDirection: 'row', gap: 16, marginBottom: 28 },
  statItem:  { alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 12, paddingVertical: 10, paddingHorizontal: 14, borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)' },
  statValue: { color: '#fff', fontSize: 20, fontWeight: '800' },
  statLabel: { color: 'rgba(255,255,255,0.6)', fontSize: 10, marginTop: 2, fontWeight: '600' },

  featureList: { gap: 10, marginBottom: 28 },
  featureRow:  { flexDirection: 'row', alignItems: 'center' },
  featureIcon: {
    width: 36, height: 36, borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center', alignItems: 'center',
    marginRight: 12, borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
  },
  featureText: { color: 'rgba(255,255,255,0.82)', fontSize: 13, fontWeight: '500' },

  brandFooter:    { paddingTop: 20, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.12)' },
  brandFooterTxt: { color: 'rgba(255,255,255,0.45)', fontSize: 12, fontWeight: '500' },

  /* ── Form panel ── */
  formPanel:  { flex: 1, backgroundColor: '#f0f4ff' },
  formScroll: { flexGrow: 1, justifyContent: 'center' },
  formInner:  { padding: 32, maxWidth: 460, alignSelf: 'center', width: '100%' },

  /* ── Mobile logo ── */
  mobileRoot:     { flex: 1, backgroundColor: '#f0f4ff' },
  mobileLogoWrap: { alignItems: 'center', paddingTop: 48, paddingBottom: 24 },
  mobileLogoBg:   { width: 100, height: 100, borderRadius: 28, backgroundColor: '#1a3a8f', justifyContent: 'center', alignItems: 'center', marginBottom: 14, shadowColor: '#1a3a8f', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.35, shadowRadius: 16, elevation: 10 },
  mobileLogoBox:  { alignItems: 'center' },
  mobileAppName:  { fontSize: 24, fontWeight: '800', color: '#1a1a2e', marginBottom: 4 },
  mobileAppSub:   { fontSize: 12, color: '#7a8599', textAlign: 'center' },

  /* ── Card ── */
  card: {
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 28,
    shadowColor: '#1a3a8f',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.09,
    shadowRadius: 24,
    elevation: 8,
    borderWidth: 1,
    borderColor: 'rgba(26,58,143,0.07)',
  },
  welcomeTxt: { fontSize: 14, color: '#7a8599', marginBottom: 4 },
  headingTxt: { fontSize: 26, fontWeight: '800', color: '#1a1a2e', marginBottom: 4 },
  headingSub: { fontSize: 13, color: '#9aa3b5', marginBottom: 24 },

  /* ── Fields ── */
  fieldWrap:     { marginBottom: 18 },
  fieldLabelRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  fieldLabel:    { fontSize: 13, fontWeight: '600', color: '#3d4757', marginBottom: 8 },
  inputBox: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#f8faff',
    borderRadius: 12, borderWidth: 1.5,
    borderColor: '#dce3f0',
    paddingHorizontal: 14, paddingVertical: Platform.OS === 'web' ? 4 : 0,
  },
  inputIcon: { fontSize: 16, marginRight: 10 },
  input: {
    flex: 1,
    paddingVertical: 13,
    fontSize: 15,
    color: '#1a1a2e',
    ...(Platform.OS === 'web' ? { outlineStyle: 'none' } : {}),
  },
  forgotTxt: { fontSize: 12, color: C.primary, fontWeight: '600' },

  /* ── Login button ── */
  loginBtn: {
    flexDirection: 'row', justifyContent: 'center', alignItems: 'center',
    backgroundColor: '#1a3a8f',
    borderRadius: 14, paddingVertical: 16,
    marginTop: 6,
    shadowColor: '#1a3a8f',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35, shadowRadius: 14, elevation: 8,
  },
  loginBtnLoading: { opacity: 0.75 },
  loginBtnTxt:     { color: '#fff', fontSize: 16, fontWeight: '800', letterSpacing: 0.3 },

  /* ── Divider ── */
  divider:     { flexDirection: 'row', alignItems: 'center', marginVertical: 20, gap: 12 },
  dividerLine: { flex: 1, height: 1, backgroundColor: '#e8edf5' },
  dividerTxt:  { fontSize: 12, color: '#a0aab8', fontWeight: '500' },

  /* ── Register button ── */
  registerBtn: {
    borderWidth: 1.5, borderColor: '#dce3f0',
    borderRadius: 14, paddingVertical: 14,
    alignItems: 'center', backgroundColor: '#f8faff',
  },
  registerBtnTxt: { fontSize: 14, fontWeight: '700', color: '#1a3a8f' },

  /* ── Mobile footer ── */
  mobileFooter: { textAlign: 'center', color: '#9aa3b5', fontSize: 11, marginTop: 24, paddingBottom: 16 },
});
