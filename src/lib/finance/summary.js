/**
 * Aggregations and insights computed ONLY from the user's stored
 * transactions. Every insight carries the period and data basis it was
 * computed from; with too little data, nothing is claimed.
 */
import { categoryLabel } from "./categories.js";
import { addMonths, endOfMonth, monthKey, MONTHS_ID, parseLocalISODate, startOfMonth, toLocalISODate } from "./dates.js";
import { formatDate, formatPercent, formatRupiah } from "./format.js";

const amountOf = (t) => Number(t.amount) || 0;

export function totals(transactions) {
  let income = 0;
  let expense = 0;
  for (const t of transactions) {
    if (t.type === "income") income += amountOf(t);
    else if (t.type === "expense") expense += amountOf(t);
  }
  return { income, expense, net: income - expense, count: transactions.length };
}

/** Transactions with transaction_date within [from, to] (inclusive, "YYYY-MM-DD"). */
export function inRange(transactions, from, to) {
  return transactions.filter((t) => {
    const d = String(t.transaction_date || "").slice(0, 10);
    return (!from || d >= from) && (!to || d <= to);
  });
}

export function monthBounds(date) {
  return { from: toLocalISODate(startOfMonth(date)), to: toLocalISODate(endOfMonth(date)) };
}

export function monthSummary(transactions, date = new Date()) {
  const { from, to } = monthBounds(date);
  return { ...totals(inRange(transactions, from, to)), from, to, label: `${MONTHS_ID[date.getMonth()]} ${date.getFullYear()}` };
}

/** Per-category totals for one type, largest first, with share of the type total. */
export function categoryBreakdown(transactions, type = "expense") {
  const map = new Map();
  let sum = 0;
  for (const t of transactions) {
    if (t.type !== type) continue;
    const key = t.category || "other";
    const entry = map.get(key) || { category: key, label: categoryLabel(key), amount: 0, count: 0 };
    entry.amount += amountOf(t);
    entry.count += 1;
    map.set(key, entry);
    sum += amountOf(t);
  }
  return [...map.values()]
    .map((e) => ({ ...e, share: sum > 0 ? e.amount / sum : 0 }))
    .sort((a, b) => b.amount - a.amount || a.label.localeCompare(b.label, "id"));
}

/** One row per calendar month between from and to (inclusive), empty months included. */
export function monthlySeries(transactions, fromDate, toDate) {
  const rows = [];
  const index = new Map();
  for (let d = startOfMonth(fromDate); d <= toDate; d = addMonths(d, 1)) {
    const row = { key: monthKey(d), label: `${MONTHS_ID[d.getMonth()].slice(0, 3)} ${String(d.getFullYear()).slice(2)}`, income: 0, expense: 0 };
    index.set(row.key, row);
    rows.push(row);
  }
  for (const t of transactions) {
    const d = parseLocalISODate(t.transaction_date);
    if (!d) continue;
    const row = index.get(monthKey(d));
    if (!row) continue;
    if (t.type === "income") row.income += amountOf(t);
    else if (t.type === "expense") row.expense += amountOf(t);
  }
  return rows.map((r) => ({ ...r, net: r.income - r.expense }));
}

/** Daily expense totals for the days of a month up to `until` (for sparklines). */
export function dailyExpense(transactions, date = new Date(), until = date) {
  const start = startOfMonth(date);
  const last = Math.min(endOfMonth(date).getDate(), until.getMonth() === date.getMonth() ? until.getDate() : 31);
  const days = Array.from({ length: last }, (_, i) => ({ day: i + 1, amount: 0 }));
  const { from, to } = monthBounds(date);
  for (const t of inRange(transactions, from, to)) {
    if (t.type !== "expense") continue;
    const d = parseLocalISODate(t.transaction_date);
    if (d && d >= start && d.getDate() <= last) days[d.getDate() - 1].amount += amountOf(t);
  }
  return days;
}

/**
 * Plain-language observations for the current month. Each item:
 * { id, tone: "neutral"|"good"|"watch", title, detail, basis }.
 */
export function buildInsights(transactions, now = new Date()) {
  const insights = [];
  const month = monthSummary(transactions, now);
  const monthTx = inRange(transactions, month.from, month.to);
  const expenses = monthTx.filter((t) => t.type === "expense");
  const dayOfMonth = now.getDate();
  const periodLabel = `1–${formatDate(now, "dayMonth")}`;

  if (expenses.length) {
    const [top] = categoryBreakdown(monthTx, "expense");
    insights.push({
      id: "top-category",
      tone: "neutral",
      title: `${top.label} paling banyak menyerap pengeluaranmu`,
      detail: `${formatRupiah(top.amount)} atau ${formatPercent(top.share)} dari total pengeluaran ${month.label}.`,
      basis: `${expenses.length} transaksi pengeluaran, ${periodLabel}`,
    });

    const biggest = expenses.reduce((a, b) => (amountOf(b) > amountOf(a) ? b : a));
    insights.push({
      id: "largest",
      tone: "neutral",
      title: "Pengeluaran tunggal terbesar",
      detail: `${biggest.description} — ${formatRupiah(biggest.amount)} (${formatDate(biggest.transaction_date, "dayMonth")}).`,
      basis: `${expenses.length} transaksi pengeluaran, ${periodLabel}`,
    });

    insights.push({
      id: "daily-average",
      tone: "neutral",
      title: "Rata-rata pengeluaran harian",
      detail: `${formatRupiah(month.expense / dayOfMonth)} per hari selama ${dayOfMonth} hari pertama ${month.label}.`,
      basis: `Total ${formatRupiah(month.expense)} ÷ ${dayOfMonth} hari`,
    });
  }

  // Fair comparison: the same day range of the previous month.
  const prev = addMonths(now, -1);
  const prevFrom = toLocalISODate(startOfMonth(prev));
  const prevTo = toLocalISODate(new Date(prev.getFullYear(), prev.getMonth(), Math.min(dayOfMonth, endOfMonth(prev).getDate())));
  const prevExpense = totals(inRange(transactions, prevFrom, prevTo)).expense;
  if (prevExpense > 0 && month.expense > 0) {
    const change = (month.expense - prevExpense) / prevExpense;
    if (Math.abs(change) >= 0.05) {
      insights.push({
        id: "month-compare",
        tone: change > 0 ? "watch" : "good",
        title: change > 0 ? "Pengeluaran naik dibanding bulan lalu" : "Pengeluaran turun dibanding bulan lalu",
        detail: `${change > 0 ? "Naik" : "Turun"} ${formatPercent(Math.abs(change))}: ${formatRupiah(month.expense)} vs ${formatRupiah(prevExpense)}.`,
        basis: `${periodLabel} dibanding tanggal yang sama bulan ${MONTHS_ID[prev.getMonth()]}`,
      });
    }
  }

  if (month.income > 0) {
    const rate = (month.income - month.expense) / month.income;
    insights.push({
      id: "savings-rate",
      tone: rate >= 0 ? "good" : "watch",
      title: rate >= 0 ? "Bagian pemasukan yang tersisa" : "Pengeluaran melebihi pemasukan",
      detail:
        rate >= 0
          ? `${formatPercent(rate)} dari pemasukan ${month.label} belum terpakai (${formatRupiah(month.net)}).`
          : `Selisih ${formatRupiah(Math.abs(month.net))} di ${month.label}.`,
      basis: `Pemasukan ${formatRupiah(month.income)}, pengeluaran ${formatRupiah(month.expense)}`,
    });
  }

  return insights;
}

/** Overall progress across goals: Σ current / Σ target (null when there are no goals). */
export function goalsProgress(goals) {
  const target = goals.reduce((s, g) => s + (Number(g.target_amount) || 0), 0);
  const current = goals.reduce((s, g) => s + Math.min(Number(g.current_amount) || 0, Number(g.target_amount) || 0), 0);
  return target > 0 ? { ratio: current / target, current, target } : null;
}

/** How much per month is still needed to reach a goal by its deadline. */
export function monthlyNeed(goal, now = new Date()) {
  const remaining = Math.max(0, (Number(goal.target_amount) || 0) - (Number(goal.current_amount) || 0));
  const deadline = parseLocalISODate(goal.deadline);
  if (!deadline || remaining === 0) return null;
  const months = (deadline.getFullYear() - now.getFullYear()) * 12 + (deadline.getMonth() - now.getMonth());
  if (months <= 0) return { remaining, months: 0, perMonth: remaining };
  return { remaining, months, perMonth: Math.ceil(remaining / months) };
}
