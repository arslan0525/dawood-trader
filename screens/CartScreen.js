


import React, { memo } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  Image, Linking, Alert, Platform,
} from 'react-native';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { C, CAT } from '../constants/theme';

const DAWOOD_WHATSAPP = '923364459040';

const CartItem = memo(function CartItem({ item, onUpdateQty, onRemove }) {
  const cat    = CAT[item.category] || CAT.default;
  const imgUri = item.imageUrls?.[0] || item.imageUrl || null;
  return (
    <View style={styles.item}>
      {imgUri
        ? <Image source={{ uri: imgUri }} style={styles.itemImg} resizeMode="contain" />
        : <View style={[styles.itemImg, { backgroundColor: cat.bg, justifyContent: 'center', alignItems: 'center' }]}>
            <Text style={{ fontSize: 28 }}>{cat.icon}</Text>
          </View>
      }
      <View style={styles.itemBody}>
        <Text style={styles.itemName} numberOfLines={2}>{item.name}</Text>
        <Text style={styles.itemUnit}>{item.unit || 'piece'}  ·  Rs. {item.price?.toLocaleString()}</Text>
        <View style={styles.qtyRow}>
          <TouchableOpacity style={styles.qtyBtn} onPress={() => onUpdateQty(item.id, item.qty - 1)}>
            <Text style={styles.qtyBtnText}>−</Text>
          </TouchableOpacity>
          <Text style={styles.qtyNum}>{item.qty}</Text>
          <TouchableOpacity style={styles.qtyBtn} onPress={() => onUpdateQty(item.id, item.qty + 1)}>
            <Text style={styles.qtyBtnText}>+</Text>
          </TouchableOpacity>
        </View>
      </View>
      <View style={styles.itemRight}>
        <Text style={styles.itemTotal}>Rs. {((item.price || 0) * (item.qty || 1)).toLocaleString()}</Text>
        <TouchableOpacity style={styles.removeBtn} onPress={() => onRemove(item.id)}>
          <Text style={{ fontSize: 13, color: C.danger, fontWeight: '700' }}>✕</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
});

const OrderSummary = memo(function OrderSummary({ cart, total, onOrder }) {
  return (
    <View style={styles.summary}>
      <Text style={styles.summaryTitle}>Order Summary</Text>
      <View style={styles.summaryRow}>
        <Text style={styles.summaryLabel}>Items ({cart.reduce((s, i) => s + i.qty, 0)})</Text>
        <Text style={styles.summaryValue}>Rs. {total.toLocaleString()}</Text>
      </View>
      <View style={styles.summaryRow}>
        <Text style={styles.summaryLabel}>Delivery</Text>
        <Text style={[styles.summaryValue, { color: C.success }]}>WhatsApp pe confirm</Text>
      </View>
      <View style={styles.divider} />
      <View style={styles.summaryRow}>
        <Text style={styles.totalLabel}>Total</Text>
        <Text style={styles.totalValue}>Rs. {total.toLocaleString()}</Text>
      </View>
      <TouchableOpacity style={styles.orderBtn} onPress={onOrder} activeOpacity={0.88}>
        <Text style={styles.orderBtnText}>📱  Order via WhatsApp</Text>
      </TouchableOpacity>
    </View>
  );
});

export default function CartScreen({ navigation, switchTab }) {
  const { cart, removeFromCart, updateQty, clearCart, total } = useCart();
  const { user } = useAuth();
  const isWeb = Platform.OS === 'web';

  const handleOrder = () => {
    if (cart.length === 0) { Alert.alert('Cart Khali', 'Pehle items daalen'); return; }
    const lines = cart.map((i) => `• ${i.name} x${i.qty}  =  Rs. ${(i.price * i.qty).toLocaleString()}`).join('\n');
    const msg =
      `🛒 *Dawood Trader — New Order*\n\n` +
      `👤 ${user?.displayName || 'Customer'}\n📧 ${user?.email}\n\n` +
      `*Items:*\n${lines}\n\n💰 *Total: Rs. ${total.toLocaleString()}*\n\nKindly confirm this order.`;
    const url = `https://wa.me/${DAWOOD_WHATSAPP}?text=${encodeURIComponent(msg)}`;
    Linking.canOpenURL(url).then((ok) => {
      if (ok) { Linking.openURL(url); clearCart(); }
      else Alert.alert('Error', 'WhatsApp install karein');
    });
  };

  /* ── Empty cart ── */
  if (cart.length === 0) {
    return (
      <View style={styles.root}>
        <View style={[styles.header, isWeb && styles.headerWeb]}>
          <Text style={[styles.headerTitle, isWeb && styles.headerTitleWeb]}>Shopping Cart</Text>
        </View>
        <View style={styles.empty}>
          <Text style={{ fontSize: 72 }}>🛒</Text>
          <Text style={styles.emptyTitle}>Cart is empty</Text>
          <Text style={styles.emptyText}>Products add karein aur order karein</Text>
          <TouchableOpacity style={styles.shopBtn}
            onPress={() => switchTab ? switchTab('Home') : navigation.navigate('Home')}>
            <Text style={styles.shopBtnText}>Browse Products →</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  /* ── Web layout: side-by-side ── */
  if (isWeb) {
    return (
      <View style={styles.root}>
        <View style={[styles.header, styles.headerWeb]}>
          <Text style={[styles.headerTitle, styles.headerTitleWeb]}>Shopping Cart</Text>
          <TouchableOpacity onPress={() => Alert.alert('Clear Cart?', 'Sab items remove karein?', [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Clear', style: 'destructive', onPress: clearCart },
          ])} style={styles.clearBtnWeb}>
            <Text style={styles.clearBtnText}>Clear All</Text>
          </TouchableOpacity>
        </View>

        <View style={[styles.webBody, { overflow: 'hidden' }]}>
          {/* Items list */}
          <ScrollView style={[styles.webItemsCol, { flex: 1 }]} showsVerticalScrollIndicator>
            <View style={{ padding: 20, paddingRight: 10 }}>
              {cart.map((item) => <CartItem key={item.id} item={item} onUpdateQty={updateQty} onRemove={removeFromCart} />)}
            </View>
          </ScrollView>

          {/* Summary panel */}
          <ScrollView style={styles.webSummaryCol} showsVerticalScrollIndicator={false}>
            <OrderSummary cart={cart} total={total} onOrder={handleOrder} />
          </ScrollView>
        </View>
      </View>
    );
  }

  /* ── Mobile layout ── */
  return (
    <View style={styles.root}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Shopping Cart</Text>
        <TouchableOpacity onPress={() => Alert.alert('Clear Cart?', 'Sab items remove karein?', [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Clear', style: 'destructive', onPress: clearCart },
        ])}>
          <Text style={styles.clearText}>Clear</Text>
        </TouchableOpacity>
      </View>
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 14, paddingBottom: 260 }}
        showsVerticalScrollIndicator={false}>
        {cart.map((item) => <CartItem key={item.id} item={item} onUpdateQty={updateQty} onRemove={removeFromCart} />)}
      </ScrollView>
      {/* Sticky footer on mobile */}
      <View style={styles.mobileFooter}>
        <OrderSummary cart={cart} total={total} onOrder={handleOrder} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },

  header:         { backgroundColor: C.primary, paddingTop: 54, paddingBottom: 18, paddingHorizontal: 20, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  headerWeb:      { backgroundColor: C.surface, paddingTop: 22, borderBottomWidth: 1, borderBottomColor: C.border },
  headerTitle:    { color: '#fff', fontSize: 22, fontWeight: '800' },
  headerTitleWeb: { color: C.text },
  clearText:      { color: 'rgba(255,255,255,0.7)', fontSize: 14, fontWeight: '600' },
  clearBtnWeb:    { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 8, borderWidth: 1.5, borderColor: C.border },
  clearBtnText:   { color: C.danger, fontSize: 13, fontWeight: '600' },

  empty:      { flex: 1, justifyContent: 'center', alignItems: 'center', paddingBottom: 40 },
  emptyTitle: { fontSize: 20, fontWeight: '800', color: C.text, marginTop: 16 },
  emptyText:  { fontSize: 14, color: C.textLight, marginTop: 6, marginBottom: 24 },
  shopBtn:    { backgroundColor: C.primary, borderRadius: 10, paddingHorizontal: 28, paddingVertical: 13 },
  shopBtnText:{ color: '#fff', fontWeight: '700', fontSize: 15 },

  /* Web layout */
  webBody:       { flex: 1, flexDirection: 'row' },
  webItemsCol:   { flex: 1 },
  webSummaryCol: { width: 320, padding: 20, borderLeftWidth: 1, borderLeftColor: C.border },

  /* Mobile footer */
  mobileFooter: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: C.surface, borderTopWidth: 1, borderTopColor: C.border },

  item: {
    backgroundColor: C.surface, borderRadius: 12, padding: 14,
    flexDirection: 'row', alignItems: 'center', marginBottom: 10,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2,
  },
  itemImg:   { width: 72, height: 72, borderRadius: 10 },
  itemBody:  { flex: 1, marginLeft: 14 },
  itemName:  { fontSize: 14, fontWeight: '600', color: C.text, lineHeight: 19 },
  itemUnit:  { fontSize: 12, color: C.textLight, marginTop: 3 },
  qtyRow:    { flexDirection: 'row', alignItems: 'center', marginTop: 10 },
  qtyBtn:    { width: 30, height: 30, borderRadius: 8, backgroundColor: C.primaryLight, justifyContent: 'center', alignItems: 'center' },
  qtyBtnText:{ fontSize: 18, color: C.primary, fontWeight: '700' },
  qtyNum:    { fontSize: 15, fontWeight: '800', color: C.text, minWidth: 30, textAlign: 'center' },
  itemRight: { alignItems: 'flex-end', justifyContent: 'space-between', paddingLeft: 6, paddingVertical: 4, minWidth: 80 },
  itemTotal: { fontSize: 15, fontWeight: '800', color: C.primary },
  removeBtn: { marginTop: 12, width: 28, height: 28, borderRadius: 7, backgroundColor: C.dangerBg, justifyContent: 'center', alignItems: 'center' },

  summary:      { backgroundColor: C.surface, borderRadius: 14, padding: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 3 },
  summaryTitle: { fontSize: 16, fontWeight: '800', color: C.text, marginBottom: 16 },
  summaryRow:   { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  summaryLabel: { fontSize: 14, color: C.textLight },
  summaryValue: { fontSize: 14, fontWeight: '600', color: C.text },
  divider:      { height: 1, backgroundColor: C.border, marginVertical: 12 },
  totalLabel:   { fontSize: 16, fontWeight: '800', color: C.text },
  totalValue:   { fontSize: 22, fontWeight: '800', color: C.text },
  orderBtn:     { backgroundColor: '#25D366', borderRadius: 12, paddingVertical: 16, alignItems: 'center', marginTop: 16, shadowColor: '#25D366', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 10, elevation: 5 },
  orderBtnText: { color: '#fff', fontSize: 16, fontWeight: '800' },
});
