import React, { useMemo, memo } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  Platform, useWindowDimensions,
} from 'react-native';
import { useAppData } from '../context/AppDataContext';
import { useLang }    from '../context/LanguageContext';
import { C }          from '../constants/theme';

function fmtDate(ts) {
  if (!ts) return '—';
  return new Date(ts).toLocaleDateString('en-PK', { day: '2-digit', month: 'short' });
}
function fmtCurrency(n) {
  if ((n || 0) >= 100000) return 'Rs.' + ((n || 0) / 100000).toFixed(1) + 'L';
  if ((n || 0) >= 1000)   return 'Rs.' + ((n || 0) / 1000).toFixed(1)   + 'K';
  return 'Rs.' + (n || 0).toLocaleString();
}

const StatCard = memo(function StatCard({ icon, label, value, gradient, onPress }) {
  const [bg1, bg2, textCol] = gradient;
  return (
    <TouchableOpacity
      style={[ds.statCard, { backgroundColor: bg1, borderColor: bg2 + '40' }]}
      onPress={onPress}
      activeOpacity={onPress ? 0.8 : 1}
    >
      <View style={[ds.statIconBox, { backgroundColor: bg2 + '25' }]}>
        <Text style={ds.statIconTxt}>{icon}</Text>
      </View>
      <Text style={[ds.statValue, { color: textCol }]}>{value}</Text>
      <Text style={ds.statLabel}>{label}</Text>
    </TouchableOpacity>
  );
});

const OrderRow = memo(function OrderRow({ order, routes, onCollect }) {
  const statusColor = { paid: '#15803d', partial: '#a16207', unpaid: '#b91c1c' };
  const statusBg    = { paid: '#dcfce7', partial: '#fef9c3', unpaid: '#fee2e2' };
  const s = order.status || 'unpaid';
  const route = routes.find(r => r.id === order.routeId);

  return (
    <View style={ds.orderRow}>
      <View style={ds.orderAvatar}>
        <Text style={ds.orderAvatarTxt}>{order.customerName?.[0]?.toUpperCase() || '?'}</Text>
      </View>
      <View style={{ flex: 1 }}>
        <Text style={ds.orderName} numberOfLines={1}>{order.customerName}</Text>
        <Text style={ds.orderMeta}>
          {fmtDate(order.createdAt)} · {route?.name || '—'} · {order.items?.length || 0} items
        </Text>
      </View>
      <View style={{ alignItems: 'flex-end', gap: 4 }}>
        <Text style={[ds.orderAmt, { color: statusColor[s] }]}>
          Rs.{(order.grandTotal || 0).toLocaleString()}
        </Text>
        <View style={[ds.statusPill, { backgroundColor: statusBg[s] }]}>
          <Text style={[ds.statusTxt, { color: statusColor[s] }]}>
            {s.charAt(0).toUpperCase() + s.slice(1)}
          </Text>
        </View>
      </View>
      {order.remaining > 0 && onCollect && (
        <TouchableOpacity style={ds.collectBtn} onPress={() => onCollect(order)}>
          <Text style={ds.collectBtnTxt}>💰</Text>
        </TouchableOpacity>
      )}
    </View>
  );
});

export default function DashboardScreen({ switchTab }) {
  const { products, customers, orders, ROUTES, getStats } = useAppData();
  const { t }    = useLang();
  const { width } = useWindowDimensions();
  const isWide    = width >= 768;

  const stats = useMemo(() => getStats(products), [orders, products, getStats]);

  const statCards = [
    {
      icon: '📦', label: t('totalProducts'),
      value: products.length,
      gradient: ['#eff6ff', '#3b82f6', '#1d4ed8'],
      onPress: () => switchTab?.('Home'),
    },
    {
      icon: '👥', label: t('totalCustomers'),
      value: customers.length,
      gradient: ['#f0fdf4', '#22c55e', '#15803d'],
      onPress: () => switchTab?.('Customers'),
    },
    {
      icon: '🗺️', label: t('totalRoutes'),
      value: ROUTES.length,
      gradient: ['#fefce8', '#eab308', '#a16207'],
    },
    {
      icon: '📋', label: t('todaysOrders'),
      value: stats.todaysOrderCount,
      gradient: ['#faf5ff', '#a855f7', '#7e22ce'],
      onPress: () => switchTab?.('OrderHistory'),
    },
    {
      icon: '💵', label: t('todaysSales'),
      value: fmtCurrency(stats.todaysSales),
      gradient: ['#f0fdf4', '#10b981', '#059669'],
      onPress: () => switchTab?.('OrderHistory'),
    },
    {
      icon: '📈', label: t('monthlySales'),
      value: fmtCurrency(stats.monthlySales),
      gradient: ['#eff6ff', '#3b82f6', '#1d4ed8'],
    },
    {
      icon: '⏳', label: t('outstandingRecovery'),
      value: fmtCurrency(stats.outstanding),
      gradient: stats.outstanding > 0
        ? ['#fef2f2', '#ef4444', '#b91c1c']
        : ['#f0fdf4', '#22c55e', '#15803d'],
      onPress: () => switchTab?.('Recovery'),
    },
    {
      icon: '⚠️', label: t('lowStock'),
      value: stats.lowStockProducts?.length || 0,
      gradient: stats.lowStockProducts?.length > 0
        ? ['#fff7ed', '#f97316', '#c2410c']
        : ['#f0fdf4', '#22c55e', '#15803d'],
      onPress: () => switchTab?.('Inventory'),
    },
  ];

  const cols = isWide ? 4 : 2;

  return (
    <ScrollView
      style={ds.root}
      contentContainerStyle={[ds.body, { paddingHorizontal: isWide ? 24 : 14 }]}
      showsVerticalScrollIndicator={false}
    >
      {/* Welcome bar (mobile only — desktop has TopBar) */}
      {!isWide && (
        <View style={ds.welcomeBar}>
          <Text style={ds.welcomeTitle}>📊 {t('dashboard')}</Text>
          <Text style={ds.welcomeSub}>Dawood Trader — Overview</Text>
        </View>
      )}

      {/* Stats Grid */}
      <View style={ds.grid}>
        {statCards.map((card, i) => (
          <View key={i} style={{ width: `${100 / cols}%`, paddingHorizontal: 5, marginBottom: 10 }}>
            <StatCard {...card} />
          </View>
        ))}
      </View>

      {/* Two-column layout on wide screens */}
      <View style={[ds.bottomRow, isWide && ds.bottomRowWide]}>

        {/* Recent Orders */}
        <View style={[ds.panel, isWide && { flex: 3, marginRight: 12 }]}>
          <View style={ds.panelHeader}>
            <Text style={ds.panelTitle}>📋 {t('recentOrders')}</Text>
            <TouchableOpacity onPress={() => switchTab?.('OrderHistory')}>
              <Text style={ds.panelLink}>See All →</Text>
            </TouchableOpacity>
          </View>
          {orders.length === 0 ? (
            <View style={ds.emptyBox}>
              <Text style={{ fontSize: 40 }}>📋</Text>
              <Text style={ds.emptyTxt}>{t('noOrders')}</Text>
              <TouchableOpacity style={ds.emptyBtn} onPress={() => switchTab?.('NewOrder')}>
                <Text style={ds.emptyBtnTxt}>+ {t('newOrder')}</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={ds.orderList}>
              {orders.slice(0, 6).map(order => (
                <OrderRow
                  key={order.id}
                  order={order}
                  routes={ROUTES}
                  onCollect={() => switchTab?.('Recovery')}
                />
              ))}
            </View>
          )}
        </View>

        {/* Low Stock + Quick Actions */}
        <View style={[isWide && { flex: 2 }]}>
          {/* Quick Actions */}
          <View style={[ds.panel, { marginBottom: 12 }]}>
            <Text style={ds.panelTitle}>⚡ Quick Actions</Text>
            <View style={ds.quickGrid}>
              {[
                { icon: '📝', label: t('newOrder'),     tab: 'NewOrder',     bg: C.primary  },
                { icon: '👥', label: t('customers'),    tab: 'Customers',    bg: '#15803d'  },
                { icon: '📋', label: t('orderHistory'), tab: 'OrderHistory', bg: '#7e22ce'  },
                { icon: '💰', label: t('recovery'),     tab: 'Recovery',     bg: '#b91c1c'  },
              ].map(q => (
                <TouchableOpacity
                  key={q.tab}
                  style={[ds.quickBtn, { backgroundColor: q.bg }]}
                  onPress={() => switchTab?.(q.tab)}
                  activeOpacity={0.82}
                >
                  <Text style={{ fontSize: 20 }}>{q.icon}</Text>
                  <Text style={ds.quickLabel}>{q.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Low Stock */}
          {stats.lowStockProducts?.length > 0 && (
            <View style={ds.panel}>
              <View style={ds.panelHeader}>
                <Text style={ds.panelTitle}>⚠️ {t('lowStock')}</Text>
                <TouchableOpacity onPress={() => switchTab?.('Inventory')}>
                  <Text style={ds.panelLink}>Fix →</Text>
                </TouchableOpacity>
              </View>
              {stats.lowStockProducts.slice(0, 4).map(p => (
                <View key={p.id} style={ds.stockRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={ds.stockName} numberOfLines={1}>{p.name}</Text>
                    <Text style={ds.stockCat}>{p.category}</Text>
                  </View>
                  <View style={[ds.stockBadge,
                    { backgroundColor: (p.stock ?? 0) === 0 ? '#fee2e2' : '#fff7ed' }
                  ]}>
                    <Text style={[ds.stockBadgeTxt,
                      { color: (p.stock ?? 0) === 0 ? '#b91c1c' : '#c2410c' }
                    ]}>
                      {(p.stock ?? 0) === 0 ? '⚠ Out' : `${p.stock} left`}
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          )}
        </View>
      </View>

      <View style={{ height: 32 }} />
    </ScrollView>
  );
}

const ds = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#f0f4fa' },
  body: { paddingTop: 20, paddingBottom: 40 },

  welcomeBar: { marginBottom: 16 },
  welcomeTitle:{ fontSize: 22, fontWeight: '800', color: '#0f172a' },
  welcomeSub:  { fontSize: 12, color: '#64748b', marginTop: 2 },

  /* Stats */
  grid: { flexDirection: 'row', flexWrap: 'wrap', marginHorizontal: -5, marginBottom: 6 },
  statCard: {
    flex: 1, borderRadius: 16, padding: 16, borderWidth: 1,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06, shadowRadius: 8, elevation: 3,
  },
  statIconBox:  { width: 44, height: 44, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
  statIconTxt:  { fontSize: 22 },
  statValue:    { fontSize: 22, fontWeight: '800', marginBottom: 4 },
  statLabel:    { fontSize: 11, color: '#64748b', fontWeight: '600' },

  /* Bottom row */
  bottomRow:     { gap: 12 },
  bottomRowWide: { flexDirection: 'row', alignItems: 'flex-start' },

  /* Panel */
  panel: {
    backgroundColor: '#fff', borderRadius: 16, padding: 18, marginBottom: 12,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05, shadowRadius: 8, elevation: 3,
  },
  panelHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  panelTitle:  { fontSize: 14, fontWeight: '800', color: '#0f172a' },
  panelLink:   { fontSize: 12, color: C.primary, fontWeight: '700' },

  /* Orders */
  orderList: {},
  orderRow: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingVertical: 11, borderBottomWidth: 1, borderBottomColor: '#f8fafc',
  },
  orderAvatar:    { width: 36, height: 36, borderRadius: 18, backgroundColor: C.primary, justifyContent: 'center', alignItems: 'center' },
  orderAvatarTxt: { color: '#fff', fontSize: 14, fontWeight: '800' },
  orderName:  { fontSize: 13, fontWeight: '700', color: '#0f172a' },
  orderMeta:  { fontSize: 10, color: '#94a3b8', marginTop: 2 },
  orderAmt:   { fontSize: 13, fontWeight: '800' },
  statusPill: { borderRadius: 6, paddingHorizontal: 8, paddingVertical: 2 },
  statusTxt:  { fontSize: 9, fontWeight: '700' },
  collectBtn: { width: 30, height: 30, borderRadius: 8, backgroundColor: '#dcfce7', justifyContent: 'center', alignItems: 'center' },
  collectBtnTxt: { fontSize: 14 },

  /* Quick actions */
  quickGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 12 },
  quickBtn:  {
    width: '47%', borderRadius: 14, paddingVertical: 16,
    alignItems: 'center', gap: 6,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1, shadowRadius: 4, elevation: 3,
  },
  quickLabel: { color: '#fff', fontSize: 10, fontWeight: '700', textAlign: 'center' },

  /* Low stock */
  stockRow:     { flexDirection: 'row', alignItems: 'center', paddingVertical: 9, borderBottomWidth: 1, borderBottomColor: '#f8fafc' },
  stockName:    { fontSize: 13, fontWeight: '600', color: '#0f172a' },
  stockCat:     { fontSize: 10, color: '#94a3b8', marginTop: 1 },
  stockBadge:   { borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4 },
  stockBadgeTxt:{ fontSize: 10, fontWeight: '700' },

  /* Empty */
  emptyBox:   { alignItems: 'center', paddingVertical: 32, gap: 8 },
  emptyTxt:   { fontSize: 13, color: '#94a3b8', fontWeight: '500' },
  emptyBtn:   { backgroundColor: C.primary, borderRadius: 10, paddingHorizontal: 20, paddingVertical: 10, marginTop: 4 },
  emptyBtnTxt:{ color: '#fff', fontWeight: '700', fontSize: 13 },
});
