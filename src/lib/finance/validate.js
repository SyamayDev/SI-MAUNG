/**
 * Validation for anything that is about to become a stored transaction —
 * typed forms, voice/text parser drafts, and (untrusted) AI output alike.
 */
import { CATEGORY_VALUES } from "./categories.js";
import { parseLocalISODate, toLocalISODate } from "./dates.js";

export const LIMITS = {
  maxAmount: 1_000_000_000_000,
  descriptionMax: 120,
  notesMax: 500,
  goalNameMax: 60,
};

const MIN_DATE = "2000-01-01";

/**
 * @param {object} input { type, amount, description, category, transaction_date, notes }
 * @returns {{ valid: boolean, errors: Record<string,string>, value: object }}
 */
export function validateTransaction(input, { today = new Date() } = {}) {
  const errors = {};
  const type = input?.type;
  if (type !== "income" && type !== "expense") errors.type = "Pilih pemasukan atau pengeluaran.";

  const amount = typeof input?.amount === "string" ? Number(input.amount) : input?.amount;
  if (typeof amount !== "number" || !Number.isFinite(amount) || amount <= 0) {
    errors.amount = "Nominal harus lebih dari Rp0.";
  } else if (!Number.isInteger(amount)) {
    errors.amount = "Gunakan nominal rupiah bulat (tanpa sen).";
  } else if (amount > LIMITS.maxAmount) {
    errors.amount = "Nominal terlalu besar.";
  }

  const description = String(input?.description ?? "").replace(/\s+/g, " ").trim();
  if (!description) errors.description = "Tulis keterangan singkat, misalnya “Makan siang”.";
  else if (description.length > LIMITS.descriptionMax) errors.description = `Maksimal ${LIMITS.descriptionMax} karakter.`;

  const category = String(input?.category || "");
  if (!CATEGORY_VALUES.includes(category)) errors.category = "Pilih kategori.";

  const date = String(input?.transaction_date || "");
  const parsed = parseLocalISODate(date);
  if (!parsed) errors.transaction_date = "Tanggal tidak valid.";
  else if (date > toLocalISODate(today)) errors.transaction_date = "Tanggal tidak boleh di masa depan.";
  else if (date < MIN_DATE) errors.transaction_date = "Tanggal terlalu lama.";

  const notes = String(input?.notes ?? "").trim();
  if (notes.length > LIMITS.notesMax) errors.notes = `Catatan maksimal ${LIMITS.notesMax} karakter.`;

  return {
    valid: Object.keys(errors).length === 0,
    errors,
    value: { type, amount, description, category, transaction_date: date, notes: notes || null },
  };
}

/** Savings goal create/edit. */
export function validateGoal(input, { today = new Date() } = {}) {
  const errors = {};
  const name = String(input?.name ?? "").replace(/\s+/g, " ").trim();
  if (!name) errors.name = "Beri nama tujuanmu.";
  else if (name.length > LIMITS.goalNameMax) errors.name = `Maksimal ${LIMITS.goalNameMax} karakter.`;

  const target = Number(input?.target_amount);
  if (!Number.isFinite(target) || target <= 0 || !Number.isInteger(target)) errors.target_amount = "Target harus lebih dari Rp0.";
  else if (target > LIMITS.maxAmount) errors.target_amount = "Target terlalu besar.";

  let deadline = input?.deadline ? String(input.deadline) : null;
  if (deadline) {
    if (!parseLocalISODate(deadline)) errors.deadline = "Tanggal tidak valid.";
    else if (deadline < toLocalISODate(today)) errors.deadline = "Batas waktu sudah lewat.";
  } else deadline = null;

  return { valid: Object.keys(errors).length === 0, errors, value: { name, target_amount: target, deadline } };
}

/** Deposit (+) or withdrawal (−) on a goal; `current` is the stored progress. */
export function validateContribution({ amount, direction }, current) {
  const value = Number(amount);
  if (!Number.isFinite(value) || value <= 0 || !Number.isInteger(value)) {
    return { valid: false, error: "Nominal harus lebih dari Rp0." };
  }
  if (direction === "withdraw" && value > Number(current || 0)) {
    return { valid: false, error: "Penarikan melebihi saldo tabungan tujuan ini." };
  }
  return { valid: true, error: "", delta: direction === "withdraw" ? -value : value };
}
