import { test } from "node:test";
import assert from "node:assert/strict";
import { answerQuestion } from "./questions.js";
import { parseTransactionText } from "./parseTransaction.js";

// Synthetic data only. "Today" is Tuesday 20 October 2026.
const NOW = new Date(2026, 9, 20, 10, 0);
const TX = [
  { id: 1, type: "income", amount: 3_000_000, category: "salary", description: "Gaji", transaction_date: "2026-10-01" },
  { id: 2, type: "expense", amount: 25_000, category: "food", description: "Nasi goreng", transaction_date: "2026-10-19" },
  { id: 3, type: "expense", amount: 20_000, category: "food", description: "Kopi susu", transaction_date: "2026-10-20" },
  { id: 4, type: "expense", amount: 150_000, category: "bills", description: "Listrik", transaction_date: "2026-10-05" },
  { id: 5, type: "expense", amount: 50_000, category: "transportation", description: "Bensin", transaction_date: "2026-09-10" },
  { id: 6, type: "expense", amount: 30_000, category: "food", description: "Kopi", transaction_date: "2026-09-12" },
];
const GOALS = [{ id: 1, name: "Laptop", target_amount: 8_000_000, current_amount: 2_000_000 }];
const ask = (q, opts = {}) => answerQuestion(q, { transactions: TX, goals: GOALS, now: NOW, ...opts });

test("the reported question: greeting + possessive suffix", () => {
  const r = ask("halo berapa pengeluaranku bulan ini");
  assert.equal(r.handled, true);
  assert.match(r.answer, /^Halo! Pengeluaran bulan Oktober: Rp\s?195\.000\./);
  assert.equal(r.basis, "3 transaksi pengeluaran");
  // and the chat routes it as a question, not a transaction
  assert.equal(parseTransactionText("halo berapa pengeluaranku bulan ini", { now: NOW }).intent, "question");
});

test("suffixes and synonyms", () => {
  assert.match(ask("pemasukanku bulan ini berapa").answer, /Pemasukan bulan Oktober: Rp\s?3\.000\.000/);
  assert.match(ask("saldoku berapa").answer, /Saldo seluruh catatanmu: Rp\s?2\.725\.000/);
  assert.match(ask("duitku tinggal berapa").answer, /Saldo/);
  assert.match(ask("habis berapa bulan lalu").answer, /Pengeluaran bulan September: Rp\s?80\.000/);
});

test("greetings, thanks and help are answered", () => {
  assert.equal(ask("halo").kind, "greeting");
  assert.equal(ask("assalamualaikum").kind, "greeting");
  assert.equal(ask("makasih ya").kind, "thanks");
  const help = ask("kamu bisa apa?");
  assert.equal(help.kind, "help");
  assert.ok(help.items.length >= 3);
});

test("periods: today, yesterday, this/last week, named month, last N days", () => {
  assert.match(ask("pengeluaran hari ini").answer, /hari ini: Rp\s?20\.000/);
  assert.match(ask("pengeluaran kemarin berapa").answer, /kemarin: Rp\s?25\.000/);
  assert.match(ask("pengeluaran minggu ini").answer, /minggu ini: Rp\s?45\.000/);
  assert.match(ask("pengeluaran bulan september").answer, /September 2026: Rp\s?80\.000/);
  assert.match(ask("pengeluaran 7 hari terakhir").answer, /7 hari terakhir: Rp\s?45\.000/);
  assert.match(ask("pemasukan tahun ini").answer, /tahun 2026: Rp\s?3\.000\.000/);
});

test("topic filters: category and description words", () => {
  assert.match(ask("berapa pengeluaran makan bulan ini").answer, /untuk Makanan & Minuman bulan Oktober: Rp\s?45\.000/);
  assert.match(ask("habis berapa buat kopi semua").answer, /untuk Makanan & Minuman seluruh catatan: Rp\s?75\.000/);
  assert.match(ask("berapa kali beli bensin tahun ini").answer, /Ada 1 pengeluaran untuk Transportasi/);
  // a generic spending word does not narrow to one category
  assert.match(ask("berapa belanjaku bulan ini").answer, /^Pengeluaran bulan Oktober: Rp\s?195\.000/);
});

test("latest, biggest, average, comparison and category ranking", () => {
  const latest = ask("transaksi terakhir apa?");
  assert.equal(latest.kind, "latest");
  assert.equal(latest.items.length, 3);
  assert.match(latest.items[0], /Kopi susu/);

  assert.match(ask("pengeluaran terbesar bulan ini").answer, /Listrik Rp\s?150\.000/);
  assert.match(ask("rata-rata pengeluaran per hari bulan ini").answer, /Rp\s?9\.750 per hari \(Rp\s?195\.000 selama 20 hari\)/);
  const cmp = ask("bulan ini lebih boros dari bulan lalu?");
  assert.equal(cmp.kind, "compare");
  assert.match(cmp.answer, /Pengeluaran 1–20 Oktober: Rp\s?195\.000/);
  assert.match(ask("kategori pengeluaran terbesar bulan ini?").answer, /Tagihan & Langganan Rp\s?150\.000/);
});

test("savings questions use stored progress", () => {
  assert.match(ask("progres tabunganku gimana").answer, /25%/);
  assert.match(ask("tabungan laptop sudah berapa").answer, /“Laptop”: Rp\s?2\.000\.000 dari Rp\s?8\.000\.000/);
  assert.match(ask("tabungan", { goals: [] }).answer, /belum punya tujuan tabungan/);
});

test("honest answers when there is no data or the question is out of scope", () => {
  assert.match(ask("berapa pengeluaran bulan ini", { transactions: [] }).answer, /Belum ada transaksi/);
  assert.equal(ask("siapa presiden indonesia").handled, false);
  assert.equal(ask("saham apa yang bagus").kind, "advice");
});

test("a period question without an amount is not mistaken for a transaction", () => {
  for (const q of ["pengeluaran makan minggu ini", "Pengeluaran makan minggu ini?", "pemasukan bulan lalu", "transaksi terakhir"]) {
    assert.equal(parseTransactionText(q, { now: NOW }).intent, "question", q);
  }
  assert.equal(parseTransactionText("beli kopi 20 ribu hari ini", { now: NOW }).intent, "transaction");
});
