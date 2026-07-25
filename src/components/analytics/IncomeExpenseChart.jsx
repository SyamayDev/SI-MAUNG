import React, { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { useFinance } from '../../context/FinanceContext';
import { formatCurrency } from '../../utils/formatCurrency';
import styles from '../../pages/Analytics.module.css';

const IncomeExpenseChart = () => {
  const { transactions } = useFinance();

  const data = useMemo(() => {
    const monthlyData = {};

    transactions.forEach(tx => {
      const month = new Date(tx.transaction_date).toLocaleString('en-US', { month: 'short', year: '2-digit' });
      if (!monthlyData[month]) {
        monthlyData[month] = { name: month, income: 0, expense: 0 };
      }
      if (tx.type === 'income') {
        monthlyData[month].income += tx.amount;
      } else {
        monthlyData[month].expense += tx.amount;
      }
    });

    return Object.values(monthlyData).sort((a, b) => new Date(a.name) - new Date(b.name));
  }, [transactions]);

  return (
    <>
      <h3 className={styles.chartTitle}>Income vs Expense</h3>
      <div className={styles.responsiveContainer}>
        <ResponsiveContainer>
          <BarChart data={data} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="name" tick={{ fontSize: 12 }} />
            <YAxis tickFormatter={(value) => `${formatCurrency(value).replace('Rp', '')}`} tick={{ fontSize: 12 }} />
            <Tooltip formatter={(value) => formatCurrency(value)} />
            <Legend wrapperStyle={{ fontSize: '14px' }} />
            <Bar dataKey="income" fill="var(--income)" name="Income" radius={[4, 4, 0, 0]} />
            <Bar dataKey="expense" fill="var(--expense)" name="Expense" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </>
  );
};

export default IncomeExpenseChart;
