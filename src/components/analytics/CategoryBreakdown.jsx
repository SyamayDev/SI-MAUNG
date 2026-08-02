import React, { useMemo } from 'react';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { useFinance } from '../../context/FinanceContext';
import { formatCurrency } from '../../utils/formatCurrency';
import LoadingSpinner from '../ui/LoadingSpinner';
import EmptyState from '../ui/EmptyState';
import styles from '../../pages/Analytics.module.css';
import { transactionCategories } from '../../lib/constants';

const CategoryBreakdown = () => {
  const { transactions, loading } = useFinance();

  const categoryColors = useMemo(() => {
    const colorMap = {};
    transactionCategories.forEach(cat => {
      colorMap[cat.value] = cat.color;
    });
    return colorMap;
  }, []);

  const data = useMemo(() => {
    if (loading || !transactions) {
      return [];
    }

    const categoryData = {};
    transactions
      .filter(tx => tx.type === 'expense')
      .forEach(tx => {
        const category = tx.category || 'other';
        if (!categoryData[category]) {
          categoryData[category] = { name: tx.category_name || category, value: 0 };
        }
        categoryData[category].value += tx.amount;
      });

    return Object.values(categoryData).sort((a,b) => b.value - a.value);
  }, [transactions, loading]);
  
  if (loading) {
    return <div className={styles.chartLoading}><LoadingSpinner message="Menghitung..." /></div>;
  }

  if (data.length === 0) {
    return (
      <EmptyState 
        image="empty-state-analytics.webp"
        title="Tidak Ada Data Pengeluaran"
        message="Tambahkan beberapa transaksi pengeluaran untuk melihat rincian berdasarkan kategori."
      />
    );
  }

  return (
    <>
      <h3 className={styles.chartTitle}>Pengeluaran per Kategori</h3>
      <div className={styles.responsiveContainer}>
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              labelLine={false}
              outerRadius={100}
              fill="#8884d8"
              dataKey="value"
              nameKey="name"
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={categoryColors[entry.name.toLowerCase()] || '#8884d8'} />
              ))}
            </Pie>
            <Tooltip formatter={(value) => formatCurrency(value)} />
            <Legend wrapperStyle={{ fontSize: '14px', paddingTop: '20px' }} />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </>
  );
};

export default CategoryBreakdown;
