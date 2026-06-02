import React, { createContext, useContext, useState, useCallback } from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';

const ToastContext = createContext();

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const showToast = useCallback((message, type = 'success') => {
    const id = Date.now() + Math.random();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 3200);
  }, []);

  const ICONS = { success: '✅', error: '❌', info: 'ℹ️', warning: '⚠️' };

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <View style={s.wrapper} pointerEvents="none">
        {toasts.map(t => (
          <View key={t.id} style={[s.toast, s[t.type]]}>
            <Text style={s.icon}>{ICONS[t.type] || '✅'}</Text>
            <Text style={[s.msg, s[t.type + 'Text']]}>{t.message}</Text>
          </View>
        ))}
      </View>
    </ToastContext.Provider>
  );
}

export const useToast = () => useContext(ToastContext);

const s = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    top: Platform.OS === 'web' ? 16 : 56,
    left: 0, right: 0,
    alignItems: 'center',
    zIndex: 99999,
    ...(Platform.OS === 'web' ? { pointerEvents: 'none' } : {}),
  },
  toast: {
    flexDirection: 'row', alignItems: 'center',
    borderRadius: 12, paddingHorizontal: 18, paddingVertical: 12,
    marginBottom: 8, maxWidth: 420, minWidth: 220,
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.14, shadowRadius: 14, elevation: 10,
    borderWidth: 1,
  },
  success:     { backgroundColor: '#f0fdf4', borderColor: '#86efac' },
  error:       { backgroundColor: '#fef2f2', borderColor: '#fca5a5' },
  info:        { backgroundColor: '#eff6ff', borderColor: '#93c5fd' },
  warning:     { backgroundColor: '#fffbeb', borderColor: '#fde68a' },
  successText: { color: '#15803d' },
  errorText:   { color: '#dc2626' },
  infoText:    { color: '#1d4ed8' },
  warningText: { color: '#92400e' },
  icon: { fontSize: 15, marginRight: 8 },
  msg:  { fontSize: 14, fontWeight: '600', flex: 1 },
});
