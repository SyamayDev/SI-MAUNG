/**
 * Answers a small, explicit set of questions about the user's own data
 * ("berapa pengeluaran bulan ini?", "saldo saya?", "kategori terbesar?").
 * Everything is computed from stored transactions; anything else gets an
 * honest "belum bisa" with examples of what is supported.
 */
import { addDays, addMonths, endOfMonth, MONTHS_ID, startOfMonth, toLocalISODate } from "./dates.js";
import { categoryBreakdown, goalsProgress, inRange, totals } from "./summary.js";
import { formatPercent, formatRupiah } from "./format.js";
import { normalizeText } from "./text.js";

export const SUPPORTED_QUESTIONS = [
  "Berapa saldo saya?",
  "Berapa pengeluaran bulan ini?",
  "Pemasukan bulan lalu berapa?",
  "Kategori pengeluaran terbesar bulan ini?",
  "Pengeluaran minggu ini?",
  "Bagaimana progres tabungan saya?",
];

function detectPeriod(text, now) {
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  if (/\bhari ini\b/.test(text)) return { from: toLocalISODate(today), to: toLocalISODate(today), label: "hari ini" };
  if (/\bkemarin\b/.test(text)) {
    const d = toLocalISODate(addDays(today, -1));
    return { from: d, to: d, label: "kemarin" };
  }
  if (/\bminggu ini\b|\bpekan ini\b/.test(text)) {
    const back = (today.getDay() + 6) % 7; // week starts Monday
    return { from: toLocalISODate(addDays(today, -back)), to: toLocalISODate(today), label: "minggu ini" };
  }
  if (/\bbulan lalu\b|\bbulan kemarin\b/.test(text)) {
    const prev = addMonths(today, -1);
    return { from: toLocalISODate(startOfMonth(prev)), to: toLocalISODate(endOfMonth(prev)), label: `bulan ${MONTHS_ID[prev.getMonth()]}` };
  }
  if (/\btahun ini\b/.test(text)) {
    return { from: `${today.getFullYear()}-01-01`, to: toLocalISODate(today), label: `tahun ${today.getFullYear()}` };
  }
  if (/\b(semua|total keseluruhan|sejak awal)\b/.test(text)) return { from: null, to: null, label: "seluruh catatan" };
  return { from: toLocalISODate(startOfMonth(today)), to: toLocalISODate(today), label: `bulan ${MONTHS_ID[today.getMonth()]}` };
}

/**
 * @returns {{ handled: boolean, answer: string, basis?: string }}
 */
export function answerQuestion(input, { transactions = [], goals = [], now = new Date() } = {}) {
  const text = normalizeText(input);

  if (/\b(tabungan|nabung|target|tujuan)\b/.test(text)) {
    const progress = goalsProgress(goals);
    if (!progress) return { handled: true, answer: "Kamu belum punya tujuan tabungan. Buat satu di halaman Tabungan." };
    return {
      handled: true,
      answer: `Total progres ${goals.length} tujuan tabunganmu ${formatPercent(progress.ratio)}: ${formatRupiah(progress.current)} dari ${formatRupiah(progress.target)}.`,
      basis: "Dihitung dari jumlah terkumpul tiap tujuan tabungan.",
    };
  }

  if (!transactions.length) {
    return { handled: true, answer: "Belum ada transaksi yang tercatat, jadi belum ada yang bisa dihitung. Coba catat transaksi pertamamu." };
  }

  if (/\bsaldo\b|\bsisa uang\b/.test(text)) {
    const all = totals(transactions);
    return {
      handled: true,
      answer: `Saldo dari seluruh catatanmu ${formatRupiah(all.net)} (pemasukan ${formatRupiah(all.income)} − pengeluaran ${formatRupiah(all.expense)}).`,
      basis: `${all.count} transaksi tercatat`,
    };
  }

  const period = detectPeriod(text, now);
  const scoped = period.from ? inRange(transactions, period.from, period.to) : transactions;

  if (/\bkategori\b|\bpaling (banyak|boros|besar)\b|\bterbesar\b/.test(text)) {
    const [top, second] = categoryBreakdown(scoped, "expense");
    if (!top) return { handled: true, answer: `Belum ada pengeluaran ${period.label}.` };
    return {
      handled: true,
      answer:
        `Pengeluaran terbesar ${period.label}: ${top.label} ${formatRupiah(top.amount)} (${formatPercent(top.share)}).` +
        (second ? ` Berikutnya ${second.label} ${formatRupiah(second.amount)}.` : ""),
      basis: `${scoped.filter((t) => t.type === "expense").length} transaksi pengeluaran`,
    };
  }

  const sum = totals(scoped);
  const asksIncome = /\b(pemasukan|pendapatan|masuk|gaji)\b/.test(text);
  const asksExpense = /\b(pengeluaran|keluar|belanja|habis|boros)\b/.test(text);

  if (asksIncome && !asksExpense) {
    return { handled: true, answer: `Pemasukan ${period.label}: ${formatRupiah(sum.income)}.`, basis: `${scoped.filter((t) => t.type === "income").length} transaksi pemasukan` };
  }
  if (asksExpense && !asksIncome) {
    return { handled: true, answer: `Pengeluaran ${period.label}: ${formatRupiah(sum.expense)}.`, basis: `${scoped.filter((t) => t.type === "expense").length} transaksi pengeluaran` };
  }
  if (asksIncome || asksExpense || /\b(ringkasan|rekap|laporan|arus)\b/.test(text)) {
    return {
      handled: true,
      answer: `Ringkasan ${period.label}: pemasukan ${formatRupiah(sum.income)}, pengeluaran ${formatRupiah(sum.expense)}, selisih ${formatRupiah(sum.net)}.`,
      basis: `${sum.count} transaksi`,
    };
  }

  return { handled: false, answer: "" };
}
