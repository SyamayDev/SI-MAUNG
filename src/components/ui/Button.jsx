import React from 'react';
import styles from './Button.module.css';

const Button = ({ children, onClick, variant = 'primary', size = 'md', className = '', disabled = false, type = 'button' }) => {
  return (
    <button
      type={type}
      onClick={onClick}
      className={`${styles.button} ${styles[variant]} ${styles[size]} ${className}`}
      disabled={disabled}
    >
      {children}
    </button>
  );
};

export default Button;
