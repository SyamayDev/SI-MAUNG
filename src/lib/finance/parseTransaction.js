/**
 * Turns one spoken or typed Indonesian sentence into a transaction DRAFT.
 * Deterministic and offline — nothing leaves the device. The draft always
 * goes through a review step (or the explicit auto-save preference, which is
 * only allowed for drafts without issues); it is never saved blindly.
 * Amounts come from the shared Indonesian money parser; when it is unsure,
 * `draft.amount` stays empty and `choices` lists the readings to pick from.
 */
import { parseMoney } from "./indonesianMoneyParser.js";
import { detectCategory, detectType } from "./classify.js";
import { detectDate } from "./dates.js";
import { maskSpans, normalizeText } from "./text.js";
import { categoryLabel } from "./categories.js";

const FILLER_START = new Set([
  "tadi", "td", "barusan", "baru", "aku", "saya", "gue", "gw", "gua", "udah", "sudah", "abis", "habis",
  "nih", "eh", "oh", "jadi", "terus", "lalu", "hari", "ini", "catat", "catet", "tolong", "dong", "mau", "ingin",
  "yang", "itu", "pas", "habis", "ada",
]);
// Transaction verbs/labels: the type is shown separately, the description names the thing.
const LEAD_WORDS = new Set([
  "beli", "membeli", "beliin", "bayar", "membayar", "bayarin", "dapat", "dapet", "mendapat", "mendapatkan", "terima",
  "menerima", "nerima", "pengeluaran", "pemasukan", "pendapatan", "buat", "untuk", "dari", "ke", "di", "sama", "jajan",
]);
const FILLER_ANY = new Set([
  "rupiah", "rp", "idr", "perak", "sebesar", "seharga", "senilai", "sejumlah", "harganya", "harga", "total",
  "totalnya", "dong", "ya", "yah", "nih", "deh", "sih", "tolong", "catat", "catet", "catatkan", "an",
]);
const DANGLING_END = new Set(["dari", "untuk", "buat", "ke", "di", "pada", "dengan", "sama", "yang", "dan", "seharga", "sebesar", "tapi", "eh"]);
const KEEP_WHOLE = new Set(["gaji", "gajian"]); // "Gajian" is a description on its own

const QUESTION_RE = /\b(berapa|brp|gimana|bagaimana|apa saja|apa aja|apakah|kapan|rekap|ringkasan|laporan|sisa saldo|saldo|total pengeluaran|total pemasukan|kategori (apa|terbesar|paling)|rata rata|dibanding|berapa kali)\b/;
// "pengeluaran makan minggu ini" without an amount is a question about a period, not a new transaction.
const PERIOD_QUESTION_RE = /\b(bulan ini|bulan lalu|bulan kemarin|minggu ini|minggu lalu|pekan ini|pekan lalu|tahun ini|tahun lalu|selama ini|sejauh ini|total|terakhir|terbesar|termahal)\b/;
const SAVINGS_RE = /\b(nabung|menabung|tabung|tabungan|setor tabungan|celengan)\b/;

/** Build a short human description from what is left after amount/date are removed. */
export function buildDescription(normalized, spans) {
  const left = maskSpans(normalized, spans)
    .split(/\s+/)
    .filter((w) => w && !FILLER_ANY.has(w));
  const strip = () => {
    while (left.length > 1 && (FILLER_START.has(left[0]) || LEAD_WORDS.has(left[0])) && !KEEP_WHOLE.has(left[0])) left.shift();
  };
  strip();
  while (left.length && DANGLING_END.has(left[left.length - 1])) left.pop();
  strip();
  if (left.length === 1 && (FILLER_START.has(left[0]) || LEAD_WORDS.has(left[0]))) left.length = 0;
  const text = left.join(" ").replace(/\s+/g, " ").trim().slice(0, 120);
  return text ? text[0].toUpperCase() + text.slice(1) : "";
}

const COUNTERPARTY_ROLES = { di: "merchant", ke: "recipient", dari: "source" };

/** "beli kopi di kopi kenangan" → { role: "merchant", name: "Kopi kenangan" } */
export function detectCounterparty(normalized, spans) {
  const words = maskSpans(normalized, spans).split(/\s+/).filter(Boolean);
  for (let i = words.length - 2; i >= 0; i--) {
    const role = COUNTERPARTY_ROLES[words[i]];
    if (!role) continue;
    const name = words.slice(i + 1, i + 4).filter((w) => !FILLER_ANY.has(w) && !DANGLING_END.has(w)).join(" ");
    if (name.length >= 2 && !/^(sini|situ|sana|rumah|kantor|jalan)$/.test(name)) return { role, name: name[0].toUpperCase() + name.slice(1) };
  }
  return null;
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
 *   choices: number[],          // amounts the user must pick from when the amount is uncertain
 *   counterparty: { role, name } | null,
 *   source: "local"
 * }}
 */
export function parseTransactionText(input, { now = new Date() } = {}) {
  const text = String(input ?? "").trim();
  const normalized = normalizeText(text);
  const base = {
    input: text, draft: null, confidence: { type: 0, amount: 0, category: 0, date: 0 }, issues: [], choices: [], counterparty: null,
    source: "local",
  };
  if (!normalized) return { ...base, intent: "unknown" };

  const date = detectDate(normalized, now);
  const withoutDate = date.span ? maskSpans(normalized, [date.span]) : normalized;
  const money = parseMoney(withoutDate, { normalized: true });
  const hasAmount = money.value !== null || money.choices.length > 0;
  const type = detectType(normalized);
  const isQuestion = QUESTION_RE.test(normalized) || /\?\s*$/.test(text) || (!hasAmount && PERIOD_QUESTION_RE.test(normalized));

  if (isQuestion && (!hasAmount || !type.explicit)) return { ...base, intent: "question" };
  if (SAVINGS_RE.test(normalized) && !hasSpendingWord(normalized)) return { ...base, intent: "savings" };
  if (!hasAmount && !type.explicit) return { ...base, intent: "unknown" };

  let txType = type.type;
  let typeExplicit = type.explicit;
  if (money.negative && !type.explicit) {
    txType = "expense";
    typeExplicit = true;
  }

  const category = detectCategory(normalized, txType);
  const spans = [...money.spans, ...(date.span ? [date.span] : [])];
  const description = buildDescription(normalized, spans) || categoryLabel(category.category);

  const issues = [];
  if (!hasAmount) issues.push({ field: "amount", message: "Nominal tidak terdengar. Sebutkan misalnya “25 ribu”." });
  else if (money.ambiguous) issues.push({ field: "amount", message: money.note || "Nominal belum pasti — pilih salah satu." });
  else if (money.note) issues.push({ field: "amount", message: money.note });
  if (money.negative) issues.push({ field: "type", message: "Nominal disebut negatif — dicatat sebagai pengeluaran. Ubah bila keliru." });
  else if (!typeExplicit) {
    issues.push({
      field: "type",
      message: type.refund
        ? "Refund dicatat sebagai pemasukan (uang kembali ke kamu). Ubah ke pengeluaran bila kamu yang mengembalikan uang."
        : "Jenis transaksi tidak jelas — dianggap pengeluaran. Ubah bila ini pemasukan.",
    });
  }
  if (date.approximate) issues.push({ field: "transaction_date", message: "Tanggal diperkirakan — mohon periksa." });

  return {
    ...base,
    intent: "transaction",
    draft: {
      type: txType,
      amount: money.ambiguous ? null : money.value,
      category: category.category,
      description,
      transaction_date: date.date,
      notes: "",
    },
    confidence: { type: money.negative ? 0.7 : type.confidence, amount: money.confidence, category: category.confidence, date: date.confidence },
    issues,
    choices: money.ambiguous ? money.choices : [],
    counterparty: detectCounterparty(normalized, spans),
  };
}

function hasSpendingWord(normalized) {
  return /\b(beli|bayar|belanja|gaji|gajian|terima|dapat)\b/.test(normalized);
}

/** Only a draft with no open issues and high confidence may be auto-saved. */
export function isConfidentDraft(result) {
  if (!result || result.intent !== "transaction" || !result.draft || result.issues.length || result.choices?.length) return false;
  if (!Number.isSafeInteger(result.draft.amount) || result.draft.amount <= 0) return false;
  const c = result.confidence;
  return c.amount >= 0.9 && c.type >= 0.8;
}
