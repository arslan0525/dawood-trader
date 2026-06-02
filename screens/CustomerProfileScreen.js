import React, { useState, useMemo } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  Platform, Alert, Modal, TextInput, ActivityIndicator,
  Linking, useWindowDimensions,
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
    paid:    { bg: '#dcfce7', color: '#15803d', label: 'Paid'    },
    partial: { bg: '#fef9c3', color: '#a16207', label: 'Partial' },
    unpaid:  { bg: '#fee2e2', color: '#b91c1c', label: 'Unpaid'  },
  };
  const s = map[status] || map.unpaid;
  return (
    <View style={[cp.badge, { backgroundColor: s.bg }]}>
      <Text style={[cp.badgeTxt, { color: s.color }]}>{s.label}</Text>
    </View>
  );
}

function PaymentModal({ visible, order, onClose, onSuccess }) {
  const { addPayment } = useAppData();
  const { showToast }  = useToast();
  const [amt, setAmt]  = useState('');
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);

  React.useEffect(() => { if (visible) { setAmt(''); setNote(''); } }, [visible]);
  if (!order) return null;

  const handlePay = async () => {
    const n = Number(amt);
    if (!n || n <= 0) { showToast('Enter valid amount', 'error'); return; }
    if (n > order.remaining) { showToast(`Max ${fmtCurrency(order.remaining)}`, 'error'); return; }
    setSaving(true);
    try {
      await addPayment(order.id, n, note);
      showToast('Payment recorded!', 'success');
      onSuccess?.();
      onClose();
    } catch { showToast('Could not record', 'error'); }
    finally { setSaving(false); }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={cp.payOverlay}>
        <View style={cp.payCard}>
          <Text style={cp.payTitle}>💰 Record Payment</Text>
          <Text style={cp.paySub}>{order.customerName} — {order.id}</Text>
          <View style={cp.payInfo}>
            <View style={cp.payInfoRow}>
              <Text style={cp.payInfoLabel}>Total</Text>
              <Text style={cp.payInfoVal}>{fmtCurrency(order.grandTotal)}</Text>
            </View>
            <View style={cp.payInfoRow}>
              <Text style={cp.payInfoLabel}>Paid</Text>
              <Text style={[cp.payInfoVal, { color: '#15803d' }]}>{fmtCurrency(order.paidAmount)}</Text>
            </View>
            <View style={[cp.payInfoRow, { borderTopWidth: 1, borderTopColor: '#e2e8f0', paddingTop: 8, marginTop: 4 }]}>
              <Text style={[cp.payInfoLabel, { fontWeight: '800', color: '#b91c1c' }]}>Remaining</Text>
              <Text style={[cp.payInfoVal, { color: '#b91c1c', fontSize: 18 }]}>{fmtCurrency(order.remaining)}</Text>
            </View>
          </View>
          <Text style={cp.payLabel}>Amount *</Text>
          <View style={cp.payInputRow}>
            <Text style={cp.payRs}>Rs.</Text>
            <TextInput
              style={cp.payInput}
              value={amt}
              onChangeText={setAmt}
              keyboardType="numeric"
              placeholder={order.remaining.toString()}
              placeholderTextColor="#94a3b8"
              autoFocus
            />
            <TouchableOpacity onPress={() => setAmt(order.remaining.toString())} style={cp.payFullBtn}>
              <Text style={cp.payFullTxt}>Full</Text>
            </TouchableOpacity>
          </View>
          <TextInput
            style={cp.payNote}
            value={note}
            onChangeText={setNote}
            placeholder="Note (optional)..."
            placeholderTextColor="#94a3b8"
          />
          <View style={cp.payBtns}>
            <TouchableOpacity style={cp.payCancelBtn} onPress={onClose}>
              <Text style={cp.payCancelTxt}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[cp.paySaveBtn, saving && { opacity: 0.6 }]} onPress={handlePay} disabled={saving}>
              {saving ? <ActivityIndicator color="#fff" size="small" /> : <Text style={cp.paySaveTxt}>Record</Text>}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

export default function CustomerProfileScreen({ customerId, switchTab, onClose }) {
  const { customers, orders, payments, ROUTES, updateCustomer, deleteCustomer } = useAppData();
  const { t }          = useLang();
  const { showToast }  = useToast();
  const { width }      = useWindowDimensions();
  const isWide         = width >= 768;

  const [payOrder, setPayOrder]   = useState(null);
  const [showPay, setShowPay]     = useState(false);
  const [editMode, setEditMode]   = useState(false);
  const [editForm, setEditForm]   = useState({});
  const [saving, setSaving]       = useState(false);
  const [activeTab, setActiveTab] = useState('orders'); // orders | payments | info

  const customer = useMemo(() =>
    customers.find(c => c.id === customerId), [customers, customerId]);

  const customerOrders = useMemo(() =>
    orders.filter(o => o.customerId === customerId)
      .sort((a, b) => b.createdAt - a.createdAt),
    [orders, customerId]);

  const customerPayments = useMemo(() =>
    payments.filter(p => customerOrders.some(o => o.id === p.orderId))
      .sort((a, b) => b.date - a.date),
    [payments, customerOrders]);

  const stats = useMemo(() => ({
    totalBilled:  customerOrders.reduce((s, o) => s + (o.grandTotal || 0), 0),
    totalPaid:    customerOrders.reduce((s, o) => s + (o.paidAmount  || 0), 0),
    totalDue:     customerOrders.reduce((s, o) => s + (o.remaining   || 0), 0),
    orderCount:   customerOrders.length,
  }), [customerOrders]);

  const route = ROUTES.find(r => r.id === customer?.routeId);

  const shareWhatsApp = (order) => {
    let msg = `*DAWOOD TRADER*\nBill # ${order.id}\n\n`;
    msg += `*Customer:* ${order.customerName}\n📞 ${order.customerPhone}\n📍 ${order.customerAddress}\n\n`;
    msg += `*Items:*\n`;
    order.items?.forEach(i => {
      msg += `• ${i.productName}\n  ${i.quantity} × ${fmtCurrency(i.rate)} = *${fmtCurrency(i.lineTotal)}*\n`;
    });
    msg += `\n*Grand Total: ${fmtCurrency(order.grandTotal)}*`;
    if (order.remaining > 0) msg += `\nRemaining: ${fmtCurrency(order.remaining)}`;
    msg += `\n\nThank You! 🙏`;
    const url = Platform.OS === 'web'
      ? `https://api.whatsapp.com/send?text=${encodeURIComponent(msg)}`
      : `whatsapp://send?text=${encodeURIComponent(msg)}`;
    Linking.openURL(url).catch(() => {});
  };

  const startEdit = () => {
    setEditForm({ ...customer });
    setEditMode(true);
  };

  const saveEdit = async () => {
    if (!editForm.name?.trim()) { showToast('Name required', 'error'); return; }
    setSaving(true);
    try {
      await updateCustomer(customer.id, editForm);
      showToast('Customer updated!', 'success');
      setEditMode(false);
    } catch { showToast('Could not save', 'error'); }
    finally { setSaving(false); }
  };

  const handleDelete = () => {
    const doDelete = async () => {
      try {
        await deleteCustomer(customer.id);
        showToast('Customer deleted', 'success');
        onClose?.();
        switchTab?.('Customers');
      } catch { showToast('Could not delete', 'error'); }
    };
    if (Platform.OS === 'web') {
      if (window.confirm(`Delete "${customer.name}"?`)) doDelete();
    } else {
      Alert.alert('Delete?', `Delete "${customer.name}"?`, [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: doDelete },
      ]);
    }
  };

  if (!customer) {
    return (
      <View style={cp.root}>
        <View style={cp.header}>
          <TouchableOpacity style={cp.backBtn} onPress={() => switchTab?.('Customers')}>
            <Text style={cp.backBtnTxt}>‹ Back</Text>
          </TouchableOpacity>
          <Text style={cp.headerTitle}>Customer Not Found</Text>
        </View>
        <View style={cp.emptyCenter}>
          <Text style={{ fontSize: 48 }}>👤</Text>
          <Text style={cp.emptyTitle}>Customer not found</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={cp.root}>
      {/* Header */}
      <View style={cp.header}>
        <TouchableOpacity style={cp.backBtn} onPress={() => { setEditMode(false); switchTab?.('Customers'); }}>
          <Text style={cp.backBtnTxt}>‹ Back</Text>
        </TouchableOpacity>
        <Text style={cp.headerTitle} numberOfLines={1}>{customer.name}</Text>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          {!editMode ? (
            <>
              <TouchableOpacity style={cp.headerEditBtn} onPress={startEdit}>
                <Text style={cp.headerEditBtnTxt}>✏️ Edit</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={cp.newOrderBtn}
                onPress={() => switchTab?.('NewOrder')}
              >
                <Text style={cp.newOrderBtnTxt}>+ Order</Text>
              </TouchableOpacity>
            </>
          ) : (
            <>
              <TouchableOpacity style={cp.cancelEditBtn} onPress={() => setEditMode(false)}>
                <Text style={cp.cancelEditTxt}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[cp.saveEditBtn, saving && { opacity: 0.6 }]}
                onPress={saveEdit} disabled={saving}
              >
                {saving ? <ActivityIndicator color="#fff" size="small" /> : <Text style={cp.saveEditTxt}>Save</Text>}
              </TouchableOpacity>
            </>
          )}
        </View>
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={cp.body} showsVerticalScrollIndicator={false}>

        {/* Customer Info Card */}
        {editMode ? (
          <View style={cp.editCard}>
            <Text style={cp.editCardTitle}>Edit Customer</Text>
            {[
              { label: 'Name *', field: 'name', placeholder: 'Customer name' },
              { label: 'Phone', field: 'phone', placeholder: '0321-XXXXXXX', keyboardType: 'phone-pad' },
              { label: 'Address', field: 'address', placeholder: 'Full address', multiline: true },
              { label: 'Notes', field: 'notes', placeholder: 'Notes...', multiline: true },
            ].map(({ label, field, placeholder, keyboardType, multiline }) => (
              <View key={field} style={cp.editField}>
                <Text style={cp.editLabel}>{label}</Text>
                <TextInput
                  style={[cp.editInput, multiline && { height: 60, textAlignVertical: 'top' }]}
                  value={editForm[field] || ''}
                  onChangeText={v => setEditForm(f => ({ ...f, [field]: v }))}
                  placeholder={placeholder}
                  placeholderTextColor="#94a3b8"
                  keyboardType={keyboardType || 'default'}
                  multiline={multiline}
                />
              </View>
            ))}
            <Text style={cp.editLabel}>Route</Text>
            <View style={cp.editRouteGrid}>
              {ROUTES.map(r => (
                <TouchableOpacity
                  key={r.id}
                  style={[
                    cp.editRouteChip,
                    editForm.routeId === r.id && { backgroundColor: r.color, borderColor: r.textColor + '66' },
                  ]}
                  onPress={() => setEditForm(f => ({ ...f, routeId: r.id }))}
                >
                  <Text style={[
                    cp.editRouteChipTxt,
                    editForm.routeId === r.id && { color: r.textColor, fontWeight: '700' },
                  ]}>{r.name}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        ) : (
          <View style={cp.profileCard}>
            <View style={cp.avatarWrap}>
              <View style={cp.avatar}>
                <Text style={cp.avatarTxt}>{customer.name?.[0]?.toUpperCase() || '?'}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={cp.profileName}>{customer.name}</Text>
                <Text style={cp.profilePhone}>📞 {customer.phone || '—'}</Text>
                <Text style={cp.profileAddress} numberOfLines={2}>📍 {customer.address || '—'}</Text>
              </View>
            </View>
            <View style={cp.profileMeta}>
              {route && (
                <View style={[cp.routePill, { backgroundColor: route.color }]}>
                  <Text style={[cp.routePillTxt, { color: route.textColor }]}>🗺️ {route.name}</Text>
                </View>
              )}
              {customer.notes ? (
                <View style={cp.notesPill}>
                  <Text style={cp.notesPillTxt}>📝 {customer.notes}</Text>
                </View>
              ) : null}
            </View>
          </View>
        )}

        {/* Stats */}
        <View style={cp.statsRow}>
          <View style={[cp.statCard, { backgroundColor: '#dbeafe' }]}>
            <Text style={cp.statIcon}>📋</Text>
            <Text style={[cp.statVal, { color: C.primary }]}>{stats.orderCount}</Text>
            <Text style={cp.statLbl}>Orders</Text>
          </View>
          <View style={[cp.statCard, { backgroundColor: '#dcfce7' }]}>
            <Text style={cp.statIcon}>💵</Text>
            <Text style={[cp.statVal, { color: '#15803d', fontSize: 13 }]}>{fmtCurrency(stats.totalBilled)}</Text>
            <Text style={cp.statLbl}>Total Billed</Text>
          </View>
          <View style={[cp.statCard, { backgroundColor: '#fef9c3' }]}>
            <Text style={cp.statIcon}>✅</Text>
            <Text style={[cp.statVal, { color: '#a16207', fontSize: 13 }]}>{fmtCurrency(stats.totalPaid)}</Text>
            <Text style={cp.statLbl}>Total Paid</Text>
          </View>
          <View style={[cp.statCard, { backgroundColor: stats.totalDue > 0 ? '#fee2e2' : '#dcfce7' }]}>
            <Text style={cp.statIcon}>{stats.totalDue > 0 ? '⏳' : '🎉'}</Text>
            <Text style={[cp.statVal, { color: stats.totalDue > 0 ? '#b91c1c' : '#15803d', fontSize: 13 }]}>
              {fmtCurrency(stats.totalDue)}
            </Text>
            <Text style={cp.statLbl}>Outstanding</Text>
          </View>
        </View>

        {/* Tabs */}
        <View style={cp.tabRow}>
          {[
            { key: 'orders',   label: `Orders (${customerOrders.length})`   },
            { key: 'payments', label: `Payments (${customerPayments.length})` },
            { key: 'info',     label: 'Info'                                },
          ].map(tb => (
            <TouchableOpacity
              key={tb.key}
              style={[cp.tab, activeTab === tb.key && cp.tabActive]}
              onPress={() => setActiveTab(tb.key)}
            >
              <Text style={[cp.tabTxt, activeTab === tb.key && cp.tabTxtActive]}>{tb.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* ORDERS TAB */}
        {activeTab === 'orders' && (
          customerOrders.length === 0 ? (
            <View style={cp.emptyBox}>
              <Text style={{ fontSize: 40 }}>📋</Text>
              <Text style={cp.emptyTitle}>No orders yet</Text>
              <TouchableOpacity style={cp.emptyBtn} onPress={() => switchTab?.('NewOrder')}>
                <Text style={cp.emptyBtnTxt}>+ Create Order</Text>
              </TouchableOpacity>
            </View>
          ) : customerOrders.map(order => (
            <View key={order.id} style={cp.orderCard}>
              <View style={cp.orderCardTop}>
                <View style={{ flex: 1 }}>
                  <Text style={cp.orderCardId}>{order.id}</Text>
                  <Text style={cp.orderCardDate}>{fmtDate(order.createdAt)}</Text>
                  <Text style={cp.orderCardItems} numberOfLines={2}>
                    {order.items?.map(i => `${i.productName} ×${i.quantity}`).join(' · ')}
                  </Text>
                </View>
                <View style={{ alignItems: 'flex-end', gap: 4 }}>
                  <Text style={cp.orderCardTotal}>{fmtCurrency(order.grandTotal)}</Text>
                  <StatusBadge status={order.status} />
                </View>
              </View>
              {order.remaining > 0 && (
                <View style={cp.orderCardFooter}>
                  <Text style={cp.orderCardDue}>Due: {fmtCurrency(order.remaining)}</Text>
                  <View style={{ flexDirection: 'row', gap: 8 }}>
                    <TouchableOpacity
                      style={cp.collectBtn}
                      onPress={() => { setPayOrder(order); setShowPay(true); }}
                    >
                      <Text style={cp.collectBtnTxt}>💰 Collect</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={cp.waBtn}
                      onPress={() => shareWhatsApp(order)}
                    >
                      <Text style={cp.waBtnTxt}>💬</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}
              {order.remaining === 0 && (
                <View style={cp.orderCardFooterPaid}>
                  <Text style={cp.orderCardPaidTxt}>✅ Fully paid</Text>
                  <TouchableOpacity onPress={() => shareWhatsApp(order)}>
                    <Text style={cp.waBtnSmall}>💬 Share</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          ))
        )}

        {/* PAYMENTS TAB */}
        {activeTab === 'payments' && (
          customerPayments.length === 0 ? (
            <View style={cp.emptyBox}>
              <Text style={{ fontSize: 40 }}>💳</Text>
              <Text style={cp.emptyTitle}>No payments yet</Text>
            </View>
          ) : customerPayments.map(p => {
            const order = customerOrders.find(o => o.id === p.orderId);
            return (
              <View key={p.id} style={cp.payHistCard}>
                <View style={cp.payHistIcon}>
                  <Text style={{ fontSize: 18 }}>💰</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={cp.payHistAmt}>{fmtCurrency(p.amount)}</Text>
                  <Text style={cp.payHistOrder}>Bill: {p.orderId}</Text>
                  {p.note ? <Text style={cp.payHistNote}>📝 {p.note}</Text> : null}
                  <Text style={cp.payHistDate}>{fmtDate(p.date)}</Text>
                </View>
                {order && (
                  <View style={[cp.badge, { backgroundColor: '#dcfce7' }]}>
                    <Text style={[cp.badgeTxt, { color: '#15803d' }]}>Received</Text>
                  </View>
                )}
              </View>
            );
          })
        )}

        {/* INFO TAB */}
        {activeTab === 'info' && (
          <View style={cp.infoCard}>
            {[
              { label: 'Customer Name', value: customer.name, icon: '👤' },
              { label: 'Phone',         value: customer.phone || '—', icon: '📞' },
              { label: 'Address',       value: customer.address || '—', icon: '📍' },
              { label: 'Route',         value: route?.name || '—', icon: '🗺️' },
              { label: 'Notes',         value: customer.notes || '—', icon: '📝' },
              { label: 'Customer Since',value: fmtDate(customer.createdAt), icon: '📅' },
            ].map(({ label, value, icon }) => (
              <View key={label} style={cp.infoRow}>
                <Text style={cp.infoIcon}>{icon}</Text>
                <View style={{ flex: 1 }}>
                  <Text style={cp.infoLabel}>{label}</Text>
                  <Text style={cp.infoValue}>{value}</Text>
                </View>
              </View>
            ))}

            {/* Danger zone */}
            <View style={cp.dangerZone}>
              <Text style={cp.dangerTitle}>⚠️ Danger Zone</Text>
              <TouchableOpacity style={cp.deleteBtn} onPress={handleDelete}>
                <Text style={cp.deleteBtnTxt}>🗑️ Delete Customer</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>

      <PaymentModal
        visible={showPay}
        order={payOrder}
        onClose={() => { setShowPay(false); setPayOrder(null); }}
        onSuccess={() => {}}
      />
    </View>
  );
}

const cp = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#eef2f9' },

  header: {
    backgroundColor: C.primary,
    paddingTop: Platform.OS === 'web' ? 20 : 54,
    paddingBottom: 14, paddingHorizontal: 16,
    flexDirection: 'row', alignItems: 'center', gap: 10,
  },
  backBtn:        { backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 7 },
  backBtnTxt:     { color: '#fff', fontWeight: '700', fontSize: 13 },
  headerTitle:    { flex: 1, color: '#fff', fontSize: 17, fontWeight: '800' },
  headerEditBtn:  { backgroundColor: 'rgba(255,255,255,0.18)', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 7 },
  headerEditBtnTxt: { color: '#fff', fontSize: 12, fontWeight: '700' },
  newOrderBtn:    { backgroundColor: '#fff', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 7 },
  newOrderBtnTxt: { color: C.primary, fontSize: 12, fontWeight: '800' },
  cancelEditBtn:  { backgroundColor: 'rgba(255,255,255,0.18)', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 7 },
  cancelEditTxt:  { color: '#fff', fontSize: 12, fontWeight: '600' },
  saveEditBtn:    { backgroundColor: '#fff', borderRadius: 8, paddingHorizontal: 14, paddingVertical: 7 },
  saveEditTxt:    { color: C.primary, fontSize: 12, fontWeight: '800' },

  body: { padding: 16, paddingBottom: 40 },

  profileCard: {
    backgroundColor: '#fff', borderRadius: 16, padding: 18, marginBottom: 14,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 3,
  },
  avatarWrap:    { flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 12 },
  avatar:        { width: 62, height: 62, borderRadius: 31, backgroundColor: C.primary, justifyContent: 'center', alignItems: 'center', borderWidth: 3, borderColor: '#bfdbfe' },
  avatarTxt:     { color: '#fff', fontSize: 24, fontWeight: '800' },
  profileName:   { fontSize: 20, fontWeight: '800', color: C.text, marginBottom: 3 },
  profilePhone:  { fontSize: 13, color: C.textMid, marginBottom: 2 },
  profileAddress:{ fontSize: 12, color: C.textLight, lineHeight: 18 },
  profileMeta:   { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 4 },
  routePill:     { borderRadius: 8, paddingHorizontal: 12, paddingVertical: 5 },
  routePillTxt:  { fontSize: 11, fontWeight: '700' },
  notesPill:     { backgroundColor: '#fef9c3', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 5, flex: 1 },
  notesPillTxt:  { fontSize: 11, color: '#a16207' },

  statsRow: { flexDirection: 'row', gap: 8, marginBottom: 16 },
  statCard: { flex: 1, borderRadius: 12, padding: 12, alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 4, elevation: 2 },
  statIcon: { fontSize: 18, marginBottom: 4 },
  statVal:  { fontSize: 15, fontWeight: '800', marginBottom: 2, textAlign: 'center' },
  statLbl:  { fontSize: 8, fontWeight: '600', color: C.textLight, textAlign: 'center' },

  tabRow: { flexDirection: 'row', backgroundColor: '#fff', borderRadius: 12, marginBottom: 14, overflow: 'hidden', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 4, elevation: 2 },
  tab:        { flex: 1, paddingVertical: 12, alignItems: 'center', borderBottomWidth: 2, borderBottomColor: 'transparent' },
  tabActive:  { borderBottomColor: C.primary },
  tabTxt:     { fontSize: 11, fontWeight: '600', color: C.textLight },
  tabTxtActive:{ color: C.primary, fontWeight: '800' },

  orderCard: {
    backgroundColor: '#fff', borderRadius: 14, padding: 14, marginBottom: 10,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 6, elevation: 3,
  },
  orderCardTop:    { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 8 },
  orderCardId:     { fontSize: 12, fontWeight: '700', color: C.text },
  orderCardDate:   { fontSize: 11, color: C.textLight, marginTop: 2 },
  orderCardItems:  { fontSize: 11, color: C.textMid, marginTop: 4, lineHeight: 16 },
  orderCardTotal:  { fontSize: 16, fontWeight: '800', color: C.primary },
  orderCardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 8, borderTopWidth: 1, borderTopColor: '#f1f5f9' },
  orderCardDue:    { fontSize: 13, fontWeight: '700', color: '#b91c1c' },
  collectBtn:      { backgroundColor: C.primary, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 6, flexDirection: 'row', alignItems: 'center', gap: 4 },
  collectBtnTxt:   { color: '#fff', fontSize: 12, fontWeight: '700' },
  waBtn:           { backgroundColor: '#25D366', borderRadius: 8, width: 32, height: 32, justifyContent: 'center', alignItems: 'center' },
  waBtnTxt:        { fontSize: 15 },
  waBtnSmall:      { color: '#25D366', fontSize: 12, fontWeight: '700' },
  orderCardFooterPaid: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 8, borderTopWidth: 1, borderTopColor: '#f1f5f9' },
  orderCardPaidTxt:    { fontSize: 12, color: '#15803d', fontWeight: '600' },

  badge:    { borderRadius: 6, paddingHorizontal: 8, paddingVertical: 2 },
  badgeTxt: { fontSize: 10, fontWeight: '700' },

  payHistCard: {
    backgroundColor: '#fff', borderRadius: 12, padding: 14, marginBottom: 8,
    flexDirection: 'row', alignItems: 'center', gap: 12,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 4, elevation: 2,
  },
  payHistIcon:  { width: 40, height: 40, borderRadius: 20, backgroundColor: '#dcfce7', justifyContent: 'center', alignItems: 'center' },
  payHistAmt:   { fontSize: 16, fontWeight: '800', color: '#15803d' },
  payHistOrder: { fontSize: 11, color: C.textLight, marginTop: 2 },
  payHistNote:  { fontSize: 11, color: C.textMid, marginTop: 1 },
  payHistDate:  { fontSize: 10, color: C.textLight, marginTop: 2 },

  infoCard: {
    backgroundColor: '#fff', borderRadius: 16, overflow: 'hidden',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 3,
  },
  infoRow:    { flexDirection: 'row', alignItems: 'flex-start', paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#f8fafc' },
  infoIcon:   { fontSize: 18, marginRight: 12, marginTop: 1 },
  infoLabel:  { fontSize: 11, color: C.textLight, fontWeight: '600', marginBottom: 3 },
  infoValue:  { fontSize: 14, color: C.text, fontWeight: '500', lineHeight: 20 },

  dangerZone:  { margin: 16, backgroundColor: '#fff5f5', borderRadius: 12, padding: 16, borderWidth: 1, borderColor: '#fee2e2' },
  dangerTitle: { fontSize: 12, fontWeight: '700', color: '#b91c1c', marginBottom: 12 },
  deleteBtn:   { backgroundColor: '#fee2e2', borderRadius: 10, paddingVertical: 12, alignItems: 'center', borderWidth: 1, borderColor: '#fecaca' },
  deleteBtnTxt:{ color: '#b91c1c', fontWeight: '700', fontSize: 14 },

  emptyCenter:{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40, gap: 12 },
  emptyBox:   { alignItems: 'center', paddingVertical: 40, gap: 10 },
  emptyTitle: { fontSize: 15, fontWeight: '700', color: C.textMid },
  emptyBtn:   { backgroundColor: C.primary, borderRadius: 10, paddingHorizontal: 24, paddingVertical: 11, marginTop: 4 },
  emptyBtnTxt:{ color: '#fff', fontWeight: '700', fontSize: 14 },

  /* Edit form */
  editCard: {
    backgroundColor: '#fff', borderRadius: 16, padding: 18, marginBottom: 14,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 3,
  },
  editCardTitle: { fontSize: 16, fontWeight: '800', color: C.text, marginBottom: 16 },
  editField:  { marginBottom: 14 },
  editLabel:  { fontSize: 12, fontWeight: '600', color: C.textMid, marginBottom: 6 },
  editInput:  { borderWidth: 1.5, borderColor: '#e2e8f0', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 10, fontSize: 14, color: C.text, backgroundColor: '#f8fafc' },
  editRouteGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 4 },
  editRouteChip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10, borderWidth: 1.5, borderColor: '#e2e8f0', backgroundColor: '#f8fafc' },
  editRouteChipTxt: { fontSize: 12, fontWeight: '500', color: C.textMid },

  /* Payment modal */
  payOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.55)', justifyContent: 'flex-end' },
  payCard: {
    backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24,
    padding: 24, paddingBottom: Platform.OS === 'ios' ? 44 : 24,
  },
  payTitle:   { fontSize: 18, fontWeight: '800', color: C.text, textAlign: 'center', marginBottom: 4 },
  paySub:     { fontSize: 12, color: C.textLight, textAlign: 'center', marginBottom: 16 },
  payInfo:    { backgroundColor: '#f8fafc', borderRadius: 12, padding: 14, marginBottom: 16 },
  payInfoRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  payInfoLabel: { fontSize: 13, color: C.textMid, fontWeight: '600' },
  payInfoVal:   { fontSize: 14, fontWeight: '700', color: C.text },
  payLabel:    { fontSize: 12, fontWeight: '600', color: C.textMid, marginBottom: 6 },
  payInputRow: { flexDirection: 'row', alignItems: 'center', borderWidth: 1.5, borderColor: C.primary, borderRadius: 12, paddingHorizontal: 14, backgroundColor: '#eff6ff', marginBottom: 12 },
  payRs:       { fontSize: 16, fontWeight: '700', color: C.primary, marginRight: 6 },
  payInput:    { flex: 1, fontSize: 20, fontWeight: '800', color: C.primary, paddingVertical: 12 },
  payFullBtn:  { backgroundColor: C.primary, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6 },
  payFullTxt:  { color: '#fff', fontSize: 11, fontWeight: '700' },
  payNote:     { borderWidth: 1.5, borderColor: '#e2e8f0', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, fontSize: 13, color: C.text, marginBottom: 16 },
  payBtns:     { flexDirection: 'row', gap: 12 },
  payCancelBtn:{ flex: 1, backgroundColor: '#f1f5f9', borderRadius: 12, paddingVertical: 14, alignItems: 'center' },
  payCancelTxt:{ color: C.textMid, fontWeight: '700' },
  paySaveBtn:  { flex: 2, backgroundColor: '#15803d', borderRadius: 12, paddingVertical: 14, alignItems: 'center' },
  paySaveTxt:  { color: '#fff', fontWeight: '800', fontSize: 15 },
});
