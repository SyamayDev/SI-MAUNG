import React from 'react';
import styles from '../../pages/Savings.module.css';

const ProgressBar = ({ value, max }) => {
  const percentage = max > 0 ? (value / max) * 100 : 0;

  return (
    <div className={styles.progressContainer}>
      <div className={styles.progressBar} style={{ width: `${percentage}%` }}></div>
    </div>
  );
};

export default ProgressBar;
