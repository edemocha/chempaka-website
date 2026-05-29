const fs = require('fs');
const path = require('path');

const dbPath = path.join(__dirname, 'db.json');

// Default initial database structure
const initialDb = {
  goldRates: {
    gold916: 368.50,
    gold999: 385.20
  },
  users: [
    {
      id: "admin-1",
      email: "admin@chempakajewels.my",
      passwordHash: "240be518fabd2724ddb6f04eeb1da5967448d7e831c08c8fa822809f74c720a9", // sha256 of "admin123"
      name: "Chempaka Admin",
      role: "admin"
    },
    {
      id: "user-1",
      email: "danish@chempaka.my",
      passwordHash: "f2d81a070f80993077759fe48a97b2be2a94a284fb89a42531cd8d8dc28d5420", // sha256 of "danish123"
      name: "Danish Iman",
      role: "member"
    }
  ],
  products: [
    // RINGS (1-14)
    {
      id: "ring-1",
      title: "Cincin Permata DiRaja",
      category: "cincin",
      image: "Product/Cincin/Isolate_the_jewelry_on_a_202605281248.jpeg",
      purity: "Emas 916 (22K)",
      weight: 4.80,
      craftsmanship: 280.00,
      description: "Cincin permata diraja yang memukau, menggabungkan ketulenan emas 916 dengan perincian filigri halus buatan tangan tukang emas Chempaka.",
      status: "active"
    },
    {
      id: "ring-2",
      title: "Cincin Keemasan Abadi",
      category: "cincin",
      image: "Product/Cincin/Isolate_the_jewelry_on_a_202605281248 (1).jpeg",
      purity: "Emas 916 (22K)",
      weight: 3.50,
      craftsmanship: 220.00,
      description: "Reka bentuk minimalis-mewah yang anggun, melambangkan kasih sayang yang tiada penghujung. Sesuai untuk pemakaian harian mahupun acara khas.",
      status: "active"
    },
    {
      id: "ring-3",
      title: "Cincin Bunga Melur",
      category: "cincin",
      image: "Product/Cincin/Isolate_the_jewelry_on_a_202605281248 (2).jpeg",
      purity: "Emas 916 (22K)",
      weight: 5.20,
      craftsmanship: 320.00,
      description: "Inspirasi keindahan semula jadi bunga melur tradisional Melayu yang diukir dengan ketelitian luar biasa di atas emas 22K tulen.",
      status: "active"
    },
    {
      id: "ring-4",
      title: "Cincin Belah Rotan Klasik",
      category: "cincin",
      image: "Product/Cincin/Isolate_the_jewelry_on_a_202605281249.jpeg",
      purity: "Emas 916 (22K)",
      weight: 2.80,
      craftsmanship: 150.00,
      description: "Simbol ketulenan dan kesetiaan abadi. Reka bentuk belah rotan klasik yang licin berkilat memancarkan prestij ringkas.",
      status: "active"
    },
    {
      id: "ring-5",
      title: "Cincin Berlian Melur",
      category: "cincin",
      image: "Product/Cincin/Isolate_the_jewelry_on_a_202605281249 (1).jpeg",
      purity: "Emas 916 & Berlian",
      weight: 5.10,
      craftsmanship: 450.00,
      description: "Sentuhan eksklusif daripada siri Melur dengan tatahan berlian asli di tengahnya, menawarkan gabungan tradisi dan kemegahan.",
      status: "active"
    },
    {
      id: "ring-6",
      title: "Cincin Nilam Diraja",
      category: "cincin",
      image: "Product/Cincin/Isolate_the_jewelry_on_a_202605281249 (2).jpeg",
      purity: "Emas 916 & Nilam",
      weight: 7.50,
      craftsmanship: 580.00,
      description: "Cincin bertatah batu permata nilam (sapphire) biru tua sejati, dikelilingi oleh tatahan emas 916 berkilau memukau.",
      status: "active"
    },
    {
      id: "ring-7",
      title: "Cincin Seri Bintang",
      category: "cincin",
      image: "Product/Cincin/Isolate_the_jewelry_on_a_202605281248.jpeg",
      purity: "Emas 916 (22K)",
      weight: 6.00,
      craftsmanship: 380.00,
      description: "Rekaan cincin bersudut memantulkan cahaya bintang, menghasilkan pembiasan kecemerlangan emas yang tiada tolok bandingnya.",
      status: "active"
    },
    
    // NECKLACES (15-27)
    {
      id: "neck-1",
      title: "Rantai Leher Mahkota Emas",
      category: "rantai",
      image: "Product/Rantai/WhatsApp_Image_2026-05-24_at_5.34.44_202605281257.jpeg",
      purity: "Emas 916 (22K)",
      weight: 18.50,
      craftsmanship: 650.00,
      description: "Rantai leher padat dengan loket bermotifkan mahkota Diraja Melayu yang melambangkan keagungan sejati bangsawan lama.",
      status: "active"
    },
    {
      id: "neck-2",
      title: "Rantai Leher Pintal Kasih",
      category: "rantai",
      image: "Product/Rantai/WhatsApp_Image_2026-05-24_at_5.34.50_202605281257.jpeg",
      purity: "Emas 916 (22K)",
      weight: 12.20,
      craftsmanship: 420.00,
      description: "Ukiran tenunan pintal kembar yang menceritakan hubungan erat penuh cinta, memancarkan pesona murni di dada pemakai.",
      status: "active"
    },
    {
      id: "neck-3",
      title: "Rantai LeherSaujana Hiasan",
      category: "rantai",
      image: "Product/Rantai/WhatsApp_Image_2026-05-24_at_5.34.44_202605281257.jpeg",
      purity: "Emas 916 (22K)",
      weight: 15.00,
      craftsmanship: 500.00,
      description: "Gabungan rantaian halus dengan perincian bulat berpintal memukau, sesuai untuk dipadankan dengan busana premium Hari Raya.",
      status: "active"
    },
    {
      id: "neck-4",
      title: "Rantai Leher Saujana Nilam",
      category: "rantai",
      image: "Product/Rantai/WhatsApp_Image_2026-05-24_at_5.34.50_202605281257.jpeg",
      purity: "Emas 916 & Nilam",
      weight: 14.80,
      craftsmanship: 620.00,
      description: "Rangkaian emas bermutu tinggi dihiasi batu nilam bersinar terang di bahagian tengah, melambangkan keanggunan melangkaui zaman.",
      status: "active"
    },
    
    // BRACELETS (28-40)
    {
      id: "brace-1",
      title: "Gelang Tangan Adria",
      category: "gelang",
      image: "Product/Gelang/WhatsApp_Image_2026-05-24_at_5.34.46_202605281256.jpeg",
      purity: "Emas 916 (22K)",
      weight: 9.80,
      craftsmanship: 360.00,
      description: "Reka bentuk lingkaran moden dengan tatahan butiran halus, amat bersesuaian untuk gaya harian yang minimalis and premium.",
      status: "active"
    },
    {
      id: "brace-2",
      title: "Rantai Tangan Zinnia",
      category: "gelang",
      image: "Product/Gelang/WhatsApp_Image_2026-05-24_at_5.34.47_202605281256.jpeg",
      purity: "Emas 916 (22K)",
      weight: 11.20,
      craftsmanship: 420.00,
      description: "Tenunan emas padat berbentuk siri kelopak Zinnia yang memberikan keselesaan dan kelas tersendiri ketika dilingkarkan.",
      status: "active"
    },
    {
      id: "brace-3",
      title: "Gelang Biru Nilam",
      category: "gelang",
      image: "Product/Gelang/WhatsApp_Image_2026-05-24_at_5.34.47_202605281256 (1).jpeg",
      purity: "Emas 916 (22K)",
      weight: 14.50,
      craftsmanship: 595.00,
      description: "Rantai tangan emas tebal dengan kehalusan ukiran permata nilam biru royal, melambangkan keagungan sejati bangsawan.",
      status: "active"
    },
    {
      id: "brace-4",
      title: "Gelang Tangan Laksamana",
      category: "gelang",
      image: "Product/Gelang/WhatsApp_Image_2026-05-24_at_5.34.48_202605281256.jpeg",
      purity: "Emas 916 (22K)",
      weight: 22.00,
      craftsmanship: 850.00,
      description: "Tenunan rantai coco laksamana tebal yang gagah dan tegap, disaluti kilauan emas 916 murni yang memancarkan kewibawaan sejati.",
      status: "active"
    },
    {
      id: "ear-1",
      title: "Subang Permata Melur",
      category: "subang",
      image: "Product/Subang/Isolate_subang_permata_melur.png",
      purity: "Emas 916 (22K)",
      weight: 6.50,
      craftsmanship: 350.00,
      description: "Subang gantung klasik bermotifkan kelopak melur emas murni 916, dihiasi perincian filigri halus yang memantulkan keanggunan abadi.",
      status: "active"
    }
  ],
  orders: [],
  banners: [
    // HERO SLIDES
    {
      id: "hero-slide-0",
      type: "hero",
      title: "Sertai Keahlian Kelab Elit & Nikmati Diskaun Sehingga 15%",
      subtitle: "Keistimewaan Kelab VIP",
      image: "Model/cincin_rantai_gelang_header.jpg",
      description: "Sertai Membership kami untuk mendapatkan discount sehingga 15% bagi setiap pembelian barangan emas murni Chempaka.",
      link: "/koleksi.html",
      ctaText: "Lihat Koleksi",
      status: "active"
    },
    {
      id: "hero-slide-1",
      type: "hero",
      title: "Nilai Abadi. Keanggunan Terukir.",
      subtitle: "Siri Platinum DiRaja",
      image: "Model/second_header_bracelet.jpg",
      description: "Hayati keindahan seni pertukangan emas warisan Melayu bertaraf VIP.",
      link: "#highlight-section",
      ctaText: "Mula Meneroka",
      status: "active"
    },
    {
      id: "hero-slide-2",
      type: "hero",
      title: "Keanggunan Tradisi Sejati",
      subtitle: "— Duta Kami, Ayu Damit",
      image: "Ayu Damit-Ambassador/ayu_damit_white_campaign.jpg",
      description: "Hayati pesona kemilau emas murni Chempaka bersama rekaan eksklusif yang memancarkan karisma sejati wanita Melayu anggun.",
      link: "/tentang-kami.html",
      ctaText: "Kisah Duta Kami",
      status: "active"
    },
    {
      id: "hero-slide-3",
      type: "hero",
      title: "Keanggunan Warisan DiRaja",
      subtitle: "- Duta Kami Ayu Damit",
      image: "Ayu Damit-Ambassador/ayu_damit_suit.jpg",
      description: "Hayati pesona kemilau emas murni 916 dengan rekaan mahkota keindahan eksklusif yang memancarkan aura keanggunan sejati seumur hidup.",
      link: "/koleksi.html",
      ctaText: "Terokai Koleksi",
      status: "active"
    },
    
    // BANNER SLIDES (Combined banner carousel)
    {
      id: "banner-slide-1",
      type: "banner",
      title: "Shop Cincin Permata DiRaja with 30% Exclusive Discount",
      subtitle: "Tawaran Terhad Acara VIP",
      image: "Product/WhatsApp Image 2026-05-24 at 5.34.41 PM.jpeg",
      description: "Miliki mahkota keindahan sejati Emas 916 dengan potongan harga istimewa 30% eksklusif untuk kunjungan minggu ini sahaja.",
      link: "/koleksi.html?category=cincin",
      ctaText: "Dapatkan Sekarang",
      status: "active"
    },
    {
      id: "banner-slide-2",
      type: "banner",
      title: "Sertai Kelab Elit Chempaka & Terima 15% Rebate Seumur Hidup",
      subtitle: "Keahlian Kelab Elit",
      image: "Model/vip_lounge_showroom.png",
      description: "Daftar keahlian VIP percuma hari ini untuk menikmati rebat 15% automatik untuk semua produk emas, tempahan awal koleksi Royale, dan undangan eksklusif.",
      link: "SIGNUP_MODAL",
      ctaText: "Daftar Keahlian Percuma",
      status: "active"
    }
  ]
};

// Database utility class
class Database {
  constructor() {
    this.data = initialDb;
    this.load();
  }

  // Load database from file
  load() {
    try {
      if (fs.existsSync(dbPath)) {
        const fileContent = fs.readFileSync(dbPath, 'utf8');
        this.data = JSON.parse(fileContent);
        // Robust migration check to sync goldRates
        if (!this.data.goldRates) {
          this.data.goldRates = { gold916: 368.50, gold999: 385.20 };
          this.save();
        }
        // Robust migration check to sync banners array
        if (!this.data.banners) {
          this.data.banners = initialDb.banners;
          this.save();
        }
        console.log("Database successfully loaded from", dbPath);
      } else {
        this.save();
        console.log("New database initialized at", dbPath);
      }
    } catch (e) {
      console.error("Error loading database:", e.message);
      this.data = initialDb;
    }
  }

  // Save database to file
  save() {
    try {
      fs.writeFileSync(dbPath, JSON.stringify(this.data, null, 2), 'utf8');
    } catch (e) {
      console.error("Error saving database:", e.message);
    }
  }

  // Auth Operations
  findUserByEmail(email) {
    return this.data.users.find(u => u.email.toLowerCase() === email.toLowerCase());
  }

  addUser(user) {
    this.data.users.push(user);
    this.save();
    return user;
  }

  // Product Operations
  getProducts() {
    return this.data.products;
  }

  findProductById(id) {
    return this.data.products.find(p => p.id === id);
  }

  addProduct(product) {
    this.data.products.push(product);
    this.save();
    return product;
  }

  updateProductStatus(id, status) {
    const p = this.findProductById(id);
    if (p) {
      p.status = status;
      this.save();
      return p;
    }
    return null;
  }


  // Order Operations
  getOrders() {
    return this.data.orders;
  }

  findOrderById(id) {
    return this.data.orders.find(o => o.id === id);
  }

  addOrder(order) {
    this.data.orders.push(order);
    this.save();
    return order;
  }

  updateOrderStatus(id, status, paymentDetails = {}) {
    const o = this.findOrderById(id);
    if (o) {
      o.status = status;
      o.payment = { ...o.payment, ...paymentDetails };
      this.save();
      return o;
    }
    return null;
  }

  // Gold Rates Operations
  getGoldRates() {
    return this.data.goldRates || { gold916: 368.50, gold999: 385.20 };
  }

  updateGoldRates(gold916, gold999) {
    this.data.goldRates = {
      gold916: parseFloat(gold916) || 368.50,
      gold999: parseFloat(gold999) || 385.20
    };
    this.save();
    return this.data.goldRates;
  }

  // Banner Operations
  getBanners() {
    return this.data.banners || [];
  }

  findBannerById(id) {
    return this.data.banners ? this.data.banners.find(b => b.id === id) : null;
  }

  addBanner(banner) {
    if (!this.data.banners) this.data.banners = [];
    this.data.banners.push(banner);
    this.save();
    return banner;
  }

  deleteBanner(id) {
    if (this.data.banners) {
      const initialLength = this.data.banners.length;
      this.data.banners = this.data.banners.filter(b => b.id !== id);
      if (this.data.banners.length !== initialLength) {
        this.save();
        return true;
      }
    }
    return false;
  }

  // Voucher Operations
  getVouchers() {
    return this.data.vouchers || [];
  }

  findVoucherByCode(code) {
    if (!this.data.vouchers) return null;
    return this.data.vouchers.find(v => v.code.toUpperCase() === code.toUpperCase());
  }

  addVoucher(voucher) {
    if (!this.data.vouchers) this.data.vouchers = [];
    const existing = this.findVoucherByCode(voucher.code);
    if (existing) return null;
    
    this.data.vouchers.push(voucher);
    this.save();
    return voucher;
  }

  deleteVoucher(code) {
    if (this.data.vouchers) {
      const initialLength = this.data.vouchers.length;
      this.data.vouchers = this.data.vouchers.filter(v => v.code.toUpperCase() !== code.toUpperCase());
      if (this.data.vouchers.length !== initialLength) {
        this.save();
        return true;
      }
    }
    return false;
  }

  // User Operations
  getUsers() {
    return this.data.users || [];
  }

  updateUserRole(id, role) {
    if (!this.data.users) return null;
    const u = this.data.users.find(user => user.id === id);
    if (u) {
      u.role = role;
      this.save();
      return u;
    }
    return null;
  }
}

module.exports = new Database();
