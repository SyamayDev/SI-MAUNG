/**
 * Indonesian money parser — the single place where spoken or typed rupiah
 * amounts become numbers. Used by voice notes, typed sentences, the assistant
 * and as the deterministic check on any AI-extracted amount.
 *
 * Understands digits ("25.000", "1,5 jt", "Rp45rb", "100k"), full number words
 * ("dua juta tiga ratus empat puluh lima ribu"), halves and quarters ("dua juta
 * setengah", "dua setengah juta", "setengah juta", "dua juta seperempat"),
 * decimals ("dua koma lima juta"), slang ("goceng", "ceban", "cepek ceng",
 * "limpul ribu"), explicit sums ("500 ribu ditambah 200 ribu"), "setengah dari
 * dua juta", corrections ("20 ribu eh salah 25 ribu") and estimates ("50an").
 *
 * Arithmetic is exact: counts are fixed-point BigInt with six decimals, so a
 * half or a "koma" never goes through floating point. A final amount is
 * always a safe integer number of rupiah.
 *
 * Nothing is guessed. When a phrase can mean two things ("dua juta lima
 * ratus" = 2.000.500 literally, 2.500.000 colloquially; "cepek"; "dua
 * setengah" without a unit) the result is `ambiguous` with `choices`, and the
 * UI asks the user to pick before anything is saved.
 */
import { normalizeText, tokenize } from "./text.js";
import { isMonthWord } from "./dates.js";
import {
  APPROX_AFTER, APPROX_BEFORE, CANONICAL_SLANG, COMPOUND_WORDS, CORRECTION_MARKERS, CORRECTION_PAIR, CURRENCY_AFTER,
  CURRENCY_BEFORE, DECIMAL_WORD, DIGIT_WORDS, FRACTION_WORDS, HOKKIEN_COUNTS, MULTIPLIER_WORDS, NOT_MONEY_AFTER,
  NOT_MONEY_BEFORE, OPERATOR_WORDS, PER_ITEM_RE, QUARTER_WORD, SCALE_WORDS, SE_SCALE_WORDS, TEEN_WORD,
  UNCERTAIN_ALIASES,
} from "./moneyLexicon.js";

const MICRO = 1_000_000n; // fixed-point: 1 count = 1_000_000 micro
const has = (table, word) => Object.prototype.hasOwnProperty.call(table, word);
const fmt = (n) => `Rp${Number(n).toLocaleString("id-ID")}`;

/* ------------------------------------------------------------------ digits */

/**
 * "25.000" → 25000·10⁶, "1,5" → 1.5·10⁶, "50.000,00" → 50000·10⁶ (micro BigInt); null when not a number.
 * `info.inexact` is set when decimals beyond the sixth had to be dropped.
 */
export function parseDigitsMicro(s, info = {}) {
  let intPart;
  let fracPart = "";
  if (/^\d+$/.test(s)) intPart = s;
  else {
    const lastDot = s.lastIndexOf(".");
    const lastComma = s.lastIndexOf(",");
    if (lastDot >= 0 && lastComma >= 0) {
      const dec = lastDot > lastComma ? "." : ",";
      const thou = dec === "." ? "," : ".";
      if (s.split(dec).length !== 2) return null;
      [intPart, fracPart = ""] = s.split(thou).join("").split(dec);
    } else {
      const parts = s.split(lastDot >= 0 ? "." : ",");
      if (parts.length > 1 && parts[0].length >= 1 && parts[0].length <= 3 && parts.slice(1).every((p) => p.length === 3)) {
        intPart = parts.join(""); // thousands separators
      } else if (parts.length === 2) {
        [intPart, fracPart] = parts; // one decimal separator
      } else return null;
    }
  }
  if (!/^\d+$/.test(intPart || "") || !/^\d*$/.test(fracPart)) return null;
  info.inexact = /[1-9]/.test(fracPart.slice(6));
  return BigInt(intPart) * MICRO + BigInt(`${fracPart}000000`.slice(0, 6));
}

/** Number form of parseDigitsMicro (NaN when not a number). */
export function parseDigitNumber(s) {
  const micro = parseDigitsMicro(s);
  return micro === null ? NaN : Number(micro) / 1e6;
}

/* ----------------------------------------------------------------- lexemes */

function lexeme(tok) {
  const w = tok.text;
  if (tok.isDigit) {
    const info = {};
    const micro = parseDigitsMicro(w, info);
    return micro === null ? { kind: "word", word: w } : { kind: "digit", word: w, micro, plain: /^\d+$/.test(w), inexact: info.inexact };
  }
  if (has(DIGIT_WORDS, w)) return { kind: "unit", word: w, value: DIGIT_WORDS[w] };
  if (has(COMPOUND_WORDS, w)) return { kind: "compound", word: w, value: COMPOUND_WORDS[w] };
  if (w === TEEN_WORD) return { kind: "teen", word: w };
  if (has(MULTIPLIER_WORDS, w)) return { kind: "mult", word: w, value: MULTIPLIER_WORDS[w] };
  if (has(SCALE_WORDS, w)) return { kind: "scale", word: w, value: SCALE_WORDS[w] };
  if (has(SE_SCALE_WORDS, w)) return { kind: "sescale", word: w, value: SE_SCALE_WORDS[w] };
  if (has(FRACTION_WORDS, w)) return { kind: "frac", word: w, frac: FRACTION_WORDS[w] };
  if (w === QUARTER_WORD) return { kind: "quarter", word: w };
  if (w === DECIMAL_WORD) return { kind: "koma", word: w };
  if (has(HOKKIEN_COUNTS, w)) return { kind: "hok", word: w, value: HOKKIEN_COUNTS[w] };
  if (has(CANONICAL_SLANG, w)) return { kind: "slang", word: w, value: CANONICAL_SLANG[w] };
  if (w === "an") return { kind: "approx", word: w };
  return { kind: "word", word: w };
}

/** Smallest filled decimal place of an integer count (200 → 100): a following part must be smaller. */
function lowestPlace(group) {
  if (group % MICRO !== 0n) return 0n;
  let n = group / MICRO;
  let p = 1n;
  while (n > 0n && n % 10n === 0n) {
    n /= 10n;
    p *= 10n;
  }
  return p * MICRO;
}

/* ---------------------------------------------------------- one number run */

/**
 * Reads the longest number phrase starting at token i.
 * @returns {null | { start, end, value, choices, ambiguous, reason, strong, words, incomplete, slangWord }}
 */
function readNumber(lex, i) {
  const s = {
    total: 0n, // micro-rupiah of completed scale groups
    group: 0n, // micro count since the last scale
    lastUnit: 0n, // last single digit, still waiting for puluh/ratus/belas
    fresh: false,
    lastScale: 0n,
    groupStart: i,
    decimal: null, // digits after "koma"
    hok: null, // Hokkien count waiting for a scale ("cepek" … "ceng")
    alias: null, // uncertain alias waiting for a scale ("limpul" … "ribu")
    parts: [], // kinds in the current group (to recognise "sejuta DUA")
    scale: false,
    slang: null,
    words: false,
    approx: false,
    dangling: false,
  };
  const fits = (micro) => !s.fresh && (s.group === 0n || micro < lowestPlace(s.group));
  const foldDecimal = () => {
    if (s.decimal === null) return;
    if (s.decimal) s.group += BigInt(`${s.decimal}000000`.slice(0, 6));
    s.decimal = null;
  };

  let j = i;
  let end = null;
  loop: for (; j < lex.length; j++) {
    const x = lex[j];
    const next = lex[j + 1];
    if (s.decimal !== null) {
      if (x.kind === "unit" && x.value <= 9) {
        s.decimal += String(x.value);
        continue;
      }
      if (x.kind === "digit" && x.plain) {
        s.decimal += x.word;
        continue;
      }
      foldDecimal();
    }
    switch (x.kind) {
      case "digit": {
        if (s.hok || s.alias) break loop;
        if (s.lastScale && s.group === 0n) {
          // "1 juta 200 ribu" and "25 ribu 500" continue; "25 ribu 3 porsi" does not.
          const ok = s.lastScale >= 1_000_000n || (x.micro >= 100n * MICRO && x.micro < s.lastScale * MICRO);
          if (!ok) break loop;
        } else if (!fits(x.micro)) break loop;
        s.group += x.micro;
        if (x.inexact) s.inexact = true;
        s.fresh = x.micro < 10n * MICRO && x.micro % MICRO === 0n;
        s.lastUnit = s.fresh ? x.micro : 0n;
        s.parts.push(s.fresh ? "unit" : "digit");
        break;
      }
      case "unit": {
        const micro = BigInt(x.value) * MICRO;
        if (s.hok || s.alias || !fits(micro)) break loop;
        s.group += micro;
        s.fresh = true;
        s.lastUnit = micro;
        s.words = true;
        s.parts.push("unit");
        break;
      }
      case "teen":
        if (!s.fresh) break loop;
        s.group += 10n * MICRO;
        s.fresh = false;
        s.parts.push("teen");
        break;
      case "mult":
        if (!s.fresh) break loop;
        s.group += s.lastUnit * BigInt(x.value - 1);
        s.fresh = false;
        s.parts.push("mult");
        break;
      case "compound": {
        const micro = BigInt(x.value) * MICRO;
        if (s.hok || s.alias || !fits(micro)) break loop;
        s.group += micro;
        s.fresh = false;
        s.words = true;
        if (has(UNCERTAIN_ALIASES, x.word)) s.alias = x.word;
        s.parts.push("compound");
        break;
      }
      case "hok":
        if (s.group !== 0n || s.fresh || s.hok || s.alias || s.lastScale) break loop;
        s.group = BigInt(x.value) * MICRO;
        s.hok = x.word;
        s.words = true;
        s.parts.push("hok");
        break;
      case "slang": {
        if (s.hok || s.alias || s.lastScale || s.total) break loop;
        let count = MICRO;
        if (s.group > 0n) {
          // "dua ceban" = 20.000 — only a plain whole count may multiply
          if (s.group % MICRO !== 0n || s.group >= 100n * MICRO) break loop;
          count = s.group;
        }
        s.total = count * BigInt(x.value);
        s.group = 0n;
        s.slang = x.word;
        s.words = true;
        j++;
        break loop;
      }
      case "scale": {
        if (s.group === 0n) break loop; // "ribu" with no count
        const S = BigInt(x.value);
        if (s.lastScale && S >= s.lastScale) {
          // "dua puluh ribu | tiga puluh ribu": a second amount starts at the current group
          end = s.groupStart;
          s.group = 0n;
          s.hok = s.alias = null;
          break loop;
        }
        s.total += s.group * S;
        s.group = 0n;
        s.lastScale = S;
        s.fresh = false;
        s.hok = s.alias = null;
        s.scale = true;
        s.parts = [];
        s.groupStart = j + 1;
        break;
      }
      case "sescale": {
        if (s.group !== 0n || s.fresh || s.hok || s.alias) break loop;
        const S = BigInt(x.value);
        if (s.lastScale && S >= s.lastScale) break loop;
        s.total += S * MICRO;
        s.lastScale = S;
        s.scale = true;
        s.words = true;
        s.parts = [];
        s.groupStart = j + 1;
        break;
      }
      case "frac": {
        const [n, d] = x.frac.map(BigInt);
        const part = (MICRO * n) / d;
        if (next?.word === "dari") break loop; // "setengah dari dua juta" — a calculation, handled later
        if (next?.kind === "scale") {
          // "dua setengah juta", "setengah juta"
          if (s.hok || s.alias || s.group % MICRO !== 0n || s.lastScale) break loop;
          s.group += part;
          s.fresh = false;
          s.words = true;
          s.parts.push("frac");
          break;
        }
        if (s.lastScale && s.group === 0n) {
          // "dua juta setengah" = 2.500.000: the fraction belongs to the last scale
          s.total += s.lastScale * part;
          s.words = true;
          j++;
          break loop;
        }
        if (!s.lastScale && !s.hok && !s.alias && s.group > 0n && s.group % MICRO === 0n) {
          // "dua setengah" with no unit at all — incomplete (a lone "setengah" is not an amount: "setengah harga")
          s.group += part;
          s.dangling = true;
          s.words = true;
          j++;
          break loop;
        }
        break loop;
      }
      case "quarter":
        // "tiga perempat juta"
        if (!s.fresh) break loop;
        s.group += s.lastUnit / 4n - s.lastUnit;
        s.fresh = false;
        s.parts.push("frac");
        break;
      case "koma":
        if (s.group === 0n || s.group % MICRO !== 0n || s.hok || s.alias) break loop;
        s.decimal = "";
        s.fresh = false;
        break;
      case "approx":
        if (j === i) break loop;
        s.approx = true;
        break;
      default:
        break loop;
    }
  }
  foldDecimal();
  if (end === null) end = j;
  // a trailing "koma"/"an" alone does not make a number
  if (end <= i || (s.total === 0n && s.group === 0n)) return null;

  const res = {
    start: i,
    end,
    value: null,
    choices: [],
    ambiguous: false,
    reason: "",
    strong: s.scale || Boolean(s.slang),
    words: s.words,
    incomplete: false,
    approx: s.approx,
    slangWord: s.slang,
  };
  const words = lex.slice(i, end).map((x) => x.word).join(" ");
  const toInt = (micro) => (micro % MICRO === 0n ? Number(micro / MICRO) : null);
  const ask = (choices, reason, literal = null) => {
    res.ambiguous = true;
    res.choices = [...new Set(choices.filter((c) => Number.isSafeInteger(c) && c > 0))];
    res.reason = reason;
    res.value = literal;
  };

  if (s.hok) {
    // "gopek", "cepek" … with no scale after them
    res.strong = true;
    if (has(UNCERTAIN_ALIASES, s.hok)) ask(UNCERTAIN_ALIASES[s.hok].choices, UNCERTAIN_ALIASES[s.hok].note, toInt(s.group));
    else res.value = CANONICAL_SLANG[s.hok] ?? toInt(s.group);
    return res;
  }
  if (s.alias) {
    // "limpul", "seratus limpul" with no scale after them
    res.strong = true;
    const base = toInt(s.group);
    const thousandFirst = UNCERTAIN_ALIASES[s.alias].choices[0] >= 1000;
    const note = base === 50 ? UNCERTAIN_ALIASES[s.alias].note : `“${words}” tanpa satuan — ${fmt(base * 1000)} atau ${fmt(base)}?`;
    ask(thousandFirst ? [base * 1000, base] : [base, base * 1000], note, base);
    return res;
  }
  if (s.dangling) {
    // "dua setengah": the unit is missing — ribu or juta?
    res.incomplete = true;
    const a = toInt(s.group * 1000n);
    const b = toInt(s.group * 1_000_000n);
    ask([a, b], `Nominal “${words}” belum jelas satuannya — ${fmt(a)} atau ${fmt(b)}?`);
    return res;
  }
  if (!s.scale && !s.slang) {
    // a bare number: "25", "2.500.000", "dua koma lima"
    const value = toInt(s.group);
    if (value === null) {
      res.incomplete = true;
      const a = toInt(s.group * 1000n);
      const b = toInt(s.group * 1_000_000n);
      ask([a, b], `Nominal “${words}” belum jelas satuannya — ${fmt(a)} atau ${fmt(b)}?`);
    } else res.value = value;
    return res;
  }

  const literal = s.total + s.group;
  const literalInt = toInt(literal);
  if (literalInt === null || s.inexact) {
    const rounded = Number((literal + MICRO / 2n) / MICRO);
    ask([rounded], `Nominal “${words}” tidak bulat — dibulatkan ke ${fmt(rounded)}, mohon periksa.`);
    return res;
  }
  res.value = literalInt;

  // A tail after a scale that people use as a shorthand: "sejuta dua ratus" (1.200.000),
  // "dua juta lima" (2.500.000), "dua ribu lima" (2.500). Literally these are 1.000.200,
  // 2.000.005 and 2.005, so we ask instead of choosing.
  if (s.group > 0n && s.group % MICRO === 0n) {
    const tail = s.group / MICRO;
    const single = s.parts.length === 1 && s.parts[0] === "unit";
    let colloquial = null;
    if (s.lastScale >= 1_000_000n && tail < 1000n) colloquial = s.total / MICRO + tail * (single ? s.lastScale / 10n : s.lastScale / 1000n);
    else if (s.lastScale === 1000n && single) colloquial = s.total / MICRO + tail * 100n;
    if (colloquial !== null && Number(colloquial) !== literalInt) {
      const c = Number(colloquial);
      ask([c, literalInt], `“${words}” bisa berarti ${fmt(c)} atau ${fmt(literalInt)} — pilih yang benar.`, literalInt);
    }
  }
  return res;
}

/* ------------------------------------------------------- sentence analysis */

function phraseIndex(tokens, phrases, from = 0) {
  // last occurrence of any phrase (by whole tokens) → token index of its last word
  let found = null;
  for (const phrase of phrases) {
    const words = phrase.split(" ");
    for (let k = from; k + words.length <= tokens.length; k++) {
      if (words.every((w, o) => tokens[k + o].text === w)) {
        if (!found || k > found.start) found = { start: k, end: k + words.length };
      }
    }
  }
  return found;
}

function endsWithPhrase(tokens, at, phrases) {
  // does a phrase end exactly at token index `at` (exclusive)?
  for (const phrase of phrases) {
    const words = phrase.split(" ");
    const k = at - words.length;
    if (k >= 0 && words.every((w, o) => tokens[k + o].text === w)) return { start: k, end: at };
  }
  return null;
}

function startsWithPhrase(tokens, at, phrases) {
  for (const phrase of phrases) {
    const words = phrase.split(" ");
    if (at + words.length <= tokens.length && words.every((w, o) => tokens[at + o].text === w)) return { start: at, end: at + words.length };
  }
  return null;
}

const tokenSpan = (tokens, from, to) => [tokens[from].start, tokens[to - 1].end];

/**
 * @param {string} input sentence (raw, or already normalised with { normalized: true })
 * @returns {{
 *   value: number|null,       // the amount to use (literal reading); null when it must be chosen/typed
 *   ambiguous: boolean,       // true → never save without the user picking/typing an amount
 *   choices: number[],        // plausible amounts, most likely first (when ambiguous)
 *   approximate: boolean, negative: boolean, corrected: boolean, calculation: string|null,
 *   confidence: number, note: string,
 *   spans: Array<[number, number]>, // every money-related span (to remove from the description)
 *   amounts: number[]          // every money amount found (diagnostics/tests)
 * }}
 */
export function parseMoney(input, { normalized = false } = {}) {
  const text = normalized ? String(input ?? "") : normalizeText(input);
  const tokens = tokenize(text);
  const lex = tokens.map(lexeme);
  const empty = {
    value: null, ambiguous: false, choices: [], approximate: false, negative: false, corrected: false, calculation: null,
    confidence: 0, note: "", spans: [], amounts: [],
  };

  // 1. read every number phrase
  let nums = [];
  for (let i = 0; i < tokens.length; ) {
    const n = lex[i].kind === "word" ? null : readNumber(lex, i);
    if (!n) {
      i++;
      continue;
    }
    n.spans = [tokenSpan(tokens, n.start, n.end)];
    nums.push(n);
    i = n.end;
  }
  if (!nums.length) return empty;

  const extraSpans = [];

  // 2. explicit calculations between neighbours: "500 ribu ditambah 200 ribu", "3 x 25 ribu"
  const isCount = (n) => !n.strong && !n.ambiguous && Number.isSafeInteger(n.value) && n.value > 0 && n.value < 1000;
  const isMoney = (n) => !n.ambiguous && Number.isSafeInteger(n.value) && n.value > 0 && (n.strong || n.value >= 1000 || isCurrency(n));
  const isCurrency = (n) => CURRENCY_BEFORE.has(tokens[n.start - 1]?.text) || CURRENCY_AFTER.has(tokens[n.end]?.text);
  for (let k = 0; k + 1 < nums.length; k++) {
    const a = nums[k];
    const b = nums[k + 1];
    const gap = tokens.slice(a.end, b.start).map((t) => t.text).filter((w) => !CURRENCY_BEFORE.has(w) && !CURRENCY_AFTER.has(w) && w !== "dengan");
    if (gap.length !== 1 || !has(OPERATOR_WORDS, gap[0])) continue;
    const op = OPERATOR_WORDS[gap[0]];
    let value = null;
    let calculation = "";
    if (op === "add" && isMoney(a) && isMoney(b)) {
      value = a.value + b.value;
      calculation = `${fmt(a.value)} + ${fmt(b.value)}`;
    } else if (op === "sub" && isMoney(a) && isMoney(b) && a.value > b.value) {
      value = a.value - b.value;
      calculation = `${fmt(a.value)} − ${fmt(b.value)}`;
    } else if (op === "mul" && isCount(a) && isMoney(b)) {
      value = a.value * b.value;
      calculation = `${a.value} × ${fmt(b.value)}`;
    } else if (op === "mul" && isMoney(a) && isCount(b)) {
      value = a.value * b.value;
      calculation = `${fmt(a.value)} × ${b.value}`;
    } else if (op === "div" && isMoney(a) && isCount(b) && a.value % b.value === 0) {
      value = a.value / b.value;
      calculation = `${fmt(a.value)} ÷ ${b.value}`;
    }
    if (value === null || !Number.isSafeInteger(value)) continue;
    const merged = {
      ...a, end: b.end, value, strong: true, ambiguous: false, choices: [], incomplete: false, calculation,
      spans: [tokenSpan(tokens, a.start, b.end)],
    };
    nums.splice(k, 2, merged);
    k--;
  }
  // "setengah dari dua juta"
  for (const n of nums) {
    const frac = lex[n.start - 2];
    if (tokens[n.start - 1]?.text !== "dari" || frac?.kind !== "frac" || !isMoney(n)) continue;
    const [p, q] = frac.frac;
    if ((n.value * p) % q !== 0) continue;
    n.calculation = `${frac.word} dari ${fmt(n.value)}`;
    n.value = (n.value * p) / q;
    n.start -= 2;
    n.strong = true;
    n.spans = [tokenSpan(tokens, n.start, n.end)];
  }

  // 3. money vs. quantity/time ("2 kopi", "parkir 2 jam", "tahun 2026")
  const quantities = [];
  nums = nums.filter((n) => {
    const before = tokens[n.start - 1]?.text;
    const after = tokens[n.end]?.text;
    if (isCurrency(n)) n.strong = true;
    if (n.strong) return true;
    const notMoney = NOT_MONEY_AFTER.has(after) || NOT_MONEY_BEFORE.has(before) || isMonthWord(after || "");
    if (notMoney || (n.words && !n.incomplete && Number(n.value) < 1000)) {
      quantities.push(n);
      return false;
    }
    return true;
  });
  if (!nums.length) return empty;

  // 4. corrections: "20 ribu eh salah 25 ribu", "bukan 20 ribu tapi 25 ribu"
  let corrected = false;
  let marker = phraseIndex(tokens, CORRECTION_MARKERS);
  const bukan = phraseIndex(tokens, [CORRECTION_PAIR.first]);
  if (bukan) {
    const then = phraseIndex(tokens, CORRECTION_PAIR.then, bukan.end);
    if (then && (!marker || then.start > marker.start)) {
      marker = then;
      extraSpans.push(tokenSpan(tokens, bukan.start, bukan.end));
    }
  }
  if (marker) {
    const after = nums.filter((n) => n.start >= marker.end);
    const before = nums.filter((n) => n.start < marker.end);
    if (after.length && before.length) {
      corrected = true;
      before.forEach((n) => extraSpans.push(...n.spans));
      extraSpans.push(tokenSpan(tokens, marker.start, marker.end));
      nums = after;
    }
  }

  // 5. context of each amount: currency words, estimates, sign
  for (const n of nums) {
    if (CURRENCY_BEFORE.has(tokens[n.start - 1]?.text)) n.spans.push(tokenSpan(tokens, n.start - 1, n.start));
    if (CURRENCY_AFTER.has(tokens[n.end]?.text)) n.spans.push(tokenSpan(tokens, n.end, n.end + 1));
    const approxBefore = endsWithPhrase(tokens, n.start, APPROX_BEFORE);
    const approxAfter = startsWithPhrase(tokens, n.end + (CURRENCY_AFTER.has(tokens[n.end]?.text) ? 1 : 0), APPROX_AFTER);
    if (n.approx || approxBefore || approxAfter) {
      n.approx = true;
      if (approxBefore) n.spans.push(tokenSpan(tokens, approxBefore.start, approxBefore.end));
      if (approxAfter) n.spans.push(tokenSpan(tokens, approxAfter.start, approxAfter.end));
    }
    const prev = tokens[n.start - 1];
    const charBefore = text[tokens[n.start].start - 1];
    const charBefore2 = text[tokens[n.start].start - 2];
    if (prev?.text === "minus" && !n.calculation) {
      n.negative = true;
      n.spans.push(tokenSpan(tokens, n.start - 1, n.start));
    } else if (charBefore === "-" && (charBefore2 === undefined || charBefore2 === " ")) n.negative = true;
  }

  const money = nums.filter((n) => n.strong || n.incomplete);
  const bare = nums.filter((n) => !n.strong && !n.incomplete);
  const allSpans = [...extraSpans, ...money.flatMap((n) => n.spans)];
  const result = { ...empty, corrected, spans: allSpans, amounts: nums.map((n) => n.value).filter((v) => v !== null) };

  let chosen = null;
  if (money.length === 1) chosen = money[0];
  else if (money.length > 1) {
    // several amounts in one sentence ("kopi 25 ribu dan roti 15 ribu"): never sum silently
    const values = money.map((n) => (n.ambiguous ? null : n.value));
    const choices = [];
    if (values.every((v) => v !== null)) {
      const sum = values.reduce((acc, v) => acc + v, 0);
      const distinct = [...new Set(values)];
      choices.push(...(distinct.length === 1 ? [distinct[0], sum] : [sum, ...distinct]));
    } else money.forEach((n) => choices.push(...(n.ambiguous ? n.choices : [n.value])));
    return {
      ...result,
      ambiguous: true,
      choices: [...new Set(choices)].filter((c) => Number.isSafeInteger(c) && c > 0),
      confidence: 0.4,
      approximate: money.some((n) => n.approx),
      note: `Ada beberapa nominal (${money.map((n) => (n.ambiguous ? `“${tokens.slice(n.start, n.end).map((t) => t.text).join(" ")}”` : fmt(n.value))).join(", ")}). Pilih nominal yang benar atau totalnya.`,
    };
  } else {
    // only bare numbers: the largest one; under 1.000 the unit is unclear
    chosen = bare.reduce((a, b) => (Number(b.value) > Number(a.value) ? b : a));
    result.spans = [...extraSpans, ...chosen.spans];
    if (chosen.value < 1000) {
      return {
        ...result,
        value: chosen.value,
        ambiguous: true,
        choices: [chosen.value * 1000, chosen.value],
        confidence: 0.3,
        note: `Nominal “${chosen.value}” tanpa satuan — maksudnya ${fmt(chosen.value * 1000)}?`,
      };
    }
  }

  const negative = Boolean(chosen.negative);
  const approximate = Boolean(chosen.approx);
  const notes = [];
  if (chosen.ambiguous) notes.push(chosen.reason);
  if (chosen.calculation) notes.push(`Dihitung: ${chosen.calculation} = ${fmt(chosen.value)}.`);
  if (corrected) notes.push(`Nominal dikoreksi menjadi ${chosen.ambiguous ? "yang disebut terakhir" : fmt(chosen.value)}.`);
  if (approximate) notes.push("Nominal ini perkiraan (“sekitar/-an/lebih”) — isi angka pastinya bila tahu.");

  let { ambiguous, choices } = chosen;
  // "3 kopi masing-masing 20 ribu": total or price per item?
  if (!ambiguous && PER_ITEM_RE.test(text)) {
    const qty = [...quantities, ...bare].find((q) => q.start < chosen.start && Number.isSafeInteger(q.value) && q.value > 1 && q.value < 1000);
    if (qty) {
      ambiguous = true;
      choices = [qty.value * chosen.value, chosen.value];
      notes.unshift(`Harga per item? Total ${qty.value} × ${fmt(chosen.value)} = ${fmt(qty.value * chosen.value)}, atau simpan ${fmt(chosen.value)} saja.`);
    }
  }

  const strongish = chosen.strong || chosen.incomplete;
  let confidence = ambiguous ? 0.4 : approximate ? 0.6 : chosen.calculation || corrected ? 0.85 : strongish ? 0.95 : 0.8;
  if (ambiguous && chosen.incomplete) confidence = 0.3;
  return {
    ...result,
    value: chosen.value,
    ambiguous,
    choices: ambiguous ? choices : [],
    approximate,
    negative,
    calculation: chosen.calculation || null,
    confidence,
    note: notes.join(" "),
  };
}

/**
 * An AI model is never the only authority on an amount. Its number is checked
 * against this parser on the same sentence:
 *   - parser certain  → the parser's amount is used (a disagreement is reported);
 *   - parser unsure   → no amount, the parser's choices are offered;
 *   - parser found nothing → the model's amount (a safe positive integer only),
 *     flagged for review.
 * @returns {{ amount: number|null, choices: number[], mismatch: boolean, note: string }}
 */
export function reconcileAIAmount(text, aiAmount) {
  const local = parseMoney(text);
  const aiOk = typeof aiAmount === "number" && Number.isSafeInteger(aiAmount) && aiAmount > 0;
  if (local.ambiguous) {
    return { amount: null, choices: local.choices, mismatch: aiOk && !local.choices.includes(aiAmount), note: local.note };
  }
  if (local.value !== null) {
    const mismatch = aiOk && aiAmount !== local.value;
    return {
      amount: local.value,
      choices: [],
      mismatch,
      note: mismatch ? `AI membaca ${fmt(aiAmount)}, parser membaca ${fmt(local.value)} — dipakai ${fmt(local.value)}.` : local.note,
    };
  }
  if (aiOk) return { amount: aiAmount, choices: [], mismatch: false, note: "Nominal hanya ditemukan oleh AI — periksa sebelum menyimpan." };
  return { amount: null, choices: [], mismatch: false, note: "" };
}
