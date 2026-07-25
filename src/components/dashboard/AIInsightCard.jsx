import React from 'react';
import Card from '../ui/Card';
import styles from './DashboardComponents.module.css';
import { Lightbulb } from 'lucide-react';

const AIInsightCard = () => {
  return (
    <Card className={styles.aiInsightCard}>
      <div className={styles.aiIcon}>
        <Lightbulb size={24} />
      </div>
      <div className={styles.aiContent}>
        <h3 className={styles.cardTitle}>AI Insight</h3>
        <p className={styles.aiText}>
          Your spending on 'Food' is 15% higher this week.
        </p>
      </div>
    </Card>
  );
};

export default AIInsightCard;
