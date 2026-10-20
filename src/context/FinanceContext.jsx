import { useEffect, useMemo, useSyncExternalStore } from "react";
import { useAuth } from "./AuthContext";
import {
  addGoal,
  addTransaction,
  bindUser,
  contributeGoal,
  editGoal,
  editTransaction,
  financeStore,
  loadGoals,
  loadTransactions,
  removeGoal,
  removeTransaction,
} from "../lib/financeStore";
import { totals } from "../lib/finance/summary";

/** Connects the finance store to the signed-in account. */
export function FinanceProvider({ children }) {
  const { user } = useAuth();
  const userId = user?.id ?? null;
  useEffect(() => bindUser(userId), [userId]);
  return children;
}

const actions = {
  addTransaction,
  editTransaction,
  removeTransaction,
  refreshTransactions: loadTransactions,
  addGoal,
  editGoal,
  removeGoal,
  contributeGoal,
  refreshGoals: loadGoals,
};

// eslint-disable-next-line react-refresh/only-export-components
export function useFinance() {
  const state = useSyncExternalStore(financeStore.subscribe, financeStore.getState, financeStore.getState);
  const all = useMemo(() => totals(state.transactions), [state.transactions]);
  return {
    ...state,
    ...actions,
    balance: all.net,
    totalIncome: all.income,
    totalExpense: all.expense,
  };
}
