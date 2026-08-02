import React from 'react';
import styles from './EmptyState.module.css';
import Button from './Button';

const EmptyState = ({ image, title, message, action }) => {
  // Ingat, Anda perlu membuat gambar-gambar ini dan meletakkannya di folder `public/images/`.
  // Contoh: public/images/empty-transactions.webp
  const imagePath = `/images/${image}`;

  return (
    <div className={styles.emptyStateContainer}>
      <img src={imagePath} alt={title} className={styles.emptyStateImage} />
      <h3 className={styles.emptyStateTitle}>{title}</h3>
      <p className={styles.emptyStateMessage}>{message}</p>
      {action && (
        <div className={styles.emptyStateAction}>
          <Button onClick={action.onClick} variant="primary" size="medium">
            {action.label}
          </Button>
        </div>
      )}
    </div>
  );
};

export default EmptyState;
