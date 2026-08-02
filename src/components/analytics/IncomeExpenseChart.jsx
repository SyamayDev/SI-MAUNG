import React, { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { useFinance } from '../../context/FinanceContext';
import { formatCurrency } from '../../utils/formatCurrency';
import LoadingSpinner from '../ui/LoadingSpinner';
import EmptyState from '../ui/EmptyState';
import styles from '../../pages/Analytics.module.css';

const IncomeExpenseChart = () => {
  const { transactions, loading } = useFinance();

  const data = useMemo(() => {
    // Only process if not loading and transactions exist
    if (loading || !transactions || transactions.length === 0) {
      return [];
    }

    const monthlyData = {};
    transactions.forEach(tx => {
      const month = new Date(tx.transaction_date).toLocaleString('default', { month: 'short', year: 'numeric' });
      if (!monthlyData[month]) {
        monthlyData[month] = { name: month, income: 0, expense: 0, date: new Date(tx.transaction_date) };
      }
      if (tx.type === 'income') {
        monthlyData[month].income += tx.amount;
      } else {
        monthlyData[month].expense += tx.amount;
      }
    });

    // Sort by date to ensure chronological order
    return Object.values(monthlyData).sort((a, b) => a.date - b.date);
  }, [transactions, loading]);

  if (loading) {
    return <div className={styles.chartLoading}><LoadingSpinner message="Menghitung..." /></div>;
  }

  if (data.length === 0) {
    return (
      <EmptyState
        image="empty-state-analytics.webp"
        title="Data Tidak Cukup"
        message="Mulai dengan menambahkan beberapa transaksi untuk melihat tren pendapatan vs. pengeluaran Anda."
      />
    );
  }

  return (
    <>
      <h3 className={styles.chartTitle}>Pendapatan vs Pengeluaran</h3>
      <div className={styles.responsiveContainer}>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={data} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="name" tick={{ fontSize: 12 }} />
            <YAxis 
              tickFormatter={(value) => `Rp${value/1000}k`} 
              tick={{ fontSize: 12 }} 
              width={80}
            />
            <Tooltip formatter={(value) => formatCurrency(value)} />
            <Legend wrapperStyle={{ fontSize: '14px', paddingTop: '20px' }} />
            <Bar dataKey="income" fill="var(--income)" name="Pendapatan" radius={[4, 4, 0, 0]} />
            <Bar dataKey="expense" fill="var(--expense)" name="Pengeluaran" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </>
  );
};

export default IncomeExpenseChart;
