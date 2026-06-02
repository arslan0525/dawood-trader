import React, { createContext, useContext, useState } from 'react';

const LANG_KEY = 'dt_lang_v1';

const T = {
  en: {
    dashboard: 'Dashboard', home: 'Products', cart: 'Cart', addProduct: 'Add Product',
    profile: 'Profile', customers: 'Customers', newOrder: 'New Order',
    orderHistory: 'Order History', recovery: 'Recovery', admin: 'Admin',
    manageProducts: 'Manage Products', inventory: 'Inventory',
    save: 'Save', cancel: 'Cancel', delete: 'Delete', edit: 'Edit', add: 'Add',
    search: 'Search', filter: 'Filter', loading: 'Loading...', back: 'Back',
    noData: 'No data found', confirm: 'Confirm', yes: 'Yes', no: 'No', close: 'Close',
    totalProducts: 'Products', totalCustomers: 'Customers', totalRoutes: 'Routes',
    todaysOrders: "Today's Orders", todaysSales: "Today's Sales", monthlySales: 'Monthly Sales',
    outstandingRecovery: 'Outstanding', recentOrders: 'Recent Orders', lowStock: 'Low Stock Alert',
    customerName: 'Customer Name', phone: 'Phone', address: 'Address',
    routeNo: 'Route', notes: 'Notes', addCustomer: 'Add Customer',
    editCustomer: 'Edit Customer', noCustomers: 'No customers yet',
    selectCustomer: 'Select Customer', selectProduct: 'Select Product',
    quantity: 'Qty', rate: 'Rate (Rs)', lineTotal: 'Total', grandTotal: 'Grand Total',
    createBill: 'Create Bill', addItem: 'Add Item', removeItem: 'Remove',
    orderCreated: 'Order created!', billNo: 'Bill #', noOrders: 'No orders yet',
    totalBill: 'Total Bill', paidAmount: 'Paid', remaining: 'Remaining',
    addPayment: 'Add Payment', paymentAdded: 'Payment recorded!',
    outstanding: 'Outstanding', paid: 'Paid', partial: 'Partial',
    shareWhatsApp: 'Share on WhatsApp', thankYou: 'Thank You!',
    stock: 'Stock', inStock: 'In Stock', outOfStock: 'Out of Stock',
    route: 'Route', allRoutes: 'All Routes', date: 'Date', amount: 'Amount',
    status: 'Status', actions: 'Actions', view: 'View',
    backup: 'Backup Data', restore: 'Restore Data', language: 'Language',
    logout: 'Logout', installApp: 'Install App', settings: 'Settings',
    unit: 'Unit', category: 'Category', price: 'Price',
    from: 'From', to: 'To', allCustomers: 'All Customers',
  },
  ur: {
    dashboard: 'ڈیش بورڈ', home: 'پروڈکٹس', cart: 'کارٹ', addProduct: 'پروڈکٹ شامل',
    profile: 'پروفائل', customers: 'گاہک', newOrder: 'نیا آرڈر',
    orderHistory: 'آرڈر ہسٹری', recovery: 'ریکوری', admin: 'ایڈمن',
    manageProducts: 'پروڈکٹ مینج', inventory: 'انوینٹری',
    save: 'محفوظ', cancel: 'منسوخ', delete: 'حذف', edit: 'ترمیم', add: 'شامل',
    search: 'تلاش', filter: 'فلٹر', loading: 'لوڈ ہو رہا ہے...', back: 'واپس',
    noData: 'کوئی ڈیٹا نہیں', confirm: 'تصدیق', yes: 'ہاں', no: 'نہیں', close: 'بند',
    totalProducts: 'پروڈکٹس', totalCustomers: 'گاہک', totalRoutes: 'روٹس',
    todaysOrders: 'آج کے آرڈرز', todaysSales: 'آج کی فروخت', monthlySales: 'ماہانہ فروخت',
    outstandingRecovery: 'باقی رقم', recentOrders: 'حالیہ آرڈرز', lowStock: 'کم اسٹاک',
    customerName: 'گاہک کا نام', phone: 'فون', address: 'پتہ',
    routeNo: 'روٹ', notes: 'نوٹس', addCustomer: 'گاہک شامل کریں',
    editCustomer: 'گاہک ترمیم', noCustomers: 'کوئی گاہک نہیں',
    selectCustomer: 'گاہک منتخب کریں', selectProduct: 'پروڈکٹ منتخب کریں',
    quantity: 'تعداد', rate: 'ریٹ (Rs)', lineTotal: 'ٹوٹل', grandTotal: 'کل رقم',
    createBill: 'بل بنائیں', addItem: 'آئٹم شامل', removeItem: 'ہٹائیں',
    orderCreated: 'آرڈر بن گیا!', billNo: 'بل #', noOrders: 'کوئی آرڈر نہیں',
    totalBill: 'کل بل', paidAmount: 'ادا', remaining: 'باقی',
    addPayment: 'ادائیگی شامل', paymentAdded: 'ادائیگی درج!',
    outstanding: 'بقایہ', paid: 'ادا شدہ', partial: 'جزوی',
    shareWhatsApp: 'واٹس ایپ پر شیئر', thankYou: 'خریداری کا شکریہ!',
    stock: 'اسٹاک', inStock: 'موجود', outOfStock: 'ختم',
    route: 'روٹ', allRoutes: 'سب روٹس', date: 'تاریخ', amount: 'رقم',
    status: 'حالت', actions: 'عمل', view: 'دیکھیں',
    backup: 'بیک اپ', restore: 'ریسٹور', language: 'زبان',
    logout: 'لاگ آوٹ', installApp: 'ایپ انسٹال', settings: 'ترتیبات',
    unit: 'یونٹ', category: 'زمرہ', price: 'قیمت',
    from: 'سے', to: 'تک', allCustomers: 'سب گاہک',
  },
};

const LanguageContext = createContext();

export function LanguageProvider({ children }) {
  const [lang, setLang] = useState(() => {
    try { return (typeof localStorage !== 'undefined' && localStorage.getItem(LANG_KEY)) || 'en'; }
    catch { return 'en'; }
  });

  const switchLang = (l) => {
    setLang(l);
    try { typeof localStorage !== 'undefined' && localStorage.setItem(LANG_KEY, l); } catch {}
  };

  const t = (key) => T[lang]?.[key] ?? T.en[key] ?? key;

  return (
    <LanguageContext.Provider value={{ lang, switchLang, t, isUrdu: lang === 'ur' }}>
      {children}
    </LanguageContext.Provider>
  );
}

export const useLang = () => useContext(LanguageContext);
