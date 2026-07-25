import ChatMessage from "./ChatMessage";

function AIChat({ parsedTx, onClear }) {
  return (
    <div style={{ marginTop: 8 }}>
      <div style={{ marginBottom: 12 }}>
        <h3>Riwayat Chat</h3>
      </div>

      {parsedTx ? (
        <div
          style={{
            background: "#fff",
            padding: 12,
            borderRadius: 12,
            border: "1px solid #eee",
          }}
        >
          <ChatMessage
            role="assistant"
            text={`Parsed: ${parsedTx.description} — Rp${parsedTx.amount}`}
          />
          <div style={{ marginTop: 8 }}>
            <button className="button-secondary" onClick={onClear}>
              Clear
            </button>
          </div>
        </div>
      ) : (
        <div className="empty-state">
          <p>Belum ada interaksi AI. Ketik atau rekam suara untuk mencoba.</p>
        </div>
      )}
    </div>
  );
}

export default AIChat;
