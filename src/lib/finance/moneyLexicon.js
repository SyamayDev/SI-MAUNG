/**
 * Indonesian money vocabulary — the ONE dictionary every amount reader uses
 * (voice notes, typed sentences, the assistant, AI cross-checks).
 *
 * All values are integers. Words are split by how sure we can be:
 *   - canonical words have one meaning everywhere and are read directly;
 *   - UNCERTAIN_ALIASES depend on region/context, so the parser never picks a
 *     value on its own — it offers the listed choices to the user.
 *
 * Sources for the slang: Hokkien-derived Jakarta money words as listed by
 * KBBI / detik.com / GNFI (gopek, goceng, ceban, goban, cepek ceng, cetiao,
 * gotiao …). Regional numbers: common Javanese and Sundanese money words.
 * To add a word, put it in the right table and add a test in money.test.js.
 */

/** Single digits (Indonesian + common Javanese/Sundanese forms used before "ewu"/"atus"/"puluh"). */
export const DIGIT_WORDS = {
  nol: 0, kosong: 0,
  satu: 1, dua: 2, tiga: 3, empat: 4, lima: 5, enam: 6, tujuh: 7, delapan: 8, sembilan: 9,
  // Javanese
  siji: 1, loro: 2, rong: 2, telu: 3, telung: 3, papat: 4, patang: 4, limang: 5, enem: 6, pitu: 7, pitung: 7,
  wolu: 8, wolung: 8, songo: 9, sanga: 9, sangang: 9,
  // Sundanese
  hiji: 1, tilu: 3, opat: 4, genep: 6, dalapan: 8, salapan: 9,
};

/** Words that are a whole small number by themselves. */
export const COMPOUND_WORDS = {
  sepuluh: 10, sebelas: 11, seratus: 100,
  limpul: 50, // gaul: short for "lima puluh" ("limpul ribu" = 50.000)
  // Javanese
  selawe: 25, seket: 50, sewidak: 60, satus: 100,
  // Sundanese
  sapuluh: 10, sabelas: 11, saratus: 100,
};

/** Multipliers applied to the digit just before them ("dua puluh", "lima ratus", "tiga belas"). */
export const MULTIPLIER_WORDS = { puluh: 10, ratus: 100, atus: 100 };
export const TEEN_WORD = "belas";

/** Scale words ("dua JUTA"). "m" is deliberately absent: it means meters as often as miliar. */
export const SCALE_WORDS = {
  ribu: 1_000, rebu: 1_000, rb: 1_000, rbu: 1_000, ewu: 1_000, k: 1_000, ceng: 1_000,
  juta: 1_000_000, jt: 1_000_000, jta: 1_000_000, yuta: 1_000_000, mio: 1_000_000, tiao: 1_000_000,
  miliar: 1_000_000_000, milyar: 1_000_000_000, triliun: 1_000_000_000_000,
};

/** "se-" scale words: one of the scale ("seribu", "sejuta"). */
export const SE_SCALE_WORDS = {
  seribu: 1_000, sewu: 1_000, sarebu: 1_000,
  sejuta: 1_000_000, sajuta: 1_000_000, sayuta: 1_000_000,
  semiliar: 1_000_000_000, semilyar: 1_000_000_000, setriliun: 1_000_000_000_000,
};

/** Fractions as [numerator, denominator]. "tiga perempat" is handled by QUARTER_WORD. */
export const FRACTION_WORDS = { setengah: [1, 2], separuh: [1, 2], separo: [1, 2], seperempat: [1, 4] };
export const QUARTER_WORD = "perempat";
export const DECIMAL_WORD = "koma";

/**
 * Unambiguous slang amounts (rupiah). A plain count before them multiplies:
 * "dua ceban" = 20.000, "3 goceng" = 15.000.
 */
export const CANONICAL_SLANG = {
  nopek: 200, gopek: 500,
  seceng: 1_000, ceceng: 1_000, noceng: 2_000, goceng: 5_000,
  ceban: 10_000, noban: 20_000, goban: 50_000,
  cetiao: 1_000_000, cetiau: 1_000_000, notiao: 2_000_000, gotiao: 5_000_000, gotiau: 5_000_000,
};

/**
 * Hokkien counts that combine with a scale word into an exact amount:
 * "cepek ceng" = 100.000, "gopek ceng" = 500.000, "cepek tiao" = 100.000.000.
 */
export const HOKKIEN_COUNTS = { cepek: 100, nopek: 200, gopek: 500, gocap: 50, jigo: 25 };

/**
 * Words whose meaning depends on who says them. Alone (without "ribu"/"ceng"
 * etc.) they always need confirmation; `choices` is ordered most likely first.
 */
export const UNCERTAIN_ALIASES = {
  cepek: { choices: [100, 100_000], note: "“cepek” bisa berarti Rp100 atau Rp100.000" },
  gocap: { choices: [50, 50_000], note: "“gocap” bisa berarti Rp50 atau Rp50.000" },
  jigo: { choices: [25, 25_000], note: "“jigo” bisa berarti Rp25 atau Rp25.000" },
  limpul: { choices: [50_000, 50], note: "“limpul” (lima puluh) tanpa satuan — Rp50.000 atau Rp50?" },
};

export const CURRENCY_BEFORE = new Set(["rp", "idr"]);
export const CURRENCY_AFTER = new Set(["rupiah", "perak", "idr"]);

/** A number followed by one of these is a quantity/time, not money. */
export const NOT_MONEY_AFTER = new Set([
  "hari", "minggu", "bulan", "tahun", "jam", "menit", "detik", "orang", "kali", "x", "porsi", "bungkus", "buah",
  "biji", "pcs", "kg", "kilo", "gram", "gr", "ons", "liter", "l", "ml", "gelas", "botol", "lembar", "pasang", "potong",
  "kotak", "dus", "pack", "lusin", "kodi", "persen", "km", "meter", "cm", "lantai", "unit", "item", "batang",
  "mangkok", "piring", "cup", "slice", "ekor", "sachet", "renteng", "karung", "tusuk",
]);
export const NOT_MONEY_BEFORE = new Set(["tanggal", "tgl", "jam", "pukul", "nomor", "no", "lantai", "kamar", "ke", "tahun", "umur", "usia"]);

/** Words that turn two amounts into an explicit calculation. */
export const OPERATOR_WORDS = {
  ditambah: "add", tambah: "add", plus: "add", ditambahin: "add",
  dikurangi: "sub", dikurang: "sub", minus: "sub",
  dikali: "mul", dikalikan: "mul", kali: "mul", x: "mul",
  dibagi: "div",
};

/**
 * "sekitar 50 ribu", "50 ribuan", "sejuta lebih" — an estimate, never a final
 * amount. (Two-word forms such as "kurang lebih" are matched as phrases.)
 */
export const APPROX_BEFORE = ["sekitar", "kira kira", "kira", "kurleb", "kisaran", "hampir", "kurang lebih", "lebih kurang", "kurang dari", "lebih dari"];
export const APPROX_AFTER = ["lebih", "kurang lebih", "an"];

/**
 * Correction phrases: the amount after the LAST one wins
 * ("20 ribu eh salah 25 ribu"). "bukan X tapi/melainkan Y" is matched as a pair.
 */
export const CORRECTION_MARKERS = ["eh salah", "salah ding", "salah maksudnya", "eh bukan", "ralat", "koreksi", "maksudnya", "maksud saya", "maksud aku", "maksudku"];
export const CORRECTION_PAIR = { first: "bukan", then: ["tapi", "tetapi", "melainkan"] };

/** Per-item price markers ("3 kopi masing-masing 20 ribu"). */
export const PER_ITEM_RE = /\b(masing masing|masing2|satunya|per (orang|porsi|biji|buah|item|pcs|bungkus|gelas|botol|kg|kilo|lembar|pasang|tiket|ekor))\b/;

/**
 * Safe speech-to-text repairs applied during normalisation: split syllables
 * ("se ribu", "go ceng") and spaced digit groups ("2 500 000").
 */
export const SPOKEN_FIXES = [
  [/\bse (ribu|ratus|puluh|belas|juta|tengah|perempat|ceng|ban|tiao)\b/g, "se$1"],
  [/\bce (ban|pek|ceng|tiao|tiau)\b/g, "ce$1"],
  [/\bgo (ban|ceng|pek|cap|tiao|tiau)\b/g, "go$1"],
  [/\bno (ban|ceng|pek|tiao)\b/g, "no$1"],
  [/\bji go\b/g, "jigo"],
  [/\b(stengah|setenga|stgh|setgh)\b/g, "setengah"],
  [/\b(sprempat|seprempat)\b/g, "seperempat"],
  // approximate forms: "ribuan", "jutaan", "lima puluhan" → "<word> an"
  [/\b(rebu|ribu|juta|jt|puluh|ratus|belas)an\b/g, "$1 an"],
  // spaced thousands: "2 500 000" → "2500000", "rp 25 000" → "rp 25000"
  [/\b(\d{1,3})((?: \d{3}){2,})\b/g, (_, a, b) => a + b.replace(/ /g, "")],
  [/\b(rp|idr) (\d{1,3})((?: \d{3})+)\b/g, (_, c, a, b) => `${c} ${a}${b.replace(/ /g, "")}`],
];

/** Words a speech engine sometimes glues together ("duapuluh", "seratusribu"). */
export const JOINABLE_WORDS = [
  ...Object.keys(DIGIT_WORDS).filter((w) => w.length >= 3 && w !== "rong"),
  ...Object.keys(COMPOUND_WORDS),
  ...Object.keys(MULTIPLIER_WORDS),
  TEEN_WORD,
  ...Object.keys(SCALE_WORDS).filter((w) => w.length >= 4),
  ...Object.keys(SE_SCALE_WORDS),
  ...Object.keys(FRACTION_WORDS),
  ...Object.keys(HOKKIEN_COUNTS),
  ...Object.keys(CANONICAL_SLANG),
];
