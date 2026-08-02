import React from 'react';
import TransactionCard from './TransactionCard';
import styles from './Transactions.module.css';
import EmptyState from '../ui/EmptyState';
import LoadingSpinner from '../ui/LoadingSpinner';

const TransactionList = ({ transactions, loading }) => {
  if (loading) {
    return <div style={{ display: 'grid', placeItems: 'center', minHeight: '200px' }}><LoadingSpinner /></div>;
  }

  if (transactions.length === 0) {
    return <EmptyState 
      image="empty-state-transactions.webp"
      title="Transaksi Tidak Ditemukan"
      message="Tidak ada transaksi yang cocok dengan filter saat ini. Coba sesuaikan pencarian Anda."
    />;
  }

  return (
    <div className={styles.transactionList}>
      {transactions.map((transaction) => (
        <TransactionCard key={transaction.id} transaction={transaction} />
      ))}
    </div>
  );
};

export default TransactionList;
