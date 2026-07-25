import React from 'react';
import Card from '../ui/Card';
import SavingsProgress from './SavingsProgress';
import { formatCurrency } from '../../utils/formatCurrency';
import styles from '../../pages/Savings.module.css';
import { Target } from 'lucide-react';

const SavingsGoalCard = ({ goal }) => {
  const { name, current_amount, target_amount, deadline } = goal;

  const formattedDeadline = deadline 
    ? `by ${new Date(deadline).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}`
    : 'No deadline';

  return (
    <Card className={styles.goalCard}>
      <div className={styles.cardHeader}>
        <div>
          <h3 className={styles.goalName}>{name}</h3>
          <p className={styles.goalDeadline}>{formattedDeadline}</p>
        </div>
        <Target size={24} className="text-gray-400" />
      </div>
      <div className={styles.cardBody}>
        <SavingsProgress value={current_amount} max={target_amount} />
        <div className={styles.amounts}>
          <span className={styles.currentAmount}>{formatCurrency(current_amount)}</span>
          <span className={styles.targetAmount}>of {formatCurrency(target_amount)}</span>
        </div>
      </div>
    </Card>
  );
};

export default SavingsGoalCard;
