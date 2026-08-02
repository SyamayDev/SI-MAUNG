import { useMemo, useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { useFinance } from "../context/FinanceContext";
import { deleteTransaction, updateTransaction, createTransaction } from "../services/transactionService";

import TransactionFilter from "../components/transactions/TransactionFilter";
import TransactionList from "../components/transactions/TransactionList";
import Button from "../components/ui/Button";

import styles from './Transactions.module.css';

function Transactions() {
  const { user } = useAuth();
  const { transactions, loading, refreshFinanceData } = useFinance();

  const [filterType, setFilterType] = useState("all");
  const [filterCategory, setFilterCategory] = useState("all");
  const [search, setSearch] = useState("");

  // This effect will run when the component mounts
  useEffect(() => {
    refreshFinanceData();
  }, []);

  const filteredTransactions = useMemo(() => {
    return transactions.filter((transaction) => {
      if (filterType !== "all" && transaction.type !== filterType) return false;
      if (filterCategory !== "all" && transaction.category.toLowerCase() !== filterCategory) return false;
      if (search && !transaction.description.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    });
  }, [transactions, filterType, filterCategory, search]);

  return (
    <div>
      <header className={styles.pageHeader}>
        <h1 className={styles.pageTitle}>Transaksi</h1>
        <p className={styles.pageDescription}>
          Berikut adalah riwayat lengkap pendapatan dan pengeluaran Anda.
        </p>
      </header>

      <div className={styles.transactionsContainer}>
        <TransactionFilter
          filterType={filterType}
          setFilterType={setFilterType}
          filterCategory={filterCategory}
          setFilterCategory={setFilterCategory}
          search={search}
          setSearch={setSearch}
          onFilterTypeChange={setFilterType}
          onFilterCategoryChange={setFilterCategory}
          onSearchChange={setSearch}
        />
        <TransactionList transactions={filteredTransactions} loading={loading} />
      </div>
    </div>
  );
}

export default Transactions;
