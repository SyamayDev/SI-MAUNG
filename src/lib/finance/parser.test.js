import { test } from "node:test";
import assert from "node:assert/strict";
import { parseAmount, parseDigitNumber } from "./amount.js";
import { detectDate } from "./dates.js";
import { detectCategory, detectType } from "./classify.js";
import { isConfidentDraft, parseTransactionText } from "./parseTransaction.js";
import { normalizeText } from "./text.js";
import { EXAMPLE_PHRASES } from "./examples.js";

// Tuesday, 20 October 2026, 10:00 local time.
const NOW = new Date(2026, 9, 20, 10, 0);
const amountOf = (s) => parseAmount(normalizeText(s));

test("digit numbers with Indonesian and English separators", () => {
  assert.equal(parseDigitNumber("25000"), 25000);
  assert.equal(parseDigitNumber("25.000"), 25000);
  assert.equal(parseDigitNumber("1.250.000"), 1250000);
  assert.equal(parseDigitNumber("25,000"), 25000);
  assert.equal(parseDigitNumber("1,5"), 1.5);
  assert.equal(parseDigitNumber("2.5"), 2.5);
  assert.equal(parseDigitNumber("50.000,00"), 50000);
  assert.ok(Number.isNaN(parseDigitNumber("1.2.3")));
});

test("amounts with units and currency markers", () => {
  const cases = [
    ["beli kopi 25rb", 25000],
    ["beli kopi 25 rb", 25000],
    ["makan 25 ribu", 25000],
    ["bayar Rp25.000", 25000],
    ["Rp 1.250.000", 1250000],
    ["gaji 3jt", 3000000],
    ["dapat 1,5 juta", 1500000],
    ["dapat 1.5jt", 1500000],
    ["topup 100k", 100000],
    ["kemarin beli buku 45 ribu", 45000],
    ["sewa 2,5 jt", 2500000],
    ["dapat 1 juta 200 ribu", 1200000],
    ["beli pulsa goceng", 5000],
    ["parkir dua ribu rupiah", 2000],
  ];
  for (const [text, expected] of cases) {
    const r = amountOf(text);
    assert.equal(r.value, expected, text);
    assert.equal(r.ambiguous, false, text);
    assert.ok(r.confidence >= 0.9, text);
  }
});

test("spoken Indonesian number words", () => {
  const cases = [
    ["dua puluh lima ribu", 25000],
    ["seratus dua puluh lima ribu", 125000],
    ["tiga juta", 3000000],
    ["satu juta dua ratus ribu", 1200000],
    ["sejuta dua ratus ribu", 1200000],
    ["lima puluh ribu", 50000],
    ["dua ratus ribu", 200000],
    ["sebelas ribu", 11000],
    ["dua belas ribu", 12000],
    ["seratus lima belas ribu", 115000],
    ["setengah juta", 500000],
    ["satu setengah juta", 1500000],
    ["dua setengah juta", 2500000],
    ["seribu lima ratus rupiah", 1500],
    ["dua ribu lima ratus perak", 2500],
    ["sepuluh ribu", 10000],
    ["satu koma lima juta", 1500000],
    ["empat ratus lima puluh ribu", 450000],
    ["sembilan ratus sembilan puluh sembilan ribu", 999000],
  ];
  for (const [text, expected] of cases) assert.equal(amountOf(text).value, expected, text);
});

test("ambiguous or missing amounts are flagged, never invented", () => {
  const bare = amountOf("beli kopi 25");
  assert.equal(bare.value, 25);
  assert.equal(bare.ambiguous, true);
  assert.equal(bare.suggestion, 25000);
  assert.ok(bare.confidence < 0.5);

  const tail = amountOf("sejuta dua ratus");
  assert.equal(tail.value, 1200000);
  assert.equal(tail.ambiguous, true);

  const two = amountOf("kopi 25rb dan roti 15rb");
  assert.equal(two.value, 40000);
  assert.equal(two.ambiguous, true);

  assert.equal(amountOf("beli kopi").value, null);
  assert.equal(amountOf("").value, null);
  assert.equal(amountOf("beli dua kopi").value, null, "small spoken numbers without unit are quantities");
});

test("quantities, dates and times are not read as money", () => {
  assert.equal(amountOf("beli 2 kopi 30rb").value, 30000);
  assert.equal(amountOf("beli bakso 25 ribu 3 porsi").value, 25000);
  assert.equal(amountOf("bayar pajak tahun 2026 sebesar 500rb").value, 500000);
  assert.equal(amountOf("parkir 2 jam").value, null);
});

test("bare large numbers are accepted with moderate confidence", () => {
  const r = amountOf("gaji 3.000.000");
  assert.equal(r.value, 3000000);
  assert.equal(r.ambiguous, false);
  assert.ok(r.confidence >= 0.75 && r.confidence < 0.9);
});

test("transaction type detection uses whole words", () => {
  assert.equal(detectType(normalizeText("gajian tiga juta")).type, "income");
  assert.equal(detectType(normalizeText("terima transfer dari teman")).type, "income");
  assert.equal(detectType(normalizeText("dapat uang freelance")).type, "income");
  assert.equal(detectType(normalizeText("bayar listrik")).type, "expense");
  assert.equal(detectType(normalizeText("beli bensin")).type, "expense");
  assert.equal(detectType(normalizeText("dibayar klien")).type, "income", "dibayar ≠ bayar");
  assert.equal(detectType(normalizeText("pemasukan 50rb")).type, "income");
  assert.equal(detectType(normalizeText("pengeluaran 50rb")).type, "expense");
  const thanks = detectType(normalizeText("terima kasih 20rb"));
  assert.equal(thanks.explicit, false, "'terima kasih' is not income");
  const unknown = detectType(normalizeText("kopi 20rb"));
  assert.equal(unknown.type, "expense");
  assert.equal(unknown.explicit, false);
});

test("category detection respects transaction type", () => {
  assert.equal(detectCategory(normalizeText("beli nasi goreng"), "expense").category, "food");
  assert.equal(detectCategory(normalizeText("bayar listrik"), "expense").category, "bills");
  assert.equal(detectCategory(normalizeText("beli bensin"), "expense").category, "transportation");
  assert.equal(detectCategory(normalizeText("beli buku"), "expense").category, "education");
  assert.equal(detectCategory(normalizeText("beli air mineral"), "expense").category, "food");
  assert.equal(detectCategory(normalizeText("gajian"), "income").category, "salary");
  assert.equal(detectCategory(normalizeText("dapat uang freelance"), "income").category, "salary");
  assert.equal(detectCategory(normalizeText("terima transfer dari teman"), "income").category, "other");
  assert.equal(detectCategory(normalizeText("beli kado ulang tahun"), "expense").category, "gift");
});

test("relative and explicit dates in local time", () => {
  const d = (s) => detectDate(normalizeText(s), NOW).date;
  assert.equal(d("beli kopi"), "2026-10-20");
  assert.equal(detectDate("beli kopi", NOW).explicit, false);
  assert.equal(d("hari ini gajian"), "2026-10-20");
  assert.equal(d("tadi beli kopi"), "2026-10-20");
  assert.equal(d("kemarin beli buku"), "2026-10-19");
  assert.equal(d("kemarin lusa makan"), "2026-10-18");
  assert.equal(d("3 hari lalu bayar"), "2026-10-17");
  assert.equal(d("tiga hari yang lalu bayar"), "2026-10-17");
  assert.equal(d("tanggal 5 bayar kos"), "2026-10-05");
  assert.equal(d("tanggal 25 bayar kos"), "2026-09-25", "a day still ahead this month means last month");
  assert.equal(d("5 oktober bayar kos"), "2026-10-05");
  assert.equal(d("25 desember beli kado"), "2025-12-25", "future month without year means last year");
  assert.equal(d("tgl 2026-10-01"), "2026-10-01");
  assert.equal(d("15/10 beli sepatu"), "2026-10-15");
  assert.equal(d("hari senin beli kopi"), "2026-10-19");
  assert.equal(d("jumat lalu nonton"), "2026-10-16");
  assert.equal(detectDate(normalizeText("minggu lalu beli baju"), NOW).approximate, true);
});

test("dates near midnight are not shifted by UTC", () => {
  const earlyMorning = new Date(2026, 9, 20, 0, 30);
  assert.equal(detectDate("beli kopi", earlyMorning).date, "2026-10-20");
});

test("CLAUDE.md sample phrases parse into reviewable drafts", () => {
  const p = (s) => parseTransactionText(s, { now: NOW });

  let r = p("Tadi beli nasi goreng dua puluh lima ribu.");
  assert.equal(r.intent, "transaction");
  assert.deepEqual(
    { type: r.draft.type, amount: r.draft.amount, category: r.draft.category, description: r.draft.description, date: r.draft.transaction_date },
    { type: "expense", amount: 25000, category: "food", description: "Beli nasi goreng", date: "2026-10-20" }
  );

  r = p("Bayar listrik seratus dua puluh lima ribu rupiah.");
  assert.equal(r.draft.amount, 125000);
  assert.equal(r.draft.category, "bills");
  assert.equal(r.draft.description, "Bayar listrik");

  r = p("Gajian tiga juta rupiah hari ini.");
  assert.equal(r.draft.type, "income");
  assert.equal(r.draft.amount, 3000000);
  assert.equal(r.draft.category, "salary");
  assert.equal(r.draft.description, "Gajian");

  r = p("Dapat uang freelance satu juta dua ratus ribu.");
  assert.equal(r.draft.type, "income");
  assert.equal(r.draft.amount, 1200000);
  assert.equal(r.draft.category, "salary");
  assert.equal(r.draft.description, "Dapat uang freelance");

  r = p("Beli bensin lima puluh ribu.");
  assert.equal(r.draft.amount, 50000);
  assert.equal(r.draft.category, "transportation");

  r = p("Terima transfer dua ratus ribu dari teman.");
  assert.equal(r.draft.type, "income");
  assert.equal(r.draft.amount, 200000);
  assert.equal(r.draft.description, "Terima transfer dari teman");

  r = p("Kemarin beli buku 45 ribu.");
  assert.equal(r.draft.amount, 45000);
  assert.equal(r.draft.category, "education");
  assert.equal(r.draft.transaction_date, "2026-10-19");
  assert.equal(r.draft.description, "Beli buku");

  for (const s of ["Tadi beli nasi goreng dua puluh lima ribu.", "Gajian tiga juta rupiah hari ini."]) {
    assert.equal(isConfidentDraft(p(s)), true, s);
  }
});

test("unclear input asks for review instead of guessing", () => {
  const bare = parseTransactionText("beli kopi 25", { now: NOW });
  assert.equal(bare.intent, "transaction");
  assert.equal(isConfidentDraft(bare), false);
  assert.ok(bare.issues.some((i) => i.field === "amount"));

  const noAmount = parseTransactionText("beli kopi", { now: NOW });
  assert.equal(noAmount.intent, "transaction");
  assert.equal(noAmount.draft.amount, null);
  assert.ok(noAmount.issues.some((i) => i.field === "amount"));

  const noType = parseTransactionText("kopi 20rb", { now: NOW });
  assert.ok(noType.issues.some((i) => i.field === "type"));
  assert.equal(isConfidentDraft(noType), false);
});

test("non-transactions are recognised", () => {
  assert.equal(parseTransactionText("halo apa kabar", { now: NOW }).intent, "unknown");
  assert.equal(parseTransactionText("berapa pengeluaran bulan ini?", { now: NOW }).intent, "question");
  assert.equal(parseTransactionText("nabung 100 ribu", { now: NOW }).intent, "savings");
  assert.equal(parseTransactionText("", { now: NOW }).intent, "unknown");
});

test("every example phrase shown in the UI parses without doubts", () => {
  for (const phrase of EXAMPLE_PHRASES) {
    const r = parseTransactionText(phrase, { now: NOW });
    assert.equal(r.intent, "transaction", phrase);
    assert.equal(isConfidentDraft(r), true, phrase);
  }
});

test("slang, mixed digits and filler words", () => {
  const p = (s) => parseTransactionText(s, { now: NOW }).draft;
  assert.equal(p("aku tadi isi bensin 30rb ya").amount, 30000);
  assert.equal(p("aku tadi isi bensin 30rb ya").description, "Isi bensin");
  assert.equal(p("bayar parkir ceban").amount, 10000);
  assert.equal(p("TOP UP gopay Rp50.000").amount, 50000);
  assert.equal(p("dapet bonus 1,5jt dari kantor").type, "income");
  assert.equal(p("dapet bonus 1,5jt dari kantor").amount, 1500000);
});
