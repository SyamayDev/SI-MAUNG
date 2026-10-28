/**
 * Answers questions about the user's OWN records ("halo, berapa pengeluaranku
 * bulan ini?", "transaksi terakhir", "rata-rata jajan per hari", "dibanding
 * bulan lalu?"). Every number is computed from stored transactions/goals and
 * comes with its basis. Anything else gets an honest "belum bisa" with
 * examples of what is supported — the assistant is not a financial advisor.
 */
import { addDays, addMonths, endOfMonth, MONTHS_ID, startOfMonth, toLocalISODate } from "./dates.js";
import { categoryBreakdown, goalsProgress, inRange, totals } from "./summary.js";
import { formatDate, formatPercent, formatRupiah, formatSigned } from "./format.js";
import { normalizeText } from "./text.js";
import { detectCategory } from "./classify.js";
import { categoryLabel } from "./categories.js";

export const SUPPORTED_QUESTIONS = [
  "Berapa saldo saya?",
  "Berapa pengeluaran bulan ini?",
  "Pemasukan bulan lalu berapa?",
  "Kategori pengeluaran terbesar bulan ini?",
  "Pengeluaran makan minggu ini?",
  "Transaksi terakhir apa?",
  "Rata-rata pengeluaran per hari bulan ini?",
  "Bulan ini lebih boros dari bulan lalu?",
  "Bagaimana progres tabungan saya?",
];

/* ------------------------------------------------------------ text helpers */

// Words that may carry -ku/-mu/-nya/-kah/-lah ("pengeluaranku" → "pengeluaran").
const SUFFIX_STEMS = new Set([
  "pengeluaran", "pemasukan", "pendapatan", "penghasilan", "saldo", "uang", "duit", "gaji", "tabungan", "belanja",
  "belanjaan", "jajan", "jajanan", "transaksi", "catatan", "keuangan", "dompet", "rekening", "anggaran", "target",
  "tujuan", "kategori", "sisa", "total", "berapa", "apa", "mana", "biaya", "income", "cuan", "rata", "rata-rata",
]);
const stripSuffixes = (text) =>
  text
    .split(" ")
    .map((w) => {
      const m = /^(.{3,}?)(ku|mu|nya|kah|lah)$/.exec(w);
      return m && SUFFIX_STEMS.has(m[1]) ? m[1] : w;
    })
    .join(" ");

const GREETING_RE = /^(?:(?:halo+|hallo+|helo+|hai+|hi+|hey+|hei+|pagi|siang|sore|malam|selamat (?:pagi|siang|sore|malam)|assalamu ?alaikum|permisi|p|bro|sis|kak|min|maung|si maung)\b ?)+/;
const THANKS_RE = /\b(terima ?kasih|makasih|makasi|thanks|thank you|thx|tengkyu|nuhun|matur nuwun)\b/;
const HELP_RE = /\b(bisa apa|bisa ngapain|bantuan|help|cara pakai|cara pake|caranya|kamu siapa|siapa kamu|apa itu maung|fitur|contoh pertanyaan)\b/;
const ADVICE_RE = /\b(saran|tips|nasihat|nasehat|rekomendasi|investasi|saham|kripto|crypto|reksadana|pinjol|utang|hutang)\b/;

/* ----------------------------------------------------------------- periods */

const MONTH_FULL = Object.fromEntries(MONTHS_ID.map((m, i) => [m.toLowerCase(), i]));
MONTH_FULL.pebruari = 1;
MONTH_FULL.nopember = 10;
const MONTH_RE = new RegExp(`\\b(?:bulan )?(${Object.keys(MONTH_FULL).join("|")})(?: (\\d{4}))?\\b`);
const NUMBER_WORDS = { se: 1, satu: 1, dua: 2, tiga: 3, empat: 4, lima: 5, enam: 6, tujuh: 7, sepuluh: 10, "tiga puluh": 30 };
const dayCount = (from, to) => Math.round((to - from) / 86_400_000) + 1;

function detectPeriod(text, now) {
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const span = (from, to, label, explicit = true) => ({ from: toLocalISODate(from), to: toLocalISODate(to), label, days: dayCount(from, to), start: from, end: to, explicit });
  let m;
  if (/\bhari ini\b/.test(text)) return span(today, today, "hari ini");
  if (/\bkemarin lusa\b/.test(text)) return span(addDays(today, -2), addDays(today, -2), "kemarin lusa");
  if ((m = /\b(\d{1,3}|se|satu|dua|tiga|empat|lima|enam|tujuh|sepuluh|tiga puluh) ?(hari|minggu|pekan|bulan) (terakhir|belakangan|ke belakang)\b/.exec(text))) {
    const n = /^\d/.test(m[1]) ? Number(m[1]) : NUMBER_WORDS[m[1]];
    const days = m[2] === "hari" ? n : m[2] === "bulan" ? n * 30 : n * 7;
    if (days > 0 && days <= 3660) return span(addDays(today, -(days - 1)), today, `${days} hari terakhir`);
  }
  if (/\b(minggu|pekan) ini\b/.test(text)) {
    const back = (today.getDay() + 6) % 7; // week starts Monday
    return span(addDays(today, -back), today, "minggu ini");
  }
  if (/\b(minggu|pekan) (lalu|kemarin)\b/.test(text)) {
    const monday = addDays(today, -((today.getDay() + 6) % 7) - 7);
    return span(monday, addDays(monday, 6), "minggu lalu");
  }
  if (/\bbulan (lalu|kemarin)\b/.test(text)) {
    const prev = addMonths(startOfMonth(today), -1);
    return span(startOfMonth(prev), endOfMonth(prev), `bulan ${MONTHS_ID[prev.getMonth()]}`);
  }
  if (/\btahun (lalu|kemarin)\b/.test(text)) {
    const y = today.getFullYear() - 1;
    return span(new Date(y, 0, 1), new Date(y, 11, 31), `tahun ${y}`);
  }
  if (/\btahun ini\b/.test(text)) return span(new Date(today.getFullYear(), 0, 1), today, `tahun ${today.getFullYear()}`);
  if (/\bkemarin\b/.test(text)) return span(addDays(today, -1), addDays(today, -1), "kemarin");
  if ((m = MONTH_RE.exec(text))) {
    const month = MONTH_FULL[m[1]];
    let year = m[2] ? Number(m[2]) : today.getFullYear();
    if (!m[2] && month > today.getMonth()) year -= 1;
    const first = new Date(year, month, 1);
    const last = endOfMonth(first) > today ? today : endOfMonth(first);
    return span(first, last, `bulan ${MONTHS_ID[month]} ${year}`);
  }
  if (/\b(semua|seluruh|keseluruhan|sejak awal|selama ini|all time)\b/.test(text)) return { from: null, to: null, label: "seluruh catatan", explicit: true };
  return { ...span(startOfMonth(today), today, `bulan ${MONTHS_ID[today.getMonth()]}`, false) };
}

/* ------------------------------------------------------------------ topics */

const INCOME_RE = /\b(pemasukan|pendapatan|penghasilan|masuk|gaji|gajian|income|cuan|dapat|dapet|terima)\b/;
const EXPENSE_RE = /\b(pengeluaran|keluar|belanja|belanjaan|habis|boros|jajan|spending|biaya|ngeluarin|keluarin|bayar|beli|abis)\b/;
// Words that never name a topic ("berapa pengeluaran BULAN INI").
const QUESTION_WORDS = new Set([
  "berapa", "brp", "apa", "aja", "saja", "yang", "untuk", "buat", "di", "ke", "dari", "pada", "aku", "saya", "gue", "gw", "ku",
  "kamu", "total", "jumlah", "habis", "abis", "keluar", "pengeluaran", "pemasukan", "pendapatan", "penghasilan", "masuk",
  "uang", "duit", "bulan", "minggu", "pekan", "hari", "tahun", "ini", "lalu", "kemarin", "terakhir", "belakangan", "semua",
  "seluruh", "selama", "sejak", "awal", "dong", "ya", "sih", "nih", "deh", "kah", "tolong", "coba", "cek", "lihat", "liat",
  "kasih", "tahu", "tau", "bisa", "mau", "ingin", "pengen", "udah", "sudah", "berapakah", "gimana", "bagaimana", "kali",
  "transaksi", "catatan", "rekap", "ringkasan", "laporan", "belanja", "jajan", "biaya", "bayar", "beli", "dapat", "dapet",
  "terima", "spending", "income", "cuan", "boros", "banyak", "sudah", "aja", "dan", "atau", "the", "rp", "rupiah", "ada",
  "halo", "hai", "hi", "pagi", "siang", "sore", "malam", "min", "kak", "maung", "itu", "tuh", "kalau", "kalo", "dalam",
  "rata", "rata-rata", "per", "sehari", "harian", "terbesar", "termahal", "paling", "besar", "mahal", "gede", "tertinggi",
  "dibanding", "banding", "bandingkan", "perbandingan", "lebih", "makin", "hemat", "naik", "turun", "terbanyak", "saldo",
  "sisa", "tinggal", "kondisi", "keuangan", "arus", "terbaru", "barusan", "seminggu", "sebulan", "setahun", "sampai",
  "sekarang", "segini", "sejauh", "dong", "kemana", "mana", "apakah", "kenapa", "aku", "sama",
  ...Object.keys(MONTH_FULL),
]);
// Generic spending words that must not narrow the answer to one category.
const GENERIC_CATEGORY_WORDS = new Set(["belanja", "jajan"]);

/** A category or a word to look for in descriptions ("makan", "kopi", "transportasi"). */
function detectTopic(text, type) {
  const category = detectCategory(text, type);
  const specific = category.matched.some((w) => !GENERIC_CATEGORY_WORDS.has(w));
  if (category.confidence >= 0.85 && category.category !== "other" && specific) {
    return { kind: "category", value: category.category, label: categoryLabel(category.category) };
  }
  const byLabel = /\b(makanan|minuman|transportasi|transport|belanja|tagihan|langganan|hiburan|kesehatan|pendidikan|keluarga|hadiah|donasi|gaji|honor)\b/.exec(text);
  if (byLabel) {
    const map = { makanan: "food", minuman: "food", transportasi: "transportation", transport: "transportation", tagihan: "bills", langganan: "bills", hiburan: "entertainment", kesehatan: "health", pendidikan: "education", keluarga: "family", hadiah: "gift", donasi: "gift", gaji: "salary", honor: "salary" };
    if (map[byLabel[1]]) return { kind: "category", value: map[byLabel[1]], label: categoryLabel(map[byLabel[1]]) };
  }
  const words = text.split(" ").filter((w) => w.length >= 3 && !QUESTION_WORDS.has(w) && !/^\d/.test(w));
  if (words.length && words.length <= 3) return { kind: "word", value: words.join(" "), label: `“${words.join(" ")}”` };
  return null;
}

function matchTopic(t, topic) {
  if (!topic) return true;
  if (topic.kind === "category") return t.category === topic.value;
  const hay = normalizeText(`${t.description || ""} ${t.notes || ""}`);
  return topic.value.split(" ").every((w) => ` ${hay} `.includes(` ${w}`));
}

/* ----------------------------------------------------------------- answers */

const count = (list, type) => list.filter((t) => !type || t.type === type).length;
const txLine = (t) => `${formatDate(t.transaction_date, "dayMonth")} · ${t.description} · ${formatSigned(t.amount, t.type)}`;
const byDateDesc = (a, b) => String(b.transaction_date).localeCompare(String(a.transaction_date)) || String(b.created_at || "").localeCompare(String(a.created_at || ""));

const HELP_ANSWER = {
  handled: true,
  answer:
    "Aku MAUNG. Aku bisa mencatat transaksi dari kalimat biasa (“beli bensin goceng”, “gajian tiga juta setengah”) dan menjawab pertanyaan tentang catatanmu sendiri, misalnya:",
  items: SUPPORTED_QUESTIONS.slice(0, 7),
  kind: "help",
};

/**
 * @param {string} input
 * @param {{ transactions?: object[], goals?: object[], now?: Date }} options
 * @returns {{ handled: boolean, answer: string, basis?: string, items?: string[], kind?: string }}
 */
export function answerQuestion(input, { transactions = [], goals = [], now = new Date() } = {}) {
  const raw = stripSuffixes(normalizeText(input));
  const greeting = GREETING_RE.exec(raw);
  const text = raw.slice(greeting ? greeting[0].length : 0).trim();
  const hello = greeting ? "Halo! " : "";

  if (!text) return { handled: true, answer: "Halo! Mau catat transaksi atau cek ringkasan keuanganmu? Contoh: “beli kopi 20 ribu” atau “berapa pengeluaran bulan ini?”", kind: "greeting" };
  if (THANKS_RE.test(text) && text.split(" ").length <= 4) return { handled: true, answer: "Sama-sama! Kalau ada transaksi lagi, bilang saja.", kind: "thanks" };
  if (HELP_RE.test(text)) return { ...HELP_ANSWER, answer: hello + HELP_ANSWER.answer };

  const answer = (a) => ({ handled: true, ...a, answer: hello + a.answer });

  // Savings goals
  if (/\b(tabungan|nabung|menabung|celengan|target|tujuan)\b/.test(text)) {
    const progress = goalsProgress(goals);
    if (!progress) return answer({ answer: "Kamu belum punya tujuan tabungan. Buat satu di halaman Tabungan.", kind: "savings" });
    const named = goals.find((g) => g.name && text.includes(normalizeText(g.name)));
    if (named) {
      const ratio = Number(named.target_amount) > 0 ? Number(named.current_amount || 0) / Number(named.target_amount) : 0;
      return answer({
        answer: `Tujuan “${named.name}”: ${formatRupiah(named.current_amount || 0)} dari ${formatRupiah(named.target_amount)} (${formatPercent(Math.min(ratio, 1))}).`,
        basis: "Jumlah terkumpul tujuan ini",
        kind: "savings",
      });
    }
    return answer({
      answer: `Total progres ${goals.length} tujuan tabunganmu ${formatPercent(progress.ratio)}: ${formatRupiah(progress.current)} dari ${formatRupiah(progress.target)}.`,
      items: goals.slice(0, 5).map((g) => `${g.name}: ${formatRupiah(g.current_amount || 0)} / ${formatRupiah(g.target_amount)}`),
      basis: "Jumlah terkumpul tiap tujuan tabungan",
      kind: "savings",
    });
  }

  const isFinanceQuestion =
    /\b(saldo|sisa|tinggal|terakhir|terbaru|terbesar|termahal|paling|rata rata|rata|per hari|sehari|dibanding|banding|bandingkan|perbandingan|naik|turun|hemat|kategori|berapa kali|jumlah transaksi|ringkasan|rekap|laporan|arus|kondisi|keuangan)\b/.test(text) ||
    INCOME_RE.test(text) ||
    EXPENSE_RE.test(text) ||
    /\b(uang|duit)\b/.test(text);

  if (ADVICE_RE.test(text) && !isFinanceQuestion) {
    return answer({
      answer: "Aku belum bisa memberi saran keuangan atau investasi. Yang bisa kubantu: angka dari catatanmu sendiri — misalnya kategori terbesar atau perbandingan dengan bulan lalu.",
      items: [SUPPORTED_QUESTIONS[3], SUPPORTED_QUESTIONS[7]],
      kind: "advice",
    });
  }
  if (!isFinanceQuestion) return { handled: false, answer: "" };

  if (!transactions.length) {
    return answer({ answer: "Belum ada transaksi yang tercatat, jadi belum ada yang bisa dihitung. Coba catat transaksi pertamamu, misalnya “beli kopi 20 ribu”.", kind: "empty" });
  }

  const period = detectPeriod(text, now);
  const scopedAll = period.from ? inRange(transactions, period.from, period.to) : transactions;
  const wantsIncome = INCOME_RE.test(text);
  const wantsExpense = EXPENSE_RE.test(text);
  const type = wantsIncome && !wantsExpense ? "income" : wantsExpense && !wantsIncome ? "expense" : null;

  // Balance
  if (/\b(saldo|sisa uang|sisa duit|uang tinggal|duit tinggal|sisa|tinggal berapa)\b/.test(text)) {
    const scope = period.explicit ? scopedAll : transactions;
    const sum = totals(scope);
    const label = period.explicit ? period.label : "seluruh catatanmu";
    return answer({
      answer: `Saldo ${label}: ${formatRupiah(sum.net)} (pemasukan ${formatRupiah(sum.income)} − pengeluaran ${formatRupiah(sum.expense)}).`,
      basis: `${sum.count} transaksi tercatat`,
      kind: "balance",
    });
  }

  // Latest transactions
  if (/\b(terakhir|terbaru|barusan)\b/.test(text) && !/\b(hari|minggu|pekan|bulan) terakhir\b/.test(text)) {
    const list = transactions.filter((t) => !type || t.type === type).slice().sort(byDateDesc).slice(0, 3);
    if (!list.length) return answer({ answer: `Belum ada ${type === "income" ? "pemasukan" : "pengeluaran"} yang tercatat.`, kind: "latest" });
    return answer({ answer: `${list.length === 1 ? "Transaksi" : `${list.length} transaksi`} terakhirmu:`, items: list.map(txLine), kind: "latest" });
  }

  // Comparison with the previous period
  if (/\b(dibanding|banding|bandingkan|perbandingan|naik|turun|lebih boros|lebih hemat|makin boros|makin hemat)\b/.test(text)) {
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const curFrom = startOfMonth(today);
    const prevFrom = addMonths(curFrom, -1);
    const prevSameDay = new Date(prevFrom.getFullYear(), prevFrom.getMonth(), Math.min(today.getDate(), endOfMonth(prevFrom).getDate()));
    const field = type === "income" ? "income" : "expense";
    const word = field === "income" ? "Pemasukan" : "Pengeluaran";
    const cur = totals(inRange(transactions, toLocalISODate(curFrom), toLocalISODate(today)))[field];
    const prev = totals(inRange(transactions, toLocalISODate(prevFrom), toLocalISODate(prevSameDay)))[field];
    const prevFull = totals(inRange(transactions, toLocalISODate(prevFrom), toLocalISODate(endOfMonth(prevFrom))))[field];
    let verdict;
    if (prev === 0) verdict = cur === 0 ? "Keduanya belum ada catatan." : "Periode yang sama bulan lalu belum ada catatan, jadi belum bisa dibandingkan.";
    else {
      const diff = cur - prev;
      verdict =
        diff === 0
          ? "Sama persis dengan periode yang sama bulan lalu."
          : `${diff > 0 ? "Lebih tinggi" : "Lebih rendah"} ${formatRupiah(Math.abs(diff))} (${formatPercent(Math.abs(diff) / prev)}) dibanding periode yang sama bulan lalu (${formatRupiah(prev)}).`;
    }
    return answer({
      answer: `${word} 1–${today.getDate()} ${MONTHS_ID[today.getMonth()]}: ${formatRupiah(cur)}. ${verdict}`,
      basis: `Tanggal 1–${prevSameDay.getDate()} ${MONTHS_ID[prevFrom.getMonth()]} vs 1–${today.getDate()} ${MONTHS_ID[today.getMonth()]}; total ${MONTHS_ID[prevFrom.getMonth()]} ${formatRupiah(prevFull)}`,
      kind: "compare",
    });
  }

  // Category ranking
  if (/\bkategori\b/.test(text) || (/\b(paling banyak|paling boros|terbanyak)\b/.test(text) && !/\btransaksi\b/.test(text))) {
    const [top, second] = categoryBreakdown(scopedAll, type || "expense");
    const word = type === "income" ? "Pemasukan" : "Pengeluaran";
    if (!top) return answer({ answer: `Belum ada ${word.toLowerCase()} ${period.label}.`, kind: "category" });
    return answer({
      answer: `${word} terbesar ${period.label}: ${top.label} ${formatRupiah(top.amount)} (${formatPercent(top.share)}).` + (second ? ` Berikutnya ${second.label} ${formatRupiah(second.amount)}.` : ""),
      basis: `${count(scopedAll, type || "expense")} transaksi ${word.toLowerCase()}`,
      kind: "category",
    });
  }

  const topic = detectTopic(text, type || "expense");
  const scoped = scopedAll.filter((t) => matchTopic(t, topic));
  const topicLabel = topic ? ` untuk ${topic.label}` : "";

  // Biggest single transaction
  if (/\b(terbesar|termahal|paling besar|paling mahal|tertinggi|paling gede)\b/.test(text)) {
    const kind = type || "expense";
    const list = scoped.filter((t) => t.type === kind).sort((a, b) => Number(b.amount) - Number(a.amount));
    const word = kind === "income" ? "Pemasukan" : "Pengeluaran";
    if (!list.length) return answer({ answer: `Belum ada ${word.toLowerCase()}${topicLabel} ${period.label}.`, kind: "biggest" });
    const [first] = list;
    return answer({
      answer: `${word} terbesar${topicLabel} ${period.label}: ${first.description} ${formatRupiah(first.amount)} (${formatDate(first.transaction_date)}).`,
      basis: `${list.length} transaksi ${word.toLowerCase()}`,
      kind: "biggest",
    });
  }

  // Daily average
  if (/\b(rata rata|rata|per hari|sehari|harian)\b/.test(text)) {
    const kind = type || "expense";
    const sum = totals(scoped)[kind];
    const days = period.days || Math.max(1, dayCount(new Date(scoped.reduce((min, t) => (t.transaction_date < min ? t.transaction_date : min), toLocalISODate(now))), now));
    const word = kind === "income" ? "pemasukan" : "pengeluaran";
    return answer({
      answer: `Rata-rata ${word}${topicLabel} ${period.label}: ${formatRupiah(Math.round(sum / days))} per hari (${formatRupiah(sum)} selama ${days} hari).`,
      basis: `${count(scoped, kind)} transaksi ${word}`,
      kind: "average",
    });
  }

  // How many times
  if (/\b(berapa kali|jumlah transaksi|berapa transaksi|banyak transaksi|berapa catatan)\b/.test(text)) {
    const n = count(scoped, type);
    const word = type === "income" ? "pemasukan" : type === "expense" ? "pengeluaran" : "transaksi";
    return answer({ answer: `Ada ${n} ${word}${topicLabel} ${period.label}.`, basis: `${formatRupiah(totals(scoped)[type || "expense"])} ${type === "income" ? "pemasukan" : "pengeluaran"}`, kind: "count" });
  }

  const sum = totals(scoped);
  if (type === "income") {
    return answer({ answer: `Pemasukan${topicLabel} ${period.label}: ${formatRupiah(sum.income)}.`, basis: `${count(scoped, "income")} transaksi pemasukan`, kind: "income" });
  }
  if (type === "expense") {
    return answer({ answer: `Pengeluaran${topicLabel} ${period.label}: ${formatRupiah(sum.expense)}.`, basis: `${count(scoped, "expense")} transaksi pengeluaran`, kind: "expense" });
  }
  return answer({
    answer: `Ringkasan${topicLabel} ${period.label}: pemasukan ${formatRupiah(sum.income)}, pengeluaran ${formatRupiah(sum.expense)}, selisih ${formatRupiah(sum.net)}.`,
    basis: `${sum.count} transaksi`,
    kind: "summary",
  });
}
