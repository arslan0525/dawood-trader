import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  collection, onSnapshot, addDoc, updateDoc, deleteDoc,
  doc, query, orderBy, serverTimestamp,
} from 'firebase/firestore';
import { db, IS_DEMO } from '../services/firebase';
import {
  DEMO_CUSTOMERS, DEMO_ORDERS, DEMO_PAYMENTS,
} from '../services/demoDataBusiness';
import { DEMO_PRODUCTS } from '../services/demoData';

// ── Storage keys (demo / localStorage) ─────────────────────
const KEYS = {
  customers: 'dt_customers_v2',
  orders:    'dt_orders_v2',
  payments:  'dt_payments_v2',
  stock:     'dt_stock_v2',
};

// ── Routes (static 1-7) ─────────────────────────────────────
export const ROUTES = [
  { id: 1, name: 'Route 1', color: '#dbeafe', textColor: '#1d4ed8' },
  { id: 2, name: 'Route 2', color: '#dcfce7', textColor: '#15803d' },
  { id: 3, name: 'Route 3', color: '#fef3c7', textColor: '#92400e' },
  { id: 4, name: 'Route 4', color: '#f3e8ff', textColor: '#7e22ce' },
  { id: 5, name: 'Route 5', color: '#ffedd5', textColor: '#c2410c' },
  { id: 6, name: 'Route 6', color: '#fee2e2', textColor: '#b91c1c' },
  { id: 7, name: 'Route 7', color: '#e0f2fe', textColor: '#0369a1' },
];

// ── localStorage helpers ────────────────────────────────────
function load(key, fallback) {
  try {
    if (typeof localStorage !== 'undefined') {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    }
  } catch {}
  return fallback;
}

function save(key, data) {
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(key, JSON.stringify(data));
    }
  } catch {}
}

const AppDataContext = createContext();

export function AppDataProvider({ children }) {
  const [customers, setCustomers] = useState([]);
  const [orders,    setOrders]    = useState([]);
  const [payments,  setPayments]  = useState([]);
  const [stockOvr,  setStockOvr]  = useState({});   // { productId: qty }
  const [loading,   setLoading]   = useState(true);

  // ── Initial load ───────────────────────────────────────────
  useEffect(() => {
    if (IS_DEMO) {
      setCustomers(load(KEYS.customers, DEMO_CUSTOMERS));
      setOrders(load(KEYS.orders,       DEMO_ORDERS));
      setPayments(load(KEYS.payments,   DEMO_PAYMENTS));
      setStockOvr(load(KEYS.stock,      {}));
      setLoading(false);
      return;
    }

    // Firebase real-time listeners
    const unsubs = [];

    const listenCol = (colName, setter, sortField = 'createdAt') => {
      const q = query(collection(db, colName), orderBy(sortField, 'desc'));
      const unsub = onSnapshot(q, snap => {
        setter(snap.docs.map(d => ({ id: d.id, ...d.data() })));
        setLoading(false);
      }, () => setLoading(false));
      unsubs.push(unsub);
    };

    listenCol('customers', setCustomers);
    listenCol('orders',    setOrders);
    listenCol('payments',  setPayments);
    setLoading(false);

    return () => unsubs.forEach(u => u());
  }, []);

  // ── CUSTOMER CRUD ──────────────────────────────────────────
  const addCustomer = useCallback(async (data) => {
    const customer = {
      name: data.name?.trim() || '',
      phone: data.phone?.trim() || '',
      address: data.address?.trim() || '',
      routeId: Number(data.routeId) || 1,
      notes: data.notes?.trim() || '',
      createdAt: Date.now(),
    };
    if (IS_DEMO) {
      customer.id = 'c_' + Date.now();
      const updated = [customer, ...customers];
      setCustomers(updated);
      save(KEYS.customers, updated);
      return customer;
    }
    const ref = await addDoc(collection(db, 'customers'), { ...customer, createdAt: serverTimestamp() });
    return { ...customer, id: ref.id };
  }, [customers]);

  const updateCustomer = useCallback(async (id, data) => {
    const patch = {
      name: data.name?.trim() || '',
      phone: data.phone?.trim() || '',
      address: data.address?.trim() || '',
      routeId: Number(data.routeId) || 1,
      notes: data.notes?.trim() || '',
    };
    if (IS_DEMO) {
      const updated = customers.map(c => c.id === id ? { ...c, ...patch } : c);
      setCustomers(updated);
      save(KEYS.customers, updated);
      return;
    }
    await updateDoc(doc(db, 'customers', id), patch);
  }, [customers]);

  const deleteCustomer = useCallback(async (id) => {
    if (IS_DEMO) {
      const updated = customers.filter(c => c.id !== id);
      setCustomers(updated);
      save(KEYS.customers, updated);
      return;
    }
    await deleteDoc(doc(db, 'customers', id));
  }, [customers]);

  // ── ORDER / BILL CRUD ──────────────────────────────────────
  const createOrder = useCallback(async (data) => {
    const order = {
      customerId:      data.customerId,
      customerName:    data.customerName,
      customerPhone:   data.customerPhone,
      customerAddress: data.customerAddress,
      routeId:         Number(data.routeId) || 1,
      items:           data.items || [],
      grandTotal:      data.grandTotal || 0,
      paidAmount:      data.paidAmount || 0,
      remaining:       data.remaining  || data.grandTotal || 0,
      status:          data.paidAmount >= data.grandTotal ? 'paid' : data.paidAmount > 0 ? 'partial' : 'unpaid',
      note:            data.note || '',
      createdAt:       Date.now(),
    };

    if (IS_DEMO) {
      order.id = 'O' + Date.now();
      const updated = [order, ...orders];
      setOrders(updated);
      save(KEYS.orders, updated);

      // Reduce stock for each item
      const newStock = { ...stockOvr };
      order.items.forEach(item => {
        const product = DEMO_PRODUCTS.find(p => p.id === item.productId);
        const currentStock = newStock[item.productId] !== undefined
          ? newStock[item.productId]
          : (product?.stock ?? 0);
        newStock[item.productId] = Math.max(0, currentStock - item.quantity);
      });
      setStockOvr(newStock);
      save(KEYS.stock, newStock);

      return order;
    }

    const ref = await addDoc(collection(db, 'orders'), { ...order, createdAt: serverTimestamp() });
    return { ...order, id: ref.id };
  }, [orders, stockOvr]);

  const deleteOrder = useCallback(async (id) => {
    if (IS_DEMO) {
      const updated = orders.filter(o => o.id !== id);
      setOrders(updated);
      save(KEYS.orders, updated);
      return;
    }
    await deleteDoc(doc(db, 'orders', id));
  }, [orders]);

  // ── PAYMENT ────────────────────────────────────────────────
  const addPayment = useCallback(async (orderId, amount, note = '') => {
    const amt = Number(amount);
    if (!amt || amt <= 0) return;

    if (IS_DEMO) {
      const updatedOrders = orders.map(o => {
        if (o.id !== orderId) return o;
        const newPaid = (o.paidAmount || 0) + amt;
        const newRemaining = Math.max(0, o.grandTotal - newPaid);
        return {
          ...o,
          paidAmount: newPaid,
          remaining:  newRemaining,
          status:     newRemaining <= 0 ? 'paid' : newPaid > 0 ? 'partial' : 'unpaid',
        };
      });
      setOrders(updatedOrders);
      save(KEYS.orders, updatedOrders);

      const payment = { id: 'P' + Date.now(), orderId, amount: amt, note, date: Date.now() };
      const updatedPayments = [payment, ...payments];
      setPayments(updatedPayments);
      save(KEYS.payments, updatedPayments);
      return;
    }

    const order = orders.find(o => o.id === orderId);
    if (!order) return;
    const newPaid = (order.paidAmount || 0) + amt;
    const newRemaining = Math.max(0, order.grandTotal - newPaid);
    await updateDoc(doc(db, 'orders', orderId), {
      paidAmount: newPaid,
      remaining:  newRemaining,
      status:     newRemaining <= 0 ? 'paid' : newPaid > 0 ? 'partial' : 'unpaid',
    });
    await addDoc(collection(db, 'payments'), {
      orderId, amount: amt, note, date: serverTimestamp(),
    });
  }, [orders, payments]);

  // ── STOCK ──────────────────────────────────────────────────
  const setProductStock = useCallback((productId, qty) => {
    const newStock = { ...stockOvr, [productId]: Math.max(0, qty) };
    setStockOvr(newStock);
    save(KEYS.stock, newStock);
    if (!IS_DEMO) {
      updateDoc(doc(db, 'products', productId), { stock: Math.max(0, qty) }).catch(() => {});
    }
  }, [stockOvr]);

  const getStock = useCallback((productId, defaultStock = 0) => {
    return stockOvr[productId] !== undefined ? stockOvr[productId] : defaultStock;
  }, [stockOvr]);

  // ── STATS ──────────────────────────────────────────────────
  const getStats = useCallback((allProducts = []) => {
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const todayStart  = today.getTime();
    const monthStart  = new Date(today.getFullYear(), today.getMonth(), 1).getTime();
    const todayOrders = orders.filter(o => o.createdAt >= todayStart);
    const monthOrders = orders.filter(o => o.createdAt >= monthStart);
    const lowThreshold = 10;
    const lowStockProducts = allProducts.filter(p => {
      const s = stockOvr[p.id] !== undefined ? stockOvr[p.id] : (p.stock ?? 0);
      return s <= lowThreshold && p.inStock !== false;
    });
    return {
      todaysOrderCount: todayOrders.length,
      todaysSales:      todayOrders.reduce((s, o) => s + (o.grandTotal || 0), 0),
      monthlySales:     monthOrders.reduce((s, o) => s + (o.grandTotal || 0), 0),
      outstanding:      orders.reduce((s, o) => s + (o.remaining || 0), 0),
      lowStockProducts,
      recentOrders:     orders.slice(0, 5),
    };
  }, [orders, stockOvr]);

  // ── BACKUP & RESTORE ───────────────────────────────────────
  const exportData = useCallback(() => {
    return JSON.stringify({ customers, orders, payments, exportedAt: Date.now() }, null, 2);
  }, [customers, orders, payments]);

  const importData = useCallback((jsonString) => {
    const data = JSON.parse(jsonString);
    if (Array.isArray(data.customers)) {
      setCustomers(data.customers);
      save(KEYS.customers, data.customers);
    }
    if (Array.isArray(data.orders)) {
      setOrders(data.orders);
      save(KEYS.orders, data.orders);
    }
    if (Array.isArray(data.payments)) {
      setPayments(data.payments);
      save(KEYS.payments, data.payments);
    }
  }, []);

  return (
    <AppDataContext.Provider value={{
      customers, orders, payments, stockOvr, loading,
      ROUTES,
      addCustomer, updateCustomer, deleteCustomer,
      createOrder, deleteOrder,
      addPayment,
      setProductStock, getStock,
      getStats,
      exportData, importData,
    }}>
      {children}
    </AppDataContext.Provider>
  );
}

export const useAppData = () => useContext(AppDataContext);
