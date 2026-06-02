import React, { useState, useRef } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, ActivityIndicator, Alert,
  ScrollView, useWindowDimensions,
} from 'react-native';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../services/firebase';
import { useAuth } from '../context/AuthContext';
import { C } from '../constants/theme';
import InputRow from '../components/InputRow';

const FEATURES = [
  { icon: '📦', text: '500+ Wholesale Products' },
  { icon: '💬', text: 'Direct WhatsApp Ordering' },
  { icon: '⚡', text: 'Real-time Live Inventory' },
  { icon: '🔒', text: 'Secure & Trusted Platform' },
  { icon: '🚚', text: 'Fast Local Delivery' },
  { icon: '💰', text: 'Best Wholesale Prices' },
];

const BrandPanel = () => (
  <View style={s.brandPanel}>
    {/* Decorative circles */}
    <View style={s.dec1} />
    <View style={s.dec2} />
    <View style={s.dec3} />
    <View style={s.brandContent}>
      <View style={s.brandLogoRow}>
        <View style={s.brandIconWrap}>
          <Text style={s.brandEmoji}>🛒</Text>
        </View>
        <View>
          <Text style={s.brandName}>Dawood Trader</Text>
          <Text style={s.brandSub}>Pakistan Wholesale Store</Text>
        </View>
      </View>
      <Text style={s.brandHeadline}>Pakistan's most trusted wholesale platform</Text>
      <View style={{ gap: 14 }}>
        {FEATURES.map((f) => (
          <View key={f.text} style={s.featureRow}>
            <View style={s.featureIcon}><Text style={{ fontSize: 18 }}>{f.icon}</Text></View>
            <Text style={s.featureText}>{f.text}</Text>
          </View>
        ))}
      </View>
    </View>
  </View>
);

export default function LoginScreen({ navigation }) {
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading]   = useState(false);
  const { IS_DEMO, demoLogin }  = useAuth();
  const { width }               = useWindowDimensions();
  const isSplit                 = width >= 860;

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

  const togglePass = () => {
    setShowPass((v) => !v);
    setTimeout(() => passwordRef.current?.focus(), 30);
  };

  // ── JSX variable (NOT a component) — avoids remount on every keystroke ──
  const form = (
    <KeyboardAvoidingView
      style={s.formPanel}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={s.formScroll}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={s.formInner}>
          {!isSplit && (
            <View style={s.mobileBrand}>
              <Text style={{ fontSize: 52 }}>🛒</Text>
              <Text style={s.mobileBrandName}>Dawood Trader</Text>
            </View>
          )}

          <Text style={s.title}>Welcome back</Text>
          <Text style={s.subtitle}>Apne account mein login karein</Text>

          {IS_DEMO && (
            <View style={s.demoBanner}>
              <Text style={s.demoTitle}>🧪 Demo Mode</Text>
              <Text style={s.demoBody}>
                Admin: admin@dawoodtrader.com{'\n'}
                Customer: koi bhi email + koi password
              </Text>
            </View>
          )}

          <Text style={s.label}>Email Address</Text>
          <InputRow
            icon="✉️"
            inputRef={emailRef}
            value={email}
            onChangeText={setEmail}
            placeholder="you@example.com"
            keyboardType="email-address"
            autoCapitalize="none"
            returnKeyType="next"
            onSubmitEditing={() => passwordRef.current?.focus()}
            blurOnSubmit={false}
            style={s.inputMargin}
          />

          <Text style={s.label}>Password</Text>
          <InputRow
            icon="🔒"
            inputRef={passwordRef}
            value={password}
            onChangeText={setPassword}
            placeholder="••••••••"
            secureTextEntry={!showPass}
            autoCapitalize="none"
            returnKeyType="done"
            onSubmitEditing={handleLogin}
            style={s.inputMargin}
            rightElement={
              <TouchableOpacity
                onPress={togglePass}
                style={s.eyeBtn}
                hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
              >
                <Text style={{ fontSize: 17 }}>{showPass ? '🙈' : '👁️'}</Text>
              </TouchableOpacity>
            }
          />

          <TouchableOpacity
            style={[s.loginBtn, loading && { opacity: 0.72 }]}
            onPress={handleLogin}
            disabled={loading}
            activeOpacity={0.88}
          >
            {loading
              ? <ActivityIndicator color="#fff" />
              : <Text style={s.loginBtnText}>Login  →</Text>
            }
          </TouchableOpacity>

          <View style={s.divider}>
            <View style={s.divLine} />
            <Text style={s.divWord}>ya</Text>
            <View style={s.divLine} />
          </View>

          <TouchableOpacity
            style={s.registerBtn}
            onPress={() => navigation.navigate('Signup')}
            activeOpacity={0.85}
          >
            <Text style={s.registerBtnText}>Naya Account Banayein</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );

  if (isSplit) {
    return (
      <View style={s.splitRoot}>
        <BrandPanel />
        {form}
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: C.bg }}>
      {form}
    </View>
  );
}

const s = StyleSheet.create({
  splitRoot:    { flex: 1, flexDirection: 'row' },

  brandPanel:   { width: '45%', backgroundColor: C.primaryDark, justifyContent: 'center', overflow: 'hidden', position: 'relative' },
  dec1: { position: 'absolute', width: 320, height: 320, borderRadius: 160, backgroundColor: 'rgba(255,255,255,0.05)', top: -80, right: -100 },
  dec2: { position: 'absolute', width: 220, height: 220, borderRadius: 110, backgroundColor: 'rgba(255,255,255,0.04)', bottom: 60, left: -80 },
  dec3: { position: 'absolute', width: 140, height: 140, borderRadius: 70, backgroundColor: 'rgba(255,255,255,0.06)', top: '40%', right: -40 },
  brandContent: { padding: 48 },
  brandLogoRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 36 },
  brandIconWrap:{ width: 58, height: 58, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.18)', justifyContent: 'center', alignItems: 'center', marginRight: 16, borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.25)' },
  brandEmoji:   { fontSize: 28 },
  brandName:    { color: '#fff', fontSize: 22, fontWeight: '800' },
  brandSub:     { color: 'rgba(255,255,255,0.55)', fontSize: 12, marginTop: 3 },
  brandHeadline:{ color: 'rgba(255,255,255,0.9)', fontSize: 24, fontWeight: '700', lineHeight: 34, marginBottom: 32 },
  featureRow:   { flexDirection: 'row', alignItems: 'center' },
  featureIcon:  { width: 40, height: 40, borderRadius: 10, backgroundColor: 'rgba(255,255,255,0.12)', justifyContent: 'center', alignItems: 'center', marginRight: 14, borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)' },
  featureText:  { color: 'rgba(255,255,255,0.82)', fontSize: 14, fontWeight: '500' },

  formPanel:    { flex: 1, backgroundColor: C.bg },
  formScroll:   { flexGrow: 1, justifyContent: 'center' },
  formInner:    { padding: 40, maxWidth: 440, alignSelf: 'center', width: '100%' },

  mobileBrand:     { alignItems: 'center', marginBottom: 28 },
  mobileBrandName: { fontSize: 24, fontWeight: '800', color: C.primary, marginTop: 8 },

  title:    { fontSize: 28, fontWeight: '800', color: C.text, marginBottom: 6 },
  subtitle: { fontSize: 14, color: C.textLight, marginBottom: 28 },

  demoBanner: { backgroundColor: '#fffbeb', borderRadius: 10, padding: 14, borderLeftWidth: 4, borderLeftColor: '#f59e0b', marginBottom: 24 },
  demoTitle:  { fontSize: 13, fontWeight: '700', color: '#92400e', marginBottom: 4 },
  demoBody:   { fontSize: 12, color: '#b45309', lineHeight: 20 },

  label:       { fontSize: 13, fontWeight: '600', color: C.textMid, marginBottom: 7 },
  inputMargin: { marginBottom: 18 },
  eyeBtn:      { padding: 6 },

  loginBtn:     { backgroundColor: C.primary, borderRadius: 12, paddingVertical: 18, alignItems: 'center', marginTop: 4, shadowColor: C.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 12, elevation: 6 },
  loginBtnText: { color: '#fff', fontSize: 17, fontWeight: '800', letterSpacing: 0.3 },

  divider: { flexDirection: 'row', alignItems: 'center', marginVertical: 20 },
  divLine: { flex: 1, height: 1, backgroundColor: C.border },
  divWord: { marginHorizontal: 12, color: C.textLight, fontSize: 13 },

  registerBtn:     { backgroundColor: C.surface, borderRadius: 10, paddingVertical: 14, alignItems: 'center', borderWidth: 1.5, borderColor: C.border },
  registerBtnText: { color: C.primary, fontSize: 15, fontWeight: '700' },
});
