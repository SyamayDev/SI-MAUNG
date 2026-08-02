import React from 'react';
import { useFinance } from '../../context/FinanceContext';
import { formatCurrency } from '../../utils/formatCurrency';
import Card from '../ui/Card';
import styles from './DashboardComponents.module.css';
import { ArrowUp, ArrowDown } from 'lucide-react';

const FinancialStats = () => {
  const { totalIncome, totalExpense } = useFinance();

  return (
    <Card className={styles.financialStats}>
      <div className={styles.statItem}>
        <div className={styles.statHeader}>
          <div className={`${styles.statIcon} ${styles.income}`}>
            <ArrowDown size={20} />
          </div>
          <span className={styles.statTitle}>Pemasukan</span>
        </div>
        <p className={styles.statAmount}>{formatCurrency(totalIncome)}</p>
      </div>
      <div className={styles.statDivider} />
      <div className={styles.statItem}>
        <div className={styles.statHeader}>
          <div className={`${styles.statIcon} ${styles.expense}`}>
            <ArrowUp size={20} />
          </div>
          <span className={styles.statTitle}>Pengeluaran</span>
        </div>
        <p className={styles.statAmount}>{formatCurrency(totalExpense)}</p>
      </div>
    </Card>
  );
};

export default FinancialStats;
