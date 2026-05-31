// ─────────────────────────────────────────────────────
//  DEMO PRODUCTS  (used when Firebase is not connected)
// ─────────────────────────────────────────────────────

export const DEMO_PRODUCTS = [

  // ══ COLD DRINKS ══════════════════════════════════════
  {
    id: 'cd-1', name: 'OG Cola', price: 130, unit: '1 Liter',
    category: 'Cold Drinks', stock: 200, inStock: true, sku: 'OGC-1L',
    description: 'Pakistan ki apni cola drink. Bold aur refreshing taste.',
    imageUrl: 'https://ogcola.com/wp-content/uploads/2024/09/COLA-LOGO-300x300.png',
  },
  {
    id: 'cd-2', name: 'OG Cola', price: 80, unit: 'Half Liter',
    category: 'Cold Drinks', stock: 300, inStock: true, sku: 'OGC-500ML',
    description: 'OG Cola 500ml — perfect size for on the go.',
    imageUrl: 'https://ogcola.com/wp-content/uploads/2024/09/COLA-LOGO-300x300.png',
  },
  {
    id: 'cd-3', name: 'OG Cola', price: 60, unit: '345ml',
    category: 'Cold Drinks', stock: 500, inStock: true, sku: 'OGC-345ML',
    description: 'OG Cola 345ml can — choti bottle, bhari taste.',
    imageUrl: 'https://ogcola.com/wp-content/uploads/2024/09/COLA-LOGO-300x300.png',
  },
  {
    id: 'cd-4', name: 'OG Lemon', price: 100, unit: '1.5 Liter',
    category: 'Cold Drinks', stock: 180, inStock: true, sku: 'OGL-1.5L',
    description: 'Zesty lemon flavor — OG Lemon. Garmi ka best solution.',
    imageUrl: 'https://ogcola.com/wp-content/uploads/2024/09/OG-LEMON-1.5-300x300.png',
  },
  {
    id: 'cd-5', name: 'OG Orange', price: 100, unit: '1.5 Liter',
    category: 'Cold Drinks', stock: 160, inStock: true, sku: 'OGO-1.5L',
    description: 'Meetha orange flavor — OG Orange. Refreshing everyday drink.',
    imageUrl: 'https://ogcola.com/wp-content/uploads/2024/09/OG-Orange-1.5-Ltr-300x300.jpg',
  },
  {
    id: 'cd-6', name: 'Sprite', price: 140, unit: '1 Liter',
    category: 'Cold Drinks', stock: 250, inStock: true, sku: 'SPR-1L',
    description: 'Crystal clear lemon-lime taste. Obey your thirst.',
    imageUrl: null,
  },
  {
    id: 'cd-7', name: 'Sprite', price: 85, unit: 'Half Liter',
    category: 'Cold Drinks', stock: 400, inStock: true, sku: 'SPR-500ML',
    description: 'Sprite 500ml — light, crisp, refreshing.',
    imageUrl: null,
  },
  {
    id: 'cd-8', name: 'Sprite', price: 65, unit: '345ml',
    category: 'Cold Drinks', stock: 600, inStock: true, sku: 'SPR-345ML',
    description: 'Sprite 345ml — perfect choti size.',
    imageUrl: null,
  },
  {
    id: 'cd-9', name: 'Fanta Orange', price: 140, unit: '1 Liter',
    category: 'Cold Drinks', stock: 200, inStock: true, sku: 'FNT-1L',
    description: 'Real orange flavor, Fanta ki pehchaan.',
    imageUrl: null,
  },
  {
    id: 'cd-10', name: 'Fanta Orange', price: 85, unit: 'Half Liter',
    category: 'Cold Drinks', stock: 350, inStock: true, sku: 'FNT-500ML',
    description: 'Fanta 500ml — bold orange flavor on the go.',
    imageUrl: null,
  },
  {
    id: 'cd-11', name: 'Fanta Orange', price: 65, unit: '345ml',
    category: 'Cold Drinks', stock: 500, inStock: true, sku: 'FNT-345ML',
    description: 'Fanta 345ml — bursting with orange taste.',
    imageUrl: null,
  },
  {
    id: 'cd-12', name: 'Mirinda', price: 140, unit: '1 Liter',
    category: 'Cold Drinks', stock: 180, inStock: true, sku: 'MIR-1L',
    description: 'Mirinda — the ultimate fruity refreshment.',
    imageUrl: null,
  },
  {
    id: 'cd-13', name: 'Mirinda', price: 85, unit: 'Half Liter',
    category: 'Cold Drinks', stock: 300, inStock: true, sku: 'MIR-500ML',
    description: 'Mirinda 500ml — sweet & tangy flavor.',
    imageUrl: null,
  },
  {
    id: 'cd-14', name: 'Mirinda', price: 65, unit: '345ml',
    category: 'Cold Drinks', stock: 450, inStock: true, sku: 'MIR-345ML',
    description: 'Mirinda 345ml — fruity taste anywhere.',
    imageUrl: null,
  },
  {
    id: 'cd-15', name: 'Shezan Mango Juice', price: 55, unit: '250ml',
    category: 'Cold Drinks', stock: 400, inStock: true, sku: 'SHZ-MNG',
    description: 'Aam ke ras se bharpoor — Shezan Mango Juice.',
    imageUrl: 'https://shezan.com/wp-content/uploads/2016/03/shezan-website-products-bottles-mango.jpg',
  },
  {
    id: 'cd-16', name: 'Shezan Lychee Juice', price: 55, unit: '250ml',
    category: 'Cold Drinks', stock: 300, inStock: true, sku: 'SHZ-LYC',
    description: 'Exotic lychee flavor — Shezan ki special drink.',
    imageUrl: 'https://shezan.com/wp-content/uploads/2016/03/shezan-website-products-bottles-lychee-1.jpg',
  },
  {
    id: 'cd-17', name: 'Shezan Grape Juice', price: 55, unit: '250ml',
    category: 'Cold Drinks', stock: 280, inStock: true, sku: 'SHZ-GRP',
    description: 'Rich grape flavor — natural taste, no artificial.',
    imageUrl: 'https://shezan.com/wp-content/uploads/2016/03/shezan-website-products-bottles-grapes-1.jpg',
  },
  {
    id: 'cd-18', name: 'Shezan Fruit Punch', price: 60, unit: '250ml',
    category: 'Cold Drinks', stock: 250, inStock: true, sku: 'SHZ-PCH',
    description: 'Mixed fruit punch — Shezan ka behtareen blend.',
    imageUrl: 'https://shezan.com/wp-content/uploads/2020/02/shezan-website-products-bottles-punch.jpg',
  },
  {
    id: 'cd-19', name: 'Shezan Baba Juice', price: 160, unit: '1 Liter',
    category: 'Cold Drinks', stock: 150, inStock: true, sku: 'SHZ-BABA-1L',
    description: 'Pura 1 liter juice pack — Shezan Baba family size.',
    imageUrl: 'https://shezan.com/wp-content/uploads/2020/01/juice-Size-in-pixel-570x760-8.jpg',
  },
  {
    id: 'cd-20', name: 'Shezan Baba Juice', price: 55, unit: '250ml',
    category: 'Cold Drinks', stock: 350, inStock: true, sku: 'SHZ-BABA',
    description: 'Shezan Baba Juice 250ml — fresh fruit juice, perfect for school tiffin and on-the-go.',
    imageUrl: 'https://shezan.com/wp-content/uploads/2020/01/juice-Size-in-pixel-570x760-8.jpg',
  },

  // ══ PICKLES ══════════════════════════════════════════
  {
    id: 'pk-1', name: 'Mango Pickle (Aam ka Achar)', price: 280, unit: '400g',
    category: 'Pickles', stock: 120, inStock: true, sku: 'PCK-MNG',
    description: 'Traditional spicy mango achar — ghar jaisi taste. Shezan quality.',
    imageUrl: 'https://shezan.com/wp-content/uploads/2015/08/shezan-international-website-products-pickles.jpg',
  },
  {
    id: 'pk-2', name: 'Mixed Pickle (Mix Achar)', price: 280, unit: '400g',
    category: 'Pickles', stock: 100, inStock: true, sku: 'PCK-MIX',
    description: 'Mix sabziyon ka achar — every bite is different.',
    imageUrl: 'https://shezan.com/wp-content/uploads/2015/08/shezan-international-website-products-pickles.jpg',
  },
  {
    id: 'pk-3', name: 'Lemon Pickle (Nimbu Achar)', price: 240, unit: '400g',
    category: 'Pickles', stock: 90, inStock: true, sku: 'PCK-LMN',
    description: 'Tangy nimbu achar — dal chawal ka perfect saath.',
    imageUrl: null,
  },
  {
    id: 'pk-4', name: 'Green Chilli Pickle (Hari Mirch)', price: 220, unit: '300g',
    category: 'Pickles', stock: 80, inStock: true, sku: 'PCK-GCH',
    description: 'Spicy hari mirch achar — sirf brave logon ke liye!',
    imageUrl: null,
  },
  {
    id: 'pk-5', name: 'Garlic Pickle (Lehsan Achar)', price: 250, unit: '300g',
    category: 'Pickles', stock: 70, inStock: true, sku: 'PCK-GRL',
    description: 'Aromatic garlic pickle — khane ka mazaa do guna.',
    imageUrl: null,
  },
  {
    id: 'pk-6', name: 'Carrot Pickle (Gajar Achar)', price: 200, unit: '400g',
    category: 'Pickles', stock: 85, inStock: true, sku: 'PCK-CRT',
    description: 'Crispy gajar achar — sweet, sour and spicy.',
    imageUrl: null,
  },
  {
    id: 'pk-7', name: 'Cauliflower Pickle (Gobi Achar)', price: 210, unit: '400g',
    category: 'Pickles', stock: 60, inStock: true, sku: 'PCK-GOB',
    description: 'Crunchy gobi achar — winter special flavor.',
    imageUrl: null,
  },
  {
    id: 'pk-8', name: 'Turnip Pickle (Shalgam Achar)', price: 190, unit: '400g',
    category: 'Pickles', stock: 50, inStock: false, sku: 'PCK-SHG',
    description: 'Traditional shalgam achar — winter delicacy.',
    imageUrl: null,
  },

  // ══ PASTA ═════════════════════════════════════════════
  {
    id: 'pt-1', name: 'Penne Pasta', price: 180, unit: '500g',
    category: 'Pasta', stock: 150, inStock: true, sku: 'PST-PEN',
    description: 'Tubular penne pasta — perfect for thick sauces.',
    imageUrl: null,
  },
  {
    id: 'pt-2', name: 'Macaroni', price: 150, unit: '500g',
    category: 'Pasta', stock: 200, inStock: true, sku: 'PST-MAC',
    description: 'Classic macaroni — great for mac & cheese, soups.',
    imageUrl: null,
  },
  {
    id: 'pt-3', name: 'Spaghetti', price: 160, unit: '500g',
    category: 'Pasta', stock: 180, inStock: true, sku: 'PST-SPG',
    description: 'Long thin spaghetti — the classic Italian favorite.',
    imageUrl: null,
  },
  {
    id: 'pt-4', name: 'Fusilli (Spiral Pasta)', price: 180, unit: '500g',
    category: 'Pasta', stock: 120, inStock: true, sku: 'PST-FUS',
    description: 'Spiral-shaped fusilli — holds sauce beautifully.',
    imageUrl: null,
  },
  {
    id: 'pt-5', name: 'Elbow Pasta', price: 150, unit: '500g',
    category: 'Pasta', stock: 160, inStock: true, sku: 'PST-ELB',
    description: 'Small curved elbow pasta — kids favorite.',
    imageUrl: null,
  },
  {
    id: 'pt-6', name: 'Shell Pasta (Conchiglie)', price: 170, unit: '500g',
    category: 'Pasta', stock: 100, inStock: true, sku: 'PST-SHL',
    description: 'Shell-shaped pasta — traps sauce in every bite.',
    imageUrl: null,
  },
  {
    id: 'pt-7', name: 'Fettuccine', price: 190, unit: '500g',
    category: 'Pasta', stock: 90, inStock: true, sku: 'PST-FET',
    description: 'Flat ribbon pasta — best with creamy sauces.',
    imageUrl: null,
  },
  {
    id: 'pt-8', name: 'Farfalle (Bow-Tie)', price: 185, unit: '500g',
    category: 'Pasta', stock: 80, inStock: true, sku: 'PST-FAR',
    description: 'Pretty bow-tie pasta — fun shape, great taste.',
    imageUrl: null,
  },

  // ══ SNACKS ═══════════════════════════════════════════
  {
    id: 'sn-1', name: 'Lays Classic Salted', price: 30, unit: '34g',
    category: 'Snacks', stock: 500, inStock: true, sku: 'LYS-CLS',
    description: 'Pakistan ka favorite potato chip — classic salted flavor.',
    imageUrl: null,
  },
  {
    id: 'sn-2', name: 'Lays Magic Masala', price: 30, unit: '34g',
    category: 'Snacks', stock: 450, inStock: true, sku: 'LYS-MSL',
    description: 'Masaledar aur chatpata — Lays Magic Masala, sab ka favorite.',
    imageUrl: null,
  },
  {
    id: 'sn-3', name: 'Kurkure Masala Munch', price: 25, unit: '30g',
    category: 'Snacks', stock: 600, inStock: true, sku: 'KRK-MSL',
    description: 'Crunchy corn puffs with bold masala flavor — munching ka maza.',
    imageUrl: null,
  },
  {
    id: 'sn-4', name: 'Sooper Biscuit', price: 45, unit: '105g',
    category: 'Snacks', stock: 400, inStock: true, sku: 'SPR-BSC',
    description: 'Cream-filled sandwich biscuit — chai ke saath perfect.',
    imageUrl: null,
  },
  {
    id: 'sn-5', name: 'Rio Biscuit', price: 50, unit: '120g',
    category: 'Snacks', stock: 350, inStock: true, sku: 'RIO-BSC',
    description: 'Chocolate-filled wafer biscuit — Rio, everyone\'s favorite snack.',
    imageUrl: null,
  },
  {
    id: 'sn-6', name: 'Peek Freans Marie Biscuit', price: 55, unit: '130g',
    category: 'Snacks', stock: 300, inStock: true, sku: 'PFK-MAR',
    description: 'Light, crispy marie biscuits — ideal with chai or milk.',
    imageUrl: null,
  },
  {
    id: 'sn-7', name: 'Mr. Potato Chips', price: 35, unit: '45g',
    category: 'Snacks', stock: 380, inStock: true, sku: 'MRP-CHP',
    description: 'Thin aur crispy potato chips — extra crunch guaranteed.',
    imageUrl: null,
  },
  {
    id: 'sn-8', name: 'Peanuts (Moongphali)', price: 80, unit: '200g',
    category: 'Snacks', stock: 200, inStock: true, sku: 'PNT-200',
    description: 'Roasted salted peanuts — healthy aur tasty anytime snack.',
    imageUrl: null,
  },
  {
    id: 'sn-9', name: 'Nimko Mix', price: 120, unit: '250g',
    category: 'Snacks', stock: 150, inStock: true, sku: 'NMK-MIX',
    description: 'Traditional Pakistani nimko mix — shaadi aur mehmaan ke liye perfect.',
    imageUrl: null,
  },
  {
    id: 'sn-10', name: 'Cheetos Crunchy', price: 30, unit: '34g',
    category: 'Snacks', stock: 420, inStock: true, sku: 'CHT-CRN',
    description: 'Cheese-flavored corn snack — finger lickin\' good.',
    imageUrl: null,
  },

  // ══ GROCERY ══════════════════════════════════════════
  {
    id: 'gr-1', name: 'Shezan Tomato Ketchup', price: 185, unit: '500g',
    category: 'Grocery', stock: 150, inStock: true, sku: 'SHZ-KET',
    description: 'Tangy tomato ketchup — burgers aur fries ke saath best.',
    imageUrl: 'https://shezan.com/wp-content/uploads/2020/01/ketchup-tomato-DisplaySize-in-pixel-570x760-6.jpg',
  },
  {
    id: 'gr-2', name: 'Shezan Mixed Fruit Jam', price: 320, unit: '440g',
    category: 'Grocery', stock: 100, inStock: true, sku: 'SHZ-JAM',
    description: 'Fresh fruit jam — subah ki roti ka perfect saathi.',
    imageUrl: 'https://shezan.com/wp-content/uploads/2015/08/shezan-international-website-products-jams.jpg',
  },
  {
    id: 'gr-3', name: 'Dalda Cooking Oil', price: 1100, unit: '3 Liter',
    category: 'Grocery', stock: 80, inStock: true, sku: 'DLD-3L',
    description: 'Pakistan ka #1 cooking oil — light aur healthy.',
    imageUrl: 'https://www.daldafoods.com/themes/frontend/img/home/dalda/DCO-Bottle.png',
  },
  {
    id: 'gr-4', name: 'Basmati Rice', price: 1200, unit: '5kg',
    category: 'Grocery', stock: 60, inStock: true, sku: 'RCE-BAS',
    description: 'Premium long-grain basmati rice — biryani ke liye best.',
    imageUrl: null,
  },
  {
    id: 'gr-5', name: 'Lipton Yellow Label Tea', price: 480, unit: '200g',
    category: 'Grocery', stock: 120, inStock: true, sku: 'LPT-YLW',
    description: 'Pakistan ki pehli pasand — Lipton Yellow Label. Perfect cup of chai.',
    imageUrl: null,
  },
  {
    id: 'gr-6', name: 'Supreme Tea', price: 520, unit: '190g',
    category: 'Grocery', stock: 100, inStock: true, sku: 'SPR-TEA',
    description: 'Karachi ka mashoor Supreme Tea — strong aur aromatic chai.',
    imageUrl: null,
  },
  {
    id: 'gr-7', name: 'Wheat Flour (Atta)', price: 1400, unit: '10kg',
    category: 'Grocery', stock: 50, inStock: true, sku: 'ATT-10K',
    description: 'Fine quality wheat flour — soft rotis ke liye best choice.',
    imageUrl: null,
  },
  {
    id: 'gr-8', name: 'Sugar (Cheeni)', price: 1500, unit: '10kg',
    category: 'Grocery', stock: 40, inStock: true, sku: 'SGR-10K',
    description: 'White refined sugar — rozana ki zaroorat, best quality.',
    imageUrl: null,
  },
  {
    id: 'gr-9', name: 'Iodized Salt (Namak)', price: 120, unit: '1kg',
    category: 'Grocery', stock: 200, inStock: true, sku: 'SLT-1KG',
    description: 'Pure iodized salt — cooking ka lazmi ingredient.',
    imageUrl: null,
  },
  {
    id: 'gr-10', name: 'National Biryani Masala', price: 95, unit: '95g',
    category: 'Grocery', stock: 180, inStock: true, sku: 'NTL-BRY',
    description: 'Authentic biryani masala — ghar mein restaurant waali biryani.',
    imageUrl: null,
  },

  // ══ HOUSEHOLD ════════════════════════════════════════
  {
    id: 'hh-1', name: 'Surf Excel Matic', price: 420, unit: '1kg',
    category: 'Household', stock: 90, inStock: true, sku: 'SRF-1KG',
    description: 'Machine wash detergent — dagh door, kapray bright.',
    imageUrl: null,
  },
  {
    id: 'hh-2', name: 'Ariel Washing Powder', price: 380, unit: '1kg',
    category: 'Household', stock: 75, inStock: true, sku: 'ARL-1KG',
    description: 'Deep clean washing powder — mushkil daag bhi saaf.',
    imageUrl: null,
  },
  {
    id: 'hh-3', name: 'Vim Dishwash Bar', price: 45, unit: '200g',
    category: 'Household', stock: 300, inStock: true, sku: 'VIM-200',
    description: 'Powerful grease-cutting dish soap bar — bartan chamkaye instantly.',
    imageUrl: null,
  },
  {
    id: 'hh-4', name: 'Safeguard Soap', price: 85, unit: '175g',
    category: 'Household', stock: 250, inStock: true, sku: 'SFG-175',
    description: 'Antibacterial protection soap — family ki sehat ka khayal.',
    imageUrl: null,
  },
  {
    id: 'hh-5', name: 'Dettol Original Soap', price: 90, unit: '175g',
    category: 'Household', stock: 200, inStock: true, sku: 'DTL-175',
    description: 'Trusted germ protection — Dettol antibacterial soap.',
    imageUrl: null,
  },
  {
    id: 'hh-6', name: 'Scotch Brite Scrubber', price: 55, unit: 'pack of 3',
    category: 'Household', stock: 180, inStock: true, sku: 'SCB-3PK',
    description: 'Heavy duty scrubbing pads — tough on grease, gentle on surfaces.',
    imageUrl: null,
  },
  {
    id: 'hh-7', name: 'Rose Petal Tissue Box', price: 130, unit: 'box of 200',
    category: 'Household', stock: 150, inStock: true, sku: 'RSP-200',
    description: 'Soft 2-ply facial tissues — everyday use ke liye.',
    imageUrl: null,
  },
  {
    id: 'hh-8', name: 'Mortein Spray', price: 280, unit: '300ml',
    category: 'Household', stock: 100, inStock: true, sku: 'MRT-300',
    description: 'Fast-acting insect killer spray — mosquito aur flies se chutkara.',
    imageUrl: null,
  },

  // ══ BRICKS ═══════════════════════════════════════════
  {
    id: 'bk-1', name: 'Red Bricks', price: 16000, unit: 'per 1000',
    category: 'Bricks', stock: 5000, inStock: true, sku: 'BRK-RED',
    description: 'High quality construction grade red bricks — standard size.',
    imageUrl: null,
  },
  {
    id: 'bk-2', name: 'Concrete Blocks', price: 8500, unit: 'per 100',
    category: 'Bricks', stock: 2000, inStock: true, sku: 'BRK-CON',
    description: 'Mazboot concrete blocks — construction ke liye best choice.',
    imageUrl: null,
  },
];

export const DEMO_USER = {
  uid: 'demo-user-1',
  email: 'customer@demo.com',
  displayName: 'Ali Hassan',
};

export const DEMO_ADMIN = {
  uid: 'demo-admin-1',
  email: 'admin@dawoodtrader.com',
  displayName: 'Dawood Bhai',
};
