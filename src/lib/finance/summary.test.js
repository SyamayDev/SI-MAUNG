import { test } from "node:test";
import assert from "node:assert/strict";
import { buildInsights, categoryBreakdown, goalsProgress, monthlyNeed, monthlySeries, monthSummary, totals } from "./summary.js";
import { validateContribution, validateGoal, validateTransaction } from "./validate.js";
import { answerQuestion } from "./questions.js";
import { formatRupiah, formatSigned } from "./format.js";

const NOW = new Date(2026, 9, 20, 10, 0);
const tx = (type, amount, category, transaction_date, description = "x") => ({ type, amount, category, transaction_date, description });

const DATA = [
  tx("income", 5_000_000, "salary", "2026-10-01", "Gaji"),
  tx("expense", 300_000, "food", "2026-10-03", "Belanja dapur"),
  tx("expense", 200_000, "food", "2026-10-10", "Makan"),
  tx("expense", 500_000, "bills", "2026-10-05", "Listrik"),
  tx("expense", 400_000, "food", "2026-09-12", "Makan"),
  tx("income", 4_000_000, "salary", "2026-09-01", "Gaji"),
];

test("totals and month summary use only that month", () => {
  assert.deepEqual(totals(DATA), { income: 9_000_000, expense: 1_400_000, net: 7_600_000, count: 6 });
  const m = monthSummary(DATA, NOW);
  assert.equal(m.income, 5_000_000);
  assert.equal(m.expense, 1_000_000);
  assert.equal(m.label, "Oktober 2026");
});

test("category breakdown with shares", () => {
  const rows = categoryBreakdown(DATA.filter((t) => t.transaction_date >= "2026-10-01"), "expense");
  // Equal totals are ordered by label, so the result is deterministic.
  assert.equal(rows[0].category, "food");
  assert.equal(rows[0].amount, 500_000);
  assert.equal(rows[0].count, 2);
  assert.equal(rows[1].category, "bills");
  assert.equal(rows[1].amount, 500_000);
  assert.equal(rows.reduce((s, r) => s + r.share, 0), 1);
});

test("monthly series includes empty months", () => {
  const rows = monthlySeries(DATA, new Date(2026, 6, 1), NOW);
  assert.deepEqual(rows.map((r) => r.key), ["2026-07", "2026-08", "2026-09", "2026-10"]);
  assert.equal(rows[0].income, 0);
  assert.equal(rows[2].expense, 400_000);
});

test("insights are computed from data and absent without data", () => {
  assert.deepEqual(buildInsights([], NOW), []);
  const insights = buildInsights(DATA, NOW);
  const ids = insights.map((i) => i.id);
  assert.ok(ids.includes("top-category"));
  assert.ok(ids.includes("savings-rate"));
  // Oct 1–20 expense 1.000.000 vs Sep 1–20 expense 400.000 → +150%
  const compare = insights.find((i) => i.id === "month-compare");
  assert.ok(compare.detail.includes("150%"));
  for (const i of insights) assert.ok(i.basis, `${i.id} states its basis`);
});

test("goal progress and monthly need", () => {
  assert.equal(goalsProgress([]), null);
  const p = goalsProgress([{ target_amount: 1000, current_amount: 250 }, { target_amount: 1000, current_amount: 1500 }]);
  assert.equal(p.ratio, 0.625, "over-funded goals count at most their target");
  const need = monthlyNeed({ target_amount: 1_200_000, current_amount: 0, deadline: "2027-10-20" }, NOW);
  assert.equal(need.months, 12);
  assert.equal(need.perMonth, 100_000);
  assert.equal(monthlyNeed({ target_amount: 100, current_amount: 100, deadline: "2027-01-01" }, NOW), null);
});

test("transaction validation", () => {
  const ok = validateTransaction({ type: "expense", amount: 25000, description: " Kopi ", category: "food", transaction_date: "2026-10-20" }, { today: NOW });
  assert.equal(ok.valid, true);
  assert.equal(ok.value.description, "Kopi");

  const bad = validateTransaction({ type: "loan", amount: -5, description: "", category: "crypto", transaction_date: "2026-13-01" }, { today: NOW });
  assert.deepEqual(Object.keys(bad.errors).sort(), ["amount", "category", "description", "transaction_date", "type"]);

  assert.equal(validateTransaction({ type: "expense", amount: 1.5, description: "a", category: "food", transaction_date: "2026-10-20" }, { today: NOW }).errors.amount !== undefined, true);
  assert.equal(validateTransaction({ type: "expense", amount: NaN, description: "a", category: "food", transaction_date: "2026-10-20" }, { today: NOW }).valid, false);
  assert.equal(validateTransaction({ type: "expense", amount: 1, description: "a", category: "food", transaction_date: "2026-10-21" }, { today: NOW }).errors.transaction_date, "Tanggal tidak boleh di masa depan.");
});

test("goal and contribution validation", () => {
  assert.equal(validateGoal({ name: "Laptop", target_amount: 10_000_000, deadline: "2027-01-01" }, { today: NOW }).valid, true);
  assert.equal(validateGoal({ name: "", target_amount: 0, deadline: "2020-01-01" }, { today: NOW }).valid, false);
  assert.equal(validateContribution({ amount: 50_000, direction: "deposit" }, 0).delta, 50_000);
  assert.equal(validateContribution({ amount: 50_000, direction: "withdraw" }, 100_000).delta, -50_000);
  assert.equal(validateContribution({ amount: 150_000, direction: "withdraw" }, 100_000).valid, false);
  assert.equal(validateContribution({ amount: 0, direction: "deposit" }, 0).valid, false);
});

test("questions are answered from data only", () => {
  const ctx = { transactions: DATA, goals: [], now: NOW };
  assert.match(answerQuestion("berapa pengeluaran bulan ini?", ctx).answer, /1\.000\.000/);
  assert.match(answerQuestion("pemasukan bulan lalu berapa", ctx).answer, /4\.000\.000/);
  assert.match(answerQuestion("berapa saldo saya", ctx).answer, /7\.600\.000/);
  assert.match(answerQuestion("kategori terbesar bulan ini?", ctx).answer, /Tagihan|Makanan/);
  assert.equal(answerQuestion("siapa presiden indonesia?", ctx).handled, false);
  assert.match(answerQuestion("berapa saldo", { transactions: [], goals: [], now: NOW }).answer, /Belum ada transaksi/);
});

test("rupiah formatting", () => {
  assert.equal(formatRupiah(25000).replace(/\s/g, " "), "Rp 25.000");
  assert.equal(formatSigned(25000, "expense").replace(/\s/g, " "), "−Rp 25.000");
  assert.equal(formatSigned(25000, "income").replace(/\s/g, " "), "+Rp 25.000");
});
