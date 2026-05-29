const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');
require('dotenv').config();

const dbPath = path.join(__dirname, 'db.json');

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  database: process.env.DB_NAME || 'chempaka_db',
  port: parseInt(process.env.DB_PORT) || 5432,
});

async function runMigration() {
  console.log("=== STARTING CHEMPAKA POSTGRES MIGRATION UTILITY ===");
  
  if (!fs.existsSync(dbPath)) {
    console.error(`Error: Source database file not found at ${dbPath}`);
    process.exit(1);
  }

  const raw = fs.readFileSync(dbPath, 'utf8');
  let data;
  try {
    data = JSON.parse(raw);
  } catch (err) {
    console.error("Error: Failed to parse db.json file", err.message);
    process.exit(1);
  }

  try {
    // Verify tables are created first
    console.log("Setting up PostgreSQL tables if missing...");
    
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

    console.log("PostgreSQL Tables verification done.");

    // 1. Migrate Users
    if (data.users && Array.isArray(data.users)) {
      console.log(`Migrating ${data.users.length} users...`);
      for (const u of data.users) {
        await pool.query(
          `INSERT INTO users (id, email, password_hash, name, role, phone, birthday, address)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
           ON CONFLICT (id) DO UPDATE SET 
             email = EXCLUDED.email, 
             password_hash = EXCLUDED.password_hash,
             name = EXCLUDED.name,
             role = EXCLUDED.role,
             phone = EXCLUDED.phone,
             birthday = EXCLUDED.birthday,
             address = EXCLUDED.address`,
          [
            u.id, 
            u.email.toLowerCase().trim(), 
            u.passwordHash, 
            u.name, 
            u.role || 'user', 
            u.phone || null, 
            u.birthday || null, 
            u.address || null
          ]
        );
      }
      console.log("Users migrated successfully.");
    }

    // 2. Migrate Products
    if (data.products && Array.isArray(data.products)) {
      console.log(`Migrating ${data.products.length} products...`);
      for (const p of data.products) {
        await pool.query(
          `INSERT INTO products (id, title, category, image, purity, weight, craftsmanship, description, length, sizes, status)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
           ON CONFLICT (id) DO UPDATE SET 
             title = EXCLUDED.title,
             category = EXCLUDED.category,
             image = EXCLUDED.image,
             purity = EXCLUDED.purity,
             weight = EXCLUDED.weight,
             craftsmanship = EXCLUDED.craftsmanship,
             description = EXCLUDED.description,
             length = EXCLUDED.length,
             sizes = EXCLUDED.sizes,
             status = EXCLUDED.status`,
          [
            p.id,
            p.title,
            p.category,
            p.image,
            p.purity,
            parseFloat(p.weight),
            parseFloat(p.craftsmanship),
            p.description || '',
            p.length || 'Tiada',
            JSON.stringify(p.sizes || []),
            p.status || 'active'
          ]
        );
      }
      console.log("Products migrated successfully.");
    }

    // 3. Migrate Banners
    if (data.banners && Array.isArray(data.banners)) {
      console.log(`Migrating ${data.banners.length} banners...`);
      for (const b of data.banners) {
        await pool.query(
          `INSERT INTO banners (id, type, title, subtitle, image, description, link, cta_text, status)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
           ON CONFLICT (id) DO UPDATE SET 
             type = EXCLUDED.type,
             title = EXCLUDED.title,
             subtitle = EXCLUDED.subtitle,
             image = EXCLUDED.image,
             description = EXCLUDED.description,
             link = EXCLUDED.link,
             cta_text = EXCLUDED.cta_text,
             status = EXCLUDED.status`,
          [
            b.id,
            b.type,
            b.title,
            b.subtitle || '',
            b.image,
            b.description || '',
            b.link || '#',
            b.ctaText || 'Meneroka',
            b.status || 'active'
          ]
        );
      }
      console.log("Banners migrated successfully.");
    }

    // 4. Migrate Vouchers
    if (data.vouchers && Array.isArray(data.vouchers)) {
      console.log(`Migrating ${data.vouchers.length} vouchers...`);
      for (const v of data.vouchers) {
        await pool.query(
          `INSERT INTO vouchers (code, discount_type, discount_value, min_purchase, created_at)
           VALUES ($1, $2, $3, $4, $5)
           ON CONFLICT (code) DO UPDATE SET 
             discount_type = EXCLUDED.discount_type,
             discount_value = EXCLUDED.discount_value,
             min_purchase = EXCLUDED.min_purchase,
             created_at = EXCLUDED.created_at`,
          [
            v.code.toUpperCase().trim(),
            v.discountType,
            parseFloat(v.discountValue),
            parseFloat(v.minPurchase || 0),
            v.createdAt || new Date().toISOString()
          ]
        );
      }
      console.log("Vouchers migrated successfully.");
    }

    // 5. Migrate Gold Rates
    if (data.goldRates) {
      console.log("Migrating Gold Rates...");
      await pool.query(
        'INSERT INTO gold_rates (gold_916, gold_999) VALUES ($1, $2)',
        [parseFloat(data.goldRates.gold916 || 368.50), parseFloat(data.goldRates.gold999 || 385.20)]
      );
      console.log("Gold rates migrated successfully.");
    }

    // 6. Migrate Orders & Nested Order Items
    if (data.orders && Array.isArray(data.orders)) {
      console.log(`Migrating ${data.orders.length} orders...`);
      for (const o of data.orders) {
        // Safe check to avoid duplicate key issues in subsequent runs
        const existsRes = await pool.query('SELECT 1 FROM orders WHERE id = $1', [o.id]);
        if (existsRes.rows.length > 0) {
          // If order exists, skip to preserve original timestamps
          continue;
        }

        await pool.query(
          `INSERT INTO orders (id, subtotal, discount_amount, voucher_code, voucher_discount, total, customer_name, customer_email, status, created_at, gateway, transaction_id, completed_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)`,
          [
            o.id,
            parseFloat(o.subtotal),
            parseFloat(o.discountAmount || 0),
            o.voucherCode || null,
            parseFloat(o.voucherDiscount || 0),
            parseFloat(o.total),
            o.customerName,
            o.customerEmail,
            o.status || 'pending',
            o.createdAt,
            o.payment?.gateway || 'Billplz-Mock',
            o.payment?.transactionId || null,
            o.payment?.completedAt || null
          ]
        );

        if (o.items && Array.isArray(o.items)) {
          for (const item of o.items) {
            await pool.query(
              `INSERT INTO order_items (order_id, product_id, title, purity, weight, price, quantity, size, length)
               VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
              [
                o.id,
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
      }
      console.log("Orders & items migrated successfully.");
    }

    console.log("=== MIGRATION COMPLETED SUCCESSFULLY ===");
    process.exit(0);
  } catch (err) {
    console.error("Migration failed due to SQL error:", err);
    process.exit(1);
  }
}

runMigration();
