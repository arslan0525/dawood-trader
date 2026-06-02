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
  { icon: '📦', text: 'Inventory & Stock Management' },
  { icon: '👥', text: 'Customer & Route Management' },
  { icon: '📋', text: 'Instant Billing & Orders' },
  { icon: '💰', text: 'Recovery Tracking System'  },
  { icon: '💬', text: 'WhatsApp Bill Sharing'     },
  { icon: '📊', text: 'Business Dashboard'         },
];

function BrandPanel() {
  return (
    <View style={s.brandPanel}>
      <View style={s.dec1} /><View style={s.dec2} /><View style={s.dec3} />
      <View style={s.brandContent}>
        <View style={s.brandLogoRow}>
          <View style={s.brandIconWrap}>
            <Text style={s.brandEmoji}>🛒</Text>
          </View>
          <View>
            <Text style={s.brandName}>Dawood Trader</Text>
            <Text style={s.brandSub}>Distribution Management System</Text>
          </View>
        </View>
        <Text style={s.brandHeadline}>Professional Business Software for Pakistani Distributors</Text>
        <View style={{ gap: 12 }}>
          {FEATURES.map((f) => (
            <View key={f.text} style={s.featureRow}>
              <View style={s.featureIcon}><Text style={{ fontSize: 16 }}>{f.icon}</Text></View>
              <Text style={s.featureText}>{f.text}</Text>
            </View>
          ))}
        </View>
        <View style={s.brandFooter}>
          <Text style={s.brandFooterTxt}>🇵🇰 Made for Pakistan</Text>
        </View>
      </View>
    </View>
  );
}

// ── Magic Link form ───────────────────────────────────────────
function MagicLinkForm({ onBack }) {
  const { sendMagicLink, magicSent, resetMagicSent, IS_DEMO } = useAuth();
  const [email, setEmail]     = useState('');
  const [loading, setLoading] = useState(false);
  const emailRef              = useRef(null);

  const handleSend = async () => {
    if (!email.trim()) { Alert.alert('Error', 'Email likhein'); emailRef.current?.focus(); return; }
    setLoading(true);
    try {
      await sendMagicLink(email.trim());
    } catch (e) {
      Alert.alert('Error', e.message || 'Link send nahi ho saka');
    } finally {
      setLoading(false);
    }
  };

  if (magicSent && !IS_DEMO) {
    return (
      <View style={s.magicSentBox}>
        <Text style={{ fontSize: 56, textAlign: 'center', marginBottom: 16 }}>✉️</Text>
        <Text style={s.magicSentTitle}>Check Your Email!</Text>
        <Text style={s.magicSentBody}>
          A login link has been sent to{'\n'}
          <Text style={{ fontWeight: '800', color: C.primary }}>{email}</Text>
          {'\n\n'}Click the link in the email to login. The link expires in 10 minutes.
        </Text>
        <TouchableOpacity style={s.backBtn2} onPress={() => { resetMagicSent(); }}>
          <Text style={s.backBtn2Txt}>← Try a different email</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View>
      {IS_DEMO && (
        <View style={s.demoBanner}>
          <Text style={s.demoTitle}>🧪 Demo Mode</Text>
          <Text style={s.demoBody}>
            Enter any email and tap Send Link.{'\n'}
            Admin: <Text style={{ fontWeight: '700' }}>admin@dawoodtrader.com</Text>
          </Text>
        </View>
      )}
      <Text style={s.magicDesc}>
        Enter your email and we'll send you a secure login link. No password needed!
      </Text>
      <Text style={s.label}>Email Address</Text>
      <InputRow
        icon="✉️"
        inputRef={emailRef}
        value={email}
        onChangeText={setEmail}
        placeholder="you@example.com"
        keyboardType="email-address"
        autoCapitalize="none"
        returnKeyType="send"
        onSubmitEditing={handleSend}
        style={s.inputMargin}
      />
      <TouchableOpacity
        style={[s.loginBtn, loading && { opacity: 0.72 }]}
        onPress={handleSend}
        disabled={loading}
        activeOpacity={0.88}
      >
        {loading
          ? <ActivityIndicator color="#fff" />
          : <Text style={s.loginBtnText}>📧  Send Login Link</Text>
        }
      </TouchableOpacity>
      <TouchableOpacity style={s.switchLink} onPress={onBack}>
        <Text style={s.switchLinkTxt}>← Use password instead</Text>
      </TouchableOpacity>
    </View>
  );
}

// ── Main LoginScreen ──────────────────────────────────────────
export default function LoginScreen({ navigation }) {
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading]   = useState(false);
  const [authMode, setAuthMode] = useState('password'); // 'password' | 'magic'

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
              <View style={s.mobileLogoWrap}>
                <Text style={{ fontSize: 32 }}>🛒</Text>
              </View>
              <Text style={s.mobileBrandName}>Dawood Trader</Text>
              <Text style={s.mobileBrandSub}>Distribution Management System</Text>
            </View>
          )}

          <Text style={s.title}>Welcome Back</Text>
          <Text style={s.subtitle}>Sign in to your account</Text>

          {/* Auth mode toggle */}
          <View style={s.modeToggle}>
            <TouchableOpacity
              style={[s.modeBtn, authMode === 'password' && s.modeBtnActive]}
              onPress={() => setAuthMode('password')}
            >
              <Text style={[s.modeBtnTxt, authMode === 'password' && s.modeBtnTxtActive]}>
                🔑 Password
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[s.modeBtn, authMode === 'magic' && s.modeBtnActive]}
              onPress={() => setAuthMode('magic')}
            >
              <Text style={[s.modeBtnTxt, authMode === 'magic' && s.modeBtnTxtActive]}>
                ✉️ Magic Link
              </Text>
            </TouchableOpacity>
          </View>

          {/* Password login */}
          {authMode === 'password' && (
            <>
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
                    onPress={() => { setShowPass(v => !v); setTimeout(() => passwordRef.current?.focus(), 30); }}
                    style={{ padding: 6 }}
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

              <TouchableOpacity style={s.switchLink} onPress={() => setAuthMode('magic')}>
                <Text style={s.switchLinkTxt}>Forgot password? Use magic link →</Text>
              </TouchableOpacity>
            </>
          )}

          {/* Magic Link */}
          {authMode === 'magic' && (
            <MagicLinkForm onBack={() => setAuthMode('password')} />
          )}

          <View style={s.divider}>
            <View style={s.divLine} />
            <Text style={s.divWord}>or</Text>
            <View style={s.divLine} />
          </View>

          <TouchableOpacity
            style={s.registerBtn}
            onPress={() => navigation.navigate('Signup')}
            activeOpacity={0.85}
          >
            <Text style={s.registerBtnText}>Create New Account</Text>
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
  return <View style={{ flex: 1, backgroundColor: C.bg }}>{form}</View>;
}

const s = StyleSheet.create({
  splitRoot: { flex: 1, flexDirection: 'row' },

  brandPanel: { width: '46%', backgroundColor: C.primaryDark, justifyContent: 'center', overflow: 'hidden', position: 'relative' },
  dec1: { position: 'absolute', width: 340, height: 340, borderRadius: 170, backgroundColor: 'rgba(255,255,255,0.04)', top: -90, right: -110 },
  dec2: { position: 'absolute', width: 240, height: 240, borderRadius: 120, backgroundColor: 'rgba(255,255,255,0.04)', bottom: 50, left: -90 },
  dec3: { position: 'absolute', width: 160, height: 160, borderRadius: 80,  backgroundColor: 'rgba(255,255,255,0.05)', top: '42%', right: -50 },
  brandContent:  { padding: 48 },
  brandLogoRow:  { flexDirection: 'row', alignItems: 'center', marginBottom: 32 },
  brandIconWrap: { width: 56, height: 56, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.15)', justifyContent: 'center', alignItems: 'center', marginRight: 14, borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.22)' },
  brandEmoji:    { fontSize: 26 },
  brandName:     { color: '#fff', fontSize: 22, fontWeight: '800' },
  brandSub:      { color: 'rgba(255,255,255,0.5)', fontSize: 11, marginTop: 2 },
  brandHeadline: { color: 'rgba(255,255,255,0.88)', fontSize: 22, fontWeight: '700', lineHeight: 32, marginBottom: 28 },
  featureRow:    { flexDirection: 'row', alignItems: 'center' },
  featureIcon:   { width: 38, height: 38, borderRadius: 10, backgroundColor: 'rgba(255,255,255,0.1)', justifyContent: 'center', alignItems: 'center', marginRight: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.13)' },
  featureText:   { color: 'rgba(255,255,255,0.78)', fontSize: 13, fontWeight: '500' },
  brandFooter:   { marginTop: 32, paddingTop: 20, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.1)' },
  brandFooterTxt:{ color: 'rgba(255,255,255,0.4)', fontSize: 11 },

  formPanel:  { flex: 1, backgroundColor: C.bg },
  formScroll: { flexGrow: 1, justifyContent: 'center' },
  formInner:  { padding: 40, maxWidth: 460, alignSelf: 'center', width: '100%' },

  mobileBrand:    { alignItems: 'center', marginBottom: 28, marginTop: 20 },
  mobileLogoWrap: { width: 72, height: 72, borderRadius: 20, backgroundColor: C.primary, justifyContent: 'center', alignItems: 'center', marginBottom: 10, shadowColor: C.primary, shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.3, shadowRadius: 12, elevation: 8 },
  mobileBrandName:{ fontSize: 24, fontWeight: '800', color: C.text },
  mobileBrandSub: { fontSize: 12, color: C.textLight, marginTop: 3 },

  title:    { fontSize: 28, fontWeight: '800', color: C.text, marginBottom: 4 },
  subtitle: { fontSize: 14, color: C.textLight, marginBottom: 24 },

  modeToggle:      { flexDirection: 'row', backgroundColor: '#f1f5f9', borderRadius: 12, padding: 4, marginBottom: 24 },
  modeBtn:         { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 10 },
  modeBtnActive:   { backgroundColor: '#fff', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.08, shadowRadius: 4, elevation: 2 },
  modeBtnTxt:      { fontSize: 13, fontWeight: '600', color: C.textLight },
  modeBtnTxtActive:{ color: C.text, fontWeight: '800' },

  demoBanner: { backgroundColor: '#fffbeb', borderRadius: 10, padding: 14, borderLeftWidth: 4, borderLeftColor: '#f59e0b', marginBottom: 24 },
  demoTitle:  { fontSize: 13, fontWeight: '700', color: '#92400e', marginBottom: 4 },
  demoBody:   { fontSize: 12, color: '#b45309', lineHeight: 20 },

  label:       { fontSize: 13, fontWeight: '600', color: C.textMid, marginBottom: 7 },
  inputMargin: { marginBottom: 18 },

  loginBtn:     { backgroundColor: C.primary, borderRadius: 12, paddingVertical: 17, alignItems: 'center', marginTop: 4, shadowColor: C.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.28, shadowRadius: 12, elevation: 6 },
  loginBtnText: { color: '#fff', fontSize: 16, fontWeight: '800', letterSpacing: 0.3 },

  switchLink:    { alignItems: 'center', marginTop: 14 },
  switchLinkTxt: { color: C.primary, fontSize: 13, fontWeight: '600' },

  magicDesc: { fontSize: 13, color: C.textLight, lineHeight: 20, marginBottom: 20 },

  magicSentBox:   { alignItems: 'center', paddingVertical: 8 },
  magicSentTitle: { fontSize: 22, fontWeight: '800', color: C.text, marginBottom: 12 },
  magicSentBody:  { fontSize: 14, color: C.textLight, lineHeight: 22, textAlign: 'center', marginBottom: 24 },
  backBtn2:       { backgroundColor: C.primaryLight, borderRadius: 10, paddingHorizontal: 20, paddingVertical: 12 },
  backBtn2Txt:    { color: C.primary, fontWeight: '700', fontSize: 13 },

  divider: { flexDirection: 'row', alignItems: 'center', marginVertical: 22 },
  divLine: { flex: 1, height: 1, backgroundColor: C.border },
  divWord: { marginHorizontal: 12, color: C.textLight, fontSize: 13 },

  registerBtn:     { backgroundColor: C.surface, borderRadius: 12, paddingVertical: 14, alignItems: 'center', borderWidth: 1.5, borderColor: C.border },
  registerBtnText: { color: C.primary, fontSize: 15, fontWeight: '700' },
});
