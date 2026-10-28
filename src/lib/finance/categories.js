/**
 * Transaction categories. `value` is what is stored in the database and must
 * stay stable; `label` and `color` are presentation only.
 * `kinds` lists the transaction types a category makes sense for.
 * `keywords`: [phrase, weight] — multi-word phrases should outweigh the
 * single words they contain (e.g. "air mineral" vs "air").
 */
export const CATEGORIES = [
  {
    value: "food",
    label: "Makanan & Minuman",
    color: "#E8930C",
    kinds: ["expense"],
    keywords: [
      ["air mineral", 3], ["es teh", 3], ["nasi goreng", 3], ["makan siang", 3], ["makan malam", 3],
      ["makan", 2], ["makanan", 2], ["nasi", 2], ["mie", 2], ["mi", 1], ["bakso", 2], ["soto", 2], ["sate", 2],
      ["ayam", 2], ["bebek", 2], ["ikan", 1], ["kopi", 2], ["teh", 2], ["susu", 1], ["jus", 2], ["es", 1],
      ["minum", 2], ["minuman", 2], ["snack", 2], ["cemilan", 2], ["camilan", 2], ["jajan", 2], ["sarapan", 2],
      ["gorengan", 2], ["roti", 2], ["kue", 2], ["martabak", 2], ["pizza", 2], ["burger", 2], ["seblak", 2],
      ["warteg", 2], ["padang", 1], ["restoran", 2], ["resto", 2], ["kafe", 2], ["cafe", 2], ["boba", 2],
      ["gofood", 3], ["grabfood", 3], ["shopeefood", 3], ["katering", 2], ["galon", 2], ["sayur", 2],
      ["sembako", 2], ["beras", 2], ["telur", 2], ["buah", 1], ["lauk", 2], ["indomie", 2], ["aqua", 2],
    ],
  },
  {
    value: "transportation",
    label: "Transportasi",
    color: "#3B6FD8",
    kinds: ["expense"],
    keywords: [
      ["isi bensin", 3], ["servis motor", 3], ["servis mobil", 3], ["cuci motor", 3], ["cuci mobil", 3],
      ["tiket kereta", 3], ["tiket pesawat", 3], ["bensin", 2], ["bbm", 2], ["pertalite", 3], ["pertamax", 3],
      ["solar", 1], ["ojek", 2], ["ojol", 2], ["gojek", 2], ["goride", 3], ["grab", 1], ["gocar", 3], ["grabcar", 3],
      ["maxim", 2], ["angkot", 2], ["bus", 2], ["busway", 2], ["transjakarta", 3], ["kereta", 2], ["krl", 3],
      ["mrt", 3], ["lrt", 3], ["tol", 2], ["parkir", 2], ["taksi", 2], ["taxi", 2], ["travel", 1],
      ["pesawat", 2], ["oli", 2], ["ban", 1], ["bengkel", 2],
    ],
  },
  {
    value: "shopping",
    label: "Belanja",
    color: "#B4488F",
    kinds: ["expense"],
    keywords: [
      ["tiktok shop", 3], ["belanja", 2], ["baju", 2], ["kaos", 2], ["celana", 2], ["sepatu", 2], ["sandal", 2],
      ["tas", 1], ["jaket", 2], ["kemeja", 2], ["hijab", 2], ["jilbab", 2], ["shopee", 2], ["tokopedia", 3],
      ["lazada", 3], ["blibli", 3], ["indomaret", 2], ["alfamart", 2], ["supermarket", 2], ["minimarket", 2],
      ["mall", 1], ["sabun", 2], ["sampo", 2], ["shampo", 2], ["skincare", 2], ["kosmetik", 2], ["parfum", 2],
      ["deterjen", 2], ["perabot", 2], ["elektronik", 2], ["headset", 2], ["charger", 2], ["laptop", 2],
      ["handphone", 2], ["smartphone", 2], ["gadget", 2], ["komputer", 2], ["printer", 2], ["earphone", 2],
    ],
  },
  {
    value: "bills",
    label: "Tagihan & Langganan",
    color: "#6450C8",
    kinds: ["expense"],
    keywords: [
      ["token listrik", 3], ["paket data", 3], ["bayar kos", 3], ["listrik", 3], ["pln", 3], ["token", 1],
      ["air", 1], ["pdam", 3], ["internet", 2], ["wifi", 2], ["indihome", 3], ["pulsa", 2], ["kuota", 2],
      ["tagihan", 2], ["cicilan", 2], ["kredit", 1], ["sewa", 2], ["kos", 2], ["kost", 2], ["kontrakan", 2],
      ["bpjs", 3], ["asuransi", 2], ["pajak", 2], ["iuran", 2], ["langganan", 2], ["netflix", 3], ["spotify", 3],
      ["youtube premium", 3], ["disney", 2], ["icloud", 3], ["gas", 1], ["elpiji", 3], ["lpg", 3],
    ],
  },
  {
    value: "entertainment",
    label: "Hiburan",
    color: "#D9622B",
    kinds: ["expense"],
    keywords: [
      ["top up game", 3], ["nonton", 2], ["bioskop", 3], ["film", 2], ["game", 2], ["steam", 2], ["konser", 3],
      ["liburan", 2], ["wisata", 2], ["karaoke", 3], ["hiburan", 2], ["rekreasi", 2], ["hotel", 2],
      ["staycation", 3], ["main", 1],
    ],
  },
  {
    value: "health",
    label: "Kesehatan",
    color: "#1E9C82",
    kinds: ["expense"],
    keywords: [
      ["rumah sakit", 3], ["cek darah", 3], ["obat", 2], ["apotek", 3], ["dokter", 2], ["klinik", 2],
      ["berobat", 3], ["vitamin", 2], ["periksa", 1], ["gigi", 1], ["puskesmas", 3], ["masker", 1],
    ],
  },
  {
    value: "education",
    label: "Pendidikan",
    color: "#3F8F3A",
    kinds: ["expense"],
    keywords: [
      ["alat tulis", 3], ["buku", 2], ["sekolah", 2], ["kuliah", 2], ["spp", 3], ["ukt", 3], ["kursus", 2],
      ["les", 2], ["pendidikan", 2], ["atk", 2], ["fotokopi", 2], ["print", 1], ["seminar", 2],
      ["pelatihan", 2], ["kelas", 1], ["bimbel", 3], ["skripsi", 2],
    ],
  },
  {
    value: "family",
    label: "Keluarga",
    color: "#8A5A3B",
    kinds: ["expense", "income"],
    keywords: [
      ["orang tua", 3], ["uang saku", 2], ["keluarga", 2], ["ibu", 2], ["bapak", 2], ["ayah", 2], ["mama", 2],
      ["papa", 2], ["anak", 2], ["istri", 2], ["suami", 2], ["adik", 2], ["kakak", 2], ["ortu", 2], ["nenek", 2],
      ["kakek", 2], ["mertua", 2], ["ponakan", 2], ["arisan", 1],
    ],
  },
  {
    value: "salary",
    label: "Gaji & Honor",
    color: "#0F8A6E",
    kinds: ["income"],
    keywords: [
      ["gaji", 3], ["gajian", 3], ["upah", 3], ["honor", 3], ["thr", 3], ["bonus", 2], ["lembur", 2],
      ["insentif", 2], ["freelance", 3], ["proyek", 2], ["project", 2], ["komisi", 2], ["fee", 2], ["tunjangan", 2],
    ],
  },
  {
    value: "gift",
    label: "Hadiah & Donasi",
    color: "#C59A00",
    kinds: ["expense", "income"],
    keywords: [
      ["hadiah", 2], ["kado", 2], ["angpao", 3], ["angpau", 3], ["sumbangan", 2], ["sedekah", 3], ["donasi", 3],
      ["zakat", 3], ["infaq", 3], ["infak", 3], ["kondangan", 3], ["amplop", 2], ["warisan", 2],
    ],
  },
  {
    value: "other",
    label: "Lainnya",
    color: "#7D8499",
    kinds: ["expense", "income"],
    keywords: [],
  },
];

export const CATEGORY_VALUES = CATEGORIES.map((c) => c.value);

const BY_VALUE = new Map(CATEGORIES.map((c) => [c.value, c]));

export function getCategory(value) {
  return BY_VALUE.get(String(value || "").toLowerCase()) || BY_VALUE.get("other");
}

export const categoryLabel = (value) => getCategory(value).label;
export const categoryColor = (value) => getCategory(value).color;

/** Categories offered for a transaction type (form selects). */
export function categoriesFor(type) {
  return CATEGORIES.filter((c) => !type || c.kinds.includes(type));
}

export const TRANSACTION_TYPES = [
  { value: "expense", label: "Pengeluaran" },
  { value: "income", label: "Pemasukan" },
];

export const typeLabel = (type) => (type === "income" ? "Pemasukan" : "Pengeluaran");
