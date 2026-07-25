import React from 'react';
import styles from './Voice.module.css';

const VoiceVisualizer = () => {
  return (
    <div className={styles.visualizer}>
      <div className={styles.bar}></div>
      <div className={styles.bar}></div>
      <div className={styles.bar}></div>
      <div className={styles.bar}></div>
      <div className={styles.bar}></div>
    </div>
  );
};

export default VoiceVisualizer;
