/**
 * Text helpers shared by the transaction parser. Normalisation keeps string
 * positions meaningful: later stages mask matched spans with spaces instead
 * of deleting them, so token offsets stay aligned with the normalised text.
 */

export function normalizeText(text) {
  return String(text ?? "")
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
