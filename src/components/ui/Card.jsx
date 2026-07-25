import React from 'react';
import styles from './Card.module.css';

const Card = ({ children, className, as: Component = 'div' }) => {
  return (
    <Component className={`${styles.card} ${className || ''}`}>
      {children}
    </Component>
  );
};

export default Card;
