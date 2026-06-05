import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  Alert, Platform, ScrollView, TextInput, ActivityIndicator, Modal,
} from 'react-native';
import { signOut } from 'firebase/auth';
import { auth, IS_DEMO } from '../services/firebase';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useToast } from '../context/ToastContext';
import { useLang } from '../context/LanguageContext';
import { useAppData } from '../context/AppDataContext';
import { C } from '../constants/theme';

const VERSION = '1.0.0';

export default function ProfileScreen({ navigation, switchTab }) {
  const { user, isAdmin, demoLogout, updateDisplayName, changePassword } = useAuth();
  const { cart, total, itemCount } = useCart();
  const { showToast } = useToast();
  const { lang, switchLang, t } = useLang();
  const { exportData, importData } = useAppData();

  // Edit name state
  const [editingName, setEditingName]   = useState(false);
  const [newName, setNewName]           = useState('');
  const [savingName, setSavingName]     = useState(false);

  // Change password modal
  const [showPassModal, setShowPassModal]   = useState(false);
  const [currentPass, setCurrentPass]       = useState('');
  const [newPass, setNewPass]               = useState('');
  const [confirmPass, setConfirmPass]       = useState('');
  const [savingPass, setSavingPass]         = useState(false);
  const [showCurrent, setShowCurrent]       = useState(false);
  const [showNew, setShowNew]               = useState(false);
  const [showConfirm, setShowConfirm]       = useState(false);

  const initials = user?.displayName
    ? user.displayName.split(' ').filter(Boolean).map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : (user?.email?.[0] || '?').toUpperCase();

  const handleLogout = () => {
    if (Platform.OS === 'web') {
      if (!window.confirm('Logout karna chahte hain?')) return;
      IS_DEMO ? demoLogout() : signOut(auth);
      return;
    }
    Alert.alert('Logout', 'Kya aap logout karna chahte hain?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Logout', style: 'destructive', onPress: () => IS_DEMO ? demoLogout() : signOut(auth) },
    ]);
  };

  const startEditName = () => {
    setNewName(user?.displayName || '');
    setEditingName(true);
  };

  const saveName = async () => {
    if (!newName.trim()) { showToast('Name khali nahi ho sakta', 'error'); return; }
    setSavingName(true);
    try {
      await updateDisplayName(newName.trim());
      setEditingName(false);
      showToast('Name update ho gaya!', 'success');
    } catch (e) {
      showToast(e.message || 'Name update nahi ho saka', 'error');
    } finally {
      setSavingName(false);
    }
  };

  const savePassword = async () => {
    if (!newPass || newPass.length < 6) { showToast('Password kam se kam 6 characters', 'error'); return; }
    if (newPass !== confirmPass) { showToast('Passwords match nahi karte', 'error'); return; }
    setSavingPass(true);
    try {
      await changePassword(currentPass, newPass);
      setShowPassModal(false);
      setCurrentPass(''); setNewPass(''); setConfirmPass('');
      setShowCurrent(false); setShowNew(false);
      showToast('Password change ho gaya!', 'success');
    } catch (e) {
      showToast(e.message?.includes('wrong-password') ? 'Current password galat hai' : (e.message || 'Password change nahi ho saka'), 'error');
    } finally {
      setSavingPass(false);
    }
  };

  const MenuItem = ({ icon, label, sublabel, onPress, danger, badge }) => (
    <TouchableOpacity
      style={[s.menuItem, danger && s.menuItemDanger]}
      onPress={onPress}
      activeOpacity={0.78}
      disabled={!onPress}
    >
      <Text style={s.menuIcon}>{icon}</Text>
      <View style={{ flex: 1 }}>
        <Text style={[s.menuLabel, danger && { color: '#ef4444' }]}>{label}</Text>
        {sublabel ? <Text style={s.menuSub}>{sublabel}</Text> : null}
      </View>
      {badge !== undefined && (
        <View style={s.menuBadge}><Text style={s.menuBadgeTxt}>{badge}</Text></View>
      )}
      {onPress && !danger && <Text style={s.menuArrow}>›</Text>}
    </TouchableOpacity>
  );

  return (
    <ScrollView style={s.root} showsVerticalScrollIndicator>

      {/* Header */}
      <View style={s.header}>
        <Text style={s.headerTitle}>My Account</Text>
      </View>

      {/* Profile Card */}
      <View style={s.profileCard}>
        <View style={s.avatar}>
          <Text style={s.avatarTxt}>{initials}</Text>
        </View>

        {editingName ? (
          <View style={s.nameEditRow}>
            <TextInput
              style={s.nameInput}
              value={newName}
              onChangeText={setNewName}
              placeholder="Your name"
              autoFocus
              onSubmitEditing={saveName}
            />
            <TouchableOpacity style={s.nameSaveBtn} onPress={saveName} disabled={savingName}>
              {savingName
                ? <ActivityIndicator size="small" color="#fff" />
                : <Text style={s.nameSaveTxt}>Save</Text>
              }
            </TouchableOpacity>
            <TouchableOpacity style={s.nameCancelBtn} onPress={() => setEditingName(false)}>
              <Text style={s.nameCancelTxt}>✕</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity style={s.nameRow} onPress={startEditName} activeOpacity={0.75}>
            <Text style={s.userName}>{user?.displayName || 'Customer'}</Text>
            <Text style={s.editNameIcon}>✏️</Text>
          </TouchableOpacity>
        )}

        <Text style={s.userEmail}>{user?.email}</Text>
        {isAdmin && (
          <View style={s.adminBadge}>
            <Text style={s.adminBadgeTxt}>⚙️  Admin Account</Text>
          </View>
        )}
      </View>

      {/* Stats */}
      <View style={s.statsRow}>
        <View style={[s.statCard, { backgroundColor: '#eff6ff' }]}>
          <Text style={s.statIcon}>🛒</Text>
          <Text style={[s.statVal, { color: C.primary }]}>{itemCount}</Text>
          <Text style={s.statLbl}>Cart Items</Text>
        </View>
        <View style={[s.statCard, { backgroundColor: '#f0fdf4' }]}>
          <Text style={s.statIcon}>💰</Text>
          <Text style={[s.statVal, { color: '#15803d' }]}>
            {total > 0 ? `Rs.${total.toLocaleString()}` : '—'}
          </Text>
          <Text style={s.statLbl}>Cart Total</Text>
        </View>
        <View style={[s.statCard, { backgroundColor: '#fffbeb' }]}>
          <Text style={s.statIcon}>{isAdmin ? '⚙️' : '👤'}</Text>
          <Text style={[s.statVal, { color: '#92400e', fontSize: 13 }]}>
            {isAdmin ? 'Admin' : 'Customer'}
          </Text>
          <Text style={s.statLbl}>Account</Text>
        </View>
      </View>

      {/* Account Settings */}
      <View style={s.section}>
        <Text style={s.sectionLabel}>ACCOUNT SETTINGS</Text>
        <MenuItem
          icon="✏️"
          label="Edit Name"
          sublabel={user?.displayName || 'Tap to set your name'}
          onPress={startEditName}
        />
        <MenuItem
          icon="🔐"
          label="Change Password"
          sublabel={'Update your password'}
          onPress={() => setShowPassModal(true)}
        />
      </View>

      {/* Quick Actions */}
      <View style={s.section}>
        <Text style={s.sectionLabel}>QUICK ACTIONS</Text>
        {isAdmin && (
          <MenuItem
            icon="⚙️"
            label="Admin Panel"
            sublabel="Manage products, stock & catalog"
            onPress={() => navigation.navigate('Admin')}
          />
        )}
        {isAdmin && (
          <MenuItem
            icon="➕"
            label="Add New Product"
            sublabel="Add items to the catalog"
            onPress={() => navigation.navigate('AddItem', { product: null })}
          />
        )}
        <MenuItem
          icon="🛒"
          label="My Cart"
          sublabel={itemCount > 0 ? `${itemCount} items · Rs.${total.toLocaleString()}` : 'Your cart is empty'}
          badge={itemCount > 0 ? itemCount : undefined}
          onPress={() => switchTab ? switchTab('Cart') : navigation.navigate('Cart')}
        />
      </View>

      {/* Language */}
      <View style={s.section}>
        <Text style={s.sectionLabel}>LANGUAGE / زبان</Text>
        <View style={s.langCard}>
          <Text style={s.langTitle}>🌐 Select Language</Text>
          <View style={s.langBtns}>
            <TouchableOpacity
              style={[s.langBtn, lang === 'en' && s.langBtnActive]}
              onPress={() => switchLang('en')}
            >
              <Text style={[s.langBtnTxt, lang === 'en' && s.langBtnTxtActive]}>🇺🇸 English</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[s.langBtn, lang === 'ur' && s.langBtnActive]}
              onPress={() => switchLang('ur')}
            >
              <Text style={[s.langBtnTxt, lang === 'ur' && s.langBtnTxtActive]}>🇵🇰 اردو</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Backup & Restore */}
      <View style={s.section}>
        <Text style={s.sectionLabel}>BACKUP & RESTORE</Text>
        <MenuItem
          icon="💾"
          label="Backup Data"
          sublabel="Export customers, orders & payments"
          onPress={() => {
            const json = exportData();
            if (Platform.OS === 'web') {
              const blob = new Blob([json], { type: 'application/json' });
              const url  = URL.createObjectURL(blob);
              const a    = document.createElement('a');
              a.href     = url;
              a.download = `dawood-trader-backup-${Date.now()}.json`;
              a.click();
              URL.revokeObjectURL(url);
              showToast('Backup downloaded!', 'success');
            } else {
              showToast('Backup: ' + json.slice(0, 60) + '...', 'info');
            }
          }}
        />
        <MenuItem
          icon="🔄"
          label="Restore Data"
          sublabel="Import from backup file (web only)"
          onPress={() => {
            if (Platform.OS !== 'web') { showToast('Restore is web-only', 'info'); return; }
            const input = document.createElement('input');
            input.type  = 'file';
            input.accept = '.json';
            input.onchange = (e) => {
              const file = e.target.files[0];
              if (!file) return;
              const reader = new FileReader();
              reader.onload = (ev) => {
                try {
                  importData(ev.target.result);
                  showToast('Data restored!', 'success');
                } catch {
                  showToast('Invalid backup file', 'error');
                }
              };
              reader.readAsText(file);
            };
            input.click();
          }}
        />
      </View>

      {/* App Info */}
      <View style={s.section}>
        <Text style={s.sectionLabel}>APP INFO</Text>
        <MenuItem icon="🏪" label="Dawood Trader" sublabel="Pakistan ka trusted wholesale platform" />
        <MenuItem icon="💬" label="WhatsApp Order" sublabel="0336-4459040 — Direct se order karein" />
        <MenuItem icon="📦" label={`Version v${VERSION}`} sublabel="Production ready — PWA supported" />
      </View>

      {/* Logout */}
      <View style={[s.section, { marginBottom: 40 }]}>
        <MenuItem icon="🚪" label="Logout" sublabel={user?.email} onPress={handleLogout} danger />
      </View>

      {/* Password Change Modal */}
      <Modal visible={showPassModal} transparent animationType="slide" onRequestClose={() => setShowPassModal(false)}>
        <View style={s.modalOverlay}>
          <View style={s.modalCard}>
            <Text style={s.modalTitle}>🔐 Change Password</Text>

            <Text style={s.inputLabel}>Current Password</Text>
            <View style={s.passRow}>
              <TextInput
                style={s.modalInput}
                value={currentPass}
                onChangeText={setCurrentPass}
                secureTextEntry={!showCurrent}
                placeholder="Current password"
                placeholderTextColor="#94a3b8"
              />
              <TouchableOpacity onPress={() => setShowCurrent(v => !v)} style={s.eyeBtn}>
                <Text>{showCurrent ? '🙈' : '👁️'}</Text>
              </TouchableOpacity>
            </View>

            <Text style={s.inputLabel}>New Password</Text>
            <View style={s.passRow}>
              <TextInput
                style={s.modalInput}
                value={newPass}
                onChangeText={setNewPass}
                secureTextEntry={!showNew}
                placeholder="Min 6 characters"
                placeholderTextColor="#94a3b8"
              />
              <TouchableOpacity onPress={() => setShowNew(v => !v)} style={s.eyeBtn}>
                <Text>{showNew ? '🙈' : '👁️'}</Text>
              </TouchableOpacity>
            </View>

            <Text style={s.inputLabel}>Confirm New Password</Text>
            <View style={s.passRow}>
              <TextInput
                style={[s.modalInput, { marginBottom: 0 }]}
                value={confirmPass}
                onChangeText={setConfirmPass}
                secureTextEntry={!showConfirm}
                placeholder="Repeat new password"
                placeholderTextColor="#94a3b8"
              />
              <TouchableOpacity onPress={() => setShowConfirm(v => !v)} style={s.eyeBtn}>
                <Text>{showConfirm ? '🙈' : '👁️'}</Text>
              </TouchableOpacity>
            </View>
            <View style={{ marginBottom: 20 }} />

            <View style={s.modalBtns}>
              <TouchableOpacity style={s.modalCancelBtn} onPress={() => setShowPassModal(false)}>
                <Text style={s.modalCancelTxt}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[s.modalSaveBtn, savingPass && { opacity: 0.6 }]} onPress={savePassword} disabled={savingPass}>
                {savingPass
                  ? <ActivityIndicator size="small" color="#fff" />
                  : <Text style={s.modalSaveTxt}>Update Password</Text>
                }
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

    </ScrollView>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#f0f4ff' },

  header: {
    backgroundColor: C.primary,
    paddingTop: Platform.OS === 'web' ? 20 : 54,
    paddingBottom: 22, paddingHorizontal: 20,
  },
  headerTitle: { color: '#fff', fontSize: 24, fontWeight: '800' },
  demoPill:    { backgroundColor: 'rgba(245,158,11,0.25)', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4, alignSelf: 'flex-start', marginBottom: 10, borderWidth: 1, borderColor: 'rgba(245,158,11,0.4)' },
  demoPillTxt: { color: '#fbbf24', fontSize: 11, fontWeight: '700' },

  profileCard: {
    backgroundColor: C.surface, marginHorizontal: 16, marginTop: -2,
    borderRadius: 20, padding: 28, alignItems: 'center',
    shadowColor: C.primary, shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1, shadowRadius: 20, elevation: 6, marginBottom: 4,
  },
  avatar: {
    width: 82, height: 82, borderRadius: 41,
    backgroundColor: C.primary, justifyContent: 'center', alignItems: 'center',
    marginBottom: 14,
    shadowColor: C.primary, shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35, shadowRadius: 12, elevation: 6,
    borderWidth: 3, borderColor: '#bfdbfe',
  },
  avatarTxt:    { color: '#fff', fontSize: 28, fontWeight: '800' },
  nameRow:      { flexDirection: 'row', alignItems: 'center', gap: 6 },
  userName:     { fontSize: 20, fontWeight: '800', color: C.text, marginBottom: 2 },
  editNameIcon: { fontSize: 14, marginBottom: 2 },
  userEmail:    { fontSize: 13, color: C.textLight, marginBottom: 4 },
  adminBadge:   { backgroundColor: '#eff6ff', borderRadius: 20, paddingHorizontal: 16, paddingVertical: 6, marginTop: 10, borderWidth: 1, borderColor: '#bfdbfe' },
  adminBadgeTxt:{ color: C.primary, fontSize: 13, fontWeight: '700' },

  nameEditRow:   { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4, width: '100%', justifyContent: 'center' },
  nameInput:     { flex: 1, borderWidth: 1.5, borderColor: C.primary, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8, fontSize: 15, color: C.text, backgroundColor: '#f8faff' },
  nameSaveBtn:   { backgroundColor: C.primary, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 9 },
  nameSaveTxt:   { color: '#fff', fontWeight: '700', fontSize: 13 },
  nameCancelBtn: { backgroundColor: '#f1f5f9', borderRadius: 10, width: 36, height: 36, justifyContent: 'center', alignItems: 'center' },
  nameCancelTxt: { color: '#64748b', fontWeight: '700' },

  statsRow: { flexDirection: 'row', marginHorizontal: 16, marginTop: 16, gap: 10 },
  statCard: { flex: 1, borderRadius: 14, padding: 14, alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 6, elevation: 2 },
  statIcon: { fontSize: 22, marginBottom: 6 },
  statVal:  { fontSize: 16, fontWeight: '800', marginBottom: 3 },
  statLbl:  { fontSize: 9, fontWeight: '600', color: C.textLight, textAlign: 'center' },

  section:      { marginHorizontal: 16, marginTop: 20 },
  sectionLabel: { fontSize: 11, fontWeight: '700', color: C.textLight, letterSpacing: 1, marginBottom: 8, paddingHorizontal: 4 },
  menuItem: {
    backgroundColor: C.surface, borderRadius: 14, padding: 16,
    flexDirection: 'row', alignItems: 'center', marginBottom: 8,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04, shadowRadius: 4, elevation: 2,
  },
  menuItemDanger: { borderWidth: 1.5, borderColor: '#fee2e2', backgroundColor: '#fff5f5' },
  menuIcon:     { fontSize: 20, marginRight: 14, width: 28, textAlign: 'center' },
  menuLabel:    { fontSize: 14, fontWeight: '700', color: C.text },
  menuSub:      { fontSize: 11, color: C.textLight, marginTop: 2 },
  menuArrow:    { fontSize: 22, color: '#d1d5db' },
  menuBadge:    { backgroundColor: C.danger, borderRadius: 10, minWidth: 22, height: 22, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 5, marginRight: 8 },
  menuBadgeTxt: { color: '#fff', fontSize: 11, fontWeight: '800' },

  /* Language */
  langCard:    { backgroundColor: C.surface, borderRadius: 14, padding: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 4, elevation: 2 },
  langTitle:   { fontSize: 13, fontWeight: '700', color: C.text, marginBottom: 12 },
  langBtns:    { flexDirection: 'row', gap: 10 },
  langBtn:     { flex: 1, backgroundColor: C.bg, borderRadius: 10, paddingVertical: 12, alignItems: 'center', borderWidth: 1.5, borderColor: C.border },
  langBtnActive: { backgroundColor: C.primaryLight, borderColor: C.primary },
  langBtnTxt:    { fontSize: 14, fontWeight: '600', color: C.textMid },
  langBtnTxtActive: { color: C.primary, fontWeight: '800' },

  /* Password modal */
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.55)', justifyContent: 'flex-end' },
  modalCard: {
    backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24,
    padding: 28, paddingBottom: Platform.OS === 'ios' ? 44 : 28,
  },
  modalTitle:  { fontSize: 18, fontWeight: '800', color: C.text, marginBottom: 20, textAlign: 'center' },
  inputLabel:  { fontSize: 12, fontWeight: '600', color: C.textMid, marginBottom: 6 },
  passRow:     { flexDirection: 'row', alignItems: 'center', marginBottom: 14 },
  modalInput:  { flex: 1, borderWidth: 1.5, borderColor: '#e2e8f0', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, fontSize: 14, color: C.text, backgroundColor: '#f8fafc' },
  eyeBtn:      { paddingHorizontal: 10, paddingVertical: 10 },
  modalBtns:   { flexDirection: 'row', gap: 12 },
  modalCancelBtn: { flex: 1, backgroundColor: '#f1f5f9', borderRadius: 12, paddingVertical: 14, alignItems: 'center' },
  modalCancelTxt: { color: C.textMid, fontWeight: '700', fontSize: 14 },
  modalSaveBtn:   { flex: 2, backgroundColor: C.primary, borderRadius: 12, paddingVertical: 14, alignItems: 'center' },
  modalSaveTxt:   { color: '#fff', fontWeight: '800', fontSize: 14 },
});
