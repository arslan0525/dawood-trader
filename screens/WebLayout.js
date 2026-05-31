import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { signOut } from 'firebase/auth';
import { auth, IS_DEMO } from '../services/firebase';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { C } from '../constants/theme';

import HomeScreen    from './HomeScreen';
import CartScreen    from './CartScreen';
import ProfileScreen from './ProfileScreen';
import AddItemScreen from './AddItemScreen';

const TABS = [
  { key: 'Home',       label: 'Home',     icon: '🏠' },
  { key: 'Cart',       label: 'Cart',     icon: '🛒' },
  { key: 'AddProduct', label: 'Add Item', icon: '➕' },
  { key: 'Profile',    label: 'Profile',  icon: '👤' },
];

function NavItem({ tab, isActive, onPress, badge }) {
  return (
    <TouchableOpacity style={[s.navItem, isActive && s.navItemActive]} onPress={onPress} activeOpacity={0.75}>
      <View style={[s.navIconWrap, isActive && s.navIconWrapActive]}>
        <Text style={s.navIcon}>{tab.icon}</Text>
      </View>
      <Text style={[s.navLabel, isActive && s.navLabelActive]}>{tab.label}</Text>
      {badge > 0 && (
        <View style={s.badge}><Text style={s.badgeText}>{badge > 9 ? '9+' : badge}</Text></View>
      )}
    </TouchableOpacity>
  );
}

export default function WebLayout({ navigation }) {
  const [activeTab, setActiveTab]  = useState('Home');
  const { user, isAdmin, demoLogout } = useAuth();
  const { itemCount }              = useCart();

  const initials = user?.displayName
    ? user.displayName.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
    : (user?.email?.[0] || '?').toUpperCase();

  const handleLogout = () => {
    Alert.alert('Logout', 'Kya aap logout karna chahte hain?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Logout', style: 'destructive', onPress: () => IS_DEMO ? demoLogout() : signOut(auth) },
    ]);
  };

  const renderContent = () => {
    const props = { navigation, switchTab: setActiveTab };
    if (activeTab === 'Home')       return <HomeScreen {...props} />;
    if (activeTab === 'Cart')       return <CartScreen {...props} />;
    if (activeTab === 'Profile')    return <ProfileScreen {...props} />;
    if (activeTab === 'AddProduct') return (
      <AddItemScreen
        navigation={navigation}
        route={{ params: { product: null, tabMode: true } }}
      />
    );
  };

  return (
    <View style={s.root}>
      {/* ── Sidebar ── */}
      <View style={s.sidebar}>
        {/* Brand */}
        <View style={s.brand}>
          <View style={s.brandIconBox}><Text style={{ fontSize: 22 }}>🛒</Text></View>
          <View style={{ flex: 1 }}>
            <Text style={s.brandName}>Dawood Trader</Text>
            <Text style={s.brandSub}>Pakistan Wholesale Store</Text>
          </View>
        </View>

        {/* Nav */}
        <View style={s.navSection}>
          <Text style={s.sectionLabel}>MENU</Text>
          {TABS.map((tab) => (
            <NavItem
              key={tab.key}
              tab={tab}
              isActive={activeTab === tab.key}
              onPress={() => setActiveTab(tab.key)}
              badge={tab.key === 'Cart' ? itemCount : 0}
            />
          ))}
        </View>

        {isAdmin && (
          <View style={s.navSection}>
            <Text style={s.sectionLabel}>ADMIN</Text>
            <TouchableOpacity style={s.navItem} onPress={() => navigation.navigate('Admin')} activeOpacity={0.75}>
              <View style={s.navIconWrap}><Text style={s.navIcon}>⚙️</Text></View>
              <Text style={s.navLabel}>Manage Products</Text>
            </TouchableOpacity>
          </View>
        )}

        <View style={{ flex: 1 }} />

        {/* User card */}
        <View style={s.userSection}>
          {IS_DEMO && (
            <View style={s.demoPill}><Text style={s.demoPillText}>Demo Mode</Text></View>
          )}
          <View style={s.userCard}>
            <View style={s.avatar}><Text style={s.avatarText}>{initials}</Text></View>
            <View style={{ flex: 1 }}>
              <Text style={s.userName} numberOfLines={1}>{user?.displayName || 'User'}</Text>
              <Text style={s.userEmail} numberOfLines={1}>{user?.email}</Text>
            </View>
          </View>
          <TouchableOpacity style={s.logoutBtn} onPress={handleLogout} activeOpacity={0.8}>
            <Text style={{ fontSize: 14 }}>🚪</Text>
            <Text style={s.logoutText}>Logout</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* ── Content ── */}
      <View style={s.content}>{renderContent()}</View>
    </View>
  );
}

const s = StyleSheet.create({
  root:    { flex: 1, flexDirection: 'row', backgroundColor: C.bg, height: '100%', overflow: 'hidden' },

  sidebar: { width: 240, backgroundColor: C.sidebar, flexDirection: 'column', overflow: 'hidden' },

  brand: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 18, paddingVertical: 20,
    borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.06)',
  },
  brandIconBox: { width: 38, height: 38, borderRadius: 10, backgroundColor: C.primary, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  brandName:    { color: '#f1f5f9', fontSize: 14, fontWeight: '800' },
  brandSub:     { color: 'rgba(255,255,255,0.35)', fontSize: 10, marginTop: 1 },

  navSection:   { paddingHorizontal: 12, paddingTop: 18 },
  sectionLabel: { color: 'rgba(255,255,255,0.28)', fontSize: 10, fontWeight: '700', letterSpacing: 1.2, paddingHorizontal: 8, marginBottom: 6 },

  navItem:       { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 10, borderRadius: 8, marginBottom: 2 },
  navItemActive: { backgroundColor: 'rgba(37,99,235,0.35)' },
  navIconWrap:       { width: 32, height: 32, borderRadius: 8, backgroundColor: 'rgba(255,255,255,0.06)', justifyContent: 'center', alignItems: 'center', marginRight: 11 },
  navIconWrapActive: { backgroundColor: 'rgba(37,99,235,0.5)' },
  navIcon:       { fontSize: 16 },
  navLabel:      { flex: 1, color: 'rgba(255,255,255,0.5)', fontSize: 13, fontWeight: '500' },
  navLabelActive:{ color: '#fff', fontWeight: '700' },
  badge:         { backgroundColor: C.danger, borderRadius: 9, minWidth: 18, height: 18, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 4 },
  badgeText:     { color: '#fff', fontSize: 9, fontWeight: '800' },

  userSection:  { paddingHorizontal: 12, paddingVertical: 16, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.06)' },
  demoPill:     { backgroundColor: 'rgba(245,158,11,0.15)', borderRadius: 6, paddingHorizontal: 10, paddingVertical: 4, marginBottom: 12, alignSelf: 'flex-start', borderWidth: 1, borderColor: 'rgba(245,158,11,0.25)' },
  demoPillText: { color: '#fbbf24', fontSize: 10, fontWeight: '700' },
  userCard:     { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  avatar:       { width: 34, height: 34, borderRadius: 17, backgroundColor: C.primary, justifyContent: 'center', alignItems: 'center', marginRight: 10 },
  avatarText:   { color: '#fff', fontSize: 12, fontWeight: '800' },
  userName:     { color: '#e2e8f0', fontSize: 13, fontWeight: '600' },
  userEmail:    { color: 'rgba(255,255,255,0.3)', fontSize: 10, marginTop: 1 },
  logoutBtn:    { flexDirection: 'row', alignItems: 'center', paddingVertical: 9, paddingHorizontal: 12, borderRadius: 8, backgroundColor: 'rgba(220,38,38,0.1)', borderWidth: 1, borderColor: 'rgba(220,38,38,0.2)' },
  logoutText:   { color: '#fca5a5', fontSize: 12, fontWeight: '600', marginLeft: 8 },

  content: { flex: 1, backgroundColor: C.bg, overflow: 'hidden' },
});
