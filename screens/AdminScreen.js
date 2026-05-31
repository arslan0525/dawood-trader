import React, { useState, useEffect } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  Image, Alert, ActivityIndicator, Platform,
} from 'react-native';
import { collection, onSnapshot, orderBy, query, deleteDoc, doc } from 'firebase/firestore';
import { ref, deleteObject } from 'firebase/storage';
import { db, storage, IS_DEMO } from '../services/firebase';
import { DEMO_PRODUCTS } from '../services/demoData';
import { C, CAT } from '../constants/theme';

export default function AdminScreen({ navigation }) {
  const [products, setProducts] = useState([]);
  const [loading, setLoading]   = useState(true);
  const isWeb = Platform.OS === 'web';

  useEffect(() => {
    if (IS_DEMO) { setProducts(DEMO_PRODUCTS); setLoading(false); return; }
    const q = query(collection(db, 'products'), orderBy('createdAt', 'desc'));
    const unsub = onSnapshot(q, (snap) => {
      setProducts(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
      setLoading(false);
    });
    return unsub;
  }, []);

  const handleDelete = (item) => {
    Alert.alert('Delete?', `"${item.name}" permanently delete ho jaega`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => {
        if (IS_DEMO) { setProducts((p) => p.filter((x) => x.id !== item.id)); return; }
        try {
          await deleteDoc(doc(db, 'products', item.id));
          if (item.imagePath) await deleteObject(ref(storage, item.imagePath)).catch(() => {});
        } catch { Alert.alert('Error', 'Delete nahi ho saka'); }
      }},
    ]);
  };

  const cats    = [...new Set(products.map((p) => p.category).filter(Boolean))];
  const avgPrice = products.length
    ? Math.round(products.reduce((s, p) => s + (p.price || 0), 0) / products.length)
    : 0;

  const stats = [
    { label: 'Total Products', value: products.length, icon: '📦', color: '#dbeafe', textColor: C.primary },
    { label: 'Categories',     value: cats.length,     icon: '🏷️', color: '#dcfce7', textColor: '#15803d' },
    { label: 'Avg. Price',     value: `Rs. ${avgPrice.toLocaleString()}`, icon: '💰', color: '#fef9c3', textColor: '#a16207' },
  ];

  const renderItem = ({ item }) => {
    const cat    = CAT[item.category] || CAT.default;
    const imgUri = item.imageUrls?.[0] || item.imageUrl || null;
    return (
      <View style={styles.card}>
        {imgUri
          ? <Image source={{ uri: imgUri }} style={styles.cardImg} />
          : <View style={[styles.cardImg, { backgroundColor: cat.bg, justifyContent: 'center', alignItems: 'center' }]}><Text style={{ fontSize: 28 }}>{cat.icon}</Text></View>
        }
        <View style={styles.cardBody}>
          <Text style={styles.cardName} numberOfLines={2}>{item.name}</Text>
          {item.category && (
            <View style={[styles.catPill, { backgroundColor: cat.bg }]}>
              <Text style={[styles.catPillText, { color: cat.text }]}>{item.category}</Text>
            </View>
          )}
          <Text style={styles.cardPrice}>Rs. {item.price?.toLocaleString()}</Text>
        </View>
        <View style={styles.actions}>
          <TouchableOpacity style={styles.editBtn} onPress={() => navigation.navigate('AddItem', { product: item })}>
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
        <TouchableOpacity style={[styles.backBtn, isWeb && styles.backBtnWeb]} onPress={() => navigation.goBack()}>
          <Text style={[styles.backText, isWeb && styles.backTextWeb]}>‹ Back</Text>
        </TouchableOpacity>
        <Text style={[styles.headerTitle, isWeb && styles.headerTitleWeb]}>Admin Panel</Text>
        <TouchableOpacity style={styles.addBtnHeader} onPress={() => navigation.navigate('AddItem', { product: null })}>
          <Text style={styles.addBtnHeaderText}>+ Add Product</Text>
        </TouchableOpacity>
      </View>

      {IS_DEMO && (
        <View style={styles.demoBanner}>
          <Text style={styles.demoText}>Demo Mode — changes save nahi honge</Text>
        </View>
      )}

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

      <View style={{ flex: 1, overflow: 'hidden' }}>
        {loading ? (
          <View style={styles.center}><ActivityIndicator size="large" color={C.primary} /></View>
        ) : (
          <FlatList data={products} keyExtractor={(i) => i.id} renderItem={renderItem}
            style={{ flex: 1 }}
            contentContainerStyle={[styles.list, isWeb && styles.listWeb]}
            showsVerticalScrollIndicator
            ListEmptyComponent={
              <View style={styles.center}>
                <Text style={{ fontSize: 56 }}>📦</Text>
                <Text style={styles.emptyTitle}>No products yet</Text>
                <Text style={styles.emptyText}>+ Add Product se shuru karein</Text>
              </View>
            }
          />
        )}
      </View>

      {!isWeb && (
        <TouchableOpacity style={styles.fab} onPress={() => navigation.navigate('AddItem', { product: null })} activeOpacity={0.88}>
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
  demoText:   { color: '#92400e', fontSize: 12, textAlign: 'center' },

  statsRow:    { flexDirection: 'row', padding: 16, gap: 12 },
  statsRowWeb: { paddingHorizontal: 24 },
  statCard:    { flex: 1, borderRadius: 12, padding: 14, alignItems: 'center', marginHorizontal: 2 },
  statIcon:    { fontSize: 22, marginBottom: 6 },
  statValue:   { fontSize: 18, fontWeight: '800', marginBottom: 2 },
  statLabel:   { fontSize: 10, fontWeight: '600', textAlign: 'center', opacity: 0.8 },

  center:    { flex: 1, justifyContent: 'center', alignItems: 'center', paddingTop: 40 },
  emptyTitle:{ fontSize: 17, fontWeight: '700', color: C.text, marginTop: 12 },
  emptyText: { fontSize: 13, color: C.textLight, marginTop: 6 },

  list:    { padding: 14, paddingBottom: 100 },
  listWeb: { paddingHorizontal: 24, paddingTop: 8 },

  card:    { backgroundColor: C.surface, borderRadius: 12, padding: 14, flexDirection: 'row', alignItems: 'center', marginBottom: 10, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
  cardImg: { width: 66, height: 66, borderRadius: 10, resizeMode: 'cover' },
  cardBody:{ flex: 1, marginLeft: 14 },
  cardName:{ fontSize: 14, fontWeight: '600', color: C.text, lineHeight: 19 },
  catPill: { alignSelf: 'flex-start', borderRadius: 6, paddingHorizontal: 8, paddingVertical: 2, marginTop: 5 },
  catPillText: { fontSize: 10, fontWeight: '700' },
  cardPrice:{ fontSize: 16, fontWeight: '800', color: C.primary, marginTop: 6 },
  actions: { flexDirection: 'column', gap: 8, marginLeft: 6 },
  editBtn: { width: 36, height: 36, borderRadius: 8, backgroundColor: C.primaryLight, justifyContent: 'center', alignItems: 'center', marginBottom: 6 },
  editIcon:{ fontSize: 15 },
  delBtn:  { width: 36, height: 36, borderRadius: 8, backgroundColor: C.dangerBg, justifyContent: 'center', alignItems: 'center' },
  delIcon: { fontSize: 15 },

  fab:     { position: 'absolute', bottom: 24, left: 20, right: 20, backgroundColor: C.primary, borderRadius: 14, paddingVertical: 17, alignItems: 'center', shadowColor: C.primary, shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.35, shadowRadius: 14, elevation: 8 },
  fabText: { color: '#fff', fontSize: 16, fontWeight: '800' },
});
