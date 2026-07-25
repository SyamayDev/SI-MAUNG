function ChatMessage({ role = "user", text = "" }) {
  return (
    <div style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 13, color: "#6d6c7a" }}>{role}</div>
        <div style={{ marginTop: 6 }}>{text}</div>
      </div>
    </div>
  );
}

export default ChatMessage;
