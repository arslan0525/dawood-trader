import React, { useState, useCallback, useMemo, useEffect, useRef } from 'react';
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
import AppLogo       from '../components/AppLogo';

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

// ── Page metadata ──────────────────────────────────────────────
const PAGE_META = {
  Dashboard:       { title: 'Dashboard',        icon: '📊' },
  Home:            { title: 'Products',          icon: '🛍️' },
  Cart:            { title: 'Cart',              icon: '🛒' },
  Customers:       { title: 'Customers',         icon: '👥' },
  NewOrder:        { title: 'New Order',         icon: '📝' },
  OrderHistory:    { title: 'Order History',     icon: '📋' },
  Recovery:        { title: 'Recovery',          icon: '💰' },
  Inventory:       { title: 'Inventory',         icon: '📦' },
  AddProduct:      { title: 'Add Product',       icon: '➕' },
  Profile:         { title: 'My Profile',        icon: '👤' },
  CustomerProfile: { title: 'Customer Profile',  icon: '👤' },
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

// ── Desktop TopBar ─────────────────────────────────────────────
function TopBar({ activeTab, switchTab, user, itemCount, canGoBack, onBack }) {
  const meta     = PAGE_META[activeTab] || { title: activeTab, icon: '📄' };
  const initials = user?.displayName
    ? user.displayName.split(' ').filter(Boolean).map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : (user?.email?.[0] || '?').toUpperCase();

  return (
    <View style={wl.topBar}>
      <View style={wl.topBarLeft}>
        {canGoBack && (
          <TouchableOpacity style={wl.backBtn} onPress={onBack} activeOpacity={0.8}>
            <Text style={wl.backBtnTxt}>←</Text>
          </TouchableOpacity>
        )}
        <Text style={wl.topBarIcon}>{meta.icon}</Text>
        <Text style={wl.topBarTitle}>{meta.title}</Text>
      </View>
      <View style={wl.topBarRight}>
        <InstallPWA />
        <LangToggle />
        <TouchableOpacity style={wl.topIconBtn} onPress={() => switchTab('Cart')}>
          <Text style={{ fontSize: 16 }}>🛒</Text>
          {itemCount > 0 && (
            <View style={wl.topBadge}>
              <Text style={wl.topBadgeTxt}>{itemCount > 9 ? '9+' : itemCount}</Text>
            </View>
          )}
        </TouchableOpacity>
        <TouchableOpacity style={wl.topAvatar} onPress={() => switchTab('Profile')}>
          <Text style={wl.topAvatarTxt}>{initials}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ── Mobile back bar (shown when canGoBack) ─────────────────────
function MobileBackBar({ canGoBack, onBack, activeTab }) {
  if (!canGoBack) return null;
  const meta = PAGE_META[activeTab] || { title: activeTab, icon: '📄' };
  return (
    <View style={wl.mobileBackBar}>
      <TouchableOpacity style={wl.mobileBackBtn} onPress={onBack} activeOpacity={0.8}>
        <Text style={wl.mobileBackArrow}>←</Text>
        <Text style={wl.mobileBackTxt}>Back</Text>
      </TouchableOpacity>
      <Text style={wl.mobileBackPage}>{meta.icon} {meta.title}</Text>
      <View style={{ width: 70 }} />
    </View>
  );
}

// ── Main WebLayout ─────────────────────────────────────────────
export default function WebLayout({ navigation }) {
  const [activeTab,      setActiveTab]      = useState('Dashboard');
  const [tabProduct,     setTabProduct]     = useState(null);
  const [viewCustomerId, setViewCustomerId] = useState(null);

  // Navigation history stack for back button
  const [navHistory, setNavHistory]   = useState(['Dashboard']);
  const historyRef                    = useRef(['Dashboard']);

  const { user, isAdmin, demoLogout } = useAuth();
  const { itemCount }                 = useCart();
  const { width }                     = useWindowDimensions();
  const isMobile                      = width < 768;

  const initials = useMemo(() =>
    user?.displayName
      ? user.displayName.split(' ').filter(Boolean).map(n => n[0]).join('').toUpperCase().slice(0, 2)
      : (user?.email?.[0] || '?').toUpperCase(),
    [user]);

  // ── Android/Browser back button handler ───────────────────
  useEffect(() => {
    if (Platform.OS !== 'web' || typeof window === 'undefined') return;

    // Set initial history state
    window.history.replaceState({ tab: 'Dashboard', idx: 0 }, '', '/');

    const onPopState = () => {
      const hist = historyRef.current;
      if (hist.length > 1) {
        const newHistory = hist.slice(0, -1);
        const prevTab    = newHistory[newHistory.length - 1];
        historyRef.current = newHistory;
        setNavHistory(newHistory);
        setActiveTab(prevTab);
        // Re-push so we don't fall off the end
        window.history.pushState({ tab: prevTab, idx: newHistory.length }, '', '/');
      }
      // If only 1 item left — let the browser handle (exit PWA / go to prev page)
    };

    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);

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

  // ── switchTab: pushes to history stack ────────────────────
  const switchTab = useCallback((key, data = null) => {
    setActiveTab(key);
    if (key === 'AddProduct')      setTabProduct(data);
    if (key === 'CustomerProfile') setViewCustomerId(data);

    setNavHistory(prev => {
      // Don't stack duplicates
      if (prev[prev.length - 1] === key) return prev;
      const next = [...prev, key];
      historyRef.current = next;
      // Push browser state for hardware back button
      if (Platform.OS === 'web' && typeof window !== 'undefined') {
        window.history.pushState({ tab: key, idx: next.length }, '', '/');
      }
      return next;
    });
  }, []);

  // ── goBack: pops history stack ─────────────────────────────
  const goBack = useCallback(() => {
    const hist = historyRef.current;
    if (hist.length <= 1) return;
    const newHistory = hist.slice(0, -1);
    const prevTab    = newHistory[newHistory.length - 1];
    historyRef.current = newHistory;
    setNavHistory(newHistory);
    setActiveTab(prevTab);
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      window.history.back();
    }
  }, []);

  const canGoBack = navHistory.length > 1;

  const viewCustomer = useCallback((id) => {
    setViewCustomerId(id);
    switchTab('CustomerProfile', id);
  }, [switchTab]);

  const editProduct = useCallback((product) => {
    setTabProduct(product);
    switchTab('AddProduct', product);
  }, [switchTab]);

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
            onClose={goBack}
          />
        );
      default: return <DashboardScreen {...base} />;
    }
  }, [activeTab, navigation, switchTab, viewCustomer, editProduct,
      tabProduct, viewCustomerId, goBack]);

  /* ──────────────────────────────────────────────────────────
     MOBILE
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
        <InstallBanner />

        {/* Top header */}
        <View style={wl.mobileHeader}>
          <View style={wl.mobileBrandRow}>
            <AppLogo size={36} variant="icon" />
            <View style={{ flex: 1 }}>
              <Text style={wl.mobileBrandName}>Dawood Trader</Text>
              <Text style={wl.mobileBrandSub}>Distribution System</Text>
            </View>
            <InstallPWA compact />
            <TouchableOpacity style={wl.mobileIconBtn} onPress={() => switchTab('Cart')}>
              <Text style={{ fontSize: 17 }}>🛒</Text>
              {itemCount > 0 && (
                <View style={wl.mobileIconBadge}>
                  <Text style={wl.mobileIconBadgeTxt}>{itemCount > 9 ? '9+' : itemCount}</Text>
                </View>
              )}
            </TouchableOpacity>
          </View>

          {/* Nav tabs */}
          <ScrollView
            horizontal showsHorizontalScrollIndicator={false}
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

        {/* Back bar — appears when navigated to sub-screen */}
        <MobileBackBar canGoBack={canGoBack} onBack={goBack} activeTab={activeTab} />

        <View style={wl.mobileContent}>{renderContent()}</View>
      </View>
    );
  }

  /* ──────────────────────────────────────────────────────────
     DESKTOP
  ────────────────────────────────────────────────────────── */
  return (
    <View style={wl.root}>
      <InstallBanner />

      {/* Sidebar */}
      <View style={wl.sidebar}>
        <View style={wl.brand}>
          <AppLogo size={38} variant="sidebar" />
        </View>

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

      {/* Content */}
      <View style={wl.contentArea}>
        <TopBar
          activeTab={activeTab}
          switchTab={switchTab}
          user={user}
          itemCount={itemCount}
          canGoBack={canGoBack}
          onBack={goBack}
        />
        <View style={wl.content}>{renderContent()}</View>
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

  /* Sidebar */
  sidebar: { width: 220, backgroundColor: '#0f172a', flexDirection: 'column', overflow: 'hidden' },

  brand: {
    paddingHorizontal: 14, paddingVertical: 16,
    borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.07)',
  },

  navSection:      { paddingHorizontal: 10, paddingTop: 18 },
  navSectionLabel: { color: 'rgba(255,255,255,0.22)', fontSize: 9, fontWeight: '700', letterSpacing: 1.4, paddingHorizontal: 8, marginBottom: 4 },

  navItem:         { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, paddingVertical: 9, borderRadius: 9, marginBottom: 1 },
  navItemActive:   { backgroundColor: 'rgba(37,99,235,0.28)' },
  navIconBox:      { width: 28, height: 28, borderRadius: 7, backgroundColor: 'rgba(255,255,255,0.06)', justifyContent: 'center', alignItems: 'center', marginRight: 10 },
  navIconBoxActive:{ backgroundColor: 'rgba(37,99,235,0.5)' },
  navIcon:         { fontSize: 13 },
  navLabel:        { flex: 1, color: 'rgba(255,255,255,0.42)', fontSize: 12, fontWeight: '500' },
  navLabelActive:  { color: '#fff', fontWeight: '700' },
  navBadge:        { backgroundColor: '#ef4444', borderRadius: 8, minWidth: 16, height: 16, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 3 },
  navBadgeTxt:     { color: '#fff', fontSize: 8, fontWeight: '800' },

  sideFooter: { paddingHorizontal: 12, paddingVertical: 14, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.07)', gap: 8 },
  demoPill:    { backgroundColor: 'rgba(245,158,11,0.13)', borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3, borderWidth: 1, borderColor: 'rgba(245,158,11,0.22)', alignSelf: 'flex-start' },
  demoPillTxt: { color: '#fbbf24', fontSize: 9, fontWeight: '700' },
  userRow:     { flexDirection: 'row', alignItems: 'center', gap: 8 },
  userAvatar:  { width: 30, height: 30, borderRadius: 15, backgroundColor: C.primary, justifyContent: 'center', alignItems: 'center' },
  userAvatarTxt: { color: '#fff', fontSize: 11, fontWeight: '800' },
  userName:    { color: '#e2e8f0', fontSize: 12, fontWeight: '600' },
  userEmail:   { color: 'rgba(255,255,255,0.27)', fontSize: 9, marginTop: 1 },
  logoutBtn:   { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 8, paddingHorizontal: 10, borderRadius: 8, backgroundColor: 'rgba(220,38,38,0.1)', borderWidth: 1, borderColor: 'rgba(220,38,38,0.18)' },
  logoutTxt:   { color: '#fca5a5', fontSize: 11, fontWeight: '600' },

  /* Content area */
  contentArea: { flex: 1, flexDirection: 'column', minWidth: 0, overflow: 'hidden' },
  content:     { flex: 1, minHeight: 0, overflow: 'hidden' },

  /* TopBar */
  topBar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: '#fff', paddingHorizontal: 20, paddingVertical: 12,
    borderBottomWidth: 1, borderBottomColor: '#e8edf5',
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05, shadowRadius: 4, elevation: 2, zIndex: 10,
  },
  topBarLeft:  { flexDirection: 'row', alignItems: 'center', gap: 10 },
  topBarIcon:  { fontSize: 20 },
  topBarTitle: { fontSize: 18, fontWeight: '800', color: '#0f172a' },
  topBarRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },

  /* Back button in TopBar */
  backBtn: {
    width: 34, height: 34, borderRadius: 9,
    backgroundColor: '#f1f5f9', justifyContent: 'center', alignItems: 'center',
    borderWidth: 1, borderColor: '#e2e8f0',
  },
  backBtnTxt: { fontSize: 18, color: '#0f172a', fontWeight: '700' },

  topIconBtn:   { position: 'relative', width: 34, height: 34, borderRadius: 9, backgroundColor: '#f4f7fc', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#e8edf5' },
  topBadge:     { position: 'absolute', top: 4, right: 4, backgroundColor: '#ef4444', borderRadius: 5, minWidth: 11, height: 11, justifyContent: 'center', alignItems: 'center' },
  topBadgeTxt:  { color: '#fff', fontSize: 6, fontWeight: '800' },
  topAvatar:    { width: 34, height: 34, borderRadius: 17, backgroundColor: C.primary, justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: '#bfdbfe' },
  topAvatarTxt: { color: '#fff', fontSize: 12, fontWeight: '800' },

  langRow:      { flexDirection: 'row', gap: 4 },
  langBtn:      { paddingHorizontal: 9, paddingVertical: 5, borderRadius: 7, borderWidth: 1, borderColor: '#e2e8f0', backgroundColor: '#f8fafc' },
  langBtnActive:{ backgroundColor: C.primaryLight, borderColor: C.primary },
  langTxt:      { color: '#64748b', fontSize: 11, fontWeight: '600' },
  langTxtActive:{ color: C.primary, fontWeight: '800' },

  /* Mobile */
  mobileRoot:   { flex: 1, flexDirection: 'column', backgroundColor: '#f0f4fa' },
  mobileHeader: { backgroundColor: C.primary },
  mobileBrandRow: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 12, paddingTop: 12, paddingBottom: 8 },
  mobileBrandName:  { color: '#fff', fontSize: 14, fontWeight: '800' },
  mobileBrandSub:   { color: 'rgba(255,255,255,0.5)', fontSize: 9, marginTop: 1 },
  mobileIconBtn:    { position: 'relative', width: 34, height: 34, borderRadius: 9, backgroundColor: 'rgba(255,255,255,0.14)', justifyContent: 'center', alignItems: 'center' },
  mobileIconBadge:  { position: 'absolute', top: 2, right: 2, backgroundColor: '#ef4444', borderRadius: 5, minWidth: 12, height: 12, justifyContent: 'center', alignItems: 'center' },
  mobileIconBadgeTxt:{ color: '#fff', fontSize: 7, fontWeight: '800' },

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

  /* Mobile back bar */
  mobileBackBar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: '#fff', paddingHorizontal: 12, paddingVertical: 10,
    borderBottomWidth: 1, borderBottomColor: '#e8edf5',
  },
  mobileBackBtn:   { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 4, paddingHorizontal: 8, backgroundColor: '#f1f5f9', borderRadius: 10, borderWidth: 1, borderColor: '#e2e8f0' },
  mobileBackArrow: { fontSize: 16, color: C.primary, fontWeight: '700' },
  mobileBackTxt:   { fontSize: 13, color: C.primary, fontWeight: '700' },
  mobileBackPage:  { fontSize: 13, fontWeight: '700', color: '#0f172a' },

  mobileContent: { flex: 1, minHeight: 0, overflow: 'hidden' },
});
