import React, { useMemo } from 'react';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { useFinance } from '../../context/FinanceContext';
import styles from '../../pages/Analytics.module.css';

const COLORS = ['#0F766E', '#16A34A', '#D97706', '#E11D48', '#7C3AED', '#2563EB', '#DB2777'];

const CategoryBreakdown = () => {
  const { transactions } = useFinance();

  const data = useMemo(() => {
    const categoryData = {};

    transactions
      .filter(tx => tx.type === 'expense')
      .forEach(tx => {
        const category = tx.category || 'Other';
        if (!categoryData[category]) {
          categoryData[category] = { name: category, value: 0 };
        }
        categoryData[category].value += tx.amount;
      });

    return Object.values(categoryData);
  }, [transactions]);
  
  if (data.length === 0) {
    return (
      <>
        <h3 className={styles.chartTitle}>Expense by Category</h3>
        <p style={{textAlign: 'center', color: 'var(--text-muted)', paddingTop: '4rem'}}>No expense data to display.</p>
      </>
    )
  }

  return (
    <>
      <h3 className={styles.chartTitle}>Expense by Category</h3>
      <div className={styles.responsiveContainer}>
        <ResponsiveContainer>
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              labelLine={false}
              outerRadius={80}
              fill="#8884d8"
              dataKey="value"
              nameKey="name"
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip formatter={(value) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(value)} />
            <Legend wrapperStyle={{ fontSize: '14px' }}/>
          </PieChart>
        </ResponsiveContainer>
      </div>
    </>
  );
};

export default CategoryBreakdown;
