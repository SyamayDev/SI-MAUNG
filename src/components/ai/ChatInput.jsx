import { useState } from "react";
import { useAIChat } from "../../hooks/useAIChat";

function ChatInput({ onParsed, onError }) {
  const [text, setText] = useState("");
  const { parseTransaction } = useAIChat();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!text.trim()) return;
    try {
      const parsed = await parseTransaction(text.trim());
      if (!parsed) {
        onError && onError("Gagal mem-parsing teks.");
        return;
      }
      onParsed && onParsed(parsed);
      setText("");
    } catch (err) {
      onError && onError("Terjadi kesalahan parsing.");
    }
  };

  return (
    <form className="ai-chat-input" onSubmit={handleSubmit} style={{ marginTop: 16 }}>
      <textarea
        placeholder="Ketik transaksi natural, contoh: 'Beli kopi 25.000 kemarin, kategori makanan'"
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows={3}
        style={{
          width: "100%",
          padding: 14,
          borderRadius: 16,
          border: "1px solid #e4e6ed",
          resize: "vertical",
          minHeight: 120,
          fontSize: "0.95rem",
        }}
      />
      <div style={{ marginTop: 12, display: "flex", justifyContent: "flex-end" }}>
        <button className="button-secondary" type="submit">
          Parse
        </button>
      </div>
    </form>
  );
}

export default ChatInput;
