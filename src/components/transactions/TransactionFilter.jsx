import React from 'react';
import Input from '../ui/Input';
import Select from '../ui/Select';
import styles from '../../pages/Transactions.module.css';
import { transactionCategories } from '../../utils/categoryUtils.jsx';

function TransactionFilter({
  filterType,
  filterCategory,
  search,
  onFilterTypeChange,
  onFilterCategoryChange,
  onSearchChange,
}) {
  const typeOptions = [
    { value: 'all', label: 'All Types' },
    { value: 'income', label: 'Income' },
    { value: 'expense', label: 'Expense' },
  ];

  const categoryOptions = [
    { value: "all", label: "All Categories" },
    ...transactionCategories.map((cat) => ({ value: cat.value, label: cat.label })),
  ];

  return (
    <div className={styles.filters}>
      <Input
        type="text"
        placeholder="Search transactions..."
        value={search}
        onChange={(e) => onSearchChange(e.target.value)}
        className={styles.searchInput}
      />
      <Select
        value={filterType}
        onChange={(e) => onFilterTypeChange(e.target.value)}
        options={typeOptions}
      />
      <Select
        value={filterCategory}
        onChange={(e) => onFilterCategoryChange(e.target.value)}
        options={categoryOptions}
      />
    </div>
  );
}

export default TransactionFilter;
