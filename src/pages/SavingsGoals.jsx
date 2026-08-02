import React, { useState, useEffect, useCallback } from 'react';
import SavingsGoalCard from '../components/savings/SavingsGoalCard';
import Button from '../components/ui/Button';
import styles from './Savings.module.css';
import { getSavingsGoals } from '../services/savingsService';
import { useAuth } from '../context/AuthContext';
import CreateGoalModal from '../components/savings/CreateGoalModal';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import EmptyState from '../components/ui/EmptyState';

function SavingsGoals() {
  const { user } = useAuth();
  const [goals, setGoals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const fetchGoals = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const { data, error } = await getSavingsGoals(user.id);
    if (error) {
      console.error(error);
      // You could show a toast notification here
    } else {
      setGoals(data);
    }
    setLoading(false);
  }, [user]);

  useEffect(() => {
    fetchGoals();
  }, [fetchGoals]);
  
  const handleGoalCreated = () => {
    fetchGoals(); // Refetch goals after a new one is created
  };

  return (
    <div>
      <header className={styles.pageHeader}>
        <div>
          <h1 className={styles.pageTitle}>Tujuan Tabungan</h1>
          <p className="text-gray-500">Lacak dan kelola tujuan keuangan Anda.</p>
        </div>
        <Button variant="primary" onClick={() => setIsModalOpen(true)}>
          Tambah Tujuan
        </Button>
      </header>

      {loading ? (
        <div style={{ display: 'grid', placeItems: 'center', minHeight: '300px' }}>
          <LoadingSpinner message="Memuat tujuan Anda..." />
        </div>
      ) : goals.length === 0 ? (
        <EmptyState 
          image="empty-state-savings.webp"
          title="Belum Ada Tujuan Tabungan"
          message="Buat tujuan tabungan pertamamu untuk mulai melacak kemajuanmu!"
        />
      ) : (
        <div className={styles.goalsGrid}>
          {goals.map((goal) => (
            <SavingsGoalCard key={goal.id} goal={goal} />
          ))}
        </div>
      )}

      <CreateGoalModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onGoalCreated={handleGoalCreated}
      />
    </div>
  );
}

export default SavingsGoals;
