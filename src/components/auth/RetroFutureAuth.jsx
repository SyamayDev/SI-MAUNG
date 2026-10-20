import React, { useEffect } from 'react';
import styles from './RetroFutureAuth.module.css';

const RetroFutureAuth = ({ title, subtitle, mascotImg, children }) => {
  useEffect(() => {
    const inputs = document.querySelectorAll(`.${styles.retroField} input`);
    inputs.forEach(input => {
      if (input) {
        input.setAttribute('placeholder', ' ');
      }
    });
  }, []);

  return (
    <div className={styles.authContainer}>
      <div className={styles.loginContainer}>
        {mascotImg && (
          <div className={styles.mascotContainer}>
            <img src={mascotImg} alt="App Mascot" className={styles.mascotImage} />
          </div>
        )}
        
        <div className={styles.futureCard}>
          <div className={styles.chromeHeader}>
            <h1 className={styles.y2kTitle}>
              <span className={styles.titleChrome}>{title}</span>
            </h1>
            <p className={styles.retroSubtitle}>{subtitle}</p>
          </div>
          
          {children}
          
        </div>
      </div>
    </div>
  );
};

// A reusable input field component that fits the new theme
export const RetroInput = ({ id, type, value, onChange, error, children }) => {
  return (
    <div className={styles.retroField}>
      <div className={styles.fieldChrome}>
        <div className={styles.chromeBorder}></div>
        <input
          id={id}
          name={id}
          type={type}
          value={value}
          onChange={onChange}
          autoComplete={type === 'password' ? 'current-password' : type}
        />
        <label htmlFor={id}>{children}</label>
        <div className={styles.fieldHologram}></div>
      </div>
      <span className={styles.retroError}>{error || ''}</span>
    </div>
  );
};

// A reusable button component for the new theme
export const RetroButton = ({ type = 'submit', loading, children }) => {
  return (
    <button type={type} className={styles.retroButton} disabled={loading}>
      <span className={styles.buttonText}>{loading ? 'Processing...' : children}</span>
    </button>
  );
};

export default RetroFutureAuth;
