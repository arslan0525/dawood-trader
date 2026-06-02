import React, { useState, useMemo } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  TextInput, Modal, Platform, Alert, ActivityIndicator,
  useWindowDimensions,
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

function PaymentModal({ visible, order, onClose, onSuccess }) {
  const { addPayment } = useAppData();
  const { showToast } = useToast();
  const { t } = useLang();
  const [amt, setAmt] = useState('');
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
      showToast(t('paymentAdded'), 'success');
      onSuccess?.();
      onClose();
    } catch { showToast('Could not record payment', 'error'); }
    finally { setSaving(false); }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={rc.modalOverlay}>
        <View style={rc.modalCard}>
          <Text style={rc.modalTitle}>💰 Record Payment</Text>
          <Text style={rc.modalSub}>{order.customerName}</Text>

          <View style={rc.amtBox}>
            <View style={rc.amtRow}>
              <Text style={rc.amtLabel}>Total Bill</Text>
              <Text style={rc.amtVal}>{fmtCurrency(order.grandTotal)}</Text>
            </View>
            <View style={rc.amtRow}>
              <Text style={rc.amtLabel}>Already Paid</Text>
              <Text style={[rc.amtVal, { color: '#15803d' }]}>{fmtCurrency(order.paidAmount)}</Text>
            </View>
            <View style={[rc.amtRow, { borderTopWidth: 1, borderTopColor: '#e2e8f0', paddingTop: 8, marginTop: 4 }]}>
              <Text style={[rc.amtLabel, { fontWeight: '800', color: '#b91c1c' }]}>Remaining</Text>
              <Text style={[rc.amtVal, { color: '#b91c1c', fontSize: 18 }]}>{fmtCurrency(order.remaining)}</Text>
            </View>
          </View>

          <Text style={rc.fieldLabel}>Payment Amount *</Text>
          <View style={rc.payInputRow}>
            <Text style={rc.payRs}>Rs.</Text>
            <TextInput
              style={rc.payInput}
              value={amt}
              onChangeText={setAmt}
              keyboardType="numeric"
              placeholder={order.remaining.toString()}
              placeholderTextColor="#94a3b8"
              autoFocus
            />
          </View>

          <TouchableOpacity
            style={rc.fullBtn}
            onPress={() => setAmt(order.remaining.toString())}
          >
            <Text style={rc.fullBtnTxt}>Full Amount ({fmtCurrency(order.remaining)})</Text>
          </TouchableOpacity>

          <Text style={[rc.fieldLabel, { marginTop: 14 }]}>Note (optional)</Text>
          <TextInput
            style={rc.noteInput}
            value={note}
            onChangeText={setNote}
            placeholder="e.g. Cash payment, Bank transfer..."
            placeholderTextColor="#94a3b8"
          />

          <View style={rc.modalBtns}>
            <TouchableOpacity style={rc.cancelBtn} onPress={onClose}>
              <Text style={rc.cancelTxt}>{t('cancel')}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[rc.saveBtn, saving && { opacity: 0.6 }]}
              onPress={handlePay} disabled={saving}
            >
              {saving
                ? <ActivityIndicator color="#fff" size="small" />
                : <Text style={rc.saveTxt}>Record Payment</Text>}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

export default function RecoveryScreen({ switchTab }) {
  const { orders, customers, payments, ROUTES } = useAppData();
  const { t } = useLang();
  const { width } = useWindowDimensions();
  const isWide = width >= 768;

  const [tab, setTab]               = useState('outstanding'); // 'outstanding' | 'history'
  const [search, setSearch]         = useState('');
  const [routeFilter, setRouteFilter] = useState(0);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showPayModal, setShowPayModal]   = useState(false);

  // Outstanding orders (remaining > 0)
  const outstanding = useMemo(() => {
    let list = orders.filter(o => o.remaining > 0);
    if (routeFilter) list = list.filter(o => o.routeId === routeFilter);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(o => o.customerName?.toLowerCase().includes(q));
    }
    return list.sort((a, b) => b.remaining - a.remaining);
  }, [orders, routeFilter, search]);

  // Customer recovery summary
  const customerSummary = useMemo(() => {
    const map = {};
    orders.forEach(o => {
      if (!o.customerId) return;
      if (!map[o.customerId]) {
        map[o.customerId] = {
          customerId: o.customerId,
          customerName: o.customerName,
          routeId: o.routeId,
          totalBilled: 0, totalPaid: 0, totalDue: 0, orderCount: 0,
        };
      }
      map[o.customerId].totalBilled += o.grandTotal || 0;
      map[o.customerId].totalPaid   += o.paidAmount || 0;
      map[o.customerId].totalDue    += o.remaining  || 0;
      map[o.customerId].orderCount  += 1;
    });
    let list = Object.values(map).filter(c => c.totalDue > 0);
    if (routeFilter) list = list.filter(c => c.routeId === routeFilter);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(c => c.customerName?.toLowerCase().includes(q));
    }
    return list.sort((a, b) => b.totalDue - a.totalDue);
  }, [orders, routeFilter, search]);

  const totalOutstanding = useMemo(() => outstanding.reduce((s, o) => s + o.remaining, 0), [outstanding]);
  const totalCollected   = useMemo(() => payments.reduce((s, p) => s + p.amount, 0), [payments]);

  const openPayModal = (order) => { setSelectedOrder(order); setShowPayModal(true); };

  return (
    <View style={rc.root}>
      {/* Header */}
      <View style={rc.header}>
        <View style={{ flex: 1 }}>
          <Text style={rc.headerTitle}>💰 {t('recovery')}</Text>
          <Text style={rc.headerSub}>Payment Recovery Management</Text>
        </View>
      </View>

      {/* Summary Stats */}
      <View style={rc.statsRow}>
        <View style={[rc.statCard, { backgroundColor: '#fee2e2' }]}>
          <Text style={rc.statIcon}>⏳</Text>
          <Text style={[rc.statVal, { color: '#b91c1c' }]}>{fmtCurrency(totalOutstanding)}</Text>
          <Text style={rc.statLbl}>Outstanding</Text>
        </View>
        <View style={[rc.statCard, { backgroundColor: '#dcfce7' }]}>
          <Text style={rc.statIcon}>✅</Text>
          <Text style={[rc.statVal, { color: '#15803d' }]}>{fmtCurrency(totalCollected)}</Text>
          <Text style={rc.statLbl}>Collected</Text>
        </View>
        <View style={[rc.statCard, { backgroundColor: '#fef9c3' }]}>
          <Text style={rc.statIcon}>📊</Text>
          <Text style={[rc.statVal, { color: '#a16207' }]}>{outstanding.length}</Text>
          <Text style={rc.statLbl}>Pending Bills</Text>
        </View>
      </View>

      {/* Tabs */}
      <View style={rc.tabRow}>
        {[
          { key: 'outstanding', label: `Outstanding (${outstanding.length})` },
          { key: 'byCustomer',  label: `By Customer (${customerSummary.length})` },
          { key: 'history',     label: `History (${payments.length})` },
        ].map(tb => (
          <TouchableOpacity
            key={tb.key}
            style={[rc.tab, tab === tb.key && rc.tabActive]}
            onPress={() => setTab(tb.key)}
          >
            <Text style={[rc.tabTxt, tab === tb.key && rc.tabTxtActive]}>{tb.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Search + Route filter */}
      <View style={rc.filterBar}>
        <View style={rc.searchBox}>
          <Text>🔍</Text>
          <TextInput
            style={rc.searchInput}
            placeholder="Search customer..."
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
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ flexDirection: 'row', gap: 6, paddingTop: 8 }}>
          <TouchableOpacity
            style={[rc.routeChip, routeFilter === 0 && rc.routeChipActive]}
            onPress={() => setRouteFilter(0)}
          >
            <Text style={[rc.routeChipTxt, routeFilter === 0 && rc.routeChipTxtActive]}>All</Text>
          </TouchableOpacity>
          {ROUTES.map(r => (
            <TouchableOpacity
              key={r.id}
              style={[rc.routeChip, routeFilter === r.id && { backgroundColor: r.color, borderColor: r.textColor + '55' }]}
              onPress={() => setRouteFilter(r.id)}
            >
              <Text style={[rc.routeChipTxt, routeFilter === r.id && { color: r.textColor, fontWeight: '700' }]}>{r.name}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={rc.list} showsVerticalScrollIndicator>

        {/* OUTSTANDING tab */}
        {tab === 'outstanding' && (
          outstanding.length === 0 ? (
            <View style={rc.empty}>
              <Text style={{ fontSize: 52 }}>🎉</Text>
              <Text style={rc.emptyTitle}>All Clear!</Text>
              <Text style={rc.emptySub}>No outstanding payments</Text>
            </View>
          ) : outstanding.map(order => (
            <View key={order.id} style={rc.card}>
              <View style={rc.cardTop}>
                <View style={{ flex: 1 }}>
                  <Text style={rc.cardName}>{order.customerName}</Text>
                  <Text style={rc.cardSub}>{order.id} · {fmtDate(order.createdAt)}</Text>
                  <Text style={rc.cardRoute}>{ROUTES.find(r => r.id === order.routeId)?.name || '—'}</Text>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  <Text style={rc.cardDue}>{fmtCurrency(order.remaining)}</Text>
                  <Text style={rc.cardDueLbl}>due</Text>
                  <Text style={rc.cardPaid}>paid {fmtCurrency(order.paidAmount)}</Text>
                </View>
              </View>
              <View style={rc.cardFooter}>
                <View style={rc.progressBar}>
                  <View style={[
                    rc.progressFill,
                    { width: `${Math.round((order.paidAmount / order.grandTotal) * 100)}%` }
                  ]} />
                </View>
                <Text style={rc.progressPct}>
                  {Math.round((order.paidAmount / order.grandTotal) * 100)}% paid
                </Text>
                <TouchableOpacity style={rc.collectBtn} onPress={() => openPayModal(order)}>
                  <Text style={rc.collectBtnTxt}>+ Collect</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))
        )}

        {/* BY CUSTOMER tab */}
        {tab === 'byCustomer' && (
          customerSummary.length === 0 ? (
            <View style={rc.empty}>
              <Text style={{ fontSize: 52 }}>🎉</Text>
              <Text style={rc.emptyTitle}>All Clear!</Text>
              <Text style={rc.emptySub}>No outstanding customer balances</Text>
            </View>
          ) : customerSummary.map(c => (
            <View key={c.customerId} style={rc.card}>
              <View style={rc.cardTop}>
                <View style={rc.custAvatar}>
                  <Text style={rc.custAvatarTxt}>{c.customerName?.[0]?.toUpperCase()}</Text>
                </View>
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text style={rc.cardName}>{c.customerName}</Text>
                  <Text style={rc.cardSub}>{ROUTES.find(r => r.id === c.routeId)?.name} · {c.orderCount} orders</Text>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  <Text style={rc.cardDue}>{fmtCurrency(c.totalDue)}</Text>
                  <Text style={rc.cardDueLbl}>total due</Text>
                </View>
              </View>
              <View style={rc.custStats}>
                <View style={rc.custStat}>
                  <Text style={rc.custStatVal}>{fmtCurrency(c.totalBilled)}</Text>
                  <Text style={rc.custStatLbl}>Billed</Text>
                </View>
                <View style={rc.custStat}>
                  <Text style={[rc.custStatVal, { color: '#15803d' }]}>{fmtCurrency(c.totalPaid)}</Text>
                  <Text style={rc.custStatLbl}>Paid</Text>
                </View>
                <View style={rc.custStat}>
                  <Text style={[rc.custStatVal, { color: '#b91c1c' }]}>{fmtCurrency(c.totalDue)}</Text>
                  <Text style={rc.custStatLbl}>Due</Text>
                </View>
              </View>
            </View>
          ))
        )}

        {/* HISTORY tab */}
        {tab === 'history' && (
          payments.length === 0 ? (
            <View style={rc.empty}>
              <Text style={{ fontSize: 52 }}>💳</Text>
              <Text style={rc.emptyTitle}>No payment history</Text>
              <Text style={rc.emptySub}>Payments will appear here once recorded</Text>
            </View>
          ) : [...payments].sort((a, b) => b.date - a.date).map(p => {
            const order = orders.find(o => o.id === p.orderId);
            return (
              <View key={p.id} style={rc.payHistCard}>
                <View style={rc.payHistLeft}>
                  <View style={rc.payHistIcon}>
                    <Text style={{ fontSize: 16 }}>💰</Text>
                  </View>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={rc.payHistName}>{order?.customerName || 'Unknown'}</Text>
                  <Text style={rc.payHistSub}>Bill: {p.orderId}</Text>
                  {p.note ? <Text style={rc.payHistNote}>📝 {p.note}</Text> : null}
                  <Text style={rc.payHistDate}>{fmtDate(p.date)}</Text>
                </View>
                <Text style={rc.payHistAmt}>{fmtCurrency(p.amount)}</Text>
              </View>
            );
          })
        )}

        <View style={{ height: 60 }} />
      </ScrollView>

      <PaymentModal
        visible={showPayModal}
        order={selectedOrder}
        onClose={() => setShowPayModal(false)}
        onSuccess={() => {}}
      />
    </View>
  );
}

const rc = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#eef2f9' },

  header: {
    backgroundColor: C.primary,
    paddingTop: Platform.OS === 'web' ? 20 : 54,
    paddingBottom: 16, paddingHorizontal: 16,
    flexDirection: 'row', alignItems: 'center',
  },
  headerTitle: { color: '#fff', fontSize: 20, fontWeight: '800' },
  headerSub:   { color: 'rgba(255,255,255,0.6)', fontSize: 11, marginTop: 2 },

  statsRow: { flexDirection: 'row', padding: 12, gap: 10 },
  statCard: { flex: 1, borderRadius: 12, padding: 14, alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
  statIcon: { fontSize: 22, marginBottom: 6 },
  statVal:  { fontSize: 15, fontWeight: '800', marginBottom: 2, textAlign: 'center' },
  statLbl:  { fontSize: 9, fontWeight: '600', color: C.textLight, textAlign: 'center' },

  tabRow: { flexDirection: 'row', backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#e2e8f0' },
  tab:        { flex: 1, paddingVertical: 11, alignItems: 'center', borderBottomWidth: 2, borderBottomColor: 'transparent' },
  tabActive:  { borderBottomColor: C.primary },
  tabTxt:     { fontSize: 10, fontWeight: '600', color: C.textLight },
  tabTxtActive:{ color: C.primary, fontWeight: '800' },

  filterBar: { backgroundColor: '#fff', paddingHorizontal: 14, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#e2e8f0' },
  searchBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f4f7fc', borderRadius: 12, borderWidth: 1.5, borderColor: '#e2e8f0', paddingHorizontal: 12, gap: 8 },
  searchInput:{ flex: 1, paddingVertical: 8, fontSize: 13, color: C.text },
  routeChip:       { paddingHorizontal: 11, paddingVertical: 5, borderRadius: 12, borderWidth: 1.5, borderColor: '#e2e8f0', backgroundColor: '#fff' },
  routeChipActive: { backgroundColor: '#eff6ff', borderColor: C.primary },
  routeChipTxt:    { fontSize: 11, fontWeight: '500', color: '#64748b' },
  routeChipTxtActive: { color: C.primary, fontWeight: '700' },

  list: { padding: 14, paddingBottom: 80 },

  card: {
    backgroundColor: '#fff', borderRadius: 14, padding: 14, marginBottom: 10,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 6, elevation: 3,
  },
  cardTop:    { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  cardName:   { fontSize: 15, fontWeight: '700', color: C.text },
  cardSub:    { fontSize: 11, color: C.textLight, marginTop: 2 },
  cardRoute:  { fontSize: 11, color: C.textMid, marginTop: 2 },
  cardDue:    { fontSize: 18, fontWeight: '800', color: '#b91c1c' },
  cardDueLbl: { fontSize: 10, color: '#b91c1c', fontWeight: '600' },
  cardPaid:   { fontSize: 10, color: '#15803d', fontWeight: '600', marginTop: 2 },
  cardFooter: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  progressBar: { flex: 1, height: 6, backgroundColor: '#fee2e2', borderRadius: 3, overflow: 'hidden' },
  progressFill:{ height: '100%', backgroundColor: '#15803d', borderRadius: 3 },
  progressPct: { fontSize: 10, color: C.textLight, fontWeight: '600', minWidth: 50 },
  collectBtn:  { backgroundColor: C.primary, borderRadius: 8, paddingHorizontal: 14, paddingVertical: 7 },
  collectBtnTxt:{ color: '#fff', fontWeight: '700', fontSize: 12 },

  custAvatar:    { width: 42, height: 42, borderRadius: 21, backgroundColor: '#b91c1c', justifyContent: 'center', alignItems: 'center' },
  custAvatarTxt: { color: '#fff', fontSize: 18, fontWeight: '800' },
  custStats: { flexDirection: 'row', borderTopWidth: 1, borderTopColor: '#f1f5f9', paddingTop: 10, marginTop: 4 },
  custStat:    { flex: 1, alignItems: 'center' },
  custStatVal: { fontSize: 13, fontWeight: '800', color: C.primary },
  custStatLbl: { fontSize: 9, color: C.textLight, fontWeight: '600', marginTop: 2 },

  payHistCard: {
    backgroundColor: '#fff', borderRadius: 12, padding: 14, marginBottom: 8,
    flexDirection: 'row', alignItems: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 4, elevation: 2,
  },
  payHistLeft:  { marginRight: 12 },
  payHistIcon:  { width: 40, height: 40, borderRadius: 20, backgroundColor: '#dcfce7', justifyContent: 'center', alignItems: 'center' },
  payHistName:  { fontSize: 14, fontWeight: '600', color: C.text },
  payHistSub:   { fontSize: 11, color: C.textLight, marginTop: 2 },
  payHistNote:  { fontSize: 11, color: C.textMid, marginTop: 2 },
  payHistDate:  { fontSize: 10, color: C.textLight, marginTop: 3 },
  payHistAmt:   { fontSize: 16, fontWeight: '800', color: '#15803d' },

  empty:     { alignItems: 'center', paddingTop: 60, gap: 8 },
  emptyTitle:{ fontSize: 18, fontWeight: '800', color: C.text },
  emptySub:  { fontSize: 13, color: C.textLight },

  /* Modal */
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.55)', justifyContent: 'flex-end' },
  modalCard: {
    backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24,
    padding: 24, paddingBottom: Platform.OS === 'ios' ? 44 : 24,
  },
  modalTitle: { fontSize: 18, fontWeight: '800', color: C.text, marginBottom: 4, textAlign: 'center' },
  modalSub:   { fontSize: 13, color: C.textLight, textAlign: 'center', marginBottom: 16 },
  amtBox:   { backgroundColor: '#f8fafc', borderRadius: 12, padding: 14, marginBottom: 16 },
  amtRow:   { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  amtLabel: { fontSize: 13, color: C.textMid, fontWeight: '600' },
  amtVal:   { fontSize: 14, fontWeight: '700', color: C.text },
  fieldLabel:  { fontSize: 12, fontWeight: '600', color: C.textMid, marginBottom: 6 },
  payInputRow: { flexDirection: 'row', alignItems: 'center', borderWidth: 1.5, borderColor: C.primary, borderRadius: 12, paddingHorizontal: 14, backgroundColor: '#eff6ff', marginBottom: 10 },
  payRs:       { fontSize: 16, fontWeight: '700', color: C.primary, marginRight: 6 },
  payInput:    { flex: 1, fontSize: 20, fontWeight: '800', color: C.primary, paddingVertical: 12 },
  fullBtn:     { backgroundColor: '#dcfce7', borderRadius: 10, paddingVertical: 10, alignItems: 'center', borderWidth: 1, borderColor: '#bbf7d0' },
  fullBtnTxt:  { color: '#15803d', fontWeight: '700', fontSize: 13 },
  noteInput:   { borderWidth: 1.5, borderColor: '#e2e8f0', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, fontSize: 13, color: C.text },
  modalBtns:   { flexDirection: 'row', gap: 12, marginTop: 16 },
  cancelBtn:   { flex: 1, backgroundColor: '#f1f5f9', borderRadius: 12, paddingVertical: 14, alignItems: 'center' },
  cancelTxt:   { color: C.textMid, fontWeight: '700' },
  saveBtn:     { flex: 2, backgroundColor: '#15803d', borderRadius: 12, paddingVertical: 14, alignItems: 'center' },
  saveTxt:     { color: '#fff', fontWeight: '800', fontSize: 15 },
});
