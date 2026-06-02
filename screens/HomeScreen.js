import React, { useState, useEffect, useCallback, useMemo } from 'react';
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

const CATEGORIES = ['All', 'Cold Drinks', 'Masala', 'Pickles', 'Pasta', 'Grocery', 'Snacks', 'Household', 'Bricks'];

function timeGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good Morning ☀️';
  if (h < 17) return 'Good Afternoon 🌤️';
  return 'Good Evening 🌙';
}

/* ─────────────────────────────────────────────────────────── */
/*  Variant Card                                               */
/* ─────────────────────────────────────────────────────────── */
function VariantCard({ item, onAdd, onPress, cardW, imgH }) {
  const cat = CAT[item.category] || CAT.default;
  const inStock = item.inStock !== false;

  // Three tiers based on card width
  const tier = cardW >= 220 ? 'lg' : cardW >= 140 ? 'md' : 'sm';

  const fontSize    = tier === 'lg' ? 14 : tier === 'md' ? 12 : 10;
  const priceSize   = tier === 'lg' ? 18 : tier === 'md' ? 15 : 13;
  const btnPadV     = tier === 'lg' ? 9  : tier === 'md' ? 7  : 6;
  const btnFontSize = tier === 'lg' ? 13 : tier === 'md' ? 12 : 11;
  const bodyPad     = tier === 'lg' ? 12 : tier === 'md' ? 9  : 7;
  const emojiSize   = tier === 'lg' ? 52 : tier === 'md' ? 38 : 30;
  const btnLabel    = tier === 'lg' ? '＋  Add to Cart' : '＋ Add';

  return (
    <Pressable
      style={({ pressed, hovered }) => [
        vs.card,
        { width: cardW },
        hovered && vs.cardHovered,
        pressed && { opacity: 0.88 },
        !inStock && vs.cardOos,
      ]}
      onPress={onPress}
    >
      {/* Image */}
      <View style={[vs.imgWrap, { height: imgH, backgroundColor: cat.bg }]}>
        {item.imageUrl
          ? <Image source={{ uri: item.imageUrl }} style={vs.img} resizeMode="contain" />
          : <Text style={{ fontSize: emojiSize }}>{cat.icon}</Text>
        }
        {!inStock && (
          <View style={vs.oosDim}>
            <View style={vs.oosTag}><Text style={vs.oosTagTxt}>Out of Stock</Text></View>
          </View>
        )}
      </View>

      {/* Info */}
      <View style={{ padding: bodyPad, alignItems: 'center' }}>
        <Text style={[vs.unit, { fontSize }]} numberOfLines={2}>{item.unit || 'piece'}</Text>
        <Text style={[vs.price, { fontSize: priceSize }]}>Rs.{item.price?.toLocaleString()}</Text>
        <TouchableOpacity
          style={[vs.btn, !inStock && vs.btnOff, { paddingVertical: btnPadV }]}
          onPress={e => { e?.stopPropagation?.(); onAdd(); }}
          disabled={!inStock}
          activeOpacity={0.82}
        >
          <Text style={[vs.btnTxt, !inStock && vs.btnTxtOff, { fontSize: btnFontSize }]}>
            {inStock ? btnLabel : 'Unavailable'}
          </Text>
        </TouchableOpacity>
      </View>
    </Pressable>
  );
}

/* ─────────────────────────────────────────────────────────── */
/*  Product Group                                              */
/* ─────────────────────────────────────────────────────────── */
function ProductGroup({ group, navigation, onAdd, switchTab, cardW, imgH }) {
  const cat = CAT[group.category] || CAT.default;
  const prices = group.variants.map(v => v.price);
  const lo = Math.min(...prices);
  const hi = Math.max(...prices);
  const priceRange = lo === hi
    ? `Rs.${lo.toLocaleString()}`
    : `Rs.${lo.toLocaleString()} – Rs.${hi.toLocaleString()}`;

  return (
    <View style={gs.row}>
      <View style={gs.header}>
        <View style={[gs.catBox, { backgroundColor: cat.bg }]}>
          <Text style={{ fontSize: 16 }}>{cat.icon}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={gs.name}>{group.name}</Text>
          <Text style={gs.range}>{priceRange}</Text>
        </View>
        {group.variants.length > 1 && (
          <View style={[gs.badge, { backgroundColor: cat.bg }]}>
            <Text style={[gs.badgeTxt, { color: cat.text }]}>{group.variants.length} sizes</Text>
          </View>
        )}
      </View>

      <View style={gs.grid}>
        {group.variants.map(variant => (
          <VariantCard
            key={variant.id}
            item={variant}
            cardW={cardW}
            imgH={imgH}
            onAdd={() => onAdd(variant)}
            onPress={() => navigation.navigate('ProductDetail', { product: variant, switchTab })}
          />
        ))}
      </View>
    </View>
  );
}

/* ─────────────────────────────────────────────────────────── */
/*  Home Screen                                                */
/* ─────────────────────────────────────────────────────────── */
export default function HomeScreen({ navigation, switchTab }) {
  const [products, setProducts]     = useState([]);
  const [search, setSearch]         = useState('');
  const [selectedCat, setSelectedCat] = useState('All');
  const [sortBy, setSortBy]         = useState('default');
  const [loading, setLoading]       = useState(true);

  const { addToCart }     = useCart();
  const { user, isAdmin } = useAuth();
  const { width }         = useWindowDimensions();
  const isWeb             = Platform.OS === 'web';

  /* ── Breakpoints ──
     Mobile  (< 768):       no sidebar, 3 cols
     Tablet  (768-1199):    sidebar 240, 4 cols
     Desktop (≥ 1200):      sidebar 240, 3 cols
  ── */
  const isMobileWeb  = isWeb && width < 768;
  const isTabletWeb  = isWeb && width >= 768 && width < 1200;
  const isDesktopWeb = isWeb && width >= 1200;
  const hasSidebar   = isWeb && width >= 768;
  const SIDEBAR_W    = hasSidebar ? 240 : 0;

  // 2 cols on mobile (< 480 native or < 768 web), 3 everywhere else
  const isNarrow = isMobileWeb || (!isWeb && width < 500);
  const COLS     = isNarrow ? 2 : 3;
  // GROUP_MX must match gs.row: Platform.OS==='web' → marginHorizontal:16
  const GROUP_MX = isWeb ? 16 : 12;
  // GRID_PX must match gs.grid: paddingHorizontal: 8
  const GRID_PX  = 8;
  const CARD_GAP = 6;

  // ── Card width: exactly COLS per row, no overflow, full width used ──
  // hasSidebar screens show a 10px scrollbar inside webCatalog — subtract it
  const SCROLLBAR_W = hasSidebar ? 14 : 0;
  const contentW    = width - SIDEBAR_W - SCROLLBAR_W;
  const containerW  = contentW - GROUP_MX * 2 - GRID_PX * 2;
  const cardW = Math.floor(containerW / COLS) - CARD_GAP;

  // imgH proportional, capped at 280px
  const imgH = cardW < 120 ? 88 : Math.min(Math.round(cardW * 0.62), 280);

  useEffect(() => {
    if (IS_DEMO) { setProducts(DEMO_PRODUCTS); setLoading(false); return; }
    const q = query(collection(db, 'products'), orderBy('createdAt', 'desc'));
    const unsub = onSnapshot(q, snap => {
      setProducts(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      setLoading(false);
    });
    return unsub;
  }, []);

  const handleAdd = useCallback((item) => {
    if (item.inStock === false) return;
    addToCart(item);
  }, [addToCart]);

  const catCount = (cat) =>
    cat === 'All' ? products.length : products.filter(p => p.category === cat).length;

  /* Group + sort ASC (345ml → 2.25L) */
  const groups = useMemo(() => {
    const filtered = products.filter(p =>
      p.name.toLowerCase().includes(search.toLowerCase()) &&
      (selectedCat === 'All' || p.category === selectedCat)
    );
    const map = new Map();
    filtered.forEach(p => {
      const key = `${p.category}__${p.name}`;
      if (!map.has(key)) map.set(key, { id: key, name: p.name, category: p.category, variants: [] });
      map.get(key).variants.push(p);
    });
    map.forEach(g => g.variants.sort((a, b) => a.price - b.price));
    const arr = Array.from(map.values());
    if (sortBy === 'price_asc')  arr.sort((a, b) => a.variants[0].price - b.variants[0].price);
    if (sortBy === 'price_desc') arr.sort((a, b) => b.variants[b.variants.length - 1].price - a.variants[a.variants.length - 1].price);
    if (sortBy === 'name')       arr.sort((a, b) => a.name.localeCompare(b.name));
    return arr;
  }, [products, search, selectedCat, sortBy]);

  /* ── Toolbar (search + category chips) ── */
  function Toolbar() {
    return (
      <View style={s.toolbar}>
        {/* Desktop top bar */}
        {(isDesktopWeb || isTabletWeb) && (
          <View style={s.desktopTopBar}>
            <View>
              <Text style={s.desktopTitle}>🛒  Dawood Trader</Text>
              <Text style={s.desktopSub}>
                {timeGreeting()}, {user?.displayName || 'Customer'} · {products.length} products
              </Text>
            </View>
            {isAdmin && (
              <TouchableOpacity style={s.manageBtn} onPress={() => navigation.navigate('Admin')}>
                <Text style={s.manageBtnTxt}>⚙️  Manage Products</Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* Mobile greeting (WebLayout already shows logo above) */}
        {isMobileWeb && (
          <View style={s.mobileGreetBar}>
            <Text style={s.mobileGreetTxt}>
              {timeGreeting()}, {user?.displayName || 'Customer'} 👋
            </Text>
            <Text style={s.mobileProductCount}>{products.length} products</Text>
          </View>
        )}

        {/* Search */}
        <View style={[s.searchWrap, (isDesktopWeb || isTabletWeb) && { paddingHorizontal: 24 }]}>
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
        <View style={[s.catWrap, (isDesktopWeb || isTabletWeb) && { paddingHorizontal: 20 }]}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.catRow}>
            {CATEGORIES.map(cat => {
              const active = selectedCat === cat;
              const cs     = cat !== 'All' ? CAT[cat] : null;
              const count  = catCount(cat);
              if (count === 0 && cat !== 'All') return null;
              return (
                <TouchableOpacity
                  key={cat}
                  style={[s.chip, active && (cs ? { backgroundColor: cs.bg, borderColor: cs.text + '55' } : s.chipActive)]}
                  onPress={() => setSelectedCat(cat)}
                >
                  {cs && <Text style={{ fontSize: 11, marginRight: 3 }}>{cs.icon}</Text>}
                  <Text style={[s.chipTxt, active && (cs ? { color: cs.text, fontWeight: '700' } : s.chipTxtActive)]}>
                    {cat}
                  </Text>
                  <View style={[s.chipNum, active && cs && { backgroundColor: cs.text + '22' }]}>
                    <Text style={[s.chipNumTxt, active && cs && { color: cs.text }]}>{count}</Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* Sort row */}
        <View style={[s.sortWrap, (isDesktopWeb || isTabletWeb) && { paddingHorizontal: 20 }]}>
          <Text style={s.sortLabel}>Sort:</Text>
          {[
            { key: 'default',    label: '🕐 Newest' },
            { key: 'price_asc',  label: '↑ Price'  },
            { key: 'price_desc', label: '↓ Price'  },
            { key: 'name',       label: '🔤 Name'   },
          ].map(opt => (
            <TouchableOpacity
              key={opt.key}
              style={[s.sortChip, sortBy === opt.key && s.sortChipActive]}
              onPress={() => setSortBy(opt.key)}
            >
              <Text style={[s.sortChipTxt, sortBy === opt.key && s.sortChipTxtActive]}>
                {opt.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    );
  }

  const ResultsRow = (
    <View style={s.resultsRow}>
      <Text style={s.resultsTxt}>
        {groups.length} {groups.length === 1 ? 'product' : 'products'}
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

  const EmptyComp = (
    <View style={s.center}>
      <Text style={{ fontSize: 52 }}>🔍</Text>
      <Text style={s.emptyTitle}>Koi product nahi mila</Text>
      <Text style={s.emptyTxt}>Search ya category change karein</Text>
      <TouchableOpacity style={s.resetBtn} onPress={() => { setSearch(''); setSelectedCat('All'); }}>
        <Text style={s.resetBtnTxt}>Reset</Text>
      </TouchableOpacity>
    </View>
  );

  if (loading) {
    return (
      <View style={s.root}>
        <Toolbar />
        <View style={s.center}>
          <ActivityIndicator size="large" color={C.primary} />
          <Text style={s.loadTxt}>Loading products...</Text>
        </View>
      </View>
    );
  }

  const groupProps = { navigation, onAdd: handleAdd, switchTab, cardW, imgH };

  /* ── WEB ── */
  if (isWeb) {
    return (
      <View style={s.root}>
        <Toolbar />
        <View style={s.webCatalog}>
          {ResultsRow}
          {groups.length === 0
            ? EmptyComp
            : groups.map(g => <ProductGroup key={g.id} group={g} {...groupProps} />)
          }
          <View style={{ height: 40 }} />
        </View>
      </View>
    );
  }

  /* ── NATIVE MOBILE ── */
  return (
    <View style={s.root}>
      <Toolbar />
      <View style={s.catalogArea}>
        <FlatList
          data={groups}
          keyExtractor={g => g.id}
          renderItem={({ item: g }) => <ProductGroup group={g} {...groupProps} />}
          ListHeaderComponent={ResultsRow}
          ListEmptyComponent={EmptyComp}
          contentContainerStyle={{ paddingBottom: 40, paddingTop: 4 }}
          showsVerticalScrollIndicator
          removeClippedSubviews={false}
          maxToRenderPerBatch={10}
          windowSize={8}
        />
      </View>
    </View>
  );
}

/* ═══════════════════════════════════════════════════════════ */
const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#eef2f9' },

  /* ── Toolbar ── */
  toolbar: { backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#e4eaf5' },

  desktopTopBar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 24, paddingTop: 16, paddingBottom: 12,
    borderBottomWidth: 1, borderBottomColor: '#f0f4fb',
  },
  desktopTitle: { fontSize: 18, fontWeight: '800', color: C.text },
  desktopSub:   { fontSize: 12, color: C.textLight, marginTop: 2 },
  manageBtn:    { backgroundColor: '#eff6ff', borderRadius: 8, paddingHorizontal: 14, paddingVertical: 8, borderWidth: 1, borderColor: '#bfdbfe' },
  manageBtnTxt: { color: C.primary, fontSize: 12, fontWeight: '700' },

  mobileGreetBar: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 14, paddingTop: 10, paddingBottom: 2,
  },
  mobileGreetTxt:      { fontSize: 13, fontWeight: '600', color: C.text },
  mobileProductCount:  { fontSize: 11, color: C.textLight, fontWeight: '500' },

  searchWrap:  { paddingHorizontal: 12, paddingTop: 8, paddingBottom: 4 },
  searchBox:   { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f4f7fc', borderRadius: 12, borderWidth: 1.5, borderColor: '#e2e8f0', paddingHorizontal: 14 },
  searchIcon:  { fontSize: 14, marginRight: 8 },
  searchInput: { flex: 1, paddingVertical: 10, fontSize: 14, color: C.text },

  catWrap: { paddingHorizontal: 12, paddingTop: 6, paddingBottom: 4 },
  catRow:  { flexDirection: 'row', paddingHorizontal: 2, gap: 5 },

  sortWrap:        { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingTop: 4, paddingBottom: 8 },
  sortLabel:       { fontSize: 11, fontWeight: '700', color: '#94a3b8', marginRight: 6 },
  sortChip:        { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 14, borderWidth: 1, borderColor: '#e2e8f0', backgroundColor: '#fff', marginRight: 5 },
  sortChipActive:  { backgroundColor: '#0f172a', borderColor: '#0f172a' },
  sortChipTxt:     { fontSize: 10, fontWeight: '600', color: '#64748b' },
  sortChipTxtActive: { color: '#fff' },
  chip:         { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 18, borderWidth: 1.5, borderColor: '#e2e8f0', backgroundColor: '#fff' },
  chipActive:   { backgroundColor: '#eff6ff', borderColor: C.primary },
  chipTxt:      { fontSize: 11, fontWeight: '500', color: '#94a3b8' },
  chipTxtActive:{ color: C.primary, fontWeight: '700' },
  chipNum:      { backgroundColor: '#f1f5f9', borderRadius: 8, paddingHorizontal: 5, paddingVertical: 1, marginLeft: 4 },
  chipNumTxt:   { fontSize: 9, fontWeight: '700', color: '#94a3b8' },

  /* ── Catalog areas ── */
  webCatalog:  { flex: 1, minHeight: 0, overflowY: 'scroll', overflowX: 'hidden' },
  catalogArea: { flex: 1, overflow: 'hidden' },

  /* ── Results row ── */
  resultsRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingTop: 10, paddingBottom: 4 },
  resultsTxt: { fontSize: 12, color: C.textLight, fontWeight: '600' },
  clearTxt:   { fontSize: 12, color: C.primary, fontWeight: '700' },

  /* ── States ── */
  center:     { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32, minHeight: 300 },
  loadTxt:    { marginTop: 12, color: C.textLight, fontSize: 14 },
  emptyTitle: { fontSize: 20, fontWeight: '800', color: C.text, marginTop: 16 },
  emptyTxt:   { fontSize: 14, color: C.textLight, marginTop: 6, marginBottom: 24, textAlign: 'center' },
  resetBtn:   { backgroundColor: C.primary, borderRadius: 10, paddingHorizontal: 28, paddingVertical: 12 },
  resetBtnTxt:{ color: '#fff', fontWeight: '700', fontSize: 14 },
});

/* ── Product group ── */
const gs = StyleSheet.create({
  row: {
    backgroundColor: '#fff',
    marginHorizontal: 12,
    marginTop: 10,
    borderRadius: 16,
    paddingTop: 14,
    paddingBottom: 10,
    shadowColor: '#3b5aad',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 8,
    elevation: 3,
    ...(Platform.OS === 'web' ? { marginHorizontal: 16 } : {}),
  },
  header: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 14, paddingBottom: 10,
    marginBottom: 2, borderBottomWidth: 1, borderBottomColor: '#f0f4fb',
  },
  catBox:   { width: 32, height: 32, borderRadius: 9, justifyContent: 'center', alignItems: 'center', marginRight: 10 },
  name:     { fontSize: 14, fontWeight: '800', color: C.text, marginBottom: 1 },
  range:    { fontSize: 11, color: C.textLight, fontWeight: '500' },
  badge:    { borderRadius: 8, paddingHorizontal: 9, paddingVertical: 3 },
  badgeTxt: { fontSize: 10, fontWeight: '700' },
  grid:     { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 8, paddingTop: 8, paddingBottom: 4 },
});

/* ── Variant card ── */
const vs = StyleSheet.create({
  card: {
    borderRadius: 13,
    backgroundColor: '#f7f9ff',
    marginRight: 6,
    marginBottom: 6,
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: '#e4eaf5',
    ...(Platform.OS === 'web' ? { cursor: 'pointer' } : {}),
  },
  cardHovered: {
    borderColor: C.primary,
    shadowColor: C.primary,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.16,
    shadowRadius: 10,
    elevation: 5,
    transform: [{ translateY: -2 }],
  },
  cardOos:  { opacity: 0.55 },
  imgWrap:  { width: '100%', justifyContent: 'center', alignItems: 'center', overflow: 'hidden' },
  img:      { width: '100%', height: '100%', position: 'absolute' },
  oosDim:   { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.38)', justifyContent: 'center', alignItems: 'center' },
  oosTag:   { backgroundColor: '#dc2626', paddingHorizontal: 7, paddingVertical: 3, borderRadius: 5 },
  oosTagTxt:{ color: '#fff', fontSize: 8, fontWeight: '800' },

  unit:     { fontWeight: '600', color: '#475569', textAlign: 'center', marginBottom: 4 },
  price:    { fontWeight: '800', color: C.primary, marginBottom: 8 },

  btn:      { backgroundColor: C.primary, borderRadius: 8, paddingHorizontal: 10, alignItems: 'center', width: '100%' },
  btnOff:   { backgroundColor: '#e2e8f0' },
  btnTxt:   { color: '#fff', fontWeight: '700' },
  btnTxtOff:{ color: '#94a3b8' },
});
