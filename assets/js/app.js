// সিটি লাইটিং অ্যান্ড ইলেকট্রিক — স্টোরফ্রন্ট (হ্যাশ রাউটিং, কোনো বিল্ড স্টেপ নেই)
(function () {
  const S = window.SHOP;
  const { bn, money, toEnDigits, fmtDate } = Store;
  const app = document.getElementById("app");
  // নম্বর ছাড়া মোবাইল ব্যাংকিং মাধ্যম বাদ দেওয়া হয়
  const PAYMENTS = S.payments.filter(m => m.number !== "");
  let adminUnlocked = false;

  // ---------- সাহায্যকারী ফাংশন ----------
  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  }
  const $ = (sel, root) => (root || document).querySelector(sel);
  const $$ = (sel, root) => Array.from((root || document).querySelectorAll(sel));
  const catName = id => (CATEGORIES.find(c => c.id === id) || {}).name || "";
  const discountPct = p => (p.oldPrice > p.price ? Math.round((1 - p.price / p.oldPrice) * 100) : 0);
  const validPhone = v => /^01[3-9]\d{8}$/.test(toEnDigits(v).replace(/[\s-]/g, "").replace(/^\+?88/, ""));
  const normPhone = v => toEnDigits(v).replace(/[\s-]/g, "").replace(/^\+?88/, "");

  function stars(r) {
    const full = Math.round(r);
    return '<span class="stars">' + "★".repeat(full) + "☆".repeat(5 - full) + "</span>";
  }

  function visual(p) {
    if (p.image) return '<div class="pimg" style="background:#fff"><img src="' + esc(p.image) + '" alt="' + esc(p.name) + '" loading="lazy"></div>';
    const h = Number(p.hue) || 210;
    return '<div class="pimg" style="background:radial-gradient(circle at 50% 40%, hsl(' + h + ' 90% 92%), hsl(' + h + ' 60% 82%))"><span class="emoji" aria-hidden="true">' + esc(p.emoji || "💡") + "</span></div>";
  }

  function logoSvg(id) {
    return '<svg viewBox="0 0 64 64" aria-hidden="true">' +
      '<defs><linearGradient id="bolt' + id + '" x1="0" y1="1" x2="1" y2="0"><stop offset="0" stop-color="#fbbf24"/><stop offset=".55" stop-color="#fbbf24"/><stop offset=".56" stop-color="#1e9be6"/><stop offset="1" stop-color="#5cc3ff"/></linearGradient>' +
      '<radialGradient id="bulb' + id + '"><stop offset="0" stop-color="#fffbe6"/><stop offset="1" stop-color="#fbbf24"/></radialGradient></defs>' +
      '<path d="M5 56V30h7v-9h8V9h9v22h5v-8h7v14h6v19" fill="none" stroke="#fff" stroke-width="3" stroke-linejoin="round"/>' +
      '<path d="M2 57h52" stroke="#fff" stroke-width="3" stroke-linecap="round"/>' +
      '<polygon points="20,58 33,36 27,36 42,16 38,31 45,31" fill="url(#bolt' + id + ')"/>' +
      '<g class="glow"><circle cx="51" cy="12" r="10" fill="#fbbf24" opacity=".25"/></g>' +
      '<circle cx="51" cy="12" r="6.5" fill="url(#bulb' + id + ')"/><rect x="47.5" y="18" width="7" height="4" rx="1" fill="#cbd5e1"/>' +
      '<path d="M51 1v2M61 12h2M58.5 4.5l1.5-1.5M43.5 4.5L42 3" stroke="#fbbf24" stroke-width="1.6" stroke-linecap="round"/>' +
      "</svg>";
  }

  function toast(msg, link) {
    const t = $("#toast");
    t.innerHTML = esc(msg) + (link ? ' <a href="' + link.href + '">' + esc(link.text) + "</a>" : "");
    t.classList.add("show");
    clearTimeout(toast.timer);
    toast.timer = setTimeout(() => t.classList.remove("show"), 2800);
  }

  function productCard(p) {
    const off = discountPct(p);
    const wished = Store.wishlist().includes(p.id);
    return '<article class="pcard">' +
      '<a href="#/product/' + esc(p.id) + '">' + visual(p) + "</a>" +
      '<div class="ptag">' +
        (p.stock <= 0 ? '<span class="tag-out">স্টক আউট</span>' : "") +
        (off ? '<span class="tag-off">-' + bn(off) + "%</span>" : "") +
        (p.badge ? '<span class="tag-badge">' + esc(p.badge) + "</span>" : "") +
      "</div>" +
      '<button class="wish-btn" data-wish="' + esc(p.id) + '" aria-label="উইশলিস্ট" aria-pressed="' + wished + '">' + (wished ? "♥" : "♡") + "</button>" +
      '<div class="pbody">' +
        '<span class="pcat">' + esc(catName(p.cat)) + "</span>" +
        '<h3><a href="#/product/' + esc(p.id) + '">' + esc(p.name) + "</a></h3>" +
        '<div class="rating">' + stars(p.rating) + " (" + bn(p.reviews) + ")</div>" +
        '<div class="price"><b>' + money(p.price) + "</b>" + (p.oldPrice > p.price ? "<s>" + money(p.oldPrice) + "</s>" : "") + "</div>" +
        (p.stock > 0
          ? '<button class="btn btn-primary btn-sm" data-add="' + esc(p.id) + '">🛒 কার্টে যোগ করুন</button>'
          : '<button class="btn btn-outline btn-sm" disabled>স্টকে নেই</button>') +
      "</div></article>";
  }

  function parseHash() {
    const raw = location.hash.replace(/^#\/?/, "");
    const [path, qs] = raw.split("?");
    return { parts: path.split("/").filter(Boolean).map(decodeURIComponent), query: new URLSearchParams(qs || "") };
  }

  // ---------- পেজসমূহ ----------
  const views = {};

  views.home = function () {
    const all = Store.products();
    const deals = all.filter(p => discountPct(p) > 0 && p.stock > 0).sort((a, b) => discountPct(b) - discountPct(a)).slice(0, 8);
    const popular = all.filter(p => p.stock > 0).slice().sort((a, b) => b.reviews - a.reviews).slice(0, 8);
    return '<section class="hero">' +
        "<div>" +
          '<h1>মানসম্মত লাইট ও ইলেকট্রিক পণ্য <span class="hl">সাশ্রয়ী দামে</span></h1>' +
          "<p>" + esc(S.tagline) + "</p>" +
          '<div class="hero-tags"><span>⚡ ইনস্টলেশন</span><span>🔧 রিপেয়ার</span><span>☀️ এনার্জি সলিউশন</span></div>' +
          '<div class="hero-actions"><a class="btn btn-yellow" href="#/shop">এখনই কিনুন →</a><a class="btn btn-outline" href="#/services">ইলেকট্রিশিয়ান বুক করুন</a></div>' +
        "</div>" +
        '<div class="hero-art">' + logoSvg("hero") + "</div>" +
      "</section>" +
      '<section class="perks">' +
        '<div class="perk"><span class="ico">🚚</span><div><b>সারা দেশে ডেলিভারি</b><small>' + money(S.delivery.freeAbove) + "+ অর্ডারে ফ্রি</small></div></div>" +
        '<div class="perk"><span class="ico">💵</span><div><b>ক্যাশ অন ডেলিভারি</b><small>পণ্য হাতে পেয়ে টাকা দিন</small></div></div>' +
        '<div class="perk"><span class="ico">🛡️</span><div><b>মানসম্মত পণ্য</b><small>সাশ্রয়ী দাম, ওয়ারেন্টি সহ</small></div></div>' +
        '<div class="perk"><span class="ico">🏢</span><div><b>হোম ও কমার্শিয়াল</b><small>বাসা, অফিস ও দোকানের সমাধান</small></div></div>' +
      "</section>" +
      '<section class="section"><div class="section-head"><h2>ক্যাটাগরি</h2><a href="#/shop">সব দেখুন →</a></div>' +
        '<div class="cat-grid">' + CATEGORIES.map(c => '<a class="cat-tile" href="#/shop?cat=' + c.id + '"><div class="ico">' + c.icon + "</div><span>" + esc(c.name) + "</span></a>").join("") + "</div>" +
      "</section>" +
      (deals.length ? '<section class="section"><div class="section-head"><h2>🔥 আজকের অফার</h2><a href="#/shop?sale=1">সব অফার →</a></div><div class="grid">' + deals.map(productCard).join("") + "</div></section>" : "") +
      '<section class="section svc-banner">' +
        "<div><h2>⚡ লাইট-ফ্যান লাগাবেন বা ওয়্যারিং করাবেন?</h2><p>অভিজ্ঞ ইলেকট্রিশিয়ান আপনার বাসায় এসে কাজ করে দেবে — ইনস্টলেশন, রিপেয়ার ও সোলার সলিউশন।</p></div>" +
        '<a class="btn btn-yellow" href="#/services">সার্ভিস বুক করুন</a>' +
      "</section>" +
      '<section class="section"><div class="section-head"><h2>⭐ জনপ্রিয় পণ্য</h2><a href="#/shop?sort=popular">আরও দেখুন →</a></div><div class="grid">' + popular.map(productCard).join("") + "</div></section>";
  };

  views.shop = function (_, query) {
    const cat = query.get("cat") || "";
    const q = (query.get("q") || "").trim();
    const sort = query.get("sort") || "popular";
    const min = Number(toEnDigits(query.get("min") || "")) || 0;
    const max = Number(toEnDigits(query.get("max") || "")) || 0;
    const inStock = query.get("stock") === "1";
    const sale = query.get("sale") === "1";

    let list = Store.products().filter(p =>
      (!cat || p.cat === cat) &&
      (!q || (p.name + " " + catName(p.cat) + " " + p.desc).toLowerCase().includes(q.toLowerCase())) &&
      (!min || p.price >= min) && (!max || p.price <= max) &&
      (!inStock || p.stock > 0) && (!sale || discountPct(p) > 0)
    );
    const sorters = {
      popular: (a, b) => b.reviews - a.reviews,
      low: (a, b) => a.price - b.price,
      high: (a, b) => b.price - a.price,
      rating: (a, b) => b.rating - a.rating,
      discount: (a, b) => discountPct(b) - discountPct(a)
    };
    list.sort(sorters[sort] || sorters.popular);
    list.sort((a, b) => (b.stock > 0) - (a.stock > 0));

    const link = changes => {
      const p = new URLSearchParams(query);
      Object.entries(changes).forEach(([k, v]) => (v ? p.set(k, v) : p.delete(k)));
      const s = p.toString();
      return "#/shop" + (s ? "?" + s : "");
    };
    const all = Store.products();
    const title = q ? "\"" + esc(q) + "\" এর ফলাফল" : cat ? esc(catName(cat)) : sale ? "অফারের পণ্য" : "সব পণ্য";

    return '<div class="breadcrumb"><a href="#/">হোম</a> / ' + title + "</div>" +
      '<div class="shop-layout">' +
        '<aside class="card filters" id="filters">' +
          "<h4>ক্যাটাগরি</h4>" +
          '<div class="filter-list">' +
            '<a href="' + link({ cat: "" }) + '" class="' + (!cat ? "active" : "") + '"><span>সব পণ্য</span><span>' + bn(all.length) + "</span></a>" +
            CATEGORIES.map(c => '<a href="' + link({ cat: c.id }) + '" class="' + (cat === c.id ? "active" : "") + '"><span>' + c.icon + " " + esc(c.name) + "</span><span>" + bn(all.filter(p => p.cat === c.id).length) + "</span></a>").join("") +
          "</div>" +
          "<h4>দাম (৳)</h4>" +
          '<form id="priceForm" class="price-range"><input type="number" name="min" placeholder="সর্বনিম্ন" value="' + (min || "") + '" min="0"><input type="number" name="max" placeholder="সর্বোচ্চ" value="' + (max || "") + '" min="0"><button class="btn btn-primary btn-sm">✓</button></form>' +
          "<h4>অন্যান্য</h4>" +
          '<label class="check"><input type="checkbox" data-filter="stock" ' + (inStock ? "checked" : "") + "> শুধু স্টকে আছে</label>" +
          '<label class="check"><input type="checkbox" data-filter="sale" ' + (sale ? "checked" : "") + "> শুধু অফারের পণ্য</label>" +
          (cat || q || min || max || inStock || sale ? '<a class="btn btn-outline btn-sm btn-block" style="margin-top:14px" href="#/shop">ফিল্টার মুছুন</a>' : "") +
        "</aside>" +
        "<div>" +
          '<div class="toolbar"><div><h1 class="page-title" style="margin:0">' + title + '</h1><span class="muted">' + bn(list.length) + "টি পণ্য পাওয়া গেছে</span></div>" +
            '<div style="display:flex;gap:8px"><button class="btn btn-outline btn-sm filter-toggle" id="filterToggle">⚙️ ফিল্টার</button>' +
            '<select id="sortSel" aria-label="সাজান">' +
              [["popular", "জনপ্রিয়তা"], ["low", "দাম: কম থেকে বেশি"], ["high", "দাম: বেশি থেকে কম"], ["rating", "রেটিং"], ["discount", "সবচেয়ে বেশি ছাড়"]]
                .map(([v, t]) => '<option value="' + v + '"' + (sort === v ? " selected" : "") + ">" + t + "</option>").join("") +
            "</select></div></div>" +
          (list.length ? '<div class="grid">' + list.map(productCard).join("") + "</div>"
            : '<div class="card empty"><div class="big">🔍</div><h3>কোনো পণ্য পাওয়া যায়নি</h3><p class="muted">অন্য কিছু লিখে খুঁজুন অথবা ফিল্টার পরিবর্তন করুন।</p><a class="btn btn-primary" href="#/shop">সব পণ্য দেখুন</a></div>') +
        "</div>" +
      "</div>";
  };
  views.shop.mount = function (_, query) {
    $("#sortSel").addEventListener("change", e => { const p = new URLSearchParams(query); p.set("sort", e.target.value); location.hash = "#/shop?" + p; });
    $("#priceForm").addEventListener("submit", e => {
      e.preventDefault();
      const p = new URLSearchParams(query);
      ["min", "max"].forEach(k => { const v = e.target[k].value; v ? p.set(k, v) : p.delete(k); });
      location.hash = "#/shop?" + p;
    });
    $$("[data-filter]").forEach(cb => cb.addEventListener("change", () => {
      const p = new URLSearchParams(query);
      cb.checked ? p.set(cb.dataset.filter, "1") : p.delete(cb.dataset.filter);
      location.hash = "#/shop?" + p;
    }));
    $("#filterToggle").addEventListener("click", () => $("#filters").classList.toggle("open"));
  };

  views.product = function ([id]) {
    const p = Store.product(id);
    if (!p) return views.notfound();
    const off = discountPct(p);
    const wished = Store.wishlist().includes(p.id);
    const related = Store.products().filter(x => x.cat === p.cat && x.id !== p.id).slice(0, 4);
    return '<div class="breadcrumb"><a href="#/">হোম</a> / <a href="#/shop?cat=' + p.cat + '">' + esc(catName(p.cat)) + "</a> / " + esc(p.name) + "</div>" +
      '<div class="card pd">' +
        '<div style="position:relative">' + visual(p) +
          '<div class="ptag">' + (off ? '<span class="tag-off">-' + bn(off) + "%</span>" : "") + (p.badge ? '<span class="tag-badge">' + esc(p.badge) + "</span>" : "") + "</div></div>" +
        "<div>" +
          '<span class="muted">' + esc(catName(p.cat)) + "</span>" +
          "<h1>" + esc(p.name) + "</h1>" +
          '<div class="rating">' + stars(p.rating) + " " + bn(p.rating) + " · " + bn(p.reviews) + "টি রিভিউ</div>" +
          '<div class="price" style="margin:12px 0"><b>' + money(p.price) + "</b>" + (off ? "<s>" + money(p.oldPrice) + '</s><span class="tag-off" style="padding:2px 8px;border-radius:6px;font-size:13px">' + money(p.oldPrice - p.price) + " সাশ্রয়</span>" : "") + "</div>" +
          (p.stock > 0 ? '<div class="stock-in">✔ স্টকে আছে' + (p.stock < 10 ? " (মাত্র " + bn(p.stock) + "টি বাকি)" : "") + "</div>" : '<div class="stock-out">✖ বর্তমানে স্টকে নেই</div>') +
          "<p>" + esc(p.desc) + "</p>" +
          '<ul class="features">' + (p.features || []).map(f => "<li>" + esc(f) + "</li>").join("") + "</ul>" +
          (p.stock > 0 ?
            '<div class="pd-actions">' +
              '<div class="qty"><button type="button" data-step="-1" aria-label="কমান">−</button><input id="qty" type="number" min="1" max="' + p.stock + '" value="1" aria-label="পরিমাণ"><button type="button" data-step="1" aria-label="বাড়ান">+</button></div>' +
              '<button class="btn btn-primary" id="addBtn">🛒 কার্টে যোগ করুন</button>' +
              '<button class="btn btn-yellow" id="buyBtn">⚡ এখনই কিনুন</button>' +
            "</div>" : '<div class="pd-actions"><a class="btn btn-outline" href="tel:' + toEnDigits(S.phone).replace(/\D/g, "") + '">📞 স্টক জানতে কল করুন</a></div>') +
          '<button class="btn btn-outline btn-sm" data-wish="' + esc(p.id) + '">' + (wished ? "♥ উইশলিস্টে আছে" : "♡ উইশলিস্টে রাখুন") + "</button>" +
          '<div class="info-strip"><div>🚚 ঢাকায় ১-২ দিনে<br>ঢাকার বাইরে ২-৪ দিনে</div><div>💵 ক্যাশ অন ডেলিভারি<br>' + (PAYMENTS.length > 1 ? esc(PAYMENTS.slice(1).map(m => m.name).join("/")) : "পণ্য দেখে টাকা দিন") + '</div><div>🔁 ৭ দিনের<br>সহজ রিটার্ন</div></div>' +
        "</div>" +
      "</div>" +
      '<div class="card section">' +
        '<div class="tabs"><button class="active" data-tab="t1">বিবরণ</button><button data-tab="t2">ডেলিভারি</button><button data-tab="t3">ইনস্টলেশন</button></div>' +
        '<div id="t1"><p>' + esc(p.desc) + '</p><ul class="features">' + (p.features || []).map(f => "<li>" + esc(f) + "</li>").join("") + "</ul></div>" +
        '<div id="t2" hidden><p>ঢাকার ভেতরে ডেলিভারি চার্জ ' + money(S.delivery.insideDhaka) + ", ঢাকার বাইরে " + money(S.delivery.outsideDhaka) + "। " + money(S.delivery.freeAbove) + " বা তার বেশি অর্ডারে ডেলিভারি ফ্রি। পণ্য হাতে পেয়ে চেক করে টাকা দিন।</p></div>" +
        '<div id="t3" hidden><p>এই পণ্যটি লাগাতে ইলেকট্রিশিয়ান লাগবে? আমাদের দক্ষ টিম আপনার বাসায় গিয়ে ইনস্টল করে দেবে।</p><a class="btn btn-primary btn-sm" href="#/services?service=install">ইনস্টলেশন বুক করুন</a></div>' +
      "</div>" +
      (related.length ? '<section class="section"><div class="section-head"><h2>সম্পর্কিত পণ্য</h2></div><div class="grid">' + related.map(productCard).join("") + "</div></section>" : "");
  };
  views.product.mount = function ([id]) {
    const p = Store.product(id);
    if (!p) return;
    $$(".tabs button").forEach(b => b.addEventListener("click", () => {
      $$(".tabs button").forEach(x => x.classList.toggle("active", x === b));
      ["t1", "t2", "t3"].forEach(t => ($("#" + t).hidden = t !== b.dataset.tab));
    }));
    const qty = $("#qty");
    if (!qty) return;
    $$("[data-step]").forEach(b => b.addEventListener("click", () => {
      qty.value = Math.min(p.stock, Math.max(1, (Number(qty.value) || 1) + Number(b.dataset.step)));
    }));
    const getQty = () => Math.min(p.stock, Math.max(1, Number(qty.value) || 1));
    $("#addBtn").addEventListener("click", () => { Store.addToCart(p.id, getQty()); toast("কার্টে যোগ হয়েছে", { href: "#/cart", text: "কার্ট দেখুন" }); });
    $("#buyBtn").addEventListener("click", () => { Store.addToCart(p.id, getQty()); location.hash = "#/checkout"; });
  };

  function summaryBox(t, withCoupon, actionHtml) {
    const d = S.delivery;
    const left = d.freeAbove - t.subtotal;
    return '<aside class="card summary"><h3>অর্ডার সারাংশ</h3>' +
      (left > 0 ? '<div class="ship-bar">আর ' + money(left) + " কিনলেই <b>ফ্রি ডেলিভারি!</b><div class=\"bar\"><i style=\"width:" + Math.min(100, (t.subtotal / d.freeAbove) * 100) + '%"></i></div></div>'
        : '<div class="ship-bar">🎉 আপনি <b>ফ্রি ডেলিভারি</b> পাচ্ছেন!</div>') +
      '<div class="line"><span>সাবটোটাল (' + bn(t.lines.reduce((s, l) => s + l.qty, 0)) + "টি পণ্য)</span><span>" + money(t.subtotal) + "</span></div>" +
      (t.discount ? '<div class="line" style="color:var(--green)"><span>ছাড় (' + esc(t.code) + ")</span><span>-" + money(t.discount) + "</span></div>" : "") +
      '<div class="line"><span>ডেলিভারি চার্জ</span><span id="delivLine">' + (t.delivery ? money(t.delivery) : left > 0 ? "জেলা অনুযায়ী" : "ফ্রি") + "</span></div>" +
      (withCoupon ? '<div class="coupon"><input type="text" id="couponInput" placeholder="কুপন কোড" aria-label="কুপন কোড" value="' + esc(Store.load("coupon", "")) + '"><button type="button" class="btn btn-outline" id="couponBtn">প্রয়োগ</button></div><div id="couponMsg">' +
        (t.couponError ? '<span class="note-err">' + esc(t.couponError) + "</span>" : t.code ? '<span class="note-ok">✔ কুপন প্রয়োগ হয়েছে</span>' : '<span class="muted" style="font-size:13px">চেষ্টা করুন: WELCOME10</span>') + "</div>" : "") +
      '<div class="line total"><span>সর্বমোট</span><span id="totalLine">' + money(t.total) + "</span></div>" +
      actionHtml + "</aside>";
  }

  views.cart = function () {
    const t = Store.totals("ঢাকা", Store.load("coupon", ""));
    // কার্ট পেজে ডেলিভারি চার্জ চূড়ান্ত নয়, তাই মোট থেকে বাদ রাখা হয়
    t.total -= t.delivery; t.delivery = 0;
    if (!t.lines.length) return '<div class="card empty"><div class="big">🛒</div><h2>আপনার কার্ট খালি</h2><p class="muted">পছন্দের পণ্য কার্টে যোগ করুন।</p><a class="btn btn-primary" href="#/shop">কেনাকাটা শুরু করুন</a></div>';
    return '<h1 class="page-title">শপিং কার্ট</h1><div class="cart-layout"><div class="card">' +
      t.lines.map(l => '<div class="cart-item">' +
        '<a href="#/product/' + esc(l.id) + '">' + visual(l.product) + "</a>" +
        '<div><h4><a href="#/product/' + esc(l.id) + '">' + esc(l.product.name) + '</a></h4><span class="muted">' + money(l.product.price) + " / পিস</span>" +
          '<div style="margin-top:6px"><div class="qty"><button data-q="' + esc(l.id) + '" data-d="-1" aria-label="কমান">−</button><input type="number" value="' + l.qty + '" data-qi="' + esc(l.id) + '" min="1" max="' + l.product.stock + '" aria-label="পরিমাণ"><button data-q="' + esc(l.id) + '" data-d="1" aria-label="বাড়ান">+</button></div></div></div>' +
        '<div class="right"><b>' + money(l.product.price * l.qty) + '</b><button class="link-btn" data-remove="' + esc(l.id) + '">🗑 মুছুন</button></div>' +
      "</div>").join("") +
      '<div style="display:flex;justify-content:space-between;margin-top:12px;gap:10px;flex-wrap:wrap"><a class="btn btn-outline" href="#/shop">← আরও কিনুন</a><button class="btn btn-danger" id="clearCart">কার্ট খালি করুন</button></div>' +
      "</div>" + summaryBox(t, true, '<a class="btn btn-yellow btn-block" href="#/checkout" style="margin-top:12px">চেকআউট করুন →</a>') + "</div>";
  };
  views.cart.mount = function () {
    $$("[data-q]").forEach(b => b.addEventListener("click", () => {
      const line = Store.cart().find(i => i.id === b.dataset.q);
      if (line) Store.setQty(line.id, line.qty + Number(b.dataset.d));
    }));
    $$("[data-qi]").forEach(i => i.addEventListener("change", () => Store.setQty(i.dataset.qi, Math.max(1, Number(i.value) || 1))));
    $$("[data-remove]").forEach(b => b.addEventListener("click", () => { Store.setQty(b.dataset.remove, 0); toast("পণ্যটি কার্ট থেকে মুছে ফেলা হয়েছে"); }));
    const clear = $("#clearCart");
    if (clear) clear.addEventListener("click", () => { if (confirm("কার্টের সব পণ্য মুছে ফেলবেন?")) Store.clearCart(); });
    bindCoupon();
  };

  function bindCoupon(beforeApply) {
    const input = $("#couponInput"), btn = $("#couponBtn");
    if (!input) return;
    btn.addEventListener("click", () => { if (beforeApply) beforeApply(); Store.save("coupon", input.value.trim().toUpperCase()); });
    input.addEventListener("keydown", e => { if (e.key === "Enter") { e.preventDefault(); btn.click(); } });
  }

  views.checkout = function () {
    const user = Store.session() || {};
    const draft = Store.load("checkoutDraft", {});
    const district = draft.district || "ঢাকা";
    const t = Store.totals(district, Store.load("coupon", ""));
    if (!t.lines.length) return '<div class="card empty"><div class="big">🛒</div><h2>চেকআউট করার মতো কিছু নেই</h2><a class="btn btn-primary" href="#/shop">কেনাকাটা করুন</a></div>';
    const v = k => esc(draft[k] != null ? draft[k] : user[k] || "");
    const pay = PAYMENTS.some(m => m.id === draft.payment) ? draft.payment : PAYMENTS[0].id;
    const fld = (name, label, input, err) => '<div class="field" data-f="' + name + '"><label for="f_' + name + '">' + label + "</label>" + input + '<div class="error">' + err + "</div></div>";
    return '<div class="breadcrumb"><a href="#/cart">কার্ট</a> / চেকআউট</div><h1 class="page-title">চেকআউট</h1>' +
      '<form id="checkoutForm" novalidate><div class="cart-layout"><div>' +
        '<div class="card"><h3>📍 ডেলিভারি তথ্য</h3>' +
          '<div class="row2">' +
            fld("name", "পূর্ণ নাম *", '<input id="f_name" name="name" type="text" value="' + v("name") + '" autocomplete="name">', "আপনার নাম লিখুন") +
            fld("phone", "মোবাইল নম্বর *", '<input id="f_phone" name="phone" type="tel" value="' + v("phone") + '" placeholder="01XXXXXXXXX" autocomplete="tel">', "সঠিক ১১ ডিজিটের মোবাইল নম্বর দিন") +
          "</div>" +
          '<div class="row2">' +
            fld("email", "ইমেইল (ঐচ্ছিক)", '<input id="f_email" name="email" type="email" value="' + v("email") + '" autocomplete="email">', "সঠিক ইমেইল দিন") +
            fld("district", "জেলা *", '<select id="f_district" name="district">' + DISTRICTS.map(d => "<option" + (d === district ? " selected" : "") + ">" + d + "</option>").join("") + "</select>", "") +
          "</div>" +
          fld("address", "সম্পূর্ণ ঠিকানা *", '<textarea id="f_address" name="address" rows="2" placeholder="বাসা/ফ্ল্যাট নং, রোড, এলাকা, থানা">' + v("address") + "</textarea>", "সম্পূর্ণ ঠিকানা লিখুন") +
          fld("note", "অর্ডার নোট (ঐচ্ছিক)", '<input id="f_note" name="note" type="text" value="' + v("note") + '" placeholder="যেমন: অফিস সময়ে ডেলিভারি দিন">', "") +
        "</div>" +
        '<div class="card section" style="margin-top:20px"><h3>💳 পেমেন্ট পদ্ধতি</h3><div class="pay-options">' +
          PAYMENTS.map(m => '<label class="pay-option"><input type="radio" name="payment" value="' + m.id + '"' + (pay === m.id ? " checked" : "") + "><span><b>" + esc(m.name) + "</b><small class=\"muted\">" + esc(m.note) + "</small></span></label>").join("") +
        "</div>" +
        '<div class="trx-box" id="trxBox"><p style="margin-top:0">নিচের নম্বরে <b id="payTotal">' + money(t.total) + '</b> <b>Send Money</b> করুন: <b id="payNumber"></b></p>' +
          fld("trxId", "ট্রানজেকশন আইডি (TrxID) *", '<input id="f_trxId" name="trxId" type="text" value="' + v("trxId") + '" placeholder="যেমন: 8N7A6B5C4D">', "ট্রানজেকশন আইডি দিন") +
        "</div></div>" +
      "</div>" +
      summaryBox(t, true,
        '<div class="mini-items">' + t.lines.map(l => '<div class="mini-item"><span>' + esc(l.product.name) + " × " + bn(l.qty) + "</span><b>" + money(l.product.price * l.qty) + "</b></div>").join("") + "</div>" +
        '<label class="check" style="margin:10px 0;font-size:14px"><input type="checkbox" id="agree" checked> আমি <a href="#/policy" style="color:var(--blue)">শর্তাবলী ও রিটার্ন নীতি</a> মেনে নিচ্ছি</label>' +
        '<button type="submit" class="btn btn-yellow btn-block" id="placeBtn">✔ অর্ডার কনফার্ম করুন</button>') +
      "</div></form>";
  };
  views.checkout.mount = function () {
    const form = $("#checkoutForm");
    if (!form) return;
    const saveDraft = () => Store.save("checkoutDraft", Object.fromEntries(new FormData(form)));
    bindCoupon(saveDraft);

    const refresh = () => {
      const fd = new FormData(form);
      const t = Store.totals(fd.get("district"), Store.load("coupon", ""));
      $("#delivLine").textContent = t.delivery ? money(t.delivery) : "ফ্রি";
      $("#totalLine").textContent = money(t.total);
      $("#payTotal").textContent = money(t.total);
      const m = PAYMENTS.find(x => x.id === fd.get("payment"));
      $("#trxBox").classList.toggle("show", !!(m && m.number));
      if (m && m.number) $("#payNumber").textContent = m.number + " (" + m.name + " পার্সোনাল)";
    };
    form.addEventListener("change", e => { if (e.target.name) { refresh(); saveDraft(); } });
    refresh();

    form.addEventListener("submit", e => {
      e.preventDefault();
      const fd = Object.fromEntries(new FormData(form));
      const m = PAYMENTS.find(x => x.id === fd.payment);
      const checks = {
        name: fd.name.trim().length >= 2,
        phone: validPhone(fd.phone),
        email: !fd.email.trim() || /^\S+@\S+\.\S+$/.test(fd.email.trim()),
        address: fd.address.trim().length >= 8,
        trxId: !(m && m.number) || fd.trxId.trim().length >= 6
      };
      let firstBad = null;
      Object.entries(checks).forEach(([k, ok]) => {
        const f = $('[data-f="' + k + '"]');
        f.classList.toggle("invalid", !ok);
        if (!ok && !firstBad) firstBad = f;
      });
      if (firstBad) { firstBad.querySelector("input,textarea").focus(); return; }
      if (!$("#agree").checked) { toast("অনুগ্রহ করে শর্তাবলী মেনে নিন"); return; }
      const order = Store.placeOrder({
        name: fd.name.trim(), phone: normPhone(fd.phone), email: fd.email.trim(), district: fd.district,
        address: fd.address.trim(), note: fd.note.trim(), payment: fd.payment, trxId: (m && m.number) ? fd.trxId.trim() : "",
        coupon: Store.load("coupon", "")
      });
      if (!order) return toast("কার্ট খালি, অর্ডার করা যায়নি");
      Store.save("coupon", "");
      Store.save("checkoutDraft", {});
      location.hash = "#/order/" + order.id;
    });
  };

  function orderSteps(o) {
    const flow = ["পেন্ডিং", "কনফার্মড", "শিপড", "ডেলিভারড"];
    if (o.status === "বাতিল") return '<p class="stock-out">✖ এই অর্ডারটি বাতিল করা হয়েছে।</p>';
    const at = flow.indexOf(o.status);
    const labels = ["অর্ডার গৃহীত", "কনফার্মড", "পাঠানো হয়েছে", "ডেলিভারড"];
    return '<div class="steps">' + labels.map((l, i) => '<div class="step' + (i <= at ? " done" : "") + '"><i>' + (i <= at ? "✓" : bn(i + 1)) + "</i>" + l + "</div>").join("") + "</div>";
  }

  function orderDetails(o) {
    const m = S.payments.find(x => x.id === o.payment.method) || { name: o.payment.method };
    return '<div class="table-wrap"><table><thead><tr><th>পণ্য</th><th>পরিমাণ</th><th style="text-align:right">মূল্য</th></tr></thead><tbody>' +
      o.items.map(i => "<tr><td>" + esc(i.name) + "</td><td>" + bn(i.qty) + '</td><td style="text-align:right">' + money(i.price * i.qty) + "</td></tr>").join("") +
      '<tr><td colspan="2">সাবটোটাল</td><td style="text-align:right">' + money(o.subtotal) + "</td></tr>" +
      (o.discount ? '<tr><td colspan="2">ছাড় (' + esc(o.coupon) + ')</td><td style="text-align:right">-' + money(o.discount) + "</td></tr>" : "") +
      '<tr><td colspan="2">ডেলিভারি চার্জ</td><td style="text-align:right">' + (o.delivery ? money(o.delivery) : "ফ্রি") + "</td></tr>" +
      '<tr><th colspan="2" style="color:var(--text)">সর্বমোট</th><th style="text-align:right;color:var(--text)">' + money(o.total) + "</th></tr>" +
      "</tbody></table></div>" +
      '<div class="row2" style="margin-top:14px"><div><b>ডেলিভারি ঠিকানা</b><br>' + esc(o.customer.name) + "<br>" + bn(o.customer.phone) + "<br>" + esc(o.customer.address) + ", " + esc(o.customer.district) + "</div>" +
      "<div><b>পেমেন্ট</b><br>" + esc(m.name) + (o.payment.trxId ? "<br>TrxID: " + esc(o.payment.trxId) : "") + "<br><b>তারিখ:</b> " + fmtDate(o.createdAt) + "</div></div>";
  }

  views.order = function ([id]) {
    const o = Store.findOrder(id);
    if (!o) return views.notfound();
    return '<div class="card success"><div class="big">✅</div><h1>ধন্যবাদ, ' + esc(o.customer.name) + "!</h1><p>আপনার অর্ডারটি সফলভাবে গ্রহণ করা হয়েছে। শীঘ্রই আমাদের প্রতিনিধি আপনাকে কল করে অর্ডার কনফার্ম করবেন।</p>" +
      '<div>অর্ডার নম্বর</div><div class="order-id">' + esc(o.id) + "</div>" + orderSteps(o) +
      '<div style="text-align:left">' + orderDetails(o) + "</div>" +
      '<div class="hero-actions" style="justify-content:center;margin-top:20px"><a class="btn btn-primary" href="#/track?id=' + esc(o.id) + "&phone=" + esc(o.customer.phone) + '">📦 অর্ডার ট্র্যাক করুন</a><button class="btn btn-outline" onclick="window.print()">🖨 রসিদ প্রিন্ট</button><a class="btn btn-outline" href="#/shop">আরও কিনুন</a></div></div>';
  };

  views.track = function (_, query) {
    const id = query.get("id") || "", phone = query.get("phone") || "";
    let result = "";
    if (id) {
      const o = Store.findOrder(id, phone);
      result = o ? '<div class="card section"><div class="section-head"><h2>অর্ডার ' + esc(o.id) + '</h2><span class="status s-' + esc(o.status) + '">' + esc(o.status) + "</span></div>" + orderSteps(o) + orderDetails(o) + "</div>"
        : '<div class="card section empty"><div class="big">😕</div><h3>অর্ডার পাওয়া যায়নি</h3><p class="muted">অর্ডার নম্বর ও মোবাইল নম্বর আবার দেখে নিন।</p></div>';
    }
    return '<h1 class="page-title">📦 অর্ডার ট্র্যাক করুন</h1><div class="card" style="max-width:640px">' +
      '<form id="trackForm"><div class="row2"><div class="field"><label for="tid">অর্ডার নম্বর</label><input id="tid" name="id" type="text" placeholder="CLE1234567" value="' + esc(id) + '" required></div>' +
      '<div class="field"><label for="tph">মোবাইল নম্বর</label><input id="tph" name="phone" type="tel" placeholder="01XXXXXXXXX" value="' + esc(phone) + '" required></div></div>' +
      '<button class="btn btn-primary">ট্র্যাক করুন</button></form></div>' + result;
  };
  views.track.mount = function () {
    $("#trackForm").addEventListener("submit", e => {
      e.preventDefault();
      location.hash = "#/track?" + new URLSearchParams({ id: e.target.id.value.trim(), phone: normPhone(e.target.phone.value) });
    });
  };

  views.wishlist = function () {
    const list = Store.wishlist().map(Store.product).filter(Boolean);
    if (!list.length) return '<div class="card empty"><div class="big">♡</div><h2>উইশলিস্ট খালি</h2><p class="muted">পছন্দের পণ্যে ♡ চাপুন, এখানে জমা থাকবে।</p><a class="btn btn-primary" href="#/shop">পণ্য দেখুন</a></div>';
    return '<h1 class="page-title">♡ আমার উইশলিস্ট (' + bn(list.length) + ")</h1><div class=\"grid\">" + list.map(productCard).join("") + "</div>";
  };

  views.services = function (_, query) {
    const pre = query.get("service") || "";
    const today = new Date().toISOString().slice(0, 10);
    return '<section class="svc-banner"><div><h1 style="margin-bottom:6px">⚡ ইলেকট্রিশিয়ান সার্ভিস</h1><p>ইনস্টলেশন • রিপেয়ার • এনার্জি সলিউশন — প্রশিক্ষিত ও যাচাইকৃত ইলেকট্রিশিয়ান, স্বচ্ছ চার্জ, কাজের পর পেমেন্ট।</p></div>' +
        '<a class="btn btn-yellow" href="tel:' + toEnDigits(S.phone).replace(/\D/g, "") + '">📞 ' + esc(S.phone) + "</a></section>" +
      '<section class="section svc-grid">' + S.services.map(s => '<div class="svc"><div class="ico">' + s.icon + "</div><h3>" + esc(s.name) + '</h3><div class="from">' + esc(s.price) + '</div><p class="muted">' + esc(s.desc) + "</p></div>").join("") + "</section>" +
      '<section class="section two-col">' +
        '<div class="card"><h2>সার্ভিস বুক করুন</h2><p class="muted">ফর্ম পূরণ করুন, আমরা কল করে সময় নিশ্চিত করব।</p>' +
          '<form id="bookForm" novalidate>' +
            '<div class="field"><label for="b_service">সার্ভিস *</label><select id="b_service" name="service">' + S.services.map(s => '<option value="' + s.id + '"' + (pre === s.id ? " selected" : "") + ">" + esc(s.name) + "</option>").join("") + "</select></div>" +
            '<div class="row2"><div class="field" data-f="name"><label for="b_name">নাম *</label><input id="b_name" name="name" type="text"><div class="error">নাম লিখুন</div></div>' +
            '<div class="field" data-f="phone"><label for="b_phone">মোবাইল *</label><input id="b_phone" name="phone" type="tel" placeholder="01XXXXXXXXX"><div class="error">সঠিক মোবাইল নম্বর দিন</div></div></div>' +
            '<div class="row2"><div class="field"><label for="b_district">জেলা</label><select id="b_district" name="district">' + DISTRICTS.map(d => "<option>" + d + "</option>").join("") + "</select></div>" +
            '<div class="field" data-f="date"><label for="b_date">পছন্দের তারিখ *</label><input id="b_date" name="date" type="date" min="' + today + '" value="' + today + '"><div class="error">তারিখ বাছাই করুন</div></div></div>' +
            '<div class="field" data-f="address"><label for="b_address">ঠিকানা *</label><input id="b_address" name="address" type="text" placeholder="বাসা, রোড, এলাকা"><div class="error">ঠিকানা লিখুন</div></div>' +
            '<div class="field"><label for="b_details">কাজের বিবরণ</label><textarea id="b_details" name="details" rows="3" placeholder="যেমন: ৩টি সিলিং ফ্যান ও ১টি ঝাড়বাতি লাগাতে হবে"></textarea></div>' +
            '<button class="btn btn-yellow btn-block">✔ বুকিং কনফার্ম করুন</button>' +
          "</form><div id=\"bookResult\"></div></div>" +
        '<div class="card"><h2>কেন আমাদের বেছে নেবেন?</h2><ul class="features" style="gap:12px">' +
          "<li>অভিজ্ঞ ইলেকট্রিশিয়ান টিম</li><li>কাজ শুরুর আগেই চার্জ জানিয়ে দেওয়া হয়</li><li>কাজ শেষে পেমেন্ট</li><li>আমাদের দোকান থেকে কেনা পণ্যে ইনস্টলেশন চার্জে ছাড়</li><li>বাসা, অফিস, দোকান ও কারখানা — সব ধরনের কাজ</li>" +
        "</ul></div>" +
      "</section>";
  };
  views.services.mount = function () {
    $("#bookForm").addEventListener("submit", e => {
      e.preventDefault();
      const fd = Object.fromEntries(new FormData(e.target));
      const checks = { name: fd.name.trim().length >= 2, phone: validPhone(fd.phone), date: !!fd.date, address: fd.address.trim().length >= 4 };
      let bad = null;
      Object.entries(checks).forEach(([k, ok]) => { const f = $('[data-f="' + k + '"]', e.target); f.classList.toggle("invalid", !ok); if (!ok && !bad) bad = f; });
      if (bad) return bad.querySelector("input").focus();
      const svc = S.services.find(s => s.id === fd.service);
      const b = Store.addBooking({ ...fd, phone: normPhone(fd.phone), serviceName: svc ? svc.name : fd.service });
      e.target.reset();
      $("#bookResult").innerHTML = '<div class="ship-bar" style="margin-top:14px">✅ বুকিং সফল হয়েছে! বুকিং নম্বর: <b>' + esc(b.id) + "</b>। আমাদের টিম শীঘ্রই আপনাকে কল করবে।</div>";
    });
  };

  views.contact = function () {
    return '<h1 class="page-title">যোগাযোগ করুন</h1><div class="two-col">' +
      '<div class="card"><h3>' + esc(S.name) + "</h3>" + (S.address ? "<p>📍 " + esc(S.address) + "</p>" : "") + "<p>📞 <a href=\"tel:" + toEnDigits(S.phone).replace(/\D/g, "") + '">' + esc(S.phone) + "</a></p><p>✉️ <a href=\"mailto:" + esc(S.email) + '">' + esc(S.email) + "</a></p>" + (S.hours ? "<p>🕙 " + esc(S.hours) + "</p>" : "") +
        (S.facebook ? '<p>📘 <a href="' + esc(S.facebook) + '" target="_blank" rel="noopener" style="color:var(--blue)">ফেসবুক পেজে মেসেজ দিন</a></p>' : "") +
        '<p class="muted">অর্ডার ও পণ্যের তথ্যের জন্য কল করুন বা ফেসবুক পেজে মেসেজ দিন। পাইকারি ও কন্ট্রাক্টর অর্ডারের জন্য বিশেষ মূল্য দেওয়া হয়।</p></div>' +
      '<div class="card"><h3>মেসেজ পাঠান</h3><form id="msgForm">' +
        '<div class="field"><label for="m_name">নাম</label><input id="m_name" name="name" type="text" required></div>' +
        '<div class="field"><label for="m_phone">মোবাইল</label><input id="m_phone" name="phone" type="tel" required></div>' +
        '<div class="field"><label for="m_msg">মেসেজ</label><textarea id="m_msg" name="message" rows="4" required></textarea></div>' +
        '<button class="btn btn-primary">পাঠান</button></form></div></div>';
  };
  views.contact.mount = function () {
    $("#msgForm").addEventListener("submit", e => {
      e.preventDefault();
      const fd = Object.fromEntries(new FormData(e.target));
      Store.save("messages", [{ ...fd, createdAt: Date.now() }, ...Store.load("messages", [])]);
      e.target.reset();
      toast("ধন্যবাদ! আপনার মেসেজ পাঠানো হয়েছে।");
    });
  };

  views.policy = function () {
    return '<div class="card prose"><h1 class="page-title">রিটার্ন, রিফান্ড ও ওয়ারেন্টি নীতি</h1>' +
      "<h3>রিটার্ন</h3><p>পণ্য হাতে পাওয়ার ৭ দিনের মধ্যে ত্রুটিপূর্ণ, ভাঙা বা ভুল পণ্য ফেরত দিতে পারবেন। পণ্যটি অব্যবহৃত ও মূল প্যাকেটে থাকতে হবে। ডেলিভারিম্যানের সামনে পণ্য চেক করে নেওয়ার অনুরোধ রইল।</p>" +
      "<h3>রিফান্ড</h3><p>রিটার্ন অনুমোদনের ৩-৫ কর্মদিবসের মধ্যে মোবাইল ব্যাংকিং বা ব্যাংকে টাকা ফেরত দেওয়া হয়।</p>" +
      "<h3>ওয়ারেন্টি</h3><p>প্রতিটি পণ্যের বিবরণে ওয়ারেন্টির মেয়াদ উল্লেখ আছে। ওয়ারেন্টি দাবির জন্য অর্ডার নম্বর বা রসিদ সংরক্ষণ করুন। ভুল ভোল্টেজ, পানি বা আগুনে ক্ষতিগ্রস্ত পণ্য ওয়ারেন্টির আওতায় পড়ে না।</p>" +
      "<h3>ডেলিভারি</h3><p>ঢাকার ভেতরে ১-২ দিন ও ঢাকার বাইরে ২-৪ কর্মদিবসে ডেলিভারি দেওয়া হয়। ডেলিভারি চার্জ: ঢাকায় " + money(S.delivery.insideDhaka) + ", ঢাকার বাইরে " + money(S.delivery.outsideDhaka) + "। " + money(S.delivery.freeAbove) + "+ অর্ডারে ফ্রি।</p></div>";
  };

  views.account = function () {
    const u = Store.session();
    if (!u) {
      return '<div class="auth card"><div class="tabs"><button class="active" data-auth="login">লগইন</button><button data-auth="register">নতুন অ্যাকাউন্ট</button></div>' +
        '<form id="loginForm"><div class="field"><label for="l_email">ইমেইল</label><input id="l_email" name="email" type="email" required autocomplete="email"></div>' +
          '<div class="field"><label for="l_pass">পাসওয়ার্ড</label><input id="l_pass" name="password" type="password" required autocomplete="current-password"></div>' +
          '<button class="btn btn-primary btn-block">লগইন</button></form>' +
        '<form id="regForm" hidden><div class="field"><label for="r_name">নাম</label><input id="r_name" name="name" type="text" required></div>' +
          '<div class="field"><label for="r_email">ইমেইল</label><input id="r_email" name="email" type="email" required></div>' +
          '<div class="field"><label for="r_phone">মোবাইল</label><input id="r_phone" name="phone" type="tel" required placeholder="01XXXXXXXXX"></div>' +
          '<div class="field"><label for="r_pass">পাসওয়ার্ড (কমপক্ষে ৬ অক্ষর)</label><input id="r_pass" name="password" type="password" minlength="6" required autocomplete="new-password"></div>' +
          '<button class="btn btn-yellow btn-block">অ্যাকাউন্ট খুলুন</button></form>' +
        '<p class="note-err" id="authErr"></p></div>';
    }
    const mine = Store.orders().filter(o => o.userEmail === u.email || o.customer.phone === normPhone(u.phone || ""));
    return '<div class="section-head"><h1 class="page-title" style="margin:0">স্বাগতম, ' + esc(u.name) + '</h1><button class="btn btn-outline btn-sm" id="logoutBtn">লগআউট</button></div>' +
      '<div class="card"><h3>আমার অর্ডার</h3>' +
      (mine.length ? '<div class="table-wrap"><table><thead><tr><th>অর্ডার</th><th>তারিখ</th><th>মোট</th><th>স্ট্যাটাস</th><th></th></tr></thead><tbody>' +
        mine.map(o => "<tr><td>" + esc(o.id) + "</td><td>" + fmtDate(o.createdAt) + "</td><td>" + money(o.total) + '</td><td><span class="status s-' + esc(o.status) + '">' + esc(o.status) + '</span></td><td><a class="btn btn-outline btn-sm" href="#/track?id=' + esc(o.id) + "&phone=" + esc(o.customer.phone) + '">বিস্তারিত</a></td></tr>').join("") +
        "</tbody></table></div>" : '<p class="muted">এখনো কোনো অর্ডার করেননি। <a href="#/shop" style="color:var(--blue)">কেনাকাটা শুরু করুন →</a></p>') + "</div>";
  };
  views.account.mount = function () {
    const lo = $("#logoutBtn");
    if (lo) return lo.addEventListener("click", () => { Store.logout(); toast("লগআউট হয়েছে"); });
    $$("[data-auth]").forEach(b => b.addEventListener("click", () => {
      $$("[data-auth]").forEach(x => x.classList.toggle("active", x === b));
      $("#loginForm").hidden = b.dataset.auth !== "login";
      $("#regForm").hidden = b.dataset.auth !== "register";
      $("#authErr").textContent = "";
    }));
    $("#loginForm").addEventListener("submit", async e => {
      e.preventDefault();
      const err = await Store.login(e.target.email.value, e.target.password.value);
      if (err) $("#authErr").textContent = err; else toast("লগইন সফল হয়েছে");
    });
    $("#regForm").addEventListener("submit", async e => {
      e.preventDefault();
      const f = e.target;
      if (!validPhone(f.phone.value)) return ($("#authErr").textContent = "সঠিক মোবাইল নম্বর দিন");
      if (f.password.value.length < 6) return ($("#authErr").textContent = "পাসওয়ার্ড কমপক্ষে ৬ অক্ষরের হতে হবে");
      const err = await Store.register(f.name.value.trim(), f.email.value, normPhone(f.phone.value), f.password.value);
      if (err) $("#authErr").textContent = err; else toast("অ্যাকাউন্ট তৈরি হয়েছে");
    });
  };

  // ---------- অ্যাডমিন প্যানেল ----------
  views.admin = function (parts) {
    if (!adminUnlocked) {
      return '<div class="auth card"><h2>🔐 অ্যাডমিন লগইন</h2><form id="pinForm"><div class="field"><label for="pin">পিন</label><input id="pin" type="password" inputmode="numeric" required></div><button class="btn btn-primary btn-block">প্রবেশ করুন</button></form><p class="note-err" id="pinErr"></p><p class="muted" style="font-size:13px">ডেমো পিন: config.js ফাইলে adminPin</p></div>';
    }
    const tab = parts[1] || "dashboard";
    const orders = Store.orders(), products = Store.products(), bookings = Store.bookings();
    const nav = '<div class="admin-tabs">' + [["dashboard", "📊 ড্যাশবোর্ড"], ["orders", "📦 অর্ডার"], ["products", "💡 পণ্য"], ["bookings", "🛠 সার্ভিস বুকিং"], ["messages", "✉️ মেসেজ"]]
      .map(([k, t]) => '<a class="btn ' + (tab === k ? "btn-primary" : "btn-outline") + ' btn-sm" href="#/admin/' + k + '">' + t + "</a>").join("") + "</div>";
    let body = "";
    if (tab === "dashboard") {
      const revenue = orders.filter(o => o.status !== "বাতিল").reduce((s, o) => s + o.total, 0);
      const low = products.filter(p => p.stock < 10);
      body = '<div class="stats">' +
        '<div class="stat"><small>মোট বিক্রি</small><b>' + money(revenue) + "</b></div>" +
        '<div class="stat"><small>মোট অর্ডার</small><b>' + bn(orders.length) + "</b></div>" +
        '<div class="stat"><small>পেন্ডিং অর্ডার</small><b>' + bn(orders.filter(o => o.status === "পেন্ডিং").length) + "</b></div>" +
        '<div class="stat"><small>নতুন সার্ভিস বুকিং</small><b>' + bn(bookings.filter(b => b.status === "নতুন").length) + "</b></div></div>" +
        '<div class="two-col"><div class="card"><h3>সাম্প্রতিক অর্ডার</h3>' + (orders.length ? orders.slice(0, 6).map(o => '<div class="mini-item"><span>' + esc(o.id) + " · " + esc(o.customer.name) + '</span><span class="status s-' + esc(o.status) + '">' + esc(o.status) + "</span></div>").join("") : '<p class="muted">এখনো কোনো অর্ডার নেই</p>') + "</div>" +
        '<div class="card"><h3>⚠️ কম স্টক (১০টির কম)</h3>' + (low.length ? low.map(p => '<div class="mini-item"><span>' + esc(p.name) + "</span><b class=\"" + (p.stock ? "" : "stock-out") + '">' + bn(p.stock) + "</b></div>").join("") : '<p class="muted">সব পণ্যের পর্যাপ্ত স্টক আছে</p>') + "</div></div>";
    } else if (tab === "orders") {
      body = '<div class="card table-wrap">' + (orders.length ? "<table><thead><tr><th>অর্ডার</th><th>কাস্টমার</th><th>পেমেন্ট</th><th>মোট</th><th>স্ট্যাটাস</th><th></th></tr></thead><tbody>" +
        orders.map(o => "<tr><td><b>" + esc(o.id) + "</b><br><small class=\"muted\">" + fmtDate(o.createdAt) + "</small></td><td>" + esc(o.customer.name) + "<br><small>" + bn(o.customer.phone) + " · " + esc(o.customer.district) + "</small></td>" +
          "<td>" + esc((S.payments.find(m => m.id === o.payment.method) || {}).name || o.payment.method) + (o.payment.trxId ? "<br><small>" + esc(o.payment.trxId) + "</small>" : "") + "</td><td>" + money(o.total) + "</td>" +
          '<td><select data-ostatus="' + esc(o.id) + '">' + Store.STATUSES.map(s => "<option" + (s === o.status ? " selected" : "") + ">" + s + "</option>").join("") + "</select></td>" +
          '<td><button class="btn btn-outline btn-sm" data-oview="' + esc(o.id) + '">দেখুন</button></td></tr>').join("") + "</tbody></table>" : '<p class="muted">এখনো কোনো অর্ডার নেই</p>') + "</div>";
    } else if (tab === "products") {
      body = '<div class="toolbar"><button class="btn btn-yellow" data-pedit="">＋ নতুন পণ্য যোগ করুন</button><button class="btn btn-outline btn-sm" id="resetProducts">ডিফল্ট পণ্যে ফিরে যান</button></div>' +
        '<div class="card table-wrap"><table><thead><tr><th>পণ্য</th><th>ক্যাটাগরি</th><th>দাম</th><th>স্টক</th><th></th></tr></thead><tbody>' +
        products.map(p => "<tr><td>" + esc(p.emoji || "") + " " + esc(p.name) + "</td><td>" + esc(catName(p.cat)) + "</td><td>" + money(p.price) + '</td><td><input type="number" min="0" value="' + p.stock + '" data-pstock="' + esc(p.id) + '" style="width:90px"></td>' +
          '<td style="white-space:nowrap"><button class="btn btn-outline btn-sm" data-pedit="' + esc(p.id) + '">এডিট</button> <button class="btn btn-danger btn-sm" data-pdel="' + esc(p.id) + '">ডিলিট</button></td></tr>').join("") +
        "</tbody></table></div>";
    } else if (tab === "bookings") {
      body = '<div class="card table-wrap">' + (bookings.length ? "<table><thead><tr><th>বুকিং</th><th>কাস্টমার</th><th>সার্ভিস</th><th>ঠিকানা ও বিবরণ</th><th>স্ট্যাটাস</th></tr></thead><tbody>" +
        bookings.map(b => "<tr><td><b>" + esc(b.id) + "</b><br><small>" + esc(b.date) + "</small></td><td>" + esc(b.name) + "<br><small>" + bn(b.phone) + "</small></td><td>" + esc(b.serviceName) + "</td><td>" + esc(b.address) + ", " + esc(b.district) + "<br><small class=\"muted\">" + esc(b.details) + "</small></td>" +
          '<td><select data-bstatus="' + esc(b.id) + '">' + ["নতুন", "শিডিউলড", "সম্পন্ন", "বাতিল"].map(s => "<option" + (s === b.status ? " selected" : "") + ">" + s + "</option>").join("") + "</select></td></tr>").join("") + "</tbody></table>" : '<p class="muted">এখনো কোনো সার্ভিস বুকিং নেই</p>') + "</div>";
    } else if (tab === "messages") {
      const msgs = Store.load("messages", []);
      body = '<div class="card">' + (msgs.length ? msgs.map(m => '<div class="mini-item" style="display:block"><b>' + esc(m.name) + "</b> · " + esc(m.phone) + ' <small class="muted">' + fmtDate(m.createdAt) + "</small><br>" + esc(m.message) + "</div>").join("") : '<p class="muted">কোনো মেসেজ নেই</p>') + "</div>";
    }
    return '<div class="section-head"><h1 class="page-title" style="margin:0">অ্যাডমিন প্যানেল</h1><button class="btn btn-outline btn-sm" id="adminOut">লক করুন</button></div>' + nav + body;
  };
  views.admin.mount = function () {
    const pf = $("#pinForm");
    if (pf) {
      $("#pin").focus();
      return pf.addEventListener("submit", e => {
        e.preventDefault();
        if (toEnDigits($("#pin").value) === String(S.adminPin)) { adminUnlocked = true; render(); }
        else $("#pinErr").textContent = "ভুল পিন";
      });
    }
    $("#adminOut").addEventListener("click", () => { adminUnlocked = false; render(); });
    $$("[data-ostatus]").forEach(s => s.addEventListener("change", () => { Store.setOrderStatus(s.dataset.ostatus, s.value); toast("অর্ডারের স্ট্যাটাস আপডেট হয়েছে"); }));
    $$("[data-bstatus]").forEach(s => s.addEventListener("change", () => { Store.setBookingStatus(s.dataset.bstatus, s.value); toast("বুকিং আপডেট হয়েছে"); }));
    $$("[data-oview]").forEach(b => b.addEventListener("click", () => {
      const o = Store.findOrder(b.dataset.oview);
      modal("<h2>অর্ডার " + esc(o.id) + "</h2>" + (o.customer.note ? '<p class="ship-bar">নোট: ' + esc(o.customer.note) + "</p>" : "") + orderDetails(o));
    }));
    $$("[data-pstock]").forEach(i => i.addEventListener("change", () => {
      Store.setProducts(Store.products().map(p => p.id === i.dataset.pstock ? { ...p, stock: Math.max(0, Number(i.value) || 0) } : p));
      toast("স্টক আপডেট হয়েছে");
    }));
    $$("[data-pdel]").forEach(b => b.addEventListener("click", () => {
      if (confirm("পণ্যটি ডিলিট করবেন?")) Store.setProducts(Store.products().filter(p => p.id !== b.dataset.pdel));
    }));
    $$("[data-pedit]").forEach(b => b.addEventListener("click", () => productEditor(b.dataset.pedit)));
    const rp = $("#resetProducts");
    if (rp) rp.addEventListener("click", () => { if (confirm("সব পরিবর্তন মুছে ডিফল্ট পণ্য তালিকায় ফিরে যাবেন?")) Store.resetProducts(); });
  };

  function modal(html) {
    const bg = document.createElement("div");
    bg.className = "modal-bg";
    bg.innerHTML = '<div class="modal" role="dialog" aria-modal="true">' + html + '<div style="text-align:right;margin-top:16px"><button class="btn btn-outline" data-close>বন্ধ করুন</button></div></div>';
    const close = () => { bg.remove(); document.removeEventListener("keydown", onKey); };
    const onKey = e => { if (e.key === "Escape") close(); };
    bg.addEventListener("click", e => { if (e.target === bg || e.target.hasAttribute("data-close")) close(); });
    document.addEventListener("keydown", onKey);
    document.body.appendChild(bg);
    return { el: bg, close };
  }

  function productEditor(id) {
    const p = id ? Store.product(id) : { id: "", name: "", cat: CATEGORIES[0].id, price: "", oldPrice: 0, stock: 10, rating: 5, reviews: 0, emoji: "💡", hue: 210, badge: "", desc: "", features: [], image: "" };
    const inp = (n, l, type, val) => '<div class="field"><label>' + l + '</label><input name="' + n + '" type="' + type + '" value="' + esc(val) + '"' + (type === "number" ? ' min="0" step="any"' : "") + "></div>";
    const m = modal("<h2>" + (id ? "পণ্য এডিট করুন" : "নতুন পণ্য") + '</h2><form id="pForm">' +
      inp("name", "পণ্যের নাম *", "text", p.name) +
      '<div class="row2"><div class="field"><label>ক্যাটাগরি</label><select name="cat">' + CATEGORIES.map(c => '<option value="' + c.id + '"' + (c.id === p.cat ? " selected" : "") + ">" + esc(c.name) + "</option>").join("") + "</select></div>" + inp("stock", "স্টক", "number", p.stock) + "</div>" +
      '<div class="row2">' + inp("price", "বিক্রয় মূল্য (৳) *", "number", p.price) + inp("oldPrice", "আগের মূল্য (৳, ঐচ্ছিক)", "number", p.oldPrice || "") + "</div>" +
      '<div class="row2">' + inp("emoji", "ইমোজি আইকন", "text", p.emoji) + inp("badge", "ব্যাজ (যেমন: নতুন)", "text", p.badge || "") + "</div>" +
      inp("image", "ছবির লিংক (ঐচ্ছিক)", "text", p.image || "") +
      '<div class="field"><label>বিবরণ</label><textarea name="desc" rows="3">' + esc(p.desc) + "</textarea></div>" +
      '<div class="field"><label>বৈশিষ্ট্য (প্রতি লাইনে একটি)</label><textarea name="features" rows="4">' + esc((p.features || []).join("\n")) + "</textarea></div>" +
      '<p class="note-err" id="pErr"></p><button class="btn btn-primary">সেভ করুন</button></form>');
    $("#pForm", m.el).addEventListener("submit", e => {
      e.preventDefault();
      const fd = Object.fromEntries(new FormData(e.target));
      const price = Number(fd.price);
      if (!fd.name.trim() || !(price > 0)) return ($("#pErr", m.el).textContent = "নাম ও সঠিক মূল্য দিন");
      const data = {
        ...p, name: fd.name.trim(), cat: fd.cat, price, oldPrice: Number(fd.oldPrice) || 0, stock: Math.max(0, Math.floor(Number(fd.stock) || 0)),
        emoji: fd.emoji.trim() || "💡", badge: fd.badge.trim(), image: fd.image.trim(), desc: fd.desc.trim(),
        features: fd.features.split("\n").map(s => s.trim()).filter(Boolean)
      };
      const list = Store.products();
      if (id) Store.setProducts(list.map(x => (x.id === id ? data : x)));
      else Store.setProducts([...list, { ...data, id: "p" + Date.now().toString(36), hue: Math.floor(Math.random() * 360) }]);
      m.close();
      toast("পণ্য সেভ হয়েছে");
    });
  }

  views.notfound = function () {
    return '<div class="card empty"><div class="big">🔌</div><h2>পেজটি খুঁজে পাওয়া যায়নি</h2><p class="muted">লিংকটি ভুল অথবা পণ্যটি সরিয়ে ফেলা হয়েছে।</p><a class="btn btn-primary" href="#/">হোমে ফিরে যান</a></div>';
  };

  // ---------- রাউটার ----------
  const titles = { shop: "সব পণ্য", cart: "শপিং কার্ট", checkout: "চেকআউট", track: "অর্ডার ট্র্যাক", wishlist: "উইশলিস্ট", services: "ইলেকট্রিশিয়ান সার্ভিস", contact: "যোগাযোগ", policy: "রিটার্ন নীতি", account: "আমার অ্যাকাউন্ট", admin: "অ্যাডমিন" };
  let lastPath = null;

  function render() {
    const { parts, query } = parseHash();
    const name = parts[0] || "home";
    const view = views[name] || views.notfound;
    const args = name === "admin" ? parts : parts.slice(1);
    const y = window.scrollY;
    app.innerHTML = view(args, query);
    if (view.mount) view.mount(args, query);

    const path = location.hash.split("?")[0];
    // একই পেজে ডেটা আপডেট হলে স্ক্রল অবস্থান ধরে রাখা হয়
    if (path === lastPath) window.scrollTo(0, y); else window.scrollTo(0, 0);
    lastPath = path;

    const p = name === "product" && Store.product(parts[1]);
    document.title = (p ? p.name : titles[name] || S.name) + " | City Lighting & Electric";
    $$(".mainnav a").forEach(a => {
      const href = a.getAttribute("href");
      a.classList.toggle("active", href === "#/" + (name === "home" ? "" : name) + (name === "shop" && query.get("cat") ? "?cat=" + query.get("cat") : "") );
    });
    $("#mainNav").classList.remove("open");
    if (name === "shop") $("#searchInput").value = query.get("q") || "";
    updateBadges();
  }

  function updateBadges() {
    const c = Store.cartCount(), w = Store.wishlist().length;
    const cb = $("#cartCount"), wb = $("#wishCount");
    cb.textContent = bn(c); cb.classList.toggle("show", c > 0);
    wb.textContent = bn(w); wb.classList.toggle("show", w > 0);
  }

  // ---------- গ্লোবাল ইভেন্ট ----------
  // টাইপ করলে সেই ঘরের ভুলের চিহ্ন মুছে যায়
  document.addEventListener("input", e => { const f = e.target.closest(".field.invalid"); if (f) f.classList.remove("invalid"); });
  document.addEventListener("click", e => {
    const add = e.target.closest("[data-add]");
    if (add) {
      Store.addToCart(add.dataset.add, 1) ? toast("কার্টে যোগ হয়েছে", { href: "#/cart", text: "কার্ট দেখুন" }) : toast("দুঃখিত, পণ্যটি স্টকে নেই");
    }
    const wish = e.target.closest("[data-wish]");
    if (wish) toast(Store.toggleWish(wish.dataset.wish) ? "উইশলিস্টে যোগ হয়েছে" : "উইশলিস্ট থেকে সরানো হয়েছে");
  });
  // কার্ট/উইশলিস্ট/অর্ডার পরিবর্তন হলে পেজ আবার রেন্ডার হয় (চেকআউট ড্রাফট ছাড়া)
  document.addEventListener("store:change", e => { if (e.detail !== "checkoutDraft" && e.detail !== "bookings" && e.detail !== "messages") render(); else updateBadges(); });
  window.addEventListener("storage", render);
  window.addEventListener("hashchange", render);

  $("#searchForm").addEventListener("submit", e => {
    e.preventDefault();
    const q = $("#searchInput").value.trim();
    location.hash = "#/shop" + (q ? "?q=" + encodeURIComponent(q) : "");
  });
  $("#menuBtn").addEventListener("click", () => $("#mainNav").classList.toggle("open"));

  // ---------- শুরু ----------
  $$("[data-shop]").forEach(el => (el.textContent = S[el.dataset.shop] || ""));
  $$("[data-optional]").forEach(el => (el.hidden = !S[el.dataset.optional]));
  const fb = $("#fbLink");
  if (S.facebook) fb.href = S.facebook; else fb.parentElement.hidden = true;
  ["#brandMark", "#brandMarkFooter"].forEach((sel, i) => {
    $(sel).innerHTML = S.logo ? '<img src="' + esc(S.logo) + '" alt="' + esc(S.nameEn) + '">' : logoSvg("m" + i);
  });
  $("#navCats").innerHTML = CATEGORIES.slice(0, 5).map(c => '<a href="#/shop?cat=' + c.id + '">' + esc(c.name) + "</a>").join("");
  $("#freeShipNote").textContent = money(S.delivery.freeAbove) + "+ অর্ডারে ফ্রি ডেলিভারি";
  $(".pay-logos").textContent = PAYMENTS.map(m => m.name).join(" • ");
  $("#year").textContent = bn(new Date().getFullYear());
  $("#callFab").href = "tel:" + toEnDigits(S.phone).replace(/\D/g, "");
  render();
})();
