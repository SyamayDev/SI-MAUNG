/**
 * Transaction type and category detection by weighted keywords on whole words
 * (never substring `includes()`: "dibayar" must not match "bayar").
 */
import { CATEGORIES } from "./categories.js";
import { hasPhrase } from "./text.js";

const INCOME_WORDS = {
  pemasukan: 3, pendapatan: 3, gaji: 3, gajian: 3, thr: 3, terima: 2, menerima: 2, diterima: 2, nerima: 2,
  dapat: 2, dapet: 2, mendapat: 2, mendapatkan: 2, bonus: 2, honor: 2, upah: 2, komisi: 2, dividen: 2,
  cashback: 2, jual: 2, menjual: 2, terjual: 2, laku: 1, untung: 1, dikasih: 2, dikasi: 2,
  dikirimi: 2, diberi: 2, dibayar: 2, transferan: 2, freelance: 1, masuk: 1, lembur: 1, insentif: 2,
  hadiah: 1, warisan: 2, kembalian: 1,
};
const EXPENSE_WORDS = {
  pengeluaran: 3, beli: 2, membeli: 2, beliin: 2, belanja: 2, bayar: 2, membayar: 2, bayarin: 2, keluar: 1,
  habis: 1, jajan: 2, makan: 1, minum: 1, isi: 1, topup: 2, sewa: 2, cicilan: 2, nyicil: 2, traktir: 2,
  sedekah: 2, donasi: 2, infaq: 2, infak: 2, zakat: 2, servis: 1, service: 1, parkir: 1, ongkir: 1,
  langganan: 1, tagihan: 2, pulsa: 1, tiket: 1, nonton: 1, berobat: 1, ngasih: 2, kasih: 1, kirim: 1,
  iuran: 2, arisan: 1, spp: 2, ukt: 2, kos: 1, kost: 1, pesan: 1, order: 1, checkout: 2,
};
const INCOME_PHRASES = [
  ["uang masuk", 3], ["transfer masuk", 3], ["dana masuk", 3], ["masuk rekening", 2], ["transfer dari", 2],
  ["kiriman dari", 2], ["uang saku", 1],
];
const EXPENSE_PHRASES = [["uang keluar", 3], ["transfer keluar", 3], ["transfer ke", 2], ["kirim ke", 2], ["top up", 2], ["kirim uang", 2]];
// Phrases that contain money words but mean something else.
const NOISE = [/\bterima ?kasih\b/g, /\bmakasih\b/g, /\bmasuk angin\b/g, /\bkeluar rumah\b/g];

// Refunds: money coming back to the user is income; a refund the user pays out is an expense.
const REFUND_RE = /\b(refund|pengembalian dana|uang kembali|dana kembali)\b/;
const REFUND_OUT_RE = /\b(refund ke|kasih refund|beri refund|bayar refund|kirim refund|transfer refund|balikin uang|kembalikan uang|mengembalikan uang|ngembaliin uang)\b/;
const REFUND_IN_RE = /\b((dapat|dapet|terima|nerima|menerima) (uang )?refund|refund (masuk|cair|diterima|balik)|uang kembali|dana kembali)\b/;

function score(normalized, words, phrases) {
  let total = 0;
  const matched = [];
  for (const token of normalized.split(" ")) {
    if (words[token]) {
      total += words[token];
      matched.push(token);
    }
  }
  for (const [phrase, w] of phrases) {
    if (hasPhrase(normalized, phrase)) {
      total += w;
      matched.push(phrase);
    }
  }
  return { total, matched };
}

/** @returns {{ type: "income"|"expense", confidence: number, explicit: boolean, matched: string[], refund?: boolean }} */
export function detectType(normalized) {
  let text = normalized;
  for (const re of NOISE) text = text.replace(re, " ");

  if (REFUND_RE.test(text)) {
    if (REFUND_OUT_RE.test(text)) return { type: "expense", confidence: 0.85, explicit: true, matched: ["refund"], refund: true };
    if (REFUND_IN_RE.test(text)) return { type: "income", confidence: 0.85, explicit: true, matched: ["refund"], refund: true };
    // "refund pembelian 50 ribu": most likely money back, but the user confirms the direction
    return { type: "income", confidence: 0.6, explicit: false, matched: ["refund"], refund: true };
  }
  const income = score(text, INCOME_WORDS, INCOME_PHRASES);
  const expense = score(text, EXPENSE_WORDS, EXPENSE_PHRASES);

  if (income.total === 0 && expense.total === 0) {
    return { type: "expense", confidence: 0.4, explicit: false, matched: [] };
  }
  if (income.total === expense.total) {
    return { type: "expense", confidence: 0.45, explicit: false, matched: [...income.matched, ...expense.matched] };
  }
  const isIncome = income.total > expense.total;
  const diff = Math.abs(income.total - expense.total);
  return {
    type: isIncome ? "income" : "expense",
    confidence: Math.min(0.97, 0.7 + diff * 0.1),
    explicit: true,
    matched: isIncome ? income.matched : expense.matched,
  };
}

/** @returns {{ category: string, confidence: number, matched: string[] }} */
export function detectCategory(normalized, type) {
  let best = { category: "other", total: 0, matched: [] };
  for (const cat of CATEGORIES) {
    if (type && !cat.kinds.includes(type)) continue;
    let total = 0;
    const matched = [];
    for (const [phrase, weight] of cat.keywords) {
      if (hasPhrase(normalized, phrase)) {
        total += weight;
        matched.push(phrase);
      }
    }
    if (total > best.total) best = { category: cat.value, total, matched };
  }
  const confidence = best.total >= 2 ? 0.85 : best.total === 1 ? 0.6 : 0.4;
  return { category: best.category, confidence, matched: best.matched };
}
