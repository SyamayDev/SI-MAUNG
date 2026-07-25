import React, { useState, useEffect } from 'react';
import SavingsGoalCard from '../components/savings/SavingsGoalCard';
import Button from '../components/ui/Button';
import styles from './Savings.module.css';
// import { getSavingsGoals } from '../services/savingsService'; // Will be used later
import { useAuth } from '../context/AuthContext';

function SavingsGoals() {
  const { user } = useAuth();
  const [goals, setGoals] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchGoals = async () => {
      if (!user) return;
      setLoading(true);
      // In a real app, this would fetch from Supabase.
      // Simulating a fetch for now with mock data.
      const mockGoals = [
        { id: 1, name: 'New Laptop', current_amount: 7500000, target_amount: 15000000, deadline: '2024-12-31' },
        { id: 2, name: 'Vacation to Japan', current_amount: 2000000, target_amount: 25000000, deadline: '2025-06-30' },
        { id: 3, name: 'Emergency Fund', current_amount: 10000000, target_amount: 10000000, deadline: null },
      ];
      // const { data, error } = await getSavingsGoals(user.id);
      // if (error) {
      //   console.error(error);
      // } else {
      //   setGoals(data);
      // }
      setGoals(mockGoals);
      setLoading(false);
    };

    fetchGoals();
  }, [user]);

  return (
    <div>
      <header className={styles.pageHeader}>
        <div>
          <h1 className={styles.pageTitle}>Savings Goals</h1>
          <p className="text-gray-500">Track and manage your financial goals.</p>
        </div>
        <Button variant="primary" onClick={() => { /* TODO: Open Add Goal Modal */ }}>
          Add Goal
        </Button>
      </header>

      {loading ? (
        <p>Loading goals...</p>
      ) : (
        <div className={styles.goalsGrid}>
          {goals.map((goal) => (
            <SavingsGoalCard key={goal.id} goal={goal} />
          ))}
        </div>
      )}
    </div>
  );
}

export default SavingsGoals;
