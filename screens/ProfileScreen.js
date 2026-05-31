import React from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  Alert, Platform, ScrollView,
} from 'react-native';
import { signOut } from 'firebase/auth';
import { auth, IS_DEMO } from '../services/firebase';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { C } from '../constants/theme';

const VERSION = '1.0.0';

export default function ProfileScreen({ navigation }) {
  const { user, isAdmin, demoLogout } = useAuth();
  const { cart, total, itemCount }    = useCart();

  const initials = user?.displayName
    ? user.displayName.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
    : (user?.email?.[0] || '?').toUpperCase();

  const handleLogout = () => {
    Alert.alert('Logout', 'Kya aap logout karna chahte hain?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Logout', style: 'destructive', onPress: () => IS_DEMO ? demoLogout() : signOut(auth) },
    ]);
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
        <View style={s.menuBadge}>
          <Text style={s.menuBadgeTxt}>{badge}</Text>
        </View>
      )}
      {onPress && !danger && <Text style={s.menuArrow}>›</Text>}
    </TouchableOpacity>
  );

  return (
    <ScrollView style={[s.root, { overflow: 'hidden' }]} showsVerticalScrollIndicator>

      {/* ── Header ── */}
      <View style={s.header}>
        {IS_DEMO && (
          <View style={s.demoPill}><Text style={s.demoPillTxt}>Demo Mode</Text></View>
        )}
        <Text style={s.headerTitle}>My Account</Text>
      </View>

      {/* ── Profile card ── */}
      <View style={s.profileCard}>
        <View style={s.avatar}>
          <Text style={s.avatarTxt}>{initials}</Text>
        </View>
        <Text style={s.userName}>{user?.displayName || 'Customer'}</Text>
        <Text style={s.userEmail}>{user?.email}</Text>
        {isAdmin && (
          <View style={s.adminBadge}>
            <Text style={s.adminBadgeTxt}>⚙️  Admin Account</Text>
          </View>
        )}
      </View>

      {/* ── Cart summary stats ── */}
      <View style={s.statsRow}>
        <View style={[s.statCard, { backgroundColor: '#eff6ff' }]}>
          <Text style={s.statIcon}>🛒</Text>
          <Text style={[s.statVal, { color: C.primary }]}>{itemCount}</Text>
          <Text style={s.statLbl}>Cart Items</Text>
        </View>
        <View style={[s.statCard, { backgroundColor: '#f0fdf4' }]}>
          <Text style={s.statIcon}>💰</Text>
          <Text style={[s.statVal, { color: '#15803d' }]}>
            {total > 0 ? `Rs.${total.toLocaleString()}` : 'Rs. 0'}
          </Text>
          <Text style={s.statLbl}>Cart Total</Text>
        </View>
        <View style={[s.statCard, { backgroundColor: '#fffbeb' }]}>
          <Text style={s.statIcon}>{isAdmin ? '⚙️' : '👤'}</Text>
          <Text style={[s.statVal, { color: '#92400e', fontSize: 13 }]}>
            {isAdmin ? 'Admin' : 'Customer'}
          </Text>
          <Text style={s.statLbl}>Account Type</Text>
        </View>
      </View>

      {/* ── Quick Actions ── */}
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
          onPress={() => navigation.navigate('Cart')}
        />
      </View>

      {/* ── App Info ── */}
      <View style={s.section}>
        <Text style={s.sectionLabel}>APP INFO</Text>
        <MenuItem
          icon="🏪"
          label="Dawood Trader"
          sublabel="Pakistan ka trusted wholesale platform"
        />
        <MenuItem
          icon="💬"
          label="WhatsApp Order"
          sublabel="0336-4459040 — Direct se order karein"
        />
        <MenuItem
          icon="📦"
          label="Version"
          sublabel={`v${VERSION} — Production ready`}
        />
        {IS_DEMO && (
          <MenuItem
            icon="🧪"
            label="Demo Mode Active"
            sublabel="Firebase se connect karein live data ke liye"
          />
        )}
      </View>

      {/* ── Logout ── */}
      <View style={[s.section, { marginBottom: 40 }]}>
        <MenuItem
          icon="🚪"
          label="Logout"
          sublabel={user?.email}
          onPress={handleLogout}
          danger
        />
      </View>

    </ScrollView>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#f0f4ff' },

  header: {
    backgroundColor: C.primary,
    paddingTop: Platform.OS === 'web' ? 20 : 54,
    paddingBottom: 22,
    paddingHorizontal: 20,
  },
  headerTitle: { color: '#fff', fontSize: 24, fontWeight: '800' },
  demoPill:    { backgroundColor: 'rgba(245,158,11,0.25)', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4, alignSelf: 'flex-start', marginBottom: 10, borderWidth: 1, borderColor: 'rgba(245,158,11,0.4)' },
  demoPillTxt: { color: '#fbbf24', fontSize: 11, fontWeight: '700' },

  profileCard: {
    backgroundColor: C.surface, marginHorizontal: 16, marginTop: -2,
    borderRadius: 20, padding: 28, alignItems: 'center',
    shadowColor: C.primary, shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1, shadowRadius: 20, elevation: 6,
    marginBottom: 4,
  },
  avatar: {
    width: 82, height: 82, borderRadius: 41,
    backgroundColor: C.primary, justifyContent: 'center', alignItems: 'center',
    marginBottom: 14,
    shadowColor: C.primary, shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35, shadowRadius: 12, elevation: 6,
    borderWidth: 3, borderColor: '#bfdbfe',
  },
  avatarTxt:  { color: '#fff', fontSize: 28, fontWeight: '800' },
  userName:   { fontSize: 20, fontWeight: '800', color: C.text, marginBottom: 4 },
  userEmail:  { fontSize: 13, color: C.textLight },
  adminBadge: { backgroundColor: '#eff6ff', borderRadius: 20, paddingHorizontal: 16, paddingVertical: 6, marginTop: 12, borderWidth: 1, borderColor: '#bfdbfe' },
  adminBadgeTxt: { color: C.primary, fontSize: 13, fontWeight: '700' },

  statsRow: { flexDirection: 'row', marginHorizontal: 16, marginTop: 16, gap: 10 },
  statCard: { flex: 1, borderRadius: 14, padding: 14, alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 6, elevation: 2 },
  statIcon: { fontSize: 22, marginBottom: 6 },
  statVal:  { fontSize: 16, fontWeight: '800', marginBottom: 3 },
  statLbl:  { fontSize: 9, fontWeight: '600', color: C.textLight, textAlign: 'center' },

  section:       { marginHorizontal: 16, marginTop: 20 },
  sectionLabel:  { fontSize: 11, fontWeight: '700', color: C.textLight, letterSpacing: 1, marginBottom: 8, paddingHorizontal: 4 },

  menuItem: {
    backgroundColor: C.surface, borderRadius: 14, padding: 16,
    flexDirection: 'row', alignItems: 'center', marginBottom: 8,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04, shadowRadius: 4, elevation: 2,
  },
  menuItemDanger: { borderWidth: 1.5, borderColor: '#fee2e2', backgroundColor: '#fff5f5' },
  menuIcon:   { fontSize: 20, marginRight: 14, width: 28, textAlign: 'center' },
  menuLabel:  { fontSize: 14, fontWeight: '700', color: C.text },
  menuSub:    { fontSize: 11, color: C.textLight, marginTop: 2 },
  menuArrow:  { fontSize: 22, color: '#d1d5db' },
  menuBadge:  { backgroundColor: C.danger, borderRadius: 10, minWidth: 22, height: 22, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 5, marginRight: 8 },
  menuBadgeTxt:{ color: '#fff', fontSize: 11, fontWeight: '800' },
});
