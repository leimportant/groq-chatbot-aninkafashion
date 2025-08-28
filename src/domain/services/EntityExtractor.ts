/**
 * EntityExtractor.ts
 * Service for extracting entities from user messages
 */

export interface ExtractedEntities {
  product_name?: string;
  product_keywords?: string[];
  color?: string;
  size?: string;
  category?: string;
  order_id?: string;
  order_keywords?: string[];
  user_status?: boolean;
  user_id?: string;
  menu_query?: boolean;
  order_action?: "cancel" | "return" | "refund";
  general_faq?: boolean;
}

// Warna umum dalam bahasa Indonesia & Inggris
const COLOR_KEYWORDS = [
  'merah','biru','hijau','kuning','hitam','putih','abu','abu-abu',
  'coklat','ungu','pink','oren','oranye','emas','silver',
  'red','blue','green','yellow','black','white','grey','gray',
  'brown','purple','pink','orange','gold','silver'
];

// Ukuran umum
const SIZE_KEYWORDS = [
  's','m','l','xl','xxl','xxxl',
  'all size','all-size','allsz','jumbo','standar','standard',
  '28','29','30','31','32','33','34','35','36','37','38','39','40',
  '41','42','43','44','45'
];

// Product-related keywords
const PRODUCT_KEYWORDS = [
  "produk","barang","twill","manohara","standard","std","bahan","item","baju","pakaian",
  "dress","kemeja","celana","rok","jaket","sweater","kaos","t-shirt","jeans",
  "sepatu","shoes","sandal","tas","bag","aksesoris","accessories","topi","hat",
  "kacamata","glasses","jam tangan","watch","perhiasan","jewelry","gelang","bracelet",
  "kalung","necklace","cincin","ring","anting","earrings","syal","scarf","belt","ikat pinggang",
  "dompet","wallet","cari","search","find","temukan","rekomendasi","recommendation"
];

// Order-related keywords
const ORDER_KEYWORDS = [
  "order","pesanan","pembelian","purchase","tracking","lacak","status",
  "pengiriman","delivery","shipment","resi","receipt","invoice","faktur",
  "pembayaran","payment","konfirmasi","confirmation","return","pengembalian",
  "refund","cancel","batal","complain","komplain","keluhan","nomor order",
  "order number","id pesanan","order id","cek pesanan","check order"
];

// Category mapping: keyword → category
const CATEGORY_KEYWORDS: Record<string, string> = {
  // Fashion umum
  "dress": "gamis",
  "gaun": "gamis",

  // masukan ke category setelan
  "atasan": "setelan",
  "blouse": "setelan",
  "kemeja": "shirt",

  "baju": "tops",
  "pakaian": "setelan",
  "celana": "setelan",
  "jeans": "setelan",

  "rok": "setelan",
  "jaket": "setelan",
  "sweater": "setelan",
  "kaos": "setelan",
  "t-shirt": "setelan",
  
  // Fashion lokal / muslim
  "daster": "daster",
  "gamis": "gamis",
  "setelan": "setelan",
  
  // Aksesoris & lainnya
  "sepatu": "shoes",
  "shoes": "shoes",
  "sandal": "shoes",
  "tas": "bag",
  "bag": "bag",
  "topi": "hat",
  "hat": "hat",
  "dompet": "wallet"
};


// User-related keywords
const USER_STATUS_KEYWORDS = [
  "status saya","status user","akun saya","membership","keanggotaan",
  "user status","my account","profil saya"
];

// Menu / feature keywords
const MENU_KEYWORDS = [
  "menu","fitur","layanan","akses","apa saja yang bisa",
  "apa yang tersedia","what can i access","available menu","options"
];

// General FAQ keywords
const GENERAL_FAQ_KEYWORDS = [
  "ini web apa","tentang","apa itu","siapa","company",
  "perusahaan","brand","official","resmi","apa fungsi","apa gunanya"
];

/**
 * Extract entities from a user message
 */
export const extractEntities = (message: string): ExtractedEntities => {
  const lowercaseMessage = message.toLowerCase();
  const entities: ExtractedEntities = {};

  // ===== Category =====
  for (const [kw, cat] of Object.entries(CATEGORY_KEYWORDS)) {
    if (lowercaseMessage.includes(kw)) {
      entities.category = cat;
      break;
    }
  }

  // Default fallback kategori kalau tidak ketemu
  if (!entities.category && (entities.product_keywords || entities.product_name)) {
    entities.category = "gamis"; 
  }


  // ===== Product Keywords =====
  const productMatches = PRODUCT_KEYWORDS.filter((kw) =>
    lowercaseMessage.includes(kw)
  );
  if (productMatches.length > 0) {
    entities.product_keywords = productMatches;
    // anggap product_name = kata produk pertama yg ditemukan
    entities.product_name = productMatches[0];
  }

  // ===== Order Keywords =====
  const orderMatches = ORDER_KEYWORDS.filter((kw) =>
    lowercaseMessage.includes(kw)
  );
  if (orderMatches.length > 0) {
    entities.order_keywords = orderMatches;
  }

  // ===== Order ID =====
  const orderIdRegex =
    /(?:order|pesanan|tracking|lacak|status|nomor|number|id)\s*[#:]?\s*(\d+)/i;
  const orderIdMatch = lowercaseMessage.match(orderIdRegex);
  if (orderIdMatch && orderIdMatch[1]) {
    entities.order_id = orderIdMatch[1];
  }

  // ===== Order Actions =====
  if (lowercaseMessage.includes("cancel") || lowercaseMessage.includes("batal")) {
    entities.order_action = "cancel";
  } else if (
    lowercaseMessage.includes("return") ||
    lowercaseMessage.includes("pengembalian")
  ) {
    entities.order_action = "return";
  } else if (lowercaseMessage.includes("refund")) {
    entities.order_action = "refund";
  }

  // ===== Color =====
  const colorMatch = COLOR_KEYWORDS.find((c) => lowercaseMessage.includes(c));
  if (colorMatch) {
    entities.color = colorMatch;
  }

  // ===== Size =====
  const sizeMatch = SIZE_KEYWORDS.find((s) => {
    const regex = new RegExp(`\\b${s}\\b`, "i");
    return regex.test(lowercaseMessage);
  });
  if (sizeMatch) {
    entities.size = sizeMatch;
  }

  // ===== User Status =====
  if (USER_STATUS_KEYWORDS.some((kw) => lowercaseMessage.includes(kw))) {
    entities.user_status = true;
  }
  
  // ===== User ID =====
  const userIdRegex = /(?:user|pengguna|member|anggota|akun|account)\s*[#:]?\s*(\d+)/i;
  const userIdMatch = lowercaseMessage.match(userIdRegex);
  if (userIdMatch && userIdMatch[1]) {
    entities.user_id = userIdMatch[1];
  }

  // ===== Menu Query =====
  if (MENU_KEYWORDS.some((kw) => lowercaseMessage.includes(kw))) {
    entities.menu_query = true;
  }

  // ===== General FAQ =====
  if (GENERAL_FAQ_KEYWORDS.some((kw) => lowercaseMessage.includes(kw))) {
    entities.general_faq = true;
  }

  return entities;
};
