import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import {
  collection, onSnapshot, addDoc, updateDoc, deleteDoc,
  doc, query, orderBy, limit, serverTimestamp, writeBatch, getDocs,
} from 'firebase/firestore';
import { db, IS_DEMO } from '../services/firebase';
import {
  DEMO_CUSTOMERS, DEMO_ORDERS, DEMO_PAYMENTS,
} from '../services/demoDataBusiness';
import { DEMO_PRODUCTS } from '../services/demoData';

// ── Storage keys (demo / localStorage) ─────────────────────
const KEYS = {
  products:  'dt_products_v1',
  customers: 'dt_customers_v2',
  orders:    'dt_orders_v2',
  payments:  'dt_payments_v2',
  stock:     'dt_stock_v2',
};

// ── Routes (static 1-7) ─────────────────────────────────────
export const ROUTES = [
  { id: 1, name: 'Kot Chutta',  color: '#dbeafe', textColor: '#1d4ed8' },
  { id: 2, name: 'Nawa City',   color: '#dcfce7', textColor: '#15803d' },
  { id: 3, name: 'Shero',       color: '#fef3c7', textColor: '#92400e' },
  { id: 4, name: 'Choti',       color: '#f3e8ff', textColor: '#7e22ce' },
  { id: 5, name: 'Paiga',       color: '#ffedd5', textColor: '#c2410c' },
  { id: 6, name: 'Jhok',        color: '#fee2e2', textColor: '#b91c1c' },
  { id: 7, name: 'Khanpure',    color: '#e0f2fe', textColor: '#0369a1' },
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
  const [products,  setProducts]  = useState([]);
  const [customers, setCustomers] = useState([]);
  const [orders,    setOrders]    = useState([]);
  const [payments,  setPayments]  = useState([]);
  const [stockOvr,  setStockOvr]  = useState({});   // { productId: qty }
  const [loading,   setLoading]   = useState(true);
  const [loadError, setLoadError] = useState(false);

  // ── Initial load ───────────────────────────────────────────
  useEffect(() => {
    if (IS_DEMO) {
      setProducts(load(KEYS.products, DEMO_PRODUCTS));
      setCustomers(load(KEYS.customers, DEMO_CUSTOMERS));
      setOrders(load(KEYS.orders,       DEMO_ORDERS));
      setPayments(load(KEYS.payments,   DEMO_PAYMENTS));
      setStockOvr(load(KEYS.stock,      {}));
      setLoading(false);
      return;
    }

    // Firebase real-time listeners
    const unsubs = [];

    // One-time cleanup: sirf OG products bachao, baaki delete
    const OG_CLEANUP_KEY = 'dt_og_cleanup_v4';
    let cleanupRan = false;
    const runOgCleanup = async () => {
      if (cleanupRan) return;
      cleanupRan = true;
      try {
        if (typeof localStorage !== 'undefined' && localStorage.getItem(OG_CLEANUP_KEY)) return;
        const KEEP = new Set(['OG Cola', 'OG Lemon', 'OG Orange', 'Fanta Orange']);
        const snap = await getDocs(collection(db, 'products'));
        const toDelete = snap.docs.filter(d => !KEEP.has(d.data().name));
        if (toDelete.length === 0) { if (typeof localStorage !== 'undefined') localStorage.setItem(OG_CLEANUP_KEY, '1'); return; }
        for (const d of toDelete) {
          try { await deleteDoc(doc(db, 'products', d.id)); } catch {}
        }
        if (typeof localStorage !== 'undefined') localStorage.setItem(OG_CLEANUP_KEY, '1');
        console.log(`OG cleanup: ${toDelete.length} products deleted`);
      } catch (e) {
        console.warn('OG cleanup failed:', e?.message);
      }
    };

    // Auto-seed products if Firestore is empty
    let productSeeded = false;
    const seedProducts = async () => {
      try {
        const batch = writeBatch(db);
        DEMO_PRODUCTS.forEach(p => {
          const { id: _id, ...rest } = p;
          const docRef = doc(collection(db, 'products'));
          batch.set(docRef, { ...rest, createdAt: serverTimestamp() });
        });
        await batch.commit();
      } catch (e) {
        console.error('Seeding products failed:', e);
        setLoadError(true);
        setLoading(false);
      }
    };

    const LIMITS = { products: 500, customers: 500, payments: 500 };
    const listenCol = (colName, setter, sortField = 'createdAt') => {
      const lim = LIMITS[colName];
      const q = lim
        ? query(collection(db, colName), orderBy(sortField, 'desc'), limit(lim))
        : query(collection(db, colName), orderBy(sortField, 'desc'));
      const unsub = onSnapshot(q, { includeMetadataChanges: false }, async snap => {
        if (colName === 'products' && snap.empty && !productSeeded) {
          productSeeded = true;
          await seedProducts();
          return; // listener will fire again after seeding
        }
        if (colName === 'products' && !snap.empty) runOgCleanup();
        setter(snap.docs.map(d => ({ id: d.id, ...d.data() })));
        setLoading(false);
      }, (err) => {
        console.error(`Firebase error loading ${colName}:`, err);
        setLoadError(true);
        setLoading(false);
      });
      unsubs.push(unsub);
    };

    listenCol('products',  setProducts);
    listenCol('customers', setCustomers);
    listenCol('orders',    setOrders);
    listenCol('payments',  setPayments);
    setLoading(false);

    return () => unsubs.forEach(u => u());
  }, []);

  // ── CUSTOMER CRUD ──────────────────────────────────────────
  const addCustomer = useCallback(async (data) => {
    const name = data.name?.trim() || '';
    if (!name) throw new Error('Customer name is required');
    const customer = {
      name,
      phone:    data.phone?.trim() || '',
      address:  data.address?.trim() || '',
      routeId:  Number(data.routeId) || 1,
      notes:    data.notes?.trim() || '',
      status:   'active',
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
      name:    data.name?.trim() || '',
      phone:   data.phone?.trim() || '',
      address: data.address?.trim() || '',
      routeId: Number(data.routeId) || 1,
      notes:   data.notes?.trim() || '',
      ...(data.status !== undefined ? { status: data.status } : {}),
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
    if (!data.customerId) throw new Error('Customer is required');
    if (!data.items || data.items.length === 0) throw new Error('Order must have at least one item');
    const order = {
      customerId:      data.customerId,
      customerName:    data.customerName,
      customerPhone:   data.customerPhone,
      customerAddress: data.customerAddress,
      routeId:         Number(data.routeId) || 1,
      items:           data.items || [],
      grandTotal:      data.grandTotal || 0,
      paidAmount:      data.paidAmount || 0,
      remaining:       Math.max(0, (data.grandTotal || 0) - (data.paidAmount || 0)),
      status:          data.paidAmount >= data.grandTotal ? 'paid' : data.paidAmount > 0 ? 'partial' : 'unpaid',
      note:            data.note || '',
      salesmanId:      data.salesmanId || '',
      salesmanName:    data.salesmanName || '',
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
      // Also remove related payments
      const updatedPayments = payments.filter(p => p.orderId !== id);
      setPayments(updatedPayments);
      save(KEYS.payments, updatedPayments);
      return;
    }
    await deleteDoc(doc(db, 'orders', id));
  }, [orders, payments]);

  const updateOrder = useCallback(async (id, patch) => {
    const paidAmount = patch.paidAmount ?? 0;
    const grandTotal = patch.grandTotal ?? 0;
    const remaining  = Math.max(0, grandTotal - paidAmount);
    const status     = remaining <= 0 ? 'paid' : paidAmount > 0 ? 'partial' : 'unpaid';
    const updated    = { ...patch, remaining, status };

    if (IS_DEMO) {
      const updatedOrders = orders.map(o => o.id === id ? { ...o, ...updated } : o);
      setOrders(updatedOrders);
      save(KEYS.orders, updatedOrders);
      return;
    }
    await updateDoc(doc(db, 'orders', id), updated);
  }, [orders]);

  // ── PAYMENT ────────────────────────────────────────────────
  const addPayment = useCallback(async (orderId, amount, note = '', salesmanId = '', salesmanName = '') => {
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

      const payment = { id: 'P' + Date.now(), orderId, amount: amt, note, salesmanId, salesmanName, date: Date.now() };
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
      orderId, amount: amt, note, salesmanId, salesmanName, date: serverTimestamp(),
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

  // ── PRODUCT CRUD ──────────────────────────────────────────
  const removeProduct = useCallback(async (id) => {
    if (IS_DEMO) {
      setProducts(prev => {
        const updated = prev.filter(p => p.id !== id);
        save(KEYS.products, updated);
        return updated;
      });
      return;
    }
    await deleteDoc(doc(db, 'products', id));
  }, []);

  const addProductDemo = useCallback((data) => {
    const product = {
      ...data,
      id:        'p_' + Date.now(),
      createdAt:  Date.now(),
      inStock:   data.inStock !== false,
    };
    setProducts(prev => {
      const updated = [product, ...prev];
      save(KEYS.products, updated);
      return updated;
    });
    return product;
  }, []);

  const addProduct = useCallback(async (data) => {
    const product = {
      name:        data.name?.trim() || '',
      price:       Number(data.price) || 0,
      unit:        data.unit?.trim() || '',
      category:    data.category?.trim() || '',
      stock:       Number(data.stock) || 0,
      inStock:     data.inStock !== false,
      sku:         data.sku?.trim() || '',
      description: data.description?.trim() || '',
      imageUrl:    data.imageUrl || null,
    };
    if (IS_DEMO) {
      return addProductDemo(product);
    }
    const ref = await addDoc(collection(db, 'products'), { ...product, createdAt: serverTimestamp() });
    return { ...product, id: ref.id };
  }, [addProductDemo]);

  const updateProductDemo = useCallback((id, data) => {
    setProducts(prev => {
      const updated = prev.map(p => p.id === id ? { ...p, ...data } : p);
      save(KEYS.products, updated);
      return updated;
    });
  }, []);

  const updateProduct = useCallback(async (id, data) => {
    if (IS_DEMO) {
      updateProductDemo(id, data);
      return;
    }
    await updateDoc(doc(db, 'products', id), data);
  }, [updateProductDemo]);

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

  const contextValue = useMemo(() => ({
    products, customers, orders, payments, stockOvr, loading, loadError,
    ROUTES,
    addCustomer, updateCustomer, deleteCustomer,
    createOrder, deleteOrder, updateOrder,
    addPayment,
    setProductStock, getStock,
    removeProduct, addProduct, addProductDemo, updateProduct, updateProductDemo,
    getStats,
    exportData, importData,
  }), [products, customers, orders, payments, stockOvr, loading, loadError, removeProduct,
    addCustomer, updateCustomer, deleteCustomer,
    createOrder, deleteOrder, updateOrder, addPayment,
    addProduct, addProductDemo, updateProduct, updateProductDemo,
    setProductStock, getStock, getStats, exportData, importData]);

  return (
    <AppDataContext.Provider value={contextValue}>
      {children}
    </AppDataContext.Provider>
  );
}

export const useAppData = () => useContext(AppDataContext);
