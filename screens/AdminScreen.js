import React, { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  Image, Alert, ActivityIndicator, Platform, TextInput,
  useWindowDimensions,
} from 'react-native';
import { useToast } from '../context/ToastContext';
import { useAppData } from '../context/AppDataContext';
import { collection, onSnapshot, orderBy, query, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import { ref, deleteObject } from 'firebase/storage';
import { db, storage, IS_DEMO } from '../services/firebase';
import { DEMO_PRODUCTS } from '../services/demoData';
import { C, CAT } from '../constants/theme';

export default function AdminScreen({ navigation, switchTab, editProduct }) {
  const [products, setProducts]     = useState([]);
  const [loading, setLoading]       = useState(true);
  const [search, setSearch]         = useState('');
  const [editPriceId, setEditPriceId]   = useState(null);
  const [editPriceVal, setEditPriceVal] = useState('');
  const { showToast }               = useToast();
  const { products: ctxProducts, loading: ctxLoading, setProductStock, getStock, updateProductDemo, removeProduct } = useAppData();
  const { width }                   = useWindowDimensions();
  const isWeb                       = Platform.OS === 'web';

  // Demo mode: mirror context products (includes localStorage additions/edits/deletes).
  useEffect(() => {
    if (!IS_DEMO) return;
    setProducts(ctxProducts);
    setLoading(false);
  }, [ctxProducts]);

  // Firebase mode: own real-time listener.
  useEffect(() => {
    if (IS_DEMO) return;
    const q = query(collection(db, 'products'), orderBy('createdAt', 'desc'));
    const unsub = onSnapshot(q, (snap) => {
      setProducts(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
      setLoading(false);
    });
    return unsub;
  }, []);

  const performDelete = async (item) => {
    if (IS_DEMO) {
      removeProduct(item.id);
      showToast(`"${item.name}" deleted`, 'success');
      return;
    }
    try {
      await deleteDoc(doc(db, 'products', item.id));
      const paths = item.imagePaths?.length ? item.imagePaths : (item.imagePath ? [item.imagePath] : []);
      for (const path of paths) {
        await deleteObject(ref(storage, path)).catch(() => {});
      }
      showToast(`"${item.name}" deleted`, 'success');
    } catch { showToast('Delete nahi ho saka', 'error'); }
  };

  const handleDelete = (item) => {
    if (Platform.OS === 'web') {
      if (window.confirm(`"${item.name}" permanently delete ho jaega?`)) performDelete(item);
      return;
    }
    Alert.alert('Delete?', `"${item.name}" permanently delete ho jaega`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => performDelete(item) },
    ]);
  };

  const filtered = search.trim()
    ? products.filter(p =>
        p.name?.toLowerCase().includes(search.toLowerCase()) ||
        p.category?.toLowerCase().includes(search.toLowerCase())
      )
    : products;

  const cats    = [...new Set(products.map((p) => p.category).filter(Boolean))];
  const avgPrice = products.length
    ? Math.round(products.reduce((s, p) => s + (p.price || 0), 0) / products.length)
    : 0;
  const lowStockCount = products.filter(p => getStock(p.id, p.stock ?? 0) <= 10).length;

  const stats = [
    { label: 'Total Products', value: products.length,        icon: '📦', color: '#dbeafe', textColor: C.primary },
    { label: 'Categories',     value: cats.length,            icon: '🏷️', color: '#dcfce7', textColor: '#15803d' },
    { label: 'Low Stock',      value: lowStockCount,          icon: '⚠️', color: '#ffedd5', textColor: '#c2410c' },
    { label: 'Avg. Price',     value: `Rs.${avgPrice.toLocaleString()}`, icon: '💰', color: '#fef9c3', textColor: '#a16207' },
  ];

  const startEditPrice = (item) => {
    setEditPriceId(item.id);
    setEditPriceVal(String(item.price || ''));
  };

  const savePrice = async (item) => {
    const newPrice = Number(editPriceVal);
    if (!newPrice || newPrice <= 0) { showToast('Sahi price likhein', 'error'); return; }
    setEditPriceId(null);
    if (IS_DEMO) {
      setProducts(prev => prev.map(p => p.id === item.id ? { ...p, price: newPrice } : p));
      updateProductDemo(item.id, { ...item, price: newPrice });
      showToast(`Price update: Rs.${newPrice.toLocaleString()}`, 'success');
      return;
    }
    try {
      await updateDoc(doc(db, 'products', item.id), { price: newPrice });
      showToast(`Price update: Rs.${newPrice.toLocaleString()}`, 'success');
    } catch { showToast('Price save nahi ho saka', 'error'); }
  };

  const handleStockChange = (item, delta) => {
    const current = getStock(item.id, item.stock ?? 0);
    const newQty = Math.max(0, current + delta);
    setProductStock(item.id, newQty);
  };

  const handleStockInput = (item, val) => {
    const n = parseInt(val);
    if (!isNaN(n) && n >= 0) setProductStock(item.id, n);
  };

  const renderCard = (item) => {
    const cat     = CAT[item.category] || CAT.default;
    const imgUri  = item.imageUrls?.[0] || item.imageUrl || null;
    const stock   = getStock(item.id, item.stock ?? 0);
    const isLow   = stock <= 10;
    const isOut   = stock === 0;

    return (
      <View key={item.id} style={styles.card}>
        {/* Image */}
        {imgUri
          ? <Image source={{ uri: imgUri }} style={styles.cardImg} />
          : (
            <View style={[styles.cardImg, { backgroundColor: cat.bg, justifyContent: 'center', alignItems: 'center' }]}>
              <Text style={{ fontSize: 24 }}>{cat.icon}</Text>
            </View>
          )
        }

        {/* Info */}
        <View style={styles.cardBody}>
          <Text style={styles.cardName} numberOfLines={2}>{item.name}</Text>
          {item.category && (
            <View style={[styles.catPill, { backgroundColor: cat.bg }]}>
              <Text style={[styles.catPillText, { color: cat.text }]}>{item.category}</Text>
            </View>
          )}
          <Text style={styles.cardUnit}>{item.unit}</Text>
          {editPriceId === item.id ? (
            <View style={styles.priceEditRow}>
              <Text style={styles.priceRs}>Rs.</Text>
              <TextInput
                style={styles.priceInput}
                value={editPriceVal}
                onChangeText={setEditPriceVal}
                keyboardType="numeric"
                autoFocus
                selectTextOnFocus
                onSubmitEditing={() => savePrice(item)}
                onBlur={() => savePrice(item)}
              />
              <TouchableOpacity style={styles.priceSaveBtn} onPress={() => savePrice(item)}>
                <Text style={styles.priceSaveTxt}>✓</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity onPress={() => startEditPrice(item)} style={styles.priceRow}>
              <Text style={styles.cardPrice}>Rs. {item.price?.toLocaleString()}</Text>
              <Text style={styles.priceEditHint}>✏️</Text>
            </TouchableOpacity>
          )}

          {/* Stock control */}
          <View style={styles.stockRow}>
            <TouchableOpacity
              style={styles.stockBtn}
              onPress={() => handleStockChange(item, -1)}
              disabled={stock <= 0}
            >
              <Text style={[styles.stockBtnTxt, stock <= 0 && { opacity: 0.3 }]}>−</Text>
            </TouchableOpacity>
            <TextInput
              style={[
                styles.stockInput,
                isOut && { borderColor: '#b91c1c', color: '#b91c1c' },
                isLow && !isOut && { borderColor: '#c2410c', color: '#c2410c' },
              ]}
              value={stock.toString()}
              onChangeText={v => handleStockInput(item, v)}
              keyboardType="numeric"
              selectTextOnFocus
            />
            <TouchableOpacity
              style={styles.stockBtn}
              onPress={() => handleStockChange(item, 1)}
            >
              <Text style={styles.stockBtnTxt}>＋</Text>
            </TouchableOpacity>
            <View style={[
              styles.stockTag,
              isOut ? { backgroundColor: '#fee2e2' } : isLow ? { backgroundColor: '#ffedd5' } : { backgroundColor: '#dcfce7' },
            ]}>
              <Text style={[
                styles.stockTagTxt,
                isOut ? { color: '#b91c1c' } : isLow ? { color: '#c2410c' } : { color: '#15803d' },
              ]}>
                {isOut ? 'Out' : isLow ? 'Low' : 'OK'}
              </Text>
            </View>
          </View>
        </View>

        {/* Actions */}
        <View style={styles.actions}>
          <TouchableOpacity
            style={styles.editBtn}
            onPress={() => {
              if (editProduct) {
                editProduct(item);  // passes product to AddProduct tab via WebLayout
              } else if (switchTab) {
                switchTab('AddProduct', item);
              } else {
                navigation.navigate('AddItem', { product: item });
              }
            }}
          >
            <Text style={styles.editIcon}>✏️</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.delBtn} onPress={() => handleDelete(item)}>
            <Text style={styles.delIcon}>🗑️</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.root}>
      {/* Header */}
      <View style={[styles.header, isWeb && styles.headerWeb]}>
        {!switchTab && (
          <TouchableOpacity style={[styles.backBtn, isWeb && styles.backBtnWeb]} onPress={() => navigation.goBack()}>
            <Text style={[styles.backText, isWeb && styles.backTextWeb]}>‹ Back</Text>
          </TouchableOpacity>
        )}
        <Text style={[styles.headerTitle, isWeb && styles.headerTitleWeb]}>📦 Inventory</Text>
        <TouchableOpacity
          style={styles.addBtnHeader}
          onPress={() => {
            if (editProduct) editProduct(null);
            else if (switchTab) switchTab('AddProduct', null);
            else navigation.navigate('AddItem', { product: null });
          }}
        >
          <Text style={styles.addBtnHeaderText}>+ Add Product</Text>
        </TouchableOpacity>
      </View>

      {/* Search bar */}
      <View style={styles.searchBar}>
        <Text style={styles.searchIcon}>🔍</Text>
        <TextInput
          style={styles.searchInput}
          placeholder="Search products or category..."
          value={search}
          onChangeText={setSearch}
          placeholderTextColor="#94a3b8"
        />
        {search.length > 0 && (
          <TouchableOpacity onPress={() => setSearch('')} style={{ padding: 6 }}>
            <Text style={{ color: '#94a3b8', fontWeight: '800' }}>✕</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Stats */}
      {!loading && (
        <View style={[styles.statsRow, isWeb && styles.statsRowWeb]}>
          {stats.map((st) => (
            <View key={st.label} style={[styles.statCard, { backgroundColor: st.color }]}>
              <Text style={styles.statIcon}>{st.icon}</Text>
              <Text style={[styles.statValue, { color: st.textColor }]}>{st.value}</Text>
              <Text style={[styles.statLabel, { color: st.textColor }]}>{st.label}</Text>
            </View>
          ))}
        </View>
      )}

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={[styles.list, isWeb && styles.listWeb]}
        showsVerticalScrollIndicator
      >
        {loading ? (
          <View style={styles.center}><ActivityIndicator size="large" color={C.primary} /></View>
        ) : products.length === 0 ? (
          <View style={styles.center}>
            <Text style={{ fontSize: 56 }}>📦</Text>
            <Text style={styles.emptyTitle}>No products yet</Text>
            <Text style={styles.emptyText}>+ Add Product se shuru karein</Text>
          </View>
        ) : filtered.length === 0 ? (
          <View style={styles.center}>
            <Text style={{ fontSize: 40 }}>🔍</Text>
            <Text style={styles.emptyTitle}>No results found</Text>
            <Text style={styles.emptyText}>Try a different search term</Text>
          </View>
        ) : (
          filtered.map((item) => renderCard(item))
        )}
      </ScrollView>

      {!isWeb && (
        <TouchableOpacity
          style={styles.fab}
          onPress={() => navigation.navigate('AddItem', { product: null })}
          activeOpacity={0.88}
        >
          <Text style={styles.fabText}>+ Add Product</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },

  header:         { backgroundColor: C.primary, paddingTop: 50, paddingBottom: 16, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center' },
  headerWeb:      { backgroundColor: C.surface, paddingTop: 20, borderBottomWidth: 1, borderBottomColor: C.border },
  backBtn:        { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, backgroundColor: 'rgba(255,255,255,0.15)', marginRight: 12 },
  backBtnWeb:     { backgroundColor: C.bg, borderWidth: 1, borderColor: C.border },
  backText:       { color: '#fff', fontSize: 14, fontWeight: '600' },
  backTextWeb:    { color: C.textMid },
  headerTitle:    { flex: 1, color: '#fff', fontSize: 18, fontWeight: '800' },
  headerTitleWeb: { color: C.text },
  addBtnHeader:   { backgroundColor: C.primary, borderRadius: 8, paddingHorizontal: 14, paddingVertical: 8 },
  addBtnHeaderText:{ color: '#fff', fontSize: 13, fontWeight: '700' },

  demoBanner: { backgroundColor: '#fffbeb', borderBottomWidth: 1, borderColor: '#fde68a', paddingVertical: 8, paddingHorizontal: 16 },
  demoText:   { color: '#92400e', fontSize: 12, textAlign: 'center', fontWeight: '600' },

  searchBar:   { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f8fafc', borderBottomWidth: 1, borderBottomColor: '#e2e8f0', paddingHorizontal: 16, paddingVertical: 8 },
  searchIcon:  { fontSize: 14, marginRight: 8 },
  searchInput: { flex: 1, fontSize: 14, color: '#0f172a', paddingVertical: 6 },

  statsRow:    { flexDirection: 'row', padding: 12, gap: 8 },
  statsRowWeb: { paddingHorizontal: 20 },
  statCard:    { flex: 1, borderRadius: 10, padding: 10, alignItems: 'center' },
  statIcon:    { fontSize: 18, marginBottom: 4 },
  statValue:   { fontSize: 15, fontWeight: '800', marginBottom: 1 },
  statLabel:   { fontSize: 8, fontWeight: '600', textAlign: 'center', opacity: 0.8 },

  center:    { flex: 1, justifyContent: 'center', alignItems: 'center', paddingTop: 40 },
  emptyTitle:{ fontSize: 17, fontWeight: '700', color: C.text, marginTop: 12 },
  emptyText: { fontSize: 13, color: C.textLight, marginTop: 6 },

  list:    { padding: 12, paddingBottom: 100 },
  listWeb: { paddingHorizontal: 20, paddingTop: 8 },

  card: {
    backgroundColor: C.surface, borderRadius: 12, padding: 12, flexDirection: 'row',
    alignItems: 'flex-start', marginBottom: 10,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2,
  },
  cardImg:   { width: 64, height: 64, borderRadius: 10, resizeMode: 'cover' },
  cardBody:  { flex: 1, marginLeft: 12 },
  cardName:  { fontSize: 13, fontWeight: '600', color: C.text, lineHeight: 18 },
  catPill:   { alignSelf: 'flex-start', borderRadius: 5, paddingHorizontal: 7, paddingVertical: 2, marginTop: 4 },
  catPillText: { fontSize: 9, fontWeight: '700' },
  cardUnit:  { fontSize: 10, color: C.textLight, marginTop: 2 },
  cardPrice: { fontSize: 14, fontWeight: '800', color: C.primary },
  priceRow:       { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 3 },
  priceEditHint:  { fontSize: 10 },
  priceEditRow:   { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 3 },
  priceRs:        { fontSize: 12, fontWeight: '700', color: C.primary },
  priceInput:     { flex: 1, borderWidth: 1.5, borderColor: C.primary, borderRadius: 6, paddingHorizontal: 6, paddingVertical: 3, fontSize: 13, fontWeight: '800', color: C.primary, minWidth: 60 },
  priceSaveBtn:   { backgroundColor: C.primary, borderRadius: 6, width: 26, height: 26, justifyContent: 'center', alignItems: 'center' },
  priceSaveTxt:   { color: '#fff', fontWeight: '800', fontSize: 13 },

  /* Stock control */
  stockRow:   { flexDirection: 'row', alignItems: 'center', marginTop: 8, gap: 5 },
  stockBtn:   { width: 28, height: 28, borderRadius: 7, backgroundColor: '#eff6ff', borderWidth: 1, borderColor: '#bfdbfe', justifyContent: 'center', alignItems: 'center' },
  stockBtnTxt:{ fontSize: 16, fontWeight: '800', color: C.primary },
  stockInput: { width: 46, height: 28, borderWidth: 1.5, borderColor: '#e2e8f0', borderRadius: 7, textAlign: 'center', fontSize: 12, fontWeight: '700', color: C.text, backgroundColor: '#f8fafc', paddingVertical: 0 },
  stockTag:   { borderRadius: 6, paddingHorizontal: 7, paddingVertical: 3 },
  stockTagTxt:{ fontSize: 9, fontWeight: '800' },

  actions: { flexDirection: 'column', gap: 8, marginLeft: 4 },
  editBtn: { width: 34, height: 34, borderRadius: 8, backgroundColor: C.primaryLight, justifyContent: 'center', alignItems: 'center' },
  editIcon:{ fontSize: 14 },
  delBtn:  { width: 34, height: 34, borderRadius: 8, backgroundColor: C.dangerBg, justifyContent: 'center', alignItems: 'center' },
  delIcon: { fontSize: 14 },

  fab:     { position: 'absolute', bottom: 24, left: 20, right: 20, backgroundColor: C.primary, borderRadius: 14, paddingVertical: 17, alignItems: 'center', shadowColor: C.primary, shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.35, shadowRadius: 14, elevation: 8 },
  fabText: { color: '#fff', fontSize: 16, fontWeight: '800' },
});
