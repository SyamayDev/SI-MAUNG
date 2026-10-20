/**
 * Calendar helpers that work in the user's LOCAL time zone.
 * (`toISOString()` is UTC — in WIB it returns yesterday's date before 07:00.)
 */

const pad = (n) => String(n).padStart(2, "0");

/** Date → "YYYY-MM-DD" in local time. */
export function toLocalISODate(date = new Date()) {
  const d = date instanceof Date ? date : new Date(date);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/** "YYYY-MM-DD" → local Date at midnight, or null when invalid. */
export function parseLocalISODate(iso) {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(iso || "").slice(0, 10));
  if (!m) return null;
  const d = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  if (d.getFullYear() !== Number(m[1]) || d.getMonth() !== Number(m[2]) - 1 || d.getDate() !== Number(m[3])) return null;
  return d;
}

export function addDays(date, days) {
  const d = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  d.setDate(d.getDate() + days);
  return d;
}

export function startOfMonth(date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

export function endOfMonth(date) {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0);
}

export function addMonths(date, months) {
  const d = new Date(date.getFullYear(), date.getMonth() + months, 1);
  const last = endOfMonth(d).getDate();
  d.setDate(Math.min(date.getDate(), last));
  return d;
}

export const monthKey = (date) => `${date.getFullYear()}-${pad(date.getMonth() + 1)}`;

export const MONTHS_ID = [
  "Januari", "Februari", "Maret", "April", "Mei", "Juni",
  "Juli", "Agustus", "September", "Oktober", "November", "Desember",
];

const MONTH_WORDS = {
  januari: 0, jan: 0, februari: 1, feb: 1, pebruari: 1, maret: 2, mar: 2, april: 3, apr: 3, mei: 4,
  juni: 5, jun: 5, juli: 6, jul: 6, agustus: 7, agu: 7, agt: 7, ags: 7, agus: 7, september: 8, sep: 8,
  sept: 8, oktober: 9, okt: 9, november: 10, nov: 10, nopember: 10, desember: 11, des: 11,
};
export const MONTH_WORD_RE = Object.keys(MONTH_WORDS).sort((a, b) => b.length - a.length).join("|");

const DAY_WORDS = { minggu: 0, senin: 1, selasa: 2, rabu: 3, kamis: 4, jumat: 5, sabtu: 6 };
const SMALL_NUMBERS = { satu: 1, se: 1, dua: 2, tiga: 3, empat: 4, lima: 5, enam: 6, tujuh: 7, delapan: 8, sembilan: 9, sepuluh: 10 };

function validDay(year, month, day) {
  const d = new Date(year, month, day);
  return d.getFullYear() === year && d.getMonth() === month && d.getDate() === day ? d : null;
}

/**
 * Finds a date expression in normalised Indonesian text.
 * Returns { date: "YYYY-MM-DD", confidence, explicit, approximate, span: [start, end] }.
 * Without any expression → today, explicit: false.
 * A day/month without a year that would land in the future is moved back a
 * year/month: transactions are recorded after they happen.
 */
export function detectDate(normalized, now = new Date()) {
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const result = (date, confidence, m, extra = {}) => ({
    date: toLocalISODate(date),
    confidence,
    explicit: true,
    approximate: false,
    span: [m.index, m.index + m[0].length],
    ...extra,
  });
  let m;

  if ((m = /\b(\d{4})-(\d{2})-(\d{2})\b/.exec(normalized))) {
    const d = validDay(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
    if (d) return result(d, 0.95, m);
  }

  if ((m = /\bkemarin lusa\b|\b(dua|2) hari (yang )?lalu\b/.exec(normalized))) return result(addDays(today, -2), 0.9, m);

  if ((m = /\b(\d{1,2}|satu|se|dua|tiga|empat|lima|enam|tujuh|delapan|sembilan|sepuluh) hari (yang )?(lalu|kemarin)\b/.exec(normalized))) {
    const n = /^\d/.test(m[1]) ? Number(m[1]) : SMALL_NUMBERS[m[1]];
    if (n > 0 && n <= 60) return result(addDays(today, -n), 0.9, m);
  }

  if ((m = /\b(kemarin|kemaren|kmrn|kmarin)\b/.exec(normalized))) return result(addDays(today, -1), 0.9, m);

  if ((m = /\b(seminggu (yang )?lalu|minggu lalu|pekan lalu)\b/.exec(normalized))) {
    return result(addDays(today, -7), 0.55, m, { approximate: true });
  }

  // "tanggal 5", "tgl 5 oktober", "5 oktober 2026", "5 okt"
  const monthRe = new RegExp(`\\b(?:(?:tanggal|tgl) )?(\\d{1,2}) (${MONTH_WORD_RE})(?: (\\d{4}))?\\b`);
  if ((m = monthRe.exec(normalized))) {
    const day = Number(m[1]);
    const month = MONTH_WORDS[m[2]];
    const year = m[3] ? Number(m[3]) : today.getFullYear();
    let d = validDay(year, month, day);
    if (d && !m[3] && d > today) d = validDay(year - 1, month, day);
    if (d) return result(d, 0.9, m);
  }

  if ((m = /\b(?:tanggal|tgl) (\d{1,2})\b/.exec(normalized))) {
    const day = Number(m[1]);
    let d = validDay(today.getFullYear(), today.getMonth(), day);
    if (d && d > today) {
      const prev = addMonths(startOfMonth(today), -1);
      d = validDay(prev.getFullYear(), prev.getMonth(), day);
    }
    if (d) return result(d, 0.8, m);
  }

  // Indonesian order: dd/mm[/yyyy]
  if ((m = /\b(\d{1,2})[/-](\d{1,2})(?:[/-](\d{2}|\d{4}))?\b/.exec(normalized))) {
    const day = Number(m[1]);
    const month = Number(m[2]) - 1;
    const year = m[3] ? Number(m[3].length === 2 ? `20${m[3]}` : m[3]) : today.getFullYear();
    let d = validDay(year, month, day);
    if (d && !m[3] && d > today) d = validDay(year - 1, month, day);
    if (d) return result(d, 0.85, m);
  }

  // "hari senin", "senin kemarin", "jumat lalu" → the most recent such day
  if ((m = /\b(?:hari (minggu|senin|selasa|rabu|kamis|jumat|sabtu)|(senin|selasa|rabu|kamis|jumat|sabtu)(?: (lalu|kemarin))?)\b/.exec(normalized))) {
    const dow = DAY_WORDS[m[1] || m[2]];
    let back = (today.getDay() - dow + 7) % 7;
    if (back === 0 && m[3]) back = 7;
    return result(addDays(today, -back), 0.75, m);
  }

  if ((m = /\b(hari ini|tadi pagi|tadi siang|tadi sore|tadi malam|barusan|sekarang|td|tadi)\b/.exec(normalized))) {
    return result(today, 0.95, m);
  }

  return { date: toLocalISODate(today), confidence: 0.6, explicit: false, approximate: false, span: null };
}

/** Does this token look like part of a date (so it must not be read as money)? */
export function isMonthWord(word) {
  return Object.prototype.hasOwnProperty.call(MONTH_WORDS, word);
}
