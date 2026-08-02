import React from 'react';
import Card from '../components/ui/Card';
import IncomeExpenseChart from '../components/analytics/IncomeExpenseChart';
import CategoryBreakdown from '../components/analytics/CategoryBreakdown';
import styles from './Analytics.module.css';

function Analytics() {
  return (
    <div>
      <header className={styles.pageHeader}>
        <div>
          <h1 className={styles.pageTitle}>Analitik</h1>
          <p className={styles.pageDescription}>
            Visualisasikan kebiasaan dan tren keuangan Anda.
          </p>
        </div>
      </header>

      <div className={styles.analyticsGrid}>
        <Card>
          <IncomeExpenseChart />
        </Card>
        <Card>
          <CategoryBreakdown />
        </Card>
      </div>
    </div>
  );
}

export default Analytics;
