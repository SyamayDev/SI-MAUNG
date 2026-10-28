/**
 * Transactions table access. Every query is scoped to the signed-in user's
 * id in addition to the database's Row Level Security policies.
 */
import { getSupabase } from "../lib/supabase";
import { isMissingColumn } from "../lib/errors";

const TABLE = "transactions";
// Columns added by supabase/migrations — older databases may not have them yet.
const OPTIONAL_COLUMNS = ["notes", "source"];

export async function listTransactions(userId) {
  const supabase = await getSupabase();
  return supabase
    .from(TABLE)
    .select("*")
    .eq("user_id", userId)
    .order("transaction_date", { ascending: false })
    .order("created_at", { ascending: false });
}

function withoutOptional(row) {
  const copy = { ...row };
  for (const c of OPTIONAL_COLUMNS) delete copy[c];
  return copy;
}

/** @param value validated fields from validateTransaction() */
export async function createTransaction(userId, value, source = "manual") {
  const supabase = await getSupabase();
  const row = { ...value, user_id: userId, source };
  let result = await supabase.from(TABLE).insert(row).select().single();
  if (isMissingColumn(result.error)) {
    result = await supabase.from(TABLE).insert(withoutOptional(row)).select().single();
  }
  return result;
}

export async function updateTransaction(userId, id, changes) {
  const supabase = await getSupabase();
  let result = await supabase.from(TABLE).update(changes).eq("id", id).eq("user_id", userId).select().maybeSingle();
  if (isMissingColumn(result.error)) {
    result = await supabase.from(TABLE).update(withoutOptional(changes)).eq("id", id).eq("user_id", userId).select().maybeSingle();
  }
  if (!result.error && !result.data) return { data: null, error: { message: "not-found", code: "NOT_FOUND" } };
  return result;
}

export async function deleteTransaction(userId, id) {
  const supabase = await getSupabase();
  const result = await supabase.from(TABLE).delete().eq("id", id).eq("user_id", userId).select("id");
  if (!result.error && !result.data?.length) return { data: null, error: { message: "not-found", code: "NOT_FOUND" } };
  return result;
}
