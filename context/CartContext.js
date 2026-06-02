import React, { createContext, useContext, useState, useEffect } from 'react';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const CartContext = createContext();
const CART_KEY = 'dt_cart_v1';

async function loadCartFromStorage() {
  try {
    if (Platform.OS === 'web') {
      if (typeof localStorage === 'undefined') return [];
      const raw = localStorage.getItem(CART_KEY);
      return raw ? JSON.parse(raw) : [];
    }
    const raw = await AsyncStorage.getItem(CART_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

async function saveCartToStorage(cart) {
  try {
    const json = JSON.stringify(cart);
    if (Platform.OS === 'web') {
      if (typeof localStorage !== 'undefined') localStorage.setItem(CART_KEY, json);
    } else {
      await AsyncStorage.setItem(CART_KEY, json);
    }
  } catch {}
}

export function CartProvider({ children }) {
  const [cart, setCart]       = useState([]);
  const [hydrated, setHydrated] = useState(false);

  // Load saved cart on startup
  useEffect(() => {
    loadCartFromStorage().then(saved => {
      if (saved.length > 0) setCart(saved);
      setHydrated(true);
    });
  }, []);

  // Save whenever cart changes (after first load)
  useEffect(() => {
    if (hydrated) saveCartToStorage(cart);
  }, [cart, hydrated]);

  const addToCart = (product) => {
    setCart(prev => {
      const existing = prev.find(i => i.id === product.id);
      if (existing) return prev.map(i => i.id === product.id ? { ...i, qty: i.qty + 1 } : i);
      return [...prev, { ...product, qty: 1 }];
    });
  };

  const removeFromCart = (id) => setCart(prev => prev.filter(i => i.id !== id));

  const updateQty = (id, qty) => {
    if (qty < 1) { removeFromCart(id); return; }
    setCart(prev => prev.map(i => i.id === id ? { ...i, qty } : i));
  };

  const clearCart = () => setCart([]);

  const total     = cart.reduce((sum, i) => sum + i.price * i.qty, 0);
  const itemCount = cart.reduce((sum, i) => sum + i.qty, 0);

  return (
    <CartContext.Provider value={{ cart, addToCart, removeFromCart, updateQty, clearCart, total, itemCount }}>
      {children}
    </CartContext.Provider>
  );
}

export const useCart = () => useContext(CartContext);
