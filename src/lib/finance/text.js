/**
 * Text helpers shared by the transaction parser. Normalisation keeps string
 * positions meaningful: later stages mask matched spans with spaces instead
 * of deleting them, so token offsets stay aligned with the normalised text.
 * Every reader (amounts, type, dates, questions) works on this same text.
 */
import { JOINABLE_WORDS, SPOKEN_FIXES } from "./moneyLexicon.js";

const JOINABLE = new Set(JOINABLE_WORDS);
const MAX_PIECE = Math.max(...JOINABLE_WORDS.map((w) => w.length));

/**
 * "duapuluhlima" → "dua puluh lima". Only splits a word that consists
 * entirely of number words, so ordinary words are never touched.
 */
export function splitJoinedNumber(word) {
  if (word.length < 6 || JOINABLE.has(word)) return word;
  const best = new Array(word.length + 1).fill(null);
  best[0] = [];
  for (let i = 0; i < word.length; i++) {
    if (!best[i]) continue;
    for (let j = i + 3; j <= Math.min(word.length, i + MAX_PIECE); j++) {
      const piece = word.slice(i, j);
      if (JOINABLE.has(piece) && (!best[j] || best[j].length > best[i].length + 1)) best[j] = [...best[i], piece];
    }
  }
  const pieces = best[word.length];
  return pieces && pieces.length >= 2 ? pieces.join(" ") : word;
}

const SCALE_AHEAD = "(?= ?(?:juta|jt|ribu|rb|rebu|k|miliar|milyar)\\b)";

export function normalizeText(text) {
  let out = String(text ?? "")
    .replace(/½/g, " setengah ")
    .replace(/¼/g, " seperempat ")
    .replace(/¾/g, " tiga perempat ")
    .replace(/\+/g, " tambah ")
    .replace(/@/g, " per ")
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[’'`]/g, "") // jum'at → jumat
    .replace(/rp\.?\s*(?=\d)/g, "rp ") // rp25.000 → rp 25.000
    .replace(/(\d)(?=[a-z])/g, "$1 ") // 25rb → 25 rb
    .replace(/([a-z])(?=\d)/g, "$1 ") // abc1 → abc 1
    .replace(/[^a-z0-9.,/\-\s]/g, " ") // other punctuation → space
    .replace(/(^|\s)[.,/-]+(?=\s|$)/g, " ") // lone separators
    .replace(/[.,]+(?=\s|$)/g, "") // trailing sentence punctuation: "ribu." → "ribu"
    .replace(/\s+/g, " ")
    .trim();
  // "1/2 juta" is a fraction, not a date, when a money scale follows
  out = out
    .replace(new RegExp(`\\b1/2${SCALE_AHEAD}`, "g"), "setengah")
    .replace(new RegExp(`\\b1/4${SCALE_AHEAD}`, "g"), "seperempat")
    .replace(new RegExp(`\\b3/4${SCALE_AHEAD}`, "g"), "tiga perempat");
  for (const [re, to] of SPOKEN_FIXES) out = out.replace(re, to);
  return out
    .split(" ")
    .map((w) => (/^[a-z]+$/.test(w) ? splitJoinedNumber(w) : w))
    .join(" ")
    .replace(/\s+/g, " ")
    .trim();
}

const TOKEN_RE = /\d+(?:[.,]\d+)*|[a-z]+/g;

/** Words and numbers with their [start, end) offsets in the normalised text. */
export function tokenize(normalized) {
  const tokens = [];
  for (const m of normalized.matchAll(TOKEN_RE)) {
    tokens.push({
      text: m[0],
      start: m.index,
      end: m.index + m[0].length,
      isDigit: m[0].charCodeAt(0) <= 57,
    });
  }
  return tokens;
}

/** Replace [start, end) ranges with spaces (keeps offsets stable). */
export function maskSpans(text, spans) {
  let out = text;
  for (const [start, end] of spans) {
    out = out.slice(0, start) + " ".repeat(Math.max(0, end - start)) + out.slice(end);
  }
  return out;
}

/** Whole-word / whole-phrase test on normalised text. */
export function hasPhrase(normalized, phrase) {
  return ` ${normalized} `.includes(` ${phrase} `);
}
