import React, { useMemo, memo, useState, useRef, useEffect } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  Platform, useWindowDimensions, TextInput, Image, Alert, ActivityIndicator,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { manipulateAsync, SaveFormat } from 'expo-image-manipulator';
import { useAppData } from '../context/AppDataContext';
import { useAuth }    from '../context/AuthContext';
import { useLang }    from '../context/LanguageContext';
import { C }          from '../constants/theme';

const QCATS  = ['Cold Drinks', 'Masala', 'Pickles', 'Grocery', 'Snacks', 'Household', 'Pasta', 'Bricks'];
const QUNITS = ['gram', 'liter', 'ml', 'kg', 'piece', 'dozen', 'box'];

function fmtDate(ts) {
  if (!ts) return '—';
  return new Date(ts).toLocaleDateString('en-PK', { day: '2-digit', month: 'short' });
}
function fmtCurrency(n) {
  if ((n || 0) >= 100000) return 'Rs.' + ((n || 0) / 100000).toFixed(1) + 'L';
  if ((n || 0) >= 1000)   return 'Rs.' + ((n || 0) / 1000).toFixed(1)   + 'K';
  return 'Rs.' + (n || 0).toLocaleString();
}

const StatCard = memo(function StatCard({ icon, label, value, gradient, onPress }) {
  const [bg1, bg2, textCol] = gradient;
  return (
    <TouchableOpacity
      style={[ds.statCard, { backgroundColor: bg1, borderColor: bg2 + '40' }]}
      onPress={onPress}
      activeOpacity={onPress ? 0.8 : 1}
    >
      <View style={[ds.statIconBox, { backgroundColor: bg2 + '25' }]}>
        <Text style={ds.statIconTxt}>{icon}</Text>
      </View>
      <Text style={[ds.statValue, { color: textCol }]}>{value}</Text>
      <Text style={ds.statLabel}>{label}</Text>
    </TouchableOpacity>
  );
});

const OrderRow = memo(function OrderRow({ order, routes, onCollect }) {
  const statusColor = { paid: '#15803d', partial: '#a16207', unpaid: '#b91c1c' };
  const statusBg    = { paid: '#dcfce7', partial: '#fef9c3', unpaid: '#fee2e2' };
  const s = order.status || 'unpaid';
  const route = routes.find(r => r.id === order.routeId);

  return (
    <View style={ds.orderRow}>
      <View style={ds.orderAvatar}>
        <Text style={ds.orderAvatarTxt}>{order.customerName?.[0]?.toUpperCase() || '?'}</Text>
      </View>
      <View style={{ flex: 1 }}>
        <Text style={ds.orderName} numberOfLines={1}>{order.customerName}</Text>
        <Text style={ds.orderMeta}>
          {fmtDate(order.createdAt)} · {route?.name || '—'} · {order.items?.length || 0} items
        </Text>
      </View>
      <View style={{ alignItems: 'flex-end', gap: 4 }}>
        <Text style={[ds.orderAmt, { color: statusColor[s] }]}>
          Rs.{(order.grandTotal || 0).toLocaleString()}
        </Text>
        <View style={[ds.statusPill, { backgroundColor: statusBg[s] }]}>
          <Text style={[ds.statusTxt, { color: statusColor[s] }]}>
            {s.charAt(0).toUpperCase() + s.slice(1)}
          </Text>
        </View>
      </View>
      {order.remaining > 0 && onCollect && (
        <TouchableOpacity style={ds.collectBtn} onPress={() => onCollect(order)}>
          <Text style={ds.collectBtnTxt}>💰</Text>
        </TouchableOpacity>
      )}
    </View>
  );
});

/* ── Quick Add Product panel ── */
function QuickAddProduct({ onDone }) {
  const { addProduct } = useAppData();

  const [name,     setName]     = useState('');
  const [price,    setPrice]    = useState('');
  const [qty,      setQty]      = useState('');
  const [unit,     setUnit]     = useState('gram');
  const [category, setCategory] = useState('Cold Drinks');
  const [imageUri, setImageUri] = useState(null);
  const [saving,   setSaving]   = useState(false);
  const [done,     setDone]     = useState(false);

  const unitScrollRef = useRef(null);
  const catScrollRef  = useRef(null);
  useEffect(() => {
    if (Platform.OS !== 'web') return;
    [unitScrollRef, catScrollRef].forEach(refObj => {
      const el = refObj.current;
      if (!el) return;
      let startX = 0, startY = 0, startLeft = 0;
      const onTS = e => { startX = e.touches[0].clientX; startY = e.touches[0].clientY; startLeft = el.scrollLeft; };
      const onTM = e => {
        const dx = e.touches[0].clientX - startX;
        const dy = e.touches[0].clientY - startY;
        if (Math.abs(dx) > Math.abs(dy) + 3) { e.preventDefault(); el.scrollLeft = startLeft - dx; }
      };
      const onW = e => { if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) { e.preventDefault(); el.scrollLeft += e.deltaY; } };
      el.addEventListener('touchstart', onTS, { passive: true });
      el.addEventListener('touchmove',  onTM, { passive: false });
      el.addEventListener('wheel',      onW,  { passive: false });
    });
  }, []);

  const pickPhoto = async () => {
    if (Platform.OS !== 'web') {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') { Alert.alert('Permission chahiye', 'Gallery allow karein'); return; }
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: Platform.OS !== 'web',
      aspect: [4, 3],
      quality: 0.85,
    });
    if (result.canceled) return;
    const compressed = await manipulateAsync(
      result.assets[0].uri,
      [{ resize: { width: 600 } }],
      { compress: 0.7, format: SaveFormat.JPEG }
    );
    // Convert to base64 for persistence
    if (Platform.OS === 'web') {
      const blob = await (await fetch(compressed.uri)).blob();
      const b64 = await new Promise((res, rej) => {
        const reader = new FileReader();
        reader.onloadend = () => res(reader.result);
        reader.onerror   = rej;
        reader.readAsDataURL(blob);
      });
      setImageUri(b64);
    } else {
      const FileSystem = require('expo-file-system');
      const b64 = await FileSystem.readAsStringAsync(compressed.uri, { encoding: FileSystem.EncodingType.Base64 });
      setImageUri(`data:image/jpeg;base64,${b64}`);
    }
  };

  const handleSave = async () => {
    if (!name.trim())  { Alert.alert('Error', 'Product ka naam likhein'); return; }
    if (!price.trim()) { Alert.alert('Error', 'Price likhein'); return; }
    setSaving(true);
    try {
      const unitLabel = qty.trim() ? `${qty.trim()} ${unit}` : unit;
      await addProduct({
        name:     name.trim(),
        price:    Number(price),
        unit:     unitLabel,
        category,
        stock:    100,
        inStock:  true,
        sku:      '',
        description: '',
        imageUrl: imageUri || null,
      });
      setDone(true);
      setTimeout(() => {
        setName(''); setPrice(''); setQty(''); setUnit('gram');
        setCategory('Cold Drinks'); setImageUri(null); setDone(false);
      }, 1800);
      onDone?.();
    } catch (e) {
      Alert.alert('Error', e.message || 'Save nahi ho saka');
    } finally {
      setSaving(false);
    }
  };

  if (done) {
    return (
      <View style={ds.panel}>
        <View style={{ alignItems: 'center', paddingVertical: 16 }}>
          <Text style={{ fontSize: 40 }}>✅</Text>
          <Text style={{ fontSize: 15, fontWeight: '800', color: '#15803d', marginTop: 8 }}>Product add ho gaya!</Text>
          <Text style={{ fontSize: 12, color: '#64748b', marginTop: 4 }}>Product list mein show ho raha hai</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={ds.panel}>
      <Text style={ds.panelTitle}>➕ Naya Product Add Karo</Text>

      {/* Photo + Name row */}
      <View style={{ flexDirection: 'row', gap: 12, marginTop: 14 }}>
        <TouchableOpacity style={ds.photoBtn} onPress={pickPhoto} activeOpacity={0.8}>
          {imageUri
            ? <Image source={{ uri: imageUri }} style={ds.photoImg} />
            : (
              <View style={{ alignItems: 'center' }}>
                <Text style={{ fontSize: 28 }}>📷</Text>
                <Text style={ds.photoHint}>Photo</Text>
              </View>
            )
          }
        </TouchableOpacity>

        <View style={{ flex: 1, gap: 8 }}>
          <TextInput
            style={ds.input}
            placeholder="Product ka naam (e.g. OG Cola)"
            value={name}
            onChangeText={setName}
            placeholderTextColor="#94a3b8"
          />
          <TextInput
            style={ds.input}
            placeholder="Price (Rs.)"
            value={price}
            onChangeText={setPrice}
            keyboardType="numeric"
            placeholderTextColor="#94a3b8"
          />
        </View>
      </View>

      {/* Quantity + Unit row */}
      <View style={{ flexDirection: 'row', gap: 8, marginTop: 10 }}>
        <TextInput
          style={[ds.input, { flex: 1 }]}
          placeholder="Quantity (50, 1, 250...)"
          value={qty}
          onChangeText={setQty}
          keyboardType="numeric"
          placeholderTextColor="#94a3b8"
        />
        {Platform.OS === 'web' ? (
          <div style={{ display: 'flex', alignItems: 'center', flex: 1, minWidth: 0 }}>
            <button onClick={() => unitScrollRef.current?.scrollBy({ left: -100, behavior: 'smooth' })} style={{ border: 'none', background: 'transparent', cursor: 'pointer', fontSize: 18, color: '#1a56db', padding: '0 4px', flexShrink: 0 }}>‹</button>
            <div ref={unitScrollRef} style={{ flex: 1, display: 'flex', flexDirection: 'row', flexWrap: 'nowrap', overflowX: 'auto', overflowY: 'hidden', gap: 6, paddingVertical: 2, WebkitOverflowScrolling: 'touch', scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
              {QUNITS.map(u => (
                <TouchableOpacity key={u} style={[ds.chip, unit === u && ds.chipActive]} onPress={() => setUnit(u)}>
                  <Text style={[ds.chipTxt, unit === u && ds.chipTxtActive]}>{u}</Text>
                </TouchableOpacity>
              ))}
            </div>
            <button onClick={() => unitScrollRef.current?.scrollBy({ left: 100, behavior: 'smooth' })} style={{ border: 'none', background: 'transparent', cursor: 'pointer', fontSize: 18, color: '#1a56db', padding: '0 4px', flexShrink: 0 }}>›</button>
          </div>
        ) : (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} nestedScrollEnabled style={{ flexShrink: 0, flex: 1 }}>
            <View style={{ flexDirection: 'row', gap: 6, paddingVertical: 2 }}>
              {QUNITS.map(u => (
                <TouchableOpacity key={u} style={[ds.chip, unit === u && ds.chipActive]} onPress={() => setUnit(u)}>
                  <Text style={[ds.chipTxt, unit === u && ds.chipTxtActive]}>{u}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
        )}
      </View>

      {/* Category chips */}
      <Text style={ds.fieldLabel}>Category:</Text>
      {Platform.OS === 'web' ? (
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <button onClick={() => catScrollRef.current?.scrollBy({ left: -120, behavior: 'smooth' })} style={{ border: 'none', background: 'transparent', cursor: 'pointer', fontSize: 18, color: '#1a56db', padding: '0 4px', flexShrink: 0 }}>‹</button>
          <div ref={catScrollRef} style={{ flex: 1, display: 'flex', flexDirection: 'row', flexWrap: 'nowrap', overflowX: 'auto', overflowY: 'hidden', gap: 6, paddingTop: 4, paddingBottom: 4, WebkitOverflowScrolling: 'touch', scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
            {QCATS.map(c => (
              <TouchableOpacity key={c} style={[ds.chip, category === c && ds.chipActive]} onPress={() => setCategory(c)}>
                <Text style={[ds.chipTxt, category === c && ds.chipTxtActive]}>{c}</Text>
              </TouchableOpacity>
            ))}
          </div>
          <button onClick={() => catScrollRef.current?.scrollBy({ left: 120, behavior: 'smooth' })} style={{ border: 'none', background: 'transparent', cursor: 'pointer', fontSize: 18, color: '#1a56db', padding: '0 4px', flexShrink: 0 }}>›</button>
        </div>
      ) : (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} nestedScrollEnabled style={{ flexShrink: 0 }}>
          <View style={{ flexDirection: 'row', gap: 6, paddingVertical: 4 }}>
            {QCATS.map(c => (
              <TouchableOpacity key={c} style={[ds.chip, category === c && ds.chipActive]} onPress={() => setCategory(c)}>
                <Text style={[ds.chipTxt, category === c && ds.chipTxtActive]}>{c}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
      )}

      {/* Save button */}
      <TouchableOpacity
        style={[ds.saveBtn, saving && { opacity: 0.7 }]}
        onPress={handleSave}
        disabled={saving}
        activeOpacity={0.85}
      >
        {saving
          ? <ActivityIndicator color="#fff" />
          : <Text style={ds.saveBtnTxt}>✅  Product Save Karo</Text>
        }
      </TouchableOpacity>
    </View>
  );
}

export default function DashboardScreen({ switchTab }) {
  const { products, customers, orders, ROUTES, getStats } = useAppData();
  const { user, isAdmin } = useAuth();
  const { t }    = useLang();
  const { width } = useWindowDimensions();
  const isWide    = width >= 768;

  // Salesman sirf apne orders dekhe; owner sab dekhe
  const visibleOrders = useMemo(() =>
    isAdmin ? orders : orders.filter(o => o.salesmanId === user?.uid),
  [orders, isAdmin, user?.uid]);

  const stats = useMemo(() => getStats(products), [products, getStats]);

  const myStats  = useMemo(() => {
    const now      = new Date(); now.setHours(0,0,0,0);
    const todayTs  = now.getTime();
    const monthTs  = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
    const ts = o => o.createdAt?.seconds ? o.createdAt.seconds * 1000 : (o.createdAt || 0);
    const todayOrders  = visibleOrders.filter(o => ts(o) >= todayTs);
    const monthOrders  = visibleOrders.filter(o => ts(o) >= monthTs);
    const outstanding  = visibleOrders.reduce((s, o) => s + (o.remaining || 0), 0);
    return {
      todaysOrderCount: todayOrders.length,
      todaysSales:      todayOrders.reduce((s, o) => s + (o.grandTotal || 0), 0),
      monthlySales:     monthOrders.reduce((s, o) => s + (o.grandTotal || 0), 0),
      outstanding,
    };
  }, [visibleOrders]);

  const ownerCards = [
    { icon: '📦', label: t('totalProducts'),   value: products.length,          gradient: ['#eff6ff', '#3b82f6', '#1d4ed8'], onPress: () => switchTab?.('Home') },
    { icon: '👥', label: t('totalCustomers'),  value: customers.length,         gradient: ['#f0fdf4', '#22c55e', '#15803d'], onPress: () => switchTab?.('Customers') },
    { icon: '🗺️', label: t('totalRoutes'),     value: ROUTES.length,            gradient: ['#fefce8', '#eab308', '#a16207'] },
    { icon: '📋', label: t('todaysOrders'),    value: myStats.todaysOrderCount,  gradient: ['#faf5ff', '#a855f7', '#7e22ce'], onPress: () => switchTab?.('OrderHistory') },
    { icon: '💵', label: t('todaysSales'),     value: fmtCurrency(myStats.todaysSales),  gradient: ['#f0fdf4', '#10b981', '#059669'], onPress: () => switchTab?.('OrderHistory') },
    { icon: '📈', label: t('monthlySales'),    value: fmtCurrency(myStats.monthlySales), gradient: ['#eff6ff', '#3b82f6', '#1d4ed8'] },
    { icon: '⏳', label: t('outstandingRecovery'), value: fmtCurrency(myStats.outstanding), gradient: myStats.outstanding > 0 ? ['#fef2f2', '#ef4444', '#b91c1c'] : ['#f0fdf4', '#22c55e', '#15803d'], onPress: () => switchTab?.('Recovery') },
    { icon: '⚠️', label: t('lowStock'),        value: stats.lowStockProducts?.length || 0, gradient: stats.lowStockProducts?.length > 0 ? ['#fff7ed', '#f97316', '#c2410c'] : ['#f0fdf4', '#22c55e', '#15803d'], onPress: () => switchTab?.('Inventory') },
  ];

  const salesmanCards = [
    { icon: '📋', label: 'Aaj ke Orders',    value: myStats.todaysOrderCount,          gradient: ['#faf5ff', '#a855f7', '#7e22ce'], onPress: () => switchTab?.('OrderHistory') },
    { icon: '💵', label: 'Aaj ki Sales',     value: fmtCurrency(myStats.todaysSales),  gradient: ['#f0fdf4', '#10b981', '#059669'], onPress: () => switchTab?.('OrderHistory') },
    { icon: '📈', label: 'Mahine ki Sales',  value: fmtCurrency(myStats.monthlySales), gradient: ['#eff6ff', '#3b82f6', '#1d4ed8'] },
    { icon: '⏳', label: 'Meri Recovery',    value: fmtCurrency(myStats.outstanding),  gradient: myStats.outstanding > 0 ? ['#fef2f2', '#ef4444', '#b91c1c'] : ['#f0fdf4', '#22c55e', '#15803d'], onPress: () => switchTab?.('Recovery') },
  ];

  const statCards = isAdmin ? ownerCards : salesmanCards;
  const cols = isWide ? 4 : 2;

  return (
    <ScrollView
      style={ds.root}
      contentContainerStyle={[ds.body, { paddingHorizontal: isWide ? 24 : 14 }]}
    >
      {/* Welcome bar (mobile only) */}
      {!isWide && (
        <View style={ds.welcomeBar}>
          <Text style={ds.welcomeTitle}>📊 {t('dashboard')}</Text>
          <Text style={ds.welcomeSub}>
            {isAdmin ? 'Dawood Trader — Overview' : `Meri Sales — ${user?.displayName || 'Salesman'}`}
          </Text>
        </View>
      )}

      {/* Stats Grid */}
      <View style={ds.grid}>
        {statCards.map((card, i) => (
          <View key={i} style={{ width: `${100 / cols}%`, paddingHorizontal: 5, marginBottom: 10 }}>
            <StatCard {...card} />
          </View>
        ))}
      </View>

      {/* Quick Add Product — sirf admin ke liye */}
      {isAdmin && <QuickAddProduct onDone={() => switchTab?.('Home')} />}

      {/* Two-column layout on wide screens */}
      <View style={[ds.bottomRow, isWide && ds.bottomRowWide]}>

        {/* Recent Orders */}
        <View style={[ds.panel, isWide && { flex: 3, marginRight: 12 }]}>
          <View style={ds.panelHeader}>
            <Text style={ds.panelTitle}>📋 {isAdmin ? t('recentOrders') : 'Mere Recent Orders'}</Text>
            <TouchableOpacity onPress={() => switchTab?.('OrderHistory')}>
              <Text style={ds.panelLink}>See All →</Text>
            </TouchableOpacity>
          </View>
          {visibleOrders.length === 0 ? (
            <View style={ds.emptyBox}>
              <Text style={{ fontSize: 40 }}>📋</Text>
              <Text style={ds.emptyTxt}>{t('noOrders')}</Text>
              <TouchableOpacity style={ds.emptyBtn} onPress={() => switchTab?.('NewOrder')}>
                <Text style={ds.emptyBtnTxt}>+ {t('newOrder')}</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={ds.orderList}>
              {visibleOrders.slice(0, 6).map(order => (
                <OrderRow
                  key={order.id}
                  order={order}
                  routes={ROUTES}
                  onCollect={() => switchTab?.('Recovery')}
                />
              ))}
            </View>
          )}
        </View>

        {/* Low Stock + Quick Actions */}
        <View style={[isWide && { flex: 2 }]}>
          {/* Quick Actions */}
          <View style={[ds.panel, { marginBottom: 12 }]}>
            <Text style={ds.panelTitle}>⚡ Quick Actions</Text>
            <View style={ds.quickGrid}>
              {[
                { icon: '📝', label: t('newOrder'),     tab: 'NewOrder',     bg: C.primary  },
                { icon: '👥', label: t('customers'),    tab: 'Customers',    bg: '#15803d'  },
                { icon: '📋', label: t('orderHistory'), tab: 'OrderHistory', bg: '#7e22ce'  },
                { icon: '💰', label: t('recovery'),     tab: 'Recovery',     bg: '#b91c1c'  },
              ].map(q => (
                <TouchableOpacity
                  key={q.tab}
                  style={[ds.quickBtn, { backgroundColor: q.bg }]}
                  onPress={() => switchTab?.(q.tab)}
                  activeOpacity={0.82}
                >
                  <Text style={{ fontSize: 20 }}>{q.icon}</Text>
                  <Text style={ds.quickLabel}>{q.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Low Stock */}
          {stats.lowStockProducts?.length > 0 && (
            <View style={ds.panel}>
              <View style={ds.panelHeader}>
                <Text style={ds.panelTitle}>⚠️ {t('lowStock')}</Text>
                <TouchableOpacity onPress={() => switchTab?.('Inventory')}>
                  <Text style={ds.panelLink}>Fix →</Text>
                </TouchableOpacity>
              </View>
              {stats.lowStockProducts.slice(0, 4).map(p => (
                <View key={p.id} style={ds.stockRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={ds.stockName} numberOfLines={1}>{p.name}</Text>
                    <Text style={ds.stockCat}>{p.category}</Text>
                  </View>
                  <View style={[ds.stockBadge,
                    { backgroundColor: (p.stock ?? 0) === 0 ? '#fee2e2' : '#fff7ed' }
                  ]}>
                    <Text style={[ds.stockBadgeTxt,
                      { color: (p.stock ?? 0) === 0 ? '#b91c1c' : '#c2410c' }
                    ]}>
                      {(p.stock ?? 0) === 0 ? '⚠ Out' : `${p.stock} left`}
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          )}
        </View>
      </View>

      <View style={{ height: 32 }} />
    </ScrollView>
  );
}

const ds = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#f0f4fa' },
  body: { paddingTop: 20, paddingBottom: 40 },

  welcomeBar:  { marginBottom: 16 },
  welcomeTitle:{ fontSize: 22, fontWeight: '800', color: '#0f172a' },
  welcomeSub:  { fontSize: 12, color: '#64748b', marginTop: 2 },

  /* Stats */
  grid: { flexDirection: 'row', flexWrap: 'wrap', marginHorizontal: -5, marginBottom: 6 },
  statCard: {
    flex: 1, borderRadius: 16, padding: 16, borderWidth: 1,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06, shadowRadius: 8, elevation: 3,
  },
  statIconBox:  { width: 44, height: 44, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
  statIconTxt:  { fontSize: 22 },
  statValue:    { fontSize: 22, fontWeight: '800', marginBottom: 4 },
  statLabel:    { fontSize: 11, color: '#64748b', fontWeight: '600' },

  /* Bottom row */
  bottomRow:     { gap: 12 },
  bottomRowWide: { flexDirection: 'row', alignItems: 'flex-start' },

  /* Panel */
  panel: {
    backgroundColor: '#fff', borderRadius: 16, padding: 18, marginBottom: 12,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05, shadowRadius: 8, elevation: 3,
  },
  panelHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  panelTitle:  { fontSize: 14, fontWeight: '800', color: '#0f172a' },
  panelLink:   { fontSize: 12, color: C.primary, fontWeight: '700' },

  /* Quick Add */
  photoBtn: {
    width: 84, height: 84, borderRadius: 14,
    backgroundColor: '#f1f5f9', borderWidth: 2, borderColor: '#e2e8f0',
    borderStyle: 'dashed', justifyContent: 'center', alignItems: 'center', overflow: 'hidden',
  },
  photoImg:  { width: 84, height: 84, borderRadius: 12 },
  photoHint: { fontSize: 10, color: '#94a3b8', marginTop: 3, fontWeight: '600' },
  input: {
    backgroundColor: '#f8fafc', borderWidth: 1.5, borderColor: '#e2e8f0',
    borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10,
    fontSize: 13, color: '#0f172a',
  },
  fieldLabel:  { fontSize: 11, fontWeight: '700', color: '#64748b', marginTop: 10, marginBottom: 4 },
  chip:        { borderRadius: 20, paddingHorizontal: 14, paddingVertical: 7, backgroundColor: '#f1f5f9', borderWidth: 1, borderColor: '#e2e8f0' },
  chipActive:  { backgroundColor: C.primary, borderColor: C.primary },
  chipTxt:     { fontSize: 11, fontWeight: '600', color: '#64748b' },
  chipTxtActive:{ color: '#fff', fontWeight: '700' },
  saveBtn: {
    marginTop: 14, backgroundColor: C.primary, borderRadius: 12,
    paddingVertical: 15, alignItems: 'center',
    shadowColor: C.primary, shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3, shadowRadius: 8, elevation: 5,
  },
  saveBtnTxt: { color: '#fff', fontSize: 15, fontWeight: '800' },

  /* Orders */
  orderList: {},
  orderRow: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingVertical: 11, borderBottomWidth: 1, borderBottomColor: '#f8fafc',
  },
  orderAvatar:    { width: 36, height: 36, borderRadius: 18, backgroundColor: C.primary, justifyContent: 'center', alignItems: 'center' },
  orderAvatarTxt: { color: '#fff', fontSize: 14, fontWeight: '800' },
  orderName:  { fontSize: 13, fontWeight: '700', color: '#0f172a' },
  orderMeta:  { fontSize: 10, color: '#94a3b8', marginTop: 2 },
  orderAmt:   { fontSize: 13, fontWeight: '800' },
  statusPill: { borderRadius: 6, paddingHorizontal: 8, paddingVertical: 2 },
  statusTxt:  { fontSize: 9, fontWeight: '700' },
  collectBtn: { width: 30, height: 30, borderRadius: 8, backgroundColor: '#dcfce7', justifyContent: 'center', alignItems: 'center' },
  collectBtnTxt: { fontSize: 14 },

  /* Quick actions */
  quickGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 12 },
  quickBtn:  {
    width: '47%', borderRadius: 14, paddingVertical: 16,
    alignItems: 'center', gap: 6,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1, shadowRadius: 4, elevation: 3,
  },
  quickLabel: { color: '#fff', fontSize: 10, fontWeight: '700', textAlign: 'center' },

  /* Low stock */
  stockRow:     { flexDirection: 'row', alignItems: 'center', paddingVertical: 9, borderBottomWidth: 1, borderBottomColor: '#f8fafc' },
  stockName:    { fontSize: 13, fontWeight: '600', color: '#0f172a' },
  stockCat:     { fontSize: 10, color: '#94a3b8', marginTop: 1 },
  stockBadge:   { borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4 },
  stockBadgeTxt:{ fontSize: 10, fontWeight: '700' },

  /* Empty */
  emptyBox:   { alignItems: 'center', paddingVertical: 32, gap: 8 },
  emptyTxt:   { fontSize: 13, color: '#94a3b8', fontWeight: '500' },
  emptyBtn:   { backgroundColor: C.primary, borderRadius: 10, paddingHorizontal: 20, paddingVertical: 10, marginTop: 4 },
  emptyBtnTxt:{ color: '#fff', fontWeight: '700', fontSize: 13 },
});
