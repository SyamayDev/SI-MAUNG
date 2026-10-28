import { test } from "node:test";
import assert from "node:assert/strict";
import { parseMoney, reconcileAIAmount } from "./indonesianMoneyParser.js";
import { isConfidentDraft, parseTransactionText } from "./parseTransaction.js";
import { validateTransaction } from "./validate.js";
import { CANONICAL_SLANG, UNCERTAIN_ALIASES } from "./moneyLexicon.js";

const NOW = new Date(2026, 9, 20, 10, 0);
const tx = (s) => parseTransactionText(s, { now: NOW });

test("required regression table (exact rupiah)", () => {
  const table = [
    ["gopek", 500],
    ["cepek", 100],
    ["seceng", 1_000],
    ["noceng", 2_000],
    ["goceng", 5_000],
    ["ceban", 10_000],
    ["goban", 50_000],
    ["cepek ceng", 100_000],
    ["sejuta", 1_000_000],
    ["setengah juta", 500_000],
    ["satu juta setengah", 1_500_000],
    ["satu setengah juta", 1_500_000],
    ["dua juta setengah", 2_500_000],
    ["dua setengah juta", 2_500_000],
    ["dua koma lima juta", 2_500_000],
    ["dua juta lima ratus ribu", 2_500_000],
    ["satu juta dua ratus lima puluh ribu", 1_250_000],
    ["tiga juta tujuh ratus lima puluh ribu", 3_750_000],
    ["dua setengah ribu", 2_500],
  ];
  for (const [input, expected] of table) {
    const r = parseMoney(input);
    assert.equal(r.value, expected, input);
    assert.ok(Number.isSafeInteger(r.value), `${input} is a safe integer`);
    // "cepek" is the one regional word: Rp100 literally, but it must still be confirmed
    if (input === "cepek") assert.deepEqual(r.choices, [100, 100_000]);
    else assert.equal(r.ambiguous, false, input);
  }
});

test("the reported bug: halves after the scale are added, never truncated", () => {
  assert.equal(parseMoney("pengeluaran dua juta setengah").value, 2_500_000);
  assert.equal(parseMoney("tiga juta setengah").value, 3_500_000);
  assert.equal(parseMoney("lima setengah juta").value, 5_500_000);
  assert.equal(parseMoney("dua ribu setengah").value, 2_500);
  assert.equal(parseMoney("dua juta seperempat").value, 2_250_000);
  assert.equal(parseMoney("seperempat juta").value, 250_000);
  assert.equal(parseMoney("tiga perempat juta").value, 750_000);
  assert.equal(parseMoney("dua juta dua ratus lima puluh ribu").value, 2_250_000);
  const r = tx("pengeluaran dua juta setengah");
  assert.equal(r.draft.amount, 2_500_000);
  assert.deepEqual(r.choices, [], "a clear phrase is not questioned");
  assert.equal(isConfidentDraft(r), true);
});

test("number composition (not just the first number in the sentence)", () => {
  const cases = [
    ["dua juta tiga ratus ribu", 2_300_000],
    ["dua juta tiga ratus empat puluh lima ribu", 2_345_000],
    ["seratus dua puluh lima ribu", 125_000],
    ["dua puluh lima ribu lima ratus", 25_500],
    ["sebelas ribu", 11_000],
    ["tujuh belas ribu", 17_000],
    ["sembilan ratus sembilan puluh sembilan ribu", 999_000],
    ["dua miliar", 2_000_000_000],
    ["satu miliar dua ratus juta", 1_200_000_000],
    ["seribu lima ratus", 1_500],
    ["dua koma dua lima juta", 2_250_000],
    ["dua juta", 2_000_000],
    ["tiga juta", 3_000_000],
    ["lima juta", 5_000_000],
    ["sepuluh juta", 10_000_000],
    ["seribu", 1_000],
    ["dua ribu", 2_000],
    ["lima ribu", 5_000],
    ["sepuluh ribu", 10_000],
    ["dua puluh ribu", 20_000],
    ["lima puluh ribu", 50_000],
    ["seratus ribu", 100_000],
  ];
  for (const [input, expected] of cases) assert.equal(parseMoney(input).value, expected, input);
});

test("slang dictionary: canonical words are exact, regional ones ask", () => {
  for (const [word, value] of Object.entries(CANONICAL_SLANG)) {
    if (word in UNCERTAIN_ALIASES) continue;
    const r = parseMoney(word);
    assert.equal(r.value, value, word);
    assert.equal(r.ambiguous, false, word);
  }
  for (const [word, alias] of Object.entries(UNCERTAIN_ALIASES)) {
    const r = parseMoney(word);
    assert.equal(r.ambiguous, true, word);
    assert.deepEqual(r.choices, alias.choices, word);
    assert.equal(tx(`bayar ${word}`).draft.amount, null, `${word} is never pre-filled`);
  }
  assert.equal(parseMoney("limpul ribu").value, 50_000);
  assert.equal(parseMoney("limpul rebu").value, 50_000);
  assert.equal(parseMoney("seratus limpul ribu").value, 150_000);
  assert.equal(parseMoney("gopek ceng").value, 500_000);
  assert.equal(parseMoney("nopek ceng").value, 200_000);
  assert.equal(parseMoney("gocap ceng").value, 50_000);
  assert.equal(parseMoney("cepek tiao").value, 100_000_000);
  assert.equal(parseMoney("cetiao").value, 1_000_000);
  assert.equal(parseMoney("gotiao").value, 5_000_000);
  assert.equal(parseMoney("noban").value, 20_000);
  assert.equal(parseMoney("ceceng").value, 1_000);
});

test("slang mixed with formal numbers and digits", () => {
  assert.equal(parseMoney("dua ceban").value, 20_000);
  assert.equal(parseMoney("3 goceng").value, 15_000);
  assert.equal(parseMoney("2 goban").value, 100_000);
  assert.equal(parseMoney("2 juta setengah").value, 2_500_000);
  assert.equal(parseMoney("1 juta dua ratus ribu").value, 1_200_000);
  assert.equal(parseMoney("Rp1,5 jt").value, 1_500_000);
  assert.equal(parseMoney("2jt500rb").value, 2_500_000);
  assert.equal(parseMoney("1/2 juta").value, 500_000);
  assert.equal(parseMoney("2 ½ juta").value, 2_500_000);
  // regional words
  assert.equal(parseMoney("seket ewu").value, 50_000);
  assert.equal(parseMoney("rong atus ewu").value, 200_000);
  assert.equal(parseMoney("sarebu").value, 1_000);
});

test("capitalisation, punctuation and whitespace do not matter", () => {
  for (const s of ["DUA JUTA SETENGAH", "  dua   juta   setengah  ", "Dua juta, setengah.", "dua-juta setengah!"]) {
    assert.equal(parseMoney(s).value, 2_500_000, s);
  }
});

test("speech-to-text artefacts are repaired safely", () => {
  assert.equal(parseMoney("duapuluhlima ribu").value, 25_000);
  assert.equal(parseMoney("seratusribu").value, 100_000);
  assert.equal(parseMoney("se ribu").value, 1_000);
  assert.equal(parseMoney("go ceng").value, 5_000);
  assert.equal(parseMoney("ce ban").value, 10_000);
  assert.equal(parseMoney("stengah juta").value, 500_000);
  assert.equal(parseMoney("Rp 2 500 000").value, 2_500_000);
  assert.equal(parseMoney("2 500 000").value, 2_500_000);
  // ordinary words are never split into numbers
  assert.equal(parseMoney("beli telur").value, null);
  assert.equal(parseMoney("satuan").value, null);
});

test("ambiguous phrases ask instead of guessing", () => {
  const literalOrColloquial = [
    ["dua juta lima ratus", [2_500_000, 2_000_500]],
    ["satu juta lima ratus", [1_500_000, 1_000_500]],
    ["sejuta dua", [1_200_000, 1_000_002]],
    ["dua ribu lima", [2_500, 2_005]],
    ["1 juta 500", [1_500_000, 1_000_500]],
  ];
  for (const [input, choices] of literalOrColloquial) {
    const r = parseMoney(input);
    assert.equal(r.ambiguous, true, input);
    assert.deepEqual(r.choices, choices, input);
  }
  const missingUnit = parseMoney("catat dua setengah");
  assert.equal(missingUnit.value, null);
  assert.deepEqual(missingUnit.choices, [2_500, 2_500_000]);
  assert.match(missingUnit.note, /Rp2\.500 atau Rp2\.500\.000/);

  const r = tx("transfer masuk satu juta lima ratus");
  assert.equal(r.draft.type, "income");
  assert.equal(r.draft.amount, null, "flagged, not saved as 1.000.500");
  assert.deepEqual(r.choices, [1_500_000, 1_000_500]);
  assert.equal(isConfidentDraft(r), false);
});

test("an unresolved amount cannot pass validation", () => {
  const r = tx("catat dua setengah");
  assert.equal(validateTransaction({ ...r.draft, description: "Tes" }).valid, false);
  const chosen = validateTransaction({ ...r.draft, description: "Tes", amount: r.choices[1] }, { today: NOW });
  assert.equal(chosen.valid, true);
  assert.equal(chosen.value.amount, 2_500_000);
});

test("multiple amounts, explicit calculations and per-item prices", () => {
  const two = parseMoney("kopi 25rb dan roti 15rb");
  assert.equal(two.ambiguous, true);
  assert.deepEqual(two.choices, [40_000, 25_000, 15_000]);

  const sum = parseMoney("lima ratus ribu ditambah dua ratus ribu");
  assert.equal(sum.value, 700_000);
  assert.equal(sum.ambiguous, false);
  assert.ok(sum.calculation);

  assert.equal(parseMoney("500rb + 200rb").value, 700_000);
  assert.equal(parseMoney("setengah dari dua juta").value, 1_000_000);
  assert.equal(parseMoney("3 x 25rb").value, 75_000);
  assert.equal(parseMoney("parkir 2 kali 5 ribu").value, 10_000);
  assert.equal(parseMoney("satu juta dikurangi dua ratus ribu").value, 800_000);
  assert.equal(parseMoney("tiga ratus ribu dibagi tiga").value, 100_000);

  const perItem = parseMoney("beli 3 kopi masing masing 20 ribu");
  assert.equal(perItem.ambiguous, true);
  assert.deepEqual(perItem.choices, [60_000, 20_000]);

  const repeated = parseMoney("25 ribu ya 25 ribu");
  assert.deepEqual(repeated.choices, [25_000, 50_000]);
});

test("corrections, estimates and negative wording", () => {
  assert.equal(parseMoney("20 ribu eh salah 25 ribu").value, 25_000);
  assert.equal(parseMoney("bukan 20 ribu tapi 25 ribu").value, 25_000);
  assert.equal(parseMoney("ralat, 30 ribu").value, 30_000);
  const fixed = tx("beli kopi 20 ribu eh salah 25 ribu");
  assert.equal(fixed.draft.amount, 25_000);
  assert.equal(fixed.draft.description, "Kopi");
  assert.equal(isConfidentDraft(fixed), false, "a corrected amount is reviewed");

  for (const s of ["sekitar 50 ribu", "50an ribu", "sejuta lebih", "kurang lebih 200 ribu", "dua jutaan"]) {
    const r = parseMoney(s);
    assert.equal(r.approximate, true, s);
    assert.ok(r.value > 0, s);
  }
  assert.equal(isConfidentDraft(tx("beli kopi sekitar 50 ribu")), false);

  const neg = tx("saldo dompet minus 50 ribu buat parkir");
  assert.equal(neg.draft.type, "expense");
  assert.equal(neg.draft.amount, 50_000, "the stored amount is always positive; direction comes from the type");
  assert.ok(neg.issues.some((i) => i.field === "type"));
});

test("transaction intent: type, amount, description, category, counterparty", () => {
  let r = tx("tadi beli nasi goreng dua puluh ribu");
  assert.deepEqual([r.draft.type, r.draft.amount, r.draft.description, r.draft.category], ["expense", 20_000, "Nasi goreng", "food"]);

  r = tx("aku dapat gaji tiga juta setengah");
  assert.deepEqual([r.draft.type, r.draft.amount, r.draft.description, r.draft.category], ["income", 3_500_000, "Gaji", "salary"]);

  r = tx("bayar listrik ceban");
  assert.deepEqual([r.draft.type, r.draft.amount, r.draft.description, r.draft.category], ["expense", 10_000, "Listrik", "bills"]);

  r = tx("pengeluaran dua juta setengah buat laptop");
  assert.deepEqual([r.draft.type, r.draft.amount, r.draft.description], ["expense", 2_500_000, "Laptop"]);

  r = tx("dapet goban dari ibu");
  assert.deepEqual([r.draft.type, r.draft.amount], ["income", 50_000]);
  assert.deepEqual(r.counterparty, { role: "source", name: "Ibu" });

  r = tx("beli kopi di kopi kenangan 30rb");
  assert.deepEqual(r.counterparty, { role: "merchant", name: "Kopi kenangan" });

  r = tx("transfer ke budi 100 ribu");
  assert.equal(r.draft.type, "expense");
  assert.deepEqual(r.counterparty, { role: "recipient", name: "Budi" });
});

test("refunds follow the direction of the money", () => {
  const bare = tx("refund pembelian lima puluh ribu");
  assert.equal(bare.draft.type, "income");
  assert.equal(bare.draft.amount, 50_000);
  assert.equal(bare.draft.description, "Refund pembelian");
  assert.ok(bare.issues.some((i) => i.field === "type" && /Refund/.test(i.message)), "direction must be confirmed");

  assert.equal(tx("dapat refund 50 ribu dari shopee").draft.type, "income");
  assert.equal(tx("refund masuk 75 ribu").draft.type, "income");
  assert.equal(tx("refund ke pelanggan 50 ribu").draft.type, "expense");
  assert.equal(tx("kembalikan uang teman 20 ribu").draft.type, "expense");
});

test("quantities, times and dates are not money", () => {
  assert.equal(parseMoney("beli daging setengah kilo 60 ribu").value, 60_000);
  assert.equal(parseMoney("setengah harga 100 ribu").value, 100_000);
  assert.equal(parseMoney("parkir 2 jam").value, null);
  assert.equal(parseMoney("jam setengah dua").value, null);
  assert.equal(parseMoney("beli dua kopi").value, null);
  assert.equal(parseMoney("beli bakso 25 ribu 3 porsi").value, 25_000);
});

test("integer safety and limits", () => {
  const big = parseMoney("sembilan ratus sembilan puluh sembilan triliun");
  assert.ok(Number.isSafeInteger(big.value));
  assert.equal(validateTransaction({ type: "expense", amount: big.value, description: "x", category: "other", transaction_date: "2026-10-20" }, { today: NOW }).valid, false);
  const odd = parseMoney("1,2345678 juta");
  assert.equal(odd.ambiguous, true, "non-whole rupiah is never stored silently");
  assert.equal(parseMoney("2,5").ambiguous, true);
  for (const s of ["dua juta setengah", "seperempat juta", "satu koma tujuh lima juta"]) assert.ok(Number.isSafeInteger(parseMoney(s).value), s);
});

test("the same transcript always gives the same draft (no drift between retries)", () => {
  const a = tx("Gajian tiga juta setengah hari ini");
  const b = tx("Gajian tiga juta setengah hari ini");
  assert.deepEqual(a, b);
});

test("AI amounts are checked against the deterministic parser", () => {
  const agree = reconcileAIAmount("gaji dua juta setengah", 2_500_000);
  assert.deepEqual([agree.amount, agree.mismatch], [2_500_000, false]);

  const disagree = reconcileAIAmount("gaji dua juta setengah", 2_000_000);
  assert.equal(disagree.amount, 2_500_000, "the parser wins over the model");
  assert.equal(disagree.mismatch, true);

  const unsure = reconcileAIAmount("dua juta lima ratus", 2_500_000);
  assert.equal(unsure.amount, null);
  assert.deepEqual(unsure.choices, [2_500_000, 2_000_500]);

  const onlyAI = reconcileAIAmount("bayar yang kemarin itu", 45_000);
  assert.equal(onlyAI.amount, 45_000);
  assert.ok(onlyAI.note, "an amount only the model found is flagged");

  assert.equal(reconcileAIAmount("bayar yang kemarin itu", 1.5).amount, null, "non-integer model output is rejected");
  assert.equal(reconcileAIAmount("bayar yang kemarin itu", "45000").amount, null, "non-number model output is rejected");
});
