import React from 'react';
import styles from './LoadingSpinner.module.css';

const LoadingSpinner = ({ size = 48 }) => {
  return (
    <div className={styles.spinnerContainer} role="status" aria-label="Loading">
      <svg 
        className={styles.spinner} 
        width={size} 
        height={size} 
        viewBox="0 0 24 24" 
        fill="none" 
        xmlns="http://www.w3.org/2000/svg"
      >
        <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" opacity="0.2"/>
        <path d="M12 6V18M10 8L14 8M10 16L14 16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M4.93,4.93L6.34,6.34" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" opacity="0.4"/>
        <path d="M17.66,17.66L19.07,19.07" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" opacity="0.4"/>
        <path d="M2 12H4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" opacity="0.6"/>
        <path d="M20 12H22" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" opacity="0.6"/>
        <path d="M4.93,19.07L6.34,17.66" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" opacity="0.8"/>
        <path d="M17.66,6.34L19.07,4.93" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" opacity="0.8"/>
      </svg>
    </div>
  );
};

export default LoadingSpinner;
