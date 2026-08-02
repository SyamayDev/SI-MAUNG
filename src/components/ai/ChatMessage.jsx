import React from 'react';
import styles from './AI.module.css';

const ChatMessage = ({ message }) => {
  const { role, content } = message;
  const isUser = role === 'user';
  
  // If content is a component (like TransactionConfirmation), render it directly.
  if (typeof content !== 'string') {
    return (
       <div className={`${styles.chatMessage} ${styles[role]}`}>
        <div className={styles.avatar}>{isUser ? 'U' : 'AI'}</div>
        <div className={styles.messageContent}>
          {content}
        </div>
      </div>
    )
  }

  return (
    <div className={`${styles.chatMessage} ${styles[role]}`}>
      <div className={styles.avatar}>{isUser ? 'U' : 'AI'}</div>
      <div className={styles.messageContent}>
        {content}
      </div>
    </div>
  );
};

export default ChatMessage;
