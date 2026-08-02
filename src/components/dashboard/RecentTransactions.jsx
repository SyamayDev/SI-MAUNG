import React from 'react';
import { useFinance } from '../../context/FinanceContext';
import Card from '../ui/Card';
import styles from './DashboardComponents.module.css';
import { formatCurrency } from '../../utils/formatCurrency';
import { getCategoryIcon } from '../../utils/categoryUtils.jsx';

const RecentTransactions = () => {
  const { transactions, loading } = useFinance();
  const recentTransactions = transactions.slice(0, 5);

  return (
    <Card>
      <h3 className={styles.cardTitle}>Transaksi Terkini</h3>
      {loading ? (
        <p>Memuat...</p>
      ) : recentTransactions.length === 0 ? (
        <p className={styles.emptyState}>Belum ada transaksi.</p>
      ) : (
        <div className={styles.transactionList}>
          {recentTransactions.map((tx) => (
            <div key={tx.id} className={styles.transactionItem}>
              <div className={styles.transactionDetails}>
                <div className={styles.transactionIcon}>
                  {getCategoryIcon(tx.category)}
                </div>
                <div>
                  <p className={styles.transactionDescription}>{tx.description}</p>
                  <p className={styles.transactionCategory}>{tx.category}</p>
                </div>
              </div>
              <p className={`${styles.transactionAmount} ${tx.type === 'income' ? styles.income : styles.expense}`}>
                {tx.type === 'income' ? '+' : '-'}
                {formatCurrency(tx.amount)}
              </p>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
};

export default RecentTransactions;
