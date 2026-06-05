import React, { useState, useMemo, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  TextInput, Modal, Alert, Platform, ActivityIndicator,
  KeyboardAvoidingView, Linking, useWindowDimensions,
} from 'react-native';
import { useAppData } from '../context/AppDataContext';
import { useLang } from '../context/LanguageContext';
import { useToast } from '../context/ToastContext';
import { C } from '../constants/theme';

// ── Order Memory: previous orders for a customer ──────────────
function OrderMemory({ customer, orders, onRepeat }) {
  const [expanded, setExpanded] = useState(false);
  if (!customer) return null;

  const prevOrders = orders
    .filter(o => o.customerId === customer.id)
    .sort((a, b) => b.createdAt - a.createdAt)
    .slice(0, 3);

  if (prevOrders.length === 0) return null;

  const last = prevOrders[0];
  const daysAgo = Math.floor((Date.now() - last.createdAt) / 86400000);

  return (
    <View style={om.wrap}>
      <TouchableOpacity style={om.header} onPress={() => setExpanded(e => !e)} activeOpacity={0.8}>
        <View style={{ flex: 1 }}>
          <Text style={om.title}>📦 Previous Orders ({prevOrders.length})</Text>
          <Text style={om.sub}>Last order: {daysAgo === 0 ? 'Today' : daysAgo === 1 ? 'Yesterday' : `${daysAgo} days ago`}</Text>
        </View>
        <Text style={om.chevron}>{expanded ? '▲' : '▼'}</Text>
      </TouchableOpacity>

      {expanded && prevOrders.map((order, idx) => (
        <View key={order.id} style={om.orderRow}>
          <View style={{ flex: 1 }}>
            <Text style={om.orderId}>{order.id} · {new Date(order.createdAt).toLocaleDateString('en-PK', { day: '2-digit', month: 'short' })}</Text>
            <Text style={om.orderItems} numberOfLines={2}>
              {order.items?.map(i => `${i.productName} ×${i.quantity}`).join(' · ')}
            </Text>
            <Text style={om.orderTotal}>Rs.{(order.grandTotal || 0).toLocaleString()}</Text>
          </View>
          {idx === 0 && (
            <TouchableOpacity style={om.repeatBtn} onPress={() => onRepeat(order.items)}>
              <Text style={om.repeatBtnTxt}>↩ Repeat</Text>
            </TouchableOpacity>
          )}
        </View>
      ))}
    </View>
  );
}

const om = StyleSheet.create({
  wrap: {
    backgroundColor: '#fffbeb', borderRadius: 12, marginBottom: 12,
    borderWidth: 1.5, borderColor: '#fde68a', overflow: 'hidden',
  },
  header:   { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 12 },
  title:    { fontSize: 13, fontWeight: '700', color: '#92400e' },
  sub:      { fontSize: 11, color: '#a16207', marginTop: 1 },
  chevron:  { fontSize: 11, color: '#a16207', fontWeight: '700' },
  orderRow: {
    flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 10,
    borderTopWidth: 1, borderTopColor: '#fde68a', backgroundColor: '#fff9e6',
  },
  orderId:    { fontSize: 10, fontWeight: '700', color: '#a16207', marginBottom: 3 },
  orderItems: { fontSize: 11, color: '#92400e', lineHeight: 16 },
  orderTotal: { fontSize: 12, fontWeight: '800', color: '#a16207', marginTop: 3 },
  repeatBtn:  { backgroundColor: '#f59e0b', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 7, marginLeft: 8 },
  repeatBtnTxt: { color: '#fff', fontSize: 11, fontWeight: '700' },
});

function fmtCurrency(n) {
  return 'Rs.' + (n || 0).toLocaleString();
}

// ── Customer Picker Modal ─────────────────────────────────────
function CustomerPicker({ visible, customers, routes, onSelect, onClose }) {
  const [q, setQ] = useState('');
  const filtered = useMemo(() => {
    if (!q.trim()) return customers;
    const low = q.toLowerCase();
    return customers.filter(c =>
      c.name?.toLowerCase().includes(low) || c.phone?.includes(q)
    );
  }, [customers, q]);

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={or.pickerOverlay}>
        <View style={or.pickerCard}>
          <View style={or.pickerHeader}>
            <Text style={or.pickerTitle}>👥 Select Customer</Text>
            <TouchableOpacity onPress={onClose}>
              <Text style={{ fontSize: 20, color: C.textLight }}>✕</Text>
            </TouchableOpacity>
          </View>
          <View style={or.pickerSearch}>
            <Text>🔍</Text>
            <TextInput
              style={or.pickerSearchInput}
              placeholder="Search by name or phone..."
              value={q}
              onChangeText={setQ}
              placeholderTextColor="#94a3b8"
              autoFocus
            />
          </View>
          <ScrollView style={{ flex: 1 }}>
            {filtered.map(c => {
              const route = routes.find(r => r.id === c.routeId);
              return (
                <TouchableOpacity key={c.id} style={or.pickerItem} onPress={() => { onSelect(c); onClose(); setQ(''); }}>
                  <View style={or.pickerAvatar}>
                    <Text style={or.pickerAvatarTxt}>{c.name?.[0]?.toUpperCase() || '?'}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={or.pickerName}>{c.name}</Text>
                    <Text style={or.pickerSub}>{c.phone} · {route?.name || '—'}</Text>
                  </View>
                </TouchableOpacity>
              );
            })}
            {filtered.length === 0 && (
              <View style={{ padding: 32, alignItems: 'center' }}>
                <Text style={{ color: C.textLight }}>No customers found</Text>
              </View>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

// ── Product Picker Modal ──────────────────────────────────────
function ProductPicker({ visible, products, onSelect, onClose }) {
  const [q, setQ] = useState('');
  const filtered = useMemo(() => {
    if (!q.trim()) return products;
    const low = q.toLowerCase();
    return products.filter(p =>
      p.name?.toLowerCase().includes(low) || p.category?.toLowerCase().includes(low)
    );
  }, [products, q]);

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={or.pickerOverlay}>
        <View style={or.pickerCard}>
          <View style={or.pickerHeader}>
            <Text style={or.pickerTitle}>📦 Select Product</Text>
            <TouchableOpacity onPress={onClose}>
              <Text style={{ fontSize: 20, color: C.textLight }}>✕</Text>
            </TouchableOpacity>
          </View>
          <View style={or.pickerSearch}>
            <Text>🔍</Text>
            <TextInput
              style={or.pickerSearchInput}
              placeholder="Search products..."
              value={q}
              onChangeText={setQ}
              placeholderTextColor="#94a3b8"
              autoFocus
            />
          </View>
          <ScrollView style={{ flex: 1 }}>
            {filtered.map(p => (
              <TouchableOpacity
                key={p.id}
                style={[or.pickerItem, !p.inStock && { opacity: 0.45 }]}
                onPress={() => { if (p.inStock !== false) { onSelect(p); onClose(); setQ(''); } }}
                disabled={p.inStock === false}
              >
                <View style={{ flex: 1 }}>
                  <Text style={or.pickerName}>{p.name}</Text>
                  <Text style={or.pickerSub}>{p.unit} · {p.category}</Text>
                </View>
                <Text style={or.pickerPrice}>{fmtCurrency(p.price)}</Text>
              </TouchableOpacity>
            ))}
            {filtered.length === 0 && (
              <View style={{ padding: 32, alignItems: 'center' }}>
                <Text style={{ color: C.textLight }}>No products found</Text>
              </View>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

// ── Bill Preview & WhatsApp Modal ─────────────────────────────
function BillModal({ visible, order, onClose, onNewOrder }) {
  const { t } = useLang();
  if (!order) return null;

  const shareOnWhatsApp = () => {
    let msg = `*DAWOOD TRADER*\n${t('billNo')} ${order.id}\n\n`;
    msg += `*${t('customers')}:* ${order.customerName}\n`;
    msg += `📞 ${order.customerPhone}\n`;
    msg += `📍 ${order.customerAddress}\n\n`;
    msg += `*Products:*\n`;
    order.items.forEach(item => {
      msg += `• ${item.productName}\n`;
      msg += `  ${item.quantity} × ${fmtCurrency(item.rate)} = *${fmtCurrency(item.lineTotal)}*\n`;
    });
    msg += `\n*${t('grandTotal')}: ${fmtCurrency(order.grandTotal)}*\n`;
    if (order.paidAmount > 0) msg += `${t('paidAmount')}: ${fmtCurrency(order.paidAmount)}\n`;
    if (order.remaining > 0) msg += `${t('remaining')}: ${fmtCurrency(order.remaining)}\n`;
    msg += `\n${t('thankYou')} 🙏`;

    const url = Platform.OS === 'web'
      ? `https://api.whatsapp.com/send?text=${encodeURIComponent(msg)}`
      : `whatsapp://send?text=${encodeURIComponent(msg)}`;
    Linking.openURL(url).catch(() => Alert.alert('Error', 'WhatsApp open nahi ho saka'));
  };

  const statusMap = {
    paid:    { bg: '#dcfce7', color: '#15803d', label: 'Paid' },
    partial: { bg: '#fef9c3', color: '#a16207', label: 'Partial' },
    unpaid:  { bg: '#fee2e2', color: '#b91c1c', label: 'Unpaid' },
  };
  const st = statusMap[order.status] || statusMap.unpaid;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={or.billOverlay}>
        <View style={or.billCard}>
          <ScrollView showsVerticalScrollIndicator={false}>
            {/* Header */}
            <View style={or.billHeader}>
              <Text style={or.billLogo}>🛒 DAWOOD TRADER</Text>
              <Text style={or.billId}>{t('billNo')} {order.id}</Text>
              <View style={[or.billStatusBadge, { backgroundColor: st.bg }]}>
                <Text style={[or.billStatusTxt, { color: st.color }]}>{st.label}</Text>
              </View>
            </View>

            {/* Customer */}
            <View style={or.billSection}>
              <Text style={or.billSectionTitle}>Customer Details</Text>
              <Text style={or.billCustomerName}>{order.customerName}</Text>
              <Text style={or.billDetail}>📞 {order.customerPhone}</Text>
              <Text style={or.billDetail}>📍 {order.customerAddress}</Text>
            </View>

            {/* Items */}
            <View style={or.billSection}>
              <Text style={or.billSectionTitle}>Items</Text>
              {order.items.map((item, i) => (
                <View key={i} style={or.billItemRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={or.billItemName}>{item.productName}</Text>
                    <Text style={or.billItemCalc}>{item.quantity} × {fmtCurrency(item.rate)}</Text>
                  </View>
                  <Text style={or.billItemTotal}>{fmtCurrency(item.lineTotal)}</Text>
                </View>
              ))}
              <View style={or.billDivider} />
              <View style={or.billTotalRow}>
                <Text style={or.billTotalLabel}>{t('grandTotal')}</Text>
                <Text style={or.billTotalValue}>{fmtCurrency(order.grandTotal)}</Text>
              </View>
              {order.paidAmount > 0 && (
                <View style={or.billTotalRow}>
                  <Text style={[or.billTotalLabel, { color: C.textLight }]}>{t('paidAmount')}</Text>
                  <Text style={[or.billTotalValue, { color: '#15803d' }]}>{fmtCurrency(order.paidAmount)}</Text>
                </View>
              )}
              {order.remaining > 0 && (
                <View style={or.billTotalRow}>
                  <Text style={[or.billTotalLabel, { color: '#b91c1c' }]}>{t('remaining')}</Text>
                  <Text style={[or.billTotalValue, { color: '#b91c1c' }]}>{fmtCurrency(order.remaining)}</Text>
                </View>
              )}
            </View>

            <Text style={or.billThankYou}>{t('thankYou')} 🙏</Text>
          </ScrollView>

          {/* Buttons */}
          <View style={or.billBtns}>
            <TouchableOpacity style={or.whatsappBtn} onPress={shareOnWhatsApp} activeOpacity={0.85}>
              <Text style={{ fontSize: 18 }}>💬</Text>
              <Text style={or.whatsappBtnTxt}>{t('shareWhatsApp')}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={or.newOrderBtn} onPress={onNewOrder}>
              <Text style={or.newOrderBtnTxt}>New Order</Text>
            </TouchableOpacity>
          </View>
          <TouchableOpacity style={or.closeBillBtn} onPress={onClose}>
            <Text style={or.closeBillBtnTxt}>Close</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

// ── Main OrdersScreen ─────────────────────────────────────────
export default function OrdersScreen({ switchTab, navigation }) {
  const { products, customers, orders, ROUTES, createOrder, getStock } = useAppData();
  const { t } = useLang();
  const { showToast } = useToast();
  const { width } = useWindowDimensions();
  const isWide = width >= 768;

  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [items, setItems] = useState([]);
  const [paidAmount, setPaidAmount] = useState('');
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);
  const [savedOrder, setSavedOrder] = useState(null);
  const [showBill, setShowBill] = useState(false);
  const [showCustomerPicker, setShowCustomerPicker] = useState(false);
  const [showProductPicker, setShowProductPicker] = useState(false);

  const grandTotal = useMemo(() =>
    items.reduce((s, item) => s + (item.lineTotal || 0), 0),
  [items]);

  const remaining = useMemo(() => {
    const paid = Number(paidAmount) || 0;
    return Math.max(0, grandTotal - paid);
  }, [grandTotal, paidAmount]);

  const addItem = useCallback((product) => {
    setItems(prev => {
      const existing = prev.find(i => i.productId === product.id);
      if (existing) {
        return prev.map(i =>
          i.productId === product.id
            ? { ...i, quantity: i.quantity + 1, lineTotal: (i.quantity + 1) * i.rate }
            : i
        );
      }
      return [...prev, {
        productId:   product.id,
        productName: product.unit ? `${product.name} ${product.unit}` : product.name,
        unit:        product.unit,
        quantity:    1,
        rate:        product.price,
        lineTotal:   product.price,
      }];
    });
  }, []);

  const removeItem = useCallback((productId) => {
    setItems(prev => prev.filter(i => i.productId !== productId));
  }, []);

  const updateQty = useCallback((productId, qty) => {
    const n = parseInt(qty) || 0;
    if (n <= 0) { removeItem(productId); return; }
    setItems(prev => prev.map(i =>
      i.productId === productId
        ? { ...i, quantity: n, lineTotal: n * i.rate }
        : i
    ));
  }, [removeItem]);

  const updateRate = useCallback((productId, rate) => {
    const r = parseFloat(rate) || 0;
    setItems(prev => prev.map(i =>
      i.productId === productId
        ? { ...i, rate: r, lineTotal: i.quantity * r }
        : i
    ));
  }, []);

  const resetForm = () => {
    setSelectedCustomer(null);
    setItems([]);
    setPaidAmount('');
    setNote('');
  };

  const repeatOrder = useCallback((prevItems) => {
    setItems(prevItems.map(item => ({ ...item })));
    showToast('Previous order items loaded!', 'success');
  }, [showToast]);

  const handleSave = async () => {
    if (!selectedCustomer) { showToast('Please select a customer', 'error'); return; }
    if (items.length === 0) { showToast('Please add at least one item', 'error'); return; }
    const paid = Number(paidAmount) || 0;
    setSaving(true);
    try {
      const order = await createOrder({
        customerId:      selectedCustomer.id,
        customerName:    selectedCustomer.name,
        customerPhone:   selectedCustomer.phone,
        customerAddress: selectedCustomer.address,
        routeId:         selectedCustomer.routeId,
        items,
        grandTotal,
        paidAmount:      paid,
        remaining:       Math.max(0, grandTotal - paid),
        note,
      });
      setSavedOrder(order);
      setShowBill(true);
      showToast(t('orderCreated'), 'success');
    } catch {
      showToast('Could not save order', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleNewOrder = () => {
    setShowBill(false);
    setSavedOrder(null);
    resetForm();
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={or.root}>

        {/* Header */}
        <View style={or.header}>
          {!switchTab && (
            <TouchableOpacity style={or.backBtn} onPress={() => navigation.goBack()}>
              <Text style={or.backText}>‹ Back</Text>
            </TouchableOpacity>
          )}
          <View style={{ flex: 1 }}>
            <Text style={or.headerTitle}>📝 {t('newOrder')}</Text>
            <Text style={or.headerSub}>Create bill for customer</Text>
          </View>
          {items.length > 0 && (
            <TouchableOpacity style={or.resetBtn} onPress={() => {
              if (Platform.OS === 'web') {
                if (window.confirm('Reset the form?')) resetForm();
              } else {
                Alert.alert('Reset?', 'Clear all items?', [
                  { text: 'Cancel', style: 'cancel' },
                  { text: 'Reset', style: 'destructive', onPress: resetForm },
                ]);
              }
            }}>
              <Text style={or.resetBtnTxt}>↺ Reset</Text>
            </TouchableOpacity>
          )}
        </View>

        <ScrollView style={{ flex: 1 }} contentContainerStyle={or.body} keyboardShouldPersistTaps="handled">

          {/* Customer Selector */}
          <Text style={or.sectionLabel}>STEP 1 — SELECT CUSTOMER</Text>
          <TouchableOpacity
            style={[or.customerBox, selectedCustomer && or.customerBoxFilled]}
            onPress={() => setShowCustomerPicker(true)}
            activeOpacity={0.8}
          >
            {selectedCustomer ? (
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <View style={or.custAvatar}>
                  <Text style={or.custAvatarTxt}>{selectedCustomer.name?.[0]?.toUpperCase()}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={or.custName}>{selectedCustomer.name}</Text>
                  <Text style={or.custSub}>{selectedCustomer.phone} · {ROUTES.find(r => r.id === selectedCustomer.routeId)?.name}</Text>
                </View>
                <Text style={{ color: C.primary, fontWeight: '700' }}>Change ›</Text>
              </View>
            ) : (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                <Text style={{ fontSize: 24 }}>👥</Text>
                <View>
                  <Text style={or.custPlaceholder}>{t('selectCustomer')}</Text>
                  <Text style={or.custPlaceholderSub}>Tap to choose from customer list</Text>
                </View>
              </View>
            )}
          </TouchableOpacity>

          {/* Order Memory — show previous orders for selected customer */}
          <OrderMemory
            customer={selectedCustomer}
            orders={orders}
            onRepeat={repeatOrder}
          />

          {/* Items */}
          <View style={or.stepHeader}>
            <Text style={or.sectionLabel}>STEP 2 — ADD ITEMS</Text>
            <TouchableOpacity style={or.addItemBtn} onPress={() => setShowProductPicker(true)}>
              <Text style={or.addItemBtnTxt}>+ {t('addItem')}</Text>
            </TouchableOpacity>
          </View>

          {items.length === 0 ? (
            <TouchableOpacity style={or.emptyItems} onPress={() => setShowProductPicker(true)}>
              <Text style={{ fontSize: 32 }}>📦</Text>
              <Text style={or.emptyItemsTxt}>Tap to add products</Text>
            </TouchableOpacity>
          ) : (
            <View style={or.itemsCard}>
              {/* Table header */}
              <View style={or.tableHead}>
                <Text style={[or.thTxt, { flex: 3 }]}>Product</Text>
                <Text style={[or.thTxt, { width: 60, textAlign: 'center' }]}>Qty</Text>
                <Text style={[or.thTxt, { width: 80, textAlign: 'right' }]}>Rate</Text>
                <Text style={[or.thTxt, { width: 84, textAlign: 'right' }]}>Total</Text>
                <View style={{ width: 28 }} />
              </View>

              {items.map((item, idx) => (
                <View key={item.productId} style={[or.tableRow, idx % 2 === 1 && or.tableRowAlt]}>
                  <View style={{ flex: 3 }}>
                    <Text style={or.tdName} numberOfLines={2}>{item.productName}</Text>
                  </View>
                  <TextInput
                    style={or.qtyInput}
                    value={item.quantity.toString()}
                    onChangeText={v => updateQty(item.productId, v)}
                    keyboardType="numeric"
                    selectTextOnFocus
                  />
                  <TextInput
                    style={or.rateInput}
                    value={item.rate.toString()}
                    onChangeText={v => updateRate(item.productId, v)}
                    keyboardType="numeric"
                    selectTextOnFocus
                  />
                  <Text style={or.tdTotal}>{fmtCurrency(item.lineTotal)}</Text>
                  <TouchableOpacity style={or.removeBtn} onPress={() => removeItem(item.productId)}>
                    <Text style={{ color: '#b91c1c', fontSize: 14, fontWeight: '800' }}>✕</Text>
                  </TouchableOpacity>
                </View>
              ))}

              {/* Grand Total */}
              <View style={or.totalBox}>
                <Text style={or.totalLabel}>{t('grandTotal')}</Text>
                <Text style={or.totalValue}>{fmtCurrency(grandTotal)}</Text>
              </View>
            </View>
          )}

          {/* Payment */}
          {items.length > 0 && (
            <>
              <Text style={[or.sectionLabel, { marginTop: 16 }]}>STEP 3 — PAYMENT</Text>
              <View style={or.paymentCard}>
                <View style={or.payRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={or.payLabel}>{t('totalBill')}</Text>
                    <Text style={or.payBig}>{fmtCurrency(grandTotal)}</Text>
                  </View>
                </View>

                <View style={or.payRow}>
                  <Text style={or.payLabel}>{t('paidAmount')} (optional)</Text>
                  <View style={or.payInputWrap}>
                    <Text style={or.payRs}>Rs.</Text>
                    <TextInput
                      style={or.payInput}
                      value={paidAmount}
                      onChangeText={setPaidAmount}
                      keyboardType="numeric"
                      placeholder="0"
                      placeholderTextColor="#94a3b8"
                    />
                  </View>
                </View>

                <View style={or.payRow}>
                  <Text style={or.payLabel}>{t('remaining')}</Text>
                  <Text style={[or.payBig, { color: remaining > 0 ? '#b91c1c' : '#15803d' }]}>
                    {fmtCurrency(remaining)}
                  </Text>
                </View>

                <View style={{ marginTop: 8 }}>
                  <Text style={or.payLabel}>Note (optional)</Text>
                  <TextInput
                    style={or.noteInput}
                    value={note}
                    onChangeText={setNote}
                    placeholder="Order note..."
                    placeholderTextColor="#94a3b8"
                    multiline
                    numberOfLines={2}
                  />
                </View>
              </View>
            </>
          )}

          {/* Save */}
          {items.length > 0 && selectedCustomer && (
            <TouchableOpacity
              style={[or.saveBtn, saving && { opacity: 0.6 }]}
              onPress={handleSave}
              disabled={saving}
              activeOpacity={0.85}
            >
              {saving
                ? <ActivityIndicator color="#fff" />
                : (
                  <>
                    <Text style={{ fontSize: 20 }}>✅</Text>
                    <Text style={or.saveBtnTxt}>{t('createBill')}</Text>
                    <Text style={or.saveBtnSub}>{fmtCurrency(grandTotal)}</Text>
                  </>
                )}
            </TouchableOpacity>
          )}

          <View style={{ height: 60 }} />
        </ScrollView>

        {/* Pickers */}
        <CustomerPicker
          visible={showCustomerPicker}
          customers={customers}
          routes={ROUTES}
          onSelect={setSelectedCustomer}
          onClose={() => setShowCustomerPicker(false)}
        />
        <ProductPicker
          visible={showProductPicker}
          products={products}
          onSelect={addItem}
          onClose={() => setShowProductPicker(false)}
        />

        {/* Bill Modal */}
        <BillModal
          visible={showBill}
          order={savedOrder}
          onClose={() => setShowBill(false)}
          onNewOrder={handleNewOrder}
        />
      </View>
    </KeyboardAvoidingView>
  );
}

const or = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#eef2f9' },

  header: {
    backgroundColor: C.primary,
    paddingTop: Platform.OS === 'web' ? 20 : 54,
    paddingBottom: 16, paddingHorizontal: 16,
    flexDirection: 'row', alignItems: 'center',
  },
  headerTitle: { color: '#fff', fontSize: 20, fontWeight: '800' },
  headerSub:   { color: 'rgba(255,255,255,0.65)', fontSize: 11, marginTop: 2 },
  backBtn:     { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, backgroundColor: 'rgba(255,255,255,0.15)', marginRight: 12 },
  backText:    { color: '#fff', fontSize: 14, fontWeight: '600' },
  resetBtn:    { backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 7 },
  resetBtnTxt: { color: '#fff', fontWeight: '700', fontSize: 12 },

  body: { padding: 16, paddingBottom: 40 },

  sectionLabel: { fontSize: 11, fontWeight: '800', color: '#64748b', letterSpacing: 0.8, marginBottom: 8 },
  stepHeader:   { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 16, marginBottom: 8 },
  addItemBtn:   { backgroundColor: C.primary, borderRadius: 8, paddingHorizontal: 14, paddingVertical: 7 },
  addItemBtnTxt:{ color: '#fff', fontWeight: '700', fontSize: 12 },

  customerBox: {
    backgroundColor: '#fff', borderRadius: 14, padding: 16, borderWidth: 2,
    borderColor: '#e2e8f0', borderStyle: 'dashed',
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 4, elevation: 2,
  },
  customerBoxFilled: { borderStyle: 'solid', borderColor: C.primary },
  custAvatar:       { width: 42, height: 42, borderRadius: 21, backgroundColor: C.primary, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  custAvatarTxt:    { color: '#fff', fontSize: 18, fontWeight: '800' },
  custName:         { fontSize: 15, fontWeight: '700', color: C.text },
  custSub:          { fontSize: 12, color: C.textLight, marginTop: 2 },
  custPlaceholder:  { fontSize: 15, fontWeight: '700', color: C.textMid },
  custPlaceholderSub: { fontSize: 11, color: C.textLight, marginTop: 2 },

  emptyItems: {
    backgroundColor: '#fff', borderRadius: 14, padding: 32, alignItems: 'center',
    gap: 8, borderWidth: 2, borderColor: '#e2e8f0', borderStyle: 'dashed',
  },
  emptyItemsTxt: { color: C.textLight, fontSize: 14, fontWeight: '500' },

  itemsCard: {
    backgroundColor: '#fff', borderRadius: 14, overflow: 'hidden',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 3,
  },
  tableHead: {
    flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12,
    paddingVertical: 10, backgroundColor: '#f1f5f9', borderBottomWidth: 1, borderBottomColor: '#e2e8f0',
  },
  thTxt: { fontSize: 10, fontWeight: '700', color: '#64748b' },
  tableRow:    { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  tableRowAlt: { backgroundColor: '#fafbff' },
  tdName:  { fontSize: 12, fontWeight: '600', color: C.text },
  qtyInput:  { width: 60, textAlign: 'center', borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 7, paddingVertical: 5, fontSize: 13, fontWeight: '600', color: C.text, backgroundColor: '#f8fafc' },
  rateInput: { width: 80, textAlign: 'right', borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 7, paddingVertical: 5, paddingRight: 6, fontSize: 12, color: C.text, backgroundColor: '#f8fafc' },
  tdTotal:   { width: 84, textAlign: 'right', fontSize: 12, fontWeight: '700', color: C.primary },
  removeBtn: { width: 28, alignItems: 'center' },

  totalBox: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 14,
    backgroundColor: '#eff6ff', borderTopWidth: 2, borderTopColor: '#bfdbfe',
  },
  totalLabel: { fontSize: 14, fontWeight: '700', color: C.text },
  totalValue: { fontSize: 20, fontWeight: '800', color: C.primary },

  paymentCard: {
    backgroundColor: '#fff', borderRadius: 14, padding: 16,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 6, elevation: 2,
  },
  payRow:      { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  payLabel:    { fontSize: 12, fontWeight: '600', color: C.textMid, marginBottom: 3 },
  payBig:      { fontSize: 18, fontWeight: '800', color: C.text },
  payInputWrap:{ flexDirection: 'row', alignItems: 'center', borderWidth: 1.5, borderColor: C.primary, borderRadius: 10, paddingHorizontal: 10, backgroundColor: '#eff6ff' },
  payRs:       { fontSize: 13, fontWeight: '700', color: C.primary, marginRight: 4 },
  payInput:    { fontSize: 16, fontWeight: '700', color: C.primary, paddingVertical: 8, minWidth: 80 },
  noteInput:   { borderWidth: 1.5, borderColor: '#e2e8f0', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 9, fontSize: 13, color: C.text, marginTop: 4, textAlignVertical: 'top', height: 60 },

  saveBtn: {
    backgroundColor: C.primary, borderRadius: 16, paddingVertical: 18, marginTop: 20,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10,
    shadowColor: C.primary, shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.3, shadowRadius: 12, elevation: 8,
  },
  saveBtnTxt: { color: '#fff', fontSize: 17, fontWeight: '800' },
  saveBtnSub: { color: 'rgba(255,255,255,0.7)', fontSize: 13, fontWeight: '600' },

  /* Pickers */
  pickerOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  pickerCard: {
    backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24,
    height: '70%', overflow: 'hidden',
  },
  pickerHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    padding: 18, borderBottomWidth: 1, borderBottomColor: '#f1f5f9',
  },
  pickerTitle:       { fontSize: 17, fontWeight: '800', color: C.text },
  pickerSearch:      { flexDirection: 'row', alignItems: 'center', margin: 14, backgroundColor: '#f4f7fc', borderRadius: 12, paddingHorizontal: 12, gap: 8, borderWidth: 1.5, borderColor: '#e2e8f0' },
  pickerSearchInput: { flex: 1, paddingVertical: 10, fontSize: 14, color: C.text },
  pickerItem:        { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#f8fafc' },
  pickerAvatar:      { width: 38, height: 38, borderRadius: 19, backgroundColor: C.primary, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  pickerAvatarTxt:   { color: '#fff', fontSize: 16, fontWeight: '800' },
  pickerName:        { fontSize: 14, fontWeight: '600', color: C.text },
  pickerSub:         { fontSize: 11, color: C.textLight, marginTop: 2 },
  pickerPrice:       { fontSize: 14, fontWeight: '700', color: C.primary },

  /* Bill Modal */
  billOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', padding: 16 },
  billCard: {
    backgroundColor: '#fff', borderRadius: 20, padding: 0, maxHeight: '90%',
    overflow: 'hidden',
  },
  billHeader:        { backgroundColor: C.primary, padding: 20, alignItems: 'center' },
  billLogo:          { color: '#fff', fontSize: 18, fontWeight: '800', marginBottom: 4 },
  billId:            { color: 'rgba(255,255,255,0.7)', fontSize: 12 },
  billStatusBadge:   { marginTop: 8, borderRadius: 8, paddingHorizontal: 14, paddingVertical: 5 },
  billStatusTxt:     { fontSize: 12, fontWeight: '800' },
  billSection:       { padding: 16, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  billSectionTitle:  { fontSize: 10, fontWeight: '700', color: '#94a3b8', letterSpacing: 1, marginBottom: 8 },
  billCustomerName:  { fontSize: 16, fontWeight: '800', color: C.text, marginBottom: 4 },
  billDetail:        { fontSize: 13, color: C.textMid, marginBottom: 2 },
  billItemRow:       { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#f8fafc' },
  billItemName:      { fontSize: 13, fontWeight: '600', color: C.text },
  billItemCalc:      { fontSize: 11, color: C.textLight, marginTop: 2 },
  billItemTotal:     { fontSize: 14, fontWeight: '700', color: C.primary },
  billDivider:       { height: 1, backgroundColor: '#e2e8f0', marginVertical: 8 },
  billTotalRow:      { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  billTotalLabel:    { fontSize: 14, fontWeight: '700', color: C.text },
  billTotalValue:    { fontSize: 18, fontWeight: '800', color: C.primary },
  billThankYou:      { textAlign: 'center', fontSize: 14, fontWeight: '600', color: C.textLight, padding: 16 },

  billBtns:       { flexDirection: 'row', gap: 10, paddingHorizontal: 16, paddingTop: 12 },
  whatsappBtn:    { flex: 2, backgroundColor: '#25D366', borderRadius: 12, paddingVertical: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  whatsappBtnTxt: { color: '#fff', fontWeight: '800', fontSize: 14 },
  newOrderBtn:    { flex: 1, backgroundColor: C.primary, borderRadius: 12, paddingVertical: 14, alignItems: 'center', justifyContent: 'center' },
  newOrderBtnTxt: { color: '#fff', fontWeight: '700', fontSize: 13 },
  closeBillBtn:   { marginHorizontal: 16, marginVertical: 10, backgroundColor: '#f1f5f9', borderRadius: 12, paddingVertical: 12, alignItems: 'center' },
  closeBillBtnTxt:{ color: C.textMid, fontWeight: '700' },
});
