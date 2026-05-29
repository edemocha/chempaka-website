/**
 * Chempaka Jewels - Keindahan Abadi
 * Shared Application State Manager & Dynamic Layouts Injector
 */

document.addEventListener('DOMContentLoaded', () => {
  // 1. Inject common layouts: Header, Cart Sidebar, Top Announcements Ticker, and Modals
  injectLayouts();
  
  // 2. Inject Google Sign-in Modal
  injectGoogleModal();
  
  // 3. Refresh Auth Status & Sync UI
  refreshAuthUI();
  
  // 4. Initialize common event listeners
  initCommonEvents();

  // 5. Initialize VIP Welcome Modal invitation
  initVipWelcomeModal();

  // 6. Initialize global scroll-linked reveals and parallax controls
  initScrollAnimations();
});

// In-memory Auth and Cart states
// Smart API base: 
// 1. When running frontend locally on a different port (e.g. Live Server 5500), connect to local backend (3000)
// 2. When hosted on GitHub Pages (github.io), connect to local backend (http://localhost:3000) for testing
// 3. (Optional) Replace 'http://localhost:3000' with your hosted backend URL (e.g. Render) when deploying the backend!
window.API_BASE = (window.location.hostname === 'localhost' && !window.location.origin.includes('3000'))
  ? 'http://localhost:3000'
  : (window.location.hostname.includes('github.io') ? 'http://localhost:3000' : '');
let currentUser = JSON.parse(localStorage.getItem('chempaka_user')) || null;
let sessionToken = localStorage.getItem('chempaka_token') || null;
let cart = JSON.parse(localStorage.getItem('chempaka_cart')) || [];

// --- LAYOUTS INJECTION ---

function injectLayouts() {
  // Top Announcement Strip with Infinite Horizontal Marquee
  const annStrip = document.createElement('div');
  annStrip.className = "relative flex overflow-x-hidden border-b border-white/5 bg-[#2B2B2B] py-1.5 z-[60] w-full text-[10px] uppercase font-semibold tracking-[0.18em]";
  annStrip.innerHTML = `
    <div class="animate-marquee whitespace-nowrap flex">
      <span class="mx-16 text-gray-200 font-semibold uppercase tracking-[0.2em]" id="live-ticker-rates">Harga Emas Semasa: Emas 999 - RM385.20/g | Emas 916 - RM368.50/g</span>
      <span class="mx-16 text-[#C59D5F] font-bold uppercase tracking-[0.2em]">Sertai Membership untuk dapatkan sehingga 10% diskaun</span>
    </div>
    <div class="animate-marquee whitespace-nowrap flex" aria-hidden="true">
      <span class="mx-16 text-gray-200 font-semibold uppercase tracking-[0.2em]" id="live-ticker-rates-dup">Harga Emas Semasa: Emas 999 - RM385.20/g | Emas 916 - RM368.50/g</span>
      <span class="mx-16 text-[#C59D5F] font-bold uppercase tracking-[0.2em]">Sertai Membership untuk dapatkan sehingga 10% diskaun</span>
    </div>
  `;
  document.body.prepend(annStrip);

  // Dynamic Gold Price Ticker Fetch
  fetch(window.API_BASE + '/api/gold-rates')
    .then(res => res.json())
    .then(data => {
      const ticker = document.getElementById('live-ticker-rates');
      const tickerDup = document.getElementById('live-ticker-rates-dup');
      if (data.rates) {
        const rateText = `Harga Emas Semasa: Emas 999 - RM${data.rates.gold999.toFixed(2)}/g | Emas 916 - RM${data.rates.gold916.toFixed(2)}/g`;
        if (ticker) ticker.innerText = rateText;
        if (tickerDup) tickerDup.innerText = rateText;
      }
    })
    .catch(err => console.log("Ticker live rate fetch offline fallback used."));

  // Dynamic Navigation Bar
  const navPlaceholder = document.getElementById('navbar-placeholder');
  if (navPlaceholder) {
    navPlaceholder.innerHTML = `
      <nav class="border-b border-gray-100 bg-white/90 backdrop-blur-md px-6 py-4 lg:px-16 transition-all duration-300" id="main-nav">
        <div class="max-w-[1400px] mx-auto flex items-center justify-between relative">
          <!-- Mobile Hamburger Menu (Shown on Mobile Left) -->
          <div class="flex items-center lg:hidden">
            <button onclick="toggleMobileMenu()" aria-label="Toggle Mobile Menu" class="hover:text-[#C59D5F] transition-colors focus:outline-none relative">
              <svg id="hamburger-icon-svg" class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path id="hamburger-path-1" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M4 6h16" class="transition-transform duration-300 origin-center"></path>
                <path id="hamburger-path-2" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M4 12h16" class="transition-opacity duration-300"></path>
                <path id="hamburger-path-3" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M4 18h16" class="transition-transform duration-300 origin-center"></path>
              </svg>
            </button>
          </div>
          
          <!-- Logo (Mobile: Absolute Centered | Desktop: Normal Left) -->
          <!-- Desktop Logo -->
          <a href="index.html" class="hidden lg:block flex-shrink-0">
            <h1 class="text-2xl lg:text-3xl font-serif tracking-[0.25em] text-[#C59D5F] font-bold uppercase">Chempaka</h1>
          </a>
          <!-- Mobile Logo -->
          <a href="index.html" class="absolute left-1/2 transform -translate-x-1/2 lg:hidden flex-shrink-0">
            <h1 class="text-xl sm:text-2xl font-serif tracking-[0.2em] text-[#C59D5F] font-bold uppercase">Chempaka</h1>
          </a>
          
          <!-- Menu Links (Hidden on Tablet/Mobile, Centered on Desktop) -->
          <div class="hidden lg:flex space-x-8 uppercase text-sm tracking-[0.2em] font-semibold text-[#2B2B2B]/80">
            <a class="hover:text-[#C59D5F] hover-gold-line pb-1 transition-colors" href="koleksi.html">Koleksi</a>
            <a class="hover:text-[#C59D5F] hover-gold-line pb-1 transition-colors" href="tentang-kami.html">Tentang Kami</a>
            <a class="hover:text-[#C59D5F] hover-gold-line pb-1 transition-colors" href="membership.html">Keahlian</a>
            <a class="hover:text-[#C59D5F] hover-gold-line pb-1 transition-colors" href="butik.html">Butik</a>
            <a class="hover:text-[#C59D5F] hover-gold-line pb-1 transition-colors" href="hubungi.html">Hubungi</a>
          </div>
          
          <!-- Action Icons (Mobile: Right | Desktop: Right) -->
          <div class="flex items-center space-x-4 lg:space-x-6 text-gray-800 relative">
            <button onclick="toggleAuthModal()" aria-label="Account" class="hover:text-[#C59D5F] transition-colors relative">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"></path></svg>
              <span id="vip-indicator" class="absolute -top-1 -right-1 bg-green-500 w-2 h-2 rounded-full hidden"></span>
            </button>

            <button onclick="toggleCart()" aria-label="Cart" class="hover:text-[#C59D5F] transition-colors relative">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"></path></svg>
              <span id="cart-badge" class="absolute -top-2 -right-2 bg-[#C59D5F] text-white text-xs font-bold w-4.5 h-4.5 flex items-center justify-center rounded-full transition-transform duration-300 scale-0">0</span>
            </button>
          </div>
        </div>
      </nav>

      <!-- Glassmorphic Drop-down Mobile Menu overlay -->
      <div id="mobile-menu" class="hidden lg:hidden bg-white/95 backdrop-blur-md border-b border-gray-100 px-6 py-4 flex flex-col space-y-3.5 text-left uppercase text-xs tracking-[0.18em] font-semibold text-[#2B2B2B]/85 transition-all duration-300 relative z-40">
        <a class="hover:text-[#C59D5F] py-2 border-b border-gray-50/50 block transition-colors" href="koleksi.html">Koleksi</a>
        <a class="hover:text-[#C59D5F] py-2 border-b border-gray-50/50 block transition-colors" href="tentang-kami.html">Tentang Kami</a>
        <a class="hover:text-[#C59D5F] py-2 border-b border-gray-50/50 block transition-colors" href="membership.html">Keahlian</a>
        <a class="hover:text-[#C59D5F] py-2 border-b border-gray-50/50 block transition-colors" href="butik.html">Butik</a>
        <a class="hover:text-[#C59D5F] py-2 block transition-colors" href="hubungi.html">Hubungi</a>
      </div>

      <!-- Glassmorphic Login/Register Floating Card -->
      <div id="auth-modal" class="absolute top-16 right-6 lg:right-16 w-80 bg-white border border-gray-100 shadow-2xl p-6 rounded-sm hidden z-[100] glass-card">
        <div id="auth-unlogged">
          <h3 class="text-sm font-serif uppercase tracking-wider text-gray-900 mb-4 border-b border-gray-100 pb-2">Log Masuk VIP</h3>
          <div class="space-y-3">
            <input type="email" id="auth-email" placeholder="Alamat Emel" class="w-full text-xs border-gray-200 focus:border-[#C59D5F] focus:ring-0 py-2">
            <input type="password" id="auth-password" placeholder="Kata Laluan" class="w-full text-xs border-gray-200 focus:border-[#C59D5F] focus:ring-0 py-2">
            <button onclick="handleLogin()" class="w-full bg-[#2B2B2B] hover:bg-[#C59D5F] text-white text-sm py-2.5 uppercase tracking-wider font-semibold transition-colors">Log Masuk</button>
            
            <p class="text-xs text-gray-400 text-center py-1">Atau daftar kelab elit secara percuma</p>
            <input type="text" id="reg-name" placeholder="Nama Penuh" class="w-full text-xs border-gray-200 focus:border-[#C59D5F] focus:ring-0 py-2 hidden">
            <button id="reg-switch-btn" onclick="toggleRegFields()" class="w-full border border-gray-300 hover:border-black text-gray-700 hover:text-black text-sm py-2.5 uppercase tracking-wider font-semibold transition-colors">Daftar Keahlian VIP</button>
            <hr class="border-gray-100 my-2">
            <button onclick="handleGoogleSignIn()" class="w-full border border-gray-200 hover:bg-gray-50 text-gray-700 text-sm py-2.5 font-semibold transition-colors flex items-center justify-center gap-2 rounded-sm">
              <svg class="w-4 h-4" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v3.9h6.6c-.28 1.48-1.12 2.73-2.38 3.58v2.98h3.84c2.24-2.06 3.53-5.1 3.53-8.7c0-.24-.02-.48-.06-.71z"/>
                <path fill="#34A853" d="M12 24c3.24 0 5.97-1.08 7.96-2.91l-3.84-2.98c-1.08.72-2.45 1.16-4.12 1.16-3.17 0-5.85-2.15-6.81-5.04H1.24v3.09c1.98 3.93 6.06 6.63 10.76 6.63z"/>
                <path fill="#FBBC05" d="M5.19 14.19A7.165 7.165 0 0 1 4.8 12c0-.77.13-1.51.39-2.19V6.72H1.24C.45 8.3.0 10.1.0 12s.45 3.7 1.24 5.28l3.95-3.09z"/>
                <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.43-3.43C17.96 1.19 15.24 0 12 0 7.3 0 3.22 2.7 1.24 6.72l3.95 3.09c.96-2.89 3.64-5.06 6.81-5.06z"/>
              </svg>
              <span>Log Masuk dengan Google</span>
            </button>
          </div>
        </div>
        <div id="auth-logged" class="hidden text-center space-y-4">
          <div class="w-12 h-12 bg-yellow-50 text-[#C59D5F] rounded-full flex items-center justify-center mx-auto text-sm font-bold font-serif" id="user-initial">D</div>
          <div>
            <h4 class="font-serif font-semibold text-gray-900 text-sm" id="user-name-label">Danish Iman</h4>
            <span class="text-xs uppercase tracking-widest text-[#C59D5F] font-bold" id="user-tier-label">VIP Member (15% Rebate)</span>
          </div>
          <div class="space-y-2 pt-2 border-t border-gray-100">
            <a id="admin-link" href="/admin.html" class="w-full bg-blue-600 hover:bg-blue-700 text-white text-sm py-2.5 uppercase tracking-wider font-semibold block transition-colors hidden">Dashboard Admin</a>
            <button onclick="handleLogout()" class="w-full border border-gray-300 hover:border-red-500 hover:text-red-500 text-gray-600 text-sm py-2.5 uppercase tracking-wider font-semibold transition-colors">Log Keluar</button>
          </div>
        </div>
      </div>
    `;

    // Global toggle controller for dynamic responsive mobile menu drop-down
    window.toggleMobileMenu = function() {
      const menu = document.getElementById('mobile-menu');
      const p1 = document.getElementById('hamburger-path-1');
      const p2 = document.getElementById('hamburger-path-2');
      const p3 = document.getElementById('hamburger-path-3');
      if (!menu) return;
      
      const isOpen = !menu.classList.contains('hidden');
      if (isOpen) {
        menu.classList.add('hidden');
        if (p1) p1.setAttribute('d', 'M4 6h16');
        if (p2) p2.style.opacity = 1;
        if (p3) p3.setAttribute('d', 'M4 18h16');
      } else {
        menu.classList.remove('hidden');
        if (p1) p1.setAttribute('d', 'M6 18L18 6');
        if (p2) p2.style.opacity = 0;
        if (p3) p3.setAttribute('d', 'M6 6l12 12');
      }
    };
  }

  // Common Cart Sidebar Drawer
  const cartPlaceholder = document.getElementById('cart-placeholder');
  if (cartPlaceholder) {
    cartPlaceholder.innerHTML = `
      <div id="cart-sidebar" class="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm opacity-0 pointer-events-none transition-opacity duration-300">
        <div class="fixed right-0 top-0 h-full w-full max-w-[420px] bg-white shadow-2xl p-6 flex flex-col justify-between translate-x-full transition-transform duration-300" id="cart-drawer">
          <div>
            <div class="flex justify-between items-center mb-8 pb-4 border-b border-gray-100">
              <div class="flex items-center gap-2">
                <svg class="w-5 h-5 text-[#C59D5F]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"></path></svg>
                <h3 class="text-sm font-serif uppercase tracking-wider text-[#2B2B2B]">Troli Anda</h3>
              </div>
              <button onclick="toggleCart()" class="text-gray-400 hover:text-[#C59D5F]"><svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M6 18L18 6M6 6l12 12" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"></path></svg></button>
            </div>
            
            <!-- Cart Items List -->
            <div class="space-y-6 overflow-y-auto max-h-[60vh] pr-2" id="cart-items-container">
              <!-- Rendered dynamically -->
            </div>
          </div>
          
          <!-- Cart Summary Footer -->
          <div class="border-t border-gray-100 pt-6">
            <div class="flex justify-between items-center mb-2 text-xs font-semibold uppercase tracking-wider text-gray-500">
              <span>Subtotal Kasar:</span>
              <span id="cart-subtotal" class="text-gray-600 text-xs">RM 0.00</span>
            </div>

            <!-- Voucher Rebate Row -->
            <div id="cart-voucher-summary-row" class="flex justify-between items-center mb-2 text-xs font-semibold uppercase tracking-wider text-emerald-600 hidden">
              <span>Rebat Baucar:</span>
              <span id="cart-voucher-discount" class="text-xs font-mono">-RM 0.00</span>
            </div>

            <div class="flex justify-between items-center mb-4 text-sm font-semibold uppercase tracking-wider text-gray-800">
              <span>Jumlah Bersih (VIP):</span>
              <span id="cart-grandtotal" class="text-[#C59D5F] font-bold text-sm">RM 0.00</span>
            </div>

            <!-- Voucher Input Box -->
            <div class="mb-4 border-t border-b border-gray-100 py-3">
              <div class="flex gap-2">
                <input type="text" id="cart-voucher-input" placeholder="Kod Baucar (Cth: RAYA50)" class="w-2/3 text-[10px] border-gray-200 focus:border-[#C59D5F] focus:ring-0 uppercase font-mono tracking-wider px-2.5 py-2">
                <button onclick="applyVoucherCode()" class="w-1/3 bg-[#2B2B2B] hover:bg-[#C59D5F] text-white text-[9px] uppercase tracking-wider font-bold py-2 transition-colors">Tebus</button>
              </div>
              <div id="cart-voucher-msg" class="text-[9px] mt-1.5 hidden font-mono"></div>
            </div>

            <p class="text-xs text-gray-400 mb-6 leading-relaxed">
              Penghantaran premium berkurier & insurans sepenuhnya adalah PERCUMA untuk ahli Kelab Elit Chempaka.
            </p>
            <button onclick="simulateCheckout()" class="w-full bg-[#C59D5F] hover:bg-black text-white py-4 text-sm uppercase tracking-[0.2em] font-semibold transition-colors shadow-lg">
              Semak Keluar (Checkout FPX)
            </button>
          </div>
        </div>
      </div>
    `;
  }

  // Footer layout
  const footerPlaceholder = document.getElementById('footer-placeholder');
  if (footerPlaceholder) {
    footerPlaceholder.innerHTML = `
      <!-- CRYSTAL MEMBERSHIP CLUB SIGN UP BANNER -->
      <section class="bg-[#B8A99A] w-full relative z-20 py-12 md:py-20 overflow-hidden">
        <div class="max-w-[1400px] mx-auto px-6 sm:px-12 lg:px-20 grid grid-cols-1 md:grid-cols-12 items-center gap-8 md:gap-12">
          <!-- Left Column (Luxury Gold Logo) -->
          <div class="hidden md:flex col-span-12 md:col-span-3 lg:col-span-4 justify-center md:justify-start">
            <img
              src="Model/chempaka_jewels_gold_logo.png"
              alt="Chempaka Jewels Crystal Logo"
              class="h-44 md:h-[220px] w-auto object-contain transition-transform duration-700 hover:scale-105"
            />
          </div>
          
          <!-- Middle Column (Sign up info) -->
          <div class="col-span-12 md:col-span-8 lg:col-span-7 text-center flex flex-col items-center justify-center">
            <h2 class="font-serif text-[#1C1C1C] text-3xl md:text-[38px] font-medium tracking-wide mb-6 leading-tight">
              Daftar &amp; Nikmati Diskaun 10%*
            </h2>
            <!-- Desktop Description -->
            <p class="hidden md:block text-xs md:text-sm text-gray-800 leading-[1.8] font-normal max-w-xl mx-auto mb-8 tracking-wide">
              Jadilah yang terawal menerima maklumat tentang koleksi terbaharu, inspirasi gaya, idea hadiah, dan akses eksklusif. Daftar Keahlian Butik Chempaka hari ini dan nikmati potongan diskaun 10%* untuk pembelian dalam talian seterusnya (tertakluk kepada barangan harga penuh sahaja). <a href="https://docs.google.com/forms/d/e/1FAIpQLScnTbJ8QEIXe_ENrZbqYr0cVUfvSJPm6gyZzrH3z34nNSnU3Q/viewform?usp=dialog" target="_blank" rel="noopener noreferrer" class="underline hover:text-black transition-colors duration-200 font-medium">*Tertakluk kepada terma dan syarat</a>
            </p>
            <!-- Mobile Description -->
            <p class="block md:hidden text-xs text-gray-800 leading-[1.8] font-normal max-w-xs mx-auto mb-6 tracking-wide">
              Sertai Keahlian Butik Chempaka hari ini untuk potongan 10%* dan akses eksklusif. <a href="https://docs.google.com/forms/d/e/1FAIpQLScnTbJ8QEIXe_ENrZbqYr0cVUfvSJPm6gyZzrH3z34nNSnU3Q/viewform?usp=dialog" target="_blank" rel="noopener noreferrer" class="underline hover:text-black font-medium">*T&amp;C</a>
            </p>
            <a href="https://docs.google.com/forms/d/e/1FAIpQLScnTbJ8QEIXe_ENrZbqYr0cVUfvSJPm6gyZzrH3z34nNSnU3Q/viewform?usp=dialog" target="_blank" rel="noopener noreferrer" class="inline-block bg-black text-white hover:bg-white hover:text-black border border-black px-12 py-3 text-xs uppercase tracking-[0.2em] font-semibold transition-all duration-300 rounded-none shadow-md">
              Sertai Kelab Butik
            </a>
          </div>
          
          <!-- Right Column (spacing balance) -->
          <div class="hidden md:block md:col-span-1"></div>
        </div>
      </section>

      <footer class="bg-[#2B2B2B] text-[#CCCCCC] pt-10 md:pt-20 pb-12 border-t border-white/5">
        <div class="container mx-auto px-8 lg:px-16 max-w-[1400px]">
          
          <!-- FOUR COLUMNS GRID -->
          <div class="hidden md:grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-12 mb-20 text-left">
            
            <!-- Column 1: KHIDMAT PELANGGAN & SOALAN LAZIM -->
            <div>
              <h4 class="text-xs uppercase font-bold tracking-[0.2em] text-white mb-6">Khidmat Pelanggan &amp; Soalan Lazim</h4>
              <ul class="space-y-3.5 text-xs text-gray-400">
                <li><a class="hover:text-[#C59D5F] transition-colors" href="hubungi.html">Gambaran Keseluruhan Khidmat Pelanggan</a></li>
                <li><a class="hover:text-[#C59D5F] transition-colors" href="admin.html">Status Pesanan</a></li>
                <li><a class="hover:text-[#C59D5F] transition-colors" href="koleksi.html">Baki Kad Hadiah</a></li>
                <li><a class="hover:text-[#C59D5F] transition-colors" href="butik.html">Penghantaran</a></li>
                <li><a class="hover:text-[#C59D5F] transition-colors" href="hubungi.html">Pemulangan &amp; Pertukaran</a></li>
                <li><a class="hover:text-[#C59D5F] transition-colors" href="hubungi.html">Status Pembaikan</a></li>
                <li><a class="hover:text-[#C59D5F] transition-colors" href="hubungi.html">Hubungi Kami</a></li>
                <li><a class="hover:text-[#C59D5F] transition-colors" href="koleksi.html">Panduan Saiz</a></li>
                <li><a class="hover:text-[#C59D5F] transition-colors" href="butik.html">Butik Kami</a></li>
                <li><a class="hover:text-[#C59D5F] transition-colors" href="butik.html">Tempah Temujanji Butik</a></li>
              </ul>
            </div>
            
            <!-- Column 2: KEAHLIAN -->
            <div>
              <h4 class="text-xs uppercase font-bold tracking-[0.2em] text-white mb-6">Keahlian</h4>
              <ul class="space-y-3.5 text-xs text-gray-400">
                <li><a class="hover:text-[#C59D5F] transition-colors" href="https://docs.google.com/forms/d/e/1FAIpQLScnTbJ8QEIXe_ENrZbqYr0cVUfvSJPm6gyZzrH3z34nNSnU3Q/viewform?usp=dialog" target="_blank" rel="noopener noreferrer">Daftar Ahli</a></li>
                <li><a class="hover:text-[#C59D5F] transition-colors" href="membership.html">Kelab Chempaka</a></li>
                <li><a class="hover:text-[#C59D5F] transition-colors" href="https://docs.google.com/forms/d/e/1FAIpQLScnTbJ8QEIXe_ENrZbqYr0cVUfvSJPm6gyZzrH3z34nNSnU3Q/viewform?usp=dialog" target="_blank" rel="noopener noreferrer">Kelab VIP Chempaka</a></li>
              </ul>
            </div>
            
            <!-- Column 3: TENTANG KAMI -->
            <div>
              <h4 class="text-xs uppercase font-bold tracking-[0.2em] text-white mb-6">Tentang Kami</h4>
              <ul class="space-y-3.5 text-xs text-gray-400">
                <li><a class="hover:text-[#C59D5F] transition-colors" href="tentang-kami.html">Mengenai Chempaka</a></li>
                <li><a class="hover:text-[#C59D5F] transition-colors" href="tentang-kami.html">Peluang Kerjaya</a></li>
                <li><a class="hover:text-[#C59D5F] transition-colors" href="tentang-kami.html">Komuniti Alumni</a></li>
                <li><a class="hover:text-[#C59D5F] transition-colors" href="tentang-kami.html">Untuk Profesional</a></li>
                <li><a class="hover:text-[#C59D5F] transition-colors" href="tentang-kami.html">Peta Laman</a></li>
                <li><a class="hover:text-[#C59D5F] transition-colors" href="koleksi.html">Permata &amp; Emas Chempaka</a></li>
                <li><a class="hover:text-[#C59D5F] transition-colors" href="butik.html">Bilik Pameran Chempaka</a></li>
                <li><a class="hover:text-[#C59D5F] transition-colors" href="tentang-kami.html">Kod Etika &amp; Polisi Butik</a></li>
              </ul>
            </div>
            
            <!-- Column 4: UNDANG-UNDANG & POLISI -->
            <div>
              <h4 class="text-xs uppercase font-bold tracking-[0.2em] text-white mb-6">Undang-Undang &amp; Polisi</h4>
              <ul class="space-y-3.5 text-xs text-gray-400">
                <li><a class="hover:text-[#C59D5F] transition-colors" href="hubungi.html">Terma Penggunaan</a></li>
                <li><a class="hover:text-[#C59D5F] transition-colors" href="hubungi.html">Terma &amp; Syarat</a></li>
                <li><a class="hover:text-[#C59D5F] transition-colors" href="hubungi.html">Polisi Privasi</a></li>
                <li><a class="hover:text-[#C59D5F] transition-colors" href="hubungi.html">Persetujuan Kuki</a></li>
                <li><a class="hover:text-[#C59D5F] transition-colors" href="hubungi.html">Imprint (Maklumat Butik)</a></li>
                <li><a class="hover:text-[#C59D5F] transition-colors" href="hubungi.html">Maklumat REACH</a></li>
                <li><a class="hover:text-[#C59D5F] transition-colors" href="hubungi.html">Penyata Persetujuan Perlindungan Data</a></li>
              </ul>
            </div>
            
          </div>
          
          <!-- THIN DIVIDER LINE -->
          <hr class="hidden md:block border-white/10 mb-8" />
          
          <!-- BOTTOM SECTION -->
          <div class="flex flex-col lg:flex-row justify-between items-center lg:items-end gap-10 w-full">
            
            <!-- Left Side (Language + Copyright) -->
            <div class="flex flex-col items-center lg:items-start gap-4 order-3 lg:order-1">
              <!-- Globe Language Selector -->
              <div class="flex items-center gap-2 text-xs text-gray-400 font-semibold">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"></path></svg>
                <span>Malaysia</span>
                <span class="mx-1 text-gray-700">|</span>
                <span class="text-white hover:text-[#C59D5F] cursor-pointer">Bahasa Malaysia</span>
              </div>
              
              <!-- Copyright Block -->
              <div class="text-[10px] text-gray-500 leading-relaxed text-center lg:text-left max-w-xs font-light">
                © 2026 by Chempaka Jewels Sdn Bhd<br/>
                Nombor pendaftaran syarikat 200901004470 (847404-D). Hak cipta terpelihara.<br/>
                CHEMPAKA dan logo CHEMPAKA adalah tanda dagangan berdaftar Chempaka AG.
              </div>
            </div>
            
            <!-- Center Brand Logo -->
            <div class="text-center order-1 lg:order-2">
              <h2 class="text-white text-4xl lg:text-5xl font-serif tracking-[0.3em] font-semibold uppercase leading-none select-none">CHEMPAKA</h2>
            </div>
            
            <!-- Right Circular Social Media Icons -->
            <div class="flex items-center gap-3 order-2 lg:order-3">
              <!-- Facebook -->
              <a href="https://www.facebook.com/people/Chempaka-Jewels/pfbid02hV2YsFGp67RcNPVTFEkXyY6zaDRSF3PxZxRNvzxGmQ9d9hbxT16myzksZ7DwG6fol/" target="_blank" rel="noopener noreferrer" class="w-8 h-8 rounded-full border border-white/20 hover:border-white text-white/70 hover:text-white flex items-center justify-center transition-all duration-300" aria-label="Facebook">
                <svg class="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24"><path d="M22 12c0-5.52-4.48-10-10-10S2 6.48 2 12c0 4.84 3.44 8.87 8 9.8V15H8v-3h2V9.5C10 7.57 11.57 6 13.5 6H16v3h-2c-.55 0-1 .45-1 1v2h3v3h-3v6.95c4.56-.93 8-4.96 8-9.75z"/></svg>
              </a>
              <!-- Instagram -->
              <a href="https://www.instagram.com/chempakajewels?utm_source=ig_web_button_share_sheet&igsh=ZDNlZDc0MzIxNw%3D%3D" target="_blank" rel="noopener noreferrer" class="w-8 h-8 rounded-full border border-white/20 hover:border-white text-white/70 hover:text-white flex items-center justify-center transition-all duration-300" aria-label="Instagram">
                <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="1.8"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect><path d="M16 11.37A4 4 0 1112.63 8 4 4 0 0116 11.37z"></path><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line></svg>
              </a>
              <!-- TikTok -->
              <a href="https://www.tiktok.com/@chempakajewels?is_from_webapp=1&sender_device=pc" target="_blank" rel="noopener noreferrer" class="w-8 h-8 rounded-full border border-white/20 hover:border-white text-white/70 hover:text-white flex items-center justify-center transition-all duration-300" aria-label="TikTok">
                <svg class="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24"><path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.02 1.59 4.23.85.97 1.96 1.7 3.2 2.15.01 1.25.01 2.5 0 3.75-.97-.15-1.94-.48-2.82-1-.87-.51-1.63-1.2-2.22-2.02v6.62c.07 1.83-.58 3.65-1.78 4.96-1.5 1.59-3.76 2.37-5.96 2.06-2.17-.3-4.14-1.62-5.18-3.56C2 15 2 12.5 3.32 10.43c1.2-1.78 3.32-2.73 5.48-2.49v3.83c-1.12-.22-2.31.18-2.99 1.1-.64.91-.61 2.22.08 3.08.76.9 2.08 1.15 3.09.56.5-.32.82-.87.84-1.46V.02z"/></svg>
              </a>
            </div>
            
          </div>
          
        </div>
      </footer>
    `;
  }
}

// --- ACCOUNT / AUTH ACTIONS ---

function toggleAuthModal() {
  const modal = document.getElementById('auth-modal');
  if (modal) modal.classList.toggle('hidden');
}

let regMode = false;
function toggleRegFields() {
  const regName = document.getElementById('reg-name');
  const btn = document.getElementById('reg-switch-btn');
  regMode = !regMode;
  
  if (regMode) {
    regName.classList.remove('hidden');
    btn.innerText = "Hantar Pendaftaran VIP";
  } else {
    // Perform Registration submit
    handleRegister();
  }
}

function scrollToAuthAndSignUp() {
  window.open('https://docs.google.com/forms/d/e/1FAIpQLScnTbJ8QEIXe_ENrZbqYr0cVUfvSJPm6gyZzrH3z34nNSnU3Q/viewform?usp=dialog', '_blank');
}

function handleLogin() {
  const email = document.getElementById('auth-email').value;
  const password = document.getElementById('auth-password').value;

  if (!email || !password) {
    alert("Sila masukkan emel dan kata laluan.");
    return;
  }

  fetch(window.API_BASE + '/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  })
  .then(res => res.json())
  .then(data => {
    if (data.error) {
      alert(data.error);
    } else {
      localStorage.setItem('chempaka_token', data.token);
      localStorage.setItem('chempaka_user', JSON.stringify(data.user));
      currentUser = data.user;
      sessionToken = data.token;
      
      toggleAuthModal();
      refreshAuthUI();
      
      // Reload product listing with discounted prices if active
      if (typeof loadDynamicCatalog === 'function') loadDynamicCatalog();
      alert(`Successfully logged in as ${currentUser.name}!`);
    }
  })
  .catch(err => {
    console.error("Login Error:", err);
  });
}

function handleRegister() {
  const name = document.getElementById('reg-name').value;
  const email = document.getElementById('auth-email').value;
  const password = document.getElementById('auth-password').value;

  if (!name || !email || !password) {
    alert("Sila isi semua maklumat pendaftaran.");
    return;
  }

  fetch(window.API_BASE + '/api/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, email, password })
  })
  .then(res => res.json())
  .then(data => {
    if (data.error) {
      alert(data.error);
    } else {
      localStorage.setItem('chempaka_token', data.token);
      localStorage.setItem('chempaka_user', JSON.stringify(data.user));
      currentUser = data.user;
      sessionToken = data.token;
      
      // Reset registration form
      regMode = false;
      document.getElementById('reg-name').classList.add('hidden');
      document.getElementById('reg-switch-btn').innerText = "Daftar Keahlian VIP";
      
      toggleAuthModal();
      refreshAuthUI();
      
      if (typeof loadDynamicCatalog === 'function') loadDynamicCatalog();
      alert(`Successfully registered and logged in as ${currentUser.name}! Keahlian VIP anda sedang diproses untuk kelulusan.`);
    }
  })
  .catch(err => {
    console.error("Register Error:", err);
  });
}

function handleLogout() {
  localStorage.removeItem('chempaka_token');
  localStorage.removeItem('chempaka_user');
  currentUser = null;
  sessionToken = null;
  activeVoucher = null;
  localStorage.removeItem('chempaka_voucher');
  
  toggleAuthModal();
  refreshAuthUI();
  
  if (typeof loadDynamicCatalog === 'function') loadDynamicCatalog();
  alert("Anda telah berjaya log keluar.");
}

function refreshAuthUI() {
  const vipInd = document.getElementById('vip-indicator');
  const loggedDiv = document.getElementById('auth-logged');
  const unloggedDiv = document.getElementById('auth-unlogged');
  const adminLink = document.getElementById('admin-link');

  if (currentUser) {
    if (vipInd) vipInd.classList.remove('hidden');
    if (loggedDiv) loggedDiv.classList.remove('hidden');
    if (unloggedDiv) unloggedDiv.classList.add('hidden');

    document.getElementById('user-initial').innerText = currentUser.name.slice(0, 1).toUpperCase();
    document.getElementById('user-name-label').innerText = currentUser.name;
    
    if (currentUser.role === 'admin') {
      document.getElementById('user-tier-label').innerText = "Administrator";
      if (adminLink) adminLink.classList.remove('hidden');
    } else if (currentUser.role === 'member') {
      document.getElementById('user-tier-label').innerText = "VIP Member (15% Rebate)";
      if (adminLink) adminLink.classList.add('hidden');
    } else {
      document.getElementById('user-tier-label').innerText = "Pelanggan Biasa (VIP Diproses)";
      if (adminLink) adminLink.classList.add('hidden');
    }
  } else {
    if (vipInd) vipInd.classList.add('hidden');
    if (loggedDiv) loggedDiv.classList.add('hidden');
    if (unloggedDiv) unloggedDiv.classList.remove('hidden');
  }

  // Redraw shopping cart totals based on auth state
  renderCart();
}

// --- CART STATE MANAGEMENT ---

function toggleCart() {
  const sidebar = document.getElementById('cart-sidebar');
  const drawer = document.getElementById('cart-drawer');

  if (sidebar.classList.contains('opacity-0')) {
    sidebar.classList.remove('opacity-0', 'pointer-events-none');
    drawer.classList.remove('translate-x-full');
    renderCart();
  } else {
    sidebar.classList.add('opacity-0', 'pointer-events-none');
    drawer.classList.add('translate-x-full');
  }
}

function addToCart(productId, title, purity, weight, basePrice, image, selectedSize = null, selectedLength = null) {
  // Normalize sizes/lengths that are "Tiada" or empty
  const sizeVal = (selectedSize && selectedSize !== 'Tiada') ? selectedSize : null;
  const lengthVal = (selectedLength && selectedLength !== 'Tiada') ? selectedLength : null;

  const cartItemId = productId + "_" + title + (sizeVal ? "_" + sizeVal : "") + (lengthVal ? "_" + lengthVal : "");
  const existing = cart.find(item => (item.cartItemId || item.id) === cartItemId);
  if (existing) {
    existing.quantity += 1;
  } else {
    cart.push({
      id: productId,
      cartItemId: cartItemId,
      title: title,
      purity: purity,
      weight: weight,
      basePrice: basePrice,
      image: image,
      quantity: 1,
      size: sizeVal,
      length: lengthVal
    });
  }
  
  localStorage.setItem('chempaka_cart', JSON.stringify(cart));
  updateCartBadge();
  toggleCart();
}

function updateCartBadge() {
  const badge = document.getElementById('cart-badge');
  if (!badge) return;
  
  const count = cart.reduce((acc, item) => acc + item.quantity, 0);
  if (count > 0) {
    badge.innerText = count;
    badge.classList.remove('scale-0');
  } else {
    badge.classList.add('scale-0');
  }
}

function updateQuantity(cartItemId, delta) {
  const item = cart.find(i => (i.cartItemId || i.id) === cartItemId);
  if (item) {
    item.quantity += delta;
    if (item.quantity <= 0) {
      cart = cart.filter(i => (i.cartItemId || i.id) !== cartItemId);
    }
    localStorage.setItem('chempaka_cart', JSON.stringify(cart));
    updateCartBadge();
    renderCart();
  }
}

function renderCart() {
  const container = document.getElementById('cart-items-container');
  const subtotalLabel = document.getElementById('cart-subtotal');
  const grandtotalLabel = document.getElementById('cart-grandtotal');
  const voucherRow = document.getElementById('cart-voucher-summary-row');
  const voucherDiscountLabel = document.getElementById('cart-voucher-discount');
  
  if (!container) return;

  container.innerHTML = '';
  
  let subtotal = 0;
  let grandTotal = 0;
  const isMember = currentUser && currentUser.role === 'member';

  if (cart.length === 0) {
    container.innerHTML = `<p class="text-xs text-gray-400 text-center py-12">Troli anda kosong. Terokai rekaan emas murni kami.</p>`;
    subtotalLabel.innerText = "RM 0.00";
    grandtotalLabel.innerText = "RM 0.00";
    if (voucherRow) voucherRow.classList.add('hidden');
    return;
  }

  cart.forEach(item => {
    const itemSubtotal = item.basePrice * item.quantity;
    const itemGrandtotal = isMember ? (itemSubtotal * 0.85) : itemSubtotal;
    
    subtotal += itemSubtotal;
    grandTotal += itemGrandtotal;

    const sizeText = item.size ? `Saiz: ${item.size}` : '';
    const lengthText = item.length ? `Panjang: ${item.length}` : '';
    const specDetails = [sizeText, lengthText].filter(Boolean).join(' • ');
    const specElement = specDetails ? `<p class="text-[9px] text-[#C59D5F] font-bold mt-0.5 tracking-wider uppercase">${specDetails}</p>` : '';

    const div = document.createElement('div');
    div.className = "flex gap-4 items-center border-b border-gray-100 pb-4";
    const identifier = item.cartItemId || item.id;
    div.innerHTML = `
      <div class="w-16 h-20 bg-gray-50 flex-shrink-0">
        <img src="${item.image}" alt="${item.title}" class="w-full h-full object-cover">
      </div>
      <div class="flex-grow">
        <span class="text-[9px] uppercase tracking-wider text-[#C59D5F] font-bold block">${item.purity}</span>
        <h4 class="text-xs font-serif font-semibold text-gray-800">${item.title}</h4>
        ${specElement}
        <p class="text-[10px] text-gray-400 mb-2">${item.weight}g</p>
        <div class="flex items-center gap-2">
          <button onclick="updateQuantity('${identifier}', -1)" class="w-5 h-5 border border-gray-300 flex items-center justify-center text-xs font-semibold hover:border-black">-</button>
          <span class="text-xs px-1">${item.quantity}</span>
          <button onclick="updateQuantity('${identifier}', 1)" class="w-5 h-5 border border-gray-300 flex items-center justify-center text-xs font-semibold hover:border-black">+</button>
        </div>
      </div>
      <div class="text-right flex-shrink-0">
        <span class="text-xs font-bold text-gray-800 block">${isMember ? 'RM ' + (item.basePrice * 0.85).toFixed(2) : 'RM ' + item.basePrice.toFixed(2)}</span>
        ${isMember ? `<span class="text-[8px] text-gray-400 line-through">RM ${item.basePrice.toFixed(2)}</span>` : ''}
      </div>
    `;
    container.appendChild(div);
  });

  // Calculate Voucher discount dynamically
  let voucherDiscount = 0;
  if (activeVoucher) {
    const preVoucherSubtotal = grandTotal;
    if (activeVoucher.minPurchase && preVoucherSubtotal < activeVoucher.minPurchase) {
      const minLimit = activeVoucher.minPurchase;
      activeVoucher = null;
      localStorage.removeItem('chempaka_voucher');
      
      const msgEl = document.getElementById('cart-voucher-msg');
      if (msgEl) {
        msgEl.innerText = `Baucar terbatal. Syarat min. pembelian RM ${minLimit.toFixed(2)} tidak dipenuhi.`;
        msgEl.className = "text-[9px] mt-1.5 font-semibold text-red-500 font-mono block";
      } else {
        alert(`Baucar terbatal: Syarat min. pembelian RM ${minLimit.toFixed(2)} tidak dipenuhi.`);
      }
    } else {
      if (activeVoucher.discountType === 'percentage') {
        voucherDiscount = parseFloat((grandTotal * (activeVoucher.discountValue / 100)).toFixed(2));
      } else {
        voucherDiscount = Math.min(activeVoucher.discountValue, grandTotal);
      }
      grandTotal = grandTotal - voucherDiscount;
      
      // Restore coupon validation message on page load if valid
      const msgEl = document.getElementById('cart-voucher-msg');
      const inputEl = document.getElementById('cart-voucher-input');
      if (msgEl && inputEl) {
        if (!msgEl.innerText || msgEl.classList.contains('text-red-500')) {
          msgEl.innerText = `Baucar aktif: ${activeVoucher.code}`;
          msgEl.className = "text-[9px] mt-1.5 font-semibold text-emerald-600 font-mono block";
          inputEl.value = activeVoucher.code;
        }
      }
    }
  }

  subtotalLabel.innerText = `RM ${subtotal.toFixed(2)}`;
  grandtotalLabel.innerText = `RM ${grandTotal.toFixed(2)}`;

  if (activeVoucher && voucherDiscount > 0) {
    if (voucherRow) voucherRow.classList.remove('hidden');
    if (voucherDiscountLabel) voucherDiscountLabel.innerText = `-RM ${voucherDiscount.toFixed(2)}`;
  } else {
    if (voucherRow) voucherRow.classList.add('hidden');
  }

  // Inject/Update dynamic VIP conversion nudge in the drawer footer
  const footerElement = document.querySelector('#cart-drawer .border-t');
  if (footerElement) {
    // Remove existing nudge first if it exists
    const oldNudge = document.getElementById('cart-vip-nudge');
    if (oldNudge) oldNudge.remove();

    if (!isMember) {
      const savings = subtotal * 0.15;
      const nudgeDiv = document.createElement('div');
      nudgeDiv.id = "cart-vip-nudge";
      nudgeDiv.className = "mb-4 p-3 bg-yellow-500/10 border border-yellow-500/20 text-center rounded-sm animate-pulse";
      nudgeDiv.innerHTML = `
        <span class="text-[10px] text-[#C59D5F] font-bold block mb-1">Rebat VIP 15% Dikesan!</span>
        <span class="text-[9px] text-gray-600 block mb-2">Sertai Kelab VIP sekarang &amp; jimat <strong class="text-white bg-[#C59D5F] px-1.5 py-0.5 rounded-sm">RM ${savings.toFixed(2)}</strong> serta-merta untuk pesanan ini!</span>
        <a href="https://docs.google.com/forms/d/e/1FAIpQLScnTbJ8QEIXe_ENrZbqYr0cVUfvSJPm6gyZzrH3z34nNSnU3Q/viewform?usp=dialog" target="_blank" rel="noopener noreferrer" class="text-[9px] text-[#C59D5F] font-bold uppercase tracking-wider hover:underline block mx-auto">Daftar VIP Percuma &gt;</a>
      `;
      footerElement.prepend(nudgeDiv);
    }
  }
}

// --- FPX CHECKOUT INTEGRATION ---

let activeVoucher = JSON.parse(localStorage.getItem('chempaka_voucher')) || null;

function applyVoucherCode() {
  const code = document.getElementById('cart-voucher-input').value.trim();
  const msgEl = document.getElementById('cart-voucher-msg');
  
  if (!code) {
    alert("Sila masukkan kod baucar.");
    return;
  }
  
  let subtotal = 0;
  const isMember = currentUser && currentUser.role === 'member';
  cart.forEach(item => {
    const itemSubtotal = item.basePrice * item.quantity;
    subtotal += isMember ? (itemSubtotal * 0.85) : itemSubtotal;
  });

  fetch(window.API_BASE + '/api/vouchers/validate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ code, cartSubtotal: subtotal })
  })
  .then(res => res.json())
  .then(data => {
    if (data.error) {
      msgEl.innerText = data.error;
      msgEl.className = "text-[9px] mt-1.5 font-semibold text-red-500 font-mono block";
      activeVoucher = null;
      localStorage.removeItem('chempaka_voucher');
    } else {
      msgEl.innerText = `Rebat ${data.code} berjaya! Potongan RM ${data.discountAmount.toFixed(2)}`;
      msgEl.className = "text-[9px] mt-1.5 font-semibold text-emerald-600 font-mono block";
      activeVoucher = data;
      localStorage.setItem('chempaka_voucher', JSON.stringify(activeVoucher));
    }
    renderCart();
  })
  .catch(err => {
    console.error("Voucher error:", err);
    alert("Gagal mengesahkan baucar.");
  });
}

function simulateCheckout() {
  if (cart.length === 0) {
    alert("Troli anda kosong.");
    return;
  }

  const payload = {
    cartItems: cart.map(i => ({
      id: i.id,
      quantity: i.quantity,
      size: i.size || null,
      length: i.length || null
    })),
    voucherCode: activeVoucher ? activeVoucher.code : null
  };

  const headers = { 'Content-Type': 'application/json' };
  if (sessionToken) {
    headers['Authorization'] = sessionToken;
  }

  fetch(window.API_BASE + '/api/payment/create-bill', {
    method: 'POST',
    headers: headers,
    body: JSON.stringify(payload)
  })
  .then(res => res.json())
  .then(data => {
    if (data.error) {
      alert(data.error);
    } else {
      cart = [];
      localStorage.setItem('chempaka_cart', JSON.stringify([]));
      updateCartBadge();
      activeVoucher = null;
      localStorage.removeItem('chempaka_voucher');
      const targetUrl = data.paymentUrl.startsWith('/') ? data.paymentUrl.substring(1) : data.paymentUrl;
      window.location.href = (window.API_BASE ? window.API_BASE : '') + targetUrl;
    }
  })
  .catch(err => {
    console.error("Checkout Error:", err);
    alert("Gagal menghubungi pelayan pembayaran.");
  });
}

function initCommonEvents() {
  // Update badge immediately
  updateCartBadge();
  
  // Close auth card if clicking outside
  document.addEventListener('click', (e) => {
    const authModal = document.getElementById('auth-modal');
    const accountBtn = document.querySelector('[aria-label="Account"]');
    
    if (authModal && !authModal.contains(e.target) && accountBtn && !accountBtn.contains(e.target)) {
      authModal.classList.add('hidden');
    }
  });
}

// --- GOOGLE SIGN-IN INTERACTIVE MOCK FLOW ---

function injectGoogleModal() {
  const gModal = document.createElement('div');
  gModal.id = "google-signin-modal";
  gModal.className = "fixed inset-0 bg-black/60 backdrop-blur-sm z-[200] flex items-center justify-center hidden";
  gModal.style.fontFamily = "'Inter', sans-serif";
  gModal.innerHTML = `
    <div class="bg-white rounded-lg shadow-2xl border border-gray-100 max-w-sm w-full p-6 text-gray-800 animate-fadeIn">
      <!-- Google Logo & Header -->
      <div class="text-center mb-6">
        <svg class="w-8 h-8 mx-auto mb-3" viewBox="0 0 24 24">
          <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v3.9h6.6c-.28 1.48-1.12 2.73-2.38 3.58v2.98h3.84c2.24-2.06 3.53-5.1 3.53-8.7c0-.24-.02-.48-.06-.71z"/>
          <path fill="#34A853" d="M12 24c3.24 0 5.97-1.08 7.96-2.91l-3.84-2.98c-1.08.72-2.45 1.16-4.12 1.16-3.17 0-5.85-2.15-6.81-5.04H1.24v3.09c1.98 3.93 6.06 6.63 10.76 6.63z"/>
          <path fill="#FBBC05" d="M5.19 14.19A7.165 7.165 0 0 1 4.8 12c0-.77.13-1.51.39-2.19V6.72H1.24C.45 8.3.0 10.1.0 12s.45 3.7 1.24 5.28l3.95-3.09z"/>
          <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.43-3.43C17.96 1.19 15.24 0 12 0 7.3 0 3.22 2.7 1.24 6.72l3.95 3.09c.96-2.89 3.64-5.06 6.81-5.06z"/>
        </svg>
        <h3 class="text-base font-semibold text-gray-900">Sign in with Google</h3>
        <p class="text-xs text-gray-500 mt-1">to continue to Chempaka Jewels</p>
      </div>

      <!-- Account List -->
      <div class="space-y-3 mb-6">
        <!-- Account 1 -->
        <button onclick="selectGoogleAccount('Danish Iman', 'danish.iman.vip@gmail.com', '109923812')" class="w-full flex items-center gap-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 text-left transition-colors">
          <div class="w-8 h-8 rounded-full bg-[#C59D5F] text-white flex items-center justify-center font-serif text-sm font-bold">D</div>
          <div>
            <span class="text-xs font-semibold text-gray-800 block">Danish Iman</span>
            <span class="text-[10px] text-gray-500 block">danish.iman.vip@gmail.com</span>
          </div>
        </button>

        <!-- Account 2 -->
        <button onclick="selectGoogleAccount('Tengku Danish', 'tengku.danish.elite@gmail.com', '204481231')" class="w-full flex items-center gap-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 text-left transition-colors">
          <div class="w-8 h-8 rounded-full bg-[#2B2B2B] text-white flex items-center justify-center font-serif text-sm font-bold">T</div>
          <div>
            <span class="text-xs font-semibold text-gray-800 block">Tengku Danish</span>
            <span class="text-[10px] text-gray-500 block">tengku.danish.elite@gmail.com</span>
          </div>
        </button>

        <!-- Custom Account Entry option -->
        <div class="border-t border-gray-100 pt-3">
          <button onclick="toggleCustomGoogleInput(true)" id="g-custom-btn" class="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 text-left text-xs font-semibold text-[#C59D5F] transition-colors">
            <span>Use another account</span>
          </button>
          
          <div id="g-custom-input" class="hidden space-y-2 mt-2 pt-2 border-t border-gray-100">
            <input type="text" id="g-custom-name" placeholder="Full Name" class="w-full text-xs border-gray-200 focus:border-[#C59D5F] focus:ring-0 py-2 rounded-sm text-gray-900">
            <input type="email" id="g-custom-email" placeholder="Email Address" class="w-full text-xs border-gray-200 focus:border-[#C59D5F] focus:ring-0 py-2 rounded-sm text-gray-900">
            <button onclick="submitCustomGoogleAccount()" class="w-full bg-[#2B2B2B] hover:bg-[#C59D5F] text-white text-[10px] py-2.5 uppercase tracking-wider font-semibold transition-colors rounded-sm">Confirm Account</button>
          </div>
        </div>
      </div>

      <!-- Cancel btn -->
      <button onclick="toggleGoogleModal(false)" class="w-full border border-gray-300 hover:border-black text-gray-700 text-xs py-2.5 uppercase font-semibold transition-colors rounded-sm text-center">
        Cancel
      </button>
    </div>
  `;
  document.body.appendChild(gModal);
}

function handleGoogleSignIn() {
  // Hide main auth modal first
  const authModal = document.getElementById('auth-modal');
  if (authModal) authModal.classList.add('hidden');
  
  toggleGoogleModal(true);
}

function toggleGoogleModal(show) {
  const modal = document.getElementById('google-signin-modal');
  if (!modal) return;
  if (show) {
    modal.classList.remove('hidden');
  } else {
    modal.classList.add('hidden');
    toggleCustomGoogleInput(false);
  }
}

function toggleCustomGoogleInput(show) {
  const btn = document.getElementById('g-custom-btn');
  const inputDiv = document.getElementById('g-custom-input');
  if (show) {
    btn.classList.add('hidden');
    inputDiv.classList.remove('hidden');
  } else {
    btn.classList.remove('hidden');
    inputDiv.classList.add('hidden');
    document.getElementById('g-custom-name').value = '';
    document.getElementById('g-custom-email').value = '';
  }
}

function selectGoogleAccount(name, email, googleId) {
  toggleGoogleModal(false);
  
  fetch(window.API_BASE + '/api/auth/google-login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, email, googleId })
  })
  .then(res => res.json())
  .then(data => {
    if (data.error) {
      alert(data.error);
    } else {
      localStorage.setItem('chempaka_token', data.token);
      localStorage.setItem('chempaka_user', JSON.stringify(data.user));
      currentUser = data.user;
      sessionToken = data.token;
      
      refreshAuthUI();
      if (typeof loadDynamicCatalog === 'function') loadDynamicCatalog();
      alert(`Successfully logged in as ${currentUser.name}!`);
    }
  })
  .catch(err => {
    console.error("Google Auth Error:", err);
    alert("Gagal menyambung ke Google Sign-in API.");
  });
}

function submitCustomGoogleAccount() {
  const name = document.getElementById('g-custom-name').value;
  const email = document.getElementById('g-custom-email').value;
  const mockId = 'custom-' + Date.now();
  
  if (!name || !email) {
    alert("Sila isi maklumat akaun Google anda.");
    return;
  }
  
  selectGoogleAccount(name, email, mockId);
}

// --- VIP MEMBERSHIP ONBOARDING WELCOME POP-UP ---

function initVipWelcomeModal() {
  // Only show if user is a guest (not logged in)
  if (currentUser) return;

  // Check if already shown in this session
  if (sessionStorage.getItem('chempaka_welcome_shown')) return;

  // Inject modal into body
  const modalDiv = document.createElement('div');
  modalDiv.id = "vip-welcome-modal";
  modalDiv.className = "fixed inset-0 bg-black/60 backdrop-blur-md z-[150] flex items-center justify-center opacity-0 pointer-events-none transition-all duration-500";
  modalDiv.style.fontFamily = "'Inter', sans-serif";
  modalDiv.innerHTML = `
    <div class="bg-[#181818] border border-[#C59D5F]/20 max-w-sm w-full p-8 text-center text-white relative shadow-2xl rounded-sm transform translate-y-4 transition-transform duration-500" id="vip-welcome-card">
      <!-- Background Ambient Glow -->
      <div class="absolute -top-12 -right-12 w-36 h-36 bg-[#C59D5F]/5 blur-3xl pointer-events-none"></div>

      <!-- Close Button -->
      <button onclick="closeVipWelcome()" class="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors">
        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M6 18L18 6M6 6l12 12" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"></path></svg>
      </button>

      <!-- Badge and Icon -->
      <div class="w-16 h-16 bg-[#C59D5F]/10 text-[#C59D5F] rounded-full flex items-center justify-center mx-auto mb-6 border border-[#C59D5F]/20">
        <svg class="w-7 h-7 text-[#C59D5F]" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" d="M21 19H3M20 16L18 8l-4 4-2-6-2 6-4-4-2 8h16z" />
        </svg>
      </div>

      <!-- Welcome Content -->
      <span class="text-[#C59D5F] text-xs uppercase tracking-[0.3em] font-bold block mb-2">Jemputan Khas Diraja</span>
      <h3 class="text-sm font-serif text-white mb-4">Sertai Kelab Elit Chempaka</h3>
      
      <p class="text-xs text-gray-400 leading-relaxed max-w-sm mx-auto mb-6">
        Daftar hari ini secara percuma dan dapatkan <strong class="text-[#C59D5F] font-bold">Rebat Segera 15%</strong> untuk semua koleksi perhiasan emas murni di troli anda!
      </p>
 
      <div class="space-y-3 mb-6 text-left border-y border-white/5 py-4 text-xs text-gray-400 uppercase tracking-wider font-semibold">
        <div class="flex items-center gap-3">
          <svg class="w-3.5 h-3.5 text-[#C59D5F] flex-shrink-0" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M4.5 12.75l6 6 9-13.5"></path></svg>
          <span>15% Member-Only Pricing</span>
        </div>
        <div class="flex items-center gap-3">
          <svg class="w-3.5 h-3.5 text-[#C59D5F] flex-shrink-0" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M4.5 12.75l6 6 9-13.5"></path></svg>
          <span>Free Premium Insured Delivery</span>
        </div>
        <div class="flex items-center gap-3">
          <svg class="w-3.5 h-3.5 text-[#C59D5F] flex-shrink-0" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M4.5 12.75l6 6 9-13.5"></path></svg>
          <span>5% Exclusive Trade-In Bonus</span>
        </div>
      </div>
 
      <!-- CTA -->
      <a href="https://docs.google.com/forms/d/e/1FAIpQLScnTbJ8QEIXe_ENrZbqYr0cVUfvSJPm6gyZzrH3z34nNSnU3Q/viewform?usp=dialog" target="_blank" rel="noopener noreferrer" onclick="closeVipWelcome()" class="block w-full bg-[#C59D5F] hover:bg-[#A6824D] text-white py-3 text-sm uppercase tracking-[0.2em] font-bold transition-all duration-300 shadow-lg rounded-sm text-center">
        Aktifkan Rebat 15% VIP Percuma
      </a>
 
      <button onclick="closeVipWelcome()" class="text-xs text-gray-500 hover:text-gray-300 uppercase tracking-widest block mx-auto mt-4 font-semibold transition-colors">
        Tolak Jemputan
      </button>
    </div>
  `;
  document.body.appendChild(modalDiv);

  // Set timeout to show modal after 5 seconds
  setTimeout(() => {
    // Double check that user hasn't logged in during these 5s
    if (currentUser) return;
    
    modalDiv.classList.remove('opacity-0', 'pointer-events-none');
    document.getElementById('vip-welcome-card').classList.remove('translate-y-4');
    sessionStorage.setItem('chempaka_welcome_shown', 'true');
  }, 5000);
}

function closeVipWelcome() {
  const modal = document.getElementById('vip-welcome-modal');
  if (modal) {
    modal.classList.add('opacity-0', 'pointer-events-none');
    const card = document.getElementById('vip-welcome-card');
    if (card) card.classList.add('translate-y-4');
  }
}

function acceptVipOnboarding() {
  closeVipWelcome();
  window.open('https://docs.google.com/forms/d/e/1FAIpQLScnTbJ8QEIXe_ENrZbqYr0cVUfvSJPm6gyZzrH3z34nNSnU3Q/viewform?usp=dialog', '_blank');
}

// --- IMMERSIVE MOTION DESIGN CONTROLLER ---

let revealObserver = null;

function initScrollAnimations() {
  // 1. Scroll reveal Intersection Observer with a slight offset
  revealObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('active');
        observer.unobserve(entry.target);
      }
    });
  }, {
    threshold: 0.04, // Trigger when 4% of the element is visible for fast responsive load
    rootMargin: "0px 0px -24px 0px" // Triggers slightly before element enters to feel natural
  });

  // Perform initial element scan
  syncRevealObserver();

  // 2. Parallax Scroll effect via requestAnimationFrame for premium storytelling
  const parallaxLayers = document.querySelectorAll('.parallax-layer');
  if (parallaxLayers.length > 0) {
    let ticking = false;

    function updateParallax() {
      const scrollY = window.scrollY;
      const height = window.innerHeight;
      
      parallaxLayers.forEach(layer => {
        const rect = layer.getBoundingClientRect();
        // Element's center relative to viewport center
        const elementCenter = rect.top + rect.height / 2;
        const viewportCenter = height / 2;
        const diff = viewportCenter - elementCenter;
        
        // Custom speed factor (defaults to 0.05)
        const speed = parseFloat(layer.getAttribute('data-parallax-speed')) || 0.05;
        const translateY = diff * speed;
        
        // Cap the shift to ensure visual stability and no overlapping layout breaks
        const maxShift = 40;
        const cappedY = Math.max(-maxShift, Math.min(maxShift, translateY));
        
        layer.style.transform = `translateY(${cappedY}px)`;
      });
      ticking = false;
    }

    window.addEventListener('scroll', () => {
      if (!ticking) {
        window.requestAnimationFrame(updateParallax);
        ticking = true;
      }
    }, { passive: true });
    
    // Initial calculation on page load
    window.requestAnimationFrame(updateParallax);
  }

  // 3. Navbar premium dynamic scroll response (shrinks padding and adds luxury shadow)
  const mainNav = document.getElementById('main-nav');
  if (mainNav) {
    const handleNavbarScroll = () => {
      if (window.scrollY > 20) {
        mainNav.classList.remove('py-4');
        mainNav.classList.add('py-2.5', 'shadow-luxury', 'bg-white/95');
      } else {
        mainNav.classList.remove('py-2.5', 'shadow-luxury', 'bg-white/95');
        mainNav.classList.add('py-4');
      }
    };
    window.addEventListener('scroll', handleNavbarScroll, { passive: true });
    // Run on initial load to catch mid-page refreshes
    handleNavbarScroll();
  }
}

// Global utility to observe newly injected dynamic reveal elements (for catalogs & grids)
function syncRevealObserver() {
  if (!revealObserver) return;
  const unobservedReveals = document.querySelectorAll('.reveal-element:not(.active)');
  unobservedReveals.forEach(el => {
    revealObserver.observe(el);
  });
}

// Expose global hook for dynamic scripts to call after updates
window.syncRevealObserver = syncRevealObserver;

