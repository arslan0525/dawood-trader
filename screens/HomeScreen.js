import React, { useState, useCallback, useMemo, memo } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  Image, ActivityIndicator, FlatList, Pressable, ScrollView,
  Platform, useWindowDimensions, Alert,
} from 'react-native';
import { deleteDoc, doc, updateDoc } from 'firebase/firestore';
import { ref, deleteObject, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage, IS_DEMO } from '../services/firebase';
import * as ImagePicker from 'expo-image-picker';
import { manipulateAsync, SaveFormat } from 'expo-image-manipulator';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { useAppData } from '../context/AppDataContext';
import ThreeDotMenu from '../components/ThreeDotMenu';
import { C, CAT } from '../constants/theme';

const CATEGORIES = ['All', 'Cold Drinks', 'Masala', 'Pickles', 'Pasta', 'Grocery', 'Snacks', 'Household', 'Bricks'];
const CAT_ORDER  = ['Cold Drinks', 'Masala', 'Pickles', 'Pasta', 'Grocery', 'Snacks', 'Household', 'Bricks'];

function timeGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good Morning ☀️';
  if (h < 17) return 'Good Afternoon 🌤️';
  return 'Good Evening 🌙';
}

/* ─────────────────────────────────────────────────────────── */
/*  Variant Card                                               */
/* ─────────────────────────────────────────────────────────── */
const VariantCard = memo(function VariantCard({ item, onAdd, onPress, cardW, imgH, isAdmin, onEdit, onDelete, onPriceEdit, onImageEdit }) {
  const cat = CAT[item.category] || CAT.default;
  const inStock = item.inStock !== false;
  const [editingPrice, setEditingPrice] = useState(false);
  const [priceVal, setPriceVal]         = useState('');

  const startEdit = () => { setPriceVal(String(item.price || '')); setEditingPrice(true); };
  const cancelEdit = () => setEditingPrice(false);
  const savePrice = () => {
    const n = Number(priceVal);
    if (n > 0) onPriceEdit(item, n);
    setEditingPrice(false);
  };

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
      {/* Image — tap to change photo */}
      <TouchableOpacity
        style={[vs.imgWrap, { height: imgH, backgroundColor: cat.bg }]}
        onPress={e => { e?.stopPropagation?.(); onImageEdit(item); }}
        activeOpacity={0.88}
      >
        {item.imageUrl
          ? <Image source={{ uri: item.imageUrl }} style={vs.img} resizeMode="contain" />
          : <Text style={{ fontSize: emojiSize }}>{cat.icon}</Text>
        }
        {/* 📷 Edit badge — always visible like ✏️ on price */}
        <View style={vs.imgEditOverlay}>
          <View style={vs.imgEditBadge}>
            <Text style={vs.imgEditBadgeTxt}>📷 Edit</Text>
          </View>
        </View>
        {!inStock && (
          <View style={vs.oosDim}>
            <View style={vs.oosTag}><Text style={vs.oosTagTxt}>Out of Stock</Text></View>
          </View>
        )}
        {/* Admin quick-actions overlay */}
        {isAdmin && (
          <View style={vs.adminMenu}>
            <ThreeDotMenu
              size="sm"
              title={item.name}
              options={[
                { icon: '✏️', label: 'Edit Product',   onPress: () => onEdit(item) },
                { icon: '🗑️', label: 'Delete Product', onPress: () => onDelete(item), danger: true },
              ]}
            />
          </View>
        )}
      </TouchableOpacity>

      {/* Info */}
      <View style={{ padding: bodyPad, alignItems: 'center' }}>
        <Text style={[vs.unit, { fontSize }]} numberOfLines={2}>{item.unit || 'piece'}</Text>

        {editingPrice ? (
          <View style={vs.priceEditRow}>
            <TextInput
              style={[vs.priceEditInput, { fontSize: priceSize }]}
              value={priceVal}
              onChangeText={setPriceVal}
              keyboardType="numeric"
              autoFocus
              selectTextOnFocus
              onSubmitEditing={savePrice}
            />
            <TouchableOpacity onPress={savePrice} style={vs.priceSaveBtn}>
              <Text style={vs.priceSaveTxt}>✓</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={cancelEdit} style={vs.priceCancelBtn}>
              <Text style={vs.priceCancelTxt}>✕</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity onPress={startEdit} style={vs.priceEditableRow}>
            <Text style={[vs.price, { fontSize: priceSize }]}>Rs.{item.price?.toLocaleString()}</Text>
            <Text style={vs.priceEditIcon}>✏️</Text>
          </TouchableOpacity>
        )}
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
});

/* ─────────────────────────────────────────────────────────── */
/*  Product Group                                              */
/* ─────────────────────────────────────────────────────────── */
const ProductGroup = memo(function ProductGroup({ group, navigation, onAdd, switchTab, cardW, imgH, isAdmin, onEdit, onDelete, onPriceEdit, onImageEdit }) {
  const cat = CAT[group.category] || CAT.default;
  const prices = group.variants.map(v => v.price).filter(p => typeof p === 'number');
  const lo = prices.length ? Math.min(...prices) : 0;
  const hi = prices.length ? Math.max(...prices) : 0;
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
            isAdmin={isAdmin}
            onEdit={onEdit}
            onDelete={onDelete}
            onPriceEdit={onPriceEdit}
            onImageEdit={onImageEdit}
          />
        ))}
      </View>
    </View>
  );
});

/* ─────────────────────────────────────────────────────────── */
/*  Home Screen                                                */
/* ─────────────────────────────────────────────────────────── */
export default function HomeScreen({ navigation, switchTab }) {
  const [search, setSearch]           = useState('');
  const [selectedCat, setSelectedCat] = useState('All');
  const [sortBy, setSortBy]           = useState('default');

  const { products, loading, removeProduct, updateProductDemo } = useAppData();
  const { addToCart }     = useCart();
  const { user, isAdmin } = useAuth();
  const { showToast }     = useToast();
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

  const handleAdd = useCallback((item) => {
    if (item.inStock === false) return;
    addToCart(item);
  }, [addToCart]);

  const handleImageEdit = useCallback(async (item) => {
    const pick = async (useCamera) => {
      if (useCamera) {
        const { status } = await ImagePicker.requestCameraPermissionsAsync();
        if (status !== 'granted') { Alert.alert('Permission chahiye', 'Camera allow karein'); return; }
      } else {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') { Alert.alert('Permission chahiye', 'Gallery allow karein'); return; }
      }
      const result = useCamera
        ? await ImagePicker.launchCameraAsync({ allowsEditing: Platform.OS !== 'web', aspect: [4,3], quality: 0.9 })
        : await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, allowsEditing: Platform.OS !== 'web', aspect: [4,3], quality: 0.9 });
      if (result.canceled) return;
      const compressed = await manipulateAsync(result.assets[0].uri, [{ resize: { width: 600 } }], { compress: 0.65, format: SaveFormat.JPEG });
      const uri = compressed.uri;
      // Convert to base64 for both demo and Firebase (no Storage plan needed)
      const base64 = await new Promise((resolve, reject) => {
        if (Platform.OS === 'web') {
          fetch(uri).then(r => r.blob()).then(blob => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result);
            reader.onerror = reject;
            reader.readAsDataURL(blob);
          }).catch(reject);
        } else {
          const FileSystem = require('expo-file-system');
          FileSystem.readAsStringAsync(uri, { encoding: FileSystem.EncodingType.Base64 })
            .then(b64 => resolve(`data:image/jpeg;base64,${b64}`))
            .catch(() => resolve(uri));
        }
      });
      if (IS_DEMO) {
        updateProductDemo(item.id, { ...item, imageUrl: base64, imageUrls: [base64] });
        showToast('Photo update ho gaya!', 'success');
        return;
      }
      try {
        await updateDoc(doc(db, 'products', item.id), { imageUrl: base64, imageUrls: [base64] });
        showToast('Photo update ho gaya!', 'success');
      } catch { showToast('Photo save nahi ho saka', 'error'); }
    };

    if (Platform.OS === 'web') {
      pick(false);
    } else {
      Alert.alert('Photo kahan se?', item.name, [
        { text: '📷 Camera', onPress: () => pick(true) },
        { text: '🖼️ Gallery', onPress: () => pick(false) },
        { text: 'Cancel', style: 'cancel' },
      ]);
    }
  }, [updateProductDemo, showToast]);

  const handlePriceEdit = useCallback(async (item, newPrice) => {
    if (IS_DEMO) {
      updateProductDemo(item.id, { ...item, price: newPrice });
      showToast(`Price update: Rs.${newPrice.toLocaleString()}`, 'success');
      return;
    }
    try {
      await updateDoc(doc(db, 'products', item.id), { price: newPrice });
      showToast(`Price update: Rs.${newPrice.toLocaleString()}`, 'success');
    } catch { showToast('Price save nahi ho saka', 'error'); }
  }, [updateProductDemo, showToast]);

  const handleEdit = useCallback((item) => {
    if (switchTab) switchTab('AddProduct', item);
    else navigation.navigate('AddItem', { product: item });
  }, [switchTab, navigation]);

  const handleDelete = useCallback((item) => {
    const doDelete = async () => {
      if (IS_DEMO) {
        removeProduct(item.id);
        showToast(`"${item.name}" deleted`, 'success');
        return;
      }
      try {
        await deleteDoc(doc(db, 'products', item.id));
        const paths = item.imagePaths?.length ? item.imagePaths : (item.imagePath ? [item.imagePath] : []);
        for (const p of paths) await deleteObject(ref(storage, p)).catch(() => {});
        showToast(`"${item.name}" deleted`, 'success');
      } catch { showToast('Delete nahi ho saka', 'error'); }
    };
    if (Platform.OS === 'web') {
      if (window.confirm(`"${item.name}" permanently delete karein?`)) doDelete();
    } else {
      Alert.alert('Delete?', `"${item.name}" permanently delete ho jaega`, [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: doDelete },
      ]);
    }
  }, [showToast, removeProduct]);

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
    if (sortBy === 'default') {
      arr.sort((a, b) => {
        const ci = (CAT_ORDER.indexOf(a.category) + 1 || 99) - (CAT_ORDER.indexOf(b.category) + 1 || 99);
        if (ci !== 0) return ci;
        // OG brand pehle Cold Drinks mein
        const aOG = a.name.startsWith('OG') ? 0 : 1;
        const bOG = b.name.startsWith('OG') ? 0 : 1;
        if (aOG !== bOG) return aOG - bOG;
        return a.name.localeCompare(b.name);
      });
    }
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
              <View style={{ flexDirection: 'row', gap: 8 }}>
                <TouchableOpacity style={s.addBtn} onPress={() => switchTab ? switchTab('AddProduct', null) : navigation.navigate('AddItem', { product: null })}>
                  <Text style={s.addBtnTxt}>＋ Add Product</Text>
                </TouchableOpacity>
                <TouchableOpacity style={s.manageBtn} onPress={() => switchTab ? switchTab('Inventory') : navigation.navigate('Admin')}>
                  <Text style={s.manageBtnTxt}>⚙️  Inventory</Text>
                </TouchableOpacity>
              </View>
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
          <ScrollView horizontal showsHorizontalScrollIndicator={false} nestedScrollEnabled style={{ flexShrink: 0 }} contentContainerStyle={s.catRow}>
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
      <Text style={{ fontSize: 52 }}>{isAdmin ? '📦' : '🔍'}</Text>
      <Text style={s.emptyTitle}>{isAdmin && !search && selectedCat === 'All' ? 'Koi product nahi hai' : 'Koi product nahi mila'}</Text>
      <Text style={s.emptyTxt}>{isAdmin && !search && selectedCat === 'All' ? 'Pehla product add karein' : 'Search ya category change karein'}</Text>
      {isAdmin && !search && selectedCat === 'All' ? (
        <TouchableOpacity
          style={s.resetBtn}
          onPress={() => switchTab ? switchTab('AddProduct', null) : navigation.navigate('AddItem', { product: null })}
        >
          <Text style={s.resetBtnTxt}>＋ Add New Product</Text>
        </TouchableOpacity>
      ) : (
        <TouchableOpacity style={s.resetBtn} onPress={() => { setSearch(''); setSelectedCat('All'); }}>
          <Text style={s.resetBtnTxt}>Reset</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  if (loading) {
    return (
      <View style={s.root}>
        {Toolbar()}
        <View style={s.center}>
          <ActivityIndicator size="large" color={C.primary} />
          <Text style={s.loadTxt}>Loading products...</Text>
        </View>
      </View>
    );
  }

  const groupProps = { navigation, onAdd: handleAdd, switchTab, cardW, imgH, isAdmin, onEdit: handleEdit, onDelete: handleDelete, onPriceEdit: handlePriceEdit, onImageEdit: handleImageEdit };

  /* ── WEB ── */
  if (isWeb) {
    return (
      <View style={s.root}>
        {Toolbar()}
        <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', overflowX: 'hidden', scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
          {ResultsRow}
          {groups.length === 0
            ? EmptyComp
            : groups.map(g => <ProductGroup key={g.id} group={g} {...groupProps} />)
          }
          <div style={{ height: 80 }} />
        </div>
        {isAdmin && (
          <TouchableOpacity
            style={s.fab}
            onPress={() => switchTab ? switchTab('AddProduct', null) : navigation.navigate('AddItem', { product: null })}
            activeOpacity={0.85}
          >
            <Text style={s.fabIcon}>＋</Text>
            <Text style={s.fabLabel}>Add Item</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  }

  /* ── NATIVE MOBILE ── */
  return (
    <View style={s.root}>
      {Toolbar()}
      <View style={s.catalogArea}>
        <FlatList
          style={{ flex: 1 }}
          data={groups}
          keyExtractor={g => g.id}
          renderItem={({ item: g }) => <ProductGroup group={g} {...groupProps} />}
          ListHeaderComponent={ResultsRow}
          ListEmptyComponent={EmptyComp}
          contentContainerStyle={{ paddingBottom: 100, paddingTop: 4 }}
          showsVerticalScrollIndicator
          removeClippedSubviews
          initialNumToRender={6}
          maxToRenderPerBatch={8}
          windowSize={5}
          updateCellsBatchingPeriod={50}
        />
      </View>
      {isAdmin && (
        <TouchableOpacity
          style={s.fab}
          onPress={() => switchTab ? switchTab('AddProduct', null) : navigation.navigate('AddItem', { product: null })}
          activeOpacity={0.85}
        >
          <Text style={s.fabIcon}>＋</Text>
          <Text style={s.fabLabel}>Add Item</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

/* ═══════════════════════════════════════════════════════════ */
const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#eef2f9' },

  /* ── Toolbar ── */
  toolbar: {
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e4eaf5',
    paddingTop: Platform.OS === 'ios' ? 50 : Platform.OS === 'android' ? 28 : 0,
  },

  desktopTopBar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 24, paddingTop: 16, paddingBottom: 12,
    borderBottomWidth: 1, borderBottomColor: '#f0f4fb',
  },
  desktopTitle: { fontSize: 18, fontWeight: '800', color: C.text },
  desktopSub:   { fontSize: 12, color: C.textLight, marginTop: 2 },
  addBtn:       { backgroundColor: C.primary, borderRadius: 8, paddingHorizontal: 14, paddingVertical: 8 },
  addBtnTxt:    { color: '#fff', fontSize: 12, fontWeight: '700' },

  /* Floating Add Button */
  fab: {
    position: 'absolute',
    bottom: Platform.OS === 'web' ? 24 : 90,
    right: 20,
    backgroundColor: C.primary,
    borderRadius: 30,
    paddingHorizontal: 20,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    shadowColor: C.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
    zIndex: 999,
  },
  fabIcon:  { color: '#fff', fontSize: 20, fontWeight: '800', lineHeight: 22 },
  fabLabel: { color: '#fff', fontSize: 14, fontWeight: '700' },
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
  catalogArea: { flex: 1 },

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
  adminMenu:      { position: 'absolute', top: 4, right: 4, zIndex: 10 },
  imgEditOverlay: { position: 'absolute', bottom: 0, left: 0, right: 0, alignItems: 'center', paddingBottom: 6, zIndex: 5 },
  imgEditBadge:   { backgroundColor: 'rgba(0,0,0,0.52)', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 },
  imgEditBadgeTxt:{ color: '#fff', fontSize: 10, fontWeight: '700' },
  imgWrap:  { width: '100%', justifyContent: 'center', alignItems: 'center', overflow: 'hidden' },
  img:      { width: '100%', height: '100%', position: 'absolute' },
  oosDim:   { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.38)', justifyContent: 'center', alignItems: 'center' },
  oosTag:   { backgroundColor: '#dc2626', paddingHorizontal: 7, paddingVertical: 3, borderRadius: 5 },
  oosTagTxt:{ color: '#fff', fontSize: 8, fontWeight: '800' },

  unit:     { fontWeight: '600', color: '#475569', textAlign: 'center', marginBottom: 4 },
  price:    { fontWeight: '800', color: C.primary, marginBottom: 8 },

  priceEditableRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 8 },
  priceEditIcon:    { fontSize: 10 },
  priceEditRow:     { flexDirection: 'row', alignItems: 'center', gap: 3, marginBottom: 8, width: '100%' },
  priceEditInput:   { flex: 1, fontWeight: '800', color: C.primary, borderBottomWidth: 1.5, borderColor: C.primary, paddingVertical: 2, paddingHorizontal: 3, minWidth: 40, textAlign: 'center' },
  priceSaveBtn:     { backgroundColor: C.primary, borderRadius: 5, width: 22, height: 22, justifyContent: 'center', alignItems: 'center' },
  priceSaveTxt:     { color: '#fff', fontSize: 11, fontWeight: '800' },
  priceCancelBtn:   { backgroundColor: '#fee2e2', borderRadius: 5, width: 22, height: 22, justifyContent: 'center', alignItems: 'center' },
  priceCancelTxt:   { color: '#dc2626', fontSize: 11, fontWeight: '800' },

  btn:      { backgroundColor: C.primary, borderRadius: 8, paddingHorizontal: 10, alignItems: 'center', width: '100%' },
  btnOff:   { backgroundColor: '#e2e8f0' },
  btnTxt:   { color: '#fff', fontWeight: '700' },
  btnTxtOff:{ color: '#94a3b8' },
});
