/**
 * Savings goals. `current_amount` on the goal row is the single source of
 * truth for progress: deposits and withdrawals change it directly (they are
 * not mirrored as transactions). Updates use optimistic concurrency — the
 * write only succeeds if the stored amount is still the one we read — so two
 * tabs can never overwrite each other's contributions.
 */
import { supabase } from "../lib/supabase";

const TABLE = "savings_goals";

export async function listGoals(userId) {
  return supabase.from(TABLE).select("*").eq("user_id", userId).order("created_at", { ascending: false });
}

export async function createGoal(userId, value) {
  return supabase
    .from(TABLE)
    .insert({ user_id: userId, name: value.name, target_amount: value.target_amount, deadline: value.deadline, current_amount: 0 })
    .select()
    .single();
}

export async function updateGoal(userId, id, value) {
  const result = await supabase
    .from(TABLE)
    .update({ name: value.name, target_amount: value.target_amount, deadline: value.deadline })
    .eq("id", id)
    .eq("user_id", userId)
    .select()
    .maybeSingle();
  if (!result.error && !result.data) return { data: null, error: { message: "not-found", code: "NOT_FOUND" } };
  return result;
}

export async function deleteGoal(userId, id) {
  const result = await supabase.from(TABLE).delete().eq("id", id).eq("user_id", userId).select("id");
  if (!result.error && !result.data?.length) return { data: null, error: { message: "not-found", code: "NOT_FOUND" } };
  return result;
}

/** Add `delta` (negative = withdraw) to a goal's current_amount. */
export async function contributeToGoal(userId, goalId, delta, attempts = 3) {
  for (let i = 0; i < attempts; i++) {
    const { data: goal, error } = await supabase
      .from(TABLE)
      .select("id, current_amount")
      .eq("id", goalId)
      .eq("user_id", userId)
      .maybeSingle();
    if (error) return { data: null, error };
    if (!goal) return { data: null, error: { message: "not-found", code: "NOT_FOUND" } };

    const current = Number(goal.current_amount) || 0;
    const next = current + delta;
    if (next < 0) return { data: null, error: { message: "insufficient", code: "INSUFFICIENT" } };

    const result = await supabase
      .from(TABLE)
      .update({ current_amount: next })
      .eq("id", goalId)
      .eq("user_id", userId)
      .eq("current_amount", goal.current_amount)
      .select()
      .maybeSingle();
    if (result.error) return result;
    if (result.data) return result;
    // Someone else changed the amount in between — read again and retry.
  }
  return { data: null, error: { message: "conflict", code: "CONFLICT" } };
}
