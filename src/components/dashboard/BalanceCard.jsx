import React from 'react';
import { useFinance } from '../../context/FinanceContext';
import { formatCurrency } from '../../utils/formatCurrency';
import Card from '../ui/Card';
import styles from './DashboardComponents.module.css';

const BalanceCard = () => {
  const { balance } = useFinance();

  return (
    <Card className={styles.balanceCard}>
      <p className={styles.balanceTitle}>Total Balance</p>
      <h2 className={styles.balanceAmount}>{formatCurrency(balance)}</h2>
      <p className={styles.balanceTrend}>
        <span className={styles.trendIcon}>▲</span> 5.2% vs last month
      </p>
    </Card>
  );
};

export default BalanceCard;
