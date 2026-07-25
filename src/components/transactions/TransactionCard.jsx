import React from 'react';
import Card from '../ui/Card';
import { formatCurrency } from '../../utils/formatCurrency';
import { getCategoryIcon } from '../../utils/categoryUtils.jsx';
import styles from './Transactions.module.css';

const TransactionCard = ({ transaction }) => {
  const { type, amount, description, category, transaction_date } = transaction;
  
  const formattedDate = new Date(transaction_date).toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

  return (
    <Card className={styles.transactionCard}>
      <div className={styles.details}>
        <div className={styles.icon}>{getCategoryIcon(category)}</div>
        <div className={styles.info}>
          <p className={styles.description}>{description}</p>
          <p className={styles.category}>{category} • {formattedDate}</p>
        </div>
      </div>
      <p className={`${styles.amount} ${type === 'income' ? styles.income : styles.expense}`}>
        {type === 'income' ? '+' : '-'}
        {formatCurrency(amount)}
      </p>
    </Card>
  );
};

export default TransactionCard;
