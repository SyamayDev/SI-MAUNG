/**
 * Rupiah amount extraction from Indonesian text — digits ("25.000", "1,5 jt",
 * "Rp45rb", "100k") and spoken number words ("seratus dua puluh lima ribu",
 * "satu setengah juta", "sejuta dua ratus ribu").
 *
 * The result says how sure it is. A bare number without a unit or "Rp"
 * ("beli kopi 25") is reported as ambiguous instead of guessed, so the UI can
 * ask the user to confirm before anything is saved.
 */
import { tokenize } from "./text.js";
import { isMonthWord } from "./dates.js";

const UNITS = { nol: 0, kosong: 0, satu: 1, dua: 2, tiga: 3, empat: 4, lima: 5, enam: 6, tujuh: 7, delapan: 8, sembilan: 9 };
const TEENS = { sepuluh: 10, sebelas: 11 };
// "m" is deliberately absent: it means meters as often as millions.
const BIG = { ribu: 1e3, rebu: 1e3, rb: 1e3, k: 1e3, juta: 1e6, jt: 1e6, miliar: 1e9, milyar: 1e9, triliun: 1e12 };
const SE_BIG = { seribu: 1e3, sejuta: 1e6, semiliar: 1e9, semilyar: 1e9 };
// Common Jakarta slang for round amounts.
const SLANG = { seceng: 1e3, goceng: 5e3, ceban: 1e4, goban: 5e4 };

const CURRENCY_BEFORE = new Set(["rp", "idr"]);
const CURRENCY_AFTER = new Set(["rupiah", "perak", "idr"]);
/** A number followed by one of these is a quantity/time, not money. */
const NOT_MONEY_AFTER = new Set([
  "hari", "minggu", "bulan", "tahun", "jam", "menit", "detik", "orang", "kali", "x", "porsi", "bungkus", "buah",
  "biji", "pcs", "kg", "gram", "gr", "ons", "liter", "l", "ml", "gelas", "botol", "lembar", "pasang", "potong",
  "kotak", "dus", "pack", "lusin", "kodi", "persen", "km", "meter", "cm", "lantai", "unit", "item", "batang",
]);
const NOT_MONEY_BEFORE = new Set(["tanggal", "tgl", "jam", "pukul", "nomor", "no", "lantai", "kamar", "ke", "tahun"]);

const isPlainValue = (t) => t.isDigit || t.text in UNITS || t.text in TEENS;
const isValueWord = (w) => w in UNITS || w in TEENS || w in SE_BIG || w in SLANG || w === "seratus" || w === "setengah";
const isNumberish = (t) =>
  t.isDigit || isValueWord(t.text) || t.text in BIG || t.text === "belas" || t.text === "puluh" || t.text === "ratus" || t.text === "koma";

/** "25.000" → 25000, "1,5" → 1.5, "1.250.000" → 1250000, "50.000,00" → 50000. */
export function parseDigitNumber(s) {
  if (/^\d+$/.test(s)) return Number(s);
  const lastDot = s.lastIndexOf(".");
  const lastComma = s.lastIndexOf(",");
  if (lastDot >= 0 && lastComma >= 0) {
    const dec = lastDot > lastComma ? "." : ",";
    const thou = dec === "." ? "," : ".";
    return Number(s.split(thou).join("").replace(dec, "."));
  }
  const sep = lastDot >= 0 ? "." : ",";
  const parts = s.split(sep);
  if (parts.length > 1 && parts[0].length <= 3 && parts.slice(1).every((p) => p.length === 3)) {
    return Number(parts.join(""));
  }
  if (parts.length === 2) return Number(`${parts[0]}.${parts[1]}`);
  return NaN;
}

/** Does token `t` begin a new number rather than continue the one before it? */
function startsNewNumber(prev, t) {
  if (!prev) return false;
  if (t.isDigit && isPlainValue(prev)) return true; // "2 30", "lima 25"
  if (t.isDigit && BIG[prev.text] === 1e3) return true; // "25 ribu 3 porsi"
  if (prev.isDigit && !t.isDigit && (t.text in UNITS || t.text in TEENS || t.text in SE_BIG || t.text in SLANG || t.text === "seratus")) return true;
  if (prev.text in UNITS && t.text in UNITS) return true; // "satu dua"
  if (prev.text in SLANG) return true;
  return false;
}

/** Split the token stream into runs of number-ish tokens. */
function numberRuns(tokens) {
  const runs = [];
  let run = [];
  const flush = () => {
    if (run.some((t) => t.isDigit || isValueWord(t.text))) runs.push(run);
    run = [];
  };
  for (const t of tokens) {
    if (!isNumberish(t)) {
      flush();
      continue;
    }
    if (startsNewNumber(run[run.length - 1], t)) flush();
    run.push(t);
  }
  flush();
  return runs;
}

/** Evaluate one run of number tokens. */
function evaluate(run) {
  let total = 0;
  let current = 0;
  let lastUnit = 0;
  let half = false;
  let decimal = false;
  let lastBig = 0;
  let hasUnit = false;
  let onlyWords = true;

  for (const t of run) {
    const w = t.text;
    if (t.isDigit) {
      onlyWords = false;
      const v = parseDigitNumber(w);
      if (!Number.isFinite(v)) return null;
      if (decimal) {
        current += v / 10 ** w.length;
        decimal = false;
      } else {
        current += v;
      }
      lastUnit = v < 10 && Number.isInteger(v) ? v : 0;
    } else if (w === "koma") {
      decimal = true;
    } else if (w in UNITS) {
      if (decimal) {
        current += UNITS[w] / 10;
        decimal = false;
      } else {
        current += UNITS[w];
        lastUnit = UNITS[w];
      }
    } else if (w in TEENS) {
      current += TEENS[w];
      lastUnit = 0;
    } else if (w === "belas") {
      current += 10; // "dua belas" = 2 + 10
      lastUnit = 0;
    } else if (w === "puluh") {
      current += lastUnit * 9; // "dua puluh" = 2 → 20
      lastUnit = 0;
    } else if (w === "ratus") {
      current += lastUnit * 99; // "dua ratus" = 2 → 200
      lastUnit = 0;
    } else if (w === "seratus") {
      current += 100;
      lastUnit = 0;
    } else if (w === "setengah") {
      half = true;
    } else if (w in SLANG) {
      total += SLANG[w];
      hasUnit = true;
    } else if (w in SE_BIG || w in BIG) {
      const mult = SE_BIG[w] ?? BIG[w];
      const base = w in SE_BIG ? 1 : current + (half ? 0.5 : 0);
      if (base === 0) continue;
      if (lastBig && mult > lastBig) total = (total + base) * mult;
      else total += base * mult;
      lastBig = mult;
      current = 0;
      lastUnit = 0;
      half = false;
      hasUnit = true;
    }
  }

  let ambiguousTail = false;
  // "sejuta dua ratus" is how people say 1.200.000 — read the tail as thousands, but flag it.
  if (current > 0 && current < 1000 && lastBig >= 1e6) {
    total += current * 1e3;
    ambiguousTail = true;
  } else {
    total += current;
  }
  return { value: Math.round(total), hasUnit, ambiguousTail, halfDangling: half, onlyWords };
}

const fmt = (n) => n.toLocaleString("id-ID");

/**
 * @returns {{ value: number|null, confidence: number, ambiguous: boolean,
 *   note: string, spans: Array<[number, number]>, candidates: number[], suggestion: number|null }}
 */
export function parseAmount(normalized) {
  const tokens = tokenize(normalized);
  const position = new Map(tokens.map((t, i) => [t, i]));
  const candidates = [];

  for (const run of numberRuns(tokens)) {
    const evaluated = evaluate(run);
    if (!evaluated || !(evaluated.value > 0)) continue;
    const first = position.get(run[0]);
    const last = position.get(run[run.length - 1]);
    const before = tokens[first - 1]?.text;
    const after = tokens[last + 1]?.text;
    const currency = CURRENCY_BEFORE.has(before) || CURRENCY_AFTER.has(after);
    const strong = currency || evaluated.hasUnit;

    if (!strong) {
      if (NOT_MONEY_AFTER.has(after) || NOT_MONEY_BEFORE.has(before) || isMonthWord(after || "")) continue;
      // "beli dua kopi": a small spoken number without a unit is a quantity.
      if (evaluated.onlyWords && evaluated.value < 1000) continue;
    }

    const spans = [[run[0].start, run[run.length - 1].end]];
    if (CURRENCY_BEFORE.has(before)) spans.push([tokens[first - 1].start, tokens[first - 1].end]);
    if (CURRENCY_AFTER.has(after)) spans.push([tokens[last + 1].start, tokens[last + 1].end]);
    candidates.push({ ...evaluated, strong, spans });
  }

  if (!candidates.length) {
    return { value: null, confidence: 0, ambiguous: false, note: "", spans: [], candidates: [], suggestion: null };
  }

  const values = candidates.map((c) => c.value);
  const strong = candidates.filter((c) => c.strong);

  if (strong.length === 1) {
    const c = strong[0];
    const ambiguous = c.ambiguousTail || c.halfDangling;
    return {
      value: c.value,
      confidence: ambiguous ? 0.6 : 0.95,
      ambiguous,
      note: ambiguous ? `Nominal dibaca Rp${fmt(c.value)} — satuannya tidak lengkap, mohon periksa.` : "",
      spans: c.spans,
      candidates: values,
      suggestion: null,
    };
  }

  if (strong.length > 1) {
    const distinct = [...new Set(strong.map((c) => c.value))];
    const sum = strong.reduce((s, c) => s + c.value, 0);
    return {
      value: distinct.length === 1 ? distinct[0] : sum,
      confidence: 0.5,
      ambiguous: true,
      note:
        distinct.length === 1
          ? "Nominal disebut lebih dari sekali — mohon periksa."
          : `Ada beberapa nominal (${strong.map((c) => `Rp${fmt(c.value)}`).join(" + ")}) — dijumlahkan, mohon periksa.`,
      spans: strong.flatMap((c) => c.spans),
      candidates: values,
      suggestion: null,
    };
  }

  // Only bare numbers: take the largest; below 1.000 the unit is unclear.
  const c = candidates.reduce((a, b) => (b.value > a.value ? b : a));
  if (c.value >= 1000) {
    return { value: c.value, confidence: 0.8, ambiguous: false, note: "", spans: c.spans, candidates: values, suggestion: null };
  }
  return {
    value: c.value,
    confidence: 0.3,
    ambiguous: true,
    note: `Nominal "${c.value}" tanpa satuan — apakah maksudnya Rp${fmt(c.value * 1000)}?`,
    spans: c.spans,
    candidates: values,
    suggestion: c.value * 1000,
  };
}
