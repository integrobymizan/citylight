# সিটি লাইটিং অ্যান্ড ইলেকট্রিক — অনলাইন শপ

**City Lighting & Electric** — ইনস্টলেশন • রিপেয়ার • এনার্জি সলিউশন

সম্পূর্ণ বাংলা ভাষার ই-কমার্স ওয়েবসাইট: লাইট, ফ্যান, সুইচ, ক্যাবল, সার্কিট ব্রেকার ও সোলার পণ্য বিক্রি এবং ইলেকট্রিশিয়ান সার্ভিস বুকিং।

শুধু HTML, CSS ও JavaScript দিয়ে তৈরি — কোনো বিল্ড স্টেপ বা সার্ভার লাগে না।

## ফিচারসমূহ

- **হোম পেজ:** হিরো ব্যানার, ক্যাটাগরি, আজকের অফার, জনপ্রিয় পণ্য
- **শপ:** সার্চ, ক্যাটাগরি ফিল্টার, দামের রেঞ্জ, স্টক/অফার ফিল্টার, সর্টিং
- **প্রোডাক্ট পেজ:** দাম, ছাড়, স্টক, বৈশিষ্ট্য, পরিমাণ, "এখনই কিনুন", সম্পর্কিত পণ্য
- **কার্ট:** পরিমাণ পরিবর্তন, কুপন কোড, ফ্রি ডেলিভারি প্রগ্রেস বার
- **চেকআউট:** ৬৪ জেলা, ঢাকা/ঢাকার বাইরে ডেলিভারি চার্জ, বাংলাদেশি মোবাইল নম্বর যাচাই, ক্যাশ অন ডেলিভারি / বিকাশ / নগদ / রকেট (TrxID সহ)
- **অর্ডার:** অর্ডার নম্বর, রসিদ প্রিন্ট, অর্ডার ট্র্যাকিং (অর্ডার নম্বর + মোবাইল দিয়ে)
- **ইলেকট্রিশিয়ান সার্ভিস:** ইনস্টলেশন, ওয়্যারিং, রিপেয়ার ও সোলার সার্ভিস বুকিং
- **কাস্টমার অ্যাকাউন্ট:** রেজিস্ট্রেশন, লগইন, নিজের অর্ডারের তালিকা
- **উইশলিস্ট**, যোগাযোগ ফর্ম, রিটার্ন ও ওয়ারেন্টি নীতি
- **অ্যাডমিন প্যানেল** (`#/admin`, ডেমো পিন `1234`): বিক্রির হিসাব, অর্ডারের স্ট্যাটাস, পণ্য যোগ/এডিট/ডিলিট, স্টক, সার্ভিস বুকিং, মেসেজ
- মোবাইল-ফ্রেন্ডলি ডিজাইন, বাংলা সংখ্যা ও ৳ ফরম্যাট

## চালানো

`index.html` ব্রাউজারে খুলুন, অথবা:

```sh
python3 -m http.server 8080
# তারপর http://localhost:8080
```

GitHub Pages, Netlify বা যেকোনো সাধারণ হোস্টিংয়ে ফোল্ডারটি আপলোড করলেই চলবে।

## কোথায় কী পরিবর্তন করবেন

| কী বদলাবেন | ফাইল |
|---|---|
| দোকানের নাম, ফোন, ঠিকানা, ডেলিভারি চার্জ, বিকাশ/নগদ নম্বর, কুপন, অ্যাডমিন পিন, সার্ভিস | `assets/js/config.js` |
| পণ্য ও ক্যাটাগরি | `assets/js/products.js` (অথবা অ্যাডমিন প্যানেল থেকে) |
| রঙ ও ডিজাইন | `assets/css/style.css` (ফাইলের শুরুতে রঙের টোকেন) |
| লোগো | ছবিটি `assets/img/logo.png` এ রেখে `config.js` এ `logo: "assets/img/logo.png"` লিখুন |
| পণ্যের ছবি | `products.js` এ প্রতিটি পণ্যে `image: "assets/img/bulb.jpg"` যোগ করুন |

## গুরুত্বপূর্ণ: লাইভ করার আগে

এই সংস্করণে অর্ডার, অ্যাকাউন্ট ও পণ্যের পরিবর্তন **ব্রাউজারের localStorage এ** সংরক্ষিত হয়। অর্থাৎ কাস্টমারের অর্ডার শুধু তার নিজের ব্রাউজারে থাকে, দোকানের অ্যাডমিন সেটা দেখতে পাবে না। আসল ব্যবসা চালাতে যা লাগবে:

1. **ব্যাকএন্ড ও ডেটাবেস** (যেমন Supabase, Firebase বা Laravel/Node সার্ভার): অর্ডার, পণ্য, ইউজার ও বুকিং সেখানে সংরক্ষণ করতে হবে। `assets/js/store.js` এর ফাংশনগুলো API কলে বদলালেই হবে, বাকি সাইট একই থাকবে।
2. **আসল অ্যাডমিন লগইন:** বর্তমান পিন শুধু ডেমোর জন্য।
3. **অনলাইন পেমেন্ট গেটওয়ে** (SSLCommerz, bKash Checkout API, ShurjoPay ইত্যাদি) যদি অটোমেটিক পেমেন্ট চান।
4. **অর্ডার নোটিফিকেশন:** নতুন অর্ডারে SMS/ইমেইল।

---

# City Lighting & Electric — online shop (English summary)

A Bangla-language ecommerce site for a lighting and electrical shop, with electrician service booking. Plain HTML/CSS/JS, no build step.

It includes a storefront with search, filters and sorting; product pages; a cart with coupons; and checkout with Bangladesh districts, delivery charges, and Cash on Delivery, bKash, Nagad or Rocket (TrxID). It also has order tracking, customer accounts, a wishlist, service booking and a demo admin panel at `#/admin` (PIN `1234`).

All data is stored in the browser's `localStorage`, so this version is a working front end and demo. Before taking real orders, swap `assets/js/store.js` for calls to a real backend.
