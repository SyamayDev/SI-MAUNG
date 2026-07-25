import React, { forwardRef } from 'react';
import styles from './Input.module.css';

const Input = forwardRef(({ id, label, type = 'text', placeholder, error, ...props }, ref) => {
  return (
    <div className={styles.inputGroup}>
      {label && <label htmlFor={id} className={styles.label}>{label}</label>}
      <input
        id={id}
        type={type}
        placeholder={placeholder}
        ref={ref}
        className={`${styles.input} ${error ? styles.error : ''}`}
        {...props}
      />
      {error && <p className={styles.errorMessage}>{error}</p>}
    </div>
  );
});

export default Input;
