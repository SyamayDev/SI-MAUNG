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
        <h3 className={styles.cardTitle}>Wawasan AI</h3>
        <p className={styles.aiText}>
          Pengeluaran Anda untuk 'Makanan' 15% lebih tinggi minggu ini.
        </p>
      </div>
    </Card>
  );
};

export default AIInsightCard;
