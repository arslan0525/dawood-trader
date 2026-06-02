import React, { useState } from 'react';
import {
  View, Text, Image, TouchableOpacity, StyleSheet,
  ScrollView, Alert, Platform, FlatList, useWindowDimensions,
} from 'react-native';
import { useCart } from '../context/CartContext';
import { C, CAT } from '../constants/theme';

export default function ProductDetailScreen({ route, navigation }) {
  const { product, switchTab } = route.params;
  const { addToCart } = useCart();
  const [qty, setQty]           = useState(1);
  const [activeImg, setActiveImg] = useState(0);
  const { width } = useWindowDimensions();

  const cat       = CAT[product.category] || CAT.default;
  const isInStock = product.inStock !== false;

  /* collect all images (support both legacy imageUrl and new imageUrls array) */
  const images = (() => {
    if (product.imageUrls?.length) return product.imageUrls;
    if (product.imageUrl)          return [product.imageUrl];
    return [];
  })();

  const handleAdd = () => {
    if (!isInStock) return;
    for (let i = 0; i < qty; i++) addToCart(product);
    Alert.alert('✅ Cart mein add ho gaya!', `${product.name} ×${qty}`, [
      { text: 'Shopping karein', style: 'cancel' },
      { text: '🛒 Cart dekhein', onPress: () => switchTab ? (navigation.goBack(), switchTab('Cart')) : navigation.navigate('Cart') },
    ]);
  };

  const heroH = Math.min(width * 0.65, 340);

  return (
    <View style={s.root}>
      <ScrollView style={s.scroll} showsVerticalScrollIndicator={false}>

        {/* ── Hero Image ── */}
        <View style={[s.hero, { height: heroH }]}>
          {images.length > 0 ? (
            <Image
              source={{ uri: images[activeImg] }}
              style={s.heroImg}
              resizeMode="contain"
            />
          ) : (
            <View style={[s.heroPlaceholder, { backgroundColor: cat.bg }]}>
              <Text style={{ fontSize: 100 }}>{cat.icon}</Text>
            </View>
          )}

          {/* Back button */}
          <TouchableOpacity style={s.backBtn} onPress={() => navigation.goBack()}>
            <Text style={s.backBtnText}>‹</Text>
          </TouchableOpacity>

          {/* Out-of-stock ribbon */}
          {!isInStock && (
            <View style={s.oosRibbon}>
              <Text style={s.oosRibbonTxt}>Out of Stock</Text>
            </View>
          )}
        </View>

        {/* ── Image thumbnails (if multiple) ── */}
        {images.length > 1 && (
          <View style={s.thumbRow}>
            {images.map((uri, idx) => (
              <TouchableOpacity
                key={idx}
                onPress={() => setActiveImg(idx)}
                style={[s.thumb, activeImg === idx && s.thumbActive]}
              >
                <Image source={{ uri }} style={s.thumbImg} resizeMode="cover" />
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* ── Detail body ── */}
        <View style={s.body}>

          {/* Category + stock row */}
          <View style={s.topRow}>
            <View style={[s.catChip, { backgroundColor: cat.bg }]}>
              <Text style={{ fontSize: 13, marginRight: 5 }}>{cat.icon}</Text>
              <Text style={[s.catChipTxt, { color: cat.text }]}>{product.category}</Text>
            </View>
            <View style={[s.stockBadge, { backgroundColor: isInStock ? '#f0fdf4' : '#fef2f2' }]}>
              <View style={[s.stockDot, { backgroundColor: isInStock ? '#16a34a' : '#dc2626' }]} />
              <Text style={[s.stockTxt, { color: isInStock ? '#16a34a' : '#dc2626' }]}>
                {isInStock ? 'In Stock' : 'Out of Stock'}
              </Text>
            </View>
          </View>

          {/* Name */}
          <Text style={s.name}>{product.name}</Text>

          {/* Meta chips */}
          <View style={s.metaRow}>
            {product.unit && (
              <View style={s.metaChip}><Text style={s.metaChipTxt}>📦  {product.unit}</Text></View>
            )}
            {product.sku && (
              <View style={s.metaChip}><Text style={s.metaChipTxt}>🔖  #{product.sku}</Text></View>
            )}
            {product.weight && (
              <View style={s.metaChip}><Text style={s.metaChipTxt}>⚖️  {product.weight}</Text></View>
            )}
          </View>

          {/* Price */}
          <Text style={s.price}>Rs. {product.price?.toLocaleString()}</Text>

          {/* Quantity selector */}
          {isInStock && (
            <View style={s.qtyCard}>
              <Text style={s.qtyLabel}>Quantity</Text>
              <View style={s.qtyRow}>
                <TouchableOpacity style={s.qtyBtn} onPress={() => setQty((q) => Math.max(1, q - 1))}>
                  <Text style={s.qtyBtnTxt}>−</Text>
                </TouchableOpacity>
                <Text style={s.qtyNum}>{qty}</Text>
                <TouchableOpacity style={s.qtyBtn} onPress={() => setQty((q) => q + 1)}>
                  <Text style={s.qtyBtnTxt}>+</Text>
                </TouchableOpacity>
                <View style={s.qtyTotal}>
                  <Text style={s.qtyTotalLabel}>Subtotal</Text>
                  <Text style={s.qtyTotalValue}>Rs. {(product.price * qty).toLocaleString()}</Text>
                </View>
              </View>
            </View>
          )}

          {/* Description */}
          {!!product.description && (
            <View style={s.descBox}>
              <Text style={s.descTitle}>Product Details</Text>
              <Text style={s.descTxt}>{product.description}</Text>
            </View>
          )}

          {/* Trust badges */}
          <View style={s.badges}>
            <View style={s.badge}><Text style={s.badgeTxt}>✅  Trusted Seller</Text></View>
            <View style={s.badge}><Text style={s.badgeTxt}>💬  WhatsApp Order</Text></View>
            <View style={s.badge}><Text style={s.badgeTxt}>🚚  Fast Delivery</Text></View>
          </View>
        </View>
      </ScrollView>

      {/* ── Sticky footer ── */}
      <View style={s.footer}>
        <View style={s.footerLeft}>
          <Text style={s.footerLabel}>Total</Text>
          <Text style={s.footerPrice}>Rs. {(product.price * qty).toLocaleString()}</Text>
        </View>
        <TouchableOpacity
          style={[s.addBtn, !isInStock && s.addBtnDisabled]}
          onPress={handleAdd}
          disabled={!isInStock}
          activeOpacity={0.88}
        >
          <Text style={s.addBtnTxt}>
            {isInStock ? `🛒  Add to Cart (×${qty})` : 'Out of Stock'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  root:   { flex: 1, backgroundColor: C.surface },
  scroll: { flex: 1 },

  /* Hero */
  hero:            { position: 'relative', backgroundColor: '#f8fafc' },
  heroImg:         { width: '100%', height: '100%' },
  heroPlaceholder: { flex: 1, justifyContent: 'center', alignItems: 'center' },

  backBtn: {
    position: 'absolute',
    top: Platform.OS === 'web' ? 16 : 50,
    left: 16,
    width: 42, height: 42, borderRadius: 21,
    backgroundColor: 'rgba(255,255,255,0.92)',
    justifyContent: 'center', alignItems: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15, shadowRadius: 8, elevation: 5,
  },
  backBtnText: { fontSize: 28, color: C.primary, fontWeight: '800', marginTop: -2 },

  oosRibbon:    { position: 'absolute', top: 24, right: -28, backgroundColor: '#dc2626', paddingHorizontal: 36, paddingVertical: 6, transform: [{ rotate: '35deg' }] },
  oosRibbonTxt: { color: '#fff', fontSize: 11, fontWeight: '800' },

  /* Thumbnails */
  thumbRow: { flexDirection: 'row', paddingHorizontal: 16, paddingVertical: 10, backgroundColor: '#f8fafc', borderBottomWidth: 1, borderBottomColor: C.border },
  thumb:       { width: 56, height: 56, borderRadius: 8, overflow: 'hidden', marginRight: 8, borderWidth: 2, borderColor: 'transparent' },
  thumbActive: { borderColor: C.primary },
  thumbImg:    { width: '100%', height: '100%' },

  /* Body */
  body:    { padding: 20, paddingBottom: 130 },
  topRow:  { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },

  catChip:    { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
  catChipTxt: { fontSize: 12, fontWeight: '700' },
  stockBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20 },
  stockDot:   { width: 7, height: 7, borderRadius: 4, marginRight: 5 },
  stockTxt:   { fontSize: 12, fontWeight: '700' },

  name:  { fontSize: 24, fontWeight: '800', color: C.text, lineHeight: 32, marginBottom: 12 },

  metaRow:     { flexDirection: 'row', flexWrap: 'wrap', marginBottom: 14 },
  metaChip:    { backgroundColor: C.bg, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 6, borderWidth: 1, borderColor: C.border, marginRight: 8, marginBottom: 6 },
  metaChipTxt: { fontSize: 12, color: C.textMid, fontWeight: '600' },

  price: { fontSize: 34, fontWeight: '800', color: C.primary, marginBottom: 20 },

  /* Quantity card */
  qtyCard:       { backgroundColor: C.bg, borderRadius: 14, padding: 16, marginBottom: 20, borderWidth: 1, borderColor: C.border },
  qtyLabel:      { fontSize: 13, fontWeight: '600', color: C.textMid, marginBottom: 12 },
  qtyRow:        { flexDirection: 'row', alignItems: 'center' },
  qtyBtn:        { width: 40, height: 40, borderRadius: 12, backgroundColor: C.primaryLight, justifyContent: 'center', alignItems: 'center' },
  qtyBtnTxt:     { fontSize: 22, color: C.primary, fontWeight: '700' },
  qtyNum:        { fontSize: 22, fontWeight: '800', color: C.text, minWidth: 48, textAlign: 'center' },
  qtyTotal:      { flex: 1, alignItems: 'flex-end' },
  qtyTotalLabel: { fontSize: 11, color: C.textLight },
  qtyTotalValue: { fontSize: 18, fontWeight: '800', color: C.primary },

  /* Description */
  descBox:   { backgroundColor: C.bg, borderRadius: 12, padding: 16, marginBottom: 20 },
  descTitle: { fontSize: 14, fontWeight: '700', color: C.textMid, marginBottom: 8 },
  descTxt:   { fontSize: 14, color: C.textLight, lineHeight: 22 },

  /* Badges */
  badges:   { flexDirection: 'row', flexWrap: 'wrap' },
  badge:    { backgroundColor: C.bg, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 8, borderWidth: 1, borderColor: C.border, marginRight: 8, marginBottom: 8 },
  badgeTxt: { fontSize: 12, color: C.textMid, fontWeight: '600' },

  /* Footer */
  footer: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    backgroundColor: C.surface,
    padding: 16,
    paddingBottom: Platform.OS === 'web' ? 16 : 28,
    flexDirection: 'row', alignItems: 'center',
    borderTopWidth: 1, borderTopColor: C.border,
    shadowColor: '#000', shadowOffset: { width: 0, height: -3 }, shadowOpacity: 0.08, shadowRadius: 12, elevation: 10,
  },
  footerLeft:  { marginRight: 16 },
  footerLabel: { fontSize: 11, color: C.textLight },
  footerPrice: { fontSize: 22, fontWeight: '800', color: C.text },
  addBtn:      { flex: 1, backgroundColor: C.primary, borderRadius: 14, paddingVertical: 17, alignItems: 'center', shadowColor: C.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 10, elevation: 5 },
  addBtnDisabled: { backgroundColor: C.border },
  addBtnTxt:   { color: '#fff', fontSize: 15, fontWeight: '800' },
});
