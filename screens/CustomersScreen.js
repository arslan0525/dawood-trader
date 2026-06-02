import React, { useState, useMemo } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  TextInput, Modal, Alert, Platform, ActivityIndicator,
  useWindowDimensions, KeyboardAvoidingView,
} from 'react-native';
import { useAppData } from '../context/AppDataContext';
import { useLang } from '../context/LanguageContext';
import { useToast } from '../context/ToastContext';
import { C } from '../constants/theme';

const EMPTY_FORM = { name: '', phone: '', address: '', routeId: 1, notes: '' };

function RouteBadge({ routeId, routes }) {
  const route = routes.find(r => r.id === routeId);
  if (!route) return null;
  return (
    <View style={[cs.routeBadge, { backgroundColor: route.color }]}>
      <Text style={[cs.routeBadgeTxt, { color: route.textColor }]}>{route.name}</Text>
    </View>
  );
}

function CustomerCard({ customer, routes, onEdit, onDelete, orders }) {
  const customerOrders = orders.filter(o => o.customerId === customer.id);
  const outstanding = customerOrders.reduce((s, o) => s + (o.remaining || 0), 0);
  return (
    <View style={cs.card}>
      <View style={cs.cardLeft}>
        <View style={cs.avatar}>
          <Text style={cs.avatarTxt}>{customer.name?.[0]?.toUpperCase() || '?'}</Text>
        </View>
      </View>
      <View style={{ flex: 1 }}>
        <Text style={cs.cardName} numberOfLines={1}>{customer.name}</Text>
        <Text style={cs.cardPhone}>📞 {customer.phone || '—'}</Text>
        <Text style={cs.cardAddress} numberOfLines={1}>📍 {customer.address || '—'}</Text>
        <View style={cs.cardFooter}>
          <RouteBadge routeId={customer.routeId} routes={routes} />
          {outstanding > 0 && (
            <View style={cs.debtBadge}>
              <Text style={cs.debtTxt}>Rs.{outstanding.toLocaleString()} due</Text>
            </View>
          )}
        </View>
      </View>
      <View style={cs.cardActions}>
        <TouchableOpacity style={cs.editBtn} onPress={() => onEdit(customer)}>
          <Text style={{ fontSize: 15 }}>✏️</Text>
        </TouchableOpacity>
        <TouchableOpacity style={cs.delBtn} onPress={() => onDelete(customer)}>
          <Text style={{ fontSize: 15 }}>🗑️</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

function CustomerModal({ visible, initial, routes, onSave, onClose, saving }) {
  const { t } = useLang();
  const [form, setForm] = useState(initial || EMPTY_FORM);

  React.useEffect(() => { setForm(initial || EMPTY_FORM); }, [initial]);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const InputField = ({ label, field, ...props }) => (
    <View style={cs.fieldWrap}>
      <Text style={cs.fieldLabel}>{label}</Text>
      <TextInput
        style={cs.input}
        value={form[field]}
        onChangeText={v => set(field, v)}
        placeholderTextColor="#94a3b8"
        {...props}
      />
    </View>
  );

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={cs.modalOverlay}>
          <View style={cs.modalCard}>
            <View style={cs.modalHeader}>
              <Text style={cs.modalTitle}>
                {initial?.id ? `✏️ ${t('editCustomer')}` : `👥 ${t('addCustomer')}`}
              </Text>
              <TouchableOpacity style={cs.modalClose} onPress={onClose}>
                <Text style={{ fontSize: 18, color: C.textLight }}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
              <InputField label={t('customerName') + ' *'} field="name" placeholder="e.g. Ahmed Store" autoCapitalize="words" />
              <InputField label={t('phone')} field="phone" placeholder="e.g. 0321-1234567" keyboardType="phone-pad" />
              <InputField label={t('address')} field="address" placeholder="Full address" multiline numberOfLines={2} style={{ height: 60, textAlignVertical: 'top' }} />
              <InputField label={t('notes')} field="notes" placeholder="Notes (optional)" multiline numberOfLines={2} style={{ height: 60, textAlignVertical: 'top' }} />

              <View style={cs.fieldWrap}>
                <Text style={cs.fieldLabel}>{t('routeNo')} *</Text>
                <View style={cs.routeGrid}>
                  {routes.map(r => (
                    <TouchableOpacity
                      key={r.id}
                      style={[
                        cs.routeChip,
                        form.routeId === r.id && { backgroundColor: r.color, borderColor: r.textColor + '66' },
                      ]}
                      onPress={() => set('routeId', r.id)}
                    >
                      <Text style={[cs.routeChipTxt, form.routeId === r.id && { color: r.textColor, fontWeight: '700' }]}>
                        {r.name}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </ScrollView>

            <View style={cs.modalBtns}>
              <TouchableOpacity style={cs.cancelBtn} onPress={onClose}>
                <Text style={cs.cancelTxt}>{t('cancel')}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[cs.saveBtn, saving && { opacity: 0.6 }]}
                onPress={() => onSave(form)}
                disabled={saving}
              >
                {saving
                  ? <ActivityIndicator color="#fff" size="small" />
                  : <Text style={cs.saveTxt}>{t('save')}</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

export default function CustomersScreen({ switchTab }) {
  const { customers, orders, ROUTES, addCustomer, updateCustomer, deleteCustomer } = useAppData();
  const { t } = useLang();
  const { showToast } = useToast();
  const { width } = useWindowDimensions();
  const isWide = width >= 768;

  const [search, setSearch]         = useState('');
  const [routeFilter, setRouteFilter] = useState(0);
  const [showModal, setShowModal]   = useState(false);
  const [editItem, setEditItem]     = useState(null);
  const [saving, setSaving]         = useState(false);

  const filtered = useMemo(() => {
    let list = customers;
    if (routeFilter) list = list.filter(c => c.routeId === routeFilter);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(c =>
        c.name?.toLowerCase().includes(q) ||
        c.phone?.includes(q) ||
        c.address?.toLowerCase().includes(q)
      );
    }
    return list;
  }, [customers, search, routeFilter]);

  const openAdd = () => { setEditItem(null); setShowModal(true); };
  const openEdit = (c) => { setEditItem(c); setShowModal(true); };

  const handleSave = async (form) => {
    if (!form.name?.trim()) { showToast('Customer name required', 'error'); return; }
    setSaving(true);
    try {
      if (editItem?.id) {
        await updateCustomer(editItem.id, form);
        showToast('Customer updated!', 'success');
      } else {
        await addCustomer(form);
        showToast('Customer added!', 'success');
      }
      setShowModal(false);
    } catch {
      showToast('Could not save', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = (customer) => {
    const doDelete = async () => {
      try {
        await deleteCustomer(customer.id);
        showToast(`"${customer.name}" deleted`, 'success');
      } catch {
        showToast('Could not delete', 'error');
      }
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

  return (
    <View style={cs.root}>
      {/* Header */}
      <View style={cs.header}>
        <View style={{ flex: 1 }}>
          <Text style={cs.headerTitle}>👥 {t('customers')}</Text>
          <Text style={cs.headerSub}>{customers.length} registered</Text>
        </View>
        <TouchableOpacity style={cs.addBtn} onPress={openAdd}>
          <Text style={cs.addBtnTxt}>+ {t('addCustomer')}</Text>
        </TouchableOpacity>
      </View>

      {/* Search */}
      <View style={cs.searchRow}>
        <View style={cs.searchBox}>
          <Text style={{ fontSize: 14 }}>🔍</Text>
          <TextInput
            style={cs.searchInput}
            placeholder={t('search') + ' customers...'}
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

      {/* Route filter chips */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={cs.chipScroll}
        contentContainerStyle={cs.chipRow}
      >
        <TouchableOpacity
          style={[cs.chip, routeFilter === 0 && cs.chipActive]}
          onPress={() => setRouteFilter(0)}
        >
          <Text style={[cs.chipTxt, routeFilter === 0 && cs.chipTxtActive]}>
            {t('allRoutes')} ({customers.length})
          </Text>
        </TouchableOpacity>
        {ROUTES.map(r => {
          const count = customers.filter(c => c.routeId === r.id).length;
          return (
            <TouchableOpacity
              key={r.id}
              style={[cs.chip, routeFilter === r.id && { backgroundColor: r.color, borderColor: r.textColor + '44' }]}
              onPress={() => setRouteFilter(r.id)}
            >
              <Text style={[cs.chipTxt, routeFilter === r.id && { color: r.textColor, fontWeight: '700' }]}>
                {r.name} ({count})
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* List */}
      <ScrollView style={{ flex: 1 }} contentContainerStyle={cs.list} showsVerticalScrollIndicator>
        {filtered.length === 0 ? (
          <View style={cs.empty}>
            <Text style={{ fontSize: 52 }}>👥</Text>
            <Text style={cs.emptyTitle}>{search ? t('noData') : t('noCustomers')}</Text>
            {!search && (
              <TouchableOpacity style={cs.emptyBtn} onPress={openAdd}>
                <Text style={cs.emptyBtnTxt}>+ {t('addCustomer')}</Text>
              </TouchableOpacity>
            )}
          </View>
        ) : (
          filtered.map(c => (
            <CustomerCard
              key={c.id}
              customer={c}
              routes={ROUTES}
              orders={orders}
              onEdit={openEdit}
              onDelete={handleDelete}
            />
          ))
        )}
      </ScrollView>

      {/* Modal */}
      <CustomerModal
        visible={showModal}
        initial={editItem}
        routes={ROUTES}
        onSave={handleSave}
        onClose={() => setShowModal(false)}
        saving={saving}
      />
    </View>
  );
}

const cs = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#eef2f9' },

  header: {
    backgroundColor: C.primary,
    paddingTop: Platform.OS === 'web' ? 20 : 54,
    paddingBottom: 16, paddingHorizontal: 16,
    flexDirection: 'row', alignItems: 'center',
  },
  headerTitle: { color: '#fff', fontSize: 20, fontWeight: '800' },
  headerSub:   { color: 'rgba(255,255,255,0.6)', fontSize: 11, marginTop: 2 },
  addBtn:      { backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 9, borderWidth: 1, borderColor: 'rgba(255,255,255,0.3)' },
  addBtnTxt:   { color: '#fff', fontWeight: '700', fontSize: 13 },

  searchRow:   { backgroundColor: '#fff', paddingHorizontal: 14, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#e2e8f0' },
  searchBox:   { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f4f7fc', borderRadius: 12, borderWidth: 1.5, borderColor: '#e2e8f0', paddingHorizontal: 12, gap: 8 },
  searchInput: { flex: 1, paddingVertical: 9, fontSize: 14, color: C.text },

  chipScroll: { backgroundColor: '#fff', maxHeight: 52, borderBottomWidth: 1, borderBottomColor: '#e2e8f0' },
  chipRow:    { flexDirection: 'row', paddingHorizontal: 12, paddingVertical: 8, gap: 6 },
  chip:       { paddingHorizontal: 12, paddingVertical: 5, borderRadius: 16, borderWidth: 1.5, borderColor: '#e2e8f0', backgroundColor: '#fff' },
  chipActive: { backgroundColor: '#eff6ff', borderColor: C.primary },
  chipTxt:    { fontSize: 11, fontWeight: '500', color: '#64748b' },
  chipTxtActive: { color: C.primary, fontWeight: '700' },

  list: { padding: 14, paddingBottom: 80 },

  card: {
    backgroundColor: '#fff', borderRadius: 14, padding: 14,
    flexDirection: 'row', alignItems: 'center', marginBottom: 10,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05, shadowRadius: 6, elevation: 3,
  },
  cardLeft:    { marginRight: 12 },
  avatar:      { width: 46, height: 46, borderRadius: 23, backgroundColor: C.primary, justifyContent: 'center', alignItems: 'center' },
  avatarTxt:   { color: '#fff', fontSize: 18, fontWeight: '800' },
  cardName:    { fontSize: 15, fontWeight: '700', color: C.text, marginBottom: 2 },
  cardPhone:   { fontSize: 12, color: C.textMid, marginBottom: 2 },
  cardAddress: { fontSize: 11, color: C.textLight, marginBottom: 6 },
  cardFooter:  { flexDirection: 'row', gap: 6, flexWrap: 'wrap' },
  routeBadge:  { borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 },
  routeBadgeTxt: { fontSize: 10, fontWeight: '700' },
  debtBadge:   { backgroundColor: '#fee2e2', borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 },
  debtTxt:     { fontSize: 10, fontWeight: '700', color: '#b91c1c' },
  cardActions: { flexDirection: 'column', gap: 8, marginLeft: 8 },
  editBtn:     { width: 36, height: 36, borderRadius: 9, backgroundColor: '#eff6ff', justifyContent: 'center', alignItems: 'center' },
  delBtn:      { width: 36, height: 36, borderRadius: 9, backgroundColor: '#fee2e2', justifyContent: 'center', alignItems: 'center' },

  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 60, gap: 10 },
  emptyTitle:  { fontSize: 16, fontWeight: '700', color: C.textMid },
  emptyBtn:    { backgroundColor: C.primary, borderRadius: 10, paddingHorizontal: 24, paddingVertical: 12, marginTop: 4 },
  emptyBtnTxt: { color: '#fff', fontWeight: '700', fontSize: 14 },

  /* Modal */
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.55)', justifyContent: 'flex-end' },
  modalCard: {
    backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24,
    padding: 24, paddingBottom: Platform.OS === 'ios' ? 44 : 24, maxHeight: '90%',
  },
  modalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 },
  modalTitle:  { fontSize: 18, fontWeight: '800', color: C.text },
  modalClose:  { padding: 4 },

  fieldWrap:  { marginBottom: 16 },
  fieldLabel: { fontSize: 12, fontWeight: '600', color: C.textMid, marginBottom: 6 },
  input: {
    borderWidth: 1.5, borderColor: '#e2e8f0', borderRadius: 12,
    paddingHorizontal: 14, paddingVertical: 11, fontSize: 14, color: C.text,
    backgroundColor: '#f8fafc',
  },

  routeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  routeChip: {
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10,
    borderWidth: 1.5, borderColor: '#e2e8f0', backgroundColor: '#f8fafc',
  },
  routeChipTxt: { fontSize: 12, fontWeight: '500', color: C.textMid },

  modalBtns:  { flexDirection: 'row', gap: 12, marginTop: 20 },
  cancelBtn:  { flex: 1, backgroundColor: '#f1f5f9', borderRadius: 12, paddingVertical: 14, alignItems: 'center' },
  cancelTxt:  { color: C.textMid, fontWeight: '700' },
  saveBtn:    { flex: 2, backgroundColor: C.primary, borderRadius: 12, paddingVertical: 14, alignItems: 'center' },
  saveTxt:    { color: '#fff', fontWeight: '800', fontSize: 15 },
});
