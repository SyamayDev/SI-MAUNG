import { useState } from "react";
import Button from '../ui/Button';
import styles from './AI.module.css';

function ChatInput({ onSendMessage, disabled }) {
  const [text, setText] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!text.trim()) return;
    onSendMessage(text);
    setText("");
  };

  return (
    <form className={styles.chatInputForm} onSubmit={handleSubmit}>
      <textarea
        className={styles.chatTextarea}
        placeholder="Ketik pesan atau transaksi di sini... cth: 'Beli kopi 25rb'"
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows={3}
        disabled={disabled}
      />
      <div className={styles.chatInputActions}>
        <Button type="submit" disabled={disabled || !text.trim()}>
          Send
        </Button>
      </div>
    </form>
  );
}

export default ChatInput;
