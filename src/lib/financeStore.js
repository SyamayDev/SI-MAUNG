/**
 * Single source of truth for the signed-in user's transactions and savings
 * goals. React reads it with useSyncExternalStore (see context/FinanceContext);
 * the 3D scene can read it too. State only changes after Supabase confirms a
 * write — nothing is shown as saved before the server says so.
 */
import * as tx from "../services/transactionService";
import * as savings from "../services/savingsService";
import { toUserMessage } from "./errors";
import { cue } from "./sceneStore";

const listeners = new Set();
let state = {
  userId: null,
  transactions: [],
  txStatus: "idle", // idle | loading | ready | error
  txError: "",
  goals: [],
  goalsStatus: "idle",
  goalsError: "",
};
let loadToken = 0;

const emit = () => listeners.forEach((l) => l());
function set(patch) {
  state = { ...state, ...patch };
  emit();
}

export const financeStore = {
  subscribe(listener) {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },
  getState: () => state,
};

const byDateDesc = (a, b) =>
  String(b.transaction_date).localeCompare(String(a.transaction_date)) || String(b.created_at || "").localeCompare(String(a.created_at || ""));

export function resetFinance() {
  loadToken++;
  state = { userId: null, transactions: [], txStatus: "idle", txError: "", goals: [], goalsStatus: "idle", goalsError: "" };
  emit();
}

export async function loadTransactions() {
  const { userId } = state;
  if (!userId) return;
  const token = loadToken;
  set({ txStatus: "loading", txError: "" });
  const { data, error } = await tx.listTransactions(userId);
  if (token !== loadToken) return; // user changed meanwhile
  if (error) set({ txStatus: "error", txError: toUserMessage(error, "Transaksi gagal dimuat.") });
  else set({ txStatus: "ready", transactions: (data || []).slice().sort(byDateDesc) });
}

export async function loadGoals() {
  const { userId } = state;
  if (!userId) return;
  const token = loadToken;
  set({ goalsStatus: "loading", goalsError: "" });
  const { data, error } = await savings.listGoals(userId);
  if (token !== loadToken) return;
  if (error) set({ goalsStatus: "error", goalsError: toUserMessage(error, "Tujuan tabungan gagal dimuat.") });
  else set({ goalsStatus: "ready", goals: data || [] });
}

/** Called when the signed-in user changes. */
export function bindUser(userId) {
  if (state.userId === userId) return;
  resetFinance();
  if (!userId) return;
  state = { ...state, userId };
  loadTransactions();
  loadGoals();
}

const notFound = (error) => error?.code === "NOT_FOUND";

/* ---------- transactions ---------- */

export async function addTransaction(value, source = "manual") {
  if (!state.userId) return { error: "Anda belum masuk." };
  const { data, error } = await tx.createTransaction(state.userId, value, source);
  if (error) return { error: toUserMessage(error, "Transaksi gagal disimpan.") };
  set({ transactions: [data, ...state.transactions].sort(byDateDesc) });
  cue("saved");
  return { data };
}

export async function editTransaction(id, value) {
  if (!state.userId) return { error: "Anda belum masuk." };
  const { data, error } = await tx.updateTransaction(state.userId, id, value);
  if (error) {
    if (notFound(error)) loadTransactions();
    return { error: notFound(error) ? "Transaksi sudah tidak ada." : toUserMessage(error, "Perubahan gagal disimpan.") };
  }
  set({ transactions: state.transactions.map((t) => (t.id === id ? data : t)).sort(byDateDesc) });
  return { data };
}

export async function removeTransaction(id) {
  if (!state.userId) return { error: "Anda belum masuk." };
  const { error } = await tx.deleteTransaction(state.userId, id);
  if (error && !notFound(error)) return { error: toUserMessage(error, "Transaksi gagal dihapus.") };
  set({ transactions: state.transactions.filter((t) => t.id !== id) });
  return { data: true };
}

/* ---------- savings goals ---------- */

export async function addGoal(value) {
  if (!state.userId) return { error: "Anda belum masuk." };
  const { data, error } = await savings.createGoal(state.userId, value);
  if (error) return { error: toUserMessage(error, "Tujuan tabungan gagal dibuat.") };
  set({ goals: [data, ...state.goals] });
  return { data };
}

export async function editGoal(id, value) {
  if (!state.userId) return { error: "Anda belum masuk." };
  const { data, error } = await savings.updateGoal(state.userId, id, value);
  if (error) return { error: notFound(error) ? "Tujuan sudah tidak ada." : toUserMessage(error, "Perubahan gagal disimpan.") };
  set({ goals: state.goals.map((g) => (g.id === id ? data : g)) });
  return { data };
}

export async function removeGoal(id) {
  if (!state.userId) return { error: "Anda belum masuk." };
  const { error } = await savings.deleteGoal(state.userId, id);
  if (error && !notFound(error)) return { error: toUserMessage(error, "Tujuan gagal dihapus.") };
  set({ goals: state.goals.filter((g) => g.id !== id) });
  return { data: true };
}

export async function contributeGoal(id, delta) {
  if (!state.userId) return { error: "Anda belum masuk." };
  const { data, error } = await savings.contributeToGoal(state.userId, id, delta);
  if (error) {
    const messages = {
      INSUFFICIENT: "Penarikan melebihi saldo tabungan tujuan ini.",
      CONFLICT: "Data berubah di perangkat lain. Muat ulang lalu coba lagi.",
      NOT_FOUND: "Tujuan sudah tidak ada.",
    };
    return { error: messages[error.code] || toUserMessage(error, "Setoran gagal disimpan.") };
  }
  set({ goals: state.goals.map((g) => (g.id === id ? data : g)) });
  if (delta > 0) cue("saved");
  return { data };
}
