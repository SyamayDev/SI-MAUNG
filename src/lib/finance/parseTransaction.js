/**
 * Turns one spoken or typed Indonesian sentence into a transaction DRAFT.
 * Deterministic and offline — nothing leaves the device. The draft always
 * goes through a review step (or the explicit auto-save preference, which is
 * only allowed for drafts without issues); it is never saved blindly.
 */
import { parseAmount } from "./amount.js";
import { detectCategory, detectType } from "./classify.js";
import { detectDate } from "./dates.js";
import { maskSpans, normalizeText } from "./text.js";
import { categoryLabel } from "./categories.js";

const FILLER_START = new Set([
  "tadi", "td", "barusan", "baru", "aku", "saya", "gue", "gw", "gua", "aku", "udah", "sudah", "abis", "habis",
  "nih", "eh", "oh", "jadi", "terus", "lalu", "hari", "ini", "catat", "tolong", "dong", "mau", "ingin",
]);
const FILLER_ANY = new Set([
  "rupiah", "rp", "idr", "perak", "sebesar", "seharga", "senilai", "sejumlah", "harganya", "harga", "total",
  "totalnya", "dong", "ya", "yah", "nih", "deh", "sih", "tolong", "catat", "catet", "catatkan",
]);
const DANGLING_END = new Set(["dari", "untuk", "buat", "ke", "di", "pada", "dengan", "sama", "yang", "dan", "seharga", "sebesar"]);

const QUESTION_RE = /\b(berapa|brp|gimana|bagaimana|apa saja|apa aja|rekap|ringkasan|laporan|sisa saldo|saldo|total pengeluaran|total pemasukan|kategori (apa|terbesar|paling))\b|\?$/;
const SAVINGS_RE = /\b(nabung|menabung|tabung|tabungan|setor tabungan|celengan)\b/;

/** Build a short human description from what is left after amount/date are removed. */
export function buildDescription(normalized, spans) {
  const left = maskSpans(normalized, spans)
    .split(/\s+/)
    .filter((w) => w && !FILLER_ANY.has(w));
  while (left.length && FILLER_START.has(left[0])) left.shift();
  while (left.length && DANGLING_END.has(left[left.length - 1])) left.pop();
  const text = left.join(" ").replace(/\s+/g, " ").trim().slice(0, 120);
  return text ? text[0].toUpperCase() + text.slice(1) : "";
}

/**
 * @param {string} input
 * @param {{ now?: Date }} options
 * @returns {{
 *   intent: "transaction"|"question"|"savings"|"unknown",
 *   input: string,
 *   draft: { type, amount, category, description, transaction_date, notes } | null,
 *   confidence: { type: number, amount: number, category: number, date: number },
 *   issues: Array<{ field: string, message: string }>,
 *   suggestion: number|null,
 *   source: "local"
 * }}
 */
export function parseTransactionText(input, { now = new Date() } = {}) {
  const text = String(input ?? "").trim();
  const normalized = normalizeText(text);
  const base = { input: text, draft: null, confidence: { type: 0, amount: 0, category: 0, date: 0 }, issues: [], suggestion: null, source: "local" };
  if (!normalized) return { ...base, intent: "unknown" };

  const date = detectDate(normalized, now);
  const withoutDate = date.span ? maskSpans(normalized, [date.span]) : normalized;
  const amount = parseAmount(withoutDate);
  const type = detectType(normalized);
  const isQuestion = QUESTION_RE.test(normalized);

  if (isQuestion && (amount.value === null || !type.explicit)) return { ...base, intent: "question" };
  if (SAVINGS_RE.test(normalized) && !hasSpendingWord(normalized)) return { ...base, intent: "savings" };
  if (amount.value === null && !type.explicit) return { ...base, intent: "unknown" };

  const category = detectCategory(normalized, type.type);
  const spans = [...amount.spans, ...(date.span ? [date.span] : [])];
  const description = buildDescription(normalized, spans) || categoryLabel(category.category);

  const issues = [];
  if (amount.value === null) issues.push({ field: "amount", message: "Nominal tidak terdengar. Sebutkan misalnya “25 ribu”." });
  else if (amount.ambiguous) issues.push({ field: "amount", message: amount.note });
  if (!type.explicit) {
    issues.push({ field: "type", message: "Jenis transaksi tidak jelas — dianggap pengeluaran. Ubah bila ini pemasukan." });
  }
  if (date.approximate) issues.push({ field: "transaction_date", message: "Tanggal diperkirakan — mohon periksa." });

  return {
    ...base,
    intent: "transaction",
    draft: {
      type: type.type,
      amount: amount.value,
      category: category.category,
      description,
      transaction_date: date.date,
      notes: "",
    },
    confidence: { type: type.confidence, amount: amount.confidence, category: category.confidence, date: date.confidence },
    issues,
    suggestion: amount.suggestion,
  };
}

function hasSpendingWord(normalized) {
  return /\b(beli|bayar|belanja|gaji|gajian|terima|dapat)\b/.test(normalized);
}

/** Only a draft with no open issues and high confidence may be auto-saved. */
export function isConfidentDraft(result) {
  if (!result || result.intent !== "transaction" || !result.draft || result.issues.length) return false;
  const c = result.confidence;
  return c.amount >= 0.9 && c.type >= 0.8;
}
