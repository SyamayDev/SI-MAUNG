import React, { useEffect, useRef } from 'react';
import ChatMessage from "./ChatMessage";
import AIThinking from "./AIThinking";
import styles from './AI.module.css';

function AIChat({ messages, isThinking }) {
  const chatEndRef = useRef(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isThinking]);

  return (
    <div className={styles.aiChatContainer}>
      {messages.length === 0 && !isThinking ? (
        <div className="empty-state" style={{margin: 'auto'}}>
          <p>Belum ada interaksi AI. Ketik atau rekam suara untuk mencoba.</p>
        </div>
      ) : (
        <>
          {messages.map((msg) => (
            <ChatMessage key={msg.id} message={msg} />
          ))}
          {isThinking && <AIThinking />}
        </>
      )}
      <div ref={chatEndRef} />
    </div>
  );
}

export default AIChat;
