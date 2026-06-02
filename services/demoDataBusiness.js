// ─────────────────────────────────────────────────────────────
//  DEMO BUSINESS DATA  (customers, orders, payments)
// ─────────────────────────────────────────────────────────────

const now = Date.now();
const d = (daysAgo) => now - daysAgo * 86400000;

export const DEMO_CUSTOMERS = [
  { id: 'c1', name: 'Ahmed Store',        phone: '0321-1234567', address: 'Shop 5, Main Bazaar, Lahore',      routeId: 1, notes: 'Regular customer, on-time payments', createdAt: d(30) },
  { id: 'c2', name: 'Raza General Store', phone: '0300-9876543', address: 'Block B, Model Town, Lahore',       routeId: 2, notes: 'Large orders, Friday delivery preferred', createdAt: d(25) },
  { id: 'c3', name: 'Khan Brothers',      phone: '0345-5555555', address: 'Near Masjid, Gulberg III, Lahore', routeId: 1, notes: '', createdAt: d(20) },
  { id: 'c4', name: 'Bilal Mart',         phone: '0333-1111111', address: 'Defence Road, Lahore',             routeId: 3, notes: 'Morning delivery preferred', createdAt: d(18) },
  { id: 'c5', name: 'Ali Traders',        phone: '0311-2222222', address: 'Johar Town, Lahore',               routeId: 2, notes: '', createdAt: d(15) },
  { id: 'c6', name: 'Habib Super Store',  phone: '0322-3333333', address: 'Faisal Town, Lahore',              routeId: 4, notes: 'Weekly payment schedule', createdAt: d(12) },
  { id: 'c7', name: 'Tariq Shop',         phone: '0312-4444444', address: 'Bahria Town Phase 4, Lahore',      routeId: 5, notes: '', createdAt: d(10) },
  { id: 'c8', name: 'National Store',     phone: '0315-6666666', address: 'DHA Phase 5, Lahore',              routeId: 3, notes: 'Credit customer — max Rs.20,000', createdAt: d(8) },
  { id: 'c9', name: 'Zubair Trading',     phone: '0324-7777777', address: 'Shahdara, Lahore',                 routeId: 6, notes: '', createdAt: d(6) },
  { id: 'c10', name: 'Modern Store',      phone: '0316-8888888', address: 'Samanabad, Lahore',                routeId: 7, notes: 'New customer since last month', createdAt: d(4) },
];

export const DEMO_ORDERS = [
  {
    id: 'O1717000001',
    customerId: 'c1', customerName: 'Ahmed Store',
    customerPhone: '0321-1234567', customerAddress: 'Shop 5, Main Bazaar, Lahore', routeId: 1,
    items: [
      { productId: 'cd-1',  productName: 'OG Cola 1 Liter',     unit: '1 Liter',  quantity: 20, rate: 130, lineTotal: 2600 },
      { productId: 'ms-1',  productName: 'Murghi Masala 50g',   unit: '50g',      quantity: 10, rate: 80,  lineTotal: 800  },
      { productId: 'cd-4',  productName: 'OG Lemon 1.5L',       unit: '1.5 Liter',quantity: 5,  rate: 100, lineTotal: 500  },
    ],
    grandTotal: 3900, paidAmount: 3000, remaining: 900, status: 'partial', createdAt: d(0),
  },
  {
    id: 'O1717000002',
    customerId: 'c2', customerName: 'Raza General Store',
    customerPhone: '0300-9876543', customerAddress: 'Block B, Model Town, Lahore', routeId: 2,
    items: [
      { productId: 'sn-1',  productName: 'Lays Classic 34g',    unit: '34g',  quantity: 50, rate: 30,  lineTotal: 1500 },
      { productId: 'sn-2',  productName: 'Lays Magic Masala',   unit: '34g',  quantity: 50, rate: 30,  lineTotal: 1500 },
      { productId: 'gr-1',  productName: 'Shezan Ketchup 500g', unit: '500g', quantity: 10, rate: 185, lineTotal: 1850 },
    ],
    grandTotal: 4850, paidAmount: 4850, remaining: 0, status: 'paid', createdAt: d(1),
  },
  {
    id: 'O1717000003',
    customerId: 'c4', customerName: 'Bilal Mart',
    customerPhone: '0333-1111111', customerAddress: 'Defence Road, Lahore', routeId: 3,
    items: [
      { productId: 'cd-5b', productName: 'OG Orange 500ml',   unit: '500ml',   quantity: 30, rate: 75,  lineTotal: 2250 },
      { productId: 'cd-4b', productName: 'OG Lemon 500ml',    unit: '500ml',   quantity: 20, rate: 75,  lineTotal: 1500 },
      { productId: 'ms-6',  productName: 'Broast Masala 50g', unit: '50g',     quantity: 15, rate: 75,  lineTotal: 1125 },
    ],
    grandTotal: 4875, paidAmount: 2000, remaining: 2875, status: 'partial', createdAt: d(2),
  },
  {
    id: 'O1717000004',
    customerId: 'c5', customerName: 'Ali Traders',
    customerPhone: '0311-2222222', customerAddress: 'Johar Town, Lahore', routeId: 2,
    items: [
      { productId: 'ms-2a', productName: 'Biryani Masala 50g', unit: '50g',  quantity: 20, rate: 90,  lineTotal: 1800 },
      { productId: 'ms-3',  productName: 'Qorma Masala 50g',   unit: '50g',  quantity: 15, rate: 85,  lineTotal: 1275 },
      { productId: 'pt-1',  productName: 'Penne Pasta 500g',   unit: '500g', quantity: 10, rate: 180, lineTotal: 1800 },
    ],
    grandTotal: 4875, paidAmount: 0, remaining: 4875, status: 'unpaid', createdAt: d(3),
  },
  {
    id: 'O1717000005',
    customerId: 'c3', customerName: 'Khan Brothers',
    customerPhone: '0345-5555555', customerAddress: 'Near Masjid, Gulberg III, Lahore', routeId: 1,
    items: [
      { productId: 'gr-8',  productName: 'Sugar 10kg',            unit: '10kg',  quantity: 3,  rate: 1500, lineTotal: 4500 },
      { productId: 'gr-5',  productName: 'Lipton Yellow Label',   unit: '200g',  quantity: 5,  rate: 480,  lineTotal: 2400 },
      { productId: 'hh-1',  productName: 'Surf Excel 1kg',        unit: '1kg',   quantity: 6,  rate: 420,  lineTotal: 2520 },
    ],
    grandTotal: 9420, paidAmount: 5000, remaining: 4420, status: 'partial', createdAt: d(7),
  },
  {
    id: 'O1717000006',
    customerId: 'c6', customerName: 'Habib Super Store',
    customerPhone: '0322-3333333', customerAddress: 'Faisal Town, Lahore', routeId: 4,
    items: [
      { productId: 'cd-0a', productName: 'OG Cola 2.25L',         unit: '2.25 Liter', quantity: 24, rate: 200, lineTotal: 4800 },
      { productId: 'cd-5d', productName: 'OG Orange 2.25L',       unit: '2.25 Liter', quantity: 12, rate: 160, lineTotal: 1920 },
    ],
    grandTotal: 6720, paidAmount: 6720, remaining: 0, status: 'paid', createdAt: d(10),
  },
  {
    id: 'O1717000007',
    customerId: 'c8', customerName: 'National Store',
    customerPhone: '0315-6666666', customerAddress: 'DHA Phase 5, Lahore', routeId: 3,
    items: [
      { productId: 'ms-16', productName: 'Turmeric Powder 50g',   unit: '50g', quantity: 24, rate: 45, lineTotal: 1080 },
      { productId: 'ms-15a',productName: 'Red Chili Powder 50g',  unit: '50g', quantity: 24, rate: 50, lineTotal: 1200 },
      { productId: 'ms-17', productName: 'Coriander Powder 50g',  unit: '50g', quantity: 24, rate: 40, lineTotal: 960  },
      { productId: 'ms-18', productName: 'Cumin Seed Powder 25g', unit: '25g', quantity: 24, rate: 40, lineTotal: 960  },
    ],
    grandTotal: 4200, paidAmount: 0, remaining: 4200, status: 'unpaid', createdAt: d(14),
  },
];

export const DEMO_PAYMENTS = [
  { id: 'P1', orderId: 'O1717000001', customerId: 'c1', amount: 3000, note: 'Cash payment', date: d(0) },
  { id: 'P2', orderId: 'O1717000002', customerId: 'c2', amount: 4850, note: 'Full payment', date: d(1) },
  { id: 'P3', orderId: 'O1717000003', customerId: 'c4', amount: 2000, note: 'Advance payment', date: d(2) },
  { id: 'P4', orderId: 'O1717000005', customerId: 'c3', amount: 5000, note: 'Partial payment', date: d(6) },
  { id: 'P5', orderId: 'O1717000006', customerId: 'c6', amount: 6720, note: 'Full payment by transfer', date: d(9) },
];
