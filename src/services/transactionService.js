import { supabase } from "../lib/supabase";

export async function createTransaction(transaction) {
  const { data, error } = await supabase
    .from("transactions")
    .insert([transaction]);

  return { data, error };
}

export async function updateTransaction(id, changes) {
  const { data, error } = await supabase
    .from("transactions")
    .update(changes)
    .eq("id", id)
    .single();

  return { data, error };
}

export async function deleteTransaction(id) {
  const { data, error } = await supabase
    .from("transactions")
    .delete()
    .eq("id", id)
    .single();

  return { data, error };
}
