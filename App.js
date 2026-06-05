import React from 'react';
import { Platform } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { ActivityIndicator, View, Text } from 'react-native';

if (Platform.OS === 'web' && typeof document !== 'undefined') {
  document.documentElement.style.cssText = 'height:100%;overflow:hidden;';
  document.body.style.cssText = 'height:100%;overflow:hidden;margin:0;padding:0;';
  const css = document.createElement('style');
  css.textContent = `
    ::-webkit-scrollbar { width: 10px; height: 10px; }
    ::-webkit-scrollbar-track { background: #e2e8f0; border-radius: 0; }
    ::-webkit-scrollbar-thumb { background: #94a3b8; border-radius: 5px; border: 2px solid #e2e8f0; }
    ::-webkit-scrollbar-thumb:hover { background: #475569; }
    ::-webkit-scrollbar-corner { background: #e2e8f0; }
    * { scrollbar-width: thin; scrollbar-color: #94a3b8 #e2e8f0; }
    [data-scroll], div[style*="overflow-y: scroll"] { overflow-y: scroll !important; }
    div[style*="overflow-x: auto"] {
      -webkit-overflow-scrolling: touch !important;
      touch-action: pan-x !important;
      overscroll-behavior-x: contain;
    }
  `;
  document.head.appendChild(css);
}

import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';

import { AuthProvider, useAuth }       from './context/AuthContext';
import { CartProvider, useCart }       from './context/CartContext';
import { ToastProvider }               from './context/ToastContext';
import { LanguageProvider }            from './context/LanguageContext';
import { AppDataProvider }             from './context/AppDataContext';

import LoginScreen         from './screens/LoginScreen';
import SignupScreen        from './screens/SignupScreen';
import HomeScreen          from './screens/HomeScreen';
import ProductDetailScreen from './screens/ProductDetailScreen';
import CartScreen          from './screens/CartScreen';
import AdminScreen         from './screens/AdminScreen';
import AddItemScreen       from './screens/AddItemScreen';
import ProfileScreen       from './screens/ProfileScreen';
import WebLayout           from './screens/WebLayout';
import DashboardScreen       from './screens/DashboardScreen';
import CustomersScreen       from './screens/CustomersScreen';
import OrdersScreen          from './screens/OrdersScreen';
import OrderHistoryScreen    from './screens/OrderHistoryScreen';
import RecoveryScreen        from './screens/RecoveryScreen';
import CustomerProfileScreen from './screens/CustomerProfileScreen';

const Stack = createStackNavigator();
const Tab   = createBottomTabNavigator();

function CartTabIcon({ focused }) {
  const { itemCount } = useCart();
  return (
    <View style={{ width: 28, height: 28, alignItems: 'center', justifyContent: 'center' }}>
      <Text style={{ fontSize: 22, opacity: focused ? 1 : 0.55 }}>🛒</Text>
      {itemCount > 0 && (
        <View style={{
          position: 'absolute', top: -2, right: -4,
          backgroundColor: '#ef4444', borderRadius: 9,
          minWidth: 17, height: 17,
          justifyContent: 'center', alignItems: 'center', paddingHorizontal: 3,
        }}>
          <Text style={{ color: '#fff', fontSize: 9, fontWeight: 'bold' }}>
            {itemCount > 9 ? '9+' : itemCount}
          </Text>
        </View>
      )}
    </View>
  );
}

function MobileTabs() {
  const { isAdmin } = useAuth();
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#ffffff',
          borderTopWidth: 1,
          borderTopColor: '#e5e7eb',
          paddingTop: 8,
          paddingBottom: 14,
          height: 70,
        },
        tabBarActiveTintColor: '#1a56db',
        tabBarInactiveTintColor: '#9ca3af',
        tabBarLabelStyle: { fontSize: 10, fontWeight: '700', marginTop: 2 },
      }}
    >
      <Tab.Screen
        name="Dashboard"
        component={DashboardScreen}
        options={{
          tabBarLabel: 'Dashboard',
          tabBarIcon: ({ focused }) => (
            <Text style={{ fontSize: 20, opacity: focused ? 1 : 0.55 }}>📊</Text>
          ),
        }}
      />
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          tabBarLabel: 'Products',
          tabBarIcon: ({ focused }) => (
            <Text style={{ fontSize: 20, opacity: focused ? 1 : 0.55 }}>🏠</Text>
          ),
        }}
      />
      <Tab.Screen
        name="Cart"
        component={CartScreen}
        options={{
          tabBarLabel: 'Cart',
          tabBarIcon: ({ focused }) => <CartTabIcon focused={focused} />,
        }}
      />
      {isAdmin && (
        <Tab.Screen
          name="Customers"
          component={CustomersScreen}
          options={{
            tabBarLabel: 'Customers',
            tabBarIcon: ({ focused }) => (
              <Text style={{ fontSize: 20, opacity: focused ? 1 : 0.55 }}>👥</Text>
            ),
          }}
        />
      )}
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          tabBarLabel: 'Profile',
          tabBarIcon: ({ focused }) => (
            <Text style={{ fontSize: 20, opacity: focused ? 1 : 0.55 }}>👤</Text>
          ),
        }}
      />
    </Tab.Navigator>
  );
}

function AppNavigator() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f0f4ff' }}>
        <ActivityIndicator size="large" color="#1a56db" />
        <Text style={{ marginTop: 12, color: '#6b7280', fontSize: 14 }}>Loading...</Text>
      </View>
    );
  }

  const MainLayout = Platform.OS === 'web' ? WebLayout : MobileTabs;

  return (
    <Stack.Navigator screenOptions={{
        headerShown: false,
        gestureEnabled: Platform.OS !== 'web',
        cardStyle: { flex: 1, backgroundColor: 'transparent' },
      }}>
      {user ? (
        <>
          <Stack.Screen name="Main"          component={MainLayout}         />
          <Stack.Screen name="ProductDetail" component={ProductDetailScreen}/>
          <Stack.Screen name="Admin"         component={AdminScreen}        />
          <Stack.Screen name="AddItem"       component={AddItemScreen}      />
          <Stack.Screen name="Orders"          component={OrdersScreen}          />
          <Stack.Screen name="OrderHistory"  component={OrderHistoryScreen}    />
          <Stack.Screen name="Recovery"      component={RecoveryScreen}        />
          <Stack.Screen name="CustomerProfile" component={CustomerProfileScreen} />
        </>
      ) : (
        <>
          <Stack.Screen name="Login"  component={LoginScreen}  />
          <Stack.Screen name="Signup" component={SignupScreen} />
        </>
      )}
    </Stack.Navigator>
  );
}

export default function App() {
  return (
    <View style={{ flex: 1, ...(Platform.OS === 'web' ? { height: 'calc(var(--vh, 1vh) * 100)', overflow: 'hidden' } : {}) }}>
      <ToastProvider>
        <LanguageProvider>
          <AuthProvider>
            <AppDataProvider>
              <CartProvider>
                <NavigationContainer>
                  <StatusBar style="light" />
                  <AppNavigator />
                </NavigationContainer>
              </CartProvider>
            </AppDataProvider>
          </AuthProvider>
        </LanguageProvider>
      </ToastProvider>
    </View>
  );
}
