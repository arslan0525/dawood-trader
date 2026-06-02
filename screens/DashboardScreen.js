import React, { useMemo } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  Platform, useWindowDimensions,
} from 'react-native';
import { useAppData } from '../context/AppDataContext';
import { useLang } from '../context/LanguageContext';
import { DEMO_PRODUCTS } from '../services/demoData';
import { IS_DEMO } from '../services/firebase';
import { C } from '../constants/theme';

function fmtDate(ts) {
  if (!ts) return '—';
  return new Date(ts).toLocaleDateString('en-PK', { day: '2-digit', month: 'short', year: 'numeric' });
}

function fmtCurrency(n) {
  return 'Rs.' + (n || 0).toLocaleString();
}

function StatCard({ icon, label, value, bg, valueColor, onPress }) {
  return (
    <TouchableOpacity
      style={[d.statCard, { backgroundColor: bg }]}
      onPress={onPress}
      activeOpacity={onPress ? 0.78 : 1}
    >
      <Text style={d.statIcon}>{icon}</Text>
      <Text style={[d.statValue, { color: valueColor || C.primary }]}>{value}</Text>
      <Text style={d.statLabel}>{label}</Text>
    </TouchableOpacity>
  );
}

function StatusBadge({ status }) {
  const map = {
    paid:    { bg: '#dcfce7', color: '#15803d', label: 'Paid' },
    partial: { bg: '#fef9c3', color: '#a16207', label: 'Partial' },
    unpaid:  { bg: '#fee2e2', color: '#b91c1c', label: 'Unpaid' },
  };
  const s = map[status] || map.unpaid;
  return (
    <View style={[d.badge, { backgroundColor: s.bg }]}>
      <Text style={[d.badgeTxt, { color: s.color }]}>{s.label}</Text>
    </View>
  );
}

export default function DashboardScreen({ switchTab }) {
  const { customers, orders, ROUTES, getStats } = useAppData();
  const { t } = useLang();
  const { width } = useWindowDimensions();
  const isWide = width >= 768;

  const allProducts = IS_DEMO ? DEMO_PRODUCTS : [];
  const stats = useMemo(() => getStats(allProducts), [orders, allProducts]);

  const statCards = [
    {
      icon: '📦', label: t('totalProducts'),
      value: allProducts.length,
      bg: '#eff6ff', valueColor: C.primary,
      onPress: () => switchTab?.('Home'),
    },
    {
      icon: '👥', label: t('totalCustomers'),
      value: customers.length,
      bg: '#f0fdf4', valueColor: '#15803d',
      onPress: () => switchTab?.('Customers'),
    },
    {
      icon: '🗺️', label: t('totalRoutes'),
      value: ROUTES.length,
      bg: '#fef9c3', valueColor: '#a16207',
    },
    {
      icon: '📋', label: t('todaysOrders'),
      value: stats.todaysOrderCount,
      bg: '#f3e8ff', valueColor: '#7e22ce',
      onPress: () => switchTab?.('OrderHistory'),
    },
    {
      icon: '💵', label: t('todaysSales'),
      value: fmtCurrency(stats.todaysSales),
      bg: '#dcfce7', valueColor: '#15803d',
      onPress: () => switchTab?.('OrderHistory'),
    },
    {
      icon: '📈', label: t('monthlySales'),
      value: fmtCurrency(stats.monthlySales),
      bg: '#dbeafe', valueColor: C.primary,
    },
    {
      icon: '💰', label: t('outstandingRecovery'),
      value: fmtCurrency(stats.outstanding),
      bg: '#fee2e2', valueColor: '#b91c1c',
      onPress: () => switchTab?.('Recovery'),
    },
    {
      icon: '⚠️', label: t('lowStock'),
      value: stats.lowStockProducts?.length || 0,
      bg: '#ffedd5', valueColor: '#c2410c',
      onPress: () => switchTab?.('Inventory'),
    },
  ];

  const cols = isWide ? 4 : 2;

  return (
    <ScrollView style={d.root} contentContainerStyle={d.body} showsVerticalScrollIndicator={false}>

      {/* Header */}
      <View style={d.header}>
        <Text style={d.headerTitle}>📊 {t('dashboard')}</Text>
        <Text style={d.headerSub}>Dawood Trader — Overview</Text>
      </View>

      {/* Stats Grid */}
      <View style={[d.grid, { marginHorizontal: isWide ? 20 : 12 }]}>
        {statCards.map((card, i) => (
          <View key={i} style={{ width: `${100 / cols}%`, padding: 5 }}>
            <StatCard {...card} />
          </View>
        ))}
      </View>

      {/* Low Stock Alert */}
      {stats.lowStockProducts?.length > 0 && (
        <View style={[d.section, { marginHorizontal: isWide ? 20 : 12 }]}>
          <View style={d.sectionHeader}>
            <Text style={d.sectionTitle}>⚠️ {t('lowStock')}</Text>
            <TouchableOpacity onPress={() => switchTab?.('Inventory')}>
              <Text style={d.seeAll}>Manage →</Text>
            </TouchableOpacity>
          </View>
          <View style={d.card}>
            {stats.lowStockProducts.slice(0, 5).map(p => (
              <View key={p.id} style={d.stockRow}>
                <View style={{ flex: 1 }}>
                  <Text style={d.stockName} numberOfLines={1}>{p.name}</Text>
                  <Text style={d.stockCat}>{p.category} · {p.unit}</Text>
                </View>
                <View style={[d.stockBadge, { backgroundColor: (p.stock ?? 0) === 0 ? '#fee2e2' : '#fef9c3' }]}>
                  <Text style={[d.stockBadgeTxt, { color: (p.stock ?? 0) === 0 ? '#b91c1c' : '#a16207' }]}>
                    {(p.stock ?? 0) === 0 ? 'Out' : `${p.stock} left`}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        </View>
      )}

      {/* Recent Orders */}
      <View style={[d.section, { marginHorizontal: isWide ? 20 : 12 }]}>
        <View style={d.sectionHeader}>
          <Text style={d.sectionTitle}>📋 {t('recentOrders')}</Text>
          <TouchableOpacity onPress={() => switchTab?.('OrderHistory')}>
            <Text style={d.seeAll}>See All →</Text>
          </TouchableOpacity>
        </View>
        {orders.length === 0 ? (
          <View style={d.emptyCard}>
            <Text style={{ fontSize: 36 }}>📋</Text>
            <Text style={d.emptyTxt}>{t('noOrders')}</Text>
            <TouchableOpacity style={d.emptyBtn} onPress={() => switchTab?.('NewOrder')}>
              <Text style={d.emptyBtnTxt}>+ {t('newOrder')}</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={d.card}>
            {orders.slice(0, 6).map(order => (
              <View key={order.id} style={d.orderRow}>
                <View style={{ flex: 1 }}>
                  <Text style={d.orderName} numberOfLines={1}>{order.customerName}</Text>
                  <Text style={d.orderDate}>
                    {fmtDate(order.createdAt)} · {ROUTES.find(r => r.id === order.routeId)?.name || '—'}
                  </Text>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  <Text style={d.orderAmt}>{fmtCurrency(order.grandTotal)}</Text>
                  <StatusBadge status={order.status} />
                </View>
              </View>
            ))}
          </View>
        )}
      </View>

      {/* Quick Actions */}
      <View style={[d.section, { marginHorizontal: isWide ? 20 : 12, marginBottom: 32 }]}>
        <Text style={d.sectionTitle}>⚡ Quick Actions</Text>
        <View style={d.quickRow}>
          {[
            { icon: '📝', label: t('newOrder'),     tab: 'NewOrder',     bg: C.primary     },
            { icon: '👥', label: t('customers'),    tab: 'Customers',    bg: '#15803d'     },
            { icon: '💰', label: t('recovery'),     tab: 'Recovery',     bg: '#b91c1c'     },
            { icon: '📋', label: t('orderHistory'), tab: 'OrderHistory', bg: '#7e22ce'     },
          ].map(q => (
            <TouchableOpacity
              key={q.tab}
              style={[d.quickBtn, { backgroundColor: q.bg }]}
              onPress={() => switchTab?.(q.tab)}
              activeOpacity={0.8}
            >
              <Text style={{ fontSize: 22 }}>{q.icon}</Text>
              <Text style={d.quickLabel}>{q.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </ScrollView>
  );
}

const d = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#eef2f9' },
  body: { paddingBottom: 40 },

  header: {
    backgroundColor: C.primary,
    paddingTop: Platform.OS === 'web' ? 20 : 54,
    paddingBottom: 20, paddingHorizontal: 20,
  },
  headerTitle: { color: '#fff', fontSize: 22, fontWeight: '800' },
  headerSub:   { color: 'rgba(255,255,255,0.65)', fontSize: 12, marginTop: 3 },

  grid: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 16 },

  statCard: {
    flex: 1, borderRadius: 14, padding: 16, alignItems: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06, shadowRadius: 6, elevation: 3,
  },
  statIcon:  { fontSize: 26, marginBottom: 8 },
  statValue: { fontSize: 20, fontWeight: '800', marginBottom: 3 },
  statLabel: { fontSize: 10, fontWeight: '600', color: C.textLight, textAlign: 'center' },

  section:       { marginTop: 20 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  sectionTitle:  { fontSize: 15, fontWeight: '800', color: C.text },
  seeAll:        { fontSize: 12, color: C.primary, fontWeight: '700' },

  card: {
    backgroundColor: '#fff', borderRadius: 14, overflow: 'hidden',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06, shadowRadius: 8, elevation: 3,
  },

  stockRow: {
    flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16,
    paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#f1f5f9',
  },
  stockName:     { fontSize: 14, fontWeight: '600', color: C.text },
  stockCat:      { fontSize: 11, color: C.textLight, marginTop: 2 },
  stockBadge:    { borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4 },
  stockBadgeTxt: { fontSize: 11, fontWeight: '700' },

  orderRow: {
    flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16,
    paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#f1f5f9',
  },
  orderName: { fontSize: 14, fontWeight: '600', color: C.text },
  orderDate: { fontSize: 11, color: C.textLight, marginTop: 2 },
  orderAmt:  { fontSize: 14, fontWeight: '800', color: C.primary, marginBottom: 4 },

  badge:    { borderRadius: 6, paddingHorizontal: 8, paddingVertical: 2 },
  badgeTxt: { fontSize: 10, fontWeight: '700' },

  emptyCard: {
    backgroundColor: '#fff', borderRadius: 14, padding: 32,
    alignItems: 'center', gap: 8,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06, shadowRadius: 8, elevation: 3,
  },
  emptyTxt:    { fontSize: 14, color: C.textLight, fontWeight: '500' },
  emptyBtn:    { backgroundColor: C.primary, borderRadius: 10, paddingHorizontal: 20, paddingVertical: 10, marginTop: 4 },
  emptyBtnTxt: { color: '#fff', fontWeight: '700', fontSize: 13 },

  quickRow: { flexDirection: 'row', gap: 10, marginTop: 10 },
  quickBtn: {
    flex: 1, borderRadius: 14, paddingVertical: 18, alignItems: 'center', gap: 6,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12, shadowRadius: 6, elevation: 3,
  },
  quickLabel: { color: '#fff', fontSize: 10, fontWeight: '700', textAlign: 'center' },
});
