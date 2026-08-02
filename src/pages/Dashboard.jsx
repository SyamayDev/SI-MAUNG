import React from 'react';
import { useAuth } from '../context/AuthContext';
import { useFinance } from '../context/FinanceContext';
import { useModal } from '../context/ModalContext';
import { Mic, Plus, Minus } from 'lucide-react';
import { formatCurrency } from '../utils/formatCurrency';
import styles from './Dashboard.module.css';

import FinancialStats from '../components/dashboard/FinancialStats';
import RecentTransactions from '../components/dashboard/RecentTransactions';
import AIInsightCard from '../components/dashboard/AIInsightCard';
import Button from '../components/ui/Button';

function Dashboard() {
  const { profile } = useAuth();
  const { balance, totalIncome, totalExpense, loading } = useFinance();
  const { openModal } = useModal();

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Selamat Pagi';
    if (hour < 18) return 'Selamat Siang';
    return 'Selamat Malam';
  };
  
  const openVoiceModal = () => {
    openModal('voiceTransaction');
  }

  const openAddTransactionModal = (type) => {
    openModal('addTransaction', { type });
  };


  return (
    <div className={styles.dashboardContainer}>
      <header className={styles.header}>
        <p className={styles.greeting}>{getGreeting()}, {profile?.full_name?.split(' ')[0] || 'Tamu'}!</p>
        <h1 className={styles.pageTitle}>Pusat Keuangan Anda</h1>
      </header>

      <section className={styles.mainActionSection}>
        <div className={styles.balanceDisplay}>
          <p className={styles.balanceLabel}>Saldo Total</p>
          <h2 className={styles.balanceAmount}>{formatCurrency(balance)}</h2>
        </div>

        <div className={styles.voiceActionButton} onClick={openVoiceModal} role="button" tabIndex={0} aria-label="Bicara dengan SI MAUNG">
          <Mic size={40} />
        </div>

        <div className={styles.quickActions}>
          <Button 
            variant="secondary" 
            size="lg" 
            onClick={() => openAddTransactionModal('income')}
            className={styles.actionButton}
          >
            <Plus size={20} />
            Tambah Pemasukan
          </Button>
          <Button 
            variant="secondary" 
            size="lg" 
            onClick={() => openAddTransactionModal('expense')}
            className={styles.actionButton}
          >
            <Minus size={20} />
            Tambah Pengeluaran
          </Button>
        </div>
      </section>

      <div className={styles.dashboardGrid}>
        <div className={styles.financialStats}>
          <FinancialStats />
        </div>

        <div className={styles.recentTransactions}>
          <RecentTransactions />
        </div>

        <div className={styles.aiInsight}>
          <AIInsightCard />
        </div>
      </div>

      {loading && (
        <div className="loading-overlay">
          <div className="spinning-coin"></div>
        </div>
      )}
    </div>
  );
}

export default Dashboard;
