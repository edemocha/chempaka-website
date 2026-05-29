const { Pool } = require('pg');
require('dotenv').config();
const path = require('path');
const fs = require('fs');

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  database: process.env.DB_NAME || 'chempaka_db',
  port: parseInt(process.env.DB_PORT) || 5432,
  connectionTimeoutMillis: 2000, // Fail-fast in 2 seconds to trigger JSON fallback instantly
});

class Database {
  constructor() {
    this.usePostgres = false;
    this.jsonDb = null;
    this.initPromise = this.init();
  }

  // Attempt connection. Fallback to file-based JSON storage if Postgres is down
  async init() {
    try {
      console.log("Attempting to connect to PostgreSQL at", process.env.DB_HOST || 'localhost');
      const client = await pool.connect();
      client.release();
      this.usePostgres = true;
      console.log("PostgreSQL connected successfully. Using PostgreSQL database.");

      // Setup PostgreSQL schemas
      await pool.query(`
        CREATE TABLE IF NOT EXISTS gold_rates (
          id SERIAL PRIMARY KEY,
          gold_916 DECIMAL(10, 2) NOT NULL,
          gold_999 DECIMAL(10, 2) NOT NULL,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
      `);
      
      await pool.query(`
        CREATE TABLE IF NOT EXISTS users (
          id VARCHAR(255) PRIMARY KEY,
          email VARCHAR(255) NOT NULL UNIQUE,
          password_hash VARCHAR(255) NOT NULL,
          name VARCHAR(255) NOT NULL,
          role VARCHAR(50) NOT NULL DEFAULT 'user',
          phone VARCHAR(50) NULL,
          birthday VARCHAR(50) NULL,
          address TEXT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
      `);

      await pool.query(`
        CREATE TABLE IF NOT EXISTS products (
          id VARCHAR(255) PRIMARY KEY,
          title VARCHAR(255) NOT NULL,
          category VARCHAR(100) NOT NULL,
          image VARCHAR(255) NOT NULL,
          purity VARCHAR(100) NOT NULL,
          weight DECIMAL(10, 2) NOT NULL,
          craftsmanship DECIMAL(10, 2) NOT NULL,
          description TEXT NULL,
          length VARCHAR(100) NOT NULL DEFAULT 'Tiada',
          sizes JSONB NULL,
          status VARCHAR(50) NOT NULL DEFAULT 'active',
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
      `);

      await pool.query(`
        CREATE TABLE IF NOT EXISTS banners (
          id VARCHAR(255) PRIMARY KEY,
          type VARCHAR(50) NOT NULL,
          title VARCHAR(255) NOT NULL,
          subtitle VARCHAR(255) NULL,
          image VARCHAR(255) NOT NULL,
          description TEXT NULL,
          link VARCHAR(255) NULL,
          cta_text VARCHAR(100) NULL,
          status VARCHAR(50) NOT NULL DEFAULT 'active',
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
      `);

      await pool.query(`
        CREATE TABLE IF NOT EXISTS vouchers (
          code VARCHAR(100) PRIMARY KEY,
          discount_type VARCHAR(50) NOT NULL,
          discount_value DECIMAL(10, 2) NOT NULL,
          min_purchase DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
          created_at VARCHAR(100) NOT NULL
        );
      `);

      await pool.query(`
        CREATE TABLE IF NOT EXISTS orders (
          id VARCHAR(255) PRIMARY KEY,
          subtotal DECIMAL(10, 2) NOT NULL,
          discount_amount DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
          voucher_code VARCHAR(100) NULL,
          voucher_discount DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
          total DECIMAL(10, 2) NOT NULL,
          customer_name VARCHAR(255) NOT NULL,
          customer_email VARCHAR(255) NOT NULL,
          status VARCHAR(50) NOT NULL DEFAULT 'pending',
          created_at VARCHAR(100) NOT NULL,
          gateway VARCHAR(100) NOT NULL DEFAULT 'Billplz-Mock',
          transaction_id VARCHAR(100) NULL,
          completed_at VARCHAR(100) NULL
        );
      `);

      await pool.query(`
        CREATE TABLE IF NOT EXISTS order_items (
          id SERIAL PRIMARY KEY,
          order_id VARCHAR(255) NOT NULL,
          product_id VARCHAR(255) NOT NULL,
          title VARCHAR(255) NOT NULL,
          purity VARCHAR(100) NOT NULL,
          weight DECIMAL(10, 2) NOT NULL,
          price DECIMAL(10, 2) NOT NULL,
          quantity INT NOT NULL DEFAULT 1,
          size VARCHAR(100) NULL,
          length VARCHAR(100) NULL,
          FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
        );
      `);

      console.log("PostgreSQL Tables verified/created successfully.");
      
      // Auto seed initial default accounts if empty
      const usersCountRes = await pool.query('SELECT COUNT(*) FROM users');
      if (parseInt(usersCountRes.rows[0].count) === 0) {
        console.log("No users found. Running initial seeding...");
        await this.addUser({
          id: "admin-1",
          email: "admin@chempakajewels.my",
          passwordHash: "240be518fabd2724ddb6f04eeb1da5967448d7e831c08c8fa822809f74c720a9",
          name: "Chempaka Admin",
          role: "admin"
        });
        await this.addUser({
          id: "user-1",
          email: "danish@chempaka.my",
          passwordHash: "f2d81a070f80993077759fe48a97b2be2a94a284fb89a42531cd8d8dc28d5420",
          name: "Danish Iman",
          role: "member"
        });
      }
      
      const ratesCountRes = await pool.query('SELECT COUNT(*) FROM gold_rates');
      if (parseInt(ratesCountRes.rows[0].count) === 0) {
        await this.updateGoldRates(368.50, 385.20);
      }
    } catch (e) {
      console.warn("\n==================================================================");
      console.warn("WARNING: PostgreSQL connection failed!");
      console.warn("Reason:", e.message);
      console.warn("FALLING BACK TO LOCAL JSON DATABASE (db.json) FOR TESTING!");
      console.warn("==================================================================\n");
      this.usePostgres = false;
      this.jsonDb = require('./database_old_json');
    }
  }

  // Auth Operations
  async findUserByEmail(email) {
    await this.initPromise;
    if (!this.usePostgres) {
      return this.jsonDb.findUserByEmail(email);
    }
    if (!email) return null;
    const res = await pool.query('SELECT * FROM users WHERE LOWER(email) = LOWER($1)', [email.trim()]);
    const u = res.rows[0];
    if (!u) return null;
    return {
      id: u.id,
      email: u.email,
      passwordHash: u.password_hash,
      name: u.name,
      role: u.role,
      phone: u.phone,
      birthday: u.birthday,
      address: u.address
    };
  }

  async addUser(user) {
    await this.initPromise;
    if (!this.usePostgres) {
      return this.jsonDb.addUser(user);
    }
    await pool.query(
      `INSERT INTO users (id, email, password_hash, name, role, phone, birthday, address)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [
        user.id,
        user.email.toLowerCase().trim(),
        user.passwordHash,
        user.name,
        user.role || 'user',
        user.phone || null,
        user.birthday || null,
        user.address || null
      ]
    );
    return user;
  }

  async getUsers() {
    await this.initPromise;
    if (!this.usePostgres) {
      return this.jsonDb.getUsers();
    }
    const res = await pool.query('SELECT * FROM users ORDER BY created_at DESC');
    return res.rows.map(u => ({
      id: u.id,
      email: u.email,
      passwordHash: u.password_hash,
      name: u.name,
      role: u.role,
      phone: u.phone,
      birthday: u.birthday,
      address: u.address
    }));
  }

  async updateUserRole(id, role) {
    await this.initPromise;
    if (!this.usePostgres) {
      return this.jsonDb.updateUserRole(id, role);
    }
    await pool.query('UPDATE users SET role = $1 WHERE id = $2', [role, id]);
    const userEmail = await this.getUserEmailById(id);
    return this.findUserByEmail(userEmail);
  }

  async getUserEmailById(id) {
    const res = await pool.query('SELECT email FROM users WHERE id = $1', [id]);
    return res.rows[0]?.email || '';
  }

  // Product Operations
  async getProducts() {
    await this.initPromise;
    if (!this.usePostgres) {
      return this.jsonDb.getProducts();
    }
    const res = await pool.query('SELECT * FROM products ORDER BY id ASC');
    return res.rows.map(p => ({
      id: p.id,
      title: p.title,
      category: p.category,
      image: p.image,
      purity: p.purity,
      weight: parseFloat(p.weight),
      craftsmanship: parseFloat(p.craftsmanship),
      description: p.description,
      length: p.length,
      sizes: Array.isArray(p.sizes) ? p.sizes : [],
      status: p.status
    }));
  }

  async findProductById(id) {
    await this.initPromise;
    if (!this.usePostgres) {
      return this.jsonDb.findProductById(id);
    }
    const res = await pool.query('SELECT * FROM products WHERE id = $1', [id]);
    const p = res.rows[0];
    if (!p) return null;
    return {
      id: p.id,
      title: p.title,
      category: p.category,
      image: p.image,
      purity: p.purity,
      weight: parseFloat(p.weight),
      craftsmanship: parseFloat(p.craftsmanship),
      description: p.description,
      length: p.length,
      sizes: Array.isArray(p.sizes) ? p.sizes : [],
      status: p.status
    };
  }

  async addProduct(product) {
    await this.initPromise;
    if (!this.usePostgres) {
      return this.jsonDb.addProduct(product);
    }
    await pool.query(
      `INSERT INTO products (id, title, category, image, purity, weight, craftsmanship, description, length, sizes, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
      [
        product.id,
        product.title,
        product.category,
        product.image,
        product.purity,
        parseFloat(product.weight),
        parseFloat(product.craftsmanship),
        product.description || '',
        product.length || 'Tiada',
        JSON.stringify(product.sizes || []),
        product.status || 'active'
      ]
    );
    return product;
  }

  async updateProduct(id, product) {
    await this.initPromise;
    if (!this.usePostgres) {
      const p = this.jsonDb.findProductById(id);
      if (p) {
        Object.assign(p, product);
        this.jsonDb.save();
      }
      return p;
    }
    await pool.query(
      `UPDATE products
       SET title = $1, category = $2, image = $3, purity = $4, weight = $5, craftsmanship = $6, description = $7, length = $8, sizes = $9
       WHERE id = $10`,
      [
        product.title,
        product.category,
        product.image,
        product.purity,
        parseFloat(product.weight),
        parseFloat(product.craftsmanship),
        product.description || '',
        product.length || 'Tiada',
        JSON.stringify(product.sizes || []),
        id
      ]
    );
    return this.findProductById(id);
  }

  async updateProductStatus(id, status) {
    await this.initPromise;
    if (!this.usePostgres) {
      return this.jsonDb.updateProductStatus(id, status);
    }
    await pool.query('UPDATE products SET status = $1 WHERE id = $2', [status, id]);
    return this.findProductById(id);
  }

  // Order Operations
  async getOrders() {
    await this.initPromise;
    if (!this.usePostgres) {
      return this.jsonDb.getOrders();
    }
    const res = await pool.query('SELECT * FROM orders ORDER BY created_at DESC');
    const orders = [];
    for (let o of res.rows) {
      const itemsRes = await pool.query('SELECT * FROM order_items WHERE order_id = $1', [o.id]);
      const items = itemsRes.rows.map(item => ({
        id: item.product_id,
        title: item.title,
        purity: item.purity,
        weight: parseFloat(item.weight),
        price: parseFloat(item.price),
        quantity: parseInt(item.quantity),
        size: item.size || null,
        length: item.length || null
      }));
      orders.push({
        id: o.id,
        items,
        subtotal: parseFloat(o.subtotal),
        discountAmount: parseFloat(o.discount_amount),
        voucherCode: o.voucher_code,
        voucherDiscount: parseFloat(o.voucher_discount),
        total: parseFloat(o.total),
        customerName: o.customer_name,
        customerEmail: o.customer_email,
        status: o.status,
        createdAt: o.created_at,
        payment: {
          gateway: o.gateway,
          transactionId: o.transaction_id,
          completedAt: o.completed_at
        }
      });
    }
    return orders;
  }

  async findOrderById(id) {
    await this.initPromise;
    if (!this.usePostgres) {
      return this.jsonDb.findOrderById(id);
    }
    const res = await pool.query('SELECT * FROM orders WHERE id = $1', [id]);
    const o = res.rows[0];
    if (!o) return null;
    const itemsRes = await pool.query('SELECT * FROM order_items WHERE order_id = $1', [o.id]);
    const items = itemsRes.rows.map(item => ({
      id: item.product_id,
      title: item.title,
      purity: item.purity,
      weight: parseFloat(item.weight),
      price: parseFloat(item.price),
      quantity: parseInt(item.quantity),
      size: item.size || null,
      length: item.length || null
    }));
    return {
      id: o.id,
      items,
      subtotal: parseFloat(o.subtotal),
      discountAmount: parseFloat(o.discount_amount),
      voucherCode: o.voucher_code,
      voucherDiscount: parseFloat(o.voucher_discount),
      total: parseFloat(o.total),
      customerName: o.customer_name,
      customerEmail: o.customer_email,
      status: o.status,
      createdAt: o.created_at,
      payment: {
        gateway: o.gateway,
        transactionId: o.transaction_id,
        completedAt: o.completed_at
      }
    };
  }

  async addOrder(order) {
    await this.initPromise;
    if (!this.usePostgres) {
      return this.jsonDb.addOrder(order);
    }
    await pool.query(
      `INSERT INTO orders (id, subtotal, discount_amount, voucher_code, voucher_discount, total, customer_name, customer_email, status, created_at, gateway, transaction_id, completed_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)`,
      [
        order.id,
        parseFloat(order.subtotal),
        parseFloat(order.discountAmount || 0),
        order.voucherCode || null,
        parseFloat(order.voucherDiscount || 0),
        parseFloat(order.total),
        order.customerName,
        order.customerEmail,
        order.status || 'pending',
        order.createdAt,
        order.payment?.gateway || 'Billplz-Mock',
        order.payment?.transactionId || null,
        order.payment?.completedAt || null
      ]
    );

    if (Array.isArray(order.items)) {
      for (let item of order.items) {
        await pool.query(
          `INSERT INTO order_items (order_id, product_id, title, purity, weight, price, quantity, size, length)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
          [
            order.id,
            item.id,
            item.title,
            item.purity,
            parseFloat(item.weight),
            parseFloat(item.price),
            parseInt(item.quantity),
            item.size || null,
            item.length || null
          ]
        );
      }
    }
    return order;
  }

  async updateOrderStatus(id, status, paymentDetails = {}) {
    await this.initPromise;
    if (!this.usePostgres) {
      return this.jsonDb.updateOrderStatus(id, status, paymentDetails);
    }
    await pool.query(
      `UPDATE orders
       SET status = $1, transaction_id = COALESCE($2, transaction_id), completed_at = COALESCE($3, completed_at)
       WHERE id = $4`,
      [status, paymentDetails.transactionId || null, paymentDetails.completedAt || null, id]
    );
    return this.findOrderById(id);
  }

  // Gold Rates Operations
  async getGoldRates() {
    await this.initPromise;
    if (!this.usePostgres) {
      return this.jsonDb.getGoldRates();
    }
    const res = await pool.query('SELECT * FROM gold_rates ORDER BY id DESC LIMIT 1');
    const r = res.rows[0];
    if (!r) return { gold916: 368.50, gold999: 385.20 };
    return {
      gold916: parseFloat(r.gold_916),
      gold999: parseFloat(r.gold_999)
    };
  }

  async updateGoldRates(gold916, gold999) {
    await this.initPromise;
    if (!this.usePostgres) {
      return this.jsonDb.updateGoldRates(gold916, gold999);
    }
    await pool.query(
      'INSERT INTO gold_rates (gold_916, gold_999) VALUES ($1, $2)',
      [parseFloat(gold916), parseFloat(gold999)]
    );
    return {
      gold916: parseFloat(gold916),
      gold999: parseFloat(gold999)
    };
  }

  // Banner Operations
  async getBanners() {
    await this.initPromise;
    if (!this.usePostgres) {
      return this.jsonDb.getBanners();
    }
    const res = await pool.query('SELECT * FROM banners ORDER BY id ASC');
    return res.rows.map(b => ({
      id: b.id,
      type: b.type,
      title: b.title,
      subtitle: b.subtitle,
      image: b.image,
      description: b.description,
      link: b.link,
      ctaText: b.cta_text,
      status: b.status
    }));
  }

  async findBannerById(id) {
    await this.initPromise;
    if (!this.usePostgres) {
      return this.jsonDb.findBannerById(id);
    }
    const res = await pool.query('SELECT * FROM banners WHERE id = $1', [id]);
    const b = res.rows[0];
    if (!b) return null;
    return {
      id: b.id,
      type: b.type,
      title: b.title,
      subtitle: b.subtitle,
      image: b.image,
      description: b.description,
      link: b.link,
      ctaText: b.cta_text,
      status: b.status
    };
  }

  async addBanner(banner) {
    await this.initPromise;
    if (!this.usePostgres) {
      return this.jsonDb.addBanner(banner);
    }
    await pool.query(
      `INSERT INTO banners (id, type, title, subtitle, image, description, link, cta_text, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
      [
        banner.id,
        banner.type,
        banner.title,
        banner.subtitle || '',
        banner.image,
        banner.description || '',
        banner.link || '#',
        banner.ctaText || 'Meneroka',
        banner.status || 'active'
      ]
    );
    return banner;
  }

  async updateBanner(id, banner) {
    await this.initPromise;
    if (!this.usePostgres) {
      const b = this.jsonDb.findBannerById(id);
      if (b) {
        Object.assign(b, banner);
        this.jsonDb.save();
      }
      return b;
    }
    await pool.query(
      `UPDATE banners
       SET type = $1, title = $2, subtitle = $3, image = $4, description = $5, link = $6, cta_text = $7
       WHERE id = $8`,
      [
        banner.type,
        banner.title,
        banner.subtitle || '',
        banner.image,
        banner.description || '',
        banner.link || '#',
        banner.ctaText || 'Meneroka',
        id
      ]
    );
    return this.findBannerById(id);
  }

  async updateBannerStatus(id, status) {
    await this.initPromise;
    if (!this.usePostgres) {
      const b = this.jsonDb.findBannerById(id);
      if (b) {
        b.status = status;
        this.jsonDb.save();
      }
      return b;
    }
    await pool.query('UPDATE banners SET status = $1 WHERE id = $2', [status, id]);
    return this.findBannerById(id);
  }

  async deleteBanner(id) {
    await this.initPromise;
    if (!this.usePostgres) {
      return this.jsonDb.deleteBanner(id);
    }
    const res = await pool.query('DELETE FROM banners WHERE id = $1', [id]);
    return res.rowCount > 0;
  }

  // Voucher Operations
  async getVouchers() {
    await this.initPromise;
    if (!this.usePostgres) {
      return this.jsonDb.getVouchers();
    }
    const res = await pool.query('SELECT * FROM vouchers ORDER BY code ASC');
    return res.rows.map(v => ({
      code: v.code,
      discountType: v.discount_type,
      discountValue: parseFloat(v.discount_value),
      minPurchase: parseFloat(v.min_purchase),
      createdAt: v.created_at
    }));
  }

  async findVoucherByCode(code) {
    await this.initPromise;
    if (!this.usePostgres) {
      return this.jsonDb.findVoucherByCode(code);
    }
    if (!code) return null;
    const res = await pool.query('SELECT * FROM vouchers WHERE LOWER(code) = LOWER($1)', [code.trim()]);
    const v = res.rows[0];
    if (!v) return null;
    return {
      code: v.code,
      discountType: v.discount_type,
      discountValue: parseFloat(v.discount_value),
      minPurchase: parseFloat(v.min_purchase),
      createdAt: v.created_at
    };
  }

  async addVoucher(voucher) {
    await this.initPromise;
    if (!this.usePostgres) {
      return this.jsonDb.addVoucher(voucher);
    }
    const existing = await this.findVoucherByCode(voucher.code);
    if (existing) return null;
    await pool.query(
      `INSERT INTO vouchers (code, discount_type, discount_value, min_purchase, created_at)
       VALUES ($1, $2, $3, $4, $5)`,
      [
        voucher.code.toUpperCase().trim(),
        voucher.discountType,
        parseFloat(voucher.discountValue),
        parseFloat(voucher.minPurchase || 0),
        voucher.createdAt || new Date().toISOString()
      ]
    );
    return voucher;
  }

  async deleteVoucher(code) {
    await this.initPromise;
    if (!this.usePostgres) {
      return this.jsonDb.deleteVoucher(code);
    }
    if (!code) return false;
    const res = await pool.query('DELETE FROM vouchers WHERE LOWER(code) = LOWER($1)', [code.trim()]);
    return res.rowCount > 0;
  }

  async save() {
    await this.initPromise;
    if (!this.usePostgres) {
      return this.jsonDb.save();
    }
    return true;
  }
}

module.exports = new Database();
