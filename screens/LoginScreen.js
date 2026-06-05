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

export default function LoginScreen({ navigation }) {
  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading,  setLoading]  = useState(false);
  const [remember, setRemember] = useState(true);
  const [agreed,   setAgreed]   = useState(true);

  const { IS_DEMO, demoLogin } = useAuth();
  const { width }              = useWindowDimensions();
  const isSplit                = width >= 860;

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

          {/* Logo */}
          <View style={s.logoWrap}>
            <View style={s.logoBox}>
              <Text style={s.logoEmoji}>🛒</Text>
            </View>
            <Text style={s.logoName}>Dawood Trader</Text>
            <Text style={s.logoSub}>Distribution Management System</Text>
          </View>

          {/* Heading */}
          <Text style={s.welcomeTxt}>Welcome back</Text>
          <Text style={s.headingTxt}>Login to your account</Text>

          {/* Email */}
          <Text style={s.fieldLabel}>Email</Text>
          <View style={s.inputBox}>
            <TextInput
              ref={emailRef}
              style={s.input}
              value={email}
              onChangeText={setEmail}
              placeholder="you@example.com"
              placeholderTextColor="#aab"
              keyboardType="email-address"
              autoCapitalize="none"
              returnKeyType="next"
              onSubmitEditing={() => passwordRef.current?.focus()}
              blurOnSubmit={false}
            />
          </View>

          {/* Password */}
          <Text style={s.fieldLabel}>Password</Text>
          <View style={s.inputBox}>
            <TextInput
              ref={passwordRef}
              style={[s.input, { flex: 1 }]}
              value={password}
              onChangeText={setPassword}
              placeholder="••••••••••"
              placeholderTextColor="#aab"
              secureTextEntry={!showPass}
              autoCapitalize="none"
              returnKeyType="done"
              onSubmitEditing={handleLogin}
            />
            <TouchableOpacity
              onPress={() => setShowPass(v => !v)}
              style={s.eyeBtn}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Text style={s.eyeIcon}>{showPass ? '👁️' : '🙈'}</Text>
            </TouchableOpacity>
          </View>

          {/* Remember me + Forgot password */}
          <View style={s.remRow}>
            <TouchableOpacity style={s.checkRow} onPress={() => setRemember(v => !v)} activeOpacity={0.7}>
              <View style={[s.checkbox, remember && s.checkboxOn]}>
                {remember && <Text style={s.checkmark}>✓</Text>}
              </View>
              <Text style={s.remTxt}>Remember me</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => Alert.alert('Forgot Password', 'Magic Link se login karein — password ki zaroorat nahi!')}>
              <Text style={s.forgotTxt}>Forgot password?</Text>
            </TouchableOpacity>
          </View>

          {/* Terms */}
          <TouchableOpacity style={s.checkRow} onPress={() => setAgreed(v => !v)} activeOpacity={0.7}>
            <View style={[s.checkbox, agreed && s.checkboxOn]}>
              {agreed && <Text style={s.checkmark}>✓</Text>}
            </View>
            <Text style={s.termsTxt}>
              By continuing you agree to our{' '}
              <Text style={s.termsLink}>Privacy Policy</Text>
              {' '}and{' '}
              <Text style={s.termsLink}>Terms of Use</Text>
            </Text>
          </TouchableOpacity>

          {/* Login Button */}
          <TouchableOpacity
            style={[s.loginBtn, (loading || !agreed) && s.loginBtnDisabled]}
            onPress={handleLogin}
            disabled={loading || !agreed}
            activeOpacity={0.85}
          >
            {loading
              ? <><ActivityIndicator color="#fff" size="small" /><Text style={s.loginBtnTxt}>  Please wait...</Text></>
              : <Text style={s.loginBtnTxt}>Login  →</Text>
            }
          </TouchableOpacity>

          {/* Register */}
          <View style={s.bottomRow}>
            <Text style={s.bottomTxt}>Don't have an account?  </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Signup')}>
              <Text style={s.bottomLink}>Create Account</Text>
            </TouchableOpacity>
          </View>

        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );

  if (isSplit) {
    return (
      <View style={s.splitRoot}>
        {/* Left brand panel */}
        <View style={s.brandPanel}>
          <View style={s.dec1} /><View style={s.dec2} /><View style={s.dec3} />
          <View style={s.brandContent}>
            <View style={s.brandLogoRow}>
              <View style={s.brandIconWrap}>
                <Text style={{ fontSize: 28 }}>🛒</Text>
              </View>
              <View>
                <Text style={s.brandName}>Dawood Trader</Text>
                <Text style={s.brandSub}>Distribution Management</Text>
              </View>
            </View>
            <Text style={s.brandHeadline}>Professional Business Software for Pakistani Distributors</Text>
            {[
              { icon: '📦', text: 'Inventory & Stock Management' },
              { icon: '👥', text: 'Customer & Route Management' },
              { icon: '📋', text: 'Instant Billing & Orders' },
              { icon: '💰', text: 'Recovery Tracking System' },
              { icon: '💬', text: 'WhatsApp Bill Sharing' },
              { icon: '📊', text: 'Business Dashboard' },
            ].map(f => (
              <View key={f.text} style={s.featureRow}>
                <View style={s.featureIcon}><Text style={{ fontSize: 16 }}>{f.icon}</Text></View>
                <Text style={s.featureText}>{f.text}</Text>
              </View>
            ))}
            <View style={s.brandFooter}>
              <Text style={s.brandFooterTxt}>🇵🇰 Made for Pakistan</Text>
            </View>
          </View>
        </View>
        {form}
      </View>
    );
  }

  return <View style={{ flex: 1, backgroundColor: '#f5f6fa' }}>{form}</View>;
}

const s = StyleSheet.create({
  splitRoot:  { flex: 1, flexDirection: 'row' },

  /* Brand panel (desktop left side) */
  brandPanel:    { width: '44%', backgroundColor: C.primaryDark, justifyContent: 'center', overflow: 'hidden', position: 'relative' },
  dec1:          { position: 'absolute', width: 340, height: 340, borderRadius: 170, backgroundColor: 'rgba(255,255,255,0.04)', top: -90, right: -110 },
  dec2:          { position: 'absolute', width: 240, height: 240, borderRadius: 120, backgroundColor: 'rgba(255,255,255,0.04)', bottom: 50, left: -90 },
  dec3:          { position: 'absolute', width: 160, height: 160, borderRadius: 80,  backgroundColor: 'rgba(255,255,255,0.05)', top: '42%', right: -50 },
  brandContent:  { padding: 48 },
  brandLogoRow:  { flexDirection: 'row', alignItems: 'center', marginBottom: 32 },
  brandIconWrap: { width: 56, height: 56, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.15)', justifyContent: 'center', alignItems: 'center', marginRight: 14, borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.22)' },
  brandName:     { color: '#fff', fontSize: 22, fontWeight: '800' },
  brandSub:      { color: 'rgba(255,255,255,0.5)', fontSize: 11, marginTop: 2 },
  brandHeadline: { color: 'rgba(255,255,255,0.88)', fontSize: 22, fontWeight: '700', lineHeight: 32, marginBottom: 28 },
  featureRow:    { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  featureIcon:   { width: 38, height: 38, borderRadius: 10, backgroundColor: 'rgba(255,255,255,0.1)', justifyContent: 'center', alignItems: 'center', marginRight: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.13)' },
  featureText:   { color: 'rgba(255,255,255,0.78)', fontSize: 13, fontWeight: '500' },
  brandFooter:   { marginTop: 32, paddingTop: 20, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.1)' },
  brandFooterTxt:{ color: 'rgba(255,255,255,0.4)', fontSize: 11 },

  /* Form panel */
  formPanel:  { flex: 1, backgroundColor: '#f5f6fa' },
  formScroll: { flexGrow: 1, justifyContent: 'center' },
  formInner:  { padding: 32, maxWidth: 440, alignSelf: 'center', width: '100%' },

  /* Logo (mobile) */
  logoWrap:  { alignItems: 'center', marginBottom: 32, marginTop: 16 },
  logoBox:   { width: 72, height: 72, borderRadius: 20, backgroundColor: C.primary, justifyContent: 'center', alignItems: 'center', marginBottom: 12, shadowColor: C.primary, shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.3, shadowRadius: 12, elevation: 8 },
  logoEmoji: { fontSize: 34 },
  logoName:  { fontSize: 22, fontWeight: '800', color: '#1a1a2e' },
  logoSub:   { fontSize: 11, color: '#888', marginTop: 3 },

  /* Headings */
  welcomeTxt: { fontSize: 15, color: '#666', marginBottom: 4 },
  headingTxt: { fontSize: 28, fontWeight: '800', color: '#1a1a2e', marginBottom: 28, lineHeight: 34 },

  /* Inputs */
  fieldLabel: { fontSize: 13, fontWeight: '600', color: '#444', marginBottom: 8 },
  inputBox: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#fff', borderRadius: 10,
    borderWidth: 1.5, borderColor: '#dde1ea',
    paddingHorizontal: 16, marginBottom: 20,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 4, elevation: 1,
  },
  input: { flex: 1, paddingVertical: 14, fontSize: 15, color: '#1a1a2e' },
  eyeBtn:  { padding: 4 },
  eyeIcon: { fontSize: 18 },

  /* Remember + forgot */
  remRow:   { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 },
  checkRow: { flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 },
  checkbox: {
    width: 20, height: 20, borderRadius: 6,
    borderWidth: 2, borderColor: '#c0c4cf',
    justifyContent: 'center', alignItems: 'center',
    backgroundColor: '#fff',
  },
  checkboxOn: { backgroundColor: C.primary, borderColor: C.primary },
  checkmark:  { color: '#fff', fontSize: 11, fontWeight: '800' },
  remTxt:    { fontSize: 13, color: '#444', fontWeight: '500' },
  forgotTxt: { fontSize: 13, color: C.primary, fontWeight: '600' },

  /* Terms */
  termsTxt:  { fontSize: 12, color: '#666', flex: 1, lineHeight: 18 },
  termsLink: { color: C.primary, fontWeight: '600' },

  /* Login button */
  loginBtn: {
    flexDirection: 'row', justifyContent: 'center', alignItems: 'center',
    backgroundColor: C.primary, borderRadius: 12,
    paddingVertical: 17, marginTop: 24, marginBottom: 20,
    shadowColor: C.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 12, elevation: 6,
  },
  loginBtnDisabled: { backgroundColor: '#9eabbd', shadowOpacity: 0 },
  loginBtnTxt: { color: '#fff', fontSize: 16, fontWeight: '800', letterSpacing: 0.3 },

  /* Bottom register link */
  bottomRow: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center' },
  bottomTxt: { fontSize: 13, color: '#888' },
  bottomLink:{ fontSize: 13, color: C.primary, fontWeight: '700' },
});
