import React from 'react';
import { useAuth } from '../context/AuthContext';
import { useFinance } from '../context/FinanceContext';
import { useModal } from '../context/ModalContext';
import { Mic } from 'lucide-react';
import { formatCurrency } from '../utils/formatCurrency';
import styles from './Dashboard.module.css';

import FinancialStats from '../components/dashboard/FinancialStats';
import RecentTransactions from '../components/dashboard/RecentTransactions';
import AIInsightCard from '../components/dashboard/AIInsightCard';
import Button from '../components/ui/Button';

function Dashboard() {
  const { profile } = useAuth();
  const { balance, totalIncome, totalExpense, loading } = useFinance();
  const { openVoiceModal } = useModal();

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  return (
    <div className={styles.dashboardGrid}>
      <header className={styles.header}>
        <div>
          <p className={styles.dashboardSubtitle}>{getGreeting()}, {profile?.full_name?.split(' ')[0] || 'MoneyTalk'}!</p>
          <h1>Dashboard</h1>
          <p className={styles.dashboardDescription}>Simplify your money tracking with smart voice and AI-powered insights.</p>
        </div>
      </header>

      <section className={styles.heroSection}>
        <div className={styles.heroWalletCard}>
          <div className={styles.walletBadge}>MoneyTalk Wallet</div>
          <div className={styles.walletAmount}>{formatCurrency(balance)}</div>
          <p className={styles.walletSubtitle}>Saldo tersedia berdasarkan transaksi terbaru.</p>

          <div className={styles.walletSummaryGrid}>
            <div className={styles.walletSummaryItem}>
              <span>Income</span>
              <strong>{formatCurrency(totalIncome)}</strong>
            </div>
            <div className={styles.walletSummaryItem}>
              <span>Expense</span>
              <strong>{formatCurrency(totalExpense)}</strong>
            </div>
          </div>
        </div>

        <div className={styles.heroActionCard}>
          <div className={styles.actionDial} onClick={openVoiceModal} role="button" tabIndex={0}>
            <div className={styles.actionInner}>
              <Mic size={28} />
            </div>
          </div>
          <div className={styles.actionMeta}>
            <h2>Talk to MoneyTalk</h2>
            <p>Tekan tombol mikrofon untuk merekam pemasukan atau pengeluaran secara cepat.</p>
          </div>
          <div className={styles.actionButtonGroup}>
            <Button variant="secondary" size="md" onClick={openVoiceModal}>
              Add Income
            </Button>
            <Button variant="secondary" size="md" onClick={openVoiceModal}>
              Add Expense
            </Button>
          </div>
        </div>
      </section>

      <div className={styles.financialStats}>
        <FinancialStats />
      </div>

      <div className={styles.recentTransactions}>
        <RecentTransactions />
      </div>

      <div className={styles.aiInsight}>
        <AIInsightCard />
      </div>

      {loading && <div className="loading-overlay">Loading data...</div>}
    </div>
  );
}

export default Dashboard;
