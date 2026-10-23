// দোকানের সাধারণ সেটিংস — এখানে পরিবর্তন করলেই পুরো সাইটে বদলে যাবে
window.SHOP = {
  name: "সিটি লাইটিং অ্যান্ড ইলেকট্রিক",
  nameEn: "City Lighting & Electric",
  tagline: "লাইট, ফ্যান, সুইচ, ক্যাবল ও সব ধরনের ইলেকট্রিক্যাল পণ্য — সারা বাংলাদেশে হোম ডেলিভারি",
  phone: "০১৭০০-০০০০০০",
  email: "support@citylight.com.bd",
  address: "বাড়ি ১২, রোড ৫, ধানমন্ডি, ঢাকা ১২০৫",
  hours: "প্রতিদিন সকাল ১০টা – রাত ১০টা",
  // নিজের লোগো ব্যবহার করতে ফাইলটি assets/img/logo.png এ রেখে নিচে "assets/img/logo.png" লিখুন
  logo: "",

  // ইলেকট্রিশিয়ান সার্ভিস (ইনস্টলেশন • রিপেয়ার • এনার্জি সলিউশন)
  services: [
    { id: "install", icon: "🛠️", name: "ইনস্টলেশন", price: "৳৩০০ থেকে", desc: "লাইট, ফ্যান, ঝাড়বাতি, সুইচ বোর্ড ও ডিবি বক্স লাগানো" },
    { id: "wiring", icon: "🧰", name: "হাউস ওয়্যারিং", price: "সার্ভে ফ্রি", desc: "নতুন বাসা, অফিস বা দোকানের সম্পূর্ণ ওয়্যারিং ও রি-ওয়্যারিং" },
    { id: "repair", icon: "🔧", name: "রিপেয়ার ও মেইনটেন্যান্স", price: "৳৪০০ থেকে", desc: "শর্ট সার্কিট, লাইন ফল্ট, ফ্যান ও লাইট মেরামত" },
    { id: "energy", icon: "☀️", name: "এনার্জি সলিউশন", price: "সার্ভে ফ্রি", desc: "সোলার সিস্টেম, আইপিএস ও বিদ্যুৎ সাশ্রয়ী এলইডি আপগ্রেড" }
  ],

  // ডেলিভারি চার্জ (টাকা)
  delivery: { insideDhaka: 60, outsideDhaka: 120, freeAbove: 3000 },

  // পেমেন্ট মাধ্যম; number থাকলে কাস্টমারকে Send Money নম্বর ও TrxID দিতে হবে
  payments: [
    { id: "cod", name: "ক্যাশ অন ডেলিভারি", note: "পণ্য হাতে পেয়ে টাকা দিন" },
    { id: "bkash", name: "বিকাশ", number: "০১৭০০-০০০০০০", note: "Send Money করে TrxID দিন" },
    { id: "nagad", name: "নগদ", number: "০১৭০০-০০০০০০", note: "Send Money করে TrxID দিন" },
    { id: "rocket", name: "রকেট", number: "০১৭০০-০০০০০০", note: "Send Money করে TrxID দিন" }
  ],

  // কুপন কোড: type "percent" অথবা "flat"
  coupons: {
    WELCOME10: { type: "percent", value: 10, min: 500, label: "১০% ছাড়" },
    EID200: { type: "flat", value: 200, min: 2000, label: "৳২০০ ছাড়" }
  },

  // অ্যাডমিন প্যানেলের পিন (ডেমো) — লাইভ সাইটে অবশ্যই সার্ভার-সাইড লগইন ব্যবহার করুন
  adminPin: "1234",

  social: { facebook: "#", youtube: "#", instagram: "#" }
};
