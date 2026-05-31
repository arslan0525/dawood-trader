import React, { useState, useRef } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, ActivityIndicator, Alert, ScrollView,
} from 'react-native';
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { auth } from '../services/firebase';
import { useAuth } from '../context/AuthContext';
import { C } from '../constants/theme';
import InputRow from '../components/InputRow';

export default function SignupScreen({ navigation }) {
  const [name, setName]         = useState('');
  const [email, setEmail]       = useState('');
  const [phone, setPhone]       = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading]   = useState(false);
  const { IS_DEMO, demoLogin }  = useAuth();

  const nameRef     = useRef(null);
  const emailRef    = useRef(null);
  const phoneRef    = useRef(null);
  const passwordRef = useRef(null);

  const togglePass = () => {
    setShowPass((v) => !v);
    setTimeout(() => passwordRef.current?.focus(), 30);
  };

  const handleSignup = async () => {
    if (!name.trim())            { Alert.alert('Error', 'Naam likhein');  nameRef.current?.focus(); return; }
    if (!email.trim())           { Alert.alert('Error', 'Email likhein'); emailRef.current?.focus(); return; }
    if (password.length < 6)     { Alert.alert('Error', 'Password 6+ characters ka hona chahiye'); passwordRef.current?.focus(); return; }
    if (IS_DEMO)                 { demoLogin(email); return; }
    setLoading(true);
    try {
      const { user } = await createUserWithEmailAndPassword(auth, email.trim(), password);
      await updateProfile(user, { displayName: name.trim() });
    } catch (e) {
      if (e.code === 'auth/email-already-in-use') Alert.alert('Error', 'Yeh email pehle se registered hai');
      else Alert.alert('Error', 'Account nahi ban saka, dobara koshish karein');
    } finally { setLoading(false); }
  };

  return (
    <View style={styles.root}>
      <View style={styles.topBlue} />
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.brand}>
            <View style={styles.logoCircle}><Text style={{ fontSize: 38 }}>🛒</Text></View>
            <Text style={styles.brandName}>Dawood Trader</Text>
            <Text style={styles.brandSub}>Naya account banayein</Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Register</Text>

            <View style={styles.field}>
              <Text style={styles.label}>Aapka Naam</Text>
              <InputRow
                icon="👤"
                inputRef={nameRef}
                value={name}
                onChangeText={setName}
                placeholder="Naam likhein"
                autoCapitalize="words"
                returnKeyType="next"
                onSubmitEditing={() => emailRef.current?.focus()}
                blurOnSubmit={false}
              />
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>Email</Text>
              <InputRow
                icon="✉️"
                inputRef={emailRef}
                value={email}
                onChangeText={setEmail}
                placeholder="email@example.com"
                keyboardType="email-address"
                autoCapitalize="none"
                returnKeyType="next"
                onSubmitEditing={() => phoneRef.current?.focus()}
                blurOnSubmit={false}
              />
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>Phone (optional)</Text>
              <InputRow
                icon="📱"
                inputRef={phoneRef}
                value={phone}
                onChangeText={setPhone}
                placeholder="03XX-XXXXXXX"
                keyboardType="phone-pad"
                autoCapitalize="none"
                returnKeyType="next"
                onSubmitEditing={() => passwordRef.current?.focus()}
                blurOnSubmit={false}
              />
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>Password</Text>
              <InputRow
                icon="🔒"
                inputRef={passwordRef}
                value={password}
                onChangeText={setPassword}
                placeholder="Kam az kam 6 characters"
                secureTextEntry={!showPass}
                autoCapitalize="none"
                returnKeyType="done"
                onSubmitEditing={handleSignup}
                rightElement={
                  <TouchableOpacity
                    onPress={togglePass}
                    style={styles.eyeBtn}
                    hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                  >
                    <Text style={styles.eyeIcon}>{showPass ? '🙈' : '👁️'}</Text>
                  </TouchableOpacity>
                }
              />
            </View>

            <TouchableOpacity
              style={[styles.btn, loading && { opacity: 0.72 }]}
              onPress={handleSignup}
              disabled={loading}
              activeOpacity={0.88}
            >
              {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>Account Banayein →</Text>}
            </TouchableOpacity>

            <TouchableOpacity style={styles.loginRow} onPress={() => navigation.goBack()}>
              <Text style={styles.loginText}>
                Pehle se account hai? <Text style={styles.loginLink}>Login karein</Text>
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  root:       { flex: 1, backgroundColor: C.bg },
  topBlue:    { position: 'absolute', top: 0, left: 0, right: 0, height: 280, backgroundColor: C.primary, borderBottomLeftRadius: 48, borderBottomRightRadius: 48 },
  scroll:     { flexGrow: 1, paddingHorizontal: 22, paddingTop: 52, paddingBottom: 40 },

  brand:      { alignItems: 'center', marginBottom: 24 },
  logoCircle: { width: 76, height: 76, borderRadius: 38, backgroundColor: 'rgba(255,255,255,0.18)', borderWidth: 2, borderColor: 'rgba(255,255,255,0.35)', justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
  brandName:  { fontSize: 24, fontWeight: '800', color: '#fff' },
  brandSub:   { fontSize: 13, color: 'rgba(255,255,255,0.65)', marginTop: 4 },

  card:       { backgroundColor: C.surface, borderRadius: 24, padding: 24, shadowColor: C.primary, shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.12, shadowRadius: 24, elevation: 10 },
  cardTitle:  { fontSize: 22, fontWeight: '800', color: C.text, marginBottom: 20 },

  field:      { marginBottom: 16 },
  label:      { fontSize: 13, fontWeight: '600', color: C.textMid, marginBottom: 7 },
  eyeBtn:     { padding: 6 },
  eyeIcon:    { fontSize: 17 },

  btn:        { backgroundColor: C.primary, borderRadius: 10, paddingVertical: 15, alignItems: 'center', marginTop: 8, shadowColor: C.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 12, elevation: 6 },
  btnText:    { color: '#fff', fontSize: 16, fontWeight: '700' },
  loginRow:   { marginTop: 20, alignItems: 'center' },
  loginText:  { fontSize: 14, color: C.textLight },
  loginLink:  { color: C.primary, fontWeight: '700' },
});
