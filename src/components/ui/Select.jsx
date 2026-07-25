import React from 'react';
import styles from './Select.module.css';
import { ChevronDown } from 'lucide-react';

const Select = ({ id, label, value, onChange, options, className }) => {
  return (
    <div className={`${styles.selectWrapper} ${className || ''}`}>
      {label && <label htmlFor={id} className={styles.label}>{label}</label>}
      <div className={styles.selectContainer}>
        <select id={id} value={value} onChange={onChange} className={styles.select}>
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <ChevronDown size={16} className={styles.chevron} />
      </div>
    </div>
  );
};

export default Select;
