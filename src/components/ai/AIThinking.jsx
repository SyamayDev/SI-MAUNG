import React from 'react';
import styles from './AI.module.css';

const AIThinking = () => {
  return (
    <div className={styles.thinkingContainer}>
      <div className={styles.dot}></div>
      <div className={styles.dot}></div>
      <div className={styles.dot}></div>
    </div>
  );
};

export default AIThinking;
