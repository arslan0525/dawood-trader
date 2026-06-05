import React, { useState, useMemo, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  TextInput, Modal, Platform, Alert, Linking, useWindowDimensions,
} from 'react-native';
import { useAppData } from '../context/AppDataContext';
import { useLang } from '../context/LanguageContext';
import { useToast } from '../context/ToastContext';
import { C } from '../constants/theme';

function fmtDate(ts) {
  if (!ts) return '—';
  return new Date(ts).toLocaleDateString('en-PK', { day: '2-digit', month: 'short', year: 'numeric' });
}
function fmtCurrency(n) { return 'Rs.' + (n || 0).toLocaleString(); }

function StatusBadge({ status }) {
  const map = {
    paid:    { bg: '#dcfce7', color: '#15803d', label: 'Paid' },
    partial: { bg: '#fef9c3', color: '#a16207', label: 'Partial' },
    unpaid:  { bg: '#fee2e2', color: '#b91c1c', label: 'Unpaid' },
  };
  const s = map[status] || map.unpaid;
  return (
    <View style={[oh.badge, { backgroundColor: s.bg }]}>
      <Text style={[oh.badgeTxt, { color: s.color }]}>{s.label}</Text>
    </View>
  );
}

function BillDetailModal({ visible, order, routes, onClose, onAddPayment }) {
  const { t } = useLang();
  const [payAmt, setPayAmt] = useState('');
  const [payNote, setPayNote] = useState('');
  const [paying, setPaying] = useState(false);
  const [showPayForm, setShowPayForm] = useState(false);
  const { addPayment } = useAppData();
  const { showToast } = useToast();

  if (!order) return null;
  const route = routes.find(r => r.id === order.routeId);

  const handlePay = async () => {
    const amt = Number(payAmt);
    if (!amt || amt <= 0) { showToast('Enter valid amount', 'error'); return; }
    if (amt > order.remaining) { showToast(`Amount cannot exceed remaining ${fmtCurrency(order.remaining)}`, 'error'); return; }
    setPaying(true);
    try {
      await addPayment(order.id, amt, payNote);
      showToast(t('paymentAdded'), 'success');
      setPayAmt(''); setPayNote(''); setShowPayForm(false);
      onAddPayment?.();
    } catch { showToast('Could not record payment', 'error'); }
    finally { setPaying(false); }
  };

  const shareWhatsApp = () => {
    let msg = `*DAWOOD TRADER*\n${t('billNo')} ${order.id}\n\n`;
    msg += `*Customer:* ${order.customerName}\n`;
    msg += `📞 ${order.customerPhone}\n📍 ${order.customerAddress}\n\n`;
    msg += `*Products:*\n`;
    order.items?.forEach(item => {
      msg += `• ${item.productName}\n  ${item.quantity} × ${fmtCurrency(item.rate)} = *${fmtCurrency(item.lineTotal)}*\n`;
    });
    msg += `\n*Grand Total: ${fmtCurrency(order.grandTotal)}*`;
    if (order.remaining > 0) msg += `\nRemaining: ${fmtCurrency(order.remaining)}`;
    msg += `\n\nThank You! 🙏`;
    const url = Platform.OS === 'web'
      ? `https://api.whatsapp.com/send?text=${encodeURIComponent(msg)}`
      : `whatsapp://send?text=${encodeURIComponent(msg)}`;
    Linking.openURL(url).catch(() => {});
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={oh.billOverlay}>
        <View style={oh.billCard}>
          {/* Header */}
          <View style={oh.billTop}>
            <View style={{ flex: 1 }}>
              <Text style={oh.billId}>{t('billNo')} {order.id}</Text>
              <Text style={oh.billDate}>{fmtDate(order.createdAt)}</Text>
            </View>
            <StatusBadge status={order.status} />
            <TouchableOpacity style={oh.closeBtn} onPress={onClose}>
              <Text style={{ fontSize: 18, color: C.textLight }}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            {/* Customer */}
            <View style={oh.section}>
              <Text style={oh.secTitle}>Customer</Text>
              <Text style={oh.custName}>{order.customerName}</Text>
              <Text style={oh.custSub}>📞 {order.customerPhone}</Text>
              <Text style={oh.custSub}>📍 {order.customerAddress}</Text>
              {route && (
                <View style={[oh.routePill, { backgroundColor: route.color }]}>
                  <Text style={[oh.routePillTxt, { color: route.textColor }]}>{route.name}</Text>
                </View>
              )}
            </View>

            {/* Items */}
            <View style={oh.section}>
              <Text style={oh.secTitle}>Items ({order.items?.length || 0})</Text>
              {order.items?.map((item, i) => (
                <View key={i} style={oh.itemRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={oh.itemName}>{item.productName}</Text>
                    <Text style={oh.itemCalc}>{item.quantity} × {fmtCurrency(item.rate)}</Text>
                  </View>
                  <Text style={oh.itemTotal}>{fmtCurrency(item.lineTotal)}</Text>
                </View>
              ))}
              <View style={oh.divider} />
              <View style={oh.sumRow}>
                <Text style={oh.sumLabel}>{t('grandTotal')}</Text>
                <Text style={oh.sumValue}>{fmtCurrency(order.grandTotal)}</Text>
              </View>
              <View style={oh.sumRow}>
                <Text style={[oh.sumLabel, { color: '#15803d' }]}>{t('paidAmount')}</Text>
                <Text style={[oh.sumValue, { color: '#15803d' }]}>{fmtCurrency(order.paidAmount)}</Text>
              </View>
              <View style={oh.sumRow}>
                <Text style={[oh.sumLabel, { color: order.remaining > 0 ? '#b91c1c' : '#15803d' }]}>{t('remaining')}</Text>
                <Text style={[oh.sumValue, { color: order.remaining > 0 ? '#b91c1c' : '#15803d' }]}>
                  {fmtCurrency(order.remaining)}
                </Text>
              </View>
            </View>

            {/* Add Payment form */}
            {order.remaining > 0 && (
              <View style={oh.section}>
                <Text style={oh.secTitle}>{t('addPayment')}</Text>
                {showPayForm ? (
                  <View>
                    <View style={oh.payRow}>
                      <Text style={oh.payLabel}>Amount (max {fmtCurrency(order.remaining)})</Text>
                      <View style={oh.payInputBox}>
                        <Text style={oh.payRs}>Rs.</Text>
                        <TextInput
                          style={oh.payInput}
                          value={payAmt}
                          onChangeText={setPayAmt}
                          keyboardType="numeric"
                          placeholder="0"
                          placeholderTextColor="#94a3b8"
                          autoFocus
                        />
                      </View>
                    </View>
                    <TextInput
                      style={oh.noteInput}
                      value={payNote}
                      onChangeText={setPayNote}
                      placeholder="Payment note (optional)"
                      placeholderTextColor="#94a3b8"
                    />
                    <View style={{ flexDirection: 'row', gap: 10, marginTop: 10 }}>
                      <TouchableOpacity style={oh.cancelPayBtn} onPress={() => { setShowPayForm(false); setPayAmt(''); }}>
                        <Text style={{ color: C.textMid, fontWeight: '700' }}>{t('cancel')}</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[oh.confirmPayBtn, paying && { opacity: 0.6 }]}
                        onPress={handlePay} disabled={paying}
                      >
                        <Text style={{ color: '#fff', fontWeight: '800' }}>
                          {paying ? 'Saving...' : 'Record Payment'}
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                ) : (
                  <TouchableOpacity style={oh.addPayBtn} onPress={() => setShowPayForm(true)}>
                    <Text style={oh.addPayBtnTxt}>+ {t('addPayment')}</Text>
                  </TouchableOpacity>
                )}
              </View>
            )}
          </ScrollView>

          {/* Actions */}
          <View style={oh.billBtns}>
            <TouchableOpacity style={oh.waBtn} onPress={shareWhatsApp}>
              <Text>💬</Text>
              <Text style={oh.waBtnTxt}>WhatsApp</Text>
            </TouchableOpacity>
            <TouchableOpacity style={oh.closeMainBtn} onPress={onClose}>
              <Text style={oh.closeMainBtnTxt}>{t('close')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

export default function OrderHistoryScreen({ switchTab, viewCustomer, navigation }) {
  const { orders, customers, ROUTES, deleteOrder, updateOrder, products } = useAppData();
  const { t } = useLang();
  const { showToast } = useToast();
  const { width } = useWindowDimensions();

  const [search, setSearch]               = useState('');
  const [routeFilter, setRouteFilter]     = useState(0);
  const [statusFilter, setStatusFilter]   = useState('all');
  const [customerFilter, setCustomerFilter] = useState('');
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showDetail, setShowDetail]       = useState(false);
  const [showEdit, setShowEdit]           = useState(false);
  const [editOrder, setEditOrder]         = useState(null);
  const [editItems, setEditItems]         = useState([]);
  const [editNote, setEditNote]           = useState('');
  const [editPaid, setEditPaid]           = useState('');
  const [savingEdit, setSavingEdit]       = useState(false);

  const filtered = useMemo(() => {
    let list = [...orders];
    if (routeFilter) list = list.filter(o => o.routeId === routeFilter);
    if (statusFilter !== 'all') list = list.filter(o => o.status === statusFilter);
    if (customerFilter) list = list.filter(o => o.customerId === customerFilter);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(o =>
        o.customerName?.toLowerCase().includes(q) ||
        o.id?.toLowerCase().includes(q) ||
        o.items?.some(i => i.productName?.toLowerCase().includes(q))
      );
    }
    return list.sort((a, b) => b.createdAt - a.createdAt);
  }, [orders, search, routeFilter, statusFilter, customerFilter]);

  const totalSales = useMemo(() => filtered.reduce((s, o) => s + o.grandTotal, 0), [filtered]);
  const totalOutstanding = useMemo(() => filtered.reduce((s, o) => s + (o.remaining || 0), 0), [filtered]);

  const openDetail = (order) => { setSelectedOrder(order); setShowDetail(true); };

  const handleDelete = useCallback((order) => {
    const doDelete = async () => {
      try {
        await deleteOrder(order.id);
        showToast('Bill delete ho gaya', 'success');
        setShowDetail(false);
      } catch { showToast('Delete nahi ho saka', 'error'); }
    };
    if (Platform.OS === 'web') {
      if (window.confirm(`Bill ${order.id} permanently delete karein?`)) doDelete();
    } else {
      Alert.alert('Bill Delete?', `${order.customerName} ka bill permanently delete ho jaega`, [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: doDelete },
      ]);
    }
  }, [deleteOrder, showToast]);

  const openEdit = useCallback((order) => {
    setEditOrder(order);
    setEditItems(order.items?.map(i => ({ ...i, rate: i.rate ?? i.lineTotal / i.quantity })) || []);
    setEditNote(order.note || '');
    setEditPaid(String(order.paidAmount || 0));
    setShowEdit(true);
    setShowDetail(false);
  }, []);

  const editGrandTotal = useMemo(() =>
    editItems.reduce((s, i) => s + (Number(i.quantity) * Number(i.rate || i.lineTotal / i.quantity || 0)), 0),
    [editItems]
  );

  const handleSaveEdit = useCallback(async () => {
    if (!editOrder) return;
    setSavingEdit(true);
    try {
      const recalcItems = editItems.map(i => ({
        ...i,
        quantity: Number(i.quantity),
        rate:     Number(i.rate),
        lineTotal: Number(i.quantity) * Number(i.rate),
      }));
      const grandTotal = recalcItems.reduce((s, i) => s + i.lineTotal, 0);
      const paidAmount = Number(editPaid) || 0;
      await updateOrder(editOrder.id, {
        ...editOrder,
        items:       recalcItems,
        grandTotal,
        paidAmount,
        note:        editNote,
      });
      showToast('Bill update ho gaya!', 'success');
      setShowEdit(false);
    } catch { showToast('Update nahi ho saka', 'error'); }
    finally { setSavingEdit(false); }
  }, [editOrder, editItems, editNote, editPaid, updateOrder, showToast]);

  return (
    <View style={oh.root}>
      {/* Header */}
      <View style={oh.header}>
        {!switchTab && (
          <TouchableOpacity style={oh.backBtn} onPress={() => navigation.goBack()}>
            <Text style={oh.backText}>‹ Back</Text>
          </TouchableOpacity>
        )}
        <View style={{ flex: 1 }}>
          <Text style={oh.headerTitle}>📋 {t('orderHistory')}</Text>
          <Text style={oh.headerSub}>{filtered.length} orders</Text>
        </View>
        <View style={{ alignItems: 'flex-end' }}>
          <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: 10 }}>Total Sales</Text>
          <Text style={{ color: '#fff', fontSize: 14, fontWeight: '800' }}>{fmtCurrency(totalSales)}</Text>
        </View>
      </View>

      {/* Search */}
      <View style={oh.searchRow}>
        <View style={oh.searchBox}>
          <Text>🔍</Text>
          <TextInput
            style={oh.searchInput}
            placeholder="Search by customer, bill no, product..."
            value={search}
            onChangeText={setSearch}
            placeholderTextColor="#94a3b8"
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch('')}>
              <Text style={{ color: '#94a3b8', fontWeight: '800' }}>✕</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Filters */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={oh.filterBar} contentContainerStyle={oh.filterRow}>
        {/* Status filter */}
        {['all', 'unpaid', 'partial', 'paid'].map(s => (
          <TouchableOpacity
            key={s}
            style={[oh.filterChip, statusFilter === s && oh.filterChipActive]}
            onPress={() => setStatusFilter(s)}
          >
            <Text style={[oh.filterChipTxt, statusFilter === s && oh.filterChipTxtActive]}>
              {s === 'all' ? 'All' : s.charAt(0).toUpperCase() + s.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
        <View style={oh.filterDivider} />
        {/* Route filter */}
        <TouchableOpacity
          style={[oh.filterChip, routeFilter === 0 && oh.filterChipActive]}
          onPress={() => setRouteFilter(0)}
        >
          <Text style={[oh.filterChipTxt, routeFilter === 0 && oh.filterChipTxtActive]}>All Routes</Text>
        </TouchableOpacity>
        {ROUTES.map(r => (
          <TouchableOpacity
            key={r.id}
            style={[oh.filterChip, routeFilter === r.id && { backgroundColor: r.color, borderColor: r.textColor + '44' }]}
            onPress={() => setRouteFilter(r.id)}
          >
            <Text style={[oh.filterChipTxt, routeFilter === r.id && { color: r.textColor, fontWeight: '700' }]}>{r.name}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Summary row */}
      {filtered.length > 0 && (
        <View style={oh.summaryBar}>
          <Text style={oh.summaryTxt}>{filtered.length} orders · Sales: {fmtCurrency(totalSales)}</Text>
          {totalOutstanding > 0 && (
            <Text style={oh.summaryDebt}>Outstanding: {fmtCurrency(totalOutstanding)}</Text>
          )}
        </View>
      )}

      {/* List */}
      <ScrollView style={{ flex: 1 }} contentContainerStyle={oh.list} showsVerticalScrollIndicator>
        {filtered.length === 0 ? (
          <View style={oh.empty}>
            <Text style={{ fontSize: 52 }}>📋</Text>
            <Text style={oh.emptyTitle}>{search ? t('noData') : t('noOrders')}</Text>
            <TouchableOpacity style={oh.emptyBtn} onPress={() => switchTab ? switchTab('NewOrder') : navigation?.navigate('Orders')}>
              <Text style={oh.emptyBtnTxt}>+ {t('newOrder')}</Text>
            </TouchableOpacity>
          </View>
        ) : filtered.map(order => (
          <TouchableOpacity key={order.id} style={oh.card} onPress={() => openDetail(order)} activeOpacity={0.85}>
            <View style={oh.cardTop}>
              <View style={{ flex: 1 }}>
                <TouchableOpacity onPress={() => viewCustomer?.(order.customerId)}>
                  <Text style={[oh.cardCustomer, viewCustomer && { color: C.primary, textDecorationLine: 'underline' }]} numberOfLines={1}>{order.customerName}</Text>
                </TouchableOpacity>
                <Text style={oh.cardId}>{order.id} · {fmtDate(order.createdAt)}</Text>
                <Text style={oh.cardRoute}>{ROUTES.find(r => r.id === order.routeId)?.name || '—'}</Text>
              </View>
              <View style={{ alignItems: 'flex-end', gap: 4 }}>
                <Text style={oh.cardTotal}>{fmtCurrency(order.grandTotal)}</Text>
                <StatusBadge status={order.status} />
              </View>
            </View>
            {order.remaining > 0 && (
              <View style={oh.cardDebtRow}>
                <Text style={oh.cardDebt}>Due: {fmtCurrency(order.remaining)}</Text>
                <Text style={oh.cardPaid}>Paid: {fmtCurrency(order.paidAmount)}</Text>
              </View>
            )}
            <Text style={oh.cardItems} numberOfLines={1}>
              {order.items?.map(i => i.productName).join(', ')}
            </Text>
            {/* Edit / Delete actions */}
            <View style={oh.cardActions}>
              <TouchableOpacity style={oh.editBtn} onPress={(e) => { e?.stopPropagation?.(); openEdit(order); }}>
                <Text style={oh.editBtnTxt}>✏️ Edit</Text>
              </TouchableOpacity>
              <TouchableOpacity style={oh.deleteBtn} onPress={(e) => { e?.stopPropagation?.(); handleDelete(order); }}>
                <Text style={oh.deleteBtnTxt}>🗑️ Delete</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Detail Modal */}
      <BillDetailModal
        visible={showDetail}
        order={selectedOrder}
        routes={ROUTES}
        onClose={() => setShowDetail(false)}
        onAddPayment={() => {
          const updated = orders.find(o => o.id === selectedOrder?.id);
          if (updated) setSelectedOrder(updated);
        }}
      />

      {/* ── Edit Bill Modal ── */}
      <Modal visible={showEdit} transparent animationType="slide" onRequestClose={() => setShowEdit(false)}>
        <View style={oh.editOverlay}>
          <View style={oh.editCard}>
            {/* Header */}
            <View style={oh.editHeader}>
              <Text style={oh.editTitle}>✏️ Edit Bill</Text>
              <Text style={oh.editSub}>{editOrder?.customerName} · {editOrder?.id}</Text>
              <TouchableOpacity style={oh.editCloseBtn} onPress={() => setShowEdit(false)}>
                <Text style={{ fontSize: 18, color: '#94a3b8' }}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={{ padding: 16 }} keyboardShouldPersistTaps="handled">
              {/* Items */}
              <Text style={oh.editSectionLabel}>ITEMS</Text>
              {editItems.map((item, idx) => (
                <View key={idx} style={oh.editItem}>
                  <Text style={oh.editItemName} numberOfLines={1}>{item.productName}</Text>
                  <View style={oh.editItemRow}>
                    <View style={{ flex: 1, marginRight: 8 }}>
                      <Text style={oh.editFieldLabel}>Qty</Text>
                      <TextInput
                        style={oh.editInput}
                        value={String(item.quantity)}
                        onChangeText={v => {
                          const updated = [...editItems];
                          updated[idx] = { ...updated[idx], quantity: v };
                          setEditItems(updated);
                        }}
                        keyboardType="numeric"
                        selectTextOnFocus
                      />
                    </View>
                    <View style={{ flex: 1, marginRight: 8 }}>
                      <Text style={oh.editFieldLabel}>Rate (Rs.)</Text>
                      <TextInput
                        style={oh.editInput}
                        value={String(item.rate ?? Math.round(item.lineTotal / item.quantity))}
                        onChangeText={v => {
                          const updated = [...editItems];
                          updated[idx] = { ...updated[idx], rate: v };
                          setEditItems(updated);
                        }}
                        keyboardType="numeric"
                        selectTextOnFocus
                      />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={oh.editFieldLabel}>Total</Text>
                      <View style={oh.editTotalBox}>
                        <Text style={oh.editTotalTxt}>
                          Rs.{(Number(item.quantity) * Number(item.rate || item.lineTotal / item.quantity || 0)).toLocaleString()}
                        </Text>
                      </View>
                    </View>
                    <TouchableOpacity
                      style={oh.removeItemBtn}
                      onPress={() => setEditItems(editItems.filter((_, i) => i !== idx))}
                    >
                      <Text style={{ color: '#dc2626', fontSize: 16 }}>✕</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))}

              {/* Grand Total */}
              <View style={oh.editTotalRow}>
                <Text style={oh.editTotalLabel}>Grand Total</Text>
                <Text style={oh.editGrandTotal}>Rs.{editGrandTotal.toLocaleString()}</Text>
              </View>

              {/* Paid Amount */}
              <Text style={[oh.editSectionLabel, { marginTop: 16 }]}>PAYMENT</Text>
              <View style={oh.editInputGroup}>
                <Text style={oh.editFieldLabel}>Amount Paid (Rs.)</Text>
                <TextInput
                  style={oh.editInput}
                  value={editPaid}
                  onChangeText={setEditPaid}
                  keyboardType="numeric"
                  placeholder="0"
                  selectTextOnFocus
                />
              </View>
              <View style={oh.editRemainingRow}>
                <Text style={oh.editFieldLabel}>Remaining</Text>
                <Text style={[oh.editGrandTotal, { color: editGrandTotal - Number(editPaid) > 0 ? '#dc2626' : '#15803d', fontSize: 16 }]}>
                  Rs.{Math.max(0, editGrandTotal - Number(editPaid)).toLocaleString()}
                </Text>
              </View>

              {/* Note */}
              <Text style={[oh.editSectionLabel, { marginTop: 16 }]}>NOTE</Text>
              <TextInput
                style={[oh.editInput, { height: 70, textAlignVertical: 'top' }]}
                value={editNote}
                onChangeText={setEditNote}
                placeholder="Note (optional)"
                multiline
              />
            </ScrollView>

            {/* Save Button */}
            <View style={{ padding: 16, borderTopWidth: 1, borderTopColor: '#e2e8f0' }}>
              <TouchableOpacity
                style={[oh.saveEditBtn, savingEdit && { opacity: 0.6 }]}
                onPress={handleSaveEdit}
                disabled={savingEdit}
              >
                <Text style={oh.saveEditBtnTxt}>{savingEdit ? 'Saving...' : '✅ Save Changes'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const oh = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#eef2f9' },

  header: {
    backgroundColor: C.primary,
    paddingTop: Platform.OS === 'web' ? 20 : 54,
    paddingBottom: 16, paddingHorizontal: 16,
    flexDirection: 'row', alignItems: 'center',
  },
  headerTitle: { color: '#fff', fontSize: 20, fontWeight: '800' },
  headerSub:   { color: 'rgba(255,255,255,0.6)', fontSize: 11, marginTop: 2 },
  backBtn:     { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, backgroundColor: 'rgba(255,255,255,0.15)', marginRight: 12 },
  backText:    { color: '#fff', fontSize: 14, fontWeight: '600' },

  searchRow:   { backgroundColor: '#fff', paddingHorizontal: 14, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#e2e8f0' },
  searchBox:   { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f4f7fc', borderRadius: 12, borderWidth: 1.5, borderColor: '#e2e8f0', paddingHorizontal: 12, gap: 8 },
  searchInput: { flex: 1, paddingVertical: 9, fontSize: 14, color: C.text },

  filterBar: { backgroundColor: '#fff', maxHeight: 50, borderBottomWidth: 1, borderBottomColor: '#e2e8f0' },
  filterRow: { flexDirection: 'row', paddingHorizontal: 12, paddingVertical: 7, gap: 6, alignItems: 'center' },
  filterChip:      { paddingHorizontal: 12, paddingVertical: 5, borderRadius: 14, borderWidth: 1.5, borderColor: '#e2e8f0', backgroundColor: '#fff' },
  filterChipActive:{ backgroundColor: '#eff6ff', borderColor: C.primary },
  filterChipTxt:   { fontSize: 11, fontWeight: '500', color: '#64748b' },
  filterChipTxtActive: { color: C.primary, fontWeight: '700' },
  filterDivider:   { width: 1, height: 20, backgroundColor: '#e2e8f0', marginHorizontal: 4 },

  summaryBar: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 8, backgroundColor: '#f8fafc', borderBottomWidth: 1, borderBottomColor: '#e2e8f0' },
  summaryTxt:  { fontSize: 11, color: C.textLight, fontWeight: '600' },
  summaryDebt: { fontSize: 11, color: '#b91c1c', fontWeight: '700' },

  list: { padding: 14, paddingBottom: 80 },

  card: {
    backgroundColor: '#fff', borderRadius: 14, padding: 14, marginBottom: 10,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 6, elevation: 3,
  },
  cardTop:      { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 6 },
  cardCustomer: { fontSize: 15, fontWeight: '700', color: C.text },
  cardId:       { fontSize: 11, color: C.textLight, marginTop: 2 },
  cardRoute:    { fontSize: 11, color: C.textMid, marginTop: 2 },
  cardTotal:    { fontSize: 16, fontWeight: '800', color: C.primary },
  cardDebtRow:  { flexDirection: 'row', gap: 12, marginBottom: 4 },
  cardDebt:     { fontSize: 11, fontWeight: '700', color: '#b91c1c' },
  cardPaid:     { fontSize: 11, fontWeight: '600', color: '#15803d' },
  cardItems:    { fontSize: 11, color: C.textLight },

  badge:    { borderRadius: 6, paddingHorizontal: 8, paddingVertical: 2 },
  badgeTxt: { fontSize: 10, fontWeight: '700' },

  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 60, gap: 10 },
  emptyTitle:  { fontSize: 16, fontWeight: '700', color: C.textMid },
  emptyBtn:    { backgroundColor: C.primary, borderRadius: 10, paddingHorizontal: 24, paddingVertical: 12, marginTop: 4 },
  emptyBtnTxt: { color: '#fff', fontWeight: '700', fontSize: 14 },

  /* Bill Detail Modal */
  billOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.55)', justifyContent: 'flex-end' },
  billCard: {
    backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24,
    maxHeight: '90%', overflow: 'hidden',
  },
  billTop: {
    flexDirection: 'row', alignItems: 'center', padding: 16,
    borderBottomWidth: 1, borderBottomColor: '#f1f5f9', gap: 8,
  },
  billId:   { fontSize: 14, fontWeight: '700', color: C.text },
  billDate: { fontSize: 11, color: C.textLight, marginTop: 2 },
  closeBtn: { padding: 4, marginLeft: 4 },

  section:  { padding: 16, borderBottomWidth: 1, borderBottomColor: '#f8fafc' },
  secTitle: { fontSize: 10, fontWeight: '700', color: '#94a3b8', letterSpacing: 1, marginBottom: 8 },
  custName: { fontSize: 16, fontWeight: '800', color: C.text, marginBottom: 4 },
  custSub:  { fontSize: 13, color: C.textMid, marginBottom: 2 },
  routePill: { alignSelf: 'flex-start', borderRadius: 6, paddingHorizontal: 10, paddingVertical: 4, marginTop: 6 },
  routePillTxt: { fontSize: 11, fontWeight: '700' },
  itemRow:  { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#f8fafc' },
  itemName: { fontSize: 13, fontWeight: '600', color: C.text },
  itemCalc: { fontSize: 11, color: C.textLight, marginTop: 2 },
  itemTotal:{ fontSize: 14, fontWeight: '700', color: C.primary },
  divider:  { height: 1, backgroundColor: '#e2e8f0', marginVertical: 8 },
  sumRow:   { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  sumLabel: { fontSize: 13, fontWeight: '700', color: C.text },
  sumValue: { fontSize: 16, fontWeight: '800', color: C.primary },

  payRow:     { marginBottom: 10 },
  payLabel:   { fontSize: 12, fontWeight: '600', color: C.textMid, marginBottom: 6 },
  payInputBox:{ flexDirection: 'row', alignItems: 'center', borderWidth: 1.5, borderColor: C.primary, borderRadius: 10, paddingHorizontal: 12, backgroundColor: '#eff6ff' },
  payRs:      { fontSize: 13, fontWeight: '700', color: C.primary, marginRight: 4 },
  payInput:   { flex: 1, fontSize: 16, fontWeight: '700', color: C.primary, paddingVertical: 10 },
  noteInput:  { borderWidth: 1.5, borderColor: '#e2e8f0', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 9, fontSize: 13, color: C.text },
  cancelPayBtn:  { flex: 1, backgroundColor: '#f1f5f9', borderRadius: 10, paddingVertical: 12, alignItems: 'center' },
  confirmPayBtn: { flex: 2, backgroundColor: '#15803d', borderRadius: 10, paddingVertical: 12, alignItems: 'center' },
  addPayBtn:     { backgroundColor: '#eff6ff', borderRadius: 10, paddingVertical: 12, alignItems: 'center', borderWidth: 1.5, borderColor: C.primary },
  addPayBtnTxt:  { color: C.primary, fontWeight: '700', fontSize: 14 },

  billBtns:    { flexDirection: 'row', gap: 10, padding: 16, borderTopWidth: 1, borderTopColor: '#f1f5f9' },
  waBtn:       { flex: 1, backgroundColor: '#25D366', borderRadius: 12, paddingVertical: 13, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 },
  waBtnTxt:    { color: '#fff', fontWeight: '700', fontSize: 14 },
  closeMainBtn:    { flex: 1, backgroundColor: '#f1f5f9', borderRadius: 12, paddingVertical: 13, alignItems: 'center' },
  closeMainBtnTxt: { color: C.textMid, fontWeight: '700', fontSize: 14 },

  /* Card Edit/Delete actions */
  cardActions: { flexDirection: 'row', gap: 8, marginTop: 8, paddingTop: 8, borderTopWidth: 1, borderTopColor: '#f1f5f9' },
  editBtn:     { flex: 1, backgroundColor: '#eff6ff', borderRadius: 8, paddingVertical: 7, alignItems: 'center', borderWidth: 1, borderColor: '#bfdbfe' },
  editBtnTxt:  { color: C.primary, fontSize: 12, fontWeight: '700' },
  deleteBtn:   { flex: 1, backgroundColor: '#fff5f5', borderRadius: 8, paddingVertical: 7, alignItems: 'center', borderWidth: 1, borderColor: '#fecaca' },
  deleteBtnTxt:{ color: '#dc2626', fontSize: 12, fontWeight: '700' },

  /* Edit Bill Modal */
  editOverlay:  { flex: 1, backgroundColor: 'rgba(0,0,0,0.55)', justifyContent: 'flex-end' },
  editCard:     { backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: '92%' },
  editHeader:   { padding: 20, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  editTitle:    { fontSize: 18, fontWeight: '800', color: '#0f172a' },
  editSub:      { fontSize: 12, color: '#64748b', marginTop: 2 },
  editCloseBtn: { position: 'absolute', top: 16, right: 16, padding: 6 },
  editSectionLabel: { fontSize: 10, fontWeight: '800', color: '#94a3b8', letterSpacing: 1, marginBottom: 8 },
  editItem:     { backgroundColor: '#f8fafc', borderRadius: 10, padding: 12, marginBottom: 8, borderWidth: 1, borderColor: '#e2e8f0' },
  editItemName: { fontSize: 13, fontWeight: '700', color: '#0f172a', marginBottom: 8 },
  editItemRow:  { flexDirection: 'row', alignItems: 'center', gap: 4 },
  editFieldLabel:{ fontSize: 10, color: '#64748b', fontWeight: '600', marginBottom: 4 },
  editInput:    { backgroundColor: '#fff', borderRadius: 8, borderWidth: 1.5, borderColor: '#e2e8f0', paddingHorizontal: 10, paddingVertical: 8, fontSize: 14, color: '#0f172a' },
  editInputGroup:{ marginBottom: 12 },
  editTotalBox: { backgroundColor: '#eff6ff', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 8, borderWidth: 1, borderColor: '#bfdbfe' },
  editTotalTxt: { fontSize: 13, fontWeight: '700', color: C.primary },
  editTotalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#f8fafc', borderRadius: 10, padding: 14, marginTop: 4, borderWidth: 1, borderColor: '#e2e8f0' },
  editTotalLabel:{ fontSize: 14, fontWeight: '700', color: '#0f172a' },
  editGrandTotal:{ fontSize: 20, fontWeight: '800', color: C.primary },
  editRemainingRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 },
  removeItemBtn:{ padding: 6, marginLeft: 4 },
  saveEditBtn:  { backgroundColor: C.primary, borderRadius: 14, paddingVertical: 16, alignItems: 'center' },
  saveEditBtnTxt:{ color: '#fff', fontSize: 16, fontWeight: '800' },
});
