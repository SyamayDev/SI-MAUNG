import React from 'react';
import TransactionCard from './TransactionCard';
import styles from '../../pages/Transactions.module.css';

const TransactionList = ({ transactions, loading }) => {
  if (loading) {
    return <p>Loading transactions...</p>;
  }

  if (transactions.length === 0) {
    return <p>No transactions match the current filters.</p>;
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
