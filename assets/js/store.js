// ডেটা সংরক্ষণ: কার্ট, উইশলিস্ট, অর্ডার, ইউজার — ব্রাউজারের localStorage এ রাখা হয়
(function () {
  const PREFIX = "cle_";
  const mem = {};

  function load(key, fallback) {
    try {
      const raw = localStorage.getItem(PREFIX + key);
      return raw ? JSON.parse(raw) : fallback;
    } catch (e) {
      return key in mem ? mem[key] : fallback;
    }
  }
  function save(key, value) {
    mem[key] = value;
    try { localStorage.setItem(PREFIX + key, JSON.stringify(value)); } catch (e) { /* প্রাইভেট মোডে সেভ না হলেও সাইট চলবে */ }
    document.dispatchEvent(new CustomEvent("store:change", { detail: key }));
  }

  // ---------- বাংলা সংখ্যা ও টাকা ----------
  const BN = "০১২৩৪৫৬৭৮৯";
  function bn(v) { return String(v).replace(/\d/g, d => BN[d]); }
  function money(n) { return "৳" + bn(Math.round(n).toLocaleString("en-IN")); }
  function toEnDigits(s) { return String(s).replace(/[০-৯]/g, d => BN.indexOf(d)); }
  function fmtDate(ts) {
    const d = new Date(ts);
    const months = ["জানুয়ারি", "ফেব্রুয়ারি", "মার্চ", "এপ্রিল", "মে", "জুন", "জুলাই", "আগস্ট", "সেপ্টেম্বর", "অক্টোবর", "নভেম্বর", "ডিসেম্বর"];
    return bn(d.getDate()) + " " + months[d.getMonth()] + " " + bn(d.getFullYear());
  }

  // ---------- পণ্য ----------
  function products() { return load("products", null) || window.DEFAULT_PRODUCTS; }
  function setProducts(list) { save("products", list); }
  function product(id) { return products().find(p => p.id === id); }
  function resetProducts() { try { localStorage.removeItem(PREFIX + "products"); } catch (e) {} delete mem.products; save("_", Date.now()); }

  // ---------- কার্ট ----------
  function cart() { return load("cart", []); }
  function addToCart(id, qty) {
    const p = product(id);
    if (!p || p.stock <= 0) return false;
    const items = cart();
    const line = items.find(i => i.id === id);
    if (line) line.qty = Math.min(line.qty + (qty || 1), p.stock);
    else items.push({ id, qty: Math.min(qty || 1, p.stock) });
    save("cart", items);
    return true;
  }
  function setQty(id, qty) {
    const p = product(id);
    let items = cart();
    if (qty <= 0 || !p) items = items.filter(i => i.id !== id);
    else items.forEach(i => { if (i.id === id) i.qty = Math.min(qty, p.stock); });
    save("cart", items);
  }
  function clearCart() { save("cart", []); }
  function cartLines() {
    return cart().map(i => ({ ...i, product: product(i.id) })).filter(l => l.product);
  }
  function cartCount() { return cart().reduce((s, i) => s + i.qty, 0); }

  // মোট হিসাব: সাবটোটাল, ছাড়, ডেলিভারি
  function totals(district, couponCode) {
    const lines = cartLines();
    const subtotal = lines.reduce((s, l) => s + l.product.price * l.qty, 0);
    const d = SHOP.delivery;
    let delivery = 0;
    if (lines.length && subtotal < d.freeAbove) delivery = district === "ঢাকা" ? d.insideDhaka : d.outsideDhaka;
    let discount = 0, couponError = "";
    const code = (couponCode || "").trim().toUpperCase();
    if (code) {
      const c = SHOP.coupons[code];
      if (!c) couponError = "কুপন কোডটি সঠিক নয়";
      else if (subtotal < c.min) couponError = "এই কুপনের জন্য কমপক্ষে " + money(c.min) + " এর কেনাকাটা করতে হবে";
      else discount = c.type === "percent" ? Math.round(subtotal * c.value / 100) : c.value;
    }
    return { lines, subtotal, delivery, discount, couponError, code: discount ? code : "", total: Math.max(0, subtotal - discount + delivery) };
  }

  // ---------- উইশলিস্ট ----------
  function wishlist() { return load("wishlist", []); }
  function toggleWish(id) {
    const w = wishlist();
    const i = w.indexOf(id);
    if (i >= 0) w.splice(i, 1); else w.push(id);
    save("wishlist", w);
    return i < 0;
  }

  // ---------- অর্ডার ----------
  const STATUSES = ["পেন্ডিং", "কনফার্মড", "শিপড", "ডেলিভারড", "বাতিল"];
  function orders() { return load("orders", []); }
  function placeOrder(info) {
    const t = totals(info.district, info.coupon);
    if (!t.lines.length) return null;
    const id = "CLE" + Date.now().toString().slice(-7);
    const order = {
      id, createdAt: Date.now(), status: "পেন্ডিং",
      customer: { name: info.name, phone: info.phone, email: info.email, district: info.district, address: info.address, note: info.note },
      payment: { method: info.payment, trxId: info.trxId || "" },
      items: t.lines.map(l => ({ id: l.id, name: l.product.name, price: l.product.price, qty: l.qty })),
      subtotal: t.subtotal, discount: t.discount, coupon: t.code, delivery: t.delivery, total: t.total,
      userEmail: (session() || {}).email || ""
    };
    // স্টক কমানো
    const list = products().map(p => {
      const l = t.lines.find(x => x.id === p.id);
      return l ? { ...p, stock: Math.max(0, p.stock - l.qty) } : p;
    });
    setProducts(list);
    save("orders", [order, ...orders()]);
    clearCart();
    return order;
  }
  function findOrder(id, phone) {
    const o = orders().find(o => o.id.toUpperCase() === String(id).trim().toUpperCase());
    if (!o) return null;
    if (phone && toEnDigits(o.customer.phone) !== toEnDigits(phone).replace(/\D/g, "")) return null;
    return o;
  }
  function setOrderStatus(id, status) {
    save("orders", orders().map(o => o.id === id ? { ...o, status } : o));
  }

  // ---------- সার্ভিস বুকিং ----------
  function bookings() { return load("bookings", []); }
  function addBooking(b) {
    const booking = { ...b, id: "SRV" + Date.now().toString().slice(-6), createdAt: Date.now(), status: "নতুন" };
    save("bookings", [booking, ...bookings()]);
    return booking;
  }
  function setBookingStatus(id, status) {
    save("bookings", bookings().map(b => b.id === id ? { ...b, status } : b));
  }

  // ---------- অ্যাকাউন্ট (ডেমো) ----------
  async function hash(s) {
    try {
      const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(s));
      return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, "0")).join("");
    } catch (e) { return btoa(unescape(encodeURIComponent(s))); }
  }
  function users() { return load("users", []); }
  function session() { return load("session", null); }
  async function register(name, email, phone, password) {
    email = email.trim().toLowerCase();
    if (users().some(u => u.email === email)) return "এই ইমেইল দিয়ে আগেই অ্যাকাউন্ট খোলা হয়েছে";
    save("users", [...users(), { name, email, phone, pass: await hash(password) }]);
    save("session", { name, email, phone });
    return "";
  }
  async function login(email, password) {
    email = email.trim().toLowerCase();
    const u = users().find(u => u.email === email);
    if (!u || u.pass !== await hash(password)) return "ইমেইল অথবা পাসওয়ার্ড ভুল";
    save("session", { name: u.name, email: u.email, phone: u.phone });
    return "";
  }
  function logout() { save("session", null); }

  window.Store = {
    bn, money, toEnDigits, fmtDate, STATUSES,
    products, product, setProducts, resetProducts,
    cart, cartLines, cartCount, addToCart, setQty, clearCart, totals,
    wishlist, toggleWish,
    orders, placeOrder, findOrder, setOrderStatus,
    bookings, addBooking, setBookingStatus,
    users, session, register, login, logout,
    load, save
  };
})();
