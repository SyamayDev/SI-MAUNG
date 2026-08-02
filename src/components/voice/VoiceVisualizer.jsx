import React from 'react';
import styles from './Voice.module.css';

const VoiceVisualizer = () => {
  // Creates an array with 20 elements to render 20 bars
  const bars = Array.from({ length: 20 }, (_, i) => i);

  return (
    <div className={styles.visualizer}>
      {bars.map(i => (
        <div key={i} className={styles.bar}></div>
      ))}
    </div>
  );
};

export default VoiceVisualizer;
