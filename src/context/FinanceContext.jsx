import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { supabase } from "../lib/supabase";
import { useAuth } from "./AuthContext";

const FinanceContext = createContext();

export function FinanceProvider({ children }) {
  const { user } = useAuth();
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const refreshFinanceData = async () => {
    if (!user?.id) {
      setTransactions([]);
      return;
    }

    setLoading(true);
    setError("");

    const { data, error } = await supabase
      .from("transactions")
      .select("*")
      .eq("user_id", user.id)
      .order("transaction_date", { ascending: false });

    if (error) {
      console.error("Gagal memuat transaksi:", error);
      setError("Terjadi masalah saat memuat transaksi. Silakan coba lagi.");
      setTransactions([]);
    } else {
      setTransactions(data || []);
    }

    setLoading(false);
  };

  useEffect(() => {
    if (user?.id) {
      refreshFinanceData();
    } else {
      setTransactions([]);
    }
  }, [user]);

  const totals = useMemo(() => {
    const totalIncome = transactions
      .filter((item) => item.type === "income")
      .reduce((sum, item) => sum + Number(item.amount || 0), 0);

    const totalExpense = transactions
      .filter((item) => item.type === "expense")
      .reduce((sum, item) => sum + Number(item.amount || 0), 0);

    const balance = totalIncome - totalExpense;
    const savingsRate = totalIncome > 0
      ? Math.round(((totalIncome - totalExpense) / totalIncome) * 100)
      : 0;

    return {
      totalIncome,
      totalExpense,
      balance,
      savingsRate,
    };
  }, [transactions]);

  return (
    <FinanceContext.Provider
      value={{
        transactions,
        loading,
        error,
        refreshFinanceData,
        ...totals,
      }}
    >
      {children}
    </FinanceContext.Provider>
  );
}

export function useFinance() {
  const context = useContext(FinanceContext);

  if (!context) {
    throw new Error("useFinance harus digunakan di dalam FinanceProvider");
  }

  return context;
}
