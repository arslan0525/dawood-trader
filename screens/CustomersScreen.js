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

function CustomerCard({ customer, routes, onEdit, onDelete, onToggleStatus, orders }) {
  const customerOrders = orders.filter(o => o.customerId === customer.id);
  const outstanding = customerOrders.reduce((s, o) => s + (o.remaining || 0), 0);
  const isDisabled = customer.status === 'disabled';

  return (
    <View style={[cs.card, isDisabled && cs.cardDisabled]}>
      <View style={cs.cardLeft}>
        <View style={[cs.avatar, isDisabled && { backgroundColor: '#94a3b8' }]}>
          <Text style={cs.avatarTxt}>{customer.name?.[0]?.toUpperCase() || '?'}</Text>
        </View>
      </View>
      <View style={{ flex: 1 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <Text style={[cs.cardName, isDisabled && { color: '#94a3b8' }]} numberOfLines={1}>{customer.name}</Text>
          {isDisabled && (
            <View style={cs.disabledBadge}><Text style={cs.disabledBadgeTxt}>Disabled</Text></View>
          )}
        </View>
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
        <TouchableOpacity
          style={[cs.statusBtn, isDisabled ? cs.activateBtn : cs.disableBtn]}
          onPress={() => onToggleStatus(customer)}
        >
          <Text style={{ fontSize: 13 }}>{isDisabled ? '✅' : '🚫'}</Text>
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

  // ⚠️ Called as function {inputField({...})} — NOT as <InputField /> component
  // This prevents TextInput from losing focus on every keystroke
  const inputField = ({ label, field, ...props }) => (
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
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
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

            <ScrollView
              style={{ flex: 1 }}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              contentContainerStyle={{ paddingBottom: 8 }}
            >
              {inputField({ label: t('customerName') + ' *', field: 'name', placeholder: 'Ahmed Store', autoCapitalize: 'words' })}
              {inputField({ label: t('phone'), field: 'phone', placeholder: '0321-1234567', keyboardType: 'phone-pad' })}
              {inputField({ label: t('address'), field: 'address', placeholder: 'Gali / Mohalla / Shehar', multiline: true, numberOfLines: 2, style: { height: 60, textAlignVertical: 'top' } })}
              {inputField({ label: t('notes'), field: 'notes', placeholder: 'Notes (optional)', multiline: true, numberOfLines: 2, style: { height: 60, textAlignVertical: 'top' } })}

              <View style={cs.fieldWrap}>
                <Text style={cs.fieldLabel}>{t('routeNo')} *</Text>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  keyboardShouldPersistTaps="handled"
                  contentContainerStyle={cs.routeGrid}
                >
                  {routes.map(r => (
                    <TouchableOpacity
                      key={r.id}
                      style={[cs.routeChip, form.routeId === r.id && { backgroundColor: r.color, borderColor: r.textColor + '66' }]}
                      onPress={() => set('routeId', r.id)}
                    >
                      <Text style={[cs.routeChipTxt, form.routeId === r.id && { color: r.textColor, fontWeight: '700' }]}>
                        {r.name}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
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

export default function CustomersScreen({ switchTab, viewCustomer }) {
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

  const handleToggleStatus = async (customer) => {
    const newStatus = customer.status === 'disabled' ? 'active' : 'disabled';
    const label = newStatus === 'disabled' ? 'disable' : 'reactivate';
    try {
      await updateCustomer(customer.id, { ...customer, status: newStatus });
      showToast(`"${customer.name}" ${newStatus === 'disabled' ? 'disabled' : 'reactivated'}`, 'success');
    } catch {
      showToast(`Could not ${label}`, 'error');
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

      {/* Route cards — scroll karo left/right */}
      <View style={cs.routeCardsWrap}>
        <View dataSet={{ hscroll: '1' }} style={[cs.routeCardsRow, Platform.OS === 'web' && { overflow: 'scroll' }]}>
          {/* All Routes card */}
          <TouchableOpacity
            style={[cs.routeCard, routeFilter === 0 && cs.routeCardActive]}
            onPress={() => setRouteFilter(0)}
            activeOpacity={0.8}
          >
            <Text style={cs.routeCardIcon}>🗺️</Text>
            <Text style={[cs.routeCardName, routeFilter === 0 && cs.routeCardNameActive]}>Sab Routes</Text>
            <Text style={[cs.routeCardCount, routeFilter === 0 && cs.routeCardCountActive]}>{customers.length} customers</Text>
          </TouchableOpacity>

          {ROUTES.map(r => {
            const count = customers.filter(c => c.routeId === r.id).length;
            const outstanding = orders
              .filter(o => o.routeId === r.id)
              .reduce((s, o) => s + (o.remaining || 0), 0);
            const isActive = routeFilter === r.id;
            return (
              <TouchableOpacity
                key={r.id}
                style={[cs.routeCard, isActive && { backgroundColor: r.color, borderColor: r.textColor + '55' }]}
                onPress={() => setRouteFilter(r.id)}
                activeOpacity={0.8}
              >
                <Text style={cs.routeCardIcon}>📍</Text>
                <Text style={[cs.routeCardName, isActive && { color: r.textColor }]}>{r.name}</Text>
                <Text style={[cs.routeCardCount, isActive && { color: r.textColor }]}>{count} customers</Text>
                {outstanding > 0 && (
                  <Text style={[cs.routeCardDebt, isActive && { color: r.textColor }]}>
                    Rs.{outstanding >= 1000 ? (outstanding / 1000).toFixed(0) + 'K' : outstanding} due
                  </Text>
                )}
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

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
            <TouchableOpacity
              key={c.id}
              activeOpacity={0.9}
              onPress={() => viewCustomer?.(c.id)}
            >
              <CustomerCard
                customer={c}
                routes={ROUTES}
                orders={orders}
                onEdit={openEdit}
                onDelete={handleDelete}
                onToggleStatus={handleToggleStatus}
              />
            </TouchableOpacity>
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

  routeCardsWrap: { backgroundColor: '#f0f4fa', borderBottomWidth: 1, borderBottomColor: '#e2e8f0', flexShrink: 0 },
  routeCardsRow:  { flexDirection: 'row', flexWrap: 'nowrap', paddingHorizontal: 10, paddingVertical: 10, gap: 8 },
  routeCard: {
    backgroundColor: '#fff', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 10,
    borderWidth: 1.5, borderColor: '#e2e8f0', minWidth: 100, alignItems: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 3, elevation: 2,
  },
  routeCardActive:      { backgroundColor: '#eff6ff', borderColor: C.primary },
  routeCardIcon:        { fontSize: 18, marginBottom: 4 },
  routeCardName:        { fontSize: 12, fontWeight: '700', color: '#0f172a', textAlign: 'center' },
  routeCardNameActive:  { color: C.primary },
  routeCardCount:       { fontSize: 10, color: '#64748b', marginTop: 2, fontWeight: '500' },
  routeCardCountActive: { color: C.primary },
  routeCardDebt:        { fontSize: 9, color: '#b91c1c', marginTop: 2, fontWeight: '700' },

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
  cardDisabled:      { opacity: 0.7, backgroundColor: '#f8fafc' },
  disabledBadge:     { backgroundColor: '#fee2e2', borderRadius: 5, paddingHorizontal: 6, paddingVertical: 2 },
  disabledBadgeTxt:  { fontSize: 9, fontWeight: '800', color: '#dc2626' },
  cardActions:       { flexDirection: 'column', gap: 6, marginLeft: 8 },
  editBtn:           { width: 34, height: 34, borderRadius: 9, backgroundColor: '#eff6ff', justifyContent: 'center', alignItems: 'center' },
  statusBtn:         { width: 34, height: 34, borderRadius: 9, justifyContent: 'center', alignItems: 'center' },
  disableBtn:        { backgroundColor: '#fff7ed' },
  activateBtn:       { backgroundColor: '#f0fdf4' },
  delBtn:            { width: 34, height: 34, borderRadius: 9, backgroundColor: '#fee2e2', justifyContent: 'center', alignItems: 'center' },

  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 60, gap: 10 },
  emptyTitle:  { fontSize: 16, fontWeight: '700', color: C.textMid },
  emptyBtn:    { backgroundColor: C.primary, borderRadius: 10, paddingHorizontal: 24, paddingVertical: 12, marginTop: 4 },
  emptyBtnTxt: { color: '#fff', fontWeight: '700', fontSize: 14 },

  /* Modal */
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.55)', justifyContent: 'flex-end' },
  modalCard: {
    backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24,
    padding: 24, paddingBottom: Platform.OS === 'ios' ? 44 : 24,
    maxHeight: '92%', minHeight: 400,
    flex: 0,
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

  routeGrid: { flexDirection: 'row', gap: 8, paddingVertical: 4, paddingHorizontal: 2 },
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
