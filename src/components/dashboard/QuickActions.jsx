import React from 'react';
import { PlusCircle, MinusCircle, Mic } from 'lucide-react';
import Button from '../ui/Button';
import styles from './DashboardComponents.module.css';

const QuickActions = ({ onIncome, onExpense, onVoice }) => {
  return (
    <div className={styles.quickActionsGrid}>
      <Button variant="secondary" className={styles.quickAction} onClick={onIncome}>
        <PlusCircle size={20} />
        Add Income
      </Button>
      <Button variant="secondary" className={styles.quickAction} onClick={onExpense}>
        <MinusCircle size={20} />
        Add Expense
      </Button>
      <Button variant="primary" className={styles.voiceAction} onClick={onVoice}>
        <Mic size={20} />
        Talk to SI MAUNG
      </Button>
    </div>
  );
};

export default QuickActions;
