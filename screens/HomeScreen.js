import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  Image, ActivityIndicator, FlatList, Pressable, ScrollView,
  Platform, useWindowDimensions,
} from 'react-native';
import { collection, onSnapshot, orderBy, query } from 'firebase/firestore';
import { db, IS_DEMO } from '../services/firebase';
import { DEMO_PRODUCTS } from '../services/demoData';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { C, CAT } from '../constants/theme';

const CATEGORIES = ['All', 'Cold Drinks', 'Pickles', 'Pasta', 'Grocery', 'Snacks', 'Household', 'Bricks'];

function timeGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good Morning ☀️';
  if (h < 17) return 'Good Afternoon 🌤️';
  return 'Good Evening 🌙';
}

/* ── Product Card ─────────────────────────────────────────────── */
function ProductCard({ item, onAdd, onPress, cardWidth }) {
  const cat     = CAT[item.category] || CAT.default;
  const inStock = item.inStock !== false;
  const compact = cardWidth < 140;
  const imgH    = compact ? 108 : 155;

  return (
    <Pressable
      style={({ pressed, hovered }) => [
        s.card, { width: cardWidth },
        hovered && s.cardHovered,
        pressed && { transform: [{ scale: 0.97 }], opacity: 0.93 },
      ]}
      onPress={onPress}
    >
      {/* Image */}
      <View style={[s.imgWrap, { height: imgH, backgroundColor: cat.bg }]}>
        {item.imageUrl ? (
          <Image source={{ uri: item.imageUrl }} style={s.cardImg} resizeMode="contain" />
        ) : (
          <Text style={{ fontSize: compact ? 38 : 54 }}>{cat.icon}</Text>
        )}
        {/* Out-of-stock overlay */}
        {!inStock && (
          <View style={s.oosDim}>
            <View style={s.oosTag}><Text style={s.oosTagTxt}>Out of Stock</Text></View>
          </View>
        )}
        {/* Category pill */}
        <View style={[s.catPill, { backgroundColor: cat.text + '22', borderColor: cat.text + '44' }]}>
          <Text style={[s.catPillTxt, { color: cat.text }]}>
            {compact ? cat.icon : `${cat.icon} ${item.category}`}
          </Text>
        </View>
      </View>

      {/* Body */}
      <View style={[s.body, compact && s.bodySm]}>
        <Text style={[s.name, compact && s.nameSm]} numberOfLines={2}>{item.name}</Text>
        <Text style={[s.unit, compact && s.unitSm]} numberOfLines={1}>{item.unit || 'piece'}</Text>
        <View style={s.footer}>
          <Text style={[s.price, compact && s.priceSm]}>Rs.{item.price?.toLocaleString()}</Text>
          <TouchableOpacity
            style={[s.addBtn, compact && s.addBtnSm, !inStock && s.addBtnOff]}
            onPress={(e) => { e?.stopPropagation?.(); onAdd(); }}
            disabled={!inStock}
            activeOpacity={0.8}
          >
            <Text style={[s.addTxt, compact && s.addTxtSm]}>
              {inStock ? (compact ? '+' : '+ Add') : '—'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Pressable>
  );
}

/* ── Home Screen ──────────────────────────────────────────────── */
export default function HomeScreen({ navigation }) {
  const [products, setProducts]       = useState([]);
  const [search, setSearch]           = useState('');
  const [selectedCat, setSelectedCat] = useState('All');
  const [loading, setLoading]         = useState(true);

  const { addToCart }     = useCart();
  const { user, isAdmin } = useAuth();
  const { width }         = useWindowDimensions();
  const isWeb             = Platform.OS === 'web';
  const SIDEBAR_W         = isWeb ? 248 : 0;
  const contentW          = width - SIDEBAR_W;

  const numCols   = contentW < 340 ? 2 : 3;
  const OUTER_PAD = isWeb ? 16 : 4;
  const CARD_MRG  = 4;
  const cardWidth = Math.floor((contentW - OUTER_PAD * 2) / numCols - CARD_MRG * 2);

  useEffect(() => {
    if (IS_DEMO) { setProducts(DEMO_PRODUCTS); setLoading(false); return; }
    const q = query(collection(db, 'products'), orderBy('createdAt', 'desc'));
    const unsub = onSnapshot(q, (snap) => {
      setProducts(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
      setLoading(false);
    });
    return unsub;
  }, []);

  const filtered = products.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase()) &&
    (selectedCat === 'All' || p.category === selectedCat)
  );

  const catCount = (cat) =>
    cat === 'All' ? products.length : products.filter((p) => p.category === cat).length;

  const handleAdd = useCallback((item) => {
    if (item.inStock === false) return;
    addToCart(item);
  }, [addToCart]);

  const renderItem = useCallback(({ item }) => (
    <ProductCard
      item={item}
      cardWidth={cardWidth}
      onPress={() => navigation.navigate('ProductDetail', { product: item })}
      onAdd={() => handleAdd(item)}
    />
  ), [cardWidth, navigation, handleAdd]);

  /* ── Sticky toolbar (never scrolls) ──────────────────────── */
  const Toolbar = (
    <View style={s.toolbar}>
      {isWeb && (
        <View style={s.webHeader}>
          <View>
            <Text style={s.webTitle}>🛒  Dawood Trader</Text>
            <Text style={s.webSub}>
              {timeGreeting()}, {user?.displayName || 'Customer'} · {products.length} items
            </Text>
          </View>
          {isAdmin && (
            <TouchableOpacity style={s.manageBtn} onPress={() => navigation.navigate('Admin')}>
              <Text style={s.manageBtnTxt}>⚙️  Manage Products</Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* Search */}
      <View style={[s.searchWrap, isWeb && { paddingHorizontal: 24 }]}>
        <View style={s.searchBox}>
          <Text style={s.searchIcon}>🔍</Text>
          <TextInput
            style={s.searchInput}
            placeholder="Search products..."
            value={search}
            onChangeText={setSearch}
            placeholderTextColor="#94a3b8"
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch('')} style={{ padding: 6 }}>
              <Text style={{ color: '#94a3b8', fontSize: 13, fontWeight: '800' }}>✕</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Category chips */}
      <ScrollView
        horizontal showsHorizontalScrollIndicator={false}
        style={s.catBar}
        contentContainerStyle={[s.catScroll, isWeb && { paddingHorizontal: 20 }]}
      >
        {CATEGORIES.map((cat) => {
          const active = selectedCat === cat;
          const cs     = cat !== 'All' ? CAT[cat] : null;
          const count  = catCount(cat);
          if (count === 0 && cat !== 'All') return null;
          return (
            <TouchableOpacity
              key={cat}
              style={[
                s.chip,
                active && (cs
                  ? { backgroundColor: cs.bg, borderColor: cs.text + '66' }
                  : s.chipBlue),
              ]}
              onPress={() => setSelectedCat(cat)}
            >
              {cat !== 'All' && cs && <Text style={{ fontSize: 13, marginRight: 4 }}>{cs.icon}</Text>}
              <Text style={[s.chipTxt, active && (cs ? { color: cs.text, fontWeight: '700' } : { color: C.primary, fontWeight: '700' })]}>
                {cat}
              </Text>
              <View style={[s.chipBadge, active && cs && { backgroundColor: cs.text + '22' }]}>
                <Text style={[s.chipBadgeTxt, active && cs && { color: cs.text }]}>{count}</Text>
              </View>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );

  /* ── Categories banner (inside scroll area) ───────────────── */
  const FeaturedBanner = (!search && selectedCat === 'All') ? (
    <View style={s.featuredWrap}>
      <View style={s.featuredHeader}>
        <Text style={s.featuredTitle}>CATEGORIES</Text>
        <Text style={s.featuredSub}>{products.length} products available</Text>
      </View>
      <ScrollView
        horizontal showsHorizontalScrollIndicator={false}
        contentContainerStyle={s.featuredScroll}
      >
        {CATEGORIES.filter(c => c !== 'All').map((cat) => {
          const cs    = CAT[cat] || CAT.default;
          const count = catCount(cat);
          if (count === 0) return null;
          const active = selectedCat === cat;
          return (
            <TouchableOpacity
              key={cat}
              style={[s.featCard, { backgroundColor: active ? cs.text : cs.bg }]}
              onPress={() => setSelectedCat(active ? 'All' : cat)}
              activeOpacity={0.82}
            >
              <Text style={s.featIcon}>{cs.icon}</Text>
              <Text style={[s.featName, { color: active ? '#fff' : cs.text }]}>{cat}</Text>
              <View style={[s.featBadge, { backgroundColor: active ? 'rgba(255,255,255,0.25)' : cs.text + '18' }]}>
                <Text style={[s.featBadgeTxt, { color: active ? '#fff' : cs.text }]}>{count}</Text>
              </View>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  ) : null;

  /* ── Results row ──────────────────────────────────────────── */
  const ResultsRow = (
    <View style={s.resultsRow}>
      <Text style={s.resultsTxt}>
        {filtered.length} {filtered.length === 1 ? 'product' : 'products'}
        {selectedCat !== 'All' ? ` in ${selectedCat}` : ''}
        {search ? ` for "${search}"` : ''}
      </Text>
      {(search || selectedCat !== 'All') && (
        <TouchableOpacity onPress={() => { setSearch(''); setSelectedCat('All'); }}>
          <Text style={s.clearTxt}>Clear ✕</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  /* ── Loading / Empty states ───────────────────────────────── */
  if (loading) {
    return (
      <View style={s.root}>
        {!isWeb && <View style={s.mobileHeader}><View style={s.mobileHeaderInner}><Text style={s.nameTxt}>{user?.displayName || 'Customer'} 👋</Text></View></View>}
        {Toolbar}
        <View style={s.center}>
          <ActivityIndicator size="large" color={C.primary} />
          <Text style={s.loadTxt}>Loading products...</Text>
        </View>
      </View>
    );
  }

  /* ── WEB: overflowY:scroll — RN Web passthrough to native CSS scrollbar ── */
  if (isWeb) {
    return (
      <View style={s.root}>
        {Toolbar}
        {/* View with overflowY supported by react-native-web as CSS passthrough */}
        <View style={s.webCatalog}>
          {FeaturedBanner}
          {ResultsRow}
          {filtered.length === 0 ? (
            <View style={[s.center, { minHeight: 300 }]}>
              <Text style={{ fontSize: 56 }}>🔍</Text>
              <Text style={s.emptyTitle}>Koi product nahi mila</Text>
              <Text style={s.emptyTxt}>Search ya category change karein</Text>
              <TouchableOpacity style={s.resetBtn} onPress={() => { setSearch(''); setSelectedCat('All'); }}>
                <Text style={s.resetBtnTxt}>Reset</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={s.webGrid}>
              {filtered.map((item) => (
                <ProductCard
                  key={item.id}
                  item={item}
                  cardWidth={cardWidth}
                  onPress={() => navigation.navigate('ProductDetail', { product: item })}
                  onAdd={() => handleAdd(item)}
                />
              ))}
            </View>
          )}
          <View style={{ height: 60 }} />
        </View>
      </View>
    );
  }

  /* ── MOBILE: FlatList for virtualised performance ─────────── */
  return (
    <View style={s.root}>
      {/* Mobile blue header */}
      <View style={s.mobileHeader}>
        <View style={s.mobileHeaderInner}>
          <View>
            <Text style={s.greetTxt}>{timeGreeting()}</Text>
            <Text style={s.nameTxt}>{user?.displayName || 'Customer'} 👋</Text>
          </View>
          {isAdmin && (
            <TouchableOpacity style={s.adminBtn} onPress={() => navigation.navigate('Admin')}>
              <Text style={{ fontSize: 17 }}>⚙️</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {Toolbar}

      <View style={s.catalogArea}>
        {filtered.length === 0 ? (
          <View style={s.center}>
            <Text style={{ fontSize: 56 }}>🔍</Text>
            <Text style={s.emptyTitle}>Koi product nahi mila</Text>
            <TouchableOpacity style={s.resetBtn} onPress={() => { setSearch(''); setSelectedCat('All'); }}>
              <Text style={s.resetBtnTxt}>Reset</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <FlatList
            data={filtered}
            keyExtractor={(item) => item.id}
            numColumns={numCols}
            key={`grid-${numCols}`}
            renderItem={renderItem}
            style={s.list}
            ListHeaderComponent={
              <View>
                {FeaturedBanner}
                {ResultsRow}
              </View>
            }
            contentContainerStyle={{ paddingHorizontal: OUTER_PAD, paddingTop: 6, paddingBottom: 80 }}
            ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
            showsVerticalScrollIndicator
            removeClippedSubviews={false}
            maxToRenderPerBatch={15}
            windowSize={10}
          />
        )}
      </View>
    </View>
  );
}

/* ── Styles ──────────────────────────────────────────────────── */
const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#f0f4ff' },

  /* Mobile header */
  mobileHeader: { backgroundColor: C.primary, paddingTop: 52, paddingBottom: 0 },
  mobileHeaderInner: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 18, paddingBottom: 16 },
  greetTxt: { color: 'rgba(255,255,255,0.7)', fontSize: 12, fontWeight: '500' },
  nameTxt:  { color: '#fff', fontSize: 19, fontWeight: '800', marginTop: 2 },
  adminBtn: { backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 10, width: 38, height: 38, justifyContent: 'center', alignItems: 'center' },

  /* Sticky toolbar */
  toolbar: { backgroundColor: C.surface, borderBottomWidth: 1, borderBottomColor: C.border },

  webHeader:    { paddingHorizontal: 24, paddingTop: 18, paddingBottom: 12, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: C.border },
  webTitle:     { fontSize: 20, fontWeight: '800', color: C.text },
  webSub:       { fontSize: 13, color: C.textLight, marginTop: 2 },
  manageBtn:    { backgroundColor: C.primaryLight, borderRadius: 9, paddingHorizontal: 14, paddingVertical: 9, borderWidth: 1, borderColor: '#bfdbfe' },
  manageBtnTxt: { color: C.primary, fontSize: 13, fontWeight: '700' },

  searchWrap:  { paddingHorizontal: 12, paddingVertical: 10 },
  searchBox:   { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f8fafc', borderRadius: 14, borderWidth: 1.5, borderColor: C.border, paddingHorizontal: 14 },
  searchIcon:  { fontSize: 14, marginRight: 8 },
  searchInput: { flex: 1, paddingVertical: 12, fontSize: 14, color: C.text },

  catBar:      { maxHeight: 56 },
  catScroll:   { paddingHorizontal: 12, paddingVertical: 10, alignItems: 'center' },
  chip:        { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 7, borderRadius: 20, borderWidth: 1.5, borderColor: C.border, backgroundColor: C.surface, marginRight: 8 },
  chipBlue:    { backgroundColor: '#eff6ff', borderColor: C.primary },
  chipTxt:     { fontSize: 12, fontWeight: '500', color: C.textLight },
  chipBadge:   { backgroundColor: '#f1f5f9', borderRadius: 10, paddingHorizontal: 5, paddingVertical: 1, marginLeft: 5 },
  chipBadgeTxt:{ fontSize: 10, fontWeight: '700', color: C.textLight },

  /* Mobile catalog area */

  /* Web catalog — overflowY is a react-native-web extended CSS passthrough */
  webCatalog: {
    flex: 1,
    // react-native-web passes these through to CSS directly:
    overflowY: 'scroll',
    overflowX: 'hidden',
  },
  webGrid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 16, paddingTop: 8 },

  /* Mobile catalog area */
  catalogArea: { flex: 1, overflow: 'hidden' },
  list:        { flex: 1 },

  /* Featured banner */
  featuredWrap:   { paddingTop: 12, paddingBottom: 4 },
  featuredHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, marginBottom: 8 },
  featuredTitle:  { fontSize: 12, fontWeight: '800', color: C.textMid, textTransform: 'uppercase', letterSpacing: 0.8 },
  featuredSub:    { fontSize: 11, color: C.textLight },
  featuredScroll: { paddingHorizontal: 16, paddingBottom: 6 },

  featCard: { flexDirection: 'row', alignItems: 'center', borderRadius: 12, paddingHorizontal: 12, paddingVertical: 8, marginRight: 8, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 6, elevation: 2 },
  featIcon:     { fontSize: 18, marginRight: 6 },
  featName:     { fontSize: 12, fontWeight: '700', marginRight: 6 },
  featBadge:    { borderRadius: 8, paddingHorizontal: 6, paddingVertical: 1 },
  featBadgeTxt: { fontSize: 10, fontWeight: '700' },

  /* Results row */
  resultsRow:  { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingTop: 10, paddingBottom: 4 },
  resultsTxt:  { fontSize: 12, color: C.textLight, fontWeight: '600' },
  clearTxt:    { fontSize: 12, color: C.primary, fontWeight: '700' },

  /* Product card */
  card: {
    backgroundColor: C.surface, borderRadius: 16, marginHorizontal: 4, marginBottom: 8,
    overflow: 'hidden',
    shadowColor: '#1e3a8a', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 10, elevation: 4,
    ...(Platform.OS === 'web' ? { cursor: 'pointer' } : {}),
  },
  cardHovered: {
    shadowOpacity: 0.18, shadowRadius: 22, elevation: 10,
    ...(Platform.OS === 'web' ? { transform: [{ translateY: -4 }] } : {}),
  },
  imgWrap:       { width: '100%', justifyContent: 'center', alignItems: 'center', overflow: 'hidden' },
  cardImg:       { width: '100%', height: '100%', position: 'absolute' },
  catPill:       { position: 'absolute', top: 7, left: 7, paddingHorizontal: 7, paddingVertical: 3, borderRadius: 8, borderWidth: 1 },
  catPillTxt:    { fontSize: 9, fontWeight: '800' },
  oosDim:    { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  oosTag:    { backgroundColor: '#dc2626', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6 },
  oosTagTxt: { color: '#fff', fontSize: 10, fontWeight: '800' },

  body:    { padding: 10 },
  bodySm:  { padding: 8 },
  name:    { fontSize: 13, fontWeight: '700', color: C.text, lineHeight: 18, marginBottom: 3 },
  nameSm:  { fontSize: 11, lineHeight: 15, marginBottom: 2 },
  unit:    { fontSize: 11, color: C.textLight, fontWeight: '500', marginBottom: 8 },
  unitSm:  { fontSize: 9, marginBottom: 6 },
  footer:  { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  price:   { fontSize: 15, fontWeight: '800', color: C.primary },
  priceSm: { fontSize: 13, fontWeight: '800' },
  addBtn:     { backgroundColor: C.primary, borderRadius: 9, paddingHorizontal: 12, paddingVertical: 7, alignItems: 'center', minWidth: 60 },
  addBtnSm:   { minWidth: 30, width: 30, height: 30, paddingHorizontal: 0, paddingVertical: 0, borderRadius: 10, justifyContent: 'center' },
  addBtnOff:  { backgroundColor: '#e2e8f0' },
  addTxt:     { color: '#fff', fontSize: 11, fontWeight: '700' },
  addTxtSm:   { color: '#fff', fontSize: 18, fontWeight: '700', lineHeight: 20 },

  /* States */
  center:     { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32 },
  loadTxt:    { marginTop: 12, color: C.textLight, fontSize: 14 },
  emptyTitle: { fontSize: 20, fontWeight: '800', color: C.text, marginTop: 16 },
  emptyTxt:   { fontSize: 14, color: C.textLight, marginTop: 6, marginBottom: 24, textAlign: 'center' },
  resetBtn:   { backgroundColor: C.primary, borderRadius: 10, paddingHorizontal: 28, paddingVertical: 12 },
  resetBtnTxt:{ color: '#fff', fontWeight: '700', fontSize: 14 },
});
