import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, Alert,
  useWindowDimensions, Platform, ScrollView,
} from 'react-native';
import { signOut } from 'firebase/auth';
import { auth, IS_DEMO } from '../services/firebase';
import { useAuth }  from '../context/AuthContext';
import { useCart }  from '../context/CartContext';
import { useLang }  from '../context/LanguageContext';
import { C }        from '../constants/theme';

import HomeScreen            from './HomeScreen';
import CartScreen            from './CartScreen';
import ProfileScreen         from './ProfileScreen';
import AddItemScreen         from './AddItemScreen';
import DashboardScreen       from './DashboardScreen';
import CustomersScreen       from './CustomersScreen';
import OrdersScreen          from './OrdersScreen';
import OrderHistoryScreen    from './OrderHistoryScreen';
import RecoveryScreen        from './RecoveryScreen';
import AdminScreen           from './AdminScreen';
import CustomerProfileScreen from './CustomerProfileScreen';

// ── Nav config ─────────────────────────────────────────────────
const MAIN_TABS = [
  { key: 'Dashboard',    label: 'Dashboard',    icon: '📊' },
  { key: 'Home',         label: 'Products',     icon: '🏠' },
  { key: 'Cart',         label: 'Cart',         icon: '🛒' },
];
const BUSINESS_TABS = [
  { key: 'Customers',    label: 'Customers',    icon: '👥' },
  { key: 'NewOrder',     label: 'New Order',    icon: '📝' },
  { key: 'OrderHistory', label: 'Order History',icon: '📋' },
  { key: 'Recovery',     label: 'Recovery',     icon: '💰' },
];
const ADMIN_TABS = [
  { key: 'Inventory',    label: 'Inventory',    icon: '📦' },
  { key: 'AddProduct',   label: 'Add Product',  icon: '➕' },
];

// ── Sidebar nav item ───────────────────────────────────────────
function NavItem({ tab, isActive, onPress, badge }) {
  return (
    <TouchableOpacity
      style={[wl.navItem, isActive && wl.navItemActive]}
      onPress={onPress}
      activeOpacity={0.75}
    >
      <View style={[wl.navIconBox, isActive && wl.navIconBoxActive]}>
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

// ── PWA Install Button ─────────────────────────────────────────
function InstallBtn() {
  const [prompt, setPrompt] = useState(null);
  useEffect(() => {
    if (Platform.OS !== 'web') return;
    const h = (e) => { e.preventDefault(); setPrompt(e); };
    window.addEventListener('beforeinstallprompt', h);
    return () => window.removeEventListener('beforeinstallprompt', h);
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
      <Text style={{ fontSize: 13 }}>📱</Text>
      <Text style={wl.installTxt}>Install App</Text>
    </TouchableOpacity>
  );
}

// ── Language toggle ────────────────────────────────────────────
function LangToggle() {
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
            {l === 'en' ? 'EN' : 'UR'}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

// ── Main WebLayout ─────────────────────────────────────────────
export default function WebLayout({ navigation }) {
  const [activeTab,       setActiveTab]       = useState('Dashboard');
  const [tabProduct,      setTabProduct]      = useState(null);  // product to edit in AddProduct tab
  const [viewCustomerId,  setViewCustomerId]  = useState(null);  // customer to view in CustomerProfile tab

  const { user, isAdmin, demoLogout, avatarUrl } = useAuth();
  const { itemCount }  = useCart();
  const { t }          = useLang();
  const { width }      = useWindowDimensions();
  const isMobile       = width < 768;

  const initials = user?.displayName
    ? user.displayName.split(' ').filter(Boolean).map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : (user?.email?.[0] || '?').toUpperCase();

  const handleLogout = useCallback(() => {
    if (Platform.OS === 'web') {
      if (!window.confirm('Logout karna chahte hain?')) return;
      IS_DEMO ? demoLogout() : signOut(auth);
      return;
    }
    Alert.alert('Logout', 'Kya aap logout karna chahte hain?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Logout', style: 'destructive', onPress: () => IS_DEMO ? demoLogout() : signOut(auth) },
    ]);
  }, [demoLogout]);

  // ── Navigation helpers ─────────────────────────────────────
  const switchTab = useCallback((key, data = null) => {
    setActiveTab(key);
    if (key === 'AddProduct') setTabProduct(data); // data = product object or null
    if (key === 'CustomerProfile') setViewCustomerId(data); // data = customerId string
  }, []);

  const viewCustomer = useCallback((customerId) => {
    setViewCustomerId(customerId);
    setActiveTab('CustomerProfile');
  }, []);

  const editProduct = useCallback((product) => {
    setTabProduct(product);
    setActiveTab('AddProduct');
  }, []);

  // ── Render content ─────────────────────────────────────────
  const renderContent = () => {
    const base = { navigation, switchTab };
    switch (activeTab) {
      case 'Dashboard':
        return <DashboardScreen    {...base} />;
      case 'Home':
        return <HomeScreen         {...base} />;
      case 'Cart':
        return <CartScreen         {...base} />;
      case 'Profile':
        return <ProfileScreen      {...base} />;
      case 'Customers':
        return <CustomersScreen    {...base} viewCustomer={viewCustomer} />;
      case 'NewOrder':
        return <OrdersScreen       {...base} viewCustomer={viewCustomer} />;
      case 'OrderHistory':
        return <OrderHistoryScreen {...base} viewCustomer={viewCustomer} />;
      case 'Recovery':
        return <RecoveryScreen     {...base} viewCustomer={viewCustomer} />;
      case 'Inventory':
        return <AdminScreen        {...base} editProduct={editProduct} />;
      case 'AddProduct':
        return (
          <AddItemScreen
            key={tabProduct?.id || 'new-product'}
            navigation={navigation}
            route={{ params: { product: tabProduct, tabMode: true } }}
          />
        );
      case 'CustomerProfile':
        return (
          <CustomerProfileScreen
            customerId={viewCustomerId}
            switchTab={switchTab}
            onClose={() => switchTab('Customers')}
          />
        );
      default:
        return <DashboardScreen {...base} />;
    }
  };

  /* ──────────────────────────────────────────────────────────
     MOBILE LAYOUT
  ────────────────────────────────────────────────────────── */
  if (isMobile) {
    const allMobileTabs = [
      { key: 'Dashboard',    icon: '📊', label: 'Dashboard' },
      { key: 'Home',         icon: '🏠', label: 'Products'  },
      { key: 'NewOrder',     icon: '📝', label: 'New Order' },
      { key: 'Customers',    icon: '👥', label: 'Customers' },
      { key: 'OrderHistory', icon: '📋', label: 'History'   },
      { key: 'Recovery',     icon: '💰', label: 'Recovery'  },
      ...(isAdmin ? [{ key: 'Inventory', icon: '📦', label: 'Inventory' }] : []),
      { key: 'Profile',      icon: '👤', label: 'Profile'   },
    ];

    return (
      <View style={wl.mobileRoot}>
        {/* Top header */}
        <View style={wl.mobileHeader}>
          <View style={wl.mobileBrandRow}>
            <View style={wl.mobileLogoBox}>
              <Text style={{ fontSize: 18 }}>🛒</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={wl.mobileLogoTitle}>Dawood Trader</Text>
              <Text style={wl.mobileLogoSub}>Distribution System</Text>
            </View>
            <TouchableOpacity style={wl.mobileIconBtn} onPress={() => switchTab('Cart')}>
              <Text style={{ fontSize: 17 }}>🛒</Text>
              {itemCount > 0 && (
                <View style={wl.mobileIconBadge}>
                  <Text style={wl.mobileIconBadgeTxt}>{itemCount > 9 ? '9+' : itemCount}</Text>
                </View>
              )}
            </TouchableOpacity>
            {isAdmin && (
              <TouchableOpacity style={wl.mobileIconBtn} onPress={() => switchTab('NewOrder')}>
                <Text style={{ fontSize: 17 }}>📝</Text>
              </TouchableOpacity>
            )}
          </View>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={wl.mobileNavScroll}
            contentContainerStyle={wl.mobileNavContent}
          >
            {allMobileTabs.map(tab => (
              <TouchableOpacity
                key={tab.key}
                style={[wl.mobileTab, activeTab === tab.key && wl.mobileTabActive]}
                onPress={() => switchTab(tab.key)}
              >
                <Text style={[wl.mobileTabIcon, activeTab === tab.key && wl.mobileTabIconActive]}>
                  {tab.icon}
                </Text>
                <Text style={[wl.mobileTabLabel, activeTab === tab.key && wl.mobileTabLabelActive]}>
                  {tab.label}
                </Text>
                {tab.key === 'Cart' && itemCount > 0 && (
                  <View style={wl.mobileTabBadge}>
                    <Text style={wl.mobileTabBadgeTxt}>{itemCount}</Text>
                  </View>
                )}
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
        <View style={wl.mobileContent}>{renderContent()}</View>
      </View>
    );
  }

  /* ──────────────────────────────────────────────────────────
     DESKTOP / TABLET LAYOUT
  ────────────────────────────────────────────────────────── */
  return (
    <View style={wl.root}>
      {/* ── SIDEBAR ── */}
      <View style={wl.sidebar}>
        {/* Logo */}
        <View style={wl.brand}>
          <View style={wl.brandLogoBox}>
            <Text style={{ fontSize: 20 }}>🛒</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={wl.brandName}>Dawood Trader</Text>
            <Text style={wl.brandSub}>Distribution System</Text>
          </View>
        </View>

        {/* Nav sections */}
        <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
          <View style={wl.navSection}>
            <Text style={wl.navSectionLabel}>MAIN</Text>
            {MAIN_TABS.map(tab => (
              <NavItem
                key={tab.key}
                tab={tab}
                isActive={activeTab === tab.key}
                onPress={() => switchTab(tab.key)}
                badge={tab.key === 'Cart' ? itemCount : 0}
              />
            ))}
          </View>

          {isAdmin && (
            <View style={wl.navSection}>
              <Text style={wl.navSectionLabel}>BUSINESS</Text>
              {BUSINESS_TABS.map(tab => (
                <NavItem
                  key={tab.key}
                  tab={tab}
                  isActive={activeTab === tab.key}
                  onPress={() => switchTab(tab.key)}
                />
              ))}
            </View>
          )}

          {isAdmin && (
            <View style={wl.navSection}>
              <Text style={wl.navSectionLabel}>ADMIN</Text>
              {ADMIN_TABS.map(tab => (
                <NavItem
                  key={tab.key}
                  tab={tab}
                  isActive={activeTab === tab.key}
                  onPress={() => switchTab(tab.key)}
                />
              ))}
            </View>
          )}

          <View style={wl.navSection}>
            <Text style={wl.navSectionLabel}>ACCOUNT</Text>
            <NavItem
              tab={{ key: 'Profile', label: 'My Profile', icon: '👤' }}
              isActive={activeTab === 'Profile'}
              onPress={() => switchTab('Profile')}
            />
          </View>
        </ScrollView>

        {/* Sidebar footer */}
        <View style={wl.sideFooter}>
          <InstallBtn />
          <LangToggle />

          {IS_DEMO && (
            <View style={wl.demoPill}><Text style={wl.demoPillTxt}>🧪 Demo Mode</Text></View>
          )}

          <TouchableOpacity style={wl.userCard} onPress={() => switchTab('Profile')}>
            <View style={wl.userAvatar}>
              <Text style={wl.userAvatarTxt}>{initials}</Text>
            </View>
            <View style={{ flex: 1, minWidth: 0 }}>
              <Text style={wl.userName} numberOfLines={1}>{user?.displayName || 'User'}</Text>
              <Text style={wl.userEmail} numberOfLines={1}>{user?.email}</Text>
            </View>
            <Text style={wl.userChevron}>›</Text>
          </TouchableOpacity>

          <TouchableOpacity style={wl.logoutBtn} onPress={handleLogout}>
            <Text style={{ fontSize: 13 }}>🚪</Text>
            <Text style={wl.logoutTxt}>{t('logout')}</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* ── CONTENT ── */}
      <View style={wl.content}>{renderContent()}</View>
    </View>
  );
}

const wl = StyleSheet.create({
  root: {
    flex: 1, flexDirection: 'row', backgroundColor: '#eef2f9', overflow: 'hidden',
    ...(Platform.OS === 'web' ? { height: '100vh', maxHeight: '100vh' } : {}),
  },

  /* ── Sidebar ── */
  sidebar: {
    width: 224, backgroundColor: '#0f172a',
    flexDirection: 'column', overflow: 'hidden',
    borderRightWidth: 1, borderRightColor: 'rgba(255,255,255,0.04)',
  },

  brand: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 18,
    borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.07)',
  },
  brandLogoBox: {
    width: 38, height: 38, borderRadius: 10,
    backgroundColor: C.primary, justifyContent: 'center',
    alignItems: 'center', marginRight: 10,
  },
  brandName: { color: '#f1f5f9', fontSize: 14, fontWeight: '800' },
  brandSub:  { color: 'rgba(255,255,255,0.3)', fontSize: 9, marginTop: 1 },

  navSection:      { paddingHorizontal: 10, paddingTop: 18 },
  navSectionLabel: {
    color: 'rgba(255,255,255,0.22)', fontSize: 9, fontWeight: '700',
    letterSpacing: 1.4, paddingHorizontal: 8, marginBottom: 4,
  },

  navItem: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 8, paddingVertical: 8,
    borderRadius: 9, marginBottom: 1,
  },
  navItemActive:  { backgroundColor: 'rgba(37,99,235,0.28)' },
  navIconBox:     { width: 28, height: 28, borderRadius: 7, backgroundColor: 'rgba(255,255,255,0.06)', justifyContent: 'center', alignItems: 'center', marginRight: 10 },
  navIconBoxActive:{ backgroundColor: 'rgba(37,99,235,0.5)' },
  navIcon:        { fontSize: 13 },
  navLabel:       { flex: 1, color: 'rgba(255,255,255,0.42)', fontSize: 12, fontWeight: '500' },
  navLabelActive: { color: '#fff', fontWeight: '700' },
  navBadge:       { backgroundColor: '#ef4444', borderRadius: 8, minWidth: 16, height: 16, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 4 },
  navBadgeTxt:    { color: '#fff', fontSize: 8, fontWeight: '800' },

  sideFooter: {
    paddingHorizontal: 12, paddingVertical: 14,
    borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.07)',
    gap: 8,
  },

  installBtn:  { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: 'rgba(37,99,235,0.15)', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 7, borderWidth: 1, borderColor: 'rgba(37,99,235,0.3)' },
  installTxt:  { color: '#93c5fd', fontSize: 11, fontWeight: '700' },

  langRow:      { flexDirection: 'row', gap: 5 },
  langBtn:      { flex: 1, paddingVertical: 5, alignItems: 'center', borderRadius: 7, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', backgroundColor: 'rgba(255,255,255,0.04)' },
  langBtnActive:{ backgroundColor: 'rgba(37,99,235,0.3)', borderColor: 'rgba(37,99,235,0.5)' },
  langTxt:      { color: 'rgba(255,255,255,0.38)', fontSize: 11, fontWeight: '600' },
  langTxtActive:{ color: '#93c5fd', fontWeight: '800' },

  demoPill:    { backgroundColor: 'rgba(245,158,11,0.14)', borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3, borderWidth: 1, borderColor: 'rgba(245,158,11,0.22)', alignSelf: 'flex-start' },
  demoPillTxt: { color: '#fbbf24', fontSize: 9, fontWeight: '700' },

  userCard:    { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 4 },
  userAvatar:  { width: 30, height: 30, borderRadius: 15, backgroundColor: C.primary, justifyContent: 'center', alignItems: 'center' },
  userAvatarTxt:{ color: '#fff', fontSize: 11, fontWeight: '800' },
  userName:    { color: '#e2e8f0', fontSize: 12, fontWeight: '600' },
  userEmail:   { color: 'rgba(255,255,255,0.27)', fontSize: 9, marginTop: 1 },
  userChevron: { color: 'rgba(255,255,255,0.25)', fontSize: 16 },

  logoutBtn:  { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 8, paddingHorizontal: 10, borderRadius: 8, backgroundColor: 'rgba(220,38,38,0.1)', borderWidth: 1, borderColor: 'rgba(220,38,38,0.18)' },
  logoutTxt:  { color: '#fca5a5', fontSize: 11, fontWeight: '600' },

  content: { flex: 1, minHeight: 0, backgroundColor: '#eef2f9', overflow: 'hidden' },

  /* ── Mobile ── */
  mobileRoot:   { flex: 1, flexDirection: 'column', backgroundColor: '#eef2f9' },
  mobileHeader: { backgroundColor: C.primary },
  mobileBrandRow: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    paddingHorizontal: 14, paddingTop: 14, paddingBottom: 10,
  },
  mobileLogoBox:  { width: 36, height: 36, borderRadius: 10, backgroundColor: 'rgba(255,255,255,0.18)', justifyContent: 'center', alignItems: 'center', borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.25)' },
  mobileLogoTitle:{ color: '#fff', fontSize: 14, fontWeight: '800' },
  mobileLogoSub:  { color: 'rgba(255,255,255,0.5)', fontSize: 9, marginTop: 1 },
  mobileIconBtn:  { position: 'relative', width: 34, height: 34, borderRadius: 9, backgroundColor: 'rgba(255,255,255,0.14)', justifyContent: 'center', alignItems: 'center' },
  mobileIconBadge:{ position: 'absolute', top: 2, right: 2, backgroundColor: '#ef4444', borderRadius: 6, minWidth: 13, height: 13, justifyContent: 'center', alignItems: 'center' },
  mobileIconBadgeTxt: { color: '#fff', fontSize: 7, fontWeight: '800' },

  mobileNavScroll:  { borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.12)' },
  mobileNavContent: { flexDirection: 'row', paddingHorizontal: 4, paddingVertical: 2 },

  mobileTab:       { alignItems: 'center', paddingHorizontal: 10, paddingVertical: 7, borderRadius: 8, minWidth: 62, position: 'relative' },
  mobileTabActive: { backgroundColor: 'rgba(255,255,255,0.16)' },
  mobileTabIcon:       { fontSize: 16, opacity: 0.58 },
  mobileTabIconActive: { opacity: 1 },
  mobileTabLabel:      { fontSize: 9, color: 'rgba(255,255,255,0.52)', fontWeight: '500', marginTop: 2 },
  mobileTabLabelActive:{ color: '#fff', fontWeight: '700' },
  mobileTabBadge:      { position: 'absolute', top: 3, right: 6, backgroundColor: '#ef4444', borderRadius: 6, minWidth: 12, height: 12, justifyContent: 'center', alignItems: 'center' },
  mobileTabBadgeTxt:   { color: '#fff', fontSize: 7, fontWeight: '800' },

  mobileContent: { flex: 1, minHeight: 0, overflow: 'hidden' },
});
