import React from 'react';
import { Search } from 'lucide-react';
import Input from '../ui/Input';
import Select from '../ui/Select';
import styles from './TransactionFilter.module.css';
import { transactionCategories } from '../../lib/constants';

function TransactionFilter({
  filterType,
  filterCategory,
  search,
  onFilterTypeChange,
  onFilterCategoryChange,
  onSearchChange,
}) {
  const typeOptions = [
    { value: 'all', label: 'Semua Tipe' },
    { value: 'income', label: 'Pemasukan' },
    { value: 'expense', label: 'Pengeluaran' },
  ];

  const categoryOptions = [
    { value: 'all', label: 'Semua Kategori' },
    ...transactionCategories.map((cat) => ({
      value: cat.value,
      label: cat.label,
    })),
  ];

  return (
    <div className={styles.filterContainer}>
      <div className={styles.searchWrapper}>
        <Search size={20} className={styles.searchIcon} />
        <Input
          type="text"
          placeholder="Cari transaksi..."
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          className={styles.searchInput}
        />
      </div>
      <div className={styles.selectWrapper}>
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
    </div>
  );
}

export default TransactionFilter;
