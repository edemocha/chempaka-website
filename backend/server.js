const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const db = require('./database');
const { generateInvoicePdf } = require('./utils/pdfGenerator');
const { sendInvoiceEmail } = require('./utils/emailSender');

const app = express();
const PORT = process.env.PORT || 3000;

// Enable CORS and JSON parsing
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// Helper to hash passwords using SHA256
function hashPassword(password) {
  return crypto.createHash('sha256').update(password).digest('hex');
}

// In-memory sessions store mapping token to user profile
const sessions = {};

// Middleware to parse and verify Authorization Token
function authenticateUser(req, res, next) {
  const token = req.headers['authorization'];
  if (token && sessions[token]) {
    req.user = sessions[token];
  } else {
    req.user = null;
  }
  next();
}

// Serve static frontend files
const frontendDir = path.join(__dirname, '..', 'frontend');
app.use(express.static(frontendDir));

// Serve generated PDF invoices
app.use('/invoices', express.static(path.join(__dirname, 'invoices')));

// --- REST API ENDPOINTS ---

// 1. Auth: Registration Portal
app.post('/api/auth/register', async (req, res) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password) {
    return res.status(400).json({ error: "Sila isi semua maklumat pendaftaran." });
  }

  // Check if member already exists
  const existingUser = await db.findUserByEmail(email);
  if (existingUser) {
    return res.status(400).json({ error: "Emel ini telah berdaftar di Kelab Elit Chempaka." });
  }

  // Register new user (VIP pending approval)
  const newUser = {
    id: 'user-' + Date.now(),
    email: email.toLowerCase(),
    passwordHash: hashPassword(password),
    name: name,
    role: 'user',
    phone: req.body.phone || null,
    birthday: req.body.birthday || null,
    address: req.body.address || null
  };

  await db.addUser(newUser);

  // Auto-login after registration by issuing token
  const token = crypto.randomBytes(24).toString('hex');
  sessions[token] = newUser;

  res.status(201).json({
    message: "Pendaftaran berjaya! Keahlian VIP anda kini sedang diproses untuk kelulusan pentadbir.",
    token: token,
    user: {
      name: newUser.name,
      email: newUser.email,
      role: newUser.role
    }
  });
});

// 2. Auth: Login Portal
app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: "Sila isi emel dan kata laluan anda." });
  }

  const user = await db.findUserByEmail(email);
  if (!user || user.passwordHash !== hashPassword(password)) {
    return res.status(401).json({ error: "Emel atau kata laluan tidak sah." });
  }

  // Issue session token
  const token = crypto.randomBytes(24).toString('hex');
  sessions[token] = user;

  res.json({
    message: "Log masuk berjaya.",
    token: token,
    user: {
      name: user.name,
      email: user.email,
      role: user.role
    }
  });
});

// Google Sign-in Mock Endpoint
app.post('/api/auth/google-login', async (req, res) => {
  const { name, email, googleId } = req.body;
  if (!email || !name) {
    return res.status(400).json({ error: "Maklumat akaun Google tidak lengkap." });
  }

  let isNew = false;
  // Check if member exists
  let user = await db.findUserByEmail(email);
  if (!user) {
    isNew = true;
    // Automatically register them as regular user, VIP pending approval
    user = {
      id: 'google-' + (googleId || Date.now()),
      email: email.toLowerCase(),
      passwordHash: 'GOOGLE_AUTH_MOCK', // Place-holder since they authenticate via Google
      name: name,
      role: 'user'
    };
    await db.addUser(user);
  }

  // Issue session token
  const token = crypto.randomBytes(24).toString('hex');
  sessions[token] = user;

  res.json({
    message: isNew 
      ? "Log masuk dengan Google berjaya! Pendaftaran akaun selesai, keahlian VIP anda sedang diproses untuk kelulusan pentadbir." 
      : "Log masuk dengan Google Berjaya!",
    token: token,
    user: {
      name: user.name,
      email: user.email,
      role: user.role
    }
  });
});

// 3. Auth: Current Profile
app.get('/api/auth/me', authenticateUser, (req, res) => {
  if (!req.user) {
    return res.status(401).json({ error: "Sesi tamat. Sila log masuk semula." });
  }
  res.json({ user: req.user });
});

// 4a. Gold Rates: Retrieve current prices
app.get('/api/gold-rates', async (req, res) => {
  const rates = await db.getGoldRates();
  res.json({ rates });
});

// 4b. Gold Rates [Admin Only]: Update active rates
app.put('/api/gold-rates', authenticateUser, async (req, res) => {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ error: "Akses dinafikan. Hanya pentadbir sahaja dibenarkan." });
  }

  const { gold916, gold999 } = req.body;
  if (!gold916 || !gold999) {
    return res.status(400).json({ error: "Maklumat kadar emas tidak lengkap." });
  }

  const oldRates = await db.getGoldRates();
  const newRates = await db.updateGoldRates(gold916, gold999);

  // Generate gold price audit entry inside orders logs
  await db.addOrder({
    id: "AUDIT-" + Date.now(),
    createdAt: new Date().toISOString(),
    customerName: `KEMASKINI HARGA: Oleh ${req.user.name}`,
    customerEmail: `Lama: 916 = RM${oldRates.gold916}/g, 999 = RM${oldRates.gold999}/g | Baru: 916 = RM${newRates.gold916}/g, 999 = RM${newRates.gold999}/g`,
    total: 0,
    status: "system_audit"
  });

  res.json({
    message: "Kadar harga emas murni berjaya dikemaskini.",
    rates: newRates
  });
});

// 4a. Products: Upload Image
app.post('/api/admin/upload-image', authenticateUser, (req, res) => {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ error: "Akses dinafikan. Hanya untuk Pentadbir." });
  }

  const { base64Data, filename } = req.body;
  if (!base64Data) {
    return res.status(400).json({ error: "Tiada data imej ditemui." });
  }

  try {
    const matches = base64Data.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
    if (!matches || matches.length !== 3) {
      return res.status(400).json({ error: "Format imej tidak sah." });
    }

    const imageType = matches[1];
    const base64Buffer = Buffer.from(matches[2], 'base64');
    const ext = imageType.split('/')[1] || 'png';
    const newFilename = `upload_${Date.now()}.${ext}`;
    
    const productDir = path.join(__dirname, '..', 'frontend', 'Product');
    if (!fs.existsSync(productDir)) {
      fs.mkdirSync(productDir, { recursive: true });
    }
    
    const writePath = path.join(productDir, newFilename);
    fs.writeFileSync(writePath, base64Buffer);

    const publicUrl = `Product/${newFilename}`;
    res.json({ success: true, imageUrl: publicUrl });
  } catch (err) {
    console.error("Upload error:", err);
    res.status(500).json({ error: "Gagal menyimpan imej di pelayan." });
  }
});

// --- VOUCHER ENGINE ENDPOINTS ---

// 7a. Vouchers [Admin Only]: List all vouchers
app.get('/api/admin/vouchers', authenticateUser, async (req, res) => {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ error: "Akses dinafikan. Hanya untuk Pentadbir." });
  }
  res.json({ vouchers: await db.getVouchers() });
});

// 7b. Vouchers [Admin Only]: Create a voucher
app.post('/api/admin/vouchers', authenticateUser, async (req, res) => {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ error: "Akses dinafikan. Hanya untuk Pentadbir." });
  }

  const { code, discountType, discountValue, minPurchase } = req.body;
  if (!code || !discountType || discountValue === undefined) {
    return res.status(400).json({ error: "Sila isi maklumat kod, jenis rebat, dan nilai rebat." });
  }

  if (discountType === 'percentage' && (parseFloat(discountValue) <= 0 || parseFloat(discountValue) > 100)) {
    return res.status(400).json({ error: "Nilai peratusan diskaun mestilah antara 1% dan 100%." });
  }
  if (discountType === 'fixed' && parseFloat(discountValue) <= 0) {
    return res.status(400).json({ error: "Nilai diskaun tetap mestilah lebih besar dari RM0." });
  }

  const newVoucher = {
    code: code.toUpperCase().trim(),
    discountType,
    discountValue: parseFloat(discountValue),
    minPurchase: parseFloat(minPurchase) || 0,
    createdAt: new Date().toISOString()
  };

  const added = await db.addVoucher(newVoucher);
  if (!added) {
    return res.status(400).json({ error: "Kod baucar ini telah wujud." });
  }

  res.status(201).json({ message: "Baucar berjaya dicipta.", voucher: newVoucher });
});

// 7c. Vouchers [Admin Only]: Delete a voucher
app.delete('/api/admin/vouchers/:code', authenticateUser, async (req, res) => {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ error: "Akses dinafikan. Hanya untuk Pentadbir." });
  }

  const deleted = await db.deleteVoucher(req.params.code);
  if (!deleted) {
    return res.status(404).json({ error: "Baucar tidak ditemui." });
  }

  res.json({ message: "Baucar berjaya dipadam." });
});

// 7d. Vouchers [Public]: Validate a voucher
app.post('/api/vouchers/validate', async (req, res) => {
  const { code, cartSubtotal } = req.body;
  if (!code) {
    return res.status(400).json({ error: "Sila masukkan kod baucar." });
  }

  const voucher = await db.findVoucherByCode(code);
  if (!voucher) {
    return res.status(400).json({ error: "Kod baucar tidak sah atau telah tamat tempoh." });
  }

  const subtotal = parseFloat(cartSubtotal) || 0;
  if (voucher.minPurchase && subtotal < voucher.minPurchase) {
    return res.status(400).json({ 
      error: `Pembelian minimum sebanyak RM ${voucher.minPurchase.toFixed(2)} diperlukan untuk menggunakan baucar ini.` 
    });
  }

  let discountAmount = 0;
  if (voucher.discountType === 'percentage') {
    discountAmount = parseFloat((subtotal * (voucher.discountValue / 100)).toFixed(2));
  } else if (voucher.discountType === 'fixed') {
    discountAmount = Math.min(voucher.discountValue, subtotal);
  }

  res.json({
    valid: true,
    code: voucher.code,
    discountType: voucher.discountType,
    discountValue: voucher.discountValue,
    minPurchase: voucher.minPurchase || 0,
    discountAmount
  });
});

// 4b. Products: Dynamic Catalog with Conditional Pricing
// Guests: standard pricing
// Authenticated Members: 15% discount
app.get('/api/products', authenticateUser, async (req, res) => {
  const products = await db.getProducts();
  const isMember = req.user && req.user.role === 'member';
  const goldRates = await db.getGoldRates();

  // Apply conditional pricing
  const pricedProducts = products.map(product => {
    // Dynamically choose base rate based on purity
    const is999 = product.purity && (product.purity.includes("999") || product.purity.includes("24K"));
    const goldRate = is999 ? goldRates.gold999 : goldRates.gold916; 
    const rawGoldValue = product.weight * goldRate;
    const standardPrice = rawGoldValue + product.craftsmanship;

    let displayPrice = standardPrice;
    let memberPrice = standardPrice * 0.85; // 15% discount
    let discountApplied = false;

    if (isMember) {
      displayPrice = memberPrice;
      discountApplied = true;
    }

    return {
      ...product,
      standardPrice: standardPrice,
      memberPrice: memberPrice,
      displayPrice: displayPrice,
      discountApplied: discountApplied
    };
  });

  res.json({
    isMember: isMember,
    products: pricedProducts
  });
});

// 5. Products [Admin Only]: Add Product
app.post('/api/products', authenticateUser, async (req, res) => {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ error: "Akses dinafikan. Hanya untuk Pentadbir." });
  }

  const { title, category, image, purity, weight, craftsmanship, description, length, sizes } = req.body;
  if (!title || !category || !purity || !weight || !craftsmanship) {
    return res.status(400).json({ error: "Sila isi semua medan produk wajib." });
  }

  // Parse sizes input into a clean array of strings
  let parsedSizes = [];
  if (Array.isArray(sizes)) {
    parsedSizes = sizes.map(s => String(s).trim()).filter(Boolean);
  } else if (sizes) {
    parsedSizes = String(sizes).split(',').map(s => s.trim()).filter(Boolean);
  }

  const newProduct = {
    id: category.slice(0, 4) + '-' + Date.now(),
    title: title,
    category: category,
    image: image || 'Product/WhatsApp Image 2026-05-24 at 5.34.41 PM.jpeg',
    purity: purity,
    weight: parseFloat(weight),
    craftsmanship: parseFloat(craftsmanship),
    description: description || '',
    length: length ? String(length).trim() : 'Tiada',
    sizes: parsedSizes,
    status: 'active'
  };

  await db.addProduct(newProduct);
  res.status(201).json({ message: "Produk berjaya ditambah ke inventori.", product: newProduct });
});

// 5b. Products [Admin Only]: Edit Product
app.put('/api/products/:id', authenticateUser, async (req, res) => {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ error: "Akses dinafikan. Hanya untuk Pentadbir." });
  }

  const { title, category, image, purity, weight, craftsmanship, description, length, sizes } = req.body;
  if (!title || !category || !purity || !weight || !craftsmanship) {
    return res.status(400).json({ error: "Sila isi semua medan produk wajib." });
  }

  const product = await db.findProductById(req.params.id);
  if (!product) {
    return res.status(404).json({ error: "Produk tidak ditemui." });
  }

  // Parse sizes input into a clean array of strings
  let parsedSizes = [];
  if (Array.isArray(sizes)) {
    parsedSizes = sizes.map(s => String(s).trim()).filter(Boolean);
  } else if (sizes) {
    parsedSizes = String(sizes).split(',').map(s => s.trim()).filter(Boolean);
  }

  const updated = await db.updateProduct(req.params.id, {
    title,
    category,
    image: image || product.image,
    purity,
    weight: parseFloat(weight),
    craftsmanship: parseFloat(craftsmanship),
    description: description || '',
    length: length ? String(length).trim() : 'Tiada',
    sizes: parsedSizes
  });

  res.json({ message: "Produk berjaya dikemaskini.", product: updated });
});

// 6. Products [Admin Only]: Toggle Active/Inactive Status
app.put('/api/products/:id/status', authenticateUser, async (req, res) => {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ error: "Akses dinafikan. Hanya untuk Pentadbir." });
  }

  const { status } = req.body;
  if (!status || !['active', 'inactive'].includes(status)) {
    return res.status(400).json({ error: "Status tidak sah." });
  }

  const updatedProduct = await db.updateProductStatus(req.params.id, status);
  if (!updatedProduct) {
    return res.status(404).json({ error: "Produk tidak ditemui." });
  }

  res.json({ message: `Produk status dikemaskini kepada ${status}.`, product: updatedProduct });
});


// 7. Payments: Create FPX Online Banking Bill
app.post('/api/payment/create-bill', authenticateUser, async (req, res) => {
  const { cartItems, voucherCode } = req.body;
  if (!cartItems || cartItems.length === 0) {
    return res.status(400).json({ error: "Troli anda kosong." });
  }

  // Calculate order totals based on active member discount tier
  const isMember = req.user && req.user.role === 'member';
  const products = await db.getProducts();
  const goldRates = await db.getGoldRates();

  let subtotal = 0;
  let total = 0;
  
  const orderItems = cartItems.map(cartItem => {
    const original = products.find(p => p.id === cartItem.id);
    if (!original) return null;

    const is999 = original.purity && (original.purity.includes("999") || original.purity.includes("24K"));
    const goldRate = is999 ? goldRates.gold999 : goldRates.gold916;
    const rawGoldValue = original.weight * goldRate;
    const standardPrice = rawGoldValue + original.craftsmanship;
    const itemPrice = isMember ? (standardPrice * 0.85) : standardPrice;

    subtotal += standardPrice * cartItem.quantity;
    total += itemPrice * cartItem.quantity;

    return {
      id: original.id,
      title: original.title,
      purity: original.purity,
      weight: original.weight,
      price: itemPrice,
      quantity: cartItem.quantity,
      size: cartItem.size || null,
      length: cartItem.length || null
    };
  }).filter(Boolean);

  let discountAmount = subtotal - total;
  
  // Verify and apply voucher code
  let voucherDiscount = 0;
  let activeVoucher = null;
  if (voucherCode) {
    activeVoucher = await db.findVoucherByCode(voucherCode);
    if (activeVoucher) {
      if (!activeVoucher.minPurchase || total >= activeVoucher.minPurchase) {
        if (activeVoucher.discountType === 'percentage') {
          voucherDiscount = parseFloat((total * (activeVoucher.discountValue / 100)).toFixed(2));
        } else if (activeVoucher.discountType === 'fixed') {
          voucherDiscount = Math.min(activeVoucher.discountValue, total);
        }
        total = total - voucherDiscount;
        discountAmount += voucherDiscount;
      }
    }
  }

  const orderId = 'CPK-' + Date.now();

  const newOrder = {
    id: orderId,
    items: orderItems,
    subtotal: subtotal,
    discountAmount: discountAmount,
    voucherCode: activeVoucher ? activeVoucher.code : null,
    voucherDiscount: voucherDiscount,
    total: total,
    customerName: req.user ? req.user.name : "Guest Customer",
    customerEmail: req.user ? req.user.email : "guest@chempakajewels.my",
    status: 'pending',
    createdAt: new Date().toISOString(),
    payment: {
      gateway: "Billplz-Mock",
      transactionId: null,
      completedAt: null
    }
  };

  await db.addOrder(newOrder);

  // Return local sandbox payment URL
  const mockPaymentUrl = `/mock-bank.html?orderId=${orderId}`;
  
  res.json({
    orderId: orderId,
    paymentUrl: mockPaymentUrl
  });
});

// Retrieve All Orders [Admin Only]
app.get('/api/admin/orders', authenticateUser, async (req, res) => {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ error: "Akses dinafikan. Hanya untuk Pentadbir." });
  }
  const orders = await db.getOrders();
  res.json({ orders });
});

// Retrieve Order PDF Invoice [Admin Only]
app.get('/api/admin/orders/:id/pdf', authenticateUser, async (req, res) => {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ error: "Akses dinafikan. Hanya untuk Pentadbir." });
  }

  const order = await db.findOrderById(req.params.id);
  if (!order) {
    return res.status(404).json({ error: "Pesanan tidak ditemui." });
  }

  try {
    const pdfInvoiceName = `invoice_${order.id}.pdf`;
    const pdfPath = path.join(__dirname, 'invoices', pdfInvoiceName);

    // If PDF invoice file is missing, re-generate it dynamically
    if (!fs.existsSync(pdfPath)) {
      console.log(`Generating missing PDF invoice on-the-fly for order #${order.id}...`);
      await generateInvoicePdf(order, order.customerName, order.customerEmail);
    }

    res.download(pdfPath, pdfInvoiceName);
  } catch (err) {
    console.error("Error dynamically serving order PDF:", err);
    res.status(500).json({ error: "Gagal memproses resit PDF: " + err.message });
  }
});

// Full Database Backup JSON download [Admin Only]
app.get('/api/admin/export/backup', authenticateUser, (req, res) => {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ error: "Akses dinafikan. Hanya untuk Pentadbir." });
  }
  res.download(path.join(__dirname, 'db.json'), 'chempaka_db_backup.json');
});

// --- USERS MEMBERSHIP ENDPOINTS ---

// Users [Admin Only]: List all registered users
app.get('/api/admin/users', authenticateUser, async (req, res) => {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ error: "Akses dinafikan. Hanya untuk Pentadbir." });
  }
  // Strip passwordHash for security reasons
  const usersList = await db.getUsers();
  const safeUsers = usersList.map(u => ({
    id: u.id,
    name: u.name,
    email: u.email,
    role: u.role,
    phone: u.phone || 'Tiada',
    birthday: u.birthday || 'Tiada',
    address: u.address || 'Tiada'
  }));
  res.json({ users: safeUsers });
});

// Users [Admin Only]: Update user role (VIP approval/revocation)
app.put('/api/admin/users/:id/role', authenticateUser, async (req, res) => {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ error: "Akses dinafikan. Hanya untuk Pentadbir." });
  }

  const { role } = req.body;
  if (!role || !['member', 'user', 'admin'].includes(role)) {
    return res.status(400).json({ error: "Peranan (role) tidak sah." });
  }

  // Prevent demoting self or the absolute admin
  if (req.params.id === req.user.id || req.params.id === 'admin-1') {
    return res.status(400).json({ error: "Anda tidak boleh menukar peranan akaun pentadbir mutlak." });
  }

  const updatedUser = await db.updateUserRole(req.params.id, role);
  if (!updatedUser) {
    return res.status(404).json({ error: "Pengguna tidak ditemui." });
  }

  res.json({ message: "Status keahlian VIP berjaya dikemaskini.", user: updatedUser });
});



// 8. Payments: Retrieve Order Details
app.get('/api/orders/:id', async (req, res) => {
  const order = await db.findOrderById(req.params.id);
  if (!order) {
    return res.status(404).json({ error: "Pesanan tidak ditemui." });
  }
  res.json({ order });
});

// 9. Payments Webhook: Simulates successful FPX gateway callbacks
app.post('/api/payment/webhook', async (req, res) => {
  const { orderId, transactionId, status } = req.body;
  if (!orderId || !status) {
    return res.status(400).json({ error: "Parameter tidak lengkap." });
  }

  const order = await db.findOrderById(orderId);
  if (!order) {
    return res.status(404).json({ error: "Pesanan tidak ditemui." });
  }

  if (status === 'success') {
    // 1. Update Order status to PAID
    await db.updateOrderStatus(orderId, 'paid', {
      transactionId: transactionId || 'TXN-' + Date.now(),
      completedAt: new Date().toISOString()
    });

    try {
      console.log(`\n[PAYMENT] Order #${orderId} paid successfully! Initiating receipt generation...`);
      
      // 2. Generate PDF Invoice
      const pdfInvoice = await generateInvoicePdf(order, order.customerName, order.customerEmail);

      // 3. Dispatch simulated receipt email
      await sendInvoiceEmail(order, order.customerName, order.customerEmail, pdfInvoice);

    } catch (e) {
      console.error("Error generating/sending receipt:", e.message);
    }
  } else {
    await db.updateOrderStatus(orderId, 'failed');
  }

  res.json({ success: true, message: `Webhook processed for order status: ${status}` });
});

// --- BANNERS / CAROUSELS REST API ENDPOINTS ---

// 1. GET /api/banners [Public]: Retrieve all active slides
app.get('/api/banners', async (req, res) => {
  const banners = await db.getBanners();
  
  // By default, return only active ones, but allow admin parameter to see all in panel
  const statusFilter = req.query.admin === 'true' ? null : 'active';
  
  let filteredBanners = banners;
  if (statusFilter) {
    filteredBanners = banners.filter(b => b.status === statusFilter);
  }
  
  res.json({ banners: filteredBanners });
});

// 2. POST /api/banners [Admin Only]: Add a new slide
app.post('/api/banners', authenticateUser, async (req, res) => {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ error: "Akses dinafikan. Hanya Pentadbir sahaja dibenarkan." });
  }

  const { type, title, subtitle, image, description, link, ctaText } = req.body;
  if (!type || !title || !image) {
    return res.status(400).json({ error: "Sila isi semua maklumat wajib (Kategori, Tajuk, dan Gambar)." });
  }

  const newBanner = {
    id: 'slide-' + Date.now(),
    type: type, // 'hero' or 'banner'
    title: title,
    subtitle: subtitle || '',
    image: image,
    description: description || '',
    link: link || '#',
    ctaText: ctaText || 'Meneroka',
    status: 'active'
  };

  await db.addBanner(newBanner);
  res.status(201).json({ message: "Slaid kempen berjaya ditambah.", banner: newBanner });
});

// 3. PUT /api/banners/:id [Admin Only]: Edit slide details
app.put('/api/banners/:id', authenticateUser, async (req, res) => {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ error: "Akses dinafikan. Hanya Pentadbir sahaja dibenarkan." });
  }

  const banner = await db.findBannerById(req.params.id);
  if (!banner) {
    return res.status(404).json({ error: "Slaid tidak ditemui." });
  }

  const { type, title, subtitle, image, description, link, ctaText } = req.body;
  if (!type || !title || !image) {
    return res.status(400).json({ error: "Sila isi semua maklumat wajib (Kategori, Tajuk, dan Gambar)." });
  }

  const updated = await db.updateBanner(req.params.id, {
    type,
    title,
    subtitle,
    image,
    description,
    link,
    ctaText
  });

  res.json({ message: "Slaid kempen berjaya dikemaskini.", banner: updated });
});

// 4. PUT /api/banners/:id/status [Admin Only]: Toggle active/inactive status
app.put('/api/banners/:id/status', authenticateUser, async (req, res) => {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ error: "Akses dinafikan. Hanya Pentadbir sahaja dibenarkan." });
  }

  const banner = await db.findBannerById(req.params.id);
  if (!banner) {
    return res.status(404).json({ error: "Slaid tidak ditemui." });
  }

  const { status } = req.body;
  if (!status || !['active', 'inactive'].includes(status)) {
    return res.status(400).json({ error: "Status tidak sah." });
  }

  const updated = await db.updateBannerStatus(req.params.id, status);

  res.json({ message: `Status slaid ditukar kepada ${status}.`, banner: updated });
});

// 5. DELETE /api/banners/:id [Admin Only]: Delete a slide
app.delete('/api/banners/:id', authenticateUser, async (req, res) => {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ error: "Akses dinafikan. Hanya Pentadbir sahaja dibenarkan." });
  }

  const success = await db.deleteBanner(req.params.id);
  if (!success) {
    return res.status(404).json({ error: "Slaid tidak ditemui." });
  }

  res.json({ success: true, message: "Slaid kempen berjaya dipadam." });
});

// Fallback: Redirect all other requests to homepage index.html
app.get('*', (req, res) => {
  res.sendFile(path.join(frontendDir, 'index.html'));
});

// Start Server listening
app.listen(PORT, () => {
  console.log(`\n========================================================`);
  console.log(`CHEMPAKA JEWELS BACKEND ONLINE!`);
  console.log(`Server URL : http://localhost:${PORT}`);
  console.log(`Frontend   : Serving static files from '/frontend'`);
  console.log(`Database   : Active PostgreSQL Connection Pool`);
  console.log(`========================================================\n`);
});
