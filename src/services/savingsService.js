import { supabase } from '../lib/supabase';

/**
 * Fetches all savings goals for a specific user.
 * @param {string} userId The ID of the user.
 * @returns {Promise<{data: any[] | null, error: any}>}
 */
export const getSavingsGoals = async (userId) => {
  if (!userId) return { data: [], error: null };

  const { data, error } = await supabase
    .from('savings_goals')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  return { data, error };
};

/**
 * Creates a new savings goal.
 * @param {object} goalData The data for the new goal.
 * @param {string} goalData.user_id The ID of the user.
 * @param {string} goalData.name The name of the goal.
 * @param {number} goalData.target_amount The target amount for the goal.
 * @param {string|null} goalData.deadline The optional deadline for the goal.
 * @returns {Promise<{data: any | null, error: any}>}
 */
export const createSavingsGoal = async (goalData) => {
  if (!goalData.user_id || !goalData.name || !goalData.target_amount) {
    return { data: null, error: { message: 'User ID, name, and target amount are required.' } };
  }

  const { data, error } = await supabase
    .from('savings_goals')
    .insert([
      {
        user_id: goalData.user_id,
        name: goalData.name,
        target_amount: goalData.target_amount,
        current_amount: 0, // Goals always start at 0
        deadline: goalData.deadline || null,
      },
    ])
    .select()
    .single();

  return { data, error };
};
