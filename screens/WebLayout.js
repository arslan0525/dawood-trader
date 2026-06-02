import React, { useState, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, Alert,
  useWindowDimensions, Platform, ScrollView,
} from 'react-native';
import { signOut } from 'firebase/auth';
import { auth, IS_DEMO } from '../services/firebase';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useToast } from '../context/ToastContext';
import { useLang } from '../context/LanguageContext';
import { C } from '../constants/theme';

import HomeScreen         from './HomeScreen';
import CartScreen         from './CartScreen';
import ProfileScreen      from './ProfileScreen';
import AddItemScreen      from './AddItemScreen';
import DashboardScreen    from './DashboardScreen';
import CustomersScreen    from './CustomersScreen';
import OrdersScreen       from './OrdersScreen';
import OrderHistoryScreen from './OrderHistoryScreen';
import RecoveryScreen     from './RecoveryScreen';
import AdminScreen        from './AdminScreen';

// ── Nav structure ─────────────────────────────────────────────
const MAIN_TABS = [
  { key: 'Dashboard',    label: 'Dashboard',     icon: '📊' },
  { key: 'Home',         label: 'Products',       icon: '🏠' },
  { key: 'Cart',         label: 'Cart',           icon: '🛒' },
];
const BUSINESS_TABS = [
  { key: 'Customers',    label: 'Customers',      icon: '👥' },
  { key: 'NewOrder',     label: 'New Order',      icon: '📝' },
  { key: 'OrderHistory', label: 'Order History',  icon: '📋' },
  { key: 'Recovery',     label: 'Recovery',       icon: '💰' },
];
const ADMIN_TABS = [
  { key: 'Inventory',    label: 'Inventory',      icon: '📦' },
  { key: 'AddProduct',   label: 'Add Product',    icon: '➕' },
];
const BOTTOM_TABS = ['Dashboard', 'Home', 'NewOrder', 'Customers', 'Profile'];

// ── SideNav Item ─────────────────────────────────────────────
function NavItem({ tab, isActive, onPress, badge }) {
  return (
    <TouchableOpacity
      style={[wl.navItem, isActive && wl.navItemActive]}
      onPress={onPress}
      activeOpacity={0.75}
    >
      <View style={[wl.navIconWrap, isActive && wl.navIconWrapActive]}>
        <Text style={wl.navIcon}>{tab.icon}</Text>
      </View>
      <Text style={[wl.navLabel, isActive && wl.navLabelActive]} numberOfLines={1}>
        {tab.label}
      </Text>
      {badge > 0 && (
        <View style={wl.navBadge}>
          <Text style={wl.navBadgeTxt}>{badge > 9 ? '9+' : badge}</Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

// ── PWA Install Button ────────────────────────────────────────
function InstallPWAButton() {
  const [prompt, setPrompt] = useState(null);
  useEffect(() => {
    if (Platform.OS !== 'web') return;
    const handler = (e) => { e.preventDefault(); setPrompt(e); };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);
  if (!prompt) return null;
  return (
    <TouchableOpacity
      style={wl.installBtn}
      onPress={async () => {
        prompt.prompt();
        const { outcome } = await prompt.userChoice;
        if (outcome === 'accepted') setPrompt(null);
      }}
    >
      <Text style={{ fontSize: 12 }}>📱</Text>
      <Text style={wl.installBtnTxt}>Install App</Text>
    </TouchableOpacity>
  );
}

// ── Language Switcher ─────────────────────────────────────────
function LangSwitcher() {
  const { lang, switchLang } = useLang();
  return (
    <View style={wl.langRow}>
      {['en', 'ur'].map(l => (
        <TouchableOpacity
          key={l}
          style={[wl.langBtn, lang === l && wl.langBtnActive]}
          onPress={() => switchLang(l)}
        >
          <Text style={[wl.langTxt, lang === l && wl.langTxtActive]}>
            {l === 'en' ? 'EN' : 'اردو'}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

export default function WebLayout({ navigation }) {
  const [activeTab, setActiveTab] = useState('Dashboard');
  const { user, isAdmin, demoLogout } = useAuth();
  const { itemCount }               = useCart();
  const { showToast }               = useToast();
  const { t }                       = useLang();
  const { width }                   = useWindowDimensions();
  const isMobile                    = width < 768;

  const initials = user?.displayName
    ? user.displayName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : (user?.email?.[0] || '?').toUpperCase();

  const handleLogout = () => {
    if (Platform.OS === 'web') {
      if (!window.confirm(t('logout') + '?')) return;
      IS_DEMO ? demoLogout() : signOut(auth);
      return;
    }
    Alert.alert(t('logout'), 'Kya aap logout karna chahte hain?', [
      { text: t('cancel'), style: 'cancel' },
      { text: t('logout'), style: 'destructive', onPress: () => IS_DEMO ? demoLogout() : signOut(auth) },
    ]);
  };

  const switchTab = (key) => setActiveTab(key);

  const renderContent = () => {
    const props = { navigation, switchTab };
    switch (activeTab) {
      case 'Dashboard':    return <DashboardScreen    {...props} />;
      case 'Home':         return <HomeScreen         {...props} />;
      case 'Cart':         return <CartScreen         {...props} />;
      case 'Profile':      return <ProfileScreen      {...props} />;
      case 'Customers':    return <CustomersScreen    {...props} />;
      case 'NewOrder':     return <OrdersScreen       {...props} />;
      case 'OrderHistory': return <OrderHistoryScreen {...props} />;
      case 'Recovery':     return <RecoveryScreen     {...props} />;
      case 'Inventory':    return <AdminScreen        {...props} />;
      case 'AddProduct':   return <AddItemScreen navigation={navigation} route={{ params: { product: null, tabMode: true } }} />;
      default:             return <DashboardScreen    {...props} />;
    }
  };

  /* ──────────────────────────────────────────────────────────
     MOBILE LAYOUT
  ────────────────────────────────────────────────────────── */
  if (isMobile) {
    const mobileAllTabs = [
      { key: 'Dashboard',    icon: '📊', label: 'Dashboard' },
      { key: 'Home',         icon: '🏠', label: 'Products'  },
      { key: 'NewOrder',     icon: '📝', label: 'New Order' },
      { key: 'Customers',    icon: '👥', label: 'Customers' },
      ...(isAdmin ? [{ key: 'OrderHistory', icon: '📋', label: 'History' }] : []),
      { key: 'Recovery',     icon: '💰', label: 'Recovery'  },
      { key: 'Profile',      icon: '👤', label: 'Profile'   },
      ...(isAdmin ? [{ key: 'Inventory', icon: '📦', label: 'Inventory' }] : []),
    ];

    return (
      <View style={wl.mobileRoot}>
        {/* Top Header */}
        <View style={wl.mobileHeader}>
          <View style={wl.mobileBrandRow}>
            <View style={wl.mobileLogoBox}>
              <Text style={{ fontSize: 18 }}>🛒</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={wl.mobileLogoTitle}>Dawood Trader</Text>
              <Text style={wl.mobileLogoSub}>Distribution System</Text>
            </View>
            {/* Cart badge */}
            <TouchableOpacity style={wl.mobileTopBtn} onPress={() => setActiveTab('Cart')}>
              <Text style={{ fontSize: 18 }}>🛒</Text>
              {itemCount > 0 && (
                <View style={wl.mobileTopBadge}>
                  <Text style={wl.mobileTopBadgeTxt}>{itemCount > 9 ? '9+' : itemCount}</Text>
                </View>
              )}
            </TouchableOpacity>
            {isAdmin && (
              <TouchableOpacity style={wl.mobileTopBtn} onPress={() => setActiveTab('NewOrder')}>
                <Text style={{ fontSize: 18 }}>📝</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Horizontal nav tabs (scrollable) */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={wl.mobileNavScroll}
            contentContainerStyle={wl.mobileNavRow}
          >
            {mobileAllTabs.map(tab => (
              <TouchableOpacity
                key={tab.key}
                style={[wl.mobileNavTab, activeTab === tab.key && wl.mobileNavTabActive]}
                onPress={() => setActiveTab(tab.key)}
              >
                <Text style={[wl.mobileNavIcon, activeTab === tab.key && wl.mobileNavIconActive]}>
                  {tab.icon}
                </Text>
                <Text style={[wl.mobileNavLabel, activeTab === tab.key && wl.mobileNavLabelActive]}>
                  {tab.label}
                </Text>
                {tab.key === 'Cart' && itemCount > 0 && (
                  <View style={wl.mobileNavBadge}>
                    <Text style={wl.mobileNavBadgeTxt}>{itemCount > 9 ? '9+' : itemCount}</Text>
                  </View>
                )}
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Content */}
        <View style={wl.mobileContent}>{renderContent()}</View>
      </View>
    );
  }

  /* ──────────────────────────────────────────────────────────
     DESKTOP / TABLET LAYOUT (sidebar)
  ────────────────────────────────────────────────────────── */
  return (
    <View style={wl.root}>
      {/* SIDEBAR */}
      <View style={wl.sidebar}>
        {/* Brand */}
        <View style={wl.brand}>
          <View style={wl.brandIconBox}>
            <Text style={{ fontSize: 20 }}>🛒</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={wl.brandName}>Dawood Trader</Text>
            <Text style={wl.brandSub}>Distribution System</Text>
          </View>
        </View>

        <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
          {/* MAIN MENU */}
          <View style={wl.navSection}>
            <Text style={wl.navSectionLabel}>MENU</Text>
            {MAIN_TABS.map(tab => (
              <NavItem
                key={tab.key}
                tab={tab}
                isActive={activeTab === tab.key}
                onPress={() => setActiveTab(tab.key)}
                badge={tab.key === 'Cart' ? itemCount : 0}
              />
            ))}
          </View>

          {/* BUSINESS (admin only) */}
          {isAdmin && (
            <View style={wl.navSection}>
              <Text style={wl.navSectionLabel}>BUSINESS</Text>
              {BUSINESS_TABS.map(tab => (
                <NavItem
                  key={tab.key}
                  tab={tab}
                  isActive={activeTab === tab.key}
                  onPress={() => setActiveTab(tab.key)}
                />
              ))}
            </View>
          )}

          {/* ADMIN */}
          {isAdmin && (
            <View style={wl.navSection}>
              <Text style={wl.navSectionLabel}>ADMIN</Text>
              {ADMIN_TABS.map(tab => (
                <NavItem
                  key={tab.key}
                  tab={tab}
                  isActive={activeTab === tab.key}
                  onPress={() => setActiveTab(tab.key)}
                />
              ))}
            </View>
          )}

          {/* ACCOUNT */}
          <View style={wl.navSection}>
            <Text style={wl.navSectionLabel}>ACCOUNT</Text>
            <NavItem
              tab={{ key: 'Profile', label: 'Profile', icon: '👤' }}
              isActive={activeTab === 'Profile'}
              onPress={() => setActiveTab('Profile')}
            />
          </View>
        </ScrollView>

        {/* Bottom: lang + install + user */}
        <View style={wl.sideBottom}>
          <InstallPWAButton />
          <LangSwitcher />

          {IS_DEMO && (
            <View style={wl.demoPill}><Text style={wl.demoPillTxt}>🧪 Demo Mode</Text></View>
          )}
          <TouchableOpacity style={wl.userCard} onPress={() => setActiveTab('Profile')}>
            <View style={wl.avatar}><Text style={wl.avatarTxt}>{initials}</Text></View>
            <View style={{ flex: 1 }}>
              <Text style={wl.userName} numberOfLines={1}>{user?.displayName || 'User'}</Text>
              <Text style={wl.userEmail} numberOfLines={1}>{user?.email}</Text>
            </View>
          </TouchableOpacity>
          <TouchableOpacity style={wl.logoutBtn} onPress={handleLogout}>
            <Text style={{ fontSize: 13 }}>🚪</Text>
            <Text style={wl.logoutTxt}>{t('logout')}</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* CONTENT */}
      <View style={wl.content}>{renderContent()}</View>
    </View>
  );
}

const wl = StyleSheet.create({
  root:    { flex: 1, flexDirection: 'row', backgroundColor: C.bg, overflow: 'hidden', ...(Platform.OS === 'web' ? { height: '100vh', maxHeight: '100vh' } : {}) },
  sidebar: { width: 220, backgroundColor: C.sidebar, flexDirection: 'column', overflow: 'hidden' },
  content: { flex: 1, minHeight: 0, backgroundColor: C.bg, overflow: 'hidden' },

  brand: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 14, paddingVertical: 18,
    borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.07)',
  },
  brandIconBox: { width: 36, height: 36, borderRadius: 9, backgroundColor: C.primary, justifyContent: 'center', alignItems: 'center', marginRight: 10 },
  brandName:    { color: '#f1f5f9', fontSize: 13, fontWeight: '800' },
  brandSub:     { color: 'rgba(255,255,255,0.32)', fontSize: 9, marginTop: 1 },

  navSection:      { paddingHorizontal: 10, paddingTop: 16 },
  navSectionLabel: { color: 'rgba(255,255,255,0.25)', fontSize: 9, fontWeight: '700', letterSpacing: 1.2, paddingHorizontal: 8, marginBottom: 4 },

  navItem:           { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, paddingVertical: 9, borderRadius: 8, marginBottom: 1 },
  navItemActive:     { backgroundColor: 'rgba(37,99,235,0.3)' },
  navIconWrap:       { width: 28, height: 28, borderRadius: 7, backgroundColor: 'rgba(255,255,255,0.06)', justifyContent: 'center', alignItems: 'center', marginRight: 10 },
  navIconWrapActive: { backgroundColor: 'rgba(37,99,235,0.5)' },
  navIcon:           { fontSize: 13 },
  navLabel:          { flex: 1, color: 'rgba(255,255,255,0.45)', fontSize: 12, fontWeight: '500' },
  navLabelActive:    { color: '#fff', fontWeight: '700' },
  navBadge:          { backgroundColor: C.danger, borderRadius: 8, minWidth: 16, height: 16, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 3 },
  navBadgeTxt:       { color: '#fff', fontSize: 8, fontWeight: '800' },

  sideBottom: { paddingHorizontal: 12, paddingVertical: 14, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.06)' },

  installBtn:    { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: 'rgba(37,99,235,0.15)', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 7, marginBottom: 8, borderWidth: 1, borderColor: 'rgba(37,99,235,0.3)' },
  installBtnTxt: { color: '#93c5fd', fontSize: 11, fontWeight: '700' },

  langRow:      { flexDirection: 'row', gap: 6, marginBottom: 10 },
  langBtn:      { flex: 1, paddingVertical: 5, alignItems: 'center', borderRadius: 7, borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)', backgroundColor: 'rgba(255,255,255,0.04)' },
  langBtnActive:{ backgroundColor: 'rgba(37,99,235,0.35)', borderColor: 'rgba(37,99,235,0.5)' },
  langTxt:      { color: 'rgba(255,255,255,0.4)', fontSize: 11, fontWeight: '600' },
  langTxtActive:{ color: '#93c5fd', fontWeight: '800' },

  demoPill:     { backgroundColor: 'rgba(245,158,11,0.15)', borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3, marginBottom: 8, alignSelf: 'flex-start', borderWidth: 1, borderColor: 'rgba(245,158,11,0.25)' },
  demoPillTxt:  { color: '#fbbf24', fontSize: 10, fontWeight: '700' },

  userCard:   { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  avatar:     { width: 30, height: 30, borderRadius: 15, backgroundColor: C.primary, justifyContent: 'center', alignItems: 'center', marginRight: 8 },
  avatarTxt:  { color: '#fff', fontSize: 11, fontWeight: '800' },
  userName:   { color: '#e2e8f0', fontSize: 12, fontWeight: '600' },
  userEmail:  { color: 'rgba(255,255,255,0.28)', fontSize: 9, marginTop: 1 },

  logoutBtn:  { flexDirection: 'row', alignItems: 'center', paddingVertical: 7, paddingHorizontal: 10, borderRadius: 8, backgroundColor: 'rgba(220,38,38,0.1)', borderWidth: 1, borderColor: 'rgba(220,38,38,0.2)', gap: 6 },
  logoutTxt:  { color: '#fca5a5', fontSize: 11, fontWeight: '600' },

  /* ── Mobile ── */
  mobileRoot:    { flex: 1, flexDirection: 'column', backgroundColor: C.bg },
  mobileHeader:  { backgroundColor: C.primary },
  mobileBrandRow:{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingTop: 14, paddingBottom: 8, gap: 8 },
  mobileLogoBox: { width: 36, height: 36, borderRadius: 9, backgroundColor: 'rgba(255,255,255,0.18)', justifyContent: 'center', alignItems: 'center', borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.25)' },
  mobileLogoTitle: { color: '#fff', fontSize: 14, fontWeight: '800' },
  mobileLogoSub:   { color: 'rgba(255,255,255,0.5)', fontSize: 9, marginTop: 1 },
  mobileTopBtn:    { position: 'relative', padding: 6, backgroundColor: 'rgba(255,255,255,0.12)', borderRadius: 9, width: 34, height: 34, justifyContent: 'center', alignItems: 'center' },
  mobileTopBadge:  { position: 'absolute', top: 1, right: 1, backgroundColor: '#ef4444', borderRadius: 6, minWidth: 13, height: 13, justifyContent: 'center', alignItems: 'center' },
  mobileTopBadgeTxt: { color: '#fff', fontSize: 7, fontWeight: '800' },

  mobileNavScroll: { borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.12)' },
  mobileNavRow:    { flexDirection: 'row', paddingVertical: 2, paddingHorizontal: 2 },
  mobileNavTab:    { alignItems: 'center', paddingHorizontal: 12, paddingVertical: 7, borderRadius: 8, position: 'relative', minWidth: 64 },
  mobileNavTabActive: { backgroundColor: 'rgba(255,255,255,0.15)' },
  mobileNavIcon:       { fontSize: 16, opacity: 0.6 },
  mobileNavIconActive: { opacity: 1 },
  mobileNavLabel:      { fontSize: 9, color: 'rgba(255,255,255,0.55)', fontWeight: '500', marginTop: 2 },
  mobileNavLabelActive:{ color: '#fff', fontWeight: '700' },
  mobileNavBadge:      { position: 'absolute', top: 4, right: 8, backgroundColor: '#ef4444', borderRadius: 6, minWidth: 12, height: 12, justifyContent: 'center', alignItems: 'center' },
  mobileNavBadgeTxt:   { color: '#fff', fontSize: 7, fontWeight: '800' },

  mobileContent: { flex: 1, minHeight: 0, overflow: 'hidden' },
});
