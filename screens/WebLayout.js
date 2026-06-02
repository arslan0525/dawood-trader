import React, { useState, useCallback, useMemo } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, Alert,
  useWindowDimensions, Platform, ScrollView,
} from 'react-native';
import { signOut }   from 'firebase/auth';
import { auth, IS_DEMO } from '../services/firebase';
import { useAuth }   from '../context/AuthContext';
import { useCart }   from '../context/CartContext';
import { useLang }   from '../context/LanguageContext';
import { C }         from '../constants/theme';
import InstallPWA, { InstallBanner } from '../components/InstallPWA';
import AppLogo from '../components/AppLogo';

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

// ── Page metadata (title + icon per tab) ───────────────────────
const PAGE_META = {
  Dashboard:       { title: 'Dashboard',       icon: '📊' },
  Home:            { title: 'Products',         icon: '🛍️' },
  Cart:            { title: 'Cart',             icon: '🛒' },
  Customers:       { title: 'Customers',        icon: '👥' },
  NewOrder:        { title: 'New Order',        icon: '📝' },
  OrderHistory:    { title: 'Order History',    icon: '📋' },
  Recovery:        { title: 'Recovery',         icon: '💰' },
  Inventory:       { title: 'Inventory',        icon: '📦' },
  AddProduct:      { title: 'Add Product',      icon: '➕' },
  Profile:         { title: 'My Profile',       icon: '👤' },
  CustomerProfile: { title: 'Customer Profile', icon: '👤' },
};

const MAIN_TABS = [
  { key: 'Dashboard', label: 'Dashboard',  icon: '📊' },
  { key: 'Home',      label: 'Products',   icon: '🛍️' },
  { key: 'Cart',      label: 'Cart',       icon: '🛒' },
];
const BUSINESS_TABS = [
  { key: 'Customers',    label: 'Customers',    icon: '👥' },
  { key: 'NewOrder',     label: 'New Order',    icon: '📝' },
  { key: 'OrderHistory', label: 'Order History',icon: '📋' },
  { key: 'Recovery',     label: 'Recovery',     icon: '💰' },
];
const ADMIN_TABS = [
  { key: 'Inventory',  label: 'Inventory',   icon: '📦' },
  { key: 'AddProduct', label: 'Add Product', icon: '➕' },
];

// ── Sidebar NavItem ────────────────────────────────────────────
function NavItem({ tab, isActive, onPress, badge }) {
  return (
    <TouchableOpacity
      style={[wl.navItem, isActive && wl.navItemActive]}
      onPress={onPress}
      activeOpacity={0.78}
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

// ── Language Toggle ────────────────────────────────────────────
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

// ── Desktop TopBar (sits above content, below nothing) ─────────
function TopBar({ activeTab, switchTab, user, isAdmin, onLogout, itemCount }) {
  const meta     = PAGE_META[activeTab] || { title: activeTab, icon: '📄' };
  const initials = user?.displayName
    ? user.displayName.split(' ').filter(Boolean).map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : (user?.email?.[0] || '?').toUpperCase();

  return (
    <View style={wl.topBar}>
      {/* Page title */}
      <View style={wl.topBarLeft}>
        <Text style={wl.topBarIcon}>{meta.icon}</Text>
        <Text style={wl.topBarTitle}>{meta.title}</Text>
      </View>

      {/* Right actions */}
      <View style={wl.topBarRight}>
        {/* Install App — ALWAYS visible */}
        <InstallPWA />

        {/* Language */}
        <LangToggle />

        {/* Cart badge */}
        <TouchableOpacity style={wl.topBarBtn} onPress={() => switchTab('Cart')}>
          <Text style={wl.topBarBtnIcon}>🛒</Text>
          {itemCount > 0 && (
            <View style={wl.topCartBadge}>
              <Text style={wl.topCartBadgeTxt}>{itemCount > 9 ? '9+' : itemCount}</Text>
            </View>
          )}
        </TouchableOpacity>

        {/* User avatar */}
        <TouchableOpacity style={wl.topUserAvatar} onPress={() => switchTab('Profile')}>
          <Text style={wl.topUserAvatarTxt}>{initials}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ── Main Component ─────────────────────────────────────────────
export default function WebLayout({ navigation }) {
  const [activeTab,      setActiveTab]      = useState('Dashboard');
  const [tabProduct,     setTabProduct]     = useState(null);
  const [viewCustomerId, setViewCustomerId] = useState(null);

  const { user, isAdmin, demoLogout } = useAuth();
  const { itemCount }                 = useCart();
  const { width }                     = useWindowDimensions();
  const isMobile                      = width < 768;

  const initials = useMemo(() =>
    user?.displayName
      ? user.displayName.split(' ').filter(Boolean).map(n => n[0]).join('').toUpperCase().slice(0, 2)
      : (user?.email?.[0] || '?').toUpperCase(),
    [user]);

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

  const switchTab = useCallback((key, data = null) => {
    setActiveTab(key);
    if (key === 'AddProduct')      setTabProduct(data);
    if (key === 'CustomerProfile') setViewCustomerId(data);
  }, []);

  const viewCustomer = useCallback((id) => {
    setViewCustomerId(id);
    setActiveTab('CustomerProfile');
  }, []);

  const editProduct = useCallback((product) => {
    setTabProduct(product);
    setActiveTab('AddProduct');
  }, []);

  // ── Content renderer ───────────────────────────────────────
  const renderContent = useCallback(() => {
    const base = { navigation, switchTab };
    switch (activeTab) {
      case 'Dashboard':       return <DashboardScreen       {...base} />;
      case 'Home':            return <HomeScreen             {...base} />;
      case 'Cart':            return <CartScreen             {...base} />;
      case 'Profile':         return <ProfileScreen          {...base} />;
      case 'Customers':       return <CustomersScreen        {...base} viewCustomer={viewCustomer} />;
      case 'NewOrder':        return <OrdersScreen           {...base} viewCustomer={viewCustomer} />;
      case 'OrderHistory':    return <OrderHistoryScreen     {...base} viewCustomer={viewCustomer} />;
      case 'Recovery':        return <RecoveryScreen         {...base} viewCustomer={viewCustomer} />;
      case 'Inventory':       return <AdminScreen            {...base} editProduct={editProduct} />;
      case 'AddProduct':
        return (
          <AddItemScreen
            key={tabProduct?.id || '__new__'}
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
      default: return <DashboardScreen {...base} />;
    }
  }, [activeTab, navigation, switchTab, viewCustomer, editProduct, tabProduct, viewCustomerId]);

  /* ──────────────────────────────────────────────────────────
     MOBILE LAYOUT
  ────────────────────────────────────────────────────────── */
  if (isMobile) {
    const mobileTabs = [
      { key: 'Dashboard',    icon: '📊', label: 'Dashboard' },
      { key: 'Home',         icon: '🛍️', label: 'Products'  },
      { key: 'NewOrder',     icon: '📝', label: 'New Order' },
      { key: 'Customers',    icon: '👥', label: 'Customers' },
      { key: 'OrderHistory', icon: '📋', label: 'History'   },
      { key: 'Recovery',     icon: '💰', label: 'Recovery'  },
      ...(isAdmin ? [{ key: 'Inventory', icon: '📦', label: 'Inventory' }] : []),
      { key: 'Profile',      icon: '👤', label: 'Profile'   },
    ];

    return (
      <View style={wl.mobileRoot}>
        {/* Auto install banner */}
        <InstallBanner />
        {/* ── Mobile Top Header ── */}
        <View style={wl.mobileHeader}>
          <View style={wl.mobileBrandRow}>
            {/* Logo */}
            <AppLogo size={36} variant="icon" />
            <View style={{ flex: 1 }}>
              <Text style={wl.mobileBrandName}>Dawood Trader</Text>
              <Text style={wl.mobileBrandSub}>Distribution System</Text>
            </View>
            {/* Install button — always visible on mobile header */}
            <InstallPWA compact />
            {/* Cart */}
            <TouchableOpacity style={wl.mobileHeaderBtn} onPress={() => switchTab('Cart')}>
              <Text style={{ fontSize: 17 }}>🛒</Text>
              {itemCount > 0 && (
                <View style={wl.mobileHeaderBadge}>
                  <Text style={wl.mobileHeaderBadgeTxt}>{itemCount > 9 ? '9+' : itemCount}</Text>
                </View>
              )}
            </TouchableOpacity>
          </View>

          {/* Horizontal nav tabs */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={wl.mobileNavBar}
            contentContainerStyle={wl.mobileNavContent}
          >
            {mobileTabs.map(tab => (
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
     DESKTOP LAYOUT
  ────────────────────────────────────────────────────────── */
  return (
    <View style={wl.root}>
      {/* Auto install banner — shows once when PWA is installable */}
      <InstallBanner />

      {/* ── SIDEBAR ── */}
      <View style={wl.sidebar}>
        {/* Brand / Logo */}
        <View style={wl.brand}>
          <AppLogo size={38} variant="sidebar" />
        </View>

        {/* Nav */}
        <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
          <View style={wl.navSection}>
            <Text style={wl.navSectionLabel}>MAIN</Text>
            {MAIN_TABS.map(t => (
              <NavItem key={t.key} tab={t} isActive={activeTab === t.key}
                onPress={() => switchTab(t.key)} badge={t.key === 'Cart' ? itemCount : 0} />
            ))}
          </View>

          {isAdmin && (
            <View style={wl.navSection}>
              <Text style={wl.navSectionLabel}>BUSINESS</Text>
              {BUSINESS_TABS.map(t => (
                <NavItem key={t.key} tab={t} isActive={activeTab === t.key}
                  onPress={() => switchTab(t.key)} />
              ))}
            </View>
          )}

          {isAdmin && (
            <View style={wl.navSection}>
              <Text style={wl.navSectionLabel}>ADMIN</Text>
              {ADMIN_TABS.map(t => (
                <NavItem key={t.key} tab={t} isActive={activeTab === t.key}
                  onPress={() => switchTab(t.key)} />
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
          {IS_DEMO && (
            <View style={wl.demoPill}><Text style={wl.demoPillTxt}>🧪 Demo Mode</Text></View>
          )}
          <TouchableOpacity style={wl.userRow} onPress={() => switchTab('Profile')}>
            <View style={wl.userAvatar}><Text style={wl.userAvatarTxt}>{initials}</Text></View>
            <View style={{ flex: 1, minWidth: 0 }}>
              <Text style={wl.userName} numberOfLines={1}>{user?.displayName || 'User'}</Text>
              <Text style={wl.userEmail} numberOfLines={1}>{user?.email}</Text>
            </View>
          </TouchableOpacity>
          <TouchableOpacity style={wl.logoutBtn} onPress={handleLogout}>
            <Text style={{ fontSize: 13 }}>🚪</Text>
            <Text style={wl.logoutTxt}>Logout</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* ── CONTENT AREA ── */}
      <View style={wl.contentArea}>
        {/* Professional TopBar with Install button */}
        <TopBar
          activeTab={activeTab}
          switchTab={switchTab}
          user={user}
          isAdmin={isAdmin}
          onLogout={handleLogout}
          itemCount={itemCount}
        />
        {/* Page content */}
        <View style={wl.content}>
          {renderContent()}
        </View>
      </View>
    </View>
  );
}

/* ═══════════════════════════════════════════════════════════════
   STYLES
═══════════════════════════════════════════════════════════════ */
const wl = StyleSheet.create({
  root: {
    flex: 1, flexDirection: 'row', backgroundColor: '#f0f4fa',
    ...(Platform.OS === 'web' ? { height: '100vh', maxHeight: '100vh', overflow: 'hidden' } : {}),
  },

  /* ── Sidebar ── */
  sidebar: {
    width: 220, backgroundColor: '#0f172a',
    flexDirection: 'column', overflow: 'hidden',
  },

  brand: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingHorizontal: 16, paddingVertical: 18,
    borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.07)',
  },
  brandLogo: {
    width: 38, height: 38, borderRadius: 10,
    backgroundColor: C.primary,
    justifyContent: 'center', alignItems: 'center',
  },
  brandName: { color: '#f1f5f9', fontSize: 13, fontWeight: '800' },
  brandSub:  { color: 'rgba(255,255,255,0.3)', fontSize: 9, marginTop: 1 },

  navSection:      { paddingHorizontal: 10, paddingTop: 18 },
  navSectionLabel: {
    color: 'rgba(255,255,255,0.22)', fontSize: 9, fontWeight: '700',
    letterSpacing: 1.4, paddingHorizontal: 8, marginBottom: 4,
  },

  navItem:         { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, paddingVertical: 9, borderRadius: 9, marginBottom: 1 },
  navItemActive:   { backgroundColor: 'rgba(37,99,235,0.28)' },
  navIconBox:      { width: 28, height: 28, borderRadius: 7, backgroundColor: 'rgba(255,255,255,0.06)', justifyContent: 'center', alignItems: 'center', marginRight: 10 },
  navIconBoxActive:{ backgroundColor: 'rgba(37,99,235,0.5)' },
  navIcon:         { fontSize: 13 },
  navLabel:        { flex: 1, color: 'rgba(255,255,255,0.42)', fontSize: 12, fontWeight: '500' },
  navLabelActive:  { color: '#fff', fontWeight: '700' },
  navBadge:        { backgroundColor: '#ef4444', borderRadius: 8, minWidth: 16, height: 16, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 3 },
  navBadgeTxt:     { color: '#fff', fontSize: 8, fontWeight: '800' },

  sideFooter: {
    paddingHorizontal: 12, paddingVertical: 14,
    borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.07)', gap: 8,
  },
  demoPill:    { backgroundColor: 'rgba(245,158,11,0.13)', borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3, borderWidth: 1, borderColor: 'rgba(245,158,11,0.22)', alignSelf: 'flex-start' },
  demoPillTxt: { color: '#fbbf24', fontSize: 9, fontWeight: '700' },
  userRow:     { flexDirection: 'row', alignItems: 'center', gap: 8 },
  userAvatar:  { width: 30, height: 30, borderRadius: 15, backgroundColor: C.primary, justifyContent: 'center', alignItems: 'center' },
  userAvatarTxt: { color: '#fff', fontSize: 11, fontWeight: '800' },
  userName:    { color: '#e2e8f0', fontSize: 12, fontWeight: '600' },
  userEmail:   { color: 'rgba(255,255,255,0.27)', fontSize: 9, marginTop: 1 },
  logoutBtn:   { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 8, paddingHorizontal: 10, borderRadius: 8, backgroundColor: 'rgba(220,38,38,0.1)', borderWidth: 1, borderColor: 'rgba(220,38,38,0.18)' },
  logoutTxt:   { color: '#fca5a5', fontSize: 11, fontWeight: '600' },

  /* ── Content area ── */
  contentArea: { flex: 1, flexDirection: 'column', minWidth: 0, overflow: 'hidden' },
  content:     { flex: 1, minHeight: 0, overflow: 'hidden' },

  /* ── TopBar ── */
  topBar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: '#fff', paddingHorizontal: 24, paddingVertical: 14,
    borderBottomWidth: 1, borderBottomColor: '#e8edf5',
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06, shadowRadius: 4, elevation: 2, zIndex: 10,
  },
  topBarLeft:  { flexDirection: 'row', alignItems: 'center', gap: 10 },
  topBarIcon:  { fontSize: 20 },
  topBarTitle: { fontSize: 18, fontWeight: '800', color: '#0f172a' },
  topBarRight: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  topBarBtn:   { position: 'relative', width: 36, height: 36, borderRadius: 9, backgroundColor: '#f4f7fc', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#e8edf5' },
  topBarBtnIcon: { fontSize: 16 },
  topCartBadge:   { position: 'absolute', top: 4, right: 4, backgroundColor: '#ef4444', borderRadius: 6, minWidth: 12, height: 12, justifyContent: 'center', alignItems: 'center' },
  topCartBadgeTxt:{ color: '#fff', fontSize: 7, fontWeight: '800' },
  topUserAvatar:  { width: 36, height: 36, borderRadius: 18, backgroundColor: C.primary, justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: '#bfdbfe' },
  topUserAvatarTxt: { color: '#fff', fontSize: 13, fontWeight: '800' },

  langRow:      { flexDirection: 'row', gap: 4 },
  langBtn:      { paddingHorizontal: 9, paddingVertical: 5, borderRadius: 7, borderWidth: 1, borderColor: '#e2e8f0', backgroundColor: '#f8fafc' },
  langBtnActive:{ backgroundColor: C.primaryLight, borderColor: C.primary },
  langTxt:      { color: '#64748b', fontSize: 11, fontWeight: '600' },
  langTxtActive:{ color: C.primary, fontWeight: '800' },

  /* ── Mobile ── */
  mobileRoot:   { flex: 1, flexDirection: 'column', backgroundColor: '#f0f4fa' },
  mobileHeader: { backgroundColor: C.primary, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.15, shadowRadius: 4, elevation: 4 },
  mobileBrandRow: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    paddingHorizontal: 14, paddingTop: 14, paddingBottom: 10,
  },
  mobileLogo:       { width: 36, height: 36, borderRadius: 10, backgroundColor: 'rgba(255,255,255,0.18)', justifyContent: 'center', alignItems: 'center', borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.25)' },
  mobileBrandName:  { color: '#fff', fontSize: 14, fontWeight: '800' },
  mobileBrandSub:   { color: 'rgba(255,255,255,0.5)', fontSize: 9, marginTop: 1 },
  mobileHeaderBtn:  { position: 'relative', width: 34, height: 34, borderRadius: 9, backgroundColor: 'rgba(255,255,255,0.14)', justifyContent: 'center', alignItems: 'center' },
  mobileHeaderBadge:    { position: 'absolute', top: 2, right: 2, backgroundColor: '#ef4444', borderRadius: 6, minWidth: 13, height: 13, justifyContent: 'center', alignItems: 'center' },
  mobileHeaderBadgeTxt: { color: '#fff', fontSize: 7, fontWeight: '800' },

  mobileNavBar:    { borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.12)' },
  mobileNavContent:{ flexDirection: 'row', paddingHorizontal: 4, paddingVertical: 2 },
  mobileTab:       { alignItems: 'center', paddingHorizontal: 10, paddingVertical: 7, borderRadius: 8, minWidth: 64, position: 'relative' },
  mobileTabActive: { backgroundColor: 'rgba(255,255,255,0.16)' },
  mobileTabIcon:      { fontSize: 16, opacity: 0.58 },
  mobileTabIconActive:{ opacity: 1 },
  mobileTabLabel:     { fontSize: 9, color: 'rgba(255,255,255,0.52)', fontWeight: '500', marginTop: 2 },
  mobileTabLabelActive:{ color: '#fff', fontWeight: '700' },
  mobileTabBadge:     { position: 'absolute', top: 3, right: 6, backgroundColor: '#ef4444', borderRadius: 5, minWidth: 12, height: 12, justifyContent: 'center', alignItems: 'center' },
  mobileTabBadgeTxt:  { color: '#fff', fontSize: 7, fontWeight: '800' },

  mobileContent: { flex: 1, minHeight: 0, overflow: 'hidden' },
});
